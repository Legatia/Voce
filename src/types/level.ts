export interface LevelConfig {
  level: number;
  xpRequired: number;
  coinReward: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  // Levels 1-10: Original progression pattern
  { level: 1, xpRequired: 0, coinReward: 0 },
  { level: 2, xpRequired: 1000, coinReward: 100 },
  { level: 3, xpRequired: 2500, coinReward: 150 },
  { level: 4, xpRequired: 5000, coinReward: 200 },
  { level: 5, xpRequired: 8000, coinReward: 300 },
  { level: 6, xpRequired: 12000, coinReward: 400 },
  { level: 7, xpRequired: 17000, coinReward: 500 },
  { level: 8, xpRequired: 23000, coinReward: 600 },
  { level: 9, xpRequired: 30000, coinReward: 750 },
  { level: 10, xpRequired: 40000, coinReward: 1000 },

  // Levels 11-25: Continued progression pattern
  { level: 11, xpRequired: 52000, coinReward: 1250 },
  { level: 12, xpRequired: 65000, coinReward: 1500 },
  { level: 13, xpRequired: 79000, coinReward: 1750 },
  { level: 14, xpRequired: 94000, coinReward: 2000 },
  { level: 15, xpRequired: 110000, coinReward: 2250 },
  { level: 16, xpRequired: 127000, coinReward: 2500 },
  { level: 17, xpRequired: 145000, coinReward: 2750 },
  { level: 18, xpRequired: 164000, coinReward: 3000 },
  { level: 19, xpRequired: 184000, coinReward: 3250 },
  { level: 20, xpRequired: 205000, coinReward: 3500 },
  { level: 21, xpRequired: 227000, coinReward: 3750 },
  { level: 22, xpRequired: 250000, coinReward: 4000 },
  { level: 23, xpRequired: 274000, coinReward: 4250 },
  { level: 24, xpRequired: 299000, coinReward: 4500 },
  { level: 25, xpRequired: 325000, coinReward: 5000 },
];

export const calculateLevel = (xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } => {
  let currentLevel = 1;

  // Find current level (can go beyond level 25)
  for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIGS[i].xpRequired) {
      currentLevel = LEVEL_CONFIGS[i].level;

      // Check if we're beyond level 25
      if (xp >= LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1].xpRequired) {
        const level25XP = LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1].xpRequired;
        const additionalXP = xp - level25XP;
        const additionalLevels = Math.floor(additionalXP / 45000); // 45k XP per level after 25
        currentLevel = 25 + additionalLevels;
      }

      break;
    }
  }

  // Calculate XP requirements
  let currentLevelXP: number;
  let nextLevelXP: number;

  if (currentLevel < 25) {
    // Normal progression for levels 1-24
    const currentLevelConfig = LEVEL_CONFIGS[currentLevel - 1];
    const nextLevelConfig = LEVEL_CONFIGS[currentLevel];

    currentLevelXP = currentLevelConfig.xpRequired;
    nextLevelXP = nextLevelConfig.xpRequired;
  } else if (currentLevel === 25) {
    // Level 25 uses config values
    currentLevelXP = LEVEL_CONFIGS[24].xpRequired;
    nextLevelXP = LEVEL_CONFIGS[24].xpRequired + 45000; // 45k XP to level 26
  } else {
    // Levels 26+: Static 45k XP per level
    const level25XP = LEVEL_CONFIGS[24].xpRequired;
    const levelsBeyond25 = currentLevel - 25;

    currentLevelXP = level25XP + (levelsBeyond25 * 45000);
    nextLevelXP = level25XP + ((levelsBeyond25 + 1) * 45000);
  }

  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    level: currentLevel,
    currentXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForNextLevel,
    progress: Math.min(progress, 100)
  };
};

export const getTotalCoinsEarned = (xp: number): number => {
  let totalCoins = 0;

  // Add coins from configured levels (1-25)
  for (const config of LEVEL_CONFIGS) {
    if (xp >= config.xpRequired && config.coinReward > 0) {
      totalCoins += config.coinReward;
    }
  }

  // Calculate coins for levels beyond 25
  if (xp >= LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1].xpRequired) {
    const level25XP = LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1].xpRequired;
    const additionalXP = xp - level25XP;
    const additionalLevels = Math.floor(additionalXP / 45000); // 45k XP per level after 25

    // Coins increase slightly after level 25
    // Level 25 gives 5000 coins, level 26 gives 5250, etc. (250 coin increase per level)
    for (let i = 1; i <= additionalLevels; i++) {
      const levelCoinReward = 5000 + (i * 250); // 250 coin increase per level after 25
      totalCoins += levelCoinReward;
    }
  }

  return totalCoins;
};

export const getCoinRewardForLevel = (level: number): number => {
  if (level <= 25) {
    const config = LEVEL_CONFIGS.find(c => c.level === level);
    return config?.coinReward || 0;
  } else {
    // Levels 26+: Start from 5250 coins and increase by 250 per level
    const baseReward = 5250; // Level 26 reward
    const levelIncrease = 250;
    return baseReward + ((level - 26) * levelIncrease);
  }
};

export const getXPRequiredForLevel = (level: number): number => {
  if (level <= 25) {
    const config = LEVEL_CONFIGS.find(c => c.level === level);
    return config?.xpRequired || 0;
  } else {
    // Levels 26+: Static 45k XP per level
    const level25XP = LEVEL_CONFIGS[24].xpRequired; // 325,000 XP
    const additionalLevels = level - 25;
    return level25XP + (additionalLevels * 45000);
  }
};
