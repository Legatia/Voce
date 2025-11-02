import { useCallback, useEffect } from 'react';
import { useVoting } from './useVoting';
import { useGamification } from './useGamification';
import { XPSystem, MYSTERY_CRATES } from '@/lib/gamification';

interface UseGamifiedVotingReturn {
  // Voting actions with gamification
  castVoteWithGamification: (eventId: string, optionId: string, stake: number, eventDifficulty?: 'easy' | 'medium' | 'hard') => Promise<string>;
  revealVoteWithGamification: (eventId: string, optionId: string, salt: string, isCorrect?: boolean) => Promise<string>;

  // Quest progress tracking
  updateQuestProgress: (questType: 'vote' | 'correct_prediction' | 'daily_vote' | 'category_vote') => void;

  // Original voting functions
  castVote: (eventId: string, optionId: string, stake: number) => Promise<string>;
  revealVote: (eventId: string, optionId: string, salt: string) => Promise<string>;

  // States
  isProcessing: boolean;
  error: string | null;
  votes: any[];
}

export const useGamifiedVoting = (): UseGamifiedVotingReturn => {
  const {
    castVote: originalCastVote,
    revealVote: originalRevealVote,
    isProcessing,
    error,
    votes,
    hasVoted,
    getUserVote,
  } = useVoting();

  const {
    addXP,
    updateStreak,
    completeQuest,
    dailyQuests,
    weeklyQuests,
    progress,
  } = useGamification();

  // Update quest progress based on actions
  const updateQuestProgress = useCallback((questType: 'vote' | 'correct_prediction' | 'daily_vote' | 'category_vote') => {
    const allQuests = [...dailyQuests, ...weeklyQuests];

    switch (questType) {
      case 'vote':
        // Update daily quest: "Cast 3 predictions today"
        const dailyVoteQuest = allQuests.find(q =>
          q.title === 'Daily Predictor' && !q.completed
        );
        if (dailyVoteQuest) {
          const newProgress = Math.min(dailyVoteQuest.progress + 1, dailyVoteQuest.requirement);
          if (newProgress >= dailyVoteQuest.requirement) {
            completeQuest(dailyVoteQuest.id);
          }
        }

        // Update weekly quest: "Cast 15 predictions this week"
        const weeklyVoteQuest = allQuests.find(q =>
          q.title === 'Weekly Warrior' && !q.completed
        );
        if (weeklyVoteQuest) {
          const newProgress = Math.min(weeklyVoteQuest.progress + 1, weeklyVoteQuest.requirement);
          if (newProgress >= weeklyVoteQuest.requirement) {
            completeQuest(weeklyVoteQuest.id);
          }
        }
        break;

      case 'correct_prediction':
        // Update daily quest: "Cast 1 correct prediction today"
        const dailyCorrectQuest = allQuests.find(q =>
          q.title === 'Seeker of Truth' && !q.completed
        );
        if (dailyCorrectQuest) {
          const newProgress = Math.min(dailyCorrectQuest.progress + 1, dailyCorrectQuest.requirement);
          if (newProgress >= dailyCorrectQuest.requirement) {
            completeQuest(dailyCorrectQuest.id);
          }
        }

        // Update weekly quest: "Maintain 70% accuracy over 10 predictions"
        const weeklyAccuracyQuest = allQuests.find(q =>
          q.title === 'Accuracy Expert' && !q.completed
        );
        if (weeklyAccuracyQuest && progress) {
          // This would need more sophisticated tracking in a real implementation
          const newProgress = Math.min(weeklyAccuracyQuest.progress + 1, weeklyAccuracyQuest.requirement);
          if (newProgress >= weeklyAccuracyQuest.requirement) {
            completeQuest(weeklyAccuracyQuest.id);
          }
        }
        break;

      case 'daily_vote':
        // Track daily voting streak
        const streakQuest = allQuests.find(q =>
          q.title === 'Streak Master' && !q.completed
        );
        if (streakQuest && progress && progress.streak > 0) {
          const newProgress = Math.min(streakQuest.progress + 1, streakQuest.requirement);
          if (newProgress >= streakQuest.requirement) {
            completeQuest(streakQuest.id);
          }
        }
        break;

      case 'category_vote':
        // Update daily quest: "Vote on 2 different event categories"
        const categoryQuest = allQuests.find(q =>
          q.title === 'Event Explorer' && !q.completed
        );
        if (categoryQuest) {
          // This would need category tracking in a real implementation
          const newProgress = Math.min(categoryQuest.progress + 1, categoryQuest.requirement);
          if (newProgress >= categoryQuest.requirement) {
            completeQuest(categoryQuest.id);
          }
        }
        break;
    }
  }, [dailyQuests, weeklyQuests, completeQuest, progress]);

  // Cast a vote with gamification rewards
  const castVoteWithGamification = useCallback(async (
    eventId: string,
    optionId: string,
    stake: number,
    eventDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<string> => {
    try {
      // Cast the original vote
      const transactionHash = await originalCastVote(eventId, optionId, stake);

      // Award base XP for voting
      const baseXP = XPSystem.calculateXPReward(stake, eventDifficulty, false);
      addXP(baseXP, `Vote on ${eventId}`);

      // Update quest progress
      updateQuestProgress('vote');
      updateQuestProgress('daily_vote');

      // Check if this is the user's first vote
      if (progress && progress.totalVotes === 0) {
        addXP(50, 'First vote bonus!');
      }

      return transactionHash;
    } catch (error) {
      console.error('Failed to cast vote with gamification:', error);
      throw error;
    }
  }, [originalCastVote, addXP, updateQuestProgress, progress]);

  // Reveal a vote with gamification rewards
  const revealVoteWithGamification = useCallback(async (
    eventId: string,
    optionId: string,
    salt: string,
    isCorrect: boolean = false // In a real app, this would be determined by the actual result
  ): Promise<string> => {
    try {
      // Reveal the original vote
      const transactionHash = await originalRevealVote(eventId, optionId, salt);

      // Update streak based on correctness
      updateStreak(isCorrect);

      // Award XP for reveal
      const streakMultiplier = Math.min(3, 1 + (progress?.streak || 0) * 0.1);
      const revealXP = XPSystem.calculateXPReward(10, 'medium', isCorrect, streakMultiplier);
      addXP(revealXP, `Vote reveal - ${isCorrect ? 'Correct!' : 'Keep trying!'}`);

      // Update quest progress for correct predictions
      if (isCorrect) {
        updateQuestProgress('correct_prediction');
      }

      // Bonus XP for first correct prediction of the day
      if (isCorrect && progress?.lastCorrectDate) {
        const lastCorrectDate = new Date(progress.lastCorrectDate).toDateString();
        const today = new Date().toDateString();
        if (lastCorrectDate !== today) {
          addXP(25, 'First correct prediction today!');
        }
      }

      return transactionHash;
    } catch (error) {
      console.error('Failed to reveal vote with gamification:', error);
      throw error;
    }
  }, [originalRevealVote, addXP, updateStreak, updateQuestProgress, progress]);

  // Simulate event results (in a real app, this would come from oracle/actual results)
  const simulateEventResult = useCallback(async (eventId: string, userOptionId: string) => {
    // Simulate checking if user's prediction was correct
    // For demo purposes, 70% chance of being correct
    const isCorrect = Math.random() > 0.3;

    // Get user's vote to reveal it
    const userVote = getUserVote(eventId);
    if (userVote && userVote.salt) {
      try {
        await revealVoteWithGamification(eventId, userOptionId, userVote.salt, isCorrect);
        return { isCorrect, revealed: true };
      } catch (error) {
        console.error('Failed to reveal vote:', error);
        return { isCorrect: false, revealed: false };
      }
    }

    return { isCorrect, revealed: false };
  }, [getUserVote, revealVoteWithGamification]);

  // Auto-complete expired quests (cleanup)
  useEffect(() => {
    const cleanupExpiredQuests = () => {
      const now = Date.now();
      const allQuests = [...dailyQuests, ...weeklyQuests];

      allQuests.forEach(quest => {
        if (now > quest.expiresAt && !quest.completed) {
          // Quest expired without completion - could penalize or just clean up
          console.log(`Quest expired: ${quest.title}`);
        }
      });
    };

    // Run cleanup every hour
    const interval = setInterval(cleanupExpiredQuests, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dailyQuests, weeklyQuests]);

  return {
    // Enhanced voting functions
    castVoteWithGamification,
    revealVoteWithGamification,

    // Quest progress
    updateQuestProgress,

    // Original voting functions
    castVote: originalCastVote,
    revealVote: originalRevealVote,

    // States
    isProcessing,
    error,
    votes,
  };
};