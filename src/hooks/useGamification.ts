import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import {
  UserProgress,
  Badge,
  Quest,
  MysteryCrate,
  XPSystem,
  AchievementSystem,
} from '@/lib/gamification';

interface UseGamificationReturn {
  // User progress
  progress: UserProgress | null;
  loading: boolean;

  // Quests
  dailyQuests: Quest[];
  weeklyQuests: Quest[];

  // Actions
  addXP: (amount: number, source?: string) => void;
  updateStreak: (isCorrect: boolean) => void;
  completeQuest: (questId: string) => void;
  openMysteryCrate: (crateId: string) => Promise<CrateOpenResult | null>;

  // Utilities
  refreshProgress: () => Promise<void>;
}

interface CrateOpenResult {
  rewards: Array<{
    type: string;
    value: string | number;
    rarity: string;
  }>;
}

export const useGamification = (): UseGamificationReturn => {
  const { account, isConnected } = useWallet();
  const { toast } = useToast();

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  // Storage key for user's gamification data
  const getStorageKey = (address: string) => `gamification_${address}`;

  // Initialize or load user progress
  const initializeProgress = useCallback(async () => {
    if (!isConnected || !account) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const storageKey = getStorageKey(account.accountAddress.toString());
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const savedProgress = JSON.parse(stored);
        setProgress(savedProgress);
      } else {
        // Create new progress for first-time user
        const newProgress: UserProgress = {
          xp: 0,
          level: 1,
          currentLevelXP: 0,
          nextLevelXP: XPSystem.getXPForLevel(2),
          levelProgress: 0,
          streak: 0,
          bestStreak: 0,
          lastVoteDate: null,
          lastCorrectDate: null,
          totalVotes: 0,
          correctPredictions: 0,
          accuracy: 0,
          badges: [],
          unlockedFeatures: [],
          title: 'Observer',
          seasonXP: 0,
          seasonLevel: 1,
          seasonRank: 0,
        };
        setProgress(newProgress);
        saveProgress(newProgress);
      }

      // Load quests
      loadQuests();
    } catch (error) {
      console.error('Failed to initialize gamification progress:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your progress data',
      });
    } finally {
      setLoading(false);
    }
  }, [account, isConnected, toast]);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: UserProgress) => {
    if (!account) return;

    const storageKey = getStorageKey(account.accountAddress.toString());
    localStorage.setItem(storageKey, JSON.stringify(newProgress));
  }, [account]);

  // Load quests
  const loadQuests = useCallback(() => {
    // In a real app, this would fetch from backend
    // For demo, generate quests
    const daily = AchievementSystem.generateDailyQuests();
    const weekly = AchievementSystem.generateWeeklyQuests();

    setDailyQuests(daily);
    setWeeklyQuests(weekly);
  }, []);

  // Add XP to user's progress
  const addXP = useCallback((amount: number, source?: string) => {
    if (!progress || !account) return;

    const newTotalXP = progress.xp + amount;
    const levelData = XPSystem.getLevelProgress(newTotalXP);
    const titleData = XPSystem.getTitleForLevel(levelData.level);

    const newProgress: UserProgress = {
      ...progress,
      xp: newTotalXP,
      level: levelData.level,
      currentLevelXP: levelData.currentLevelXP,
      nextLevelXP: levelData.nextLevelXP,
      levelProgress: levelData.progress,
      title: titleData.title,
      seasonXP: progress.seasonXP + amount,
    };

    // Check for new badges
    const newBadges = AchievementSystem.checkBadgeUnlock(newProgress, progress.badges);
    if (newBadges.length > progress.badges.length) {
      const newBadge = newBadges[newBadges.length - 1];
      toast({
        title: '🎉 New Badge Unlocked!',
        description: `${newBadge.name}: ${newBadge.description}`,
      });
      newProgress.badges = newBadges;
    }

    // Check for level up
    if (levelData.level > progress.level) {
      toast({
        title: '🎊 Level Up!',
        description: `You've reached level ${levelData.level} - ${titleData.title}!`,
      });

      // Unlock features based on level
      if (levelData.level >= 5 && !newProgress.unlockedFeatures.includes('mystery_crates')) {
        newProgress.unlockedFeatures.push('mystery_crates');
        toast({
          title: '🔓 Feature Unlocked!',
          description: 'Mystery Crates are now available!',
        });
      }
    }

    setProgress(newProgress);
    saveProgress(newProgress);

    // Show XP gain animation
    if (source) {
      toast({
        title: `+${amount} XP`,
        description: source,
        duration: 2000,
      });
    }
  }, [progress, account, toast, saveProgress]);

  // Update streak based on prediction result
  const updateStreak = useCallback((isCorrect: boolean) => {
    if (!progress || !account) return;

    const now = Date.now();
    const today = new Date().toDateString();
    const lastVoteDate = progress.lastVoteDate ? new Date(progress.lastVoteDate).toDateString() : null;

    let newStreak = progress.streak;
    let newBestStreak = progress.bestStreak;
    let newCorrectPredictions = progress.correctPredictions;
    let newTotalVotes = progress.totalVotes + 1;

    if (isCorrect) {
      newCorrectPredictions++;

      // Check if this is a consecutive day
      if (lastVoteDate !== today) {
        newStreak++;
        newBestStreak = Math.max(newBestStreak, newStreak);
      }
    } else {
      // Reset streak on incorrect prediction
      if (lastVoteDate === today) {
        // Same day incorrect prediction, don't reset streak
      } else {
        newStreak = 0;
      }
    }

    const newAccuracy = newTotalVotes > 0 ? (newCorrectPredictions / newTotalVotes) * 100 : 0;

    const newProgress: UserProgress = {
      ...progress,
      streak: newStreak,
      bestStreak: newBestStreak,
      lastVoteDate: now,
      lastCorrectDate: isCorrect ? now : progress.lastCorrectDate,
      totalVotes: newTotalVotes,
      correctPredictions: newCorrectPredictions,
      accuracy: newAccuracy,
    };

    // Check for new badges based on streak
    const newBadges = AchievementSystem.checkBadgeUnlock(newProgress, progress.badges);
    if (newBadges.length > progress.badges.length) {
      const newBadge = newBadges[newBadges.length - 1];
      toast({
        title: '🔥 Streak Achievement!',
        description: `${newBadge.name}: ${newBadge.description}`,
      });
      newProgress.badges = newBadges;
    }

    setProgress(newProgress);
    saveProgress(newProgress);
  }, [progress, account, toast, saveProgress]);

  // Complete a quest
  const completeQuest = useCallback((questId: string) => {
    if (!progress || !account) return;

    const allQuests = [...dailyQuests, ...weeklyQuests];
    const quest = allQuests.find((q) => q.id === questId);

    if (!quest || quest.completed) return;

    // Mark quest as completed
    const updatedDailyQuests = dailyQuests.map((q) =>
      q.id === questId ? { ...q, completed: true, progress: q.requirement } : q
    );
    const updatedWeeklyQuests = weeklyQuests.map((q) =>
      q.id === questId ? { ...q, completed: true, progress: q.requirement } : q
    );

    setDailyQuests(updatedDailyQuests);
    setWeeklyQuests(updatedWeeklyQuests);

    // Award rewards
    if (quest.reward.xp) {
      addXP(quest.reward.xp, `Quest: ${quest.title}`);
    }

    if (quest.reward.tokens) {
      // In a real app, this would update token balance
      toast({
        title: '💰 Tokens Earned!',
        description: `+${quest.reward.tokens} tokens from quest completion`,
      });
    }

    if (quest.reward.badgeId) {
      // Award special quest badge
      const badgeDef = {
        id: quest.reward.badgeId,
        name: 'Quest Master',
        description: 'Completed a weekly quest',
        icon: '📜',
        rarity: 'rare' as const,
        category: 'special' as const,
        earnedAt: Date.now(),
      };

      const newBadges = [...progress.badges, badgeDef];
      const newProgress = { ...progress, badges: newBadges };

      setProgress(newProgress);
      saveProgress(newProgress);

      toast({
        title: '🏆 Quest Badge Earned!',
        description: badgeDef.description,
      });
    }

    toast({
      title: '✅ Quest Completed!',
      description: quest.title,
    });
  }, [progress, account, dailyQuests, weeklyQuests, addXP, toast, saveProgress]);

  // Open mystery crate
  const openMysteryCrate = useCallback(async (crateId: string): Promise<CrateOpenResult | null> => {
    if (!progress || !account) return null;

    // Find crate definition
    const crate = AchievementSystem.MYSTERY_CRATES?.find((c) => c.id === crateId);
    if (!crate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid crate selected',
      });
      return null;
    }

    // Check if user has enough XP
    if (progress.xp < crate.cost) {
      toast({
        variant: 'destructive',
        title: 'Insufficient XP',
        description: `You need ${crate.cost} XP to open this crate`,
      });
      return null;
    }

    // Deduct XP cost
    const newProgress = { ...progress, xp: progress.xp - crate.cost };
    setProgress(newProgress);
    saveProgress(newProgress);

    // Simulate crate opening with random rewards
    const rewards = [];
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const reward of crate.possibleRewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        rewards.push(reward);
        break;
      }
    }

    // Award rewards
    rewards.forEach((reward) => {
      switch (reward.type) {
        case 'xp_booster':
          if (typeof reward.value === 'number') {
            addXP(reward.value, 'Mystery Crate Reward');
          }
          break;
        case 'tokens':
          toast({
            title: '💰 Tokens Earned!',
            description: `+${reward.value} tokens from mystery crate`,
          });
          break;
        case 'badge':
          // Award special crate badge
          const badgeDef = {
            id: reward.value as string,
            name: 'Lucky Find',
            description: 'Found in a mystery crate',
            icon: '🍀',
            rarity: reward.rarity,
            category: 'special' as const,
            earnedAt: Date.now(),
          };

          const newBadges = [...newProgress.badges, badgeDef];
          const updatedProgress = { ...newProgress, badges: newBadges };

          setProgress(updatedProgress);
          saveProgress(updatedProgress);

          toast({
            title: '🎁 Badge Found!',
            description: badgeDef.description,
          });
          break;
        case 'title':
          toast({
            title: '👑 Title Unlocked!',
            description: `You've earned the title: ${reward.value}`,
          });
          break;
      }
    });

    return { rewards };
  }, [progress, account, toast, addXP, saveProgress]);

  // Refresh progress from storage
  const refreshProgress = useCallback(async () => {
    await initializeProgress();
  }, [initializeProgress]);

  // Initialize on mount and when account changes
  useEffect(() => {
    initializeProgress();
  }, [initializeProgress]);

  // Auto-refresh quests daily
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadQuests();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [loadQuests]);

  return {
    progress,
    loading,
    dailyQuests,
    weeklyQuests,
    addXP,
    updateStreak,
    completeQuest,
    openMysteryCrate,
    refreshProgress,
  };
};