import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/app';
import WalletService from '../services/wallet';

interface DebugInfo {
  hasWindow: boolean;
  hasEthereum: boolean;
  ethereumType: string;
  isMetaMask?: boolean;
  userAgent: string;
  chainId?: string;
  chainIdDecimal?: number;
  chainIdError?: string;
  accounts?: string[];
  accountsCount?: number;
  accountsError?: string;
}

const WalletDebug: React.FC = () => {
  const { wallet, connectionStatus, connectionMessage, connectWallet, autoReconnectWallet } = useAppStore();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasWindow: false,
    hasEthereum: false,
    ethereumType: 'undefined',
    userAgent: ''
  });
  const [logs, setLogs] = useState<string[]>([]);

  const getStatusClassName = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(message);
  };

  const checkEnvironment = useCallback(async () => {
    const info: DebugInfo = {
      hasWindow: typeof window !== 'undefined',
      hasEthereum: !!window.ethereum,
      ethereumType: typeof window.ethereum,
      isMetaMask: window.ethereum && 'isMetaMask' in window.ethereum ? (window.ethereum as { isMetaMask: boolean }).isMetaMask : undefined,
      userAgent: navigator.userAgent,
    };

    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        info.chainId = chainId;
        info.chainIdDecimal = parseInt(chainId, 16);
      } catch (error) {
        info.chainIdError = (error as Error).message;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        info.accounts = accounts;
        info.accountsCount = accounts.length;
      } catch (error) {
        info.accountsError = (error as Error).message;
      }
    }

    setDebugInfo(info);
    addLog('Environment check completed');
  }, []);

  const testWalletService = async () => {
    const walletService = WalletService.getInstance();
    
    addLog('Testing WalletService...');
    
    try {
      const hasConnection = await walletService.checkConnection();
      addLog(`WalletService.checkConnection(): ${hasConnection}`);
      
      const connection = walletService.getConnection();
      addLog(`WalletService.getConnection(): ${connection ? 'has connection' : 'no connection'}`);
      
      if (connection) {
        addLog(`Connection details: ${JSON.stringify({
          address: connection.address,
          chainId: connection.chainId,
          isConnected: connection.isConnected
        })}`);
      }
    } catch (error) {
      addLog(`WalletService error: ${error.message}`);
    }
  };

  const testDirectConnection = async () => {
    addLog('Testing direct MetaMask connection...');
    
    if (!window.ethereum) {
      addLog('ERROR: window.ethereum not found');
      return;
    }

    try {
      addLog('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      addLog(`Success! Accounts: ${JSON.stringify(accounts)}`);
    } catch (error) {
      addLog(`Direct connection failed: ${error.message}`);
    }
  };

  const testBalanceRefresh = async () => {
    addLog('Testing balance refresh...');
    
    if (!wallet) {
      addLog('ERROR: No wallet connected');
      return;
    }

    try {
      addLog(`Current balance: ${wallet.balance} ETH`);
      
      const walletService = WalletService.getInstance();
      await walletService.refreshBalance();
      
      const connection = walletService.getConnection();
      if (connection) {
        addLog(`Refreshed balance: ${connection.balance} ETH`);
      }
      
      // Also test store refresh
      const { refreshWalletBalance } = useAppStore.getState();
      await refreshWalletBalance();
      addLog('Store balance refresh completed');
    } catch (error) {
      addLog(`Balance refresh failed: ${error.message}`);
    }
  };

  const testSimpleTransaction = async () => {
    addLog('Testing simple transaction...');
    
    if (!wallet) {
      addLog('ERROR: No wallet connected');
      return;
    }

    try {
      // Test with a very small amount (0.001 ETH)
      const testAmount = '0.001';
      const testAddress = '0x742d35Cc69A83FebdF1F6Ad0E7f6ba7e3E1e99aE'; // Random test address
      
      addLog(`Testing transaction: ${testAmount} ETH to ${testAddress}`);
      
      const { sendTransaction } = useAppStore.getState();
      await sendTransaction(testAddress, testAmount, false);
      addLog('Transaction test completed');
    } catch (error) {
      addLog(`Transaction test failed: ${error.message}`);
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, [checkEnvironment]);

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔧 Wallet Connection Debug</h3>
      
      {/* Current Status */}
      <div className="mb-4">
        <h4 className="font-semibold">Current Status:</h4>
        <div className={`p-2 rounded text-sm ${getStatusClassName(connectionStatus)}`}>
          Status: {connectionStatus} | Message: {connectionMessage}
        </div>
        {wallet && (
          <div className="mt-2 text-sm">
            Connected: {wallet.address} | Chain: {wallet.chainId} | Balance: {wallet.balance} ETH
          </div>
        )}
      </div>

      {/* Environment Info */}
      <div className="mb-4">
        <h4 className="font-semibold">Environment:</h4>
        <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={checkEnvironment}
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Check Environment
        </button>
        <button
          onClick={testWalletService}
          className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Test WalletService
        </button>
        <button
          onClick={() => connectWallet('metamask')}
          className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          Connect via Store
        </button>
        <button
          onClick={autoReconnectWallet}
          className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          Auto Reconnect
        </button>
        <button
          onClick={testDirectConnection}
          className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Test Direct MetaMask
        </button>
        <button
          onClick={testBalanceRefresh}
          className="px-3 py-2 bg-cyan-500 text-white rounded text-sm hover:bg-cyan-600"
          disabled={!wallet}
        >
          Test Balance Refresh
        </button>
        <button
          onClick={testSimpleTransaction}
          className="px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 col-span-2"
          disabled={!wallet}
        >
          Test Transaction (0.001 ETH)
        </button>
      </div>

      {/* Logs */}
      <div>
        <h4 className="font-semibold">Logs:</h4>
        <div className="bg-black text-green-400 p-2 rounded text-xs max-h-40 overflow-y-auto">
          {logs.length === 0 ? 'No logs yet...' : logs.map((log) => (
            <div key={log}>{log}</div>
          ))}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};

export default WalletDebug;