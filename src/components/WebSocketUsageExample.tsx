import React, { useEffect, useState } from 'react';
import webSocketService from '../services/websocket';
import type { 
  WebSocketMessage, 
  TransactionUpdatePayload, 
  NetworkStatusPayload 
} from '../types';

// Create type aliases for backward compatibility
type WSMessage = WebSocketMessage;
type NetworkStatus = NetworkStatusPayload;
type TransactionStatus = TransactionUpdatePayload;

// Helper functions for styling
const getConnectionStatusStyle = (status: string) => {
  switch (status) {
    case 'connected': return 'bg-green-100 text-green-800';
    case 'connecting': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-red-100 text-red-800';
  }
};

const getConnectionDotStyle = (status: string) => {
  switch (status) {
    case 'connected': return 'bg-green-400';
    case 'connecting': return 'bg-yellow-400';
    default: return 'bg-red-400';
  }
};

const getTransactionStatusStyle = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const WebSocketUsageExample: React.FC = () => {
  const wsService = webSocketService.getInstance();
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [transactionStatuses, setTransactionStatuses] = useState<Map<string, TransactionStatus>>(new Map());

  useEffect(() => {
    // Subscribe to connection status updates
    const unsubscribeConnection = wsService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to network status updates
    const unsubscribeNetwork = wsService.subscribe('network_status', (payload: NetworkStatus) => {
      setNetworkStatus(payload);
    });

    // Subscribe to transaction updates
    const unsubscribeTransaction = wsService.subscribe('transaction_update', (payload: TransactionStatus) => {
      if (payload.hash) {
        setTransactionStatuses(prev => new Map(prev).set(payload.hash!, payload));
      }
    });

    // Connect to WebSocket
    wsService.connect();

    return () => {
      unsubscribeConnection();
      wsService.unsubscribe(unsubscribeNetwork);
      wsService.unsubscribe(unsubscribeTransaction);
    };
  }, [wsService]);

  const handleSendTestMessage = () => {
    // Log a test message
    const message: WSMessage = {
      type: 'heartbeat',
      payload: { timestamp: Date.now() },
      timestamp: Date.now()
    };
    setMessages(prev => [...prev.slice(-49), message]);
  };

  const handleRequestNetworkStatus = () => {
    wsService.requestNetworkStatus();
  };

  const handleSubscribeToTransaction = () => {
    const txHash = prompt('Enter transaction hash to monitor:');
    if (txHash) {
      wsService.requestTransactionUpdates(txHash);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">WebSocket Service Demo</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          getConnectionStatusStyle(connectionStatus)
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            getConnectionDotStyle(connectionStatus)
          }`} />
          {connectionStatus}
        </div>
      </div>

      {/* Network Status */}
      {networkStatus && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Network Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Chain ID:</span> {networkStatus.chainId}
            </div>
            <div>
              <span className="font-medium">Block Number:</span> {networkStatus.blockNumber}
            </div>
            <div>
              <span className="font-medium">Gas Price:</span> {networkStatus.gasPrice} gwei
            </div>
            <div>
              <span className="font-medium">Healthy:</span> {networkStatus.isHealthy ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Statuses */}
      {transactionStatuses.size > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Transaction Statuses</h3>
          <div className="space-y-2">
            {Array.from(transactionStatuses.entries()).map(([hash, status]) => (
              <div key={hash} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="font-mono text-sm">{hash.slice(0, 10)}...{hash.slice(-8)}</div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  getTransactionStatusStyle(status.status)
                }`}>
                  {status.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={handleSendTestMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Test Message
        </button>
        <button
          onClick={handleRequestNetworkStatus}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Request Network Status
        </button>
        <button
          onClick={handleSubscribeToTransaction}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Monitor Transaction
        </button>
        <button
          onClick={() => wsService.disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
        <button
          onClick={() => wsService.connect()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reconnect
        </button>
      </div>

      {/* Message Log */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-white mb-2">Message Log (Last 50 messages)</h3>
        {messages.length === 0 ? (
          <div className="text-gray-500">No messages yet...</div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.timestamp || Date.now()}-${index}`} className="mb-1">
              <span className="text-yellow-400">[{new Date(message.timestamp || Date.now()).toLocaleTimeString()}]</span>{' '}
              <span className="text-cyan-400">{message.type}</span>:{' '}
              {JSON.stringify(message.payload)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};