import React, { useEffect } from 'react';
import { useAppStore } from './store/app';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import Recurring from './components/Recurring';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import { NitroliteRealTimeDemo } from './components/NitroliteRealTimeDemo';
import WebSocketService from './services/websocket';

function App() {
  const { activeTab } = useAppStore();

  // Initialize WebSocket service
  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    wsService.connect().catch(console.error);

    return () => {
      wsService.disconnect();
    };
  }, []);

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
    <Layout>
      {renderActiveComponent()}
    </Layout>
  );
}

export default App;
