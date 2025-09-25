// Core wallet and transaction types
export interface EthersProvider {
  getBalance: (address: string) => Promise<bigint>;
  getTransactionCount: (address: string) => Promise<number>;
  getTransactionReceipt: (hash: string) => Promise<{ status?: number; gasUsed?: bigint } | null>;
  getFeeData: () => Promise<{ gasPrice?: bigint }>;
  getNetwork: () => Promise<{ chainId: bigint }>;
  getBlockNumber: () => Promise<number>;
  getBlock: (blockNumber: number) => Promise<{ timestamp: number } | null>;
  getTransaction: (hash: string) => Promise<{ blockNumber?: number } | null>;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
  provider: EthersProvider;
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
  connector: () => Promise<WalletConnection>;
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

// WebSocket connection and messaging types for ClearNode
export interface WebSocketConnection {
  isConnected: boolean;
  lastHeartbeat: number;
  reconnectCount: number;
  url: string;
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
  id?: string;
}

// ClearNode WebSocket message types
export type WebSocketMessageType = 
  | 'connect'
  | 'disconnect' 
  | 'heartbeat'
  | 'ping'
  | 'pong'
  | 'assets'
  | 'channel_created'
  | 'channel_updated' 
  | 'channel_closed'
  | 'state_update'
  | 'transaction_update'
  | 'balance_update'
  | 'network_status'
  | 'gas_price_update'
  | 'error'
  | 'subscription'
  | 'unsubscription'
  | 'session_started'
  | 'session_ended'
  | 'participant_joined'
  | 'participant_left'
  | 'protocol_stats';

// ClearNode specific payloads
export interface ChannelCreatedPayload {
  channelId: string;
  participants: string[];
  createdAt: number;
  txHash: string;
}

export interface ChannelUpdatedPayload {
  channelId: string;
  state: {
    version: number;
    data: string;
    timestamp: number;
  };
}

export interface StateUpdatePayload {
  channelId: string;
  stateHash: string;
  version: number;
  timestamp: number;
  participants: string[];
}

export interface TransactionUpdatePayload {
  hash: string;
  status: Transaction['status'];
  gasUsed?: string;
  confirmations?: number;
  blockNumber?: number;
  channelId?: string;
  type?: 'channel_create' | 'channel_close' | 'state_update' | 'challenge';
}

export interface BalanceUpdatePayload {
  address: string;
  balance: string;
  token?: string;
  channelId?: string;
}

export interface NetworkStatusPayload {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  isHealthy: boolean;
  nodeCount: number;
  latency: number;
}

export interface GasPriceUpdatePayload {
  chainId: number;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface SessionPayload {
  sessionId: string;
  channelId: string;
  participants: string[];
  startTime: number;
  endTime?: number;
}

export interface ParticipantPayload {
  sessionId: string;
  participantAddress: string;
  timestamp: number;
}

export interface ProtocolStatsPayload {
  totalChannels: number;
  activeChannels: number;
  totalTransactions: number;
  gaslessTransactions: number;
  totalGasSaved: string;
  activeNodes: number;
  networkLatency: number;
}

export interface WebSocketErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

// Subscription management types
export interface Subscription<T = unknown> {
  id: string;
  type: WebSocketMessageType;
  callback: (payload: T) => void;
  filter?: SubscriptionFilter;
}

export interface SubscriptionFilter {
  address?: string;
  chainId?: number;
  token?: string;
  hash?: string;
}

// WebSocket service status
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';