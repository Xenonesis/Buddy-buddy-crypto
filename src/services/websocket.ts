import { 
  WebSocketConnection, 
  WebSocketMessage, 
  WebSocketMessageType, 
  WebSocketStatus,
  Subscription,
  SubscriptionFilter,
  TransactionUpdatePayload,
  BalanceUpdatePayload,
  NetworkStatusPayload,
  GasPriceUpdatePayload,
  ProtocolStatsPayload
} from '../types';

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnection | null = null;
  private status: WebSocketStatus = 'disconnected';
  private subscriptions = new Map<string, Subscription>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private maxReconnectAttempts = 10;
  private listeners = new Map<string, Set<(status: WebSocketStatus) => void>>();

  // Configuration from environment - ClearNode endpoints
  private readonly wsUrl = import.meta.env.VITE_NITROLITE_WS_URL || 'wss://clearnet.yellow.com/ws';
  private readonly apiUrl = import.meta.env.VITE_NITROLITE_API_URL || 'https://clearnet.yellow.com';

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Connect to WebSocket
  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.status = 'connecting';
    this.notifyStatusListeners();

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.setupEventHandlers();

      // Wait for connection to open or fail
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.onConnected();
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    } catch (error) {
      this.status = 'error';
      this.notifyStatusListeners();
      throw error;
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.status = 'disconnected';
    this.connectionState = null;
    this.notifyStatusListeners();
  }

  // Get current connection status
  getStatus(): WebSocketStatus {
    return this.status;
  }

  // Get connection state
  getConnectionState(): WebSocketConnection | null {
    return this.connectionState;
  }

  // Subscribe to specific message types
  subscribe<T = unknown>(
    type: WebSocketMessageType,
    callback: (payload: T) => void,
    filter?: SubscriptionFilter
  ): string {
    const id = this.generateSubscriptionId();
    const subscription: Subscription<T> = {
      id,
      type,
      callback,
      filter
    };

    this.subscriptions.set(id, subscription as Subscription);

    // Send subscription message to server if connected
    if (this.isConnected()) {
      this.sendMessage({
        type: 'subscription',
        payload: { action: 'subscribe', messageType: type, filter },
        timestamp: Date.now(),
        id
      });
    }

    return id;
  }

  // Unsubscribe from message type
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);

      // Send unsubscription message to server if connected
      if (this.isConnected()) {
        this.sendMessage({
          type: 'unsubscription',
          payload: { subscriptionId },
          timestamp: Date.now()
        });
      }
    }
  }

  // Subscribe to connection status changes
  onStatusChange(callback: (status: WebSocketStatus) => void): () => void {
    if (!this.listeners.has('status')) {
      this.listeners.set('status', new Set());
    }
    
    this.listeners.get('status')!.add(callback);

    // Return unsubscribe function
    return () => {
      const statusListeners = this.listeners.get('status');
      if (statusListeners) {
        statusListeners.delete(callback);
      }
    };
  }

  // Send message to server
  private sendMessage<T>(message: WebSocketMessage<T>): void {
    if (!this.isConnected() || !this.ws) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.onConnected();
    };

    this.ws.onclose = (event) => {
      this.onDisconnected(event);
    };

    this.ws.onerror = (error) => {
      this.onError(error);
    };

    this.ws.onmessage = (event) => {
      this.onMessage(event);
    };
  }

  // Handle connection established
  private onConnected(): void {
    this.status = 'connected';
    this.connectionState = {
      isConnected: true,
      lastHeartbeat: Date.now(),
      reconnectCount: 0,
      url: this.wsUrl
    };

    this.reconnectDelay = 1000; // Reset reconnect delay
    this.startHeartbeat();
    this.notifyStatusListeners();
    
    console.log('WebSocket connected to ClearNode:', this.wsUrl);

    // ClearNode doesn't require initial handshake, it sends data immediately
    // Just log the successful connection
    console.log('Ready to receive ClearNode data streams');

    // Re-subscribe to existing subscriptions
    this.resubscribeAll();
  }

  // Handle connection lost
  private onDisconnected(event: CloseEvent): void {
    this.status = 'disconnected';
    this.connectionState = null;
    this.clearTimers();
    this.notifyStatusListeners();

    console.log('WebSocket disconnected:', event.code, event.reason);

    // Attempt reconnection unless it was a manual disconnect
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  // Handle WebSocket error
  private onError(error: Event): void {
    console.error('WebSocket error:', error);
    this.status = 'error';
    this.notifyStatusListeners();
  }

  // Handle incoming messages from ClearNode
  private onMessage(event: MessageEvent): void {
    try {
      const rawData = JSON.parse(event.data);
      console.log('ClearNode message received:', rawData);
      
      // ClearNode sends different message formats
      this.handleClearNodeMessage(rawData);
    } catch (error) {
      console.error('Error parsing ClearNode message:', error, event.data);
    }
  }

  // Process incoming ClearNode messages and route to subscribers
  private handleClearNodeMessage(rawData: unknown): void {
    // Update last heartbeat time
    if (this.connectionState) {
      this.connectionState.lastHeartbeat = Date.now();
    }

    // Parse ClearNode message format: {"res":[0,"assets",{...}],"sig":[...]}
    const data = rawData as { res?: unknown[]; sig?: string[] };
    if (data.res && Array.isArray(data.res)) {
      const [id, messageType, messageData] = data.res;
      
      // Convert to our internal message format
      const message: WebSocketMessage = {
        type: messageType as WebSocketMessageType,
        payload: messageData,
        timestamp: Date.now(),
        id: typeof id === 'number' ? id.toString() : String(id || '')
      };

      this.routeMessage(message);
    }
  }

  // Route messages to subscribers
  private routeMessage(message: WebSocketMessage): void {
    // Route message to subscribers
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === message.type) {
        // Apply filter if present
        if (subscription.filter && !this.matchesFilter(message.payload, subscription.filter)) {
          return;
        }

        try {
          subscription.callback(message.payload);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });
  }

  // Check if payload matches subscription filter
  private matchesFilter(payload: unknown, filter: SubscriptionFilter): boolean {
    if (!payload || typeof payload !== 'object') {
      return true;
    }

    const payloadObj = payload as Record<string, unknown>;

    if (filter.address && payloadObj.address !== filter.address) {
      return false;
    }

    if (filter.chainId && payloadObj.chainId !== filter.chainId) {
      return false;
    }

    if (filter.token && payloadObj.token !== filter.token) {
      return false;
    }

    if (filter.hash && payloadObj.hash !== filter.hash) {
      return false;
    }

    return true;
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (!this.connectionState || this.connectionState.reconnectCount >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.status = 'error';
      this.notifyStatusListeners();
      return;
    }

    this.status = 'reconnecting';
    this.notifyStatusListeners();

    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect... (attempt ${(this.connectionState?.reconnectCount || 0) + 1})`);
      
      if (this.connectionState) {
        this.connectionState.reconnectCount++;
      }

      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        this.scheduleReconnect();
      });
    }, this.reconnectDelay);
  }

  // Start heartbeat timer
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
          timestamp: Date.now()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  // Clear all timers
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Re-subscribe to all existing subscriptions
  private resubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      this.sendMessage({
        type: 'subscription',
        payload: { 
          action: 'subscribe', 
          messageType: subscription.type, 
          filter: subscription.filter 
        },
        timestamp: Date.now(),
        id: subscription.id
      });
    });
  }

  // Notify status listeners
  private notifyStatusListeners(): void {
    const statusListeners = this.listeners.get('status');
    if (statusListeners) {
      statusListeners.forEach((callback) => {
        try {
          callback(this.status);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  // Check if WebSocket is connected
  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Generate unique subscription ID
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Request transaction updates for specific hash
  requestTransactionUpdates(hash: string): string {
    return this.subscribe<TransactionUpdatePayload>(
      'transaction_update',
      (payload) => {
        console.log('Transaction update:', payload);
      },
      { hash }
    );
  }

  // Request balance updates for specific address
  requestBalanceUpdates(address: string): string {
    return this.subscribe<BalanceUpdatePayload>(
      'balance_update',
      (payload) => {
        console.log('Balance update:', payload);
      },
      { address }
    );
  }

  // Request network status updates
  requestNetworkStatus(chainId?: number): string {
    return this.subscribe<NetworkStatusPayload>(
      'network_status',
      (payload) => {
        console.log('Network status:', payload);
      },
      chainId ? { chainId } : undefined
    );
  }

  // Request gas price updates
  requestGasPriceUpdates(chainId?: number): string {
    return this.subscribe<GasPriceUpdatePayload>(
      'gas_price_update',
      (payload) => {
        console.log('Gas price update:', payload);
      },
      chainId ? { chainId } : undefined
    );
  }

  // Request protocol statistics
  requestProtocolStats(): string {
    return this.subscribe<ProtocolStatsPayload>(
      'protocol_stats',
      (payload) => {
        console.log('Protocol stats:', payload);
      }
    );
  }

  // Get API URL for REST requests
  getApiUrl(): string {
    return this.apiUrl;
  }
}

export default WebSocketService;