import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WalletConnection, Transaction, RecurringPayment } from '../types';
import WalletService from '../services/wallet';
import TransactionService from '../services/transactions';
import RecurringPaymentService from '../services/recurring';

interface AppState {
  // Wallet state
  wallet: WalletConnection | null;
  isConnecting: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionMessage: string;
  
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
  autoReconnectWallet: () => Promise<void>;
  handleTransactionError: (error: unknown) => { type: 'success' | 'error' | 'warning' | 'info'; message: string };
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
  connectionStatus: 'disconnected',
  connectionMessage: 'Not connected',
  transactions: [],
  isTransactionPending: false,
  recurringPayments: [],
  activeTab: 'dashboard',
  notifications: [],
  theme: 'light',
  hasUnsavedChanges: false,

  // Actions
  connectWallet: async (provider) => {
    set({ isConnecting: true, connectionStatus: 'connecting' });
    
    const walletService = WalletService.getInstance();
    
    // Set up status change listener
    const unsubscribe = walletService.onStatusChange((status, message) => {

      set({ 
        connectionStatus: status,
        connectionMessage: message || ''
      });
    });
    
    try {
      const transactionService = TransactionService.getInstance();
      
      let connection: WalletConnection;
      if (provider === 'metamask') {
        connection = await walletService.connectMetaMask(false);
      } else {
        connection = await walletService.connectWalletConnect();
      }
      
      // Start transaction monitoring and load history
      transactionService.startMonitoring();
      await transactionService.loadTransactionHistory();
      
      set({ 
        wallet: connection,
        isConnecting: false,
        connectionStatus: 'connected',
        connectionMessage: `Connected to ${provider === 'metamask' ? 'MetaMask' : 'WalletConnect'}`
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
      console.error('Connection failed:', error);
      set({ 
        isConnecting: false,
        connectionStatus: 'error',
        connectionMessage: error instanceof Error ? error.message : 'Connection failed'
      });
      get().addNotification({
        type: 'error',
        message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },

  autoReconnectWallet: async () => {

    
    const walletService = WalletService.getInstance();
    
    // Set up status change listener
    const unsubscribe = walletService.onStatusChange((status, message) => {

      set({ 
        connectionStatus: status,
        connectionMessage: message || ''
      });
    });
    
    try {
      // First check if MetaMask is available
      if (!window.ethereum) {

        set({ 
          connectionStatus: 'disconnected',
          connectionMessage: 'MetaMask not installed'
        });
        return;
      }
      
      const connection = await walletService.autoReconnect();
      
      if (connection) {

        
        const transactionService = TransactionService.getInstance();
        
        // Start transaction monitoring and load history
        transactionService.startMonitoring();
        await transactionService.loadTransactionHistory();
        
        set({ 
          wallet: connection,
          connectionStatus: 'connected',
          connectionMessage: `Auto-connected to MetaMask`
        });
        
        get().addNotification({
          type: 'success',
          message: 'Automatically reconnected to MetaMask'
        });
        
        // Initialize user data after connection
        await get().initializeUserData(connection.address);
        
        // Refresh data after connection
        get().refreshData();
      } else {

        set({ 
          connectionStatus: 'disconnected',
          connectionMessage: 'MetaMask not connected'
        });
      }
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
      set({ 
        connectionStatus: 'error',
        connectionMessage: error instanceof Error ? error.message : 'Auto-reconnection failed'
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
      recurringPayments: [],
      connectionStatus: 'disconnected',
      connectionMessage: 'Not connected'
    });
    
    get().addNotification({
      type: 'info',
      message: 'Wallet disconnected'
    });
  },

  // Helper function to handle transaction errors
  handleTransactionError: (error: unknown) => {
    console.error('Transaction error details:', error);
    
    const errorObj = error as { 
      code?: number | string; 
      message?: string; 
      cause?: { code?: number }; 
      info?: { error?: { code?: number } };
    };
    
    // Check for user rejection (MetaMask)
    if (errorObj?.code === 4001 || 
        errorObj?.code === 'ACTION_REJECTED' || 
        errorObj?.message?.includes('User denied') ||
        errorObj?.message?.includes('user rejected') ||
        errorObj?.cause?.code === 4001 ||
        errorObj?.info?.error?.code === 4001) {
      return {
        type: 'warning' as const,
        message: 'Transaction cancelled - You rejected the transaction in MetaMask'
      };
    }
    
    // Check for insufficient funds
    if (errorObj?.message?.includes('insufficient funds') || 
        errorObj?.message?.includes('Insufficient balance')) {
      return {
        type: 'error' as const,
        message: 'Insufficient balance to complete this transaction'
      };
    }
    
    // Check for gas estimation errors
    if (errorObj?.message?.includes('gas') || 
        errorObj?.message?.includes('Gas')) {
      return {
        type: 'error' as const,
        message: 'Transaction failed due to gas estimation error. Please try again.'
      };
    }
    
    // Check for network errors
    if (errorObj?.message?.includes('network') || 
        errorObj?.message?.includes('Network')) {
      return {
        type: 'error' as const,
        message: 'Network error. Please check your connection and try again.'
      };
    }
    
    // Default error message
    const message = errorObj?.message || 'Unknown transaction error';
    return {
      type: 'error' as const,
      message: `Transaction failed: ${message}`
    };
  },

  sendTransaction: async (to, amount, useGasless) => {

    set({ isTransactionPending: true });
    
    try {
      const walletService = WalletService.getInstance();
      const transactionService = TransactionService.getInstance();
      const connection = walletService.getConnection();
      
      if (!connection) {
        throw new Error('Wallet not connected');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }



      // Validate inputs
      if (!to || !amount) {
        throw new Error('Invalid transaction parameters');
      }

      // Validate amount
      const ethers = await import('ethers');
      const amountWei = ethers.ethers.parseEther(amount);
      const balanceWei = ethers.ethers.parseEther(connection.balance);
      

      
      if (amountWei > balanceWei) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Create fresh provider and signer
      const provider = new ethers.ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get gas estimation
      const gasLimit = 21000n; // Standard ETH transfer
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.ethers.parseUnits('20', 'gwei');
      

      
      const gasCost = gasLimit * gasPrice;
      const totalCost = amountWei + gasCost;
      

      
      if (totalCost > balanceWei) {
        throw new Error(`Insufficient balance. Need ${ethers.ethers.formatEther(totalCost)} ETH but only have ${connection.balance} ETH`);
      }


      
      // Send the transaction
      const tx = await signer.sendTransaction({
        to,
        value: amountWei,
        gasLimit: Number(gasLimit),
        gasPrice
      });



      const transaction: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        hash: tx.hash,
        from: connection.address,
        to,
        amount,
        token: 'ETH',
        timestamp: Date.now(),
        status: 'pending',
        isGasless: false,
        gasUsed: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        network: walletService.getSupportedNetworks().find(n => n.chainId === connection.chainId)?.name || 'Unknown'
      };
      
      transactionService.addTransaction(transaction);
      
      set({ isTransactionPending: false, hasUnsavedChanges: true });
      get().addNotification({
        type: 'success',
        message: `Transaction sent: ${tx.hash.slice(0, 10)}...`
      });
      
      // Refresh balance after transaction
      setTimeout(() => {
        get().refreshWalletBalance();
      }, 2000);
      
      get().refreshData();
    } catch (error) {
      console.error('Transaction failed:', error);
      set({ isTransactionPending: false });
      
      const errorInfo = get().handleTransactionError(error);
      get().addNotification(errorInfo);
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
      const currentWallet = get().wallet;
      
      if (!currentWallet) {
        console.log('No wallet connected for balance refresh');
        return;
      }
      
      console.log('Refreshing wallet balance...');
      await walletService.refreshBalance();
      
      // Update the wallet state with new balance
      const connection = walletService.getConnection();
      if (connection) {
        console.log('Updating wallet state with new balance:', connection.balance);
        set({ wallet: { ...connection } });
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