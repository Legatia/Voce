import { Account, Network, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export interface WalletInfo {
  name: string;
  icon: string;
  url: string;
  deeplink?: string;
}

export interface Wallet {
  info: WalletInfo;
  account?: Account | null;
  isConnected: boolean;
  connect(): Promise<Account>;
  disconnect(): void;
  getAccount(): Account | null;
  signTransaction(transaction: any): Promise<any>;
  getNetwork(): Network;
  switchNetwork(network: Network): Promise<void>;
}

// Petra Wallet Implementation - Current working API
export class PetraWallet implements Wallet {
  info: WalletInfo = {
    name: "Petra",
    icon: "🔷",
    url: "https://petra.app/",
    deeplink: "aptos://"
  };

  private petraWallet: any = null;
  private _account: Account | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== "undefined") {
      // For now, continue using the current working API
      // TODO: Migrate to window.aptos.petra when the new standard is fully available
      this.petraWallet = (window as any).petra;
    }
  }

  get isConnected(): boolean {
    return !!this._account && !!this.petraWallet?.isConnected?.();
  }

  get account(): Account | null {
    return this._account;
  }

  async connect(): Promise<Account> {
    if (!this.petraWallet) {
      throw new Error("Petra wallet is not installed. Please install it from https://petra.app/");
    }

    try {
      // Use the current working API
      const response = await this.petraWallet.connect();

      if (response.address) {
        // Create a simple account object with the address and public key
        // The Account constructor in current SDK doesn't accept publicKey directly
        this._account = {
          accountAddress: response.address,
          publicKey: response.publicKey
        };
        return this._account;
      }
      throw new Error("Failed to connect to Petra wallet");
    } catch (error) {
      console.error("Petra connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.petraWallet) {
      await this.petraWallet.disconnect();
      this._account = null;
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.petraWallet || !this._account) {
      throw new Error("Wallet not connected");
    }

    try {
      return await this.petraWallet.signTransaction(transaction);
    } catch (error) {
      console.error("Transaction signing error:", error);
      throw error;
    }
  }

  getNetwork(): Network {
    // Petra network detection logic would go here
    return Network.TESTNET; // Default
  }

  async switchNetwork(network: Network): Promise<void> {
    if (this.petraWallet) {
      await this.petraWallet.switchNetwork(network);
    }
  }
}

// Martian Wallet Implementation
export class MartianWallet implements Wallet {
  info: WalletInfo = {
    name: "Martian",
    icon: "🚀",
    url: "https://martianwallet.xyz/",
    deeplink: "martian://"
  };

  private martianWallet: any = null;
  private _account: Account | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== "undefined") {
      this.martianWallet = (window as any).martian;
    }
  }

  get isConnected(): boolean {
    return !!this._account && !!this.martianWallet?.isConnected?.();
  }

  get account(): Account | null {
    return this._account;
  }

  async connect(): Promise<Account> {
    if (!this.martianWallet) {
      throw new Error("Martian wallet is not installed. Please install it from https://martianwallet.xyz/");
    }

    try {
      const response = await this.martianWallet.connect();
      if (response.address) {
        // Create a simple account object with the address and public key
        this._account = {
          accountAddress: response.address,
          publicKey: response.publicKey
        };
        return this._account;
      }
      throw new Error("Failed to connect to Martian wallet");
    } catch (error) {
      console.error("Martian connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.martianWallet) {
      await this.martianWallet.disconnect();
      this._account = null;
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.martianWallet || !this._account) {
      throw new Error("Wallet not connected");
    }

    try {
      return await this.martianWallet.signTransaction(transaction);
    } catch (error) {
      console.error("Transaction signing error:", error);
      throw error;
    }
  }

  getNetwork(): Network {
    return Network.TESTNET; // Default
  }

  async switchNetwork(network: Network): Promise<void> {
    if (this.martianWallet) {
      await this.martianWallet.switchNetwork(network);
    }
  }
}

// Pontem Wallet Implementation
export class PontemWallet implements Wallet {
  info: WalletInfo = {
    name: "Pontem",
    icon: "⛓️",
    url: "https://pontem.network/",
    deeplink: "pontem://"
  };

  private pontemWallet: any = null;
  private _account: Account | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== "undefined") {
      this.pontemWallet = (window as any).pontem;
    }
  }

  get isConnected(): boolean {
    return !!this._account && !!this.pontemWallet?.isConnected?.();
  }

  get account(): Account | null {
    return this._account;
  }

  async connect(): Promise<Account> {
    if (!this.pontemWallet) {
      throw new Error("Pontem wallet is not installed. Please install it from https://pontem.network/");
    }

    try {
      const response = await this.pontemWallet.connect();
      if (response.address) {
        // Create a simple account object with the address and public key
        this._account = {
          accountAddress: response.address,
          publicKey: response.publicKey
        };
        return this._account;
      }
      throw new Error("Failed to connect to Pontem wallet");
    } catch (error) {
      console.error("Pontem connection error:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pontemWallet) {
      await this.pontemWallet.disconnect();
      this._account = null;
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.pontemWallet || !this._account) {
      throw new Error("Wallet not connected");
    }

    try {
      return await this.pontemWallet.signTransaction(transaction);
    } catch (error) {
      console.error("Transaction signing error:", error);
      throw error;
    }
  }

  getNetwork(): Network {
    return Network.TESTNET; // Default
  }

  async switchNetwork(network: Network): Promise<void> {
    if (this.pontemWallet) {
      await this.pontemWallet.switchNetwork(network);
    }
  }
}

// Wallet Factory
export class WalletFactory {
  static createWallet(walletName: string): Wallet {
    switch (walletName.toLowerCase()) {
      case "petra":
        return new PetraWallet();
      case "martian":
        return new MartianWallet();
      case "pontem":
        return new PontemWallet();
      default:
        throw new Error(`Unsupported wallet: ${walletName}`);
    }
  }

  static getAvailableWallets(): WalletInfo[] {
    return [
      {
        name: "Petra",
        icon: "🔷",
        url: "https://petra.app/",
        deeplink: "aptos://"
      },
      {
        name: "Martian",
        icon: "🚀",
        url: "https://martianwallet.xyz/",
        deeplink: "martian://"
      },
      {
        name: "Pontem",
        icon: "⛓️",
        url: "https://pontem.network/",
        deeplink: "pontem://"
      }
    ];
  }

  static detectInstalledWallets(): WalletInfo[] {
    const available: WalletInfo[] = [];

    if (typeof window !== "undefined") {
      const windowObj = window as any;

      // Revert to current working API for now
      // TODO: Update to new standard when available
      if (windowObj.petra) {
        available.push({
          name: "Petra",
          icon: "🔷",
          url: "https://petra.app/",
          deeplink: "aptos://"
        });
      }

      if (windowObj.martian) {
        available.push({
          name: "Martian",
          icon: "🚀",
          url: "https://martianwallet.xyz/",
          deeplink: "martian://"
        });
      }

      if (windowObj.pontem) {
        available.push({
          name: "Pontem",
          icon: "⛓️",
          url: "https://pontem.network/",
          deeplink: "pontem://"
        });
      }
    }

    return available;
  }
}