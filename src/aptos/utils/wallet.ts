import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import { AptosNetwork, getNetworkConfig } from "../config/network";

const DEFAULT_NETWORK: Network = Network.TESTNET;

// Wallet connection types
export interface WalletInfo {
  address: string;
  publicKey: string;
  isConnected: boolean;
  network: string;
}

export interface WalletBalance {
  balance: number; // in APT
  balanceInOctas: bigint;
}

// Create Aptos client instance
export const createAptosClient = (network: Network = DEFAULT_NETWORK) => {
  const config = new AptosConfig({ network });
  return new Aptos(config);
};

// Generate a new account (for development/testing)
export const generateAccount = (): Account => {
  const privateKey = Ed25519PrivateKey.generate();
  return Account.fromPrivateKey({ privateKey });
};

// Get account from private key (for development/testing)
export const getAccountFromPrivateKey = (privateKeyString: string): Account => {
  const privateKey = new Ed25519PrivateKey(privateKeyString);
  return Account.fromPrivateKey({ privateKey });
};

// Get account balance
export const getAccountBalance = async (
  accountAddress: string,
  network: Network = DEFAULT_NETWORK
): Promise<WalletBalance> => {
  try {
    const aptos = createAptosClient(network);
    const resources = await aptos.getAccountResources({
      accountAddress,
    });

    // Find the coin store resource
    const coinStore = resources.find(
      (resource: any) => resource.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );

    const balanceInOctas = BigInt(coinStore?.data?.coin?.value || 0);
    const balanceInApt = Number(balanceInOctas) / 100_000_000; // Convert octas to APT

    return {
      balance: balanceInApt,
      balanceInOctas,
    };
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return {
      balance: 0,
      balanceInOctas: BigInt(0),
    };
  }
};

// Check if account exists
export const checkAccountExists = async (
  accountAddress: string,
  network: Network = DEFAULT_NETWORK
): Promise<boolean> => {
  try {
    const aptos = createAptosClient(network);
    await aptos.getAccountInfo({ accountAddress });
    return true;
  } catch (error) {
    return false;
  }
};

// Get account resources
export const getAccountResources = async (
  accountAddress: string,
  network: Network = DEFAULT_NETWORK
) => {
  try {
    const aptos = createAptosClient(network);
    return await aptos.getAccountResources({ accountAddress });
  } catch (error) {
    console.error("Error fetching account resources:", error);
    return [];
  }
};

// Format address for display
export const formatAddress = (address: string, length: number = 6): string => {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Validate address format
export const isValidAddress = (address: string): boolean => {
  // Basic validation - starts with "0x" and is proper length
  return /^0x[a-fA-F0-9]{64}$/.test(address);
};

// Network utilities
export const switchNetwork = async (network: Network): Promise<void> => {
  // This would typically involve wallet adapter functionality
  // For now, we'll just return the new network configuration
  console.log(`Switching to network: ${network}`);
  return Promise.resolve();
};

// Get current network name
export const getCurrentNetworkName = (network: Network): string => {
  const config = getNetworkConfig(network as any);
  return config.name;
};

// Gas estimation utilities
export const estimateGasFee = async (
  fromAddress: string,
  toAddress: string,
  amount: number,
  network: Network = DEFAULT_NETWORK
): Promise<number> => {
  try {
    const aptos = createAptosClient(network);
    // This is a simplified gas estimation
    // In a real implementation, you'd simulate the transaction
    const estimatedGas = 0.001; // Default gas estimate in APT
    return estimatedGas;
  } catch (error) {
    console.error("Error estimating gas fee:", error);
    return 0.001; // Default fallback
  }
};

// Transaction history
export const getTransactionHistory = async (
  accountAddress: string,
  limit: number = 10,
  network: Network = DEFAULT_NETWORK
) => {
  try {
    const aptos = createAptosClient(network);
    const transactions = await aptos.getAccountTransactions({
      accountAddress,
      options: { limit },
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
};

// Get transaction details
export const getTransactionDetails = async (
  transactionHash: string,
  network: Network = DEFAULT_NETWORK
) => {
  try {
    const aptos = createAptosClient(network);
    return await aptos.getTransactionByHash({ transactionHash });
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
};