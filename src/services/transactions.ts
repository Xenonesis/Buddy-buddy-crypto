import { ethers } from 'ethers';
import { Transaction } from '../types';
import WalletService from './wallet';
import EncryptionService from '../utils/encryption';

class TransactionService {
  private static instance: TransactionService;
  private walletService: WalletService;
  private encryptionService: EncryptionService;
  private transactions: Transaction[] = [];
  private monitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  constructor() {
    this.walletService = WalletService.getInstance();
    this.encryptionService = EncryptionService.getInstance();
    this.loadStoredTransactions();
  }

  // Start real-time transaction monitoring
  startMonitoring(): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.checkPendingTransactions();
      await this.scanForNewTransactions();
    }, 5000); // Check every 5 seconds

    console.log('Transaction monitoring started');
  }

  // Stop transaction monitoring
  stopMonitoring(): void {
    if (!this.monitoring) return;

    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Transaction monitoring stopped');
  }

  // Add transaction to monitoring
  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
    this.saveTransactions();
  }

  // Get all transactions
  getTransactions(): Transaction[] {
    return this.transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get transactions by status
  getTransactionsByStatus(status: Transaction['status']): Transaction[] {
    return this.transactions.filter(tx => tx.status === status);
  }

  // Get transaction by ID
  getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(tx => tx.id === id);
  }

  // Check pending transactions for status updates
  private async checkPendingTransactions(): Promise<void> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) return;

    const pendingTxs = this.getTransactionsByStatus('pending');
    
    for (const tx of pendingTxs) {
      if (!tx.hash) continue;

      try {
        const receipt = await connection.provider.getTransactionReceipt(tx.hash);
        if (receipt) {
          tx.status = receipt.status === 1 ? 'confirmed' : 'failed';
          tx.gasUsed = receipt.gasUsed.toString();
          this.saveTransactions();
        }
      } catch (error) {
        console.error(`Error checking transaction ${tx.hash}:`, error);
      }
    }
  }

  // Scan for new transactions on the wallet
  private async scanForNewTransactions(): Promise<void> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) return;

    try {
      // Get latest block
      const latestBlock = await connection.provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 100); // Check last 100 blocks

      // Get transaction history
      const history = await connection.provider.getLogs({
        fromBlock,
        toBlock: 'latest',
        topics: [
          null, // Any event
          ethers.zeroPadValue(connection.address, 32) // Address as second topic
        ]
      });

      // Process new transactions
      for (const log of history) {
        await this.processLogEntry(log);
      }
    } catch (error) {
      console.error('Error scanning for new transactions:', error);
    }
  }

  // Process blockchain log entry
  private async processLogEntry(log: any): Promise<void> {
    const connection = this.walletService.getConnection();
    if (!connection || !connection.provider) return;

    try {
      const tx = await connection.provider.getTransaction(log.transactionHash);
      if (!tx) return;

      // Check if we already have this transaction
      const existingTx = this.transactions.find(t => t.hash === tx.hash);
      if (existingTx) return;

      // Create new transaction record
      const newTransaction: Transaction = {
        id: this.generateTransactionId(),
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        amount: ethers.formatEther(tx.value),
        token: 'ETH',
        timestamp: Date.now(),
        status: 'confirmed',
        gasUsed: '0', // Will be updated when receipt is available
        gasPrice: tx.gasPrice?.toString() || '0',
        isGasless: false,
        network: this.getNetworkName(connection.chainId)
      };

      this.addTransaction(newTransaction);
    } catch (error) {
      console.error('Error processing log entry:', error);
    }
  }

  // Export transactions to CSV
  exportTransactions(): string {
    const headers = ['ID', 'Hash', 'From', 'To', 'Amount', 'Token', 'Date', 'Status', 'Gas Used', 'Gas Price', 'Gasless', 'Network'];
    const csvContent = [
      headers.join(','),
      ...this.transactions.map(tx => [
        tx.id,
        tx.hash || '',
        tx.from,
        tx.to,
        tx.amount,
        tx.token,
        new Date(tx.timestamp).toISOString(),
        tx.status,
        tx.gasUsed || '',
        tx.gasPrice || '',
        tx.isGasless,
        tx.network
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Get transaction statistics
  getTransactionStats(): {
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
    gaslessTx: number;
    totalGasSaved: string;
  } {
    const total = this.transactions.length;
    const confirmed = this.transactions.filter(tx => tx.status === 'confirmed').length;
    const pending = this.transactions.filter(tx => tx.status === 'pending').length;
    const failed = this.transactions.filter(tx => tx.status === 'failed').length;
    const gaslessTx = this.transactions.filter(tx => tx.isGasless).length;

    // Calculate total gas saved from gasless transactions
    const totalGasSaved = this.transactions
      .filter(tx => tx.isGasless)
      .reduce((total, tx) => {
        // Estimate gas that would have been used
        const estimatedGas = 21000; // Basic transfer
        const gasPrice = ethers.parseUnits('20', 'gwei');
        const gasCost = estimatedGas * Number(gasPrice);
        return total + gasCost;
      }, 0);

    return {
      total,
      confirmed,
      pending,
      failed,
      gaslessTx,
      totalGasSaved: ethers.formatEther(totalGasSaved)
    };
  }

  // Private helper methods
  private loadStoredTransactions(): void {
    try {
      const stored = localStorage.getItem('nitrobridge_transactions');
      if (stored) {
        this.transactions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored transactions:', error);
    }
  }

  private saveTransactions(): void {
    try {
      localStorage.setItem('nitrobridge_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  private generateTransactionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getNetworkName(chainId: number): string {
    const networks = this.walletService.getSupportedNetworks();
    const network = networks.find(n => n.chainId === chainId);
    return network?.name || 'Unknown Network';
  }

  // Clear all transactions (for testing/reset)
  clearTransactions(): void {
    this.transactions = [];
    this.saveTransactions();
  }
}

export default TransactionService;