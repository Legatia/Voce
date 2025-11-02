import React, { createContext, useContext, ReactNode } from "react";
import { useModernAptosWallet } from "@/aptos/hooks/useModernAptosWallet";
import { Account } from "@aptos-labs/ts-sdk";
import { WalletInfo, WalletBalance } from "@/types/wallet";
import { WalletInfo as WalletAdapterInfo } from "@/aptos/wallets/AptosWalletAdapter";

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  walletInfo: WalletInfo | null;
  balance: WalletBalance | null;
  network: string; // Keep as string for broader compatibility
  selectedWallet: string | null;

  // Wallet detection
  availableWallets: WalletAdapterInfo[]; // Use wallet adapter info for detection
  installedWallets: WalletAdapterInfo[]; // Use wallet adapter info for detection

  // Actions
  connect: (walletName: string, privateKey?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => Promise<void>; // Keep as string for compatibility
  refreshBalance: () => Promise<void>;

  // Utilities
  formatAddress: (address: string, length?: number) => string;
  getExplorerUrl: (address?: string) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const walletHook = useModernAptosWallet();

  return (
    <WalletContext.Provider value={walletHook}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};