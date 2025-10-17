import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface Reward {
  id: string;
  type: "xp" | "crypto";
  amount: number;
  source: string;
  eventId: string;
  timestamp: number;
  transactionHash?: string;
  status: "pending" | "claimed" | "distributed";
}

interface UserStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  totalCryptoEarned: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  streak: number;
  highestStreak: number;
}

interface RewardsState {
  rewards: Reward[];
  stats: UserStats;
  isProcessing: boolean;
  error: string | null;
}

// XP thresholds for levels (can be adjusted)
const XP_THRESHOLDS = [
  0,    // Level 0
  100,  // Level 1
  250,  // Level 2
  500,  // Level 3
  1000, // Level 4
  2000, // Level 5
  3500, // Level 6
  5000, // Level 7
  7500, // Level 8
  10000 // Level 9 (max)
];

export const useRewards = () => {
  const { account } = useWallet();
  const [rewardsState, setRewardsState] = useState<RewardsState>({
    rewards: [],
    stats: {
      totalXP: 0,
      level: 0,
      xpToNextLevel: 100,
      totalCryptoEarned: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      accuracy: 0,
      streak: 0,
      highestStreak: 0,
    },
    isProcessing: false,
    error: null,
  });

  // Calculate level from XP
  const calculateLevel = useCallback((xp: number): number => {
    let level = 0;
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= XP_THRESHOLDS[i]) {
        level = i;
        break;
      }
    }
    return level;
  }, []);

  // Calculate XP needed for next level
  const calculateXPToNextLevel = useCallback((xp: number): number => {
    const currentLevel = calculateLevel(xp);
    if (currentLevel >= XP_THRESHOLDS.length - 1) {
      return 0; // Max level
    }
    return XP_THRESHOLDS[currentLevel + 1] - xp;
  }, [calculateLevel]);

  // Load rewards from localStorage
  const loadRewards = useCallback(() => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `rewards_${account.accountAddress.toString()}`;
      const stored = localStorage.getItem(key);
      const rewards = stored ? JSON.parse(stored) : [];
      setRewardsState(prev => ({ ...prev, rewards }));
    } catch (error) {
      console.error("Failed to load rewards:", error);
    }
  }, [account]);

  // Load user stats from localStorage
  const loadStats = useCallback(() => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `stats_${account.accountAddress.toString()}`;
      const stored = localStorage.getItem(key);
      const stats = stored ? JSON.parse(stored) : {
        totalXP: 0,
        level: 0,
        xpToNextLevel: 100,
        totalCryptoEarned: 0,
        correctPredictions: 0,
        totalPredictions: 0,
        accuracy: 0,
        streak: 0,
        highestStreak: 0,
      };
      setRewardsState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [account]);

  // Save rewards to localStorage
  const saveRewards = useCallback((rewards: Reward[]) => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `rewards_${account.accountAddress.toString()}`;
      localStorage.setItem(key, JSON.stringify(rewards));
    } catch (error) {
      console.error("Failed to save rewards:", error);
    }
  }, [account]);

  // Save stats to localStorage
  const saveStats = useCallback((stats: UserStats) => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `stats_${account.accountAddress.toString()}`;
      localStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to save stats:", error);
    }
  }, [account]);

  // Add XP reward
  const addXPReward = useCallback((
    amount: number,
    source: string,
    eventId: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      setRewardsState(prev => ({ ...prev, isProcessing: true, error: null }));

      setTimeout(() => {
        try {
          const newReward: Reward = {
            id: `reward_${Date.now()}_${Math.random()}`,
            type: "xp",
            amount,
            source,
            eventId,
            timestamp: Date.now(),
            status: "distributed",
          };

          const updatedRewards = [...rewardsState.rewards, newReward];
          saveRewards(updatedRewards);

          // Update stats
          const newTotalXP = rewardsState.stats.totalXP + amount;
          const newLevel = calculateLevel(newTotalXP);
          const newXPToNextLevel = calculateXPToNextLevel(newTotalXP);

          const updatedStats = {
            ...rewardsState.stats,
            totalXP: newTotalXP,
            level: newLevel,
            xpToNextLevel: newXPToNextLevel,
          };

          saveStats(updatedStats);

          setRewardsState(prev => ({
            ...prev,
            rewards: updatedRewards,
            stats: updatedStats,
            isProcessing: false,
          }));

          resolve();
        } catch (error) {
          setRewardsState(prev => ({
            ...prev,
            isProcessing: false,
            error: error instanceof Error ? error.message : "Failed to add XP reward",
          }));
          reject(error);
        }
      }, 1000); // Simulate processing time
    });
  }, [rewardsState.rewards, rewardsState.stats, saveRewards, saveStats, calculateLevel, calculateXPToNextLevel]);

  // Add crypto reward
  const addCryptoReward = useCallback((
    amount: number,
    source: string,
    eventId: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      setRewardsState(prev => ({ ...prev, isProcessing: true, error: null }));

      setTimeout(() => {
        try {
          const newReward: Reward = {
            id: `reward_${Date.now()}_${Math.random()}`,
            type: "crypto",
            amount,
            source,
            eventId,
            timestamp: Date.now(),
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            status: "distributed",
          };

          const updatedRewards = [...rewardsState.rewards, newReward];
          saveRewards(updatedRewards);

          // Update stats
          const updatedStats = {
            ...rewardsState.stats,
            totalCryptoEarned: rewardsState.stats.totalCryptoEarned + amount,
          };

          saveStats(updatedStats);

          setRewardsState(prev => ({
            ...prev,
            rewards: updatedRewards,
            stats: updatedStats,
            isProcessing: false,
          }));

          resolve();
        } catch (error) {
          setRewardsState(prev => ({
            ...prev,
            isProcessing: false,
            error: error instanceof Error ? error.message : "Failed to add crypto reward",
          }));
          reject(error);
        }
      }, 1500); // Simulate blockchain processing time
    });
  }, [rewardsState.rewards, rewardsState.stats, saveRewards, saveStats]);

  // Update prediction accuracy
  const updatePredictionStats = useCallback((correct: boolean) => {
    const newTotalPredictions = rewardsState.stats.totalPredictions + 1;
    const newCorrectPredictions = correct ? rewardsState.stats.correctPredictions + 1 : rewardsState.stats.correctPredictions;
    const newAccuracy = newTotalPredictions > 0 ? (newCorrectPredictions / newTotalPredictions) * 100 : 0;

    // Update streak
    let newStreak = correct ? rewardsState.stats.streak + 1 : 0;
    const newHighestStreak = Math.max(newStreak, rewardsState.stats.highestStreak);

    const updatedStats = {
      ...rewardsState.stats,
      totalPredictions: newTotalPredictions,
      correctPredictions: newCorrectPredictions,
      accuracy: newAccuracy,
      streak: newStreak,
      highestStreak: newHighestStreak,
    };

    saveStats(updatedStats);
    setRewardsState(prev => ({ ...prev, stats: updatedStats }));
  }, [rewardsState.stats, saveStats]);

  // Calculate rewards for event completion
  const calculateEventRewards = useCallback(async (
    eventId: string,
    userOptionId: string,
    winningOptionId: string,
    stakeAmount: number,
    matchedMajority: boolean
  ): Promise<void> => {
    setRewardsState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // XP reward for matching majority
      if (matchedMajority) {
        await addXPReward(50, "Majority Match", eventId);
      }

      // Crypto reward for correct prediction
      if (userOptionId === winningOptionId) {
        const rewardAmount = stakeAmount * 1.5; // 50% profit
        await addCryptoReward(rewardAmount, "Correct Prediction", eventId);
        await addXPReward(100, "Correct Prediction", eventId);
        updatePredictionStats(true);
      } else {
        updatePredictionStats(false);
      }

      // Participation reward
      await addXPReward(10, "Participation", eventId);

    } catch (error) {
      console.error("Failed to calculate event rewards:", error);
      setRewardsState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to calculate rewards",
      }));
    }
  }, [addXPReward, addCryptoReward, updatePredictionStats]);

  // Get level progression
  const getLevelProgress = useCallback(() => {
    const { level, totalXP, xpToNextLevel } = rewardsState.stats;
    if (level >= XP_THRESHOLDS.length - 1) {
      return { progress: 100, currentLevelXP: XP_THRESHOLDS[level], nextLevelXP: XP_THRESHOLDS[level] };
    }

    const currentLevelXP = XP_THRESHOLDS[level];
    const nextLevelXP = XP_THRESHOLDS[level + 1];
    const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return { progress, currentLevelXP, nextLevelXP };
  }, [rewardsState.stats]);

  // Get recent rewards
  const getRecentRewards = useCallback((limit: number = 10): Reward[] => {
    return rewardsState.rewards
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [rewardsState.rewards]);

  // Get rewards by type
  const getRewardsByType = useCallback((type: "xp" | "crypto"): Reward[] => {
    return rewardsState.rewards.filter(reward => reward.type === type);
  }, [rewardsState.rewards]);

  // Initialize rewards and stats on component mount
  const initializeRewards = useCallback(() => {
    loadRewards();
    loadStats();
  }, [loadRewards, loadStats]);

  // Initialize when account changes
  useEffect(() => {
    if (account) {
      initializeRewards();
    }
  }, [account, initializeRewards]);

  return {
    // State
    rewards: rewardsState.rewards,
    stats: rewardsState.stats,
    isProcessing: rewardsState.isProcessing,
    error: rewardsState.error,

    // Actions
    addXPReward,
    addCryptoReward,
    calculateEventRewards,
    updatePredictionStats,

    // Getters
    getLevelProgress,
    getRecentRewards,
    getRewardsByType,

    // Initialize
    initializeRewards,

    // Computed
    currentLevel: rewardsState.stats.level,
    totalXP: rewardsState.stats.totalXP,
    accuracy: rewardsState.stats.accuracy,
    streak: rewardsState.stats.streak,
  };
};