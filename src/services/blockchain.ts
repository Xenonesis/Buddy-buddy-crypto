import { ethers } from 'ethers';

interface BlockchainData {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  gasLimit: string;
  baseFeePerGas?: string;
  priorityFeePerGas?: string;
  networkName: string;
  isHealthy: boolean;
  lastBlockTime: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  balance?: string;
}

class BlockchainService {
  private static instance: BlockchainService;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  // Network configurations
  private readonly networks = {
    1: {
      name: 'Ethereum Mainnet',
      rpc: 'https://eth.llamarpc.com',
      explorer: 'https://etherscan.io'
    },
    137: {
      name: 'Polygon Mainnet', 
      rpc: import.meta.env.VITE_PUBLIC_RPC_URL || 'https://polygon-rpc.com',
      explorer: 'https://polygonscan.com'
    },
    8453: {
      name: 'Base Mainnet',
      rpc: 'https://mainnet.base.org',
      explorer: 'https://basescan.org'
    },
    59144: {
      name: 'Linea Mainnet',
      rpc: 'https://rpc.linea.build',
      explorer: 'https://lineascan.build'
    }
  };

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // Initialize providers for supported networks
  async initialize(): Promise<void> {
    try {
      // Initialize providers for each network
      for (const [chainId, config] of Object.entries(this.networks)) {
        try {
          const provider = new ethers.JsonRpcProvider(config.rpc);
          await provider.getNetwork(); // Test connection
          this.providers.set(parseInt(chainId), provider);
          console.log(`Connected to ${config.name} (Chain ID: ${chainId})`);
        } catch (error) {
          console.warn(`Failed to connect to ${config.name}:`, error);
        }
      }

      // Start polling for network updates
      this.startNetworkPolling();
      
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  // Get real-time blockchain data for a specific network
  async getBlockchainData(chainId: number = 137): Promise<BlockchainData | null> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      return null;
    }

    try {
      const [block, feeData, network] = await Promise.all([
        provider.getBlock('latest'),
        provider.getFeeData(),
        provider.getNetwork()
      ]);

      if (!block) {
        throw new Error('Failed to get latest block');
      }

      const networkConfig = this.networks[chainId as keyof typeof this.networks];
      const gasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0';
      
      return {
        chainId: Number(network.chainId),
        blockNumber: block.number,
        gasPrice: parseFloat(gasPrice).toFixed(2),
        gasLimit: block.gasLimit.toString(),
        baseFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : undefined,
        priorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : undefined,
        networkName: networkConfig?.name || `Chain ${chainId}`,
        isHealthy: true,
        lastBlockTime: block.timestamp * 1000
      };
    } catch (error) {
      console.error(`Failed to get blockchain data for chain ${chainId}:`, error);
      return {
        chainId,
        blockNumber: 0,
        gasPrice: '0',
        gasLimit: '0',
        networkName: this.networks[chainId as keyof typeof this.networks]?.name || `Chain ${chainId}`,
        isHealthy: false,
        lastBlockTime: 0
      };
    }
  }

  // Parse token information from ClearNode asset data
  parseTokensFromClearNode(assetData: { assets?: unknown[] }): TokenInfo[] {
    if (!assetData?.assets || !Array.isArray(assetData.assets)) {
      return [];
    }

    return assetData.assets.map((asset: { token?: string; symbol?: string; decimals?: number; chain_id?: number }) => ({
      address: asset.token || '',
      symbol: asset.symbol || 'Unknown',
      decimals: asset.decimals || 18,
      chainId: asset.chain_id || 1
    }));
  }

  // Get token balance for an address
  async getTokenBalance(tokenAddress: string, walletAddress: string, chainId: number): Promise<string> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      return '0';
    }

    try {
      if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // Native token (ETH, MATIC, etc.)
        const balance = await provider.getBalance(walletAddress);
        return ethers.formatEther(balance);
      } else {
        // ERC-20 token
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          provider
        );
        
        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(walletAddress),
          tokenContract.decimals()
        ]);
        
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error(`Failed to get token balance:`, error);
      return '0';
    }
  }

  // Start polling for network updates
  private startNetworkPolling(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Poll every 10 seconds for network updates
    this.updateInterval = setInterval(async () => {
      for (const chainId of this.providers.keys()) {
        try {
          const data = await this.getBlockchainData(chainId);
          if (data) {
            this.notifyListeners('network_update', {
              chainId,
              ...data
            });
          }
        } catch (error) {
          console.error(`Failed to update network data for chain ${chainId}:`, error);
        }
      }
    }, 10000);
  }

  // Subscribe to blockchain data updates
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback);
    };
  }

  // Notify listeners of data updates
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

  // Get all supported networks
  getSupportedNetworks(): Array<{chainId: number, name: string, explorer: string}> {
    return Object.entries(this.networks).map(([chainId, config]) => ({
      chainId: parseInt(chainId),
      name: config.name,
      explorer: config.explorer
    }));
  }

  // Check if network is supported
  isNetworkSupported(chainId: number): boolean {
    return this.providers.has(chainId);
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.providers.clear();
    this.listeners.clear();
  }
}

export default BlockchainService;