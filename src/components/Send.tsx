import React from 'react';
import { motion } from 'framer-motion';
import { Send as SendIcon, Zap, DollarSign, User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/app';
import NitroLiteService from '../services/nitrolite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

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
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<SendFormData>({
    mode: 'onChange',
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
    console.log('Form submitted with data:', data);
    
    if (!wallet) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first'
      });
      return;
    }

    // Validate that amount is not empty or zero
    if (!data.amount || parseFloat(data.amount) <= 0) {
      addNotification({
        type: 'error',
        message: 'Please enter a valid amount greater than 0'
      });
      return;
    }

    // Validate recipient address
    if (!data.recipient || data.recipient.trim() === '') {
      addNotification({
        type: 'error',
        message: 'Please enter a valid recipient address'
      });
      return;
    }

    try {
      console.log('Calling sendTransaction with:', data.recipient, data.amount);
      await sendTransaction(data.recipient, data.amount, false); // Always use regular transactions
      
      // Success - clear form and fee estimate
      reset();
      setEstimatedFee('0');
      
      addNotification({
        type: 'success',
        message: 'Transaction sent successfully! Check your wallet for confirmation.'
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      
      // The error handling is now done in the store's sendTransaction function
      // but we can add some additional UI feedback here if needed
      const errorObj = error as { code?: number | string; message?: string };
      
      // Don't show additional notification for user rejection as it's handled in store
      if (!(errorObj?.code === 4001 || 
           errorObj?.code === 'ACTION_REJECTED' || 
           errorObj?.message?.includes('User denied') ||
           errorObj?.message?.includes('user rejected'))) {
        // Only log unexpected errors that aren't user rejections
        console.warn('Unexpected transaction error that may need additional handling:', error);
      }
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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <SendIcon size={24} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Send Cryptocurrency</CardTitle>
                <CardDescription className="text-base">
                  Send ETH with smart transaction management and fee optimization
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Recipient Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label htmlFor="recipient" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Recipient Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <Input
                    id="recipient"
                    {...register('recipient', { 
                      required: 'Recipient address is required',
                      validate: validateAddress
                    })}
                    type="text"
                    placeholder="0x..."
                    className="pl-10"
                  />
                </div>
                {errors.recipient && (
                  <p className="text-sm text-destructive">
                    {errors.recipient.message}
                  </p>
                )}
              </motion.div>

              {/* Amount */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Amount (ETH)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-muted-foreground" />
                  </div>
                  <Input
                    id="amount"
                    {...register('amount', {
                      required: 'Amount is required',
                      validate: validateAmount
                    })}
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
                {wallet && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Available: {parseFloat(wallet.balance).toFixed(4)} ETH
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const maxAmount = (parseFloat(wallet.balance) * 0.99).toFixed(6);
                        setValue('amount', maxAmount, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true
                        });
                      }}
                    >
                      Max
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* Transaction Type Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Regular Transaction
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Standard blockchain transaction with network gas fees. Gasless transactions are currently unavailable.
                </p>
              </motion.div>

              {/* Transaction Summary */}
              {watchedValues.recipient && watchedValues.amount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-blue-50/50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />
                        <span>Transaction Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount:</span>
                          <Badge variant="outline" className="font-mono">
                            {watchedValues.amount} ETH
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Network Fee:</span>
                          <Badge variant="outline" className="font-mono">
                            {estimatedFee} ETH
                          </Badge>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total:</span>
                            <Badge className="font-mono text-base">
                              {(parseFloat(watchedValues.amount) + parseFloat(estimatedFee)).toFixed(6)} ETH
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={!isValid || isTransactionPending || !wallet}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isTransactionPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 h-5 w-5" />
                      Send Transaction
                    </>
                  )}
                </Button>

                {!wallet && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Connect your wallet to send transactions
                  </p>
                )}
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Send;