/**
 * Gamification System - XP, Levels, and Progress Tracking
 * Implements logarithmic XP scaling and achievement tracking
 */

import React from 'react';

// User progress and gamification state
export interface UserProgress {
  // Core progression
  xp: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  levelProgress: number; // 0-100 percentage

  // Streak tracking
  streak: number;
  bestStreak: number;
  lastVoteDate: number | null;
  lastCorrectDate: number | null;

  // Voting statistics
  totalVotes: number;
  correctPredictions: number;
  accuracy: number;

  // Achievements and badges
  badges: Badge[];
  unlockedFeatures: string[];
  title: string;

  // Seasonal data
  seasonXP: number;
  seasonLevel: number;
  seasonRank: number;
}

// Badge and achievement system
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'voting' | 'streak' | 'accuracy' | 'special' | 'seasonal';
  earnedAt: number;
  progress?: number;
  maxProgress?: number;
}

// Quest system
export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  requirement: number;
  progress: number;
  reward: {
    xp: number;
    tokens?: number;
    badgeId?: string;
  };
  completed: boolean;
  expiresAt: number;
}

// Mystery reward system
export interface MysteryCrate {
  id: string;
  name: string;
  description: string;
  cost: number; // XP cost to open
  icon: string;
  possibleRewards: CrateReward[];
}

export interface CrateReward {
  type: 'badge' | 'xp_booster' | 'tokens' | 'cosmetic' | 'title';
  value: number | string;
  probability: number; // 0-1
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Seasonal leaderboard
export interface SeasonalLeaderboard {
  season: string;
  startDate: number;
  endDate: number;
  rankings: LeaderboardEntry[];
  userRank?: number;
}

export interface LeaderboardEntry {
  address: string;
  username?: string;
  xp: number;
  level: number;
  accuracy: number;
  badgeCount: number;
  title: string;
}

// Level titles based on progression
export const LEVEL_TITLES = [
  { minLevel: 1, title: 'Observer', icon: '👁️' },
  { minLevel: 5, title: 'Novice', icon: '🌱' },
  { minLevel: 10, title: 'Seeker', icon: '🔍' },
  { minLevel: 15, title: 'Forecaster', icon: '📊' },
  { minLevel: 25, title: 'Analyst', icon: '📈' },
  { minLevel: 35, title: 'Expert', icon: '🎯' },
  { minLevel: 50, title: 'Prophet', icon: '🔮' },
  { minLevel: 75, title: 'Visionary', icon: '✨' },
  { minLevel: 100, title: 'Oracle', icon: '🌟' },
];

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt' | 'progress'>[] = [
  // Voting badges
  {
    id: 'first_vote',
    name: 'First Steps',
    description: 'Cast your first prediction',
    icon: '👣',
    rarity: 'common',
    category: 'voting',
  },
  {
    id: 'voter_10',
    name: 'Active Participant',
    description: 'Cast 10 predictions',
    icon: '🗳️',
    rarity: 'common',
    category: 'voting',
  },
  {
    id: 'voter_50',
    name: 'Dedicated Voter',
    description: 'Cast 50 predictions',
    icon: '📋',
    rarity: 'rare',
    category: 'voting',
  },
  {
    id: 'voter_100',
    name: 'Prediction Master',
    description: 'Cast 100 predictions',
    icon: '🏆',
    rarity: 'epic',
    category: 'voting',
  },

  // Streak badges
  {
    id: 'streak_3',
    name: 'Hot Streak',
    description: '3 correct predictions in a row',
    icon: '🔥',
    rarity: 'common',
    category: 'streak',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7 correct predictions in a row',
    icon: '💪',
    rarity: 'rare',
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Legend',
    description: '30 correct predictions in a row',
    icon: '👑',
    rarity: 'legendary',
    category: 'streak',
  },

  // Accuracy badges
  {
    id: 'accuracy_70',
    name: 'Sharp Eye',
    description: '70% prediction accuracy',
    icon: '🎯',
    rarity: 'rare',
    category: 'accuracy',
  },
  {
    id: 'accuracy_85',
    name: 'Crystal Ball',
    description: '85% prediction accuracy',
    icon: '🔮',
    rarity: 'epic',
    category: 'accuracy',
  },
  {
    id: 'accuracy_95',
    name: 'Oracle Sight',
    description: '95% prediction accuracy',
    icon: '✨',
    rarity: 'legendary',
    category: 'accuracy',
  },

  // Special badges
  {
    id: 'early_adopter',
    name: 'Pioneer',
    description: 'Join in the first month',
    icon: '🚀',
    rarity: 'epic',
    category: 'special',
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'All predictions correct in one day',
    icon: '⭐',
    rarity: 'rare',
    category: 'special',
  },
];

// Mystery crate definitions
export const MYSTERY_CRATES: MysteryCrate[] = [
  {
    id: 'common_crate',
    name: 'Belief Crate',
    description: 'A mystery box containing various rewards',
    cost: 50,
    icon: '📦',
    possibleRewards: [
      { type: 'xp_booster', value: 25, probability: 0.6, rarity: 'common' },
      { type: 'tokens', value: 10, probability: 0.3, rarity: 'common' },
      { type: 'badge', value: 'lucky_day', probability: 0.1, rarity: 'rare' },
    ],
  },
  {
    id: 'rare_crate',
    name: 'Enchanted Belief Crate',
    description: 'Enhanced rewards with better drop rates',
    cost: 150,
    icon: '💎',
    possibleRewards: [
      { type: 'xp_booster', value: 100, probability: 0.4, rarity: 'rare' },
      { type: 'tokens', value: 50, probability: 0.35, rarity: 'rare' },
      { type: 'badge', value: 'mystery_master', probability: 0.2, rarity: 'epic' },
      { type: 'title', value: 'Mystic', probability: 0.05, rarity: 'legendary' },
    ],
  },
];

// Quest definitions
export const DAILY_QUESTS: Omit<Quest, 'id' | 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    type: 'daily',
    title: 'Daily Predictor',
    description: 'Cast 3 predictions today',
    requirement: 3,
    reward: { xp: 25 },
  },
  {
    type: 'daily',
    title: 'Seeker of Truth',
    description: 'Cast 1 correct prediction today',
    requirement: 1,
    reward: { xp: 50, tokens: 5 },
  },
  {
    type: 'daily',
    title: 'Event Explorer',
    description: 'Vote on 2 different event categories',
    requirement: 2,
    reward: { xp: 30 },
  },
];

export const WEEKLY_QUESTS: Omit<Quest, 'id' | 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    type: 'weekly',
    title: 'Weekly Warrior',
    description: 'Cast 15 predictions this week',
    requirement: 15,
    reward: { xp: 150, badgeId: 'weekly_warrior' },
  },
  {
    type: 'weekly',
    title: 'Streak Master',
    description: 'Achieve a 5-day voting streak',
    requirement: 5,
    reward: { xp: 200, tokens: 25 },
  },
  {
    type: 'weekly',
    title: 'Accuracy Expert',
    description: 'Maintain 70% accuracy over 10 predictions',
    requirement: 10,
    reward: { xp: 250 },
  },
];

// XP calculation utilities
export class XPSystem {
  /**
   * Calculate XP required for a given level using logarithmic scaling
   * Formula: XP = base * level * log(level + 1)
   */
  static getXPForLevel(level: number): number {
    const baseXP = 100;
    return Math.floor(baseXP * level * Math.log(level + 1));
  }

  /**
   * Calculate current level from total XP
   */
  static getLevelFromXP(totalXP: number): number {
    let level = 1;
    while (this.getXPForLevel(level + 1) <= totalXP) {
      level++;
    }
    return level;
  }

  /**
   * Calculate progress percentage to next level
   */
  static getLevelProgress(totalXP: number): {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  } {
    const level = this.getLevelFromXP(totalXP);
    const currentLevelXP = this.getXPForLevel(level);
    const nextLevelXP = this.getXPForLevel(level + 1);
    const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return {
      level,
      currentLevelXP,
      nextLevelXP,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }

  /**
   * Calculate XP reward for a prediction
   */
  static calculateXPReward(
    stakeAmount: number,
    eventDifficulty: 'easy' | 'medium' | 'hard',
    isCorrect: boolean,
    streakMultiplier: number = 1
  ): number {
    const baseXP = {
      easy: 10,
      medium: 25,
      hard: 50,
    };

    const accuracyBonus = isCorrect ? 1.5 : 0.5;
    const stakeBonus = Math.min(2, 1 + stakeAmount / 100); // Max 2x bonus
    const xp = Math.floor(
      baseXP[eventDifficulty] * accuracyBonus * stakeBonus * streakMultiplier
    );

    return Math.max(5, xp); // Minimum 5 XP
  }

  /**
   * Get title for current level
   */
  static getTitleForLevel(level: number): { title: string; icon: string } {
    const currentTitle = [...LEVEL_TITLES]
      .reverse()
      .find((title) => level >= title.minLevel);

    return currentTitle || LEVEL_TITLES[0];
  }
}

// Achievement and badge utilities
export class AchievementSystem {
  /**
   * Check and unlock new badges based on user progress
   */
  static checkBadgeUnlock(
    progress: UserProgress,
    newBadges: Badge[] = []
  ): Badge[] {
    const unlockedBadges: Badge[] = [...newBadges];
    const currentTime = Date.now();

    BADGE_DEFINITIONS.forEach((badgeDef) => {
      // Skip if already earned
      if (newBadges.some((b) => b.id === badgeDef.id)) return;

      let shouldUnlock = false;

      switch (badgeDef.id) {
        case 'first_vote':
          shouldUnlock = progress.totalVotes >= 1;
          break;
        case 'voter_10':
          shouldUnlock = progress.totalVotes >= 10;
          break;
        case 'voter_50':
          shouldUnlock = progress.totalVotes >= 50;
          break;
        case 'voter_100':
          shouldUnlock = progress.totalVotes >= 100;
          break;
        case 'streak_3':
          shouldUnlock = progress.streak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = progress.streak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = progress.streak >= 30;
          break;
        case 'accuracy_70':
          shouldUnlock = progress.accuracy >= 70;
          break;
        case 'accuracy_85':
          shouldUnlock = progress.accuracy >= 85;
          break;
        case 'accuracy_95':
          shouldUnlock = progress.accuracy >= 95;
          break;
        case 'early_adopter':
          // This would need to be checked based on platform launch date
          shouldUnlock = false;
          break;
        case 'perfect_day':
          // This would need daily tracking
          shouldUnlock = false;
          break;
      }

      if (shouldUnlock) {
        unlockedBadges.push({
          ...badgeDef,
          earnedAt: currentTime,
        });
      }
    });

    return unlockedBadges;
  }

  /**
   * Generate daily quests
   */
  static generateDailyQuests(): Quest[] {
    const now = Date.now();
    const tomorrow = now + 24 * 60 * 60 * 1000;

    return DAILY_QUESTS.map((quest, index) => ({
      ...quest,
      id: `daily_${now}_${index}`,
      progress: 0,
      completed: false,
      expiresAt: tomorrow,
    }));
  }

  /**
   * Generate weekly quests
   */
  static generateWeeklyQuests(): Quest[] {
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;

    return WEEKLY_QUESTS.map((quest, index) => ({
      ...quest,
      id: `weekly_${now}_${index}`,
      progress: 0,
      completed: false,
      expiresAt: nextWeek,
    }));
  }
}

// React hook for gamification state
export const useGamification = () => {
  // This would typically integrate with React Context or state management
  // For now, return a basic implementation
  const [userProgress, setUserProgress] = React.useState<UserProgress>({
    xp: 0,
    level: 1,
    currentLevelXP: 0,
    nextLevelXP: 100,
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
  });

  const addXP = (amount: number) => {
    setUserProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = XPSystem.getLevelFromXP(newXP);
      const progress = XPSystem.getLevelProgress(newXP);
      const titleData = XPSystem.getTitleForLevel(newLevel);

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        currentLevelXP: progress.currentLevelXP,
        nextLevelXP: progress.nextLevelXP,
        levelProgress: progress.progress,
        title: titleData.title,
      };
    });
  };

  const checkBadges = () => {
    const newBadges = AchievementSystem.checkBadgeUnlock(userProgress, userProgress.badges);
    if (newBadges.length > userProgress.badges.length) {
      setUserProgress(prev => ({ ...prev, badges: newBadges }));
    }
  };

  return {
    userProgress,
    addXP,
    checkBadges,
    // Additional methods as needed
  };
};

export default {
  XPSystem,
  AchievementSystem,
  LEVEL_TITLES,
  BADGE_DEFINITIONS,
  MYSTERY_CRATES,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  useGamification,
};