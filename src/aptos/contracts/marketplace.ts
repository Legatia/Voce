import {
  Aptos,
  Account,
  Network,
  InputEntryFunctionData,
} from "@aptos-labs/ts-sdk";
import { DEFAULT_NETWORK } from "../config/network";
import {
  MarketplaceItem,
  UserNFT,
  PurchaseItemParams,
  CONTRACT_FUNCTIONS,
  CONTRACT_ADDRESSES,
} from "../types";

export class MarketplaceContract {
  private aptos: Aptos;
  private network: Network;

  constructor(network: Network = DEFAULT_NETWORK) {
    this.aptos = new Aptos({ network });
    this.network = network;
  }

  // Purchase marketplace item
  async purchaseItem(
    account: Account,
    params: PurchaseItemParams
  ): Promise<string> {
    try {
      const payload: InputEntryFunctionData = {
        function: `${CONTRACT_ADDRESSES.MARKETPLACE}::${CONTRACT_FUNCTIONS.PURCHASE_ITEM}`,
        typeArguments: [],
        functionArguments: [params.itemId, params.quantity],
      };

      const transaction = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: payload,
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: account,
        transaction,
      });

      const response = await this.aptos.transaction.submit({
        transaction: signedTx,
      });

      await this.aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return response.hash;
    } catch (error) {
      console.error("Error purchasing item:", error);
      throw new Error(`Failed to purchase item: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Get all marketplace items
  async getAllItems(): Promise<MarketplaceItem[]> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: CONTRACT_ADDRESSES.MARKETPLACE,
      });

      const marketplaceResource = resources.find(
        (resource) =>
          resource.type === `${CONTRACT_ADDRESSES.MARKETPLACE}::Marketplace`
      );

      if (!marketplaceResource) {
        return [];
      }

      const marketplaceData = marketplaceResource.data as any;
      return this.parseMarketplaceItems(marketplaceData.items);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      return [];
    }
  }

  // Get user's NFTs
  async getUserNFTs(userAddress: string): Promise<UserNFT[]> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: userAddress,
      });

      const nftCollectionResource = resources.find(
        (resource) =>
          resource.type === `${CONTRACT_ADDRESSES.MARKETPLACE}::UserNFTCollection`
      );

      if (!nftCollectionResource) {
        return [];
      }

      const nftData = nftCollectionResource.data as any;
      return this.parseUserNFTs(nftData.nfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      return [];
    }
  }

  // Get marketplace items by type
  async getItemsByType(itemType: "vote_ticket" | "nft"): Promise<MarketplaceItem[]> {
    try {
      const allItems = await this.getAllItems();
      return allItems.filter(item => item.itemType === itemType);
    } catch (error) {
      console.error("Error fetching items by type:", error);
      return [];
    }
  }

  // Get item by ID
  async getItem(itemId: string): Promise<MarketplaceItem | null> {
    try {
      const allItems = await this.getAllItems();
      return allItems.find(item => item.id.toString() === itemId) || null;
    } catch (error) {
      console.error("Error fetching item:", error);
      return null;
    }
  }

  // Helper methods to parse blockchain data
  private parseMarketplaceItems(items: any[]): MarketplaceItem[] {
    return items.map(item => ({
      id: item.id,
      itemType: item.item_type,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      isLimited: item.is_limited,
      metadata: item.metadata,
    }));
  }

  private parseUserNFTs(nfts: any[]): UserNFT[] {
    return nfts.map(nft => ({
      id: nft.id,
      tokenId: nft.token_id,
      owner: nft.owner,
      itemType: nft.item_type,
      name: nft.name,
      metadata: nft.metadata,
      xpBonus: nft.xp_bonus,
      acquired: nft.acquired,
    }));
  }

  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<{
    success: boolean;
    status: string;
    gasUsed?: number;
    events?: any[];
  }> {
    try {
      const tx = await this.aptos.getTransactionByHash({
        transactionHash: txHash,
      });

      return {
        success: tx.success || false,
        status: tx.vm_status || "unknown",
        gasUsed: tx.gas_used ? Number(tx.gas_used) : undefined,
        events: tx.events || [],
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return {
        success: false,
        status: "failed",
      };
    }
  }

  // Calculate user's voting power based on NFTs
  async getUserVotingPower(userAddress: string): Promise<number> {
    try {
      const nfts = await this.getUserNFTs(userAddress);
      const voteTickets = nfts.filter(nft => nft.itemType === "vote_ticket");
      const xpBonuses = nfts.reduce((total, nft) => total + nft.xpBonus, 0);

      // Base voting power + bonuses from NFTs
      return voteTickets.length + Math.floor(xpBonuses / 100);
    } catch (error) {
      console.error("Error calculating user voting power:", error);
      return 1; // Default to 1 vote
    }
  }
}