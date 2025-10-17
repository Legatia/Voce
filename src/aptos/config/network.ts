import { Network } from "@aptos-labs/ts-sdk";

export const APTOS_NETWORKS = {
  mainnet: Network.MAINNET,
  testnet: Network.TESTNET,
  devnet: Network.DEVNET,
} as const;

export type AptosNetwork = keyof typeof APTOS_NETWORKS;

export const DEFAULT_NETWORK: AptosNetwork = "testnet";

export const NETWORK_CONFIGS = {
  mainnet: {
    name: "Aptos Mainnet",
    rpcUrl: "https://fullnode.mainnet.aptoslabs.com/v1",
    faucetUrl: "https://faucet.mainnet.aptoslabs.com",
    explorerUrl: "https://explorer.aptos.org",
  },
  testnet: {
    name: "Aptos Testnet",
    rpcUrl: "https://fullnode.testnet.aptoslabs.com/v1",
    faucetUrl: "https://faucet.testnet.aptoslabs.com",
    explorerUrl: "https://explorer.aptoslabs.com",
  },
  devnet: {
    name: "Aptos Devnet",
    rpcUrl: "https://fullnode.devnet.aptoslabs.com/v1",
    faucetUrl: "https://faucet.devnet.aptoslabs.com",
    explorerUrl: "https://explorer.devnet.aptoslabs.com",
  },
} as const;

export const getNetworkConfig = (network: Network) => {
  const networkKey = Object.keys(APTOS_NETWORKS).find(
    key => APTOS_NETWORKS[key as AptosNetwork] === network
  ) as AptosNetwork;
  return NETWORK_CONFIGS[networkKey];
};

export const getNetworkName = (network: AptosNetwork) => {
  return NETWORK_CONFIGS[network].name;
};

export const getExplorerUrl = (network: AptosNetwork) => {
  return NETWORK_CONFIGS[network].explorerUrl;
};