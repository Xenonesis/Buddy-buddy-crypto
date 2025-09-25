import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  TrendingUp, 
  Users, 
  Zap, 
  RefreshCw, 
  Play, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  Settings
} from 'lucide-react';
import webSocketService from '../services/websocket';
import BlockchainService from '../services/blockchain';
import WalletConnection from './WalletConnection';
import { useAppStore } from '../store/app';
import type { 
  ChannelCreatedPayload,
  StateUpdatePayload,
  TransactionUpdatePayload,
  NetworkStatusPayload,
  ProtocolStatsPayload,
  SessionPayload,
  WebSocketStatus
} from '../types';

// Helper functions for styling
const getConnectionStatusStyle = (status: WebSocketStatus) => {
  switch (status) {
    case 'connected': return 'bg-green-100 text-green-800';
    case 'connecting': return 'bg-yellow-100 text-yellow-800';
    case 'reconnecting': return 'bg-orange-100 text-orange-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getConnectionDotStyle = (status: WebSocketStatus) => {
  switch (status) {
    case 'connected': return 'bg-green-400';
    case 'connecting': return 'bg-yellow-400';
    case 'reconnecting': return 'bg-orange-400';
    case 'error': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
};

const getTransactionStatusStyle = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-red-100 text-red-800';
  }
};

export const NitroliteRealTimeDemo: React.FC = () => {
  const { wallet, connectWallet, isConnecting } = useAppStore();
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [channels, setChannels] = useState<ChannelCreatedPayload[]>([]);
  const [transactions, setTransactions] = useState<TransactionUpdatePayload[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStatusPayload | null>(null);
  const [protocolStats, setProtocolStats] = useState<ProtocolStatsPayload | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionPayload[]>([]);
  const [recentStateUpdates, setRecentStateUpdates] = useState<StateUpdatePayload[]>([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [clearNodeAssets, setClearNodeAssets] = useState<any[]>([]);
  const [realBlockchainData, setRealBlockchainData] = useState<any>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const wsService = webSocketService.getInstance();
  const blockchainService = BlockchainService.getInstance();

  // Connection status handler
  const handleConnectionStatus = useCallback((status: string) => {
    setConnectionStatus(status as WebSocketStatus);
  }, []);

  // Channel events handler
  const handleChannelCreated = useCallback((payload: ChannelCreatedPayload) => {
    setChannels(prev => [payload, ...prev.slice(0, 9)]); // Keep last 10 channels
  }, []);

  // Transaction events handler
  const handleTransactionUpdate = useCallback((payload: TransactionUpdatePayload) => {
    setTransactions(prev => {
      const existing = prev.find(tx => tx.hash === payload.hash);
      if (existing) {
        return prev.map(tx => tx.hash === payload.hash ? payload : tx);
      }
      return [payload, ...prev.slice(0, 19)]; // Keep last 20 transactions
    });
  }, []);

  // Network status handler
  const handleNetworkStatus = useCallback((payload: NetworkStatusPayload) => {
    setNetworkStats(payload);
  }, []);

  // Protocol stats handler
  const handleProtocolStats = useCallback((payload: ProtocolStatsPayload) => {
    setProtocolStats(payload);
  }, []);

  // Session events handler
  const handleSessionStarted = useCallback((payload: SessionPayload) => {
    setActiveSessions(prev => [payload, ...prev]);
  }, []);

  const handleSessionEnded = useCallback((payload: SessionPayload) => {
    setActiveSessions(prev => prev.filter(s => s.sessionId !== payload.sessionId));
  }, []);

  // State update handler
  const handleStateUpdate = useCallback((payload: StateUpdatePayload) => {
    setRecentStateUpdates(prev => [payload, ...prev.slice(0, 9)]);
  }, []);

  // ClearNode assets handler
  const handleClearNodeAssets = useCallback((payload: { assets?: unknown[] }) => {
    if (payload.assets) {
      const tokens = blockchainService.parseTokensFromClearNode(payload);
      setClearNodeAssets(tokens);
    }
  }, [blockchainService]);

  // Real blockchain data handler
  const handleBlockchainUpdate = useCallback((data: any) => {
    setRealBlockchainData(data);
    
    // Convert to NetworkStatusPayload format for existing UI
    const networkPayload: NetworkStatusPayload = {
      chainId: data.chainId,
      blockNumber: data.blockNumber,
      gasPrice: data.gasPrice,
      isHealthy: data.isHealthy,
      nodeCount: 1,
      latency: Date.now() - data.lastBlockTime > 30000 ? 30 : 5
    };
    setNetworkStats(networkPayload);
  }, []);

  // Auto-detection and connection logic
  const initializeConnections = useCallback(async () => {
    setIsInitializing(true);
    
    try {
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Auto-detect and connect wallet if available
      if (!wallet && !autoConnectAttempted && window.ethereum) {
        setAutoConnectAttempted(true);
        try {
          // Check if already connected to MetaMask
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            await connectWallet('metamask');
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
        }
      }
      
      // Connect to WebSocket services
      await wsService.connect();
      
      // Load initial blockchain data
      const polygonData = await blockchainService.getBlockchainData(137);
      if (polygonData) {
        handleBlockchainUpdate(polygonData);
      }
    } catch (error) {
      console.error('Initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [wallet, autoConnectAttempted, connectWallet, wsService, blockchainService, handleBlockchainUpdate]);

  useEffect(() => {
    // Subscribe to real ClearNode WebSocket events
    const unsubscribeConnection = wsService.onStatusChange(handleConnectionStatus);
    const unsubscribeChannels = wsService.subscribe('channel_created', handleChannelCreated);
    const unsubscribeTransactions = wsService.subscribe('transaction_update', handleTransactionUpdate);
    const unsubscribeNetworkStatus = wsService.subscribe('network_status', handleNetworkStatus);
    const unsubscribeProtocolStats = wsService.subscribe('protocol_stats', handleProtocolStats);
    const unsubscribeSessionStart = wsService.subscribe('session_started', handleSessionStarted);
    const unsubscribeSessionEnd = wsService.subscribe('session_ended', handleSessionEnded);
    const unsubscribeStateUpdate = wsService.subscribe('state_update', handleStateUpdate);
    const unsubscribeAssets = wsService.subscribe('assets', handleClearNodeAssets);
    const unsubscribeBlockchain = blockchainService.on('network_update', handleBlockchainUpdate);

    // Initialize all connections
    initializeConnections();

    return () => {
      unsubscribeConnection();
      wsService.unsubscribe(unsubscribeChannels);
      wsService.unsubscribe(unsubscribeTransactions);
      wsService.unsubscribe(unsubscribeNetworkStatus);
      wsService.unsubscribe(unsubscribeProtocolStats);
      wsService.unsubscribe(unsubscribeSessionStart);
      wsService.unsubscribe(unsubscribeSessionEnd);
      wsService.unsubscribe(unsubscribeStateUpdate);
      wsService.unsubscribe(unsubscribeAssets);
      unsubscribeBlockchain();
    };
  }, [initializeConnections, handleConnectionStatus, handleChannelCreated, handleTransactionUpdate, handleNetworkStatus, handleProtocolStats, handleSessionStarted, handleSessionEnded, handleStateUpdate, handleClearNodeAssets, handleBlockchainUpdate]);

  // Refresh all real data sources
  const handleRefreshData = async () => {
    setIsCreatingChannel(true);
    try {
      // Refresh blockchain data
      const blockchainData = await blockchainService.getBlockchainData(137);
      if (blockchainData) {
        handleBlockchainUpdate(blockchainData);
      }
      
      // Reconnect WebSocket to get fresh real data
      wsService.disconnect();
      setTimeout(() => wsService.connect().catch(console.error), 1000);
      
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
            <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Initializing Nitrolite</h2>
          <p className="text-gray-600 dark:text-gray-300">Connecting to blockchain networks and real-time services...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nitrolite ERC-7824
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">Real-Time Blockchain Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              {connectionStatus === 'connected' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  <span className="font-medium">Live</span>
                </motion.div>
              ) : (
                <div className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                  <WifiOff className="w-4 h-4 mr-2" />
                  <span className="font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Wallet Connection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Wallet Connection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {wallet ? 'Connected and ready for transactions' : 'Connect your wallet to get started'}
                  </p>
                </div>
              </div>
              {wallet && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
              )}
            </div>
            <WalletConnection />
          </div>
        </motion.div>

        {/* Live Status Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <Activity className="w-6 h-6 mr-2 animate-pulse" />
                  🔴 LIVE: Real Data Sources Active
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span>ClearNode WebSocket</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span>Polygon RPC Live Data</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span>Real-time Gas Prices</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{clearNodeAssets.length}</div>
                <div className="text-sm opacity-90">Assets Tracked</div>
              </div>
            </div>
          </div>
        </motion.div>
      
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {clearNodeAssets.length}
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">ClearNode Assets</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live from WebSocket</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {channels.length}
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Active Channels</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live from network</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {transactions.length}
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Blockchain Txns</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time tracking</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  {connectionStatus === 'connected' ? 
                    <Wifi className="w-6 h-6 text-orange-600 dark:text-orange-400" /> :
                    <WifiOff className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  }
                </div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {connectionStatus === 'connected' ? 'LIVE' : 'OFF'}
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">WebSocket Status</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">ClearNode connection</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Network Status */}
        {networkStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-3">
                  <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Network Status</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{networkStats.chainId}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Chain ID</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{networkStats.blockNumber.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Block Height</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{networkStats.gasPrice}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gas Price (gwei)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className={`text-2xl font-bold ${networkStats.isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {networkStats.isHealthy ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Network Health</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ClearNode Assets */}
        {clearNodeAssets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl mr-3">
                    <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">ClearNode Assets</h3>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {clearNodeAssets.length} assets tracked
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {clearNodeAssets.slice(0, 12).map((asset, index) => (
                  <motion.div
                    key={`${asset.address}-${index}`}
                    whileHover={{ scale: 1.05 }}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="font-semibold text-gray-800 dark:text-white text-sm">{asset.symbol?.toUpperCase()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Chain {asset.chainId}</div>
                    <div className="text-xs font-mono text-gray-400 dark:text-gray-500">{asset.address?.slice(0, 8)}...</div>
                  </motion.div>
                ))}
              </div>
              {clearNodeAssets.length > 12 && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  +{clearNodeAssets.length - 12} more assets available
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefreshData}
              disabled={isCreatingChannel}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isCreatingChannel ? 'animate-spin' : ''}`} />
              {isCreatingChannel ? 'Refreshing...' : 'Refresh All Data'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const data = await blockchainService.getBlockchainData(137);
                  if (data) handleBlockchainUpdate(data);
                } catch (error) {
                  console.error('Failed to refresh blockchain data:', error);
                }
              }}
              className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Data
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                wsService.disconnect();
                setTimeout(() => wsService.connect().catch(console.error), 1000);
              }}
              className="flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium shadow-lg"
            >
              <Wifi className="w-5 h-5 mr-2" />
              Reconnect
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://polygonscan.com/', '_blank')}
              className="flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              View Explorer
            </motion.button>
          </div>
        </motion.div>

        {/* Data Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl mr-3">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Channels</h3>
              <div className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                {channels.length}
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {channels.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No channels created yet</p>
                  </div>
                ) : (
                  channels.map((channel, index) => (
                    <motion.div
                      key={channel.channelId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {channel.channelId.slice(0, 10)}...{channel.channelId.slice(-8)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {channel.participants.length} participants
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(channel.createdAt).toLocaleTimeString()}
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 ml-auto" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Transactions</h3>
              <div className="ml-auto bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                {transactions.length}
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <motion.div
                      key={tx.hash}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {tx.type?.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {tx.status === 'confirmed' ? <CheckCircle className="w-3 h-3 inline mr-1" /> :
                               tx.status === 'pending' ? <Clock className="w-3 h-3 inline mr-1" /> :
                               <AlertCircle className="w-3 h-3 inline mr-1" />}
                              {tx.status}
                            </span>
                          </div>
                          {tx.gasUsed && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Gas: {parseInt(tx.gasUsed).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Active Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Sessions</h3>
              <div className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                {activeSessions.length}
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  activeSessions.map((session, index) => (
                    <motion.div
                      key={session.sessionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Session: {session.sessionId.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Channel: {session.channelId.slice(0, 10)}...
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {session.participants.length} participants
                        </div>
                        <div>Started {new Date(session.startTime).toLocaleTimeString()}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent State Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mr-3">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent State Updates</h3>
              <div className="ml-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-full text-xs font-medium">
                {recentStateUpdates.length}
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {recentStateUpdates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No state updates yet</p>
                  </div>
                ) : (
                  recentStateUpdates.map((update, index) => (
                    <motion.div
                      key={`${update.channelId}-${update.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {update.channelId.slice(0, 10)}...{update.channelId.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Version {update.version} • Hash: {update.stateHash.slice(0, 10)}...
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};