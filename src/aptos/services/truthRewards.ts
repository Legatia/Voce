import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";

// Contract configuration
const TRUTH_REWARDS_ADDRESS = import.meta.env.VITE_TRUTH_REWARDS_ADDRESS || "0x1";
const VOCE_ADMIN_ADDRESS = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "0x123";

// Interfaces for truth rewards system
export interface TruthEvent {
  id: Uint8Array;
  creator: string;
  title: string;
  description: string;
  options: string[];
  votingEndTime: number;
  ticketPrice: number;
  totalVotes: number;
  totalPrizePool: number;
  winningOption: number;
  winners: string[];
  isResolved: boolean;
  creatorRewardClaimed: boolean;
  createdAt: number;
  resolvedAt: number;
}

export interface VoteRecord {
  voter: string;
  optionIndex: number;
  amount: number;
  timestamp: number;
}

export interface RewardCalculation {
  eventId: Uint8Array;
  totalPrizePool: number;
  winnerSharePerPerson: number;
  creatorReward: number;
  platformFee: number;
  numberOfWinners: number;
}

export interface CreateEventParams {
  title: string;
  description: string;
  options: string[];
  votingDurationHours: number;
  ticketPrice: number;
}

export interface EventDetails {
  id: Uint8Array;
  creator: string;
  title: string;
  totalVotes: number;
  totalPrizePool: number;
  winningOption: number;
  isResolved: boolean;
  votingEndTime: number;
}

/**
 * Service for managing truth rewards and automatic reward distribution
 */
export class TruthRewardsService {
  private client: any;
  private adminAccount: Account | null = null;

  constructor(network: Network = Network.TESTNET) {
    this.client = createAptosClient(network);
  }

  /**
   * Set admin account for privileged operations
   */
  setAdminAccount(privateKey: string) {
    this.adminAccount = new Account({
      privateKey: new Ed25519PrivateKey(privateKey),
    });
  }

  /**
   * Initialize the truth rewards system (admin only)
   */
  async initializeTruthRewards(): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::initialize_truth_rewards`,
      type_arguments: [],
      arguments: [],
    };

    const transaction = await this.client.generateTransaction(
      this.adminAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      this.adminAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Create a new truth event
   */
  async createTruthEvent(
    creatorAccount: Account,
    params: CreateEventParams
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::create_truth_event`,
      type_arguments: [],
      arguments: [
        params.title,
        params.description,
        params.options,
        params.votingDurationHours,
        params.ticketPrice,
      ],
    };

    const transaction = await this.client.generateTransaction(
      creatorAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      creatorAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Vote for an option with payment
   */
  async voteForOption(
    voterAccount: Account,
    eventCreator: string,
    eventId: number,
    optionIndex: number,
    amount: number
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::vote_for_option`,
      type_arguments: [],
      arguments: [eventCreator, eventId, optionIndex, amount],
    };

    const transaction = await this.client.generateTransaction(
      voterAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      voterAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Resolve event and calculate rewards (admin only)
   */
  async resolveTruthEvent(
    eventId: number,
    winningOption: number
  ): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::resolve_truth_event`,
      type_arguments: [],
      arguments: [eventId, winningOption],
    };

    const transaction = await this.client.generateTransaction(
      this.adminAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      this.adminAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Claim winner reward
   */
  async claimWinnerReward(
    winnerAccount: Account,
    eventCreator: string,
    eventId: number
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::claim_winner_reward`,
      type_arguments: [],
      arguments: [eventCreator, eventId],
    };

    const transaction = await this.client.generateTransaction(
      winnerAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      winnerAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Claim creator reward
   */
  async claimCreatorReward(
    creatorAccount: Account,
    eventId: number
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::claim_creator_reward`,
      type_arguments: [],
      arguments: [eventId],
    };

    const transaction = await this.client.generateTransaction(
      creatorAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      creatorAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Get event details
   */
  async getEventDetails(eventId: number): Promise<EventDetails | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::get_event_details`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId],
        },
      });

      return {
        id: result[0],
        creator: result[1],
        title: result[2],
        totalVotes: Number(result[3]),
        totalPrizePool: Number(result[4]),
        winningOption: Number(result[5]),
        isResolved: result[6],
        votingEndTime: Number(result[7]),
      };
    } catch (error) {
      console.error("Error fetching event details:", error);
      return null;
    }
  }

  /**
   * Get reward calculation for an event
   */
  async getRewardCalculation(eventId: number): Promise<RewardCalculation | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::get_reward_calculation`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId],
        },
      });

      return {
        eventId: new Uint8Array(),
        totalPrizePool: Number(result[0]),
        winnerSharePerPerson: Number(result[1]),
        creatorReward: Number(result[2]),
        platformFee: Number(result[3]),
        numberOfWinners: Number(result[4]),
      };
    } catch (error) {
      console.error("Error fetching reward calculation:", error);
      return null;
    }
  }

  /**
   * Check if address is a winner
   */
  async isWinner(eventId: number, user: string): Promise<boolean> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::is_winner`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId, user],
        },
      });

      return result[0];
    } catch (error) {
      console.error("Error checking winner status:", error);
      return false;
    }
  }

  /**
   * Get all events for a creator
   */
  async getCreatorEvents(creator: string): Promise<Uint8Array[]> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::get_creator_events`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, creator],
        },
      });

      return result[0];
    } catch (error) {
      console.error("Error fetching creator events:", error);
      return [];
    }
  }

  /**
   * Get total rewards earned by a user
   */
  async getUserTotalRewards(user: string): Promise<number> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::get_user_total_rewards`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, user],
        },
      });

      return Number(result[0]);
    } catch (error) {
      console.error("Error fetching user total rewards:", error);
      return 0;
    }
  }

  /**
   * Calculate rewards locally (for preview)
   */
  calculateRewardsLocally(totalPrizePool: number, numberOfWinners: number): RewardCalculation {
    const WINNER_SHARE_PERCENTAGE = 60; // 60%
    const CREATOR_SHARE_PERCENTAGE = 5;  // 5%
    const PLATFORM_FEE_PERCENTAGE = 35; // 35%
    const BASIS_POINTS = 100;

    const winnerShare = (totalPrizePool * WINNER_SHARE_PERCENTAGE) / BASIS_POINTS;
    const creatorReward = (totalPrizePool * CREATOR_SHARE_PERCENTAGE) / BASIS_POINTS;
    const platformFee = (totalPrizePool * PLATFORM_FEE_PERCENTAGE) / BASIS_POINTS;

    const winnerSharePerPerson = numberOfWinners > 0 ? winnerShare / numberOfWinners : 0;

    return {
      eventId: new Uint8Array(),
      totalPrizePool,
      winnerSharePerPerson,
      creatorReward,
      platformFee,
      numberOfWinners,
    };
  }

  /**
   * Batch claim all available rewards for a user
   */
  async batchClaimRewards(
    userAccount: Account,
    eventIds: { winnerClaims: Array<{creator: string, eventId: number}>, creatorClaims: number[] }
  ): Promise<{ successful: string[], failed: Array<{tx: string, error: string}> }> {
    const results = { successful: [], failed: [] as Array<{tx: string, error: string}> };

    // Claim winner rewards
    for (const claim of eventIds.winnerClaims) {
      try {
        const txHash = await this.claimWinnerReward(userAccount, claim.creator, claim.eventId);
        results.successful.push(`Winner reward for event ${claim.eventId}: ${txHash}`);
      } catch (error) {
        results.failed.push({
          tx: `Winner reward for event ${claim.eventId}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Claim creator rewards
    for (const eventId of eventIds.creatorClaims) {
      try {
        const txHash = await this.claimCreatorReward(userAccount, eventId);
        results.successful.push(`Creator reward for event ${eventId}: ${txHash}`);
      } catch (error) {
        results.failed.push({
          tx: `Creator reward for event ${eventId}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get reward distribution breakdown for an event
   */
  async getRewardBreakdown(eventId: number): Promise<{
    totalPrizePool: number;
    winnerShare: number;
    creatorReward: number;
    platformFee: number;
    winnerSharePerPerson: number;
    numberOfWinners: number;
  } | null> {
    const rewardCalc = await this.getRewardCalculation(eventId);
    if (!rewardCalc) return null;

    const WINNER_SHARE_PERCENTAGE = 60;
    const CREATOR_SHARE_PERCENTAGE = 5;
    const PLATFORM_FEE_PERCENTAGE = 35;

    return {
      totalPrizePool: rewardCalc.totalPrizePool,
      winnerShare: (rewardCalc.totalPrizePool * WINNER_SHARE_PERCENTAGE) / 100,
      creatorReward: rewardCalc.creatorReward,
      platformFee: rewardCalc.platformFee,
      winnerSharePerPerson: rewardCalc.winnerSharePerPerson,
      numberOfWinners: rewardCalc.numberOfWinners,
    };
  }

  /**
   * Check if the truth rewards system is initialized
   */
  async isTruthRewardsInitialized(): Promise<boolean> {
    try {
      await this.client.getAccountResource(
        VOCE_ADMIN_ADDRESS,
        `${TRUTH_REWARDS_ADDRESS}::truth_rewards::TruthEventRegistry`
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitor events for real-time updates
   */
  async subscribeToEvents(callback: (event: any) => void) {
    // This would use WebSocket or event subscription in production
    // For now, return a mock subscription
    return {
      unsubscribe: () => {
        console.log("Unsubscribed from truth rewards events");
      }
    };
  }
}

// Create singleton instance
export const truthRewardsService = new TruthRewardsService();

// Export utility functions
export const initializeTruthRewardsSystem = async (adminPrivateKey: string): Promise<boolean> => {
  try {
    const service = new TruthRewardsService();
    service.setAdminAccount(adminPrivateKey);

    const isInitialized = await service.isTruthRewardsInitialized();
    if (!isInitialized) {
      await service.initializeTruthRewards();
      console.log("✅ Truth rewards system initialized");
    } else {
      console.log("ℹ️ Truth rewards system already initialized");
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize truth rewards system:", error);
    return false;
  }
};

// Export constants for reward distribution
export const REWARD_CONSTANTS = {
  WINNER_SHARE_PERCENTAGE: 60,
  CREATOR_SHARE_PERCENTAGE: 5,
  PLATFORM_FEE_PERCENTAGE: 35,
  BASIS_POINTS: 100,
} as const;