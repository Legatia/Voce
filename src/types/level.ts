export interface LevelConfig {
  level: number;
  xpRequired: number;
  coinReward: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
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
];

export const calculateLevel = (xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } => {
  let currentLevel = 1;
  
  for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIGS[i].xpRequired) {
      currentLevel = LEVEL_CONFIGS[i].level;
      break;
    }
  }
  
  const currentLevelConfig = LEVEL_CONFIGS[currentLevel - 1];
  const nextLevelConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
  
  const currentLevelXP = currentLevelConfig.xpRequired;
  const nextLevelXP = nextLevelConfig.xpRequired;
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
  
  for (const config of LEVEL_CONFIGS) {
    if (xp >= config.xpRequired && config.coinReward > 0) {
      totalCoins += config.coinReward;
    }
  }
  
  return totalCoins;
};
