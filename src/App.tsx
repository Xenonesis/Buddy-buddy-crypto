import React, { useEffect } from 'react';
import { useAppStore } from './store/app';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import QRScanPay from './components/QRScanPay';
import Recurring from './components/Recurring';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import RefreshProtection from './components/RefreshProtection';
import WebSocketService from './services/websocket';

function App() {
  const { activeTab, wallet, restoreStateFromDatabase, autoReconnectWallet } = useAppStore();

  // Initialize WebSocket service and attempt auto-reconnection
  useEffect(() => {
    const initializeApp = async () => {
      const wsService = WebSocketService.getInstance();
      await wsService.connect().catch(() => {});

      // Attempt to auto-reconnect to MetaMask if it was previously connected
      await autoReconnectWallet();
    };

    initializeApp();

    return () => {
      const wsService = WebSocketService.getInstance();
      wsService.disconnect();
    };
  }, [autoReconnectWallet]);

  // Restore state when wallet reconnects
  useEffect(() => {
    if (wallet) {
      restoreStateFromDatabase().catch(() => {});
    }
  }, [wallet, restoreStateFromDatabase]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'send':
        return <Send />;
      case 'qr-scan-pay':
        return <QRScanPay />;
      case 'recurring':
        return <Recurring />;
      case 'transactions':
        return <TransactionList />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <RefreshProtection>
      <Layout>
        {renderActiveComponent()}
      </Layout>
    </RefreshProtection>
  );
}

export default App;
