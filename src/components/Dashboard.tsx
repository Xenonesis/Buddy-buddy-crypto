import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Zap, 
  ArrowUp, 
  ArrowDown,
  Activity,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../store/app';

const Dashboard: React.FC = () => {
  const { wallet, transactions, refreshData, refreshWalletBalance } = useAppStore();

  // Refresh data when component mounts and wallet connects
  React.useEffect(() => {
    if (wallet) {
      refreshData();
      
      // Set up periodic balance refresh every 30 seconds
      const balanceInterval = setInterval(() => {
        refreshWalletBalance();
      }, 30000);
      
      return () => clearInterval(balanceInterval);
    }
  }, [wallet, refreshData, refreshWalletBalance]);

  // Calculate statistics and real-time data
  const stats = React.useMemo(() => {
    const totalTx = transactions.length;
    const gaslessTx = transactions.filter(tx => tx.isGasless).length;
    const confirmedTx = transactions.filter(tx => tx.status === 'confirmed').length;
    const pendingTx = transactions.filter(tx => tx.status === 'pending').length;
    
    const totalVolume = transactions
      .filter(tx => tx.status === 'confirmed')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    // Calculate 24h changes for real data
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recent24hTx = transactions.filter(tx => tx.timestamp > last24h && tx.status === 'confirmed');
    const previous24hStart = last24h - (24 * 60 * 60 * 1000);
    const previous24hTx = transactions.filter(tx => 
      tx.timestamp > previous24hStart && 
      tx.timestamp <= last24h && 
      tx.status === 'confirmed'
    );
    
    const recent24hVolume = recent24hTx.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const previous24hVolume = previous24hTx.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const volumeChange = previous24hVolume > 0 
      ? (((recent24hVolume - previous24hVolume) / previous24hVolume) * 100).toFixed(1)
      : recent24hVolume > 0 ? '+100.0' : '0.0';
    
    const txCountChange = previous24hTx.length > 0
      ? (((recent24hTx.length - previous24hTx.length) / previous24hTx.length) * 100).toFixed(1)
      : recent24hTx.length > 0 ? '+100.0' : '0.0';

    return {
      totalTx,
      gaslessTx,
      confirmedTx,
      pendingTx,
      totalVolume: totalVolume.toFixed(4),
      gaslessPct: totalTx > 0 ? ((gaslessTx / totalTx) * 100).toFixed(1) : '0',
      volumeChange: volumeChange.startsWith('-') ? volumeChange : `+${volumeChange}`,
      txCountChange: txCountChange.startsWith('-') ? txCountChange : `+${txCountChange}`
    };
  }, [transactions]);

  const statCards = [
    {
      title: 'Total Balance',
      value: wallet ? `${parseFloat(wallet.balance).toFixed(4)} ETH` : '0.0000 ETH',
      icon: Wallet,
      color: 'bg-blue-500',
      change: wallet ? 'Live Balance' : 'Connect Wallet'
    },
    {
      title: 'Total Transactions',
      value: stats.totalTx.toString(),
      icon: Activity,
      color: 'bg-green-500',
      change: stats.totalTx > 0 ? `${stats.txCountChange}% (24h)` : 'No transactions yet'
    },
    {
      title: 'Gasless Transactions',
      value: `${stats.gaslessPct}%`,
      icon: Zap,
      color: 'bg-purple-500',
      change: `${stats.gaslessTx} of ${stats.totalTx} total`
    },
    {
      title: 'Volume Transacted',
      value: `${stats.totalVolume} ETH`,
      icon: DollarSign,
      color: 'bg-orange-500',
      change: stats.totalVolume !== '0.0000' ? `${stats.volumeChange}% (24h)` : 'No volume yet'
    }
  ];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to NitroBridge - Your gasless crypto gateway
          </p>
        </div>
        
        {wallet && (
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connected to {wallet.chainId === 1 ? 'Ethereum Mainnet' : 'Sepolia Testnet'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Send */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <ArrowUp size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Send
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Send cryptocurrency instantly with zero gas fees using NitroLite protocol
          </p>
          
          <button
            onClick={() => useAppStore.getState().setActiveTab('send')}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Send Now
          </button>
        </motion.div>

        {/* Recurring Payments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-lg">
              <Clock size={20} className="text-secondary-600 dark:text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recurring Payments
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Automate your payments with scheduled, gasless transactions
          </p>
          
          <button
            onClick={() => useAppStore.getState().setActiveTab('recurring')}
            className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Setup Recurring
          </button>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
            <button
              onClick={() => useAppStore.getState().setActiveTab('transactions')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    tx.isGasless ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    {tx.isGasless ? (
                      <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                    ) : (
                      <ArrowUp size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tx.amount} {tx.token}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                      {tx.isGasless && <span className="ml-2 text-purple-600 dark:text-purple-400">• Gasless</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No transactions yet. Start by sending your first gasless transaction!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;