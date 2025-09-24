// Core wallet and transaction types
export interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
  provider: any;
  isConnected: boolean;
}

export interface Transaction {
  id: string;
  hash?: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  isGasless: boolean;
  network: string;
}

export interface RecurringPayment {
  id: string;
  to: string;
  amount: string;
  token: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextPayment: number;
  isActive: boolean;
  totalPayments: number;
  completedPayments: number;
  createdAt: number;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  gaslessSupported: boolean;
}

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export interface WalletProvider {
  name: string;
  icon: string;
  connector: any;
  isInstalled: boolean;
}

export interface GaslessTransaction {
  to: string;
  amount: string;
  token: string;
  nonce: number;
  signature: string;
  relayerFee?: string;
}