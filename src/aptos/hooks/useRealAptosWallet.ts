import { useState, useEffect, useCallback } from "react";
import {
  Account,
  Network,
  Ed25519PrivateKey,
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
  WalletBalance,
} from "../utils/wallet";
import { WalletInfo as WalletConnectionInfo } from "@/types/wallet";
import {
  Wallet,
  WalletFactory,
  WalletInfo as WalletAdapterInfo,
} from "../wallets/AptosWalletAdapter";
import { useToast } from "@/hooks/use-toast";

interface UseRealAptosWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  walletInfo: WalletConnectionInfo | null;
  balance: WalletBalance | null;
  network: string; // Return as string for context compatibility
  selectedWallet: string | null;

  // Wallet detection
  availableWallets: WalletAdapterInfo[];
  installedWallets: WalletAdapterInfo[];

  // Actions
  connect: (walletName: string, privateKey?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => Promise<void>; // Accept string for compatibility
  refreshBalance: () => Promise<void>;

  // Utilities
  formatAddress: (address: string, length?: number) => string;
  getExplorerUrl: (address?: string) => string;
}

export const useRealAptosWallet = (): UseRealAptosWalletReturn => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletConnectionInfo | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [network, setNetwork] = useState<AptosNetwork>(DEFAULT_NETWORK);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);

  // Detect available wallets
  const [availableWallets] = useState<WalletAdapterInfo[]>(WalletFactory.getAvailableWallets());
  const [installedWallets, setInstalledWallets] = useState<WalletAdapterInfo[]>([]);

  // Detect installed wallets on mount
  useEffect(() => {
    setInstalledWallets(WalletFactory.detectInstalledWallets());
  }, []);

  // Load saved wallet state from localStorage
  useEffect(() => {
    const savedNetwork = localStorage.getItem("aptos_network") as AptosNetwork;
    const savedWalletName = localStorage.getItem("aptos_wallet_name");
    const savedConnectionState = localStorage.getItem("aptos_connection_state");

    // Restore connection state if available
    if (savedConnectionState) {
      try {
        const connectionState = JSON.parse(savedConnectionState);
        if (connectionState.isConnected && connectionState.account && connectionState.walletInfo) {
          console.log("Restoring wallet state from localStorage:", connectionState);

          // Restore network first
          if (savedNetwork) {
            setNetwork(savedNetwork);
          }

          // Restore wallet name
          if (savedWalletName) {
            setSelectedWallet(savedWalletName);
          }

          // Restore connection state from localStorage
          setIsConnected(true);
          setAccount(connectionState.account);
          setWalletInfo(connectionState.walletInfo);
          setBalance(connectionState.balance);

          // Try to restore the actual wallet connection
          if (savedWalletName) {
            const wallet = WalletFactory.createWallet(savedWalletName);
            setCurrentWallet(wallet);
          }

          console.log("Wallet state restored successfully");
        }
      } catch (error) {
        console.error("Failed to restore wallet state:", error);
        // Clear corrupted data
        localStorage.removeItem("aptos_connection_state");
      }
    }
  }, []);

  // Update wallet info when account changes
  useEffect(() => {
    if (account && currentWallet) {
      const info: WalletConnectionInfo = {
        address: account.accountAddress.toString(),
        publicKey: account.publicKey.toString(),
        isConnected: true,
        network: getNetworkConfig(APTOS_NETWORKS[network]).name,
      };
      setWalletInfo(info);
      setIsConnected(true);

      // Save complete connection state to localStorage
      localStorage.setItem("aptos_network", network);
      localStorage.setItem("aptos_wallet_name", selectedWallet || "");
      localStorage.setItem("aptos_connection_state", JSON.stringify({
        isConnected: true,
        account: account,
        walletInfo: info,
        balance: balance,
        network: network,
        selectedWallet: selectedWallet,
      }));
    } else {
      setWalletInfo(null);
      setIsConnected(false);
      setCurrentWallet(null);
    }
  }, [account, network, currentWallet, selectedWallet]);

  // Refresh balance when account or network changes
  useEffect(() => {
    if (account && isConnected) {
      refreshBalance();
    }
  }, [account, network, isConnected]);

  const connect = useCallback(async (walletName: string, privateKey?: string) => {
    setIsConnecting(true);
    setSelectedWallet(walletName);

    try {
      if (privateKey) {
        // Fallback to demo wallet with private key
        if (!isValidPrivateKeyFormat(privateKey)) {
          throw new Error("Invalid private key format");
        }
        const newAccount = getAccountFromPrivateKey(privateKey);
        setAccount(newAccount);

        // Create mock wallet info for private key wallet
        const info: WalletConnectionInfo = {
          address: newAccount.accountAddress.toString(),
          publicKey: newAccount.publicKey.toString(),
          isConnected: true,
          network: getNetworkConfig(APTOS_NETWORKS[network]).name,
        };
        setWalletInfo(info);
        setIsConnected(true);

        console.log("Connected with private key. Save this private key:", newAccount.privateKey.toString());
      } else {
        // Connect to real wallet
        const wallet = WalletFactory.createWallet(walletName);
        const newAccount = await wallet.connect();

        setAccount(newAccount);
        setCurrentWallet(wallet);
        setIsConnected(true);

        // Set wallet info for real wallet connection
        if (newAccount) {
          const info: WalletConnectionInfo = {
            address: newAccount.accountAddress?.toString() || "",
            publicKey: (newAccount as any).publicKey || "",
            isConnected: true,
            network: getNetworkConfig(APTOS_NETWORKS[network]).name,
          };
          setWalletInfo(info);
          setIsConnected(true);
          setSelectedWallet(walletName);

          // Save complete connection state to localStorage for real wallet
          localStorage.setItem("aptos_network", network);
          localStorage.setItem("aptos_wallet_name", walletName);
          localStorage.setItem("aptos_connection_state", JSON.stringify({
            isConnected: true,
            account: newAccount,
            walletInfo: info,
            balance: balance,
            network: network,
            selectedWallet: walletName,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // If wallet is not installed, show helpful message
      if (errorMessage.includes("not installed")) {
        const walletInfo = WalletFactory.getAvailableWallets().find(w => w.name.toLowerCase() === walletName.toLowerCase());
        if (walletInfo) {
          toast({
            title: "Wallet Not Installed",
            description: `Please install ${walletName} wallet to continue. Download from: ${walletInfo.url}`,
          });
          // Auto-open download link
          window.open(walletInfo.url, "_blank");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: `Failed to connect wallet: ${errorMessage}`,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [network, toast]);

  const disconnect = useCallback(async () => {
    if (currentWallet) {
      try {
        await currentWallet.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
    }

    setAccount(null);
    setBalance(null);
    setIsConnected(false);
    setCurrentWallet(null);
    setSelectedWallet(null);

    // Clear all localStorage data
    localStorage.removeItem("aptos_wallet_name");
    localStorage.removeItem("aptos_network");
    localStorage.removeItem("aptos_connection_state");
  }, [currentWallet]);

  const switchNetworkCallback = useCallback(async (newNetwork: string) => {
    try {
      // Convert string to AptosNetwork type
      const networkAsAptosNetwork = newNetwork as AptosNetwork;
      setNetwork(networkAsAptosNetwork);

      // Switch network in wallet if supported
      if (currentWallet) {
        const aptosNetwork = APTOS_NETWORKS[networkAsAptosNetwork] as Network;
        await currentWallet.switchNetwork(aptosNetwork);
      }

      // Balance will be automatically refreshed by the useEffect
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }, [currentWallet]);

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
    network: network as string, // Convert AptosNetwork to string for context compatibility
    selectedWallet,

    // Wallet detection
    availableWallets,
    installedWallets,

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
const isValidPrivateKeyFormat = (privateKey: string): boolean => {
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