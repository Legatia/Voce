import React, { createContext, useContext, ReactNode } from "react";
import { useAptosWallet } from "@/aptos/hooks/useAptosWallet";
import { Account } from "@aptos-labs/ts-sdk";

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  walletInfo: any;
  balance: any;
  network: string;

  // Actions
  connect: (privateKey?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => Promise<void>;
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
  const walletHook = useAptosWallet();

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