import React from 'react';
import { motion } from 'framer-motion';
import { Send as SendIcon, Zap, DollarSign, User, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/app';
import NitroLiteService from '../services/nitrolite';

interface SendFormData {
  recipient: string;
  amount: string;
  useGasless: boolean;
}

const Send: React.FC = () => {
  const { wallet, isTransactionPending, sendTransaction, addNotification } = useAppStore();
  const [estimatedFee, setEstimatedFee] = React.useState<string>('0');
  const [isGaslessAvailable, setIsGaslessAvailable] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<SendFormData>({
    defaultValues: {
      recipient: '',
      amount: '',
      useGasless: true
    }
  });

  const watchedValues = watch();

  // Check gasless availability on mount
  React.useEffect(() => {
    const nitroLiteService = NitroLiteService.getInstance();
    setIsGaslessAvailable(nitroLiteService.isGaslessAvailable());
  }, [wallet]);

  // Estimate transaction fee when form changes
  React.useEffect(() => {
    const estimateFee = async () => {
      if (watchedValues.recipient && watchedValues.amount && parseFloat(watchedValues.amount) > 0) {
        try {
          // Since gasless is disabled, always calculate regular gas fees
          if (wallet && wallet.provider) {
            const { ethers } = await import('ethers');
            const provider = wallet.provider;
            const feeData = await provider.getFeeData();
            const gasLimit = 21000; // Standard ETH transfer
            const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
            const gasCost = BigInt(gasLimit) * gasPrice;
            setEstimatedFee(ethers.formatEther(gasCost));
          } else {
            // Fallback estimate
            setEstimatedFee('0.002');
          }
        } catch (error) {
          console.error('Fee estimation failed:', error);
          setEstimatedFee('0.002'); // Safe fallback
        }
      } else {
        setEstimatedFee('0');
      }
    };

    const debounceTimer = setTimeout(estimateFee, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedValues.recipient, watchedValues.amount, wallet]);

  const onSubmit = async (data: SendFormData) => {
    if (!wallet) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first'
      });
      return;
    }

    try {
      await sendTransaction(data.recipient, data.amount, false); // Always use regular transactions
      reset();
      setEstimatedFee('0');
    } catch (error) {
      console.error('Transaction failed:', error);
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
    if (wallet && num > parseFloat(wallet.balance)) {
      return 'Insufficient balance';
    }
    return true;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <SendIcon size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Send Cryptocurrency
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Send ETH with smart transaction management and fee optimization
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                {...register('recipient', { 
                  required: 'Recipient address is required',
                  validate: validateAddress
                })}
                type="text"
                placeholder="0x..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            {errors.recipient && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.recipient.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (ETH)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={20} className="text-gray-400" />
              </div>
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  validate: validateAmount
                })}
                type="number"
                step="0.000001"
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {wallet && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {parseFloat(wallet.balance).toFixed(4)} ETH
                  </span>
                </div>
              )}
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Transaction Type Info */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={16} className="text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Regular Transaction</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Standard blockchain transaction with network gas fees. Gasless transactions are currently unavailable.
            </p>
          </div>

          {/* Transaction Summary */}
          {watchedValues.recipient && watchedValues.amount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
            >
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                Transaction Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {watchedValues.amount} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Network Fee:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {estimatedFee} ETH
                  </span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Total:</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {(parseFloat(watchedValues.amount) + parseFloat(estimatedFee)).toFixed(6)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isTransactionPending || !wallet}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isTransactionPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <SendIcon size={20} />
                <span>Send Transaction</span>
              </>
            )}
          </button>

          {!wallet && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Connect your wallet to send transactions
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default Send;