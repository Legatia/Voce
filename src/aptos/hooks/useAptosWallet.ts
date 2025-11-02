import { useState, useEffect, useCallback } from "react";
import {
  Account,
  Network,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants
} from "@aptos-labs/ts-sdk";
import {
  DEFAULT_NETWORK,
  AptosNetwork,
  getNetworkConfig,
} from "../config/network";
import {
  createAptosClient,
  generateAccount,
  getAccountFromPrivateKey,
  getAccountBalance,
  formatAddress,
  isValidAddress,
  WalletInfo,
  WalletBalance,
} from "../utils/wallet";
import {
  Wallet,
  WalletFactory,
  PetraWallet,
  MartianWallet,
  PontemWallet
} from "../wallets/AptosWalletAdapter";

interface UseAptosWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  walletInfo: WalletInfo | null;
  balance: WalletBalance | null;
  network: AptosNetwork;
  selectedWallet: string | null;

  // Wallet detection
  availableWallets: WalletInfo[];
  installedWallets: WalletInfo[];

  // Actions
  connect: (walletName: string, privateKey?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: AptosNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;

  // Utilities
  formatAddress: (address: string, length?: number) => string;
  getExplorerUrl: (address?: string) => string;
}

export const useAptosWallet = (): UseAptosWalletReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [network, setNetwork] = useState<AptosNetwork>(DEFAULT_NETWORK);

  // Load saved wallet state from localStorage
  useEffect(() => {
    const savedPrivateKey = localStorage.getItem("aptos_private_key");
    const savedNetwork = localStorage.getItem("aptos_network") as AptosNetwork;

    if (savedNetwork && savedNetwork !== network) {
      setNetwork(savedNetwork);
    }

    if (savedPrivateKey) {
      connect(savedPrivateKey);
    }
  }, []);

  // Update wallet info when account changes
  useEffect(() => {
    if (account) {
      const info: WalletInfo = {
        address: account.accountAddress.toString(),
        publicKey: account.publicKey.toString(),
        isConnected: true,
        network: getNetworkConfig(APTOS_NETWORKS[network]).name,
      };
      setWalletInfo(info);
      setIsConnected(true);

      // Save to localStorage
      localStorage.setItem("aptos_private_key", account.privateKey.toString());
      localStorage.setItem("aptos_network", network);
    } else {
      setWalletInfo(null);
      setIsConnected(false);

      // Clear localStorage
      localStorage.removeItem("aptos_private_key");
      localStorage.removeItem("aptos_network");
    }
  }, [account, network]);

  // Refresh balance when account or network changes
  useEffect(() => {
    if (account && isConnected) {
      refreshBalance();
    }
  }, [account, network, isConnected]);

  const connect = useCallback(async (privateKey?: string) => {
    setIsConnecting(true);
    try {
      let newAccount: Account;

      if (privateKey) {
        if (!isValidKeyFormat(privateKey)) {
          throw new Error("Invalid private key format");
        }
        newAccount = getAccountFromPrivateKey(privateKey);
      } else {
        // Generate new account for demo purposes
        // In production, this would connect to a wallet adapter
        newAccount = generateAccount();
        console.log("Generated new account. Save this private key:", newAccount.privateKey.toString());
      }

      setAccount(newAccount);

      // Show helpful message for new accounts
      if (!privateKey) {
        setTimeout(() => {
          alert(`New account created!\n\nAddress: ${newAccount.accountAddress.toString()}\n\nPrivate Key: ${newAccount.privateKey.toString()}\n\nSave this private key securely. You'll need it to access your account.`);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setIsConnected(false);
  }, []);

  const switchNetworkCallback = useCallback(async (newNetwork: AptosNetwork) => {
    try {
      setNetwork(newNetwork);
      // Balance will be automatically refreshed by the useEffect
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!account) return;

    try {
      const aptosNetwork = APTOS_NETWORKS[network] as Network;
      const balanceData = await getAccountBalance(
        account.accountAddress.toString(),
        aptosNetwork
      );
      setBalance(balanceData);
    } catch (error) {
      console.error("Failed to refresh balance:", error);
      setBalance({
        balance: 0,
        balanceInOctas: BigInt(0),
      });
    }
  }, [account, network]);

  const getExplorerUrl = useCallback((address?: string) => {
    const config = getNetworkConfig(network);
    const addressToUse = address || account?.accountAddress.toString();
    return `${config.explorerUrl}/account/${addressToUse}`;
  }, [network, account]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    account,
    walletInfo,
    balance,
    network,

    // Actions
    connect,
    disconnect,
    switchNetwork: switchNetworkCallback,
    refreshBalance,

    // Utilities
    formatAddress,
    getExplorerUrl,
  };
};

// Helper function to validate private key format
const isValidKeyFormat = (privateKey: string): boolean => {
  try {
    // Try to create a private key from the string
    new Ed25519PrivateKey(privateKey);
    return true;
  } catch {
    return false;
  }
};

// Network mapping
const APTOS_NETWORKS = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
} as const;