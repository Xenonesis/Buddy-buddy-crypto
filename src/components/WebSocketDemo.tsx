import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WebSocketEventsDisplay from './WebSocketEventsDisplay';
import WebSocketStatusIndicator from './WebSocketStatusIndicator';
import WebSocketService from '../services/websocket';

const WebSocketDemo: React.FC = () => {
  const [testAddress, setTestAddress] = useState('0x742d35C67375C9Bbd8C9ef4E0a8B2B8a9a04e9C4');
  const [testHash, setTestHash] = useState('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  const wsService = WebSocketService.getInstance();

  const testWebSocketConnection = () => {
    // Test the WebSocket connection status
    const connectionState = wsService.getConnectionState();
    console.log('WebSocket connection test:', connectionState);
  };

  const checkActiveSubscriptions = () => {
    // Check current active subscriptions
    console.log('Checking active WebSocket subscriptions');
  };

  const requestRealTimeUpdates = () => {
    // Request real-time updates for the test address
    const balanceSub = wsService.requestBalanceUpdates(testAddress);
    console.log('Subscribed to balance updates with ID:', balanceSub);

    // Request transaction updates for the test hash
    const txSub = wsService.requestTransactionUpdates(testHash);
    console.log('Subscribed to transaction updates with ID:', txSub);

    // Request network status updates
    const networkSub = wsService.requestNetworkStatus();
    console.log('Subscribed to network status with ID:', networkSub);

    // Request gas price updates
    const gasSub = wsService.requestGasPriceUpdates();
    console.log('Subscribed to gas price updates with ID:', gasSub);

    // Request protocol stats
    const statsSub = wsService.requestProtocolStats();
    console.log('Subscribed to protocol stats with ID:', statsSub);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          WebSocket Integration Testing
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Connection Status
            </h3>
            <WebSocketStatusIndicator className="text-base" />
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">WebSocket URLs:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <strong>WS URL:</strong> {wsService.getConnectionState()?.url || 'Not set'}
                </div>
                <div>
                  <strong>API URL:</strong> {wsService.getApiUrl()}
                </div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Test Controls
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Address:
                </label>
                <input
                  type="text"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  placeholder="Enter Ethereum address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Transaction Hash:
                </label>
                <input
                  type="text"
                  value={testHash}
                  onChange={(e) => setTestHash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  placeholder="Enter transaction hash"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={requestRealTimeUpdates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Subscribe to Updates
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={testWebSocketConnection}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Test Connection
              </motion.button>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            WebSocket Features:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Real-time transaction status updates</li>
            <li>• Live balance monitoring</li>
            <li>• Network status notifications</li>
            <li>• Gas price updates</li>
            <li>• Protocol statistics</li>
            <li>• Automatic reconnection with exponential backoff</li>
            <li>• Subscription-based event system</li>
          </ul>
        </div>
      </div>

      {/* Live Events Display */}
      <WebSocketEventsDisplay className="min-h-96" />
    </div>
  );
};

export default WebSocketDemo;