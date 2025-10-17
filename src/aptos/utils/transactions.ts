import { Account, Network } from "@aptos-labs/ts-sdk";
import { PredictionMarketContract } from "../contracts/predictionMarket";
import { MarketplaceContract } from "../contracts/marketplace";
import { DEFAULT_NETWORK } from "../config/network";
import {
  CreateEventParams,
  VoteParams,
  ClaimRewardsParams,
  PurchaseItemParams,
  PredictionEvent,
  Vote,
  UserStats,
  MarketplaceItem,
  UserNFT,
} from "../types";

export class TransactionService {
  private predictionMarket: PredictionMarketContract;
  private marketplace: MarketplaceContract;
  private network: Network;

  constructor(network: Network = DEFAULT_NETWORK) {
    this.network = network;
    this.predictionMarket = new PredictionMarketContract(network);
    this.marketplace = new MarketplaceContract(network);
  }

  // PREDICTION MARKET TRANSACTIONS

  async createEvent(account: Account, params: CreateEventParams): Promise<{
    txHash: string;
    success: boolean;
  }> {
    try {
      const txHash = await this.predictionMarket.createEvent(account, params);
      const status = await this.predictionMarket.getTransactionStatus(txHash);

      return {
        txHash,
        success: status.success,
      };
    } catch (error) {
      throw error;
    }
  }

  async vote(account: Account, params: VoteParams): Promise<{
    txHash: string;
    success: boolean;
  }> {
    try {
      const txHash = await this.predictionMarket.vote(account, params);
      const status = await this.predictionMarket.getTransactionStatus(txHash);

      return {
        txHash,
        success: status.success,
      };
    } catch (error) {
      throw error;
    }
  }

  async claimRewards(account: Account, params: ClaimRewardsParams): Promise<{
    txHash: string;
    success: boolean;
  }> {
    try {
      const txHash = await this.predictionMarket.claimRewards(account, params);
      const status = await this.predictionMarket.getTransactionStatus(txHash);

      return {
        txHash,
        success: status.success,
      };
    } catch (error) {
      throw error;
    }
  }

  // MARKETPLACE TRANSACTIONS

  async purchaseItem(account: Account, params: PurchaseItemParams): Promise<{
    txHash: string;
    success: boolean;
  }> {
    try {
      const txHash = await this.marketplace.purchaseItem(account, params);
      const status = await this.marketplace.getTransactionStatus(txHash);

      return {
        txHash,
        success: status.success,
      };
    } catch (error) {
      throw error;
    }
  }

  // DATA QUERY METHODS

  async getAllEvents(): Promise<PredictionEvent[]> {
    return this.predictionMarket.getAllEvents();
  }

  async getEvent(eventId: string): Promise<PredictionEvent | null> {
    return this.predictionMarket.getEvent(eventId);
  }

  async getEventsByCategory(category: string): Promise<PredictionEvent[]> {
    return this.predictionMarket.getEventsByCategory(category);
  }

  async getEventsByRegion(region: string): Promise<PredictionEvent[]> {
    return this.predictionMarket.getEventsByRegion(region);
  }

  async getUserVotes(userAddress: string): Promise<Vote[]> {
    return this.predictionMarket.getUserVotes(userAddress);
  }

  async getUserStats(userAddress: string): Promise<UserStats | null> {
    return this.predictionMarket.getUserStats(userAddress);
  }

  async getMarketplaceItems(): Promise<MarketplaceItem[]> {
    return this.marketplace.getAllItems();
  }

  async getMarketplaceItemsByType(itemType: "vote_ticket" | "nft"): Promise<MarketplaceItem[]> {
    return this.marketplace.getItemsByType(itemType);
  }

  async getUserNFTs(userAddress: string): Promise<UserNFT[]> {
    return this.marketplace.getUserNFTs(userAddress);
  }

  async getUserVotingPower(userAddress: string): Promise<number> {
    return this.marketplace.getUserVotingPower(userAddress);
  }

  // UTILITY METHODS

  async waitForTransaction(txHash: string, maxAttempts: number = 10): Promise<{
    success: boolean;
    status: string;
    finalized: boolean;
  }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.predictionMarket.getTransactionStatus(txHash);

        if (status.status !== "pending") {
          return {
            success: status.success,
            status: status.status,
            finalized: true,
          };
        }

        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error checking transaction status (attempt ${attempt + 1}):`, error);

        if (attempt === maxAttempts - 1) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error("Transaction confirmation timeout");
  }

  // Batch operations
  async batchVote(account: Account, votes: VoteParams[]): Promise<{
    results: Array<{ txHash: string; success: boolean; error?: string }>;
    summary: { successful: number; failed: number };
  }> {
    const results = [];

    for (const vote of votes) {
      try {
        const result = await this.vote(account, vote);
        results.push(result);
      } catch (error) {
        results.push({
          txHash: "",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      results,
      summary: { successful, failed },
    };
  }

  // Gas estimation utilities
  async estimateGasForCreateEvent(params: CreateEventParams): Promise<number> {
    // This would typically involve simulating the transaction
    // For now, return a reasonable estimate
    return 0.005; // APT
  }

  async estimateGasForVote(): Promise<number> {
    return 0.001; // APT
  }

  async estimateGasForClaimRewards(): Promise<number> {
    return 0.002; // APT
  }

  async estimateGasForPurchaseItem(price: number): Promise<number> {
    // Gas for purchase is typically higher due to token transfers
    return 0.003 + (price * 0.0001); // Base + percentage of item price
  }

  // Transaction validation
  validateCreateEventParams(params: CreateEventParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.title || params.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (!params.description || params.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (!params.category) {
      errors.push("Category is required");
    }

    if (!params.region) {
      errors.push("Region is required");
    }

    if (params.votingDeadline <= 0) {
      errors.push("Voting deadline must be in the future");
    }

    if (params.resultDeadline <= params.votingDeadline) {
      errors.push("Result deadline must be after voting deadline");
    }

    if (params.xpReward <= 0) {
      errors.push("XP reward must be greater than 0");
    }

    if (params.aptReward <= 0) {
      errors.push("APT reward must be greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateVoteParams(params: VoteParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.eventId || params.eventId.trim().length === 0) {
      errors.push("Event ID is required");
    }

    if (typeof params.prediction !== "boolean") {
      errors.push("Prediction must be true or false");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}