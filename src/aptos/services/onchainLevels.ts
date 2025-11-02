import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";

// Contract configuration
const LEVEL_SYSTEM_ADDRESS = import.meta.env.VITE_LEVEL_SYSTEM_ADDRESS || "0x1";
const VOCE_ADMIN_ADDRESS = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "0x123";

// Interfaces for on-chain level data
export interface OnChainUserLevelData {
  xp: number;
  level: number;
  totalEarnedCoins: number;
  currentStreak: number;
  bestStreak: number;
  predictionCount: number;
  correctPredictions: number;
  lastUpdated: number;
}

export interface LevelProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
  xpToNextLevel: number;
}

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Service for managing on-chain level data
 */
export class OnChainLevelService {
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
   * Initialize the level system (admin only)
   */
  async initializeLevelSystem(): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${LEVEL_SYSTEM_ADDRESS}::level_system::initialize_level_system`,
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
   * Get user's on-chain level data
   */
  async getUserLevelData(userAddress: string): Promise<OnChainUserLevelData | null> {
    try {
      const resource = await this.client.getAccountResource(
        VOCE_ADMIN_ADDRESS,
        `${LEVEL_SYSTEM_ADDRESS}::level_system::UserLevelRegistry`
      );

      // Check if user has level data
      const hasUserData = await this.client.view({
        payload: {
          function: `${LEVEL_SYSTEM_ADDRESS}::level_system::has_user_data`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      if (!hasUserData[0]) {
        return null;
      }

      // Get user level data
      const userData = await this.client.view({
        payload: {
          function: `${LEVEL_SYSTEM_ADDRESS}::level_system::view_user_level_data`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      return {
        xp: Number(userData[0]),
        level: Number(userData[1]),
        totalEarnedCoins: Number(userData[2]),
        currentStreak: Number(userData[3]),
        bestStreak: Number(userData[4]),
        predictionCount: Number(userData[5]),
        correctPredictions: Number(userData[6]),
        lastUpdated: Number(userData[7]),
      };
    } catch (error) {
      console.error("Error fetching user level data:", error);
      return null;
    }
  }

  /**
   * Add XP to user (admin only)
   */
  async addXP(
    userAddress: string,
    xpAmount: number,
    reason: string = "Reward"
  ): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${LEVEL_SYSTEM_ADDRESS}::level_system::add_xp`,
      type_arguments: [],
      arguments: [userAddress, xpAmount, btoa(reason)],
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
   * Add coins to user (admin only)
   */
  async addCoins(
    userAddress: string,
    coinsAmount: number,
    reason: string = "Prediction reward"
  ): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${LEVEL_SYSTEM_ADDRESS}::level_system::add_coins`,
      type_arguments: [],
      arguments: [userAddress, coinsAmount, btoa(reason)],
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
   * Update prediction statistics (admin only)
   */
  async updatePredictionStats(
    userAddress: string,
    isCorrect: boolean
  ): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${LEVEL_SYSTEM_ADDRESS}::level_system::update_prediction_stats`,
      type_arguments: [],
      arguments: [userAddress, isCorrect],
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
   * Get level progress information
   */
  async getLevelProgress(userAddress: string): Promise<LevelProgress | null> {
    try {
      const currentXP = await this.client.view({
        payload: {
          function: `${LEVEL_SYSTEM_ADDRESS}::level_system::get_xp_for_next_level`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      const progress = await this.client.view({
        payload: {
          function: `${LEVEL_SYSTEM_ADDRESS}::level_system::get_level_progress`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      const userData = await this.getUserLevelData(userAddress);
      if (!userData) return null;

      return {
        level: userData.level,
        currentXP: userData.xp,
        nextLevelXP: Number(currentXP[0]),
        progress: Number(progress[0]),
        xpToNextLevel: Math.max(0, Number(currentXP[0]) - userData.xp),
      };
    } catch (error) {
      console.error("Error getting level progress:", error);
      return null;
    }
  }

  /**
   * Get prediction statistics
   */
  async getPredictionStats(userAddress: string): Promise<PredictionStats | null> {
    try {
      const accuracy = await this.client.view({
        payload: {
          function: `${LEVEL_SYSTEM_ADDRESS}::level_system::get_accuracy`,
          type_arguments: [],
          arguments: [userAddress],
        },
      });

      const userData = await this.getUserLevelData(userAddress);
      if (!userData) return null;

      return {
        totalPredictions: userData.predictionCount,
        correctPredictions: userData.correctPredictions,
        accuracy: Number(accuracy[0]),
        currentStreak: userData.currentStreak,
        bestStreak: userData.bestStreak,
      };
    } catch (error) {
      console.error("Error getting prediction stats:", error);
      return null;
    }
  }

  /**
   * Batch reward processing - handle multiple rewards in one transaction
   */
  async processRewards(
    userAddress: string,
    rewards: {
      xp?: number;
      coins?: number;
      isCorrectPrediction?: boolean;
      reason?: string;
    }
  ): Promise<{ txHash: string; results: any[] }> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const results = [];
    let txHash = "";

    // Process XP reward
    if (rewards.xp && rewards.xp > 0) {
      txHash = await this.addXP(userAddress, rewards.xp, rewards.reason || "XP Reward");
      results.push({ type: "xp", amount: rewards.xp, txHash });
    }

    // Process coin reward
    if (rewards.coins && rewards.coins > 0) {
      txHash = await this.addCoins(userAddress, rewards.coins, rewards.reason || "Coin Reward");
      results.push({ type: "coins", amount: rewards.coins, txHash });
    }

    // Update prediction stats
    if (rewards.isCorrectPrediction !== undefined) {
      txHash = await this.updatePredictionStats(userAddress, rewards.isCorrectPrediction);
      results.push({ type: "stats", correct: rewards.isCorrectPrediction, txHash });
    }

    return { txHash, results };
  }

  /**
   * Get multiple users' level data (batch operation)
   */
  async getMultipleUsersLevelData(userAddresses: string[]): Promise<Map<string, OnChainUserLevelData | null>> {
    const results = new Map<string, OnChainUserLevelData | null>();

    const promises = userAddresses.map(async (address) => {
      const data = await this.getUserLevelData(address);
      results.set(address, data);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Check if the level system is initialized
   */
  async isLevelSystemInitialized(): Promise<boolean> {
    try {
      await this.client.getAccountResource(
        VOCE_ADMIN_ADDRESS,
        `${LEVEL_SYSTEM_ADDRESS}::level_system::UserLevelRegistry`
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const onChainLevelService = new OnChainLevelService();

// Export utility functions
export const initializeOnChainLevels = async (adminPrivateKey: string): Promise<boolean> => {
  try {
    const service = new OnChainLevelService();
    service.setAdminAccount(adminPrivateKey);

    const isInitialized = await service.isLevelSystemInitialized();
    if (!isInitialized) {
      await service.initializeLevelSystem();
      console.log("✅ On-chain level system initialized");
    } else {
      console.log("ℹ️ On-chain level system already initialized");
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize on-chain level system:", error);
    return false;
  }
};

export const syncLocalToChain = async (
  userAddress: string,
  localXP: number,
  localCoins: number,
  localStats: any
): Promise<boolean> => {
  try {
    const onChainData = await onChainLevelService.getUserLevelData(userAddress);

    if (!onChainData || onChainData.xp < localXP) {
      // Sync XP difference
      const xpDiff = localXP - (onChainData?.xp || 0);
      if (xpDiff > 0) {
        await onChainLevelService.addXP(userAddress, xpDiff, "Sync from local");
      }
    }

    if (!onChainData || onChainData.totalEarnedCoins < localCoins) {
      // Sync coins difference
      const coinsDiff = localCoins - (onChainData?.totalEarnedCoins || 0);
      if (coinsDiff > 0) {
        await onChainLevelService.addCoins(userAddress, coinsDiff, "Sync from local");
      }
    }

    console.log("✅ Local data synced to chain");
    return true;
  } catch (error) {
    console.error("❌ Failed to sync local data to chain:", error);
    return false;
  }
};