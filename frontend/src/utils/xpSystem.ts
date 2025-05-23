// XP System for TradeStick

import { Trade } from '../types';
import { playSound } from './soundEffects';

// XP Action Types
export type XPActionType = 
  | 'trade_executed'
  | 'profitable_trade'
  | 'streak_milestone'
  | 'achievement_unlocked'
  | 'pattern_detected'
  | 'session_time'
  | 'daily_login'
  | 'level_up';

// XP Action interface
export interface XPAction {
  type: XPActionType;
  amount: number;
  description: string;
  timestamp: number;
}

// User Level interface
export interface UserLevel {
  level: number;
  xpRequired: number;
  title: string;
  rewards?: string[];
}

// User XP Profile
export interface XPProfile {
  userId: string;
  username: string;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  recentActions: XPAction[];
  joinDate: number;
  lastActive: number;
  achievements: string[];
  stats: {
    tradesExecuted: number;
    profitableTrades: number;
    longestStreak: number;
    totalProfit: number;
    patternsDetected: number;
    sessionsCompleted: number;
  };
}

// Level definitions
export const LEVEL_DEFINITIONS: UserLevel[] = [
  { level: 1, xpRequired: 0, title: "Novice Trader" },
  { level: 2, xpRequired: 100, title: "Apprentice Trader" },
  { level: 3, xpRequired: 300, title: "Junior Trader" },
  { level: 4, xpRequired: 600, title: "Trader" },
  { level: 5, xpRequired: 1000, title: "Senior Trader" },
  { level: 6, xpRequired: 1500, title: "Expert Trader" },
  { level: 7, xpRequired: 2200, title: "Master Trader" },
  { level: 8, xpRequired: 3000, title: "Trading Guru" },
  { level: 9, xpRequired: 4000, title: "Trading Legend" },
  { level: 10, xpRequired: 5500, title: "Trading Virtuoso" },
  { level: 11, xpRequired: 7000, title: "Trading Prodigy" },
  { level: 12, xpRequired: 9000, title: "Trading Mastermind" },
  { level: 13, xpRequired: 11500, title: "Trading Savant" },
  { level: 14, xpRequired: 14000, title: "Trading Luminary" },
  { level: 15, xpRequired: 17000, title: "Trading Titan" },
  { level: 16, xpRequired: 21000, title: "Trading Overlord" },
  { level: 17, xpRequired: 25000, title: "Trading Demigod" },
  { level: 18, xpRequired: 30000, title: "Trading Deity" },
  { level: 19, xpRequired: 36000, title: "Trading Immortal" },
  { level: 20, xpRequired: 42000, title: "Trading Transcendent" },
];

// XP values for different actions
export const XP_VALUES: Record<XPActionType, number> = {
  trade_executed: 5,
  profitable_trade: 15,
  streak_milestone: 50,
  achievement_unlocked: 100,
  pattern_detected: 20,
  session_time: 1, // per minute
  daily_login: 25,
  level_up: 0, // Special case, handled separately
};

// Create a default XP profile
export const createDefaultProfile = (userId: string, username: string): XPProfile => {
  return {
    userId,
    username,
    totalXP: 0,
    level: 1,
    currentLevelXP: 0,
    nextLevelXP: LEVEL_DEFINITIONS[1].xpRequired,
    recentActions: [],
    joinDate: Date.now(),
    lastActive: Date.now(),
    achievements: [],
    stats: {
      tradesExecuted: 0,
      profitableTrades: 0,
      longestStreak: 0,
      totalProfit: 0,
      patternsDetected: 0,
      sessionsCompleted: 0,
    }
  };
};

// Calculate level from total XP
export const calculateLevel = (totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number } => {
  let level = 1;
  let currentLevelXP = totalXP;
  let nextLevelXP = LEVEL_DEFINITIONS[1].xpRequired;

  for (let i = 1; i < LEVEL_DEFINITIONS.length; i++) {
    if (totalXP >= LEVEL_DEFINITIONS[i].xpRequired) {
      level = LEVEL_DEFINITIONS[i].level;
      currentLevelXP = totalXP - LEVEL_DEFINITIONS[i].xpRequired;
      nextLevelXP = i + 1 < LEVEL_DEFINITIONS.length 
        ? LEVEL_DEFINITIONS[i + 1].xpRequired - LEVEL_DEFINITIONS[i].xpRequired
        : 10000; // For max level, set a large number
    } else {
      nextLevelXP = LEVEL_DEFINITIONS[i].xpRequired - (i > 0 ? LEVEL_DEFINITIONS[i - 1].xpRequired : 0);
      break;
    }
  }

  return { level, currentLevelXP, nextLevelXP };
};

// Add XP to a profile
export const addXP = (
  profile: XPProfile, 
  actionType: XPActionType, 
  customAmount?: number, 
  description?: string
): { 
  updatedProfile: XPProfile; 
  xpGained: number; 
  leveledUp: boolean; 
  newLevel?: number 
} => {
  const amount = customAmount !== undefined ? customAmount : XP_VALUES[actionType];
  const actionDescription = description || `Earned ${amount} XP for ${actionType.replace(/_/g, ' ')}`;
  
  // Create XP action
  const action: XPAction = {
    type: actionType,
    amount,
    description: actionDescription,
    timestamp: Date.now()
  };
  
  // Update profile
  const updatedProfile = { 
    ...profile,
    totalXP: profile.totalXP + amount,
    lastActive: Date.now(),
    recentActions: [action, ...profile.recentActions].slice(0, 20) // Keep last 20 actions
  };
  
  // Update stats based on action type
  switch (actionType) {
    case 'trade_executed':
      updatedProfile.stats.tradesExecuted++;
      break;
    case 'profitable_trade':
      updatedProfile.stats.profitableTrades++;
      break;
    case 'pattern_detected':
      updatedProfile.stats.patternsDetected++;
      break;
    case 'session_time':
      // This is handled separately
      break;
    case 'daily_login':
      // This is handled separately
      break;
  }
  
  // Calculate new level
  const oldLevel = profile.level;
  const { level, currentLevelXP, nextLevelXP } = calculateLevel(updatedProfile.totalXP);
  updatedProfile.level = level;
  updatedProfile.currentLevelXP = currentLevelXP;
  updatedProfile.nextLevelXP = nextLevelXP;
  
  // Check if leveled up
  const leveledUp = level > oldLevel;
  
  return { 
    updatedProfile, 
    xpGained: amount, 
    leveledUp, 
    newLevel: leveledUp ? level : undefined 
  };
};

// Process a trade for XP
export const processTradeForXP = (
  profile: XPProfile, 
  trade: Trade, 
  currentPrice: number, 
  currentStreak: number
): { 
  updatedProfile: XPProfile; 
  xpGained: number; 
  leveledUp: boolean; 
  newLevel?: number;
  actions: XPAction[];
} => {
  let updatedProfile = { ...profile };
  let totalXpGained = 0;
  let leveledUp = false;
  let newLevel: number | undefined;
  const actions: XPAction[] = [];
  
  // XP for executing a trade
  const tradeResult = addXP(updatedProfile, 'trade_executed');
  updatedProfile = tradeResult.updatedProfile;
  totalXpGained += tradeResult.xpGained;
  actions.push(updatedProfile.recentActions[0]);
  
  // Check if trade is profitable
  const pnl = trade.side === 'buy'
    ? (currentPrice - trade.price) * Math.abs(trade.size)
    : (trade.price - currentPrice) * Math.abs(trade.size);
  
  if (pnl > 0) {
    // XP for profitable trade
    const profitResult = addXP(updatedProfile, 'profitable_trade');
    updatedProfile = profitResult.updatedProfile;
    totalXpGained += profitResult.xpGained;
    actions.push(updatedProfile.recentActions[0]);
    
    // Update total profit stat
    updatedProfile.stats.totalProfit += pnl;
    
    // Check for streak milestones
    if (currentStreak > 0 && currentStreak % 5 === 0 && currentStreak <= 20) {
      // XP for streak milestone (5, 10, 15, 20)
      const streakResult = addXP(
        updatedProfile, 
        'streak_milestone', 
        XP_VALUES.streak_milestone * (currentStreak / 5),
        `${currentStreak} trade winning streak!`
      );
      updatedProfile = streakResult.updatedProfile;
      totalXpGained += streakResult.xpGained;
      actions.push(updatedProfile.recentActions[0]);
    }
    
    // Update longest streak stat
    if (currentStreak > updatedProfile.stats.longestStreak) {
      updatedProfile.stats.longestStreak = currentStreak;
    }
  }
  
  // Check if leveled up
  const finalLevelCheck = calculateLevel(updatedProfile.totalXP);
  if (finalLevelCheck.level > profile.level) {
    leveledUp = true;
    newLevel = finalLevelCheck.level;
    
    // Play level up sound
    playSound('level_up', 0.7);
  }
  
  return { 
    updatedProfile, 
    xpGained: totalXpGained, 
    leveledUp, 
    newLevel,
    actions
  };
};

// Process achievement unlock for XP
export const processAchievementForXP = (
  profile: XPProfile,
  achievementId: string,
  achievementName: string
): {
  updatedProfile: XPProfile;
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
} => {
  // Skip if achievement already unlocked
  if (profile.achievements.includes(achievementId)) {
    return { updatedProfile: profile, xpGained: 0, leveledUp: false };
  }
  
  // Add achievement to profile
  const updatedProfile = {
    ...profile,
    achievements: [...profile.achievements, achievementId]
  };
  
  // Add XP for achievement
  const result = addXP(
    updatedProfile,
    'achievement_unlocked',
    undefined,
    `Achievement unlocked: ${achievementName}`
  );
  
  return result;
};

// Process pattern detection for XP
export const processPatternForXP = (
  profile: XPProfile,
  patternType: string
): {
  updatedProfile: XPProfile;
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
} => {
  // Add XP for pattern detection
  const result = addXP(
    profile,
    'pattern_detected',
    undefined,
    `Pattern detected: ${patternType}`
  );
  
  return result;
};

// Process session time for XP (call periodically, e.g., every minute)
export const processSessionTimeForXP = (
  profile: XPProfile,
  minutesActive: number
): {
  updatedProfile: XPProfile;
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
} => {
  // Add XP for session time
  const result = addXP(
    profile,
    'session_time',
    XP_VALUES.session_time * minutesActive,
    `Active trading session: ${minutesActive} minute${minutesActive !== 1 ? 's' : ''}`
  );
  
  return result;
};

// Save XP profile to localStorage
export const saveXPProfile = (profile: XPProfile): void => {
  try {
    localStorage.setItem('tradestick_xp_profile', JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving XP profile:', error);
  }
};

// Load XP profile from localStorage
export const loadXPProfile = (userId: string, username: string): XPProfile => {
  try {
    const savedProfile = localStorage.getItem('tradestick_xp_profile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
  } catch (error) {
    console.error('Error loading XP profile:', error);
  }
  
  // Return default profile if none found
  return createDefaultProfile(userId, username);
};

// Get level title
export const getLevelTitle = (level: number): string => {
  const levelDef = LEVEL_DEFINITIONS.find(def => def.level === level);
  return levelDef ? levelDef.title : 'Trader';
};

// Calculate XP progress percentage for current level
export const calculateXPProgress = (currentLevelXP: number, nextLevelXP: number): number => {
  return Math.min(100, Math.floor((currentLevelXP / nextLevelXP) * 100));
};
