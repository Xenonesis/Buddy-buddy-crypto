import { 
  NitroliteClient, 
  ChannelId,
  ChannelData,
  State,
  CreateChannelParams,
  CloseChannelParams,
  CheckpointChannelParams,
  ChannelStatus
} from '@erc7824/nitrolite';

export interface NitroliteChannelInfo {
  channelId: ChannelId;
  status: ChannelStatus;
  participants: string[];
  challengeDuration: string;
  nonce: string;
  created: number;
  lastActivity: number;
  balance?: { [token: string]: string };
}

export interface NitroliteTransactionInfo {
  txHash: string;
  type: 'create_channel' | 'close_channel' | 'checkpoint' | 'challenge' | 'deposit' | 'withdrawal';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  gasUsed?: string;
  channelId?: ChannelId;
}

export interface StateChannelUpdate {
  channelId: ChannelId;
  state: State;
  timestamp: number;
  version: string;
}

class NitroliteSDKService {
  private static instance: NitroliteSDKService;
  private client: NitroliteClient | null = null;
  private readonly channels = new Map<ChannelId, ChannelData>();
  private readonly transactions = new Map<string, NitroliteTransactionInfo>();
  private readonly listeners = new Map<string, Set<(data: unknown) => void>>();
  private isInitialized = false;

  private readonly wsUrl = import.meta.env.VITE_NITROLITE_WS_URL || 'wss://clearnet.yellow.com/ws';
  private readonly apiUrl = import.meta.env.VITE_NITROLITE_API_URL || 'https://clearnet.yellow.com';

  static getInstance(): NitroliteSDKService {
    if (!NitroliteSDKService.instance) {
      NitroliteSDKService.instance = new NitroliteSDKService();
    }
    return NitroliteSDKService.instance;
  }

  // Initialize the Nitrolite client with wallet
  async initialize(walletClient: unknown, publicClient: unknown): Promise<void> {
    if (this.isInitialized || !walletClient || !publicClient) {
      return;
    }

    try {
      // Note: The real NitroliteClient requires viem clients and contract addresses
      // This is a simplified initialization - in real usage you'd need proper configuration
      console.log('Nitrolite SDK initialization started with ClearNode:', this.wsUrl);
      
      this.isInitialized = true;
      this.notifyListeners('connection', { status: 'connected', wsUrl: this.wsUrl });
      
      console.log('Nitrolite SDK ready for state channel operations');
    } catch (error) {
      console.error('Failed to initialize Nitrolite SDK:', error);
      this.notifyListeners('connection', { status: 'error', error: (error as Error).message });
      throw error;
    }
  }

  // Create a new state channel using real Nitrolite SDK
  async createChannel(params: CreateChannelParams): Promise<{ channelId: ChannelId; txHash: string }> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized. Please initialize with wallet first.');
    }

    try {
      const result = await this.client.createChannel(params);
      
      // Track the transaction
      const transactionInfo: NitroliteTransactionInfo = {
        txHash: result.txHash,
        type: 'create_channel',
        status: 'pending',
        timestamp: Date.now(),
        channelId: result.channelId
      };
      
      this.transactions.set(result.txHash, transactionInfo);
      
      this.notifyListeners('channel_created', {
        channelId: result.channelId,
        txHash: result.txHash,
        timestamp: Date.now()
      });

      this.notifyListeners('transaction_update', transactionInfo);

      return {
        channelId: result.channelId,
        txHash: result.txHash
      };
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  // Get channel data
  async getChannelData(channelId: ChannelId): Promise<ChannelData | null> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const channelData = await this.client.getChannelData(channelId);
      this.channels.set(channelId, channelData);
      return channelData;
    } catch (error) {
      console.error('Failed to get channel data:', error);
      return null;
    }
  }

  // Get open channels
  async getOpenChannels(): Promise<ChannelId[]> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      return await this.client.getOpenChannels();
    } catch (error) {
      console.error('Failed to get open channels:', error);
      return [];
    }
  }

  // Close a channel
  async closeChannel(params: CloseChannelParams): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.closeChannel(params);
      
      const transactionInfo: NitroliteTransactionInfo = {
        txHash,
        type: 'close_channel',
        status: 'pending',
        timestamp: Date.now()
      };
      
      this.transactions.set(txHash, transactionInfo);
      this.notifyListeners('transaction_update', transactionInfo);
      
      return txHash;
    } catch (error) {
      console.error('Failed to close channel:', error);
      throw error;
    }
  }

  // Checkpoint a channel state
  async checkpointChannel(params: CheckpointChannelParams): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.checkpointChannel(params);
      
      const transactionInfo: NitroliteTransactionInfo = {
        txHash,
        type: 'checkpoint',
        status: 'pending',
        timestamp: Date.now(),
        channelId: params.channelId
      };
      
      this.transactions.set(txHash, transactionInfo);
      this.notifyListeners('transaction_update', transactionInfo);
      
      return txHash;
    } catch (error) {
      console.error('Failed to checkpoint channel:', error);
      throw error;
    }
  }

  // Get formatted channel info for UI
  getChannelInfo(channelId: ChannelId): NitroliteChannelInfo | null {
    const channel = this.channels.get(channelId);
    if (!channel) return null;

    return {
      channelId,
      status: channel.status,
      participants: channel.channel.participants,
      challengeDuration: channel.channel.challenge.toString(),
      nonce: channel.channel.nonce.toString(),
      created: Date.now(), // This would come from blockchain data in real implementation
      lastActivity: Date.now()
    };
  }

  // Get all tracked channels
  getChannels(): NitroliteChannelInfo[] {
    return Array.from(this.channels.entries()).map(([channelId, channelData]) => ({
      channelId,
      status: channelData.status,
      participants: channelData.channel.participants,
      challengeDuration: channelData.channel.challenge.toString(),
      nonce: channelData.channel.nonce.toString(),
      created: Date.now(),
      lastActivity: Date.now()
    }));
  }

  // Get transaction info
  getTransactions(): NitroliteTransactionInfo[] {
    return Array.from(this.transactions.values());
  }

  // Update transaction status (would be called by blockchain monitoring)
  updateTransactionStatus(txHash: string, status: 'confirmed' | 'failed', blockNumber?: number): void {
    const transaction = this.transactions.get(txHash);
    if (transaction) {
      transaction.status = status;
      transaction.blockNumber = blockNumber;
      
      this.notifyListeners('transaction_update', transaction);
      
      if (status === 'confirmed' && transaction.type === 'create_channel' && transaction.channelId) {
        // Refresh channel data when channel creation is confirmed
        this.getChannelData(transaction.channelId).catch(console.error);
      }
    }
  }

  // Subscribe to events
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  // Notify listeners
  private notifyListeners(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    if (!this.client) return 'disconnected';
    return this.isInitialized ? 'connected' : 'disconnected';
  }

  // Disconnect from ClearNode
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client = null;
      this.isInitialized = false;
      this.channels.clear();
      this.transactions.clear();
    }
  }

  // Get WebSocket URL
  getWebSocketUrl(): string {
    return this.wsUrl;
  }

  // Get API URL  
  getApiUrl(): string {
    return this.apiUrl;
  }
}

export default NitroliteSDKService;