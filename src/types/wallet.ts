import { Account } from "@aptos-labs/ts-sdk";

// Enhanced wallet info interface with proper typing
export interface WalletInfo {
  address: string;
  publicKey: string;
  isConnected: boolean;
  network: string;
  name?: string;
  icon?: string;
  url?: string;
  balance?: WalletBalance;
}

// Wallet balance interface with proper typing
export interface WalletBalance {
  balance: number;
  balanceInOctas: bigint;
}

// Wallet connection state
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  walletInfo: WalletInfo | null;
  balance: WalletBalance | null;
  network: string;
  selectedWallet: string | null;
}

// Available wallet information
export interface AvailableWallet {
  name: string;
  icon: string;
  url: string;
  deeplink?: string;
  isInstalled: boolean;
}

// Wallet configuration options
export interface WalletConfig {
  autoConnect?: boolean;
  preferredNetwork?: string;
  walletName?: string;
}

// Transaction information
export interface WalletTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  type: string;
  amount?: number;
  from?: string;
  to?: string;
}

// Wallet error types
export type WalletErrorType =
  | 'CONNECTION_FAILED'
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSACTION_FAILED'
  | 'WALLET_NOT_INSTALLED'
  | 'INVALID_PRIVATE_KEY'
  | 'USER_REJECTED'
  | 'UNKNOWN_ERROR';

export interface WalletError {
  type: WalletErrorType;
  message: string;
  code?: string;
  details?: any;
}