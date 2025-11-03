import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network, Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { useToast } from "@/hooks/use-toast";
import { WalletInfo, WalletBalance } from "@/types/wallet";

export interface UseModernAptosWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: any | null;
  walletInfo: WalletInfo | null;
  balance: WalletBalance | null;
  network: string;
  selectedWallet: string | null;

  // Wallet detection
  availableWallets: any[];
  installedWallets: any[];

  // Actions
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => Promise<void>;
  refreshBalance: () => Promise<void>;

  // Utilities
  formatAddress: (address: string, length?: number) => string;
  getExplorerUrl: (address?: string) => string;
}

export const useModernAptosWallet = (): UseModernAptosWalletReturn => {
  const { toast } = useToast();

  // Use the new AIP-62 Wallet Standard adapter
  const {
    connected,
    account,
    wallet,
    connect: adapterConnect,
    disconnect: adapterDisconnect,
    signAndSubmitTransaction,
    signMessage,
  } = useWallet();

  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [network, setNetwork] = useState<string>("testnet");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Update wallet info when account changes
  useEffect(() => {
    if (account && connected) {
      const info: WalletInfo = {
        address: account.address || "",
        publicKey: account.publicKey || "",
        isConnected: true,
        network: network,
        name: wallet?.name || "Wallet",
      };
      setWalletInfo(info);
      setSelectedWallet(wallet?.name || null);
      refreshBalance();
    } else {
      setWalletInfo(null);
      setSelectedWallet(null);
      setBalance(null);
    }
  }, [account, connected, wallet, network]);

  // Mock available wallets (this would be dynamic with getAptosWallets())
  const [availableWallets] = useState([
    { name: "Petra", url: "https://petra.app/", icon: "🔷" },
    { name: "Martian", url: "https://martianwallet.xyz/", icon: "🚀" },
    { name: "Pontem", url: "https://pontem.network/", icon: "⛓️" },
  ]);

  const [installedWallets] = useState(availableWallets); // In reality, would filter based on detection

  const connect = useCallback(async (walletName: string) => {
    setIsConnecting(true);
    try {
      await adapterConnect(walletName);
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletName}`,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: `Failed to connect to ${walletName}: ${error.message}`,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [adapterConnect, toast]);

  const disconnect = useCallback(async () => {
    try {
      await adapterDisconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, [adapterDisconnect, toast]);

  const switchNetwork = useCallback(async (newNetwork: string) => {
    try {
      setNetwork(newNetwork);
      toast({
        title: "Network Switched",
        description: `Switched to ${newNetwork}`,
      });
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast({
        variant: "destructive",
        title: "Network Switch Failed",
        description: `Failed to switch to ${newNetwork}: ${error.message}`,
      });
    }
  }, [toast]);

  const refreshBalance = useCallback(async () => {
    if (!account?.address) return;

    try {
      // Create Aptos client
      const config = new AptosConfig({
        network: network === "mainnet" ? Network.MAINNET : Network.TESTNET,
      });
      const client = new Aptos(config);

      // Fetch real balance from Aptos RPC
      const balance = await client.getAccountAPTAmount({
        accountAddress: account.address
      });

      setBalance({
        balance: parseFloat(balance),
        balanceInOctas: BigInt(Math.floor(parseFloat(balance) * 100000000)),
      });
    } catch (error) {
      console.error("Failed to refresh balance:", error);
      setBalance({
        balance: 0,
        balanceInOctas: BigInt(0),
      });
    }
  }, [account, network]);

  const formatAddress = useCallback((address: string | any, length: number = 8) => {
    if (!address) return "";
    // Convert to string if it's an AccountAddress object
    const addressStr = typeof address === 'string' ? address : address.toString();
    return `${addressStr.slice(0, length)}...${addressStr.slice(-length)}`;
  }, []);

  const getExplorerUrl = useCallback((address?: string | any) => {
    const addressOrAccount = address || account?.address || "";
    const addressToUse = typeof addressOrAccount === 'string' ? addressOrAccount : addressOrAccount.toString();
    const baseUrl = network === "mainnet"
      ? "https://explorer.aptos.org"
      : "https://explorer.aptoslabs.com";
    return `${baseUrl}/account/${addressToUse}`;
  }, [network, account]);

  return {
    // Connection state
    isConnected: connected,
    isConnecting,
    account,
    walletInfo,
    balance,
    network,
    selectedWallet,

    // Wallet detection
    availableWallets,
    installedWallets,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,

    // Utilities
    formatAddress,
    getExplorerUrl,
  };
};