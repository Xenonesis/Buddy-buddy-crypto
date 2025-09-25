import React, { useState, useEffect } from 'react';
import WebSocketService from '../services/websocket';
import { WebSocketStatus } from '../types';

interface WebSocketStatusIndicatorProps {
  className?: string;
}

const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = wsService.onStatusChange(setStatus);

    // Set initial status
    setStatus(wsService.getStatus());

    return unsubscribe;
  }, [wsService]);

  const handleConnect = async () => {
    if (status === 'disconnected' || status === 'error') {
      setIsConnecting(true);
      try {
        await wsService.connect();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleDisconnect = () => {
    if (status === 'connected' || status === 'connecting') {
      wsService.disconnect();
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': 
      case 'reconnecting': return 'text-yellow-500';
      case 'disconnected': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting':
      case 'reconnecting': return '🟡';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {(status === 'disconnected' || status === 'error') && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      )}
      
      {(status === 'connected' || status === 'connecting') && (
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatusIndicator;