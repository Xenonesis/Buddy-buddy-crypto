import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Calendar,
  DollarSign,
  User,
  MoreVertical
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { useAppStore } from '../store/app';
import { RecurringPayment } from '../types';

interface RecurringFormData {
  recipient: string;
  amount: string;
  frequency: RecurringPayment['frequency'];
}

const Recurring: React.FC = () => {
  const { recurringPayments, createRecurringPayment, addNotification } = useAppStore();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<RecurringFormData>();

  const onSubmit = (data: RecurringFormData) => {
    try {
      createRecurringPayment(data.recipient, data.amount, data.frequency);
      reset();
      setShowCreateForm(false);
      addNotification({
        type: 'success',
        message: 'Recurring payment created successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to create recurring payment'
      });
    }
  };

  const validateAddress = (address: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address) || 'Please enter a valid Ethereum address';
  };

  const validateAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      return 'Amount must be greater than 0';
    }
    return true;
  };

  const getFrequencyLabel = (frequency: RecurringPayment['frequency']) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const getNextPaymentText = (nextPayment: number) => {
    const now = Date.now();
    const diff = nextPayment - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const activePayments = recurringPayments.filter(p => p.isActive);
  const inactivePayments = recurringPayments.filter(p => !p.isActive);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recurring Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate your payments with scheduled, gasless transactions
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Payment</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Play size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activePayments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Monthly</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activePayments
                  .filter(p => p.frequency === 'monthly')
                  .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  .toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next Payment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activePayments.length > 0 
                  ? getNextPaymentText(Math.min(...activePayments.map(p => p.nextPayment)))
                  : 'None'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Payments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Active Payments
          </h2>
        </div>
        
        <div className="p-6">
          {activePayments.length > 0 ? (
            <div className="space-y-4">
              {activePayments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Clock size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {payment.amount} ETH
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {getFrequencyLabel(payment.frequency)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To: {payment.to.slice(0, 6)}...{payment.to.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Next: {format(new Date(payment.nextPayment), 'MMM dd, yyyy')} • 
                        Completed: {payment.completedPayments}
                        {payment.totalPayments > 0 && ` / ${payment.totalPayments}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getNextPaymentText(payment.nextPayment)}
                    </span>
                    
                    <div className="relative">
                      <button
                        onClick={() => setSelectedPayment(
                          selectedPayment === payment.id ? null : payment.id
                        )}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {selectedPayment === payment.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10 min-w-[120px]"
                        >
                          <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                            <Pause size={16} />
                            <span>Pause</span>
                          </button>
                          <button className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No active recurring payments. Create your first automated payment!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Recurring Payment
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <input
                    {...register('recipient', { 
                      required: 'Recipient address is required',
                      validate: validateAddress
                    })}
                    type="text"
                    placeholder="0x..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                {errors.recipient && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.recipient.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (ETH)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    {...register('amount', {
                      required: 'Amount is required',
                      validate: validateAmount
                    })}
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  {...register('frequency', { required: 'Frequency is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Recurring;