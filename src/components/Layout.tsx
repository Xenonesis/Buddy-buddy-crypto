import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Send, 
  Clock, 
  Activity, 
  Settings, 
  Wallet,
  Menu,
  X,
  Sun,
  Moon,
  Wifi
} from 'lucide-react';
import { useAppStore } from '../store/app';
import WalletConnection from './WalletConnection';
import Notifications from './Notifications';
import WebSocketStatusIndicator from './WebSocketStatusIndicator';
import DataSyncStatus from './DataSyncStatus';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab, wallet, theme, toggleTheme } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'recurring', label: 'Recurring', icon: Clock },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'websocket', label: 'Nitrolite Live', icon: Wifi },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -250 }}
          animate={{ x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -250 }}
          className="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg lg:static lg:translate-x-0"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg"></div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Budget Buddy
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Wallet Connection */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <WalletConnection />
            </div>
          </div>
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Menu size={20} />
                </button>
                
                <div className="flex items-center space-x-2">
                  <Wallet size={20} className="text-primary-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {wallet ? (
                      <>Connected to {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</>
                    ) : (
                      'Not connected'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Theme toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </motion.button>

                {/* WebSocket Status Indicator */}
                <WebSocketStatusIndicator className="text-sm" />

                {/* Network indicator */}
                {wallet && (() => {
                  let networkName = 'Unknown';
                  if (wallet.chainId === 1) networkName = 'Mainnet';
                  else if (wallet.chainId === 11155111) networkName = 'Sepolia';
                  else if (wallet.chainId === 137) networkName = 'Polygon';
                  
                  return (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{networkName}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Notifications */}
      <Notifications />
      
      {/* Data Sync Status */}
      <DataSyncStatus />
    </div>
  );
};

export default Layout;