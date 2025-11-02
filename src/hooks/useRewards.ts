import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { calculateLevel, getTotalCoinsEarned } from "@/types/level";
import { onChainLevelService, OnChainUserLevelData } from "@/aptos/services/onchainLevels";

interface Reward {
  id: string;
  type: "xp" | "crypto";
  amount: number;
  source: string;
  eventId: string;
  timestamp: number;
  transactionHash?: string;
  status: "pending" | "claimed" | "distributed";
  onChain?: boolean;
}

interface UserStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  levelProgress: number;
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
  useOnChain: boolean;
  onChainData: OnChainUserLevelData | null;
  isSyncing: boolean;
}

// Configuration
const ENABLE_ON_CHAIN = import.meta.env.VITE_ENABLE_ON_CHAIN_LEVELS === "true";

export const useRewards = () => {
  const { account } = useWallet();
  const [rewardsState, setRewardsState] = useState<RewardsState>({
    rewards: [],
    stats: {
      totalXP: 0,
      level: 1,
      xpToNextLevel: 1000,
      levelProgress: 0,
      totalCryptoEarned: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      accuracy: 0,
      streak: 0,
      highestStreak: 0,
    },
    isProcessing: false,
    error: null,
    useOnChain: ENABLE_ON_CHAIN,
    onChainData: null,
    isSyncing: false,
  });

  // Calculate level from XP using the new unlimited system
  const calculateLevelFromXP = useCallback((xp: number) => {
    return calculateLevel(xp);
  }, []);

  // Calculate stats from XP
  const calculateStatsFromXP = useCallback((xp: number) => {
    const levelData = calculateLevelFromXP(xp);
    const totalCoins = getTotalCoinsEarned(xp);

    return {
      level: levelData.level,
      xpToNextLevel: levelData.nextLevelXP,
      levelProgress: levelData.progress,
      totalCryptoEarned: totalCoins,
    };
  }, [calculateLevelFromXP]);

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
  const loadLocalStats = useCallback(() => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `stats_${account.accountAddress.toString()}`;
      const stored = localStorage.getItem(key);
      const stats = stored ? JSON.parse(stored) : {
        totalXP: 0,
        level: 1,
        xpToNextLevel: 1000,
        levelProgress: 0,
        totalCryptoEarned: 0,
        correctPredictions: 0,
        totalPredictions: 0,
        accuracy: 0,
        streak: 0,
        highestStreak: 0,
      };

      // Recalculate level-based stats using new system
      const levelStats = calculateStatsFromXP(stats.totalXP);
      const updatedStats = { ...stats, ...levelStats };

      setRewardsState(prev => ({ ...prev, stats: updatedStats }));
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [account, calculateStatsFromXP]);

  // Load on-chain data
  const loadOnChainData = useCallback(async () => {
    if (!account?.accountAddress.toString() || !rewardsState.useOnChain) return;

    try {
      setRewardsState(prev => ({ ...prev, isSyncing: true }));

      const onChainData = await onChainLevelService.getUserLevelData(
        account.accountAddress.toString()
      );

      if (onChainData) {
        setRewardsState(prev => ({ ...prev, onChainData }));

        // Update local stats with on-chain data
        const levelStats = calculateStatsFromXP(onChainData.xp);
        const updatedStats = {
          ...prev.stats,
          totalXP: onChainData.xp,
          level: onChainData.level,
          totalCryptoEarned: onChainData.totalEarnedCoins,
          correctPredictions: onChainData.correctPredictions,
          totalPredictions: onChainData.predictionCount,
          accuracy: onChainData.predictionCount > 0
            ? (onChainData.correctPredictions / onChainData.predictionCount) * 100
            : 0,
          streak: onChainData.currentStreak,
          highestStreak: onChainData.bestStreak,
          ...levelStats,
        };

        setRewardsState(prev => ({ ...prev, stats: updatedStats }));
      }
    } catch (error) {
      console.error("Failed to load on-chain data:", error);
    } finally {
      setRewardsState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [account, rewardsState.useOnChain, calculateStatsFromXP]);

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
  const saveLocalStats = useCallback((stats: UserStats) => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `stats_${account.accountAddress.toString()}`;
      localStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to save stats:", error);
    }
  }, [account]);

  // Sync local data to on-chain
  const syncToOnChain = useCallback(async () => {
    if (!account?.accountAddress.toString() || !rewardsState.useOnChain) return;

    try {
      setRewardsState(prev => ({ ...prev, isSyncing: true }));

      const userAddress = account.accountAddress.toString();
      const { stats } = rewardsState;

      // Get on-chain data
      const onChainData = await onChainLevelService.getUserLevelData(userAddress);

      if (!onChainData || onChainData.xp < stats.totalXP) {
        // Sync XP difference
        const xpDiff = stats.totalXP - (onChainData?.xp || 0);
        if (xpDiff > 0) {
          await onChainLevelService.addXP(userAddress, xpDiff, "Sync from local");

          // Create on-chain reward record
          const newReward: Reward = {
            id: `reward_${Date.now()}_${Math.random()}`,
            type: "xp",
            amount: xpDiff,
            source: "Chain Sync",
            eventId: "sync",
            timestamp: Date.now(),
            status: "distributed",
            onChain: true,
          };

          setRewardsState(prev => ({
            ...prev,
            rewards: [...prev.rewards, newReward]
          }));
        }
      }

      if (!onChainData || onChainData.totalEarnedCoins < stats.totalCryptoEarned) {
        // Sync coins difference
        const coinsDiff = stats.totalCryptoEarned - (onChainData?.totalEarnedCoins || 0);
        if (coinsDiff > 0) {
          await onChainLevelService.addCoins(userAddress, coinsDiff, "Sync from local");

          // Create on-chain reward record
          const newReward: Reward = {
            id: `reward_${Date.now()}_${Math.random()}`,
            type: "crypto",
            amount: coinsDiff,
            source: "Chain Sync",
            eventId: "sync",
            timestamp: Date.now(),
            status: "distributed",
            onChain: true,
          };

          setRewardsState(prev => ({
            ...prev,
            rewards: [...prev.rewards, newReward]
          }));
        }
      }

      // Reload on-chain data after sync
      await loadOnChainData();

      console.log("✅ Local data synced to on-chain");
    } catch (error) {
      console.error("❌ Failed to sync to on-chain:", error);
      setRewardsState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to sync to on-chain"
      }));
    } finally {
      setRewardsState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [account, rewardsState.useOnChain, rewardsState.stats, loadOnChainData]);

  // Add XP reward
  const addXPReward = useCallback((
    amount: number,
    source: string,
    eventId: string
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      setRewardsState(prev => ({ ...prev, isProcessing: true, error: null }));

      try {
        let transactionHash: string | undefined;

        // Add to on-chain if enabled
        if (rewardsState.useOnChain && account?.accountAddress.toString()) {
          try {
            transactionHash = await onChainLevelService.addXP(
              account.accountAddress.toString(),
              amount,
              source
            );
          } catch (chainError) {
            console.warn("Failed to add XP to chain, falling back to local:", chainError);
          }
        }

        // Create reward record
        const newReward: Reward = {
          id: `reward_${Date.now()}_${Math.random()}`,
          type: "xp",
          amount,
          source,
          eventId,
          timestamp: Date.now(),
          transactionHash,
          status: "distributed",
          onChain: !!transactionHash,
        };

        // Update local state
        const updatedRewards = [...rewardsState.rewards, newReward];
        saveRewards(updatedRewards);

        // Update stats
        const newTotalXP = rewardsState.stats.totalXP + amount;
        const newStats = {
          ...rewardsState.stats,
          totalXP: newTotalXP,
          ...calculateStatsFromXP(newTotalXP),
        };

        saveLocalStats(newStats);

        setRewardsState(prev => ({
          ...prev,
          rewards: updatedRewards,
          stats: newStats,
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
    });
  }, [rewardsState, account, saveRewards, saveLocalStats, calculateStatsFromXP]);

  // Add crypto reward
  const addCryptoReward = useCallback((
    amount: number,
    source: string,
    eventId: string
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      setRewardsState(prev => ({ ...prev, isProcessing: true, error: null }));

      try {
        let transactionHash: string | undefined;

        // Add to on-chain if enabled
        if (rewardsState.useOnChain && account?.accountAddress.toString()) {
          try {
            transactionHash = await onChainLevelService.addCoins(
              account.accountAddress.toString(),
              amount,
              source
            );
          } catch (chainError) {
            console.warn("Failed to add coins to chain, falling back to local:", chainError);
          }
        }

        // Create reward record
        const newReward: Reward = {
          id: `reward_${Date.now()}_${Math.random()}`,
          type: "crypto",
          amount,
          source,
          eventId,
          timestamp: Date.now(),
          transactionHash,
          status: "distributed",
          onChain: !!transactionHash,
        };

        // Update local state
        const updatedRewards = [...rewardsState.rewards, newReward];
        saveRewards(updatedRewards);

        const updatedStats = {
          ...rewardsState.stats,
          totalCryptoEarned: rewardsState.stats.totalCryptoEarned + amount,
        };

        saveLocalStats(updatedStats);

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
    });
  }, [rewardsState, account, saveRewards, saveLocalStats]);

  // Update prediction accuracy
  const updatePredictionStats = useCallback(async (correct: boolean) => {
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

    saveLocalStats(updatedStats);
    setRewardsState(prev => ({ ...prev, stats: updatedStats }));

    // Update on-chain if enabled
    if (rewardsState.useOnChain && account?.accountAddress.toString()) {
      try {
        await onChainLevelService.updatePredictionStats(
          account.accountAddress.toString(),
          correct
        );
      } catch (error) {
        console.warn("Failed to update prediction stats on-chain:", error);
      }
    }
  }, [rewardsState.stats, account, rewardsState.useOnChain, saveLocalStats]);

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
      const isCorrect = userOptionId === winningOptionId;

      // Process all rewards in batch for on-chain
      if (rewardsState.useOnChain && account?.accountAddress.toString()) {
        const rewards = {
          xp: 10, // Participation reward
          coins: 0,
          isCorrectPrediction: isCorrect,
          reason: "Event completion",
        };

        if (matchedMajority) {
          rewards.xp += 50; // Majority match bonus
        }

        if (isCorrect) {
          rewards.coins = Math.floor(stakeAmount * 1.5); // 50% profit
          rewards.xp += 100; // Correct prediction bonus
        }

        try {
          const result = await onChainLevelService.processRewards(
            account.accountAddress.toString(),
            rewards
          );

          console.log("✅ Rewards processed on-chain:", result.txHash);

          // Create local reward records
          const newRewards: Reward[] = [];

          if (rewards.xp > 0) {
            newRewards.push({
              id: `reward_${Date.now()}_${Math.random()}`,
              type: "xp",
              amount: rewards.xp,
              source: "Event Completion",
              eventId,
              timestamp: Date.now(),
              transactionHash: result.txHash,
              status: "distributed",
              onChain: true,
            });
          }

          if (rewards.coins > 0) {
            newRewards.push({
              id: `reward_${Date.now()}_${Math.random()}`,
              type: "crypto",
              amount: rewards.coins,
              source: "Event Completion",
              eventId,
              timestamp: Date.now(),
              transactionHash: result.txHash,
              status: "distributed",
              onChain: true,
            });
          }

          setRewardsState(prev => ({
            ...prev,
            rewards: [...prev.rewards, ...newRewards]
          }));

          // Reload on-chain data
          await loadOnChainData();

        } catch (chainError) {
          console.warn("Failed to process rewards on-chain, falling back to local:", chainError);

          // Fallback to local processing
          if (matchedMajority) {
            await addXPReward(50, "Majority Match", eventId);
          }

          if (isCorrect) {
            await addCryptoReward(Math.floor(stakeAmount * 1.5), "Correct Prediction", eventId);
            await addXPReward(100, "Correct Prediction", eventId);
          }

          await addXPReward(10, "Participation", eventId);
        }
      } else {
        // Local-only processing
        if (matchedMajority) {
          await addXPReward(50, "Majority Match", eventId);
        }

        if (isCorrect) {
          await addCryptoReward(Math.floor(stakeAmount * 1.5), "Correct Prediction", eventId);
          await addXPReward(100, "Correct Prediction", eventId);
        }

        await addXPReward(10, "Participation", eventId);
      }

      // Update prediction stats
      await updatePredictionStats(isCorrect);

    } catch (error) {
      console.error("Failed to calculate event rewards:", error);
      setRewardsState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to calculate rewards",
      }));
    }
  }, [addXPReward, addCryptoReward, updatePredictionStats, rewardsState.useOnChain, account, loadOnChainData]);

  // Get level progression
  const getLevelProgress = useCallback(() => {
    const { level, totalXP, xpToNextLevel, levelProgress } = rewardsState.stats;
    return { progress: levelProgress, currentLevel: level, totalXP, xpToNextLevel };
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

  // Get on-chain rewards only
  const getOnChainRewards = useCallback((): Reward[] => {
    return rewardsState.rewards.filter(reward => reward.onChain);
  }, [rewardsState.rewards]);

  // Initialize rewards and stats on component mount
  const initializeRewards = useCallback(async () => {
    loadRewards();
    loadLocalStats();

    if (rewardsState.useOnChain) {
      await loadOnChainData();
    }
  }, [loadRewards, loadLocalStats, loadOnChainData, rewardsState.useOnChain]);

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
    useOnChain: rewardsState.useOnChain,
    onChainData: rewardsState.onChainData,
    isSyncing: rewardsState.isSyncing,

    // Actions
    addXPReward,
    addCryptoReward,
    calculateEventRewards,
    updatePredictionStats,
    syncToOnChain,

    // Getters
    getLevelProgress,
    getRecentRewards,
    getRewardsByType,
    getOnChainRewards,

    // Initialize
    initializeRewards,

    // Computed
    currentLevel: rewardsState.stats.level,
    totalXP: rewardsState.stats.totalXP,
    accuracy: rewardsState.stats.accuracy,
    streak: rewardsState.stats.streak,
  };
};