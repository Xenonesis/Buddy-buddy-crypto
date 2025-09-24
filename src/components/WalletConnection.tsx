import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/app';

const WalletConnection: React.FC = () => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useAppStore();
  const [showProviders, setShowProviders] = React.useState(false);
  const [showWalletMenu, setShowWalletMenu] = React.useState(false);

  const providers = [
    {
      id: 'metamask' as const,
      name: 'MetaMask',
      icon: '🦊',
      available: !!window.ethereum
    },
    {
      id: 'walletconnect' as const,
      name: 'WalletConnect',
      icon: '🔗',
      available: true
    }
  ];

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
    }
  };

  const openInExplorer = () => {
    if (wallet?.address) {
      const explorerUrl = wallet.chainId === 1 
        ? `https://etherscan.io/address/${wallet.address}`
        : `https://sepolia.etherscan.io/address/${wallet.address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  if (wallet) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWalletMenu(!showWalletMenu)}
          className="w-full flex items-center justify-between p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </div>
              <div className="text-xs opacity-75">
                {parseFloat(wallet.balance).toFixed(4)} ETH
              </div>
            </div>
          </div>
          <ChevronDown size={16} className={`transition-transform ${showWalletMenu ? 'rotate-180' : ''}`} />
        </motion.button>

        {showWalletMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
          >
            <button
              onClick={copyAddress}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Copy size={16} />
              <span>Copy Address</span>
            </button>
            <button
              onClick={openInExplorer}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ExternalLink size={16} />
              <span>View in Explorer</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <button
              onClick={disconnectWallet}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowProviders(!showProviders)}
        disabled={isConnecting}
        className="w-full flex items-center justify-center space-x-2 p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet size={20} />
        <span className="font-medium">
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </span>
        {!isConnecting && <ChevronDown size={16} className={`transition-transform ${showProviders ? 'rotate-180' : ''}`} />}
      </motion.button>

      {showProviders && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          {providers.map((provider) => (
            <motion.button
              key={provider.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => connectWallet(provider.id)}
              disabled={!provider.available || isConnecting}
              className="w-full flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">{provider.icon}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {provider.name}
                </div>
                {!provider.available && (
                  <div className="text-xs text-red-500">Not available</div>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default WalletConnection;