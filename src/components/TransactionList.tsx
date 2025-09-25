import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Download, 
  Filter, 
  Search,
  Zap,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/app';
import { Transaction } from '../types';
import TransactionService from '../services/transactions';

const TransactionList: React.FC = () => {
  const { transactions } = useAppStore();
  const [filter, setFilter] = React.useState<'all' | 'gasless' | 'regular'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSyncTransactions = async () => {
    setIsSyncing(true);
    try {
      const transactionService = TransactionService.getInstance();
      await transactionService.manualSyncTransactions();
      // Refresh the transactions in the store
      window.location.reload(); // Simple refresh - you might want to use a more elegant state update
    } catch (error) {
      console.error('Error syncing transactions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      const matchesFilter = filter === 'all' || 
        (filter === 'gasless' && tx.isGasless) || 
        (filter === 'regular' && !tx.isGasless);
      
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      
      const matchesSearch = searchTerm === '' || 
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesStatus && matchesSearch;
    });
  }, [transactions, filter, statusFilter, searchTerm]);

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  const exportTransactions = () => {
    // Implementation would generate CSV and download
    console.log('Exporting transactions...');
  };

  const openInExplorer = (hash: string, chainId: number) => {
    const explorerUrl = chainId === 1 
      ? `https://etherscan.io/tx/${hash}`
      : `https://sepolia.etherscan.io/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor all your wallet transactions in real-time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSyncTransactions}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Status'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportTransactions}
            className="flex items-center space-x-2 bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by address or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="gasless">Gasless Only</option>
              <option value="regular">Regular Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Transaction History ({filteredTransactions.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          tx.isGasless ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          {tx.isGasless ? (
                            <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                          ) : (
                            <ArrowUp size={16} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {tx.hash ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}` : 'Pending...'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.amount} {tx.token}
                      </div>
                      {tx.gasUsed && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Gas: {tx.gasUsed}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tx.status)}
                        <span className={`text-sm font-medium ${
                          tx.status === 'confirmed' 
                            ? 'text-green-600 dark:text-green-400'
                            : tx.status === 'pending'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(tx.timestamp), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(tx.timestamp), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.isGasless
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {tx.isGasless ? 'Gasless' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.hash && (
                        <button
                          onClick={() => openInExplorer(tx.hash!, 1)} // Assuming mainnet for now
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No transactions found
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                {searchTerm || filter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by sending your first transaction'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;