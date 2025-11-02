import { Account, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";

// Contract configuration - CORRECTED
const PREDICTION_MARKET_ADDRESS = import.meta.env.VITE_PREDICTION_MARKET_ADDRESS || "b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3";
const PREDICTION_MARKET_MODULE = `${PREDICTION_MARKET_ADDRESS}::prediction_market`;

// Interfaces for prediction market (matching actual deployed contract)
export interface PredictionEvent {
  id: number;
  creator: string;
  title: string;
  description: string;
  category: string;
  region: string;
  votingDeadline: number;
  resultDeadline: number;
  resolutionCriteria: string;
  dataSources: string[];
  isVotingClosed: boolean;
  isResolved: boolean;
  outcome: boolean;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  xpReward: number;
  aptReward: number;
  createdAt: number;
}

export interface UserStats {
  address: string;
  totalXp: number;
  totalEarned: number;
  totalVotes: number;
  correctPredictions: number;
  accuracy: number;
  level: number;
  createdEvents: number;
}

export interface Vote {
  eventId: number;
  eventCreator: string;
  prediction: boolean;
  timestamp: number;
  claimedRewards: boolean;
}

export class PredictionMarketService {
  private client: any;

  constructor() {
    this.client = createAptosClient(Network.TESTNET);
  }

  /**
   * Initialize the prediction market system
   */
  async initialize(): Promise<boolean> {
    try {
      const adminAddress = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || PREDICTION_MARKET_ADDRESS;

      // Check if already initialized
      try {
        await this.client.getAccountResource({
          accountAddress: adminAddress,
          resourceType: `${PREDICTION_MARKET_MODULE}::EventCounter`
        });
        console.log("✅ Prediction market already initialized");
        return true;
      } catch {
        // Not initialized, proceed with initialization
        console.log("⚠️ Prediction market not initialized. Admin needs to call initialize() function");
        return false;
      }
    } catch (error) {
      console.error("Error checking prediction market initialization:", error);
      return false;
    }
  }

  /**
   * Initialize the prediction market contract (admin only)
   * This should be called by the contract admin using a connected wallet
   */
  async initializeContract(signer: any): Promise<boolean> {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${PREDICTION_MARKET_MODULE}::initialize`,
        type_arguments: [],
        arguments: []
      };

      const transaction = await this.client.generateSignerTransaction(signer, payload);
      const signedTxn = await this.client.signTransaction(signer, transaction);
      const transactionRes = await this.client.submitTransaction(signedTxn);

      console.log("✅ Prediction market contract initialized successfully:", transactionRes.hash);
      return true;
    } catch (error) {
      console.error("❌ Error initializing prediction market contract:", error);
      return false;
    }
  }

  /**
   * Check if prediction market is initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      const adminAddress = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || PREDICTION_MARKET_ADDRESS;

      await this.client.getAccountResource({
        accountAddress: adminAddress,
        resourceType: `${PREDICTION_MARKET_MODULE}::EventCounter`
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new prediction event
   */
  async createEvent(
    creator: Account,
    title: string,
    description: string,
    category: string,
    region: string,
    votingDeadline: number,
    resultDeadline: number,
    resolutionCriteria: string,
    dataSources: string[],
    xpReward: number,
    aptReward: number
  ): Promise<string> {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${PREDICTION_MARKET_MODULE}::create_event`,
        type_arguments: [],
        arguments: [
          creator.accountAddress.toString(), // creator signer
          creator.accountAddress.toString(), // event creator
          title,
          description,
          category,
          region,
          votingDeadline,
          resultDeadline,
          resolutionCriteria,
          dataSources,
          xpReward,
          aptReward
        ]
      };

      const transaction = await this.client.generateTransaction(creator.accountAddress, payload);
      const signedTransaction = await this.client.signTransaction(creator, transaction);
      const transactionResponse = await this.client.submitTransaction(signedTransaction);

      await this.client.waitForTransaction(transactionResponse.hash);

      return transactionResponse.hash;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  /**
   * Get event details
   */
  async getEvent(creatorAddress: string, eventId: number): Promise<PredictionEvent | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${PREDICTION_MARKET_MODULE}::get_event`,
          type_arguments: [],
          arguments: [creatorAddress, eventId]
        }
      });

      if (result && result.length > 0) {
        return this.formatPredictionEvent(result[0]);
      }

      return null;
    } catch (error) {
      console.error("Error getting event:", error);
      return null;
    }
  }

  /**
   * Get next event ID for a creator
   */
  async getNextEventId(creatorAddress: string): Promise<number> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${PREDICTION_MARKET_MODULE}::get_next_event_id`,
          type_arguments: [],
          arguments: [creatorAddress]
        }
      });

      return Number(result[0]);
    } catch (error) {
      console.error("Error getting next event ID:", error);
      return 1;
    }
  }

  /**
   * Vote on a prediction event
   */
  async vote(
    voter: Account,
    eventCreator: string,
    eventId: number,
    prediction: boolean
  ): Promise<string> {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${PREDICTION_MARKET_MODULE}::vote`,
        type_arguments: [],
        arguments: [eventCreator, eventId, prediction]
      };

      const transaction = await this.client.generateTransaction(voter.accountAddress, payload);
      const signedTransaction = await this.client.signTransaction(voter, transaction);
      const transactionResponse = await this.client.submitTransaction(signedTransaction);

      await this.client.waitForTransaction(transactionResponse.hash);

      return transactionResponse.hash;
    } catch (error) {
      console.error("Error voting:", error);
      throw error;
    }
  }

  /**
   * Check if user has voted
   */
  async hasVoted(userAddress: string): Promise<boolean> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${PREDICTION_MARKET_MODULE}::has_voted`,
          type_arguments: [],
          arguments: [userAddress]
        }
      });

      return Boolean(result[0]);
    } catch (error) {
      console.error("Error checking vote status:", error);
      return false;
    }
  }

  /**
   * Get user's vote
   */
  async getUserVote(userAddress: string): Promise<Vote | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${PREDICTION_MARKET_MODULE}::get_vote`,
          type_arguments: [],
          arguments: [userAddress]
        }
      });

      if (result && result.length > 0) {
        return this.formatVote(result[0]);
      }

      return null;
    } catch (error) {
      console.error("Error getting user vote:", error);
      return null;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string): Promise<UserStats | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${PREDICTION_MARKET_MODULE}::get_user_stats`,
          type_arguments: [],
          arguments: [userAddress]
        }
      });

      if (result && result.length > 0) {
        return this.formatUserStats(result[0]);
      }

      return null;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }

  /**
   * Resolve an event
   */
  async resolveEvent(
    resolver: Account,
    eventCreator: string,
    eventId: number,
    outcome: boolean
  ): Promise<string> {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${PREDICTION_MARKET_MODULE}::resolve_event`,
        type_arguments: [],
        arguments: [eventCreator, eventId, outcome]
      };

      const transaction = await this.client.generateTransaction(resolver.accountAddress, payload);
      const signedTransaction = await this.client.signTransaction(resolver, transaction);
      const transactionResponse = await this.client.submitTransaction(signedTransaction);

      await this.client.waitForTransaction(transactionResponse.hash);

      return transactionResponse.hash;
    } catch (error) {
      console.error("Error resolving event:", error);
      throw error;
    }
  }

  /**
   * Claim rewards
   */
  async claimRewards(
    claimer: Account,
    eventCreator: string,
    eventId: number
  ): Promise<string> {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${PREDICTION_MARKET_MODULE}::claim_rewards`,
        type_arguments: [],
        arguments: [eventCreator, eventId]
      };

      const transaction = await this.client.generateTransaction(claimer.accountAddress, payload);
      const signedTransaction = await this.client.signTransaction(claimer, transaction);
      const transactionResponse = await this.client.submitTransaction(signedTransaction);

      await this.client.waitForTransaction(transactionResponse.hash);

      return transactionResponse.hash;
    } catch (error) {
      console.error("Error claiming rewards:", error);
      throw error;
    }
  }

  // Helper methods to format contract data
  private formatPredictionEvent(data: any): PredictionEvent {
    return {
      id: Number(data.id),
      creator: data.creator,
      title: data.title,
      description: data.description,
      category: data.category,
      region: data.region,
      votingDeadline: Number(data.voting_deadline),
      resultDeadline: Number(data.result_deadline),
      resolutionCriteria: data.resolution_criteria,
      dataSources: data.data_sources,
      isVotingClosed: data.is_voting_closed,
      isResolved: data.is_resolved,
      outcome: data.outcome,
      totalVotes: Number(data.total_votes),
      yesVotes: Number(data.yes_votes),
      noVotes: Number(data.no_votes),
      xpReward: Number(data.xp_reward),
      aptReward: Number(data.apt_reward),
      createdAt: Number(data.created_at)
    };
  }

  private formatVote(data: any): Vote {
    return {
      eventId: Number(data.event_id),
      eventCreator: data.event_creator,
      prediction: data.prediction,
      timestamp: Number(data.timestamp),
      claimedRewards: data.claimed_rewards
    };
  }

  private formatUserStats(data: any): UserStats {
    return {
      address: data.address,
      totalXp: Number(data.total_xp),
      totalEarned: Number(data.total_earned),
      totalVotes: Number(data.total_votes),
      correctPredictions: Number(data.correct_predictions),
      accuracy: Number(data.accuracy),
      level: Number(data.level),
      createdEvents: Number(data.created_events)
    };
  }
}

// Create singleton instance
export const predictionMarketService = new PredictionMarketService();