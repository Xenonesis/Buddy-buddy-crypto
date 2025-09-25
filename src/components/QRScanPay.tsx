import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Scan, 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  X, 
  Wallet,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useAppStore } from '../store/app';
import WalletService from '../services/wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import QRCode from 'qrcode';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

interface PaymentRequest {
  address: string;
  amount?: string;
  token?: string;
  message?: string;
  chainId?: number;
}

const QRScanPay: React.FC = () => {
  const { wallet, sendTransaction, isTransactionPending } = useAppStore();
  const [activeMode, setActiveMode] = useState<'generate' | 'scan' | 'main'>('main');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [scannedData, setScannedData] = useState<PaymentRequest | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QR Code states
  const [generateForm, setGenerateForm] = useState({
    amount: '',
    message: '',
    token: 'ETH'
  });

  // Payment confirmation states
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [networkSwitchError, setNetworkSwitchError] = useState<string | null>(null);

  // Generate QR Code for receiving payments
  const generateQRCode = async () => {
    if (!wallet) return;

    // Create ethereum payment URI
    let uri = `ethereum:${wallet.address}@${wallet.chainId}`;
    
    if (generateForm.amount) {
      uri += `?value=${parseFloat(generateForm.amount) * 1e18}`;
    }
    
    if (generateForm.message) {
      const separator = generateForm.amount ? '&' : '?';
      uri += `${separator}message=${encodeURIComponent(generateForm.message)}`;
    }

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Initialize QR scanner
  const initializeScanner = () => {
    if (!scannerRef.current) return;

    const qrScanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      false
    );

    qrScanner.render(
      (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        handleQRCodeScanned(decodedText);
        qrScanner.clear();
        setIsScanning(false);
      },
      (error) => {
        console.warn('QR scan error:', error);
      }
    );

    setScanner(qrScanner);
    setIsScanning(true);
  };

  // Handle scanned QR code
  const handleQRCodeScanned = (decodedText: string) => {
    try {
      let paymentData: PaymentRequest;

      if (decodedText.startsWith('ethereum:')) {
        // Parse ethereum URI
        const uri = new URL(decodedText);
        const pathParts = uri.pathname.split('@');
        const address = pathParts[0];
        const chainId = pathParts.length > 1 ? parseInt(pathParts[1]) : undefined;
        const searchParams = uri.searchParams;
        
        paymentData = {
          address,
          chainId,
          amount: searchParams.get('value') ? (parseInt(searchParams.get('value') || '0') / 1e18).toString() : undefined,
          message: searchParams.get('message') || undefined,
          token: 'ETH'
        };
      } else if (decodedText.startsWith('0x') && decodedText.length === 42) {
        // Simple wallet address
        paymentData = {
          address: decodedText,
          token: 'ETH'
        };
      } else {
        // Try to parse as JSON
        const parsed = JSON.parse(decodedText);
        paymentData = parsed;
      }

      setScannedData(paymentData);
      setShowPaymentConfirm(true);
    } catch (error) {
      console.error('Error parsing QR code:', error);
      alert('Invalid QR code format. Please scan a valid payment QR code.');
    }
  };

  // Handle file upload for QR scanning
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-file-scanner');
      
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQRCodeScanned(decodedText);
      
      html5QrCode.clear();
    } catch (error) {
      console.error('Error scanning file:', error);
      alert('Could not scan QR code from file. Please try again.');
    }
  };

  // Copy QR data to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `payment-qr-${wallet?.address.slice(0, 8)}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  // Process payment
  const processPayment = async () => {
    if (!scannedData || !wallet) return;

    try {
      setNetworkSwitchError(null);
      
      // Check if we need to switch networks
      if (scannedData.chainId && scannedData.chainId !== wallet.chainId) {
        setIsSwitchingNetwork(true);
        
        try {
          const walletService = WalletService.getInstance();
          await walletService.switchNetwork(scannedData.chainId);
          
          // Give a moment for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh wallet connection to get updated chainId
          const connection = walletService.getConnection();
          if (connection && connection.chainId !== scannedData.chainId) {
            throw new Error(`Failed to switch to network with chain ID ${scannedData.chainId}`);
          }
        } catch (switchError) {
          console.error('Network switch failed:', switchError);
          setNetworkSwitchError(
            `Please switch to the ${getNetworkName(scannedData.chainId)} network (Chain ID: ${scannedData.chainId}) in your wallet to complete this payment.`
          );
          setIsSwitchingNetwork(false);
          return;
        }
        
        setIsSwitchingNetwork(false);
      }

      await sendTransaction(
        scannedData.address, 
        scannedData.amount || '0', 
        false
      );
      
      setShowPaymentConfirm(false);
      setScannedData(null);
      setActiveMode('main');
    } catch (error) {
      console.error('Payment failed:', error);
      setIsSwitchingNetwork(false);
    }
  };

  // Helper function to get network name
  const getNetworkName = (chainId: number): string => {
    const networkNames: Record<number, string> = {
      1: 'Ethereum Mainnet',
      137: 'Polygon Mainnet',
      11155111: 'Sepolia Testnet'
    };
    return networkNames[chainId] || `Network ${chainId}`;
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.clear();
      }
    };
  }, [scanner]);

  // Memoize generateQRCode to fix dependency issues
  const memoizedGenerateQRCode = useCallback(generateQRCode, [wallet, generateForm]);

  // Generate QR code when form changes
  useEffect(() => {
    if (activeMode === 'generate' && wallet) {
      memoizedGenerateQRCode();
    }
  }, [activeMode, wallet, memoizedGenerateQRCode]);

  if (!wallet) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode size={24} />
            <span>QR Scan & Pay</span>
          </CardTitle>
          <CardDescription>
            Connect your wallet to use QR code payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Please connect your wallet to continue
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Payment Confirmation Modal
  if (showPaymentConfirm && scannedData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
        >
          <h3 className="text-lg font-bold mb-4">Confirm Payment</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">To Address:</span>
              <p className="font-mono text-sm bg-muted p-2 rounded">
                {scannedData.address}
              </p>
            </div>
            
            {Boolean(scannedData.chainId) && (
              <div>
                <span className="text-sm text-muted-foreground">Network:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={scannedData.chainId === wallet?.chainId ? 'default' : 'destructive'}>
                    {getNetworkName(scannedData.chainId)} (ID: {scannedData.chainId})
                  </Badge>
                  {scannedData.chainId !== wallet?.chainId && (
                    <p className="text-xs text-orange-600">
                      Network switch required
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {scannedData.amount && (
              <div>
                <span className="text-sm text-muted-foreground">Amount:</span>
                <p className="text-lg font-bold">
                  {scannedData.amount} {scannedData.token || 'ETH'}
                </p>
              </div>
            )}
            
            {scannedData.message && (
              <div>
                <span className="text-sm text-muted-foreground">Message:</span>
                <p className="text-sm">{scannedData.message}</p>
              </div>
            )}
            
            {networkSwitchError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  {networkSwitchError}
                </p>
              </div>
            )}
            
            {isSwitchingNetwork && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Switching to {getNetworkName(scannedData.chainId || 0)} network...
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowPaymentConfirm(false);
                  setNetworkSwitchError(null);
                }}
                variant="outline"
                className="flex-1"
                disabled={isSwitchingNetwork}
              >
                Cancel
              </Button>
              <Button
                onClick={processPayment}
                disabled={isTransactionPending || isSwitchingNetwork}
                className="flex-1"
              >
                {(() => {
                  if (isSwitchingNetwork) return 'Switching Network...';
                  if (isTransactionPending) return 'Processing...';
                  if (scannedData.chainId && scannedData.chainId !== wallet?.chainId) return 'Switch & Pay';
                  return 'Pay Now';
                })()}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main menu
  if (activeMode === 'main') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode size={24} />
              <span>QR Scan & Pay</span>
            </CardTitle>
            <CardDescription>
              Generate QR codes to receive payments or scan to send payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generate QR */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMode('generate')}
                className="cursor-pointer"
              >
                <Card className="h-full border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <QrCode size={48} className="text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Generate QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a QR code to receive payments
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Scan QR */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMode('scan')}
                className="cursor-pointer"
              >
                <Card className="h-full border-2 border-dashed border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Scan size={48} className="text-green-500 mb-4" />
                    <h3 className="font-semibold mb-2">Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan a QR code to make a payment
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate QR Code view
  if (activeMode === 'generate') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveMode('main')}
          >
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-xl font-bold">Generate Payment QR</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Configure your payment request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="amount-input" className="text-sm font-medium">Amount (optional)</label>
              <Input
                id="amount-input"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={generateForm.amount}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="message-input" className="text-sm font-medium">Message (optional)</label>
              <Input
                id="message-input"
                placeholder="Payment for..."
                value={generateForm.message}
                onChange={(e) => setGenerateForm(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>

            <div className="text-sm">
              <span className="font-medium">Your Address:</span>
              <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                {wallet.address}
              </p>
            </div>
          </CardContent>
        </Card>

        {qrCodeUrl && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCodeUrl} alt="Payment QR Code" className="max-w-full" />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => copyToClipboard(wallet.address)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </Button>
                  
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Scan QR Code view
  if (activeMode === 'scan') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (scanner && isScanning) {
                scanner.clear();
                setIsScanning(false);
              }
              setActiveMode('main');
            }}
          >
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-xl font-bold">Scan Payment QR</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {!isScanning ? (
                <div className="space-y-4">
                  <Button
                    onClick={initializeScanner}
                    className="w-full"
                    size="lg"
                  >
                    <Camera size={20} className="mr-2" />
                    Start Camera Scan
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">or</div>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Upload size={20} className="mr-2" />
                    Upload QR Image
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div id="qr-scanner" ref={scannerRef}></div>
                  <div id="qr-file-scanner" className="hidden"></div>
                  
                  <Button
                    onClick={() => {
                      if (scanner) {
                        scanner.clear();
                        setIsScanning(false);
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <X size={16} className="mr-2" />
                    Stop Scanning
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default QRScanPay;