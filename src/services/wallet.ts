import { ethers } from 'ethers';
import { WalletConnection, NetworkConfig, WalletProvider } from '../types';
import WebSocketService from './websocket';

class WalletService {
  private static instance: WalletService;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private connection: WalletConnection | null = null;
  private readonly wsService: WebSocketService;
  private balanceSubscriptionId: string | null = null;
  private connectionStatusCallbacks: ((status: 'connected' | 'disconnected' | 'connecting' | 'error', message?: string) => void)[] = [];

  // Supported networks - using public RPC endpoints
  private readonly networks: Record<number, NetworkConfig> = {
    1: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://eth.llamarpc.com',
      explorerUrl: 'https://etherscan.io',
      isTestnet: false,
      gaslessSupported: true
    },
    11155111: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://ethereum-sepolia.publicnode.com',
      explorerUrl: 'https://sepolia.etherscan.io',
      isTestnet: true,
      gaslessSupported: true
    },
    137: {
      chainId: 137,
      name: import.meta.env.VITE_NETWORK_NAME || 'Polygon Mainnet',
      rpcUrl: import.meta.env.VITE_PUBLIC_RPC_URL || 'https://polygon-rpc.com',
      explorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://polygonscan.com',
      isTestnet: false,
      gaslessSupported: true
    }
  };

  constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  // Connect to MetaMask
  async connectMetaMask(silent: boolean = false): Promise<WalletConnection> {
    if (!window.ethereum) {
      const message = 'MetaMask not found. Please install MetaMask extension.';
      this.notifyStatusChange('error', message);
      throw new Error(message);
    }

    try {
      if (!silent) {
        this.notifyStatusChange('connecting', 'Connecting to MetaMask...');
      }

      // For silent connection, check if already connected
      let accounts: string[] = [];
      if (silent) {
        accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length === 0) {
          this.notifyStatusChange('disconnected', 'MetaMask not connected');
          throw new Error('No accounts found. Please connect MetaMask manually.');
        }
      } else {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(address);

      this.connection = {
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        provider: this.provider,
        isConnected: true
      };

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      // Initialize WebSocket connection and subscribe to balance updates
      this.initializeWebSocketConnection();

      const networkName = this.networks[Number(network.chainId)]?.name || `Chain ${network.chainId}`;
      this.notifyStatusChange('connected', `Connected to MetaMask on ${networkName}`);

      return this.connection;
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      
      const errorObj = error as { code?: number | string; message?: string };
      
      // Handle user rejection of connection
      if (errorObj?.code === 4001 || 
          errorObj?.message?.includes('User rejected') ||
          errorObj?.message?.includes('user rejected')) {
        const message = 'Connection cancelled - You rejected the connection request in MetaMask';
        this.notifyStatusChange('error', message);
        throw new Error(message);
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : 'Failed to connect to MetaMask';
      this.notifyStatusChange('error', message);
      throw error;
    }
  }

  // Connect via WalletConnect
  async connectWalletConnect(): Promise<WalletConnection> {
    // This would integrate with WalletConnect v2
    // Implementation depends on specific WalletConnect setup
    throw new Error('WalletConnect integration not implemented yet');
  }

  // Switch to specific network
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider || !window.ethereum) {
      throw new Error('No wallet connection found');
    }

    const network = this.networks[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        await this.addNetwork(network);
      } else {
        throw switchError;
      }
    }
  }

  // Add network to MetaMask
  private async addNetwork(network: NetworkConfig): Promise<void> {
    if (!window.ethereum) return;

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
        nativeCurrency: {
          name: network.chainId === 137 ? 'MATIC' : 'ETH',
          symbol: network.chainId === 137 ? 'MATIC' : 'ETH',
          decimals: 18
        }
      }],
    });
  }

  // Get current connection
  getConnection(): WalletConnection | null {
    return this.connection;
  }

  // Refresh wallet balance
  async refreshBalance(): Promise<void> {
    if (!this.connection || !this.provider) {
      return;
    }

    try {
      const balance = await this.provider.getBalance(this.connection.address);
      const formattedBalance = ethers.formatEther(balance);
      
      this.connection.balance = formattedBalance;
      
      // Notify status change with updated balance
      this.notifyStatusChange('connected', `Balance updated: ${formattedBalance} ETH`);
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
    }
  }

  // Disconnect wallet
  disconnect(): void {
    // Clean up WebSocket subscriptions
    this.cleanupWebSocketSubscriptions();
    
    this.provider = null;
    this.signer = null;
    this.connection = null;
    
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }

    this.notifyStatusChange('disconnected', 'Wallet disconnected');
  }

  // Check if MetaMask is connected without prompting user
  async checkConnection(): Promise<boolean> {
    if (!window.ethereum) {
      return false;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      return false;
    }
  }

  // Attempt to reconnect automatically
  async autoReconnect(): Promise<WalletConnection | null> {
    try {
      const isConnected = await this.checkConnection();
      
      if (isConnected) {
        const connection = await this.connectMetaMask(true);
        return connection;
      }
      return null;
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
      return null;
    }
  }

  // Add status change listener
  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'connecting' | 'error', message?: string) => void): () => void {
    this.connectionStatusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionStatusCallbacks.splice(index, 1);
      }
    };
  }

  // Notify status change
  private notifyStatusChange(status: 'connected' | 'disconnected' | 'connecting' | 'error', message?: string): void {
    this.connectionStatusCallbacks.forEach(callback => {
      try {
        callback(status, message);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  // Get supported networks
  getSupportedNetworks(): NetworkConfig[] {
    return Object.values(this.networks);
  }

  // Event handlers
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnect();
    } else if (this.connection) {
      // Update connection address
      this.connection.address = accounts[0];
      
      // Update WebSocket subscriptions for new address
      this.cleanupWebSocketSubscriptions();
      this.initializeWebSocketConnection();
    }
  }

  private handleChainChanged(chainId: string): void {
    const numericChainId = parseInt(chainId, 16);
    if (this.connection) {
      this.connection.chainId = numericChainId;
    }
  }

  // Initialize WebSocket connection and subscriptions
  private async initializeWebSocketConnection(): Promise<void> {
    try {
      // Connect to WebSocket if not already connected
      if (this.wsService.getStatus() === 'disconnected') {
        await this.wsService.connect();
      }

      // Subscribe to balance updates for the connected address
      if (this.connection) {
        this.balanceSubscriptionId = this.wsService.subscribe(
          'balance_update',
          (payload: { address: string; balance: string; token?: string }) => {
            if (this.connection && payload.address === this.connection.address && !payload.token) {
              this.connection.balance = payload.balance;
              console.log('Balance updated via WebSocket:', payload.balance);
            }
          },
          { address: this.connection.address }
        );
      }
    } catch (error) {
      console.warn('Failed to initialize WebSocket connection:', error);
    }
  }

  // Clean up WebSocket subscriptions
  private cleanupWebSocketSubscriptions(): void {
    if (this.balanceSubscriptionId) {
      this.wsService.unsubscribe(this.balanceSubscriptionId);
      this.balanceSubscriptionId = null;
    }
  }

  // Get available wallet providers
  getAvailableProviders(): WalletProvider[] {
    const providers: WalletProvider[] = [
      {
        name: 'MetaMask',
        icon: '🦊',
        connector: this.connectMetaMask.bind(this),
        isInstalled: !!window.ethereum
      },
      {
        name: 'WalletConnect',
        icon: '🔗',
        connector: this.connectWalletConnect.bind(this),
        isInstalled: true
      }
    ];

    return providers;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

export default WalletService;