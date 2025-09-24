import { ethers } from 'ethers';
import { Transaction, GaslessTransaction, NetworkConfig } from '../types';
import WalletService from './wallet';
import EncryptionService from '../utils/encryption';

class NitroLiteService {
  private static instance: NitroLiteService;
  private walletService: WalletService;
  private encryptionService: EncryptionService;
  
  // NitroLite protocol addresses from environment variables
  private readonly NITROLITE_RELAYER = import.meta.env.VITE_NITROLITE_RELAYER_ADDRESS || '';
  private readonly NITROLITE_FORWARDER = import.meta.env.VITE_NITROLITE_FORWARDER_ADDRESS || '';

  static getInstance(): NitroLiteService {
    if (!NitroLiteService.instance) {
      NitroLiteService.instance = new NitroLiteService();
    }
    return NitroLiteService.instance;
  }

  constructor() {
    this.walletService = WalletService.getInstance();
    this.encryptionService = EncryptionService.getInstance();
    
    // Validate that contract addresses are configured
    if (!this.NITROLITE_RELAYER || !this.NITROLITE_FORWARDER) {
      console.warn('NitroLite contract addresses not configured. Gasless transactions may not work properly.');
    }
  }

  // Execute gasless transaction using NitroLite protocol
  async executeGaslessTransfer(
    to: string,
    amount: string,
    tokenAddress?: string
  ): Promise<Transaction> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      // Create transaction data
      const txData = await this.prepareGaslessTransaction(to, amount, tokenAddress);
      
      // Sign the transaction for meta-transaction
      const signature = await this.signMetaTransaction(txData);
      
      // Submit to NitroLite relayer
      const relayerResponse = await this.submitToRelayer({
        ...txData,
        signature
      });

      // Create transaction record
      const transaction: Transaction = {
        id: this.generateTransactionId(),
        hash: relayerResponse.hash,
        from: connection.address,
        to,
        amount,
        token: tokenAddress || 'ETH',
        timestamp: Date.now(),
        status: 'pending',
        isGasless: true,
        network: this.getNetworkName(connection.chainId)
      };

      return transaction;
    } catch (error) {
      console.error('Gasless transaction failed:', error);
      throw error;
    }
  }

  // Prepare gasless transaction data
  private async prepareGaslessTransaction(
    to: string,
    amount: string,
    tokenAddress?: string
  ): Promise<GaslessTransaction> {
    const connection = this.walletService.getConnection();
    if (!connection) throw new Error('No wallet connection');

    const nonce = await this.getNonce(connection.address);
    
    return {
      to,
      amount,
      token: tokenAddress || '0x0000000000000000000000000000000000000000', // ETH
      nonce,
      signature: '' // Will be filled after signing
    };
  }

  // Sign meta-transaction for gasless execution
  private async signMetaTransaction(txData: GaslessTransaction): Promise<string> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) {
      throw new Error('No wallet connection');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Create EIP-712 typed data for meta-transaction
    const domain = {
      name: 'NitroLite',
      version: '1',
      chainId: connection.chainId,
      verifyingContract: this.NITROLITE_FORWARDER
    };

    const types = {
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' }
      ]
    };

    const value = {
      from: connection.address,
      to: txData.to,
      value: ethers.parseEther(txData.amount),
      gas: 21000,
      nonce: txData.nonce,
      data: '0x'
    };

    return await signer.signTypedData(domain, types, value);
  }

  // Submit to NitroLite relayer
  private async submitToRelayer(gaslessTransaction: GaslessTransaction): Promise<{ hash: string }> {
    const relayerUrl = import.meta.env.VITE_NITROLITE_RELAYER_URL || import.meta.env.VITE_NITROLITE_RELAYER_URL_FALLBACK || 'https://gasless-relay.polygon.technology';
    
    try {
      const response = await fetch(`${relayerUrl}/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gaslessTransaction)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Relayer submission failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.hash) {
        throw new Error('Invalid relayer response: missing transaction hash');
      }

      return result;
    } catch (error) {
      // If relayer is not available, throw meaningful error instead of generating fake hash
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('NitroLite relayer service is currently unavailable. Please try again later.');
      }
      throw error;
    }
  }

  // Get nonce for meta-transaction
  private async getNonce(address: string): Promise<number> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) {
      throw new Error('No wallet connection');
    }

    if (!this.NITROLITE_FORWARDER) {
      throw new Error('NitroLite forwarder address not configured');
    }

    try {
      // Query the actual forwarder contract for the current nonce
      const forwarderAbi = [
        "function getNonce(address from) external view returns (uint256)"
      ];
      
      const forwarderContract = new ethers.Contract(
        this.NITROLITE_FORWARDER,
        forwarderAbi,
        connection.provider
      );

      const nonce = await forwarderContract.getNonce(address);
      return Number(nonce);
    } catch (error) {
      console.error('Error fetching nonce from forwarder contract:', error);
      // Fallback to transaction count as nonce
      return await connection.provider.getTransactionCount(address);
    }
  }

  // Monitor transaction status
  async monitorTransaction(hash: string): Promise<Transaction['status']> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) {
      throw new Error('No wallet connection');
    }

    try {
      const receipt = await connection.provider.getTransactionReceipt(hash);
      if (!receipt) {
        return 'pending';
      }
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      console.error('Transaction monitoring failed:', error);
      return 'failed';
    }
  }

  // Estimate gasless transaction fee
  async estimateGaslessTransactionFee(
    to: string,
    amount: string,
    tokenAddress?: string
  ): Promise<string> {
    const relayerUrl = import.meta.env.VITE_NITROLITE_RELAYER_URL || import.meta.env.VITE_NITROLITE_RELAYER_URL_FALLBACK || 'https://gasless-relay.polygon.technology';
    
    try {
      const response = await fetch(`${relayerUrl}/estimate-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          amount,
          tokenAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to estimate gasless transaction fee');
      }

      const result = await response.json();
      return result.fee || '0';
    } catch (error) {
      console.error('Error estimating gasless transaction fee:', error);
      
      // Fallback: calculate a conservative estimate based on current gas prices
      const connection = this.walletService.getConnection();
      if (connection && connection.provider) {
        try {
          const feeData = await connection.provider.getFeeData();
          const baseGasCost = 21000;
          const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
          const regularFee = BigInt(baseGasCost) * gasPrice;
          const relayerFee = regularFee / BigInt(20); // 5% of regular gas cost
          
          return ethers.formatEther(relayerFee);
        } catch (gasError) {
          console.error('Error getting gas price:', gasError);
        }
      }
      
      return '0';
    }
  }

  // Check if gasless transactions are available for current network
  isGaslessAvailable(): boolean {
    const connection = this.walletService.getConnection();
    if (!connection) return false;

    // Check if contract addresses are configured
    if (!this.NITROLITE_RELAYER || !this.NITROLITE_FORWARDER) {
      return false;
    }

    const networks = this.walletService.getSupportedNetworks();
    const currentNetwork = networks.find(n => n.chainId === connection.chainId);
    
    return currentNetwork?.gaslessSupported || false;
  }

  // Helper methods
  private generateTransactionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getNetworkName(chainId: number): string {
    const networks = this.walletService.getSupportedNetworks();
    const network = networks.find(n => n.chainId === chainId);
    return network?.name || 'Unknown Network';
  }

  // Get NitroLite protocol statistics
  async getProtocolStats(): Promise<{
    totalGaslessTx: number;
    totalGasSaved: string;
    activeRelayers: number;
    avgProcessingTime: number;
  }> {
    const relayerUrl = import.meta.env.VITE_NITROLITE_RELAYER_URL || import.meta.env.VITE_NITROLITE_RELAYER_URL_FALLBACK || 'https://gasless-relay.polygon.technology';
    
    try {
      const response = await fetch(`${relayerUrl}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch protocol statistics');
      }
      
      const stats = await response.json();
      
      return {
        totalGaslessTx: stats.totalGaslessTx || 0,
        totalGasSaved: stats.totalGasSaved || '0 ETH',
        activeRelayers: stats.activeRelayers || 0,
        avgProcessingTime: stats.avgProcessingTime || 0
      };
    } catch (error) {
      console.error('Error fetching protocol stats:', error);
      // Return zero stats instead of fake data when service is unavailable
      return {
        totalGaslessTx: 0,
        totalGasSaved: '0 ETH',
        activeRelayers: 0,
        avgProcessingTime: 0
      };
    }
  }
}

export default NitroLiteService;