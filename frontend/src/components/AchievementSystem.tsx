import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Trade } from '../types';

// Types for achievements and rewards
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
  reward?: Reward;
  unlocked: boolean;
}

export interface Reward {
  type: 'pattern_highlight' | 'multiplier' | 'simulator' | 'theme';
  value: string | number;
  description: string;
}

export interface PlayerStats {
  totalTrades: number;
  successfulTrades: number;
  profitableTrades: number;
  totalProfit: number;
  largestProfit: number;
  largestLoss: number;
  currentStreak: number;
  longestStreak: number;
  tradeVolume: number;
  winRate: number;
}

interface AchievementSystemProps {
  trades: Trade[];
  currentPrice: number;
  onUnlockReward: (reward: Reward, achievementId: string, achievementName: string) => void;
}

// Animations
const slideIn = keyframes`
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  10% {
    transform: translateX(0);
    opacity: 1;
  }
  90% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px #4CAF50;
  }
  50% {
    box-shadow: 0 0 20px #4CAF50, 0 0 30px #4CAF50;
  }
  100% {
    box-shadow: 0 0 5px #4CAF50;
  }
`;

// Styled components
const AchievementContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 300px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
`;

const AchievementNotification = styled.div`
  background-color: rgba(30, 30, 30, 0.9);
  border-left: 4px solid #4CAF50;
  border-radius: 4px;
  padding: 10px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${slideIn} 5s ease-in-out forwards;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
`;

const AchievementIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  animation: ${glow} 2s infinite;
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementTitle = styled.div`
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
`;

const AchievementDescription = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const AchievementReward = styled.div`
  font-size: 11px;
  color: #FFD700;
  margin-top: 4px;
`;

const StatsPanel = styled.div`
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  color: white;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const StatValue = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 16px;
  font-weight: bold;
  color: ${props =>
    props.$positive ? '#4CAF50' :
    props.$negative ? '#F44336' :
    'white'
  };
`;

// Default achievements
const defaultAchievements: Achievement[] = [
  {
    id: 'first_trade',
    name: 'First Steps',
    description: 'Execute your first trade',
    icon: '🚀',
    condition: (stats: PlayerStats) => stats.totalTrades >= 1,
    unlocked: false
  },
  {
    id: 'ten_trades',
    name: 'Getting Started',
    description: 'Execute 10 trades',
    icon: '🔄',
    condition: (stats: PlayerStats) => stats.totalTrades >= 10,
    reward: {
      type: 'pattern_highlight',
      value: 'support_resistance',
      description: 'Unlocks support and resistance line indicators'
    },
    unlocked: false
  },
  {
    id: 'first_profit',
    name: 'In The Green',
    description: 'Make your first profitable trade',
    icon: '💰',
    condition: (stats: PlayerStats) => stats.profitableTrades >= 1,
    unlocked: false
  },
  {
    id: 'streak_3',
    name: 'Hot Streak',
    description: 'Make 3 profitable trades in a row',
    icon: '🔥',
    condition: (stats: PlayerStats) => stats.currentStreak >= 3,
    reward: {
      type: 'multiplier',
      value: 1.5,
      description: 'Unlocks 1.5x profit multiplier for your next 5 trades'
    },
    unlocked: false
  },
  {
    id: 'profit_100',
    name: 'Serious Trader',
    description: 'Accumulate $100 in profit',
    icon: '💎',
    condition: (stats: PlayerStats) => stats.totalProfit >= 100,
    reward: {
      type: 'pattern_highlight',
      value: 'trend_lines',
      description: 'Unlocks trend line detection'
    },
    unlocked: false
  },
  {
    id: 'win_rate_60',
    name: 'Consistent Performer',
    description: 'Achieve a 60% win rate with at least 20 trades',
    icon: '🏆',
    condition: (stats: PlayerStats) => stats.winRate >= 60 && stats.totalTrades >= 20,
    reward: {
      type: 'simulator',
      value: 'advanced',
      description: 'Unlocks advanced market simulator with custom patterns'
    },
    unlocked: false
  }
];

const AchievementSystem: React.FC<AchievementSystemProps> = ({ trades, currentPrice, onUnlockReward }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [stats, setStats] = useState<PlayerStats>({
    totalTrades: 0,
    successfulTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    largestProfit: 0,
    largestLoss: 0,
    currentStreak: 0,
    longestStreak: 0,
    tradeVolume: 0,
    winRate: 0
  });
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showStats, setShowStats] = useState(false);

  // Calculate player stats based on trades
  useEffect(() => {
    if (!trades.length) return;

    let profitableTrades = 0;
    let totalProfit = 0;
    let largestProfit = 0;
    let largestLoss = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tradeVolume = 0;

    // Process trades to calculate stats
    trades.forEach((trade, index) => {
      const pnl = trade.side === 'buy'
        ? (currentPrice - trade.price) * Math.abs(trade.size)
        : (trade.price - currentPrice) * Math.abs(trade.size);

      tradeVolume += trade.value;

      if (pnl > 0) {
        profitableTrades++;
        totalProfit += pnl;
        largestProfit = Math.max(largestProfit, pnl);
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        largestLoss = Math.min(largestLoss, pnl);
        currentStreak = 0;
      }
    });

    const winRate = trades.length > 0 ? (profitableTrades / trades.length) * 100 : 0;

    setStats({
      totalTrades: trades.length,
      successfulTrades: trades.length, // All trades that executed successfully
      profitableTrades,
      totalProfit,
      largestProfit,
      largestLoss,
      currentStreak,
      longestStreak,
      tradeVolume,
      winRate
    });
  }, [trades, currentPrice]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked: Achievement[] = [];

    const updatedAchievements = achievements.map(achievement => {
      // Skip already unlocked achievements
      if (achievement.unlocked) return achievement;

      // Check if achievement condition is met
      if (achievement.condition(stats)) {
        newlyUnlocked.push({...achievement, unlocked: true});

        // If there's a reward, trigger the callback
        if (achievement.reward) {
          onUnlockReward(achievement.reward, achievement.id, achievement.name);
        }

        return {...achievement, unlocked: true};
      }

      return achievement;
    });

    if (newlyUnlocked.length > 0) {
      setAchievements(updatedAchievements);
      setNewAchievements(prev => [...newlyUnlocked, ...prev]);

      // Remove notification after 5 seconds
      setTimeout(() => {
        setNewAchievements(prev => prev.slice(0, prev.length - newlyUnlocked.length));
      }, 5000);
    }
  }, [stats, achievements, onUnlockReward]);

  return (
    <>
      {/* Achievement notifications */}
      <AchievementContainer>
        {newAchievements.map((achievement, index) => (
          <AchievementNotification key={`${achievement.id}-${index}`}>
            <AchievementIcon>{achievement.icon}</AchievementIcon>
            <AchievementInfo>
              <AchievementTitle>{achievement.name}</AchievementTitle>
              <AchievementDescription>{achievement.description}</AchievementDescription>
              {achievement.reward && (
                <AchievementReward>
                  Reward: {achievement.reward.description}
                </AchievementReward>
              )}
            </AchievementInfo>
          </AchievementNotification>
        ))}
      </AchievementContainer>

      {/* Stats panel toggle button */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(30, 30, 30, 0.8)',
          padding: '5px 10px',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer'
        }}
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? 'Hide Stats' : 'Show Stats'}
      </div>

      {/* Stats panel */}
      {showStats && (
        <StatsPanel>
          <StatItem>
            <StatLabel>Total Trades</StatLabel>
            <StatValue>{stats.totalTrades}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Win Rate</StatLabel>
            <StatValue $positive={stats.winRate > 50} $negative={stats.winRate < 50}>
              {stats.winRate.toFixed(1)}%
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Total Profit</StatLabel>
            <StatValue $positive={stats.totalProfit > 0} $negative={stats.totalProfit < 0}>
              ${stats.totalProfit.toFixed(2)}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Current Streak</StatLabel>
            <StatValue $positive={stats.currentStreak > 0}>
              {stats.currentStreak}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Largest Profit</StatLabel>
            <StatValue $positive={true}>
              ${stats.largestProfit.toFixed(2)}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Largest Loss</StatLabel>
            <StatValue $negative={true}>
              ${Math.abs(stats.largestLoss).toFixed(2)}
            </StatValue>
          </StatItem>
        </StatsPanel>
      )}
    </>
  );
};

export default AchievementSystem;
