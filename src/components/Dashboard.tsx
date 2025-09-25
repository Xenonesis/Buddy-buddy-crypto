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
  DollarSign,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { useAppStore } from '../store/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

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
            Welcome to Budget Buddy - Your smart crypto companion
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
          const isPositive = stat.change.includes('+');
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group"
            >
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color} transition-transform group-hover:scale-110`}>
                    <Icon size={16} className="text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {stat.change.includes('%') && (
                      <>
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                      </>
                    )}
                    <span className={stat.change.includes('%') ? (isPositive ? 'text-green-600' : 'text-red-600') : ''}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
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
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <ArrowUp size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Quick Send</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                Send cryptocurrency instantly with zero gas fees using NitroLite protocol
              </CardDescription>
              
              <Button
                onClick={() => useAppStore.getState().setActiveTab('send')}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                Send Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recurring Payments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Recurring Payments</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                Automate your payments with scheduled, gasless transactions
              </CardDescription>
              
              <Button
                onClick={() => useAppStore.getState().setActiveTab('recurring')}
                className="w-full bg-purple-500 hover:bg-purple-600"
                size="lg"
              >
                Setup Recurring
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity size={20} />
                <span>Recent Transactions</span>
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => useAppStore.getState().setActiveTab('transactions')}
                className="text-sm"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      tx.isGasless ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {tx.isGasless ? (
                        <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                      ) : (
                        <ArrowUp size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">
                          {tx.amount} {tx.token}
                        </p>
                        <Badge
                          variant={tx.status === 'confirmed' ? 'default' : 
                                  tx.status === 'pending' ? 'secondary' : 'destructive'}
                          className="ml-2"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
                        {tx.isGasless && (
                          <Badge variant="outline" className="text-xs">
                            Gasless
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No transactions yet. Start by sending your first gasless transaction!
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => useAppStore.getState().setActiveTab('send')}
                  >
                    Send First Transaction
                  </Button>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;