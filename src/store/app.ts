import { create } from 'zustand';
import { WalletConnection, Transaction, RecurringPayment } from '../types';
import WalletService from '../services/wallet';
import TransactionService from '../services/transactions';
import RecurringPaymentService from '../services/recurring';
import NitroLiteService from '../services/nitrolite';

interface AppState {
  // Wallet state
  wallet: WalletConnection | null;
  isConnecting: boolean;
  
  // Transaction state
  transactions: Transaction[];
  isTransactionPending: boolean;
  
  // Recurring payments state
  recurringPayments: RecurringPayment[];
  
  // UI state
  activeTab: string;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  
  // Theme
  theme: 'light' | 'dark';
  
  // Actions
  connectWallet: (provider: 'metamask' | 'walletconnect') => Promise<void>;
  disconnectWallet: () => void;
  sendTransaction: (to: string, amount: string, useGasless: boolean) => Promise<void>;
  createRecurringPayment: (to: string, amount: string, frequency: RecurringPayment['frequency']) => void;
  setActiveTab: (tab: string) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  toggleTheme: () => void;
  refreshData: () => void;
  refreshWalletBalance: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  wallet: null,
  isConnecting: false,
  transactions: [],
  isTransactionPending: false,
  recurringPayments: [],
  activeTab: 'dashboard',
  notifications: [],
  theme: 'light',

  // Actions
  connectWallet: async (provider) => {
    set({ isConnecting: true });
    try {
      const walletService = WalletService.getInstance();
      const transactionService = TransactionService.getInstance();
      
      let connection: WalletConnection;
      if (provider === 'metamask') {
        connection = await walletService.connectMetaMask();
      } else {
        connection = await walletService.connectWalletConnect();
      }
      
      // Start transaction monitoring and load history
      transactionService.startMonitoring();
      await transactionService.loadTransactionHistory();
      
      set({ 
        wallet: connection,
        isConnecting: false
      });
      
      get().addNotification({
        type: 'success',
        message: `Connected to ${provider === 'metamask' ? 'MetaMask' : 'WalletConnect'}`
      });
      
      // Refresh data after connection
      get().refreshData();
    } catch (error) {
      set({ isConnecting: false });
      get().addNotification({
        type: 'error',
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },

  disconnectWallet: () => {
    const walletService = WalletService.getInstance();
    const transactionService = TransactionService.getInstance();
    
    walletService.disconnect();
    transactionService.stopMonitoring();
    
    set({ 
      wallet: null,
      transactions: [],
      recurringPayments: []
    });
    
    get().addNotification({
      type: 'info',
      message: 'Wallet disconnected'
    });
  },

  sendTransaction: async (to, amount, useGasless) => {
    set({ isTransactionPending: true });
    try {
      const nitroLiteService = NitroLiteService.getInstance();
      const transactionService = TransactionService.getInstance();
      
      let transaction: Transaction;
      
      if (useGasless) {
        if (!nitroLiteService.isGaslessAvailable()) {
          throw new Error('Gasless transactions are not available on this network or NitroLite is not properly configured');
        }
        transaction = await nitroLiteService.executeGaslessTransfer(to, amount);
      } else {
        // Execute regular blockchain transaction
        const walletService = WalletService.getInstance();
        const connection = walletService.getConnection();
        
        if (!connection || !connection.provider) {
          throw new Error('Wallet not connected');
        }

        const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tx = await signer.sendTransaction({
          to,
          value: (await import('ethers')).ethers.parseEther(amount)
        });

        transaction = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          hash: tx.hash,
          from: connection.address,
          to,
          amount,
          token: 'ETH',
          timestamp: Date.now(),
          status: 'pending',
          isGasless: false,
          network: walletService.getSupportedNetworks().find(n => n.chainId === connection.chainId)?.name || 'Unknown'
        };
      }
      
      transactionService.addTransaction(transaction);
      
      set({ isTransactionPending: false });
      get().addNotification({
        type: 'success',
        message: `Transaction sent successfully`
      });
      
      get().refreshData();
    } catch (error) {
      set({ isTransactionPending: false });
      get().addNotification({
        type: 'error',
        message: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },

  createRecurringPayment: (to, amount, frequency) => {
    try {
      const recurringService = RecurringPaymentService.getInstance();
      const payment = recurringService.createRecurringPayment(to, amount, 'ETH', frequency);
      
      get().addNotification({
        type: 'success',
        message: `Recurring payment created successfully`
      });
      
      get().refreshData();
    } catch (error) {
      get().addNotification({
        type: 'error',
        message: `Failed to create recurring payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  addNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      timestamp: Date.now()
    };
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  toggleTheme: () => {
    set(state => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    }));
  },

  refreshData: () => {
    try {
      const transactionService = TransactionService.getInstance();
      const recurringService = RecurringPaymentService.getInstance();
      
      const transactions = transactionService.getTransactions();
      const recurringPayments = recurringService.getRecurringPayments();
      
      set({ transactions, recurringPayments });
      
      // Also refresh wallet balance
      get().refreshWalletBalance();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  },

  refreshWalletBalance: async () => {
    try {
      const walletService = WalletService.getInstance();
      await walletService.refreshBalance();
      
      // Update the wallet state with new balance
      const connection = walletService.getConnection();
      if (connection) {
        set({ wallet: connection });
      }
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
    }
  }
}));