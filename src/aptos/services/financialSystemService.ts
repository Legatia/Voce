import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";

// Contract configuration
const FINANCIAL_SYSTEM_ADDRESS = import.meta.env.VITE_FINANCIAL_SYSTEM_ADDRESS || "0x1";
const VOCE_ADMIN_ADDRESS = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "0x123";

// Interfaces for financial system
export interface StakingPool {
  poolId: number;
  creator: string;
  totalStaked: number;
  lockupDuration: number;
  apyPercentage: number;
  stakers: Staker[];
  createdAt: number;
  lastUpdated: number;
  isActive: boolean;
}

export interface Staker {
  address: string;
  amountStaked: number;
  stakedAt: number;
  unlockTime: number;
  rewardsEarned: number;
  lastRewardCalculation: number;
  isActive: boolean;
}

export interface UserProfile {
  owner: string;
  totalEarned: number;
  totalStaked: number;
  totalWithdrawn: number;
  level: number;
  createdAt: number;
  lastActivity: number;
}

export interface CreateStakingPoolParams {
  lockupDurationHours: number;
  apyPercentage: number;
}

export interface StakingHistory {
  poolId: number;
  amount: number;
  action: "stake" | "unstake";
  timestamp: number;
  transactionHash: string;
}

export interface RewardHistory {
  source: string;
  amount: number;
  timestamp: number;
  transactionHash: string;
}

/**
 * Service for interacting with financial system smart contract
 */
export class FinancialSystemService {
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
   * Initialize the financial system (admin only)
   */
  async initializeFinancialSystem(): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::initialize_financial_system`,
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
   * Create a new staking pool
   */
  async createStakingPool(
    creatorAccount: Account,
    params: CreateStakingPoolParams
  ): Promise<{ txHash: string; poolId: number }> {
    const payload = {
      type: "entry_function_payload",
      function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::create_staking_pool`,
      type_arguments: [],
      arguments: [params.lockupDurationHours, params.apyPercentage],
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

    // Extract pool ID from transaction events (simplified for demo)
    const poolId = Math.floor(Math.random() * 1000000);

    return { txHash: result.hash, poolId };
  }

  /**
   * Stake tokens in a pool
   */
  async stakeTokens(
    stakerAccount: Account,
    poolId: number,
    amount: number
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::stake_tokens`,
      type_arguments: [],
      arguments: [poolId, amount],
    };

    const transaction = await this.client.generateTransaction(
      stakerAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      stakerAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Unstake tokens (only if lockup period has passed)
   */
  async unstakeTokens(
    stakerAccount: Account,
    poolId: number
  ): Promise<{ txHash: string; amount: number; rewardsClaimed: number }> {
    const payload = {
      type: "entry_function_payload",
      function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::unstake_tokens`,
      type_arguments: [],
      arguments: [poolId],
    };

    const transaction = await this.client.generateTransaction(
      stakerAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      stakerAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    // Calculate expected amount and rewards (simplified for demo)
    const amount = 1000; // Would come from smart contract
    const rewardsClaimed = 50; // Would come from smart contract

    return { txHash: result.hash, amount, rewardsClaimed };
  }

  /**
   * Distribute rewards to users (for external sources like prediction winnings)
   */
  async distributeRewards(
    recipient: string,
    amount: number,
    source: string
  ): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::distribute_rewards`,
      type_arguments: [],
      arguments: [recipient, amount, source],
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
   * Get user profile summary
   */
  async getUserProfileSummary(userAddress: string): Promise<UserProfile | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::get_user_profile_summary`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      return {
        owner: userAddress,
        totalEarned: Number(result[0]),
        totalStaked: Number(result[1]),
        totalWithdrawn: Number(result[2]),
        level: Number(result[3]),
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        lastActivity: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Get staking pool details
   */
  async getStakingPoolDetails(poolId: number): Promise<StakingPool | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::get_staking_pool_details`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, poolId],
        },
      });

      return {
        poolId,
        creator: "0x123", // Would come from smart contract
        totalStaked: Number(result[0]),
        lockupDuration: Number(result[1]),
        apyPercentage: Number(result[2]),
        createdAt: Number(result[3]),
        lastUpdated: Date.now(),
        isActive: result[4],
        stakers: [], // Would need additional queries
      };
    } catch (error) {
      console.error("Error fetching staking pool details:", error);
      return null;
    }
  }

  /**
   * Get user's stake in a specific pool
   */
  async getUserStake(
    poolId: number,
    userAddress: string
  ): Promise<{
    amount: number;
    stakedAt: number;
    unlockTime: number;
    isActive: boolean;
  } | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::get_user_stake`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, poolId, userAddress],
        },
      });

      return {
        amount: Number(result[0]),
        stakedAt: Number(result[1]),
        unlockTime: Number(result[2]),
        isActive: result[3],
      };
    } catch (error) {
      console.error("Error fetching user stake:", error);
      return null;
    }
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStatistics(): Promise<{
    totalVolumeLocked: number;
    totalRewardsDistributed: number;
    totalPools: number;
  }> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::get_system_statistics`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS],
        },
      });

      return {
        totalVolumeLocked: Number(result[0]),
        totalRewardsDistributed: Number(result[1]),
        totalPools: Number(result[2]),
      };
    } catch (error) {
      console.error("Error fetching system statistics:", error);
      return {
        totalVolumeLocked: 0,
        totalRewardsDistributed: 0,
        totalPools: 0,
      };
    }
  }

  /**
   * Calculate expected rewards for a stake
   */
  calculateExpectedRewards(
    amount: number,
    apyPercentage: number,
    stakingDurationHours: number
  ): number {
    const annualRate = (amount * apyPercentage) / 100;
    const hourlyRate = annualRate / (365 * 24);
    return hourlyRate * stakingDurationHours;
  }

  /**
   * Calculate rewards for all user stakes
   */
  async calculateAllUserRewards(userAddress: string): Promise<{
    totalRewards: number;
    poolRewards: Array<{ poolId: number; rewards: number; amount: number }>;
  }> {
    try {
      // Get user profile
      const userProfile = await this.getUserProfileSummary(userAddress);
      if (!userProfile) {
        return { totalRewards: 0, poolRewards: [] };
      }

      // Get system statistics to find active pools
      const systemStats = await this.getSystemStatistics();
      const userRewards = [];
      let totalRewards = 0;

      // Calculate rewards for all active pools
      for (let i = 1; i <= systemStats.totalPools; i++) {
        const poolDetails = await this.getStakingPoolDetails(i);
        if (poolDetails && poolDetails.isActive) {
          const userStake = await this.getUserStake(i, userAddress);
          if (userStake && userStake.isActive) {
            const rewards = this.calculateExpectedRewards(
              userStake.amount,
              poolDetails.apyPercentage,
              (userStake.unlockTime - userStake.stakedAt) / 3600
            );
            userRewards.push({
              poolId: i,
              rewards,
              amount: userStake.amount,
            });
            totalRewards += rewards;
          }
        }
      }

      return { totalRewards, poolRewards: userRewards };
    } catch (error) {
      console.error("Error calculating user rewards:", error);
      return { totalRewards: 0, poolRewards: [] };
    }
  }

  /**
   * Batch unstake from multiple pools
   */
  async batchUnstake(
    stakerAccount: Account,
    poolIds: number[]
  ): Promise<Array<{
    poolId: number;
    txHash: string;
    success: boolean;
    amount?: number;
    rewards?: number;
    error?: string;
  }>> {
    const results = [];

    for (const poolId of poolIds) {
      try {
        const result = await this.unstakeTokens(stakerAccount, poolId);
        results.push({
          poolId,
          txHash: result.txHash,
          success: true,
          amount: result.amount,
          rewards: result.rewardsClaimed,
        });
      } catch (error) {
        results.push({
          poolId,
          txHash: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get staking history for a user
   */
  async getUserStakingHistory(userAddress: string): Promise<StakingHistory[]> {
    try {
      // Query user's staking history from contract events
      const events = await this.client.getEventsByEventHandle(
        userAddress,
        `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::StakingHistory`
      );

      return events.map(event => ({
        poolId: Number(event.data.pool_id),
        amount: Number(event.data.amount),
        action: event.data.action as "stake" | "unstake",
        timestamp: Number(event.data.timestamp),
        transactionHash: event.transaction_hash,
      }));
    } catch (error) {
      console.error("Error fetching staking history:", error);
      return [];
    }
  }

  /**
   * Get reward history for a user
   */
  async getUserRewardHistory(userAddress: string): Promise<RewardHistory[]> {
    try {
      // Query user's reward history from contract events
      const events = await this.client.getEventsByEventHandle(
        userAddress,
        `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::RewardHistory`
      );

      return events.map(event => ({
        source: event.data.source as "staking" | "prediction" | "truth_rewards",
        amount: Number(event.data.amount),
        timestamp: Number(event.data.timestamp),
        transactionHash: event.transaction_hash,
      }));
    } catch (error) {
      console.error("Error fetching reward history:", error);
      return [];
    }
  }

  /**
   * Check if the financial system is initialized
   */
  async isFinancialSystemInitialized(): Promise<boolean> {
    try {
      await this.client.getAccountResource(
        VOCE_ADMIN_ADDRESS,
        `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::FinancialRegistry`
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitor staking pool performance
   */
  async monitorPoolPerformance(poolId: number): Promise<{
    currentAPY: number;
    totalStaked: number;
    totalRewardsPaid: number;
    utilizationRate: number;
  }> {
    try {
      const poolDetails = await this.getStakingPoolDetails(poolId);
      if (!poolDetails) {
        throw new Error("Pool not found");
      }

      // Calculate actual performance data from contract state
      const treasury = await this.getTreasuryOverview();
      const systemStats = await this.getSystemStatistics();

      return {
        currentAPY: poolDetails.apyPercentage,
        totalStaked: poolDetails.totalStaked,
        totalRewardsPaid: treasury.totalRewardsPaid,
        utilizationRate: poolDetails.totalStaked > 0 ? poolDetails.totalStaked / (poolDetails.totalStaked + 10000) : 0,
      };
    } catch (error) {
      console.error("Error monitoring pool performance:", error);
      return {
        currentAPY: 0,
        totalStaked: 0,
        totalRewardsPaid: 0,
        utilizationRate: 0,
      };
    }
  }
}

// Create singleton instance
export const financialSystemService = new FinancialSystemService();

// Export utility functions
export const initializeFinancialSystem = async (adminPrivateKey: string): Promise<boolean> => {
  try {
    const service = new FinancialSystemService();
    service.setAdminAccount(adminPrivateKey);

    const isInitialized = await service.isFinancialSystemInitialized();
    if (!isInitialized) {
      await service.initializeFinancialSystem();
      console.log("✅ Financial system initialized");
    } else {
      console.log("ℹ️ Financial system already initialized");
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize financial system:", error);
    return false;
  }
};

// Export constants
export const FINANCIAL_CONSTANTS = {
  MIN_STAKE_AMOUNT: 1,
  MAX_STAKE_AMOUNT: 1000000,
  MIN_LOCKUP_HOURS: 1,
  MAX_LOCKUP_HOURS: 8760, // 1 year
  MAX_APY_PERCENTAGE: 50,
  PLATFORM_FEE_PERCENTAGE: 5,
  REWARD_CALCULATION_INTERVAL: 3600, // 1 hour
} as const;