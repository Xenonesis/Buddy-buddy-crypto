import React, { useEffect } from 'react';
import { useAppStore } from './store/app';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import Recurring from './components/Recurring';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import { NitroliteRealTimeDemo } from './components/NitroliteRealTimeDemo';
import RefreshProtection from './components/RefreshProtection';
import WebSocketService from './services/websocket';

function App() {
  const { activeTab, wallet, restoreStateFromDatabase } = useAppStore();

  // Initialize WebSocket service and restore state
  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    wsService.connect().catch(console.error);

    // Restore state if wallet was previously connected
    if (wallet) {
      restoreStateFromDatabase().catch(console.error);
    }

    return () => {
      wsService.disconnect();
    };
  }, []);

  // Restore state when wallet reconnects
  useEffect(() => {
    if (wallet) {
      restoreStateFromDatabase().catch(console.error);
    }
  }, [wallet, restoreStateFromDatabase]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'send':
        return <Send />;
      case 'recurring':
        return <Recurring />;
      case 'transactions':
        return <TransactionList />;
      case 'settings':
        return <Settings />;
      case 'websocket':
        return <NitroliteRealTimeDemo />;
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
