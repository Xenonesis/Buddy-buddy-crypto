import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Network, 
  Bell, 
  Download,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useAppStore } from '../store/app';
import WalletService from '../services/wallet';
import TransactionService from '../services/transactions';
import RecurringPaymentService from '../services/recurring';
import EncryptionService from '../utils/encryption';

const Settings: React.FC = () => {
  const { wallet, theme, toggleTheme, addNotification } = useAppStore();
  const [showPrivateKey, setShowPrivateKey] = React.useState(false);
  const [encryptionKey, setEncryptionKey] = React.useState('');
  const [notifications, setNotifications] = React.useState({
    transactions: true,
    recurring: true,
    security: true
  });

  const walletService = WalletService.getInstance();
  const transactionService = TransactionService.getInstance();
  const recurringService = RecurringPaymentService.getInstance();
  const encryptionService = EncryptionService.getInstance();

  const supportedNetworks = walletService.getSupportedNetworks();

  const switchNetwork = async (chainId: number) => {
    try {
      await walletService.switchNetwork(chainId);
      addNotification({
        type: 'success',
        message: `Switched to ${supportedNetworks.find(n => n.chainId === chainId)?.name}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to switch network'
      });
    }
  };

  const generateEncryptionKey = () => {
    const key = encryptionService.generateKey();
    setEncryptionKey(key);
    addNotification({
      type: 'success',
      message: 'New encryption key generated'
    });
  };

  const copyEncryptionKey = () => {
    if (encryptionKey) {
      navigator.clipboard.writeText(encryptionKey);
      addNotification({
        type: 'success',
        message: 'Encryption key copied to clipboard'
      });
    }
  };

  const exportData = () => {
    const data = {
      transactions: transactionService.getTransactions(),
      recurringPayments: recurringService.getRecurringPayments(),
      settings: { theme, notifications },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nitrobridge-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      message: 'Data exported successfully'
    });
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      transactionService.clearTransactions();
      recurringService.clearPayments();
      localStorage.removeItem('nitrobridge_settings');
      
      addNotification({
        type: 'warning',
        message: 'All data cleared'
      });
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setNotifications({
        transactions: true,
        recurring: true,
        security: true
      });
      
      addNotification({
        type: 'info',
        message: 'Settings reset to defaults'
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure your NitroBridge preferences and security settings
        </p>
      </div>

      {/* Network Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Network size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Network Settings
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Available Networks
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supportedNetworks.map((network) => (
                  <div
                    key={network.chainId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      wallet?.chainId === network.chainId
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => switchNetwork(network.chainId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {network.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chain ID: {network.chainId}
                        </p>
                        {network.gaslessSupported && (
                          <span className="inline-block mt-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                            Gasless Supported
                          </span>
                        )}
                      </div>
                      {wallet?.chainId === network.chainId && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security & Privacy
            </h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Encryption Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Encryption Key Management
            </label>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={generateEncryptionKey}
                  className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Key size={16} />
                  <span>Generate New Key</span>
                </button>
                
                {encryptionKey && (
                  <button
                    onClick={copyEncryptionKey}
                    className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    <span>Copy Key</span>
                  </button>
                )}
              </div>
              
              {encryptionKey && (
                <div className="relative">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={encryptionKey}
                    readOnly
                    className="w-full pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
              
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Keep your encryption key safe. It's used to encrypt sensitive data locally.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Bell size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications for {key} events
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Download size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Management
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={exportData}
              className="flex flex-col items-center space-y-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={24} className="text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">Export Data</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Download backup of all your data
              </span>
            </button>
            
            <button
              onClick={resetToDefaults}
              className="flex flex-col items-center space-y-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw size={24} className="text-yellow-500" />
              <span className="font-medium text-gray-900 dark:text-white">Reset Settings</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Restore default configuration
              </span>
            </button>
            
            <button
              onClick={clearAllData}
              className="flex flex-col items-center space-y-2 p-4 border border-red-200 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={24} className="text-red-500" />
              <span className="font-medium text-red-600 dark:text-red-400">Clear All Data</span>
              <span className="text-xs text-red-500 dark:text-red-400 text-center">
                Permanently delete all data
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Theme Preference
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose between light and dark mode
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;