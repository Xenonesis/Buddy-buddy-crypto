import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  createRecurringPayment: (to: string, amount: string, frequency: RecurringPayment['frequency']) => Promise<void>;
  setActiveTab: (tab: string) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  toggleTheme: () => void;
  refreshData: () => void;
  refreshWalletBalance: () => Promise<void>;
  initializeUserData: (walletAddress: string) => Promise<void>;
  saveStateToDatabase: () => Promise<void>;
  restoreStateFromDatabase: () => Promise<void>;
  setUnsavedChanges: (hasChanges: boolean) => void;
  hasUnsavedChanges: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Initial state
  wallet: null,
  isConnecting: false,
  transactions: [],
  isTransactionPending: false,
  recurringPayments: [],
  activeTab: 'dashboard',
  notifications: [],
  theme: 'light',
  hasUnsavedChanges: false,

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
      
      // Initialize user data after connection
      await get().initializeUserData(connection.address);
      
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
      
      // Always use regular transactions since gasless infrastructure isn't deployed
      const walletService = WalletService.getInstance();
      const connection = walletService.getConnection();
      
      if (!connection || !connection.provider) {
        throw new Error('Wallet not connected');
      }

      // Validate amount
      const amountWei = (await import('ethers')).ethers.parseEther(amount);
      const balanceWei = (await import('ethers')).ethers.parseEther(connection.balance);
      
      if (amountWei > balanceWei) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Create provider and signer
      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get current gas price for better UX
      const feeData = await provider.getFeeData();
      const gasLimit = 21000; // Standard ETH transfer
      const gasPrice = feeData.gasPrice;
      
      if (!gasPrice) {
        throw new Error('Unable to estimate gas price');
      }

      const gasCost = BigInt(gasLimit) * gasPrice;
      const totalCost = amountWei + gasCost;
      
      if (totalCost > balanceWei) {
        throw new Error('Insufficient balance to cover transaction amount and gas fees');
      }

      // Send the transaction
      const tx = await signer.sendTransaction({
        to,
        value: amountWei,
        gasLimit,
        gasPrice
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
        isGasless: false, // Always false since we're not using gasless
        gasUsed: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        network: walletService.getSupportedNetworks().find(n => n.chainId === connection.chainId)?.name || 'Unknown'
      };
      
      transactionService.addTransaction(transaction);
      
      set({ isTransactionPending: false, hasUnsavedChanges: true });
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

  createRecurringPayment: async (to, amount, frequency) => {
    try {
      const recurringService = RecurringPaymentService.getInstance();
      await recurringService.createRecurringPayment(to, amount, 'ETH', frequency);
      
      get().addNotification({
        type: 'success',
        message: `Recurring payment created successfully`
      });
      
      set({ hasUnsavedChanges: true });
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

  initializeUserData: async (walletAddress: string) => {
    try {
      const transactionService = TransactionService.getInstance();
      const recurringService = RecurringPaymentService.getInstance();
      
      // Set user for both services to load data from Supabase
      await transactionService.setUser(walletAddress);
      await recurringService.setUser(walletAddress);
      
      // Reload data from services
      const transactions = transactionService.getTransactions();
      const recurringPayments = recurringService.getRecurringPayments();
      
      set({ transactions, recurringPayments });
    } catch (error) {
      console.error('Error initializing user data:', error);
      get().addNotification({
        type: 'error',
        message: 'Failed to load user data'
      });
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
  },

  saveStateToDatabase: async () => {
    const state = get();
    if (!state.wallet) return;

    try {
      // Save current transactions and recurring payments to database
      const transactionService = TransactionService.getInstance();
      const recurringService = RecurringPaymentService.getInstance();
      
      // The services already handle database persistence
      // This just ensures everything is saved
      await Promise.all([
        // transactionService.saveTransactions(), // Remove this line as method is private
        recurringService.saveRecurringPayments()
      ]);
      
      set({ hasUnsavedChanges: false });
    } catch (error) {
      console.error('Error saving state to database:', error);
    }
  },

  restoreStateFromDatabase: async () => {
    const state = get();
    if (!state.wallet) return;

    try {
      const transactionService = TransactionService.getInstance();
      const recurringService = RecurringPaymentService.getInstance();
      
      // Load data from database
      await transactionService.loadTransactionsFromDatabase();
      await recurringService.loadRecurringPaymentsFromDatabase();
      
      // Update store with loaded data
      const transactions = transactionService.getTransactions();
      const recurringPayments = recurringService.getRecurringPayments();
      
      set({ transactions, recurringPayments });
    } catch (error) {
      console.error('Error restoring state from database:', error);
    }
  },

  setUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges });
  }
}),
{
  name: 'nitrolite-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    wallet: state.wallet,
    activeTab: state.activeTab,
    theme: state.theme,
    // Don't persist sensitive data like notifications or pending states
  }),
  onRehydrateStorage: () => (state) => {
    if (state?.wallet) {
      // Restore wallet connection and data after rehydration
      state.restoreStateFromDatabase();
    }
  }
}
  )
);