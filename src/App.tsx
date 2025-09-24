import React from 'react';
import { useAppStore } from './store/app';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Send from './components/Send';
import Recurring from './components/Recurring';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';

function App() {
  const { activeTab } = useAppStore();

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
