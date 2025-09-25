import React, { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketService from '../services/websocket';
import {
  TransactionUpdatePayload,
  BalanceUpdatePayload,
  NetworkStatusPayload,
  GasPriceUpdatePayload,
  ProtocolStatsPayload
} from '../types';

interface WebSocketEvent {
  id: string;
  type: string;
  timestamp: number;
  payload: unknown;
}

interface WebSocketEventsDisplayProps {
  className?: string;
  maxEvents?: number;
}

const WebSocketEventsDisplay: React.FC<WebSocketEventsDisplayProps> = ({ 
  className = '', 
  maxEvents = 50 
}) => {
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const eventsRef = useRef<HTMLDivElement>(null);
  const wsService = WebSocketService.getInstance();

  const addEvent = useCallback((type: string, payload: unknown) => {
    const event: WebSocketEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      timestamp: Date.now(),
      payload
    };

    setEvents(prevEvents => {
      const newEvents = [event, ...prevEvents];
      return newEvents.slice(0, maxEvents);
    });

    // Auto-scroll to top
    setTimeout(() => {
      if (eventsRef.current) {
        eventsRef.current.scrollTop = 0;
      }
    }, 100);
  }, [maxEvents]);

  useEffect(() => {
    // Subscribe to various WebSocket events
    const newSubscriptions: string[] = [];

    // Transaction updates
    const txSub = wsService.subscribe<TransactionUpdatePayload>(
      'transaction_update',
      (payload) => {
        addEvent('transaction_update', payload);
      }
    );
    newSubscriptions.push(txSub);

    // Balance updates
    const balanceSub = wsService.subscribe<BalanceUpdatePayload>(
      'balance_update',
      (payload) => {
        addEvent('balance_update', payload);
      }
    );
    newSubscriptions.push(balanceSub);

    // Network status updates
    const networkSub = wsService.subscribe<NetworkStatusPayload>(
      'network_status',
      (payload) => {
        addEvent('network_status', payload);
      }
    );
    newSubscriptions.push(networkSub);

    // Gas price updates
    const gasSub = wsService.subscribe<GasPriceUpdatePayload>(
      'gas_price_update',
      (payload) => {
        addEvent('gas_price_update', payload);
      }
    );
    newSubscriptions.push(gasSub);

    // Protocol stats updates
    const statsSub = wsService.subscribe<ProtocolStatsPayload>(
      'protocol_stats',
      (payload) => {
        addEvent('protocol_stats', payload);
      }
    );
    newSubscriptions.push(statsSub);

    setSubscriptions(newSubscriptions);

    return () => {
      // Cleanup subscriptions
      newSubscriptions.forEach(sub => wsService.unsubscribe(sub));
    };
  }, [wsService, addEvent]);

  const clearEvents = () => {
    setEvents([]);
  };

  const formatPayload = (payload: unknown): string => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'transaction_update': return '💰';
      case 'balance_update': return '💵';
      case 'network_status': return '🌐';
      case 'gas_price_update': return '⛽';
      case 'protocol_stats': return '📊';
      default: return '📡';
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'transaction_update': return 'border-blue-500 bg-blue-50';
      case 'balance_update': return 'border-green-500 bg-green-50';
      case 'network_status': return 'border-purple-500 bg-purple-50';
      case 'gas_price_update': return 'border-orange-500 bg-orange-50';
      case 'protocol_stats': return 'border-indigo-500 bg-indigo-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            WebSocket Events
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {events.length} events
            </span>
            <button
              onClick={clearEvents}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
        {subscriptions.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Active subscriptions: {subscriptions.length}
          </p>
        )}
      </div>

      <div 
        ref={eventsRef}
        className="max-h-96 overflow-y-auto p-4 space-y-3"
      >
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📡</div>
            <p>No WebSocket events received yet</p>
            <p className="text-sm mt-1">
              Events will appear here when the WebSocket connection is active
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 p-3 rounded ${getEventColor(event.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <span className="font-medium text-gray-900">
                    {event.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                {formatPayload(event.payload)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WebSocketEventsDisplay;