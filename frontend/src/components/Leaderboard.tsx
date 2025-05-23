import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { XPProfile, LEVEL_DEFINITIONS, calculateXPProgress, getLevelTitle } from '../utils/xpSystem';

interface LeaderboardProps {
  userProfile: XPProfile;
  onClose: () => void;
}

// Mock leaderboard data (in a real app, this would come from a server)
const generateMockLeaderboard = (userProfile: XPProfile): XPProfile[] => {
  const mockUsers: XPProfile[] = [
    {
      userId: 'user1',
      username: 'TradingMaster',
      totalXP: 24500,
      level: 16,
      currentLevelXP: 3500,
      nextLevelXP: 4000,
      recentActions: [],
      joinDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      achievements: ['first_trade', 'ten_trades', 'first_profit', 'streak_3', 'profit_100', 'win_rate_60'],
      stats: {
        tradesExecuted: 1250,
        profitableTrades: 820,
        longestStreak: 12,
        totalProfit: 5430,
        patternsDetected: 145,
        sessionsCompleted: 78
      }
    },
    {
      userId: 'user2',
      username: 'PatternHunter',
      totalXP: 18700,
      level: 15,
      currentLevelXP: 1700,
      nextLevelXP: 4000,
      recentActions: [],
      joinDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
      lastActive: Date.now() - 1 * 24 * 60 * 60 * 1000,
      achievements: ['first_trade', 'ten_trades', 'first_profit', 'streak_3', 'profit_100'],
      stats: {
        tradesExecuted: 980,
        profitableTrades: 620,
        longestStreak: 8,
        totalProfit: 3200,
        patternsDetected: 210,
        sessionsCompleted: 65
      }
    },
    {
      userId: 'user3',
      username: 'CryptoWhale',
      totalXP: 31200,
      level: 17,
      currentLevelXP: 6200,
      nextLevelXP: 5000,
      recentActions: [],
      joinDate: Date.now() - 200 * 24 * 60 * 60 * 1000,
      lastActive: Date.now() - 5 * 60 * 60 * 1000,
      achievements: ['first_trade', 'ten_trades', 'first_profit', 'streak_3', 'profit_100', 'win_rate_60'],
      stats: {
        tradesExecuted: 1850,
        profitableTrades: 1230,
        longestStreak: 15,
        totalProfit: 8900,
        patternsDetected: 180,
        sessionsCompleted: 120
      }
    },
    {
      userId: 'user4',
      username: 'TrendSurfer',
      totalXP: 12400,
      level: 12,
      currentLevelXP: 3400,
      nextLevelXP: 2500,
      recentActions: [],
      joinDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastActive: Date.now() - 12 * 60 * 60 * 1000,
      achievements: ['first_trade', 'ten_trades', 'first_profit', 'streak_3'],
      stats: {
        tradesExecuted: 720,
        profitableTrades: 410,
        longestStreak: 6,
        totalProfit: 1800,
        patternsDetected: 95,
        sessionsCompleted: 42
      }
    },
    {
      userId: 'user5',
      username: 'DayTraderPro',
      totalXP: 9800,
      level: 11,
      currentLevelXP: 2800,
      nextLevelXP: 2000,
      recentActions: [],
      joinDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
      lastActive: Date.now() - 8 * 60 * 60 * 1000,
      achievements: ['first_trade', 'ten_trades', 'first_profit'],
      stats: {
        tradesExecuted: 520,
        profitableTrades: 290,
        longestStreak: 5,
        totalProfit: 1200,
        patternsDetected: 65,
        sessionsCompleted: 30
      }
    }
  ];
  
  // Add the current user to the leaderboard if not already there
  if (!mockUsers.some(user => user.userId === userProfile.userId)) {
    mockUsers.push(userProfile);
  } else {
    // Update the user's profile if it's already in the leaderboard
    const index = mockUsers.findIndex(user => user.userId === userProfile.userId);
    mockUsers[index] = userProfile;
  }
  
  // Sort by total XP (descending)
  return mockUsers.sort((a, b) => b.totalXP - a.totalXP);
};

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

// Styled components
const LeaderboardContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const LeaderboardPanel = styled.div`
  background-color: #1E1E1E;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LeaderboardHeader = styled.div`
  background-color: #2A2A2A;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LeaderboardTitle = styled.h2`
  margin: 0;
  color: #4CAF50;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const TabContainer = styled.div`
  display: flex;
  background-color: #2A2A2A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.div<{ $active: boolean }>`
  padding: 12px 20px;
  cursor: pointer;
  opacity: ${props => props.$active ? 1 : 0.6};
  border-bottom: 2px solid ${props => props.$active ? '#4CAF50' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const LeaderboardContent = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
`;

const LeaderboardTable = styled.div`
  width: 100%;
  border-collapse: collapse;
`;

const LeaderboardHeader2 = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 120px 120px 120px;
  padding: 10px;
  background-color: #2A2A2A;
  border-radius: 4px;
  margin-bottom: 10px;
  font-weight: bold;
  color: #CCC;
`;

const LeaderboardRow = styled.div<{ $isUser: boolean; $isTop3: boolean }>`
  display: grid;
  grid-template-columns: 60px 1fr 120px 120px 120px;
  padding: 12px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  background-color: ${props => 
    props.$isUser ? 'rgba(76, 175, 80, 0.2)' : 
    props.$isTop3 ? 'rgba(255, 215, 0, 0.1)' : 
    'rgba(255, 255, 255, 0.05)'
  };
  transition: all 0.2s;
  animation: ${props => props.$isUser ? `${pulse} 2s infinite` : 'none'};
  
  &:hover {
    background-color: ${props => 
      props.$isUser ? 'rgba(76, 175, 80, 0.3)' : 
      props.$isTop3 ? 'rgba(255, 215, 0, 0.2)' : 
      'rgba(255, 255, 255, 0.1)'
    };
  }
`;

const RankCell = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: ${props => {
    if (props.$rank === 1) return '#FFD700'; // Gold
    if (props.$rank === 2) return '#C0C0C0'; // Silver
    if (props.$rank === 3) return '#CD7F32'; // Bronze
    return 'white';
  }};
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.div<{ $level: number }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.$level >= 15) return '#FFD700'; // Gold
    if (props.$level >= 10) return '#C0C0C0'; // Silver
    if (props.$level >= 5) return '#CD7F32'; // Bronze
    return '#555';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1E1E1E;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Username = styled.div`
  font-weight: bold;
`;

const UserTitle = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const XPCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const XPValue = styled.div`
  font-weight: bold;
`;

const XPProgress = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const LevelCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`;

const StatsCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const StatValue = styled.div`
  font-weight: bold;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const UserStatsContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const UserStatsTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4CAF50;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const StatCard = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const StatCardTitle = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 5px;
`;

const StatCardValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const Leaderboard: React.FC<LeaderboardProps> = ({ userProfile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'stats'>('global');
  const [leaderboard, setLeaderboard] = useState<XPProfile[]>([]);
  const [userRank, setUserRank] = useState(0);
  
  // Generate leaderboard data
  useEffect(() => {
    const data = generateMockLeaderboard(userProfile);
    setLeaderboard(data);
    
    // Find user's rank
    const rank = data.findIndex(user => user.userId === userProfile.userId) + 1;
    setUserRank(rank);
  }, [userProfile]);
  
  // Format XP number with commas
  const formatXP = (xp: number): string => {
    return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <LeaderboardContainer>
      <LeaderboardPanel>
        <LeaderboardHeader>
          <LeaderboardTitle>
            <span>🏆</span> Leaderboard
          </LeaderboardTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </LeaderboardHeader>
        
        <TabContainer>
          <Tab 
            $active={activeTab === 'global'} 
            onClick={() => setActiveTab('global')}
          >
            Global Rankings
          </Tab>
          <Tab 
            $active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </Tab>
          <Tab 
            $active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
          >
            Your Stats
          </Tab>
        </TabContainer>
        
        <LeaderboardContent>
          {activeTab === 'global' && (
            <>
              <LeaderboardTable>
                <LeaderboardHeader2>
                  <div>Rank</div>
                  <div>Trader</div>
                  <div style={{ textAlign: 'right' }}>XP</div>
                  <div style={{ textAlign: 'center' }}>Level</div>
                  <div style={{ textAlign: 'right' }}>Best Stat</div>
                </LeaderboardHeader2>
                
                {leaderboard.map((user, index) => {
                  const rank = index + 1;
                  const isUser = user.userId === userProfile.userId;
                  const isTop3 = rank <= 3;
                  const xpProgress = calculateXPProgress(user.currentLevelXP, user.nextLevelXP);
                  const bestStat = Math.max(
                    user.stats.profitableTrades / Math.max(1, user.stats.tradesExecuted) * 100,
                    user.stats.longestStreak,
                    user.stats.totalProfit / 100
                  );
                  
                  return (
                    <LeaderboardRow 
                      key={user.userId} 
                      $isUser={isUser} 
                      $isTop3={isTop3}
                    >
                      <RankCell $rank={rank}>
                        {rank}
                      </RankCell>
                      <UserCell>
                        <UserAvatar $level={user.level}>
                          {user.username.charAt(0).toUpperCase()}
                        </UserAvatar>
                        <UserInfo>
                          <Username>{user.username}</Username>
                          <UserTitle>{getLevelTitle(user.level)}</UserTitle>
                        </UserInfo>
                      </UserCell>
                      <XPCell>
                        <XPValue>{formatXP(user.totalXP)} XP</XPValue>
                        <XPProgress>{xpProgress}% to next</XPProgress>
                      </XPCell>
                      <LevelCell>
                        {user.level}
                      </LevelCell>
                      <StatsCell>
                        <StatValue>
                          {user.stats.profitableTrades > 0 
                            ? `${Math.round(user.stats.profitableTrades / Math.max(1, user.stats.tradesExecuted) * 100)}%` 
                            : '0%'}
                        </StatValue>
                        <StatLabel>Win Rate</StatLabel>
                      </StatsCell>
                    </LeaderboardRow>
                  );
                })}
              </LeaderboardTable>
              
              {userRank > 10 && (
                <div style={{ marginTop: '20px', textAlign: 'center', padding: '10px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px' }}>
                  Your Rank: <strong>{userRank}</strong> out of {leaderboard.length} traders
                </div>
              )}
            </>
          )}
          
          {activeTab === 'friends' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👥</div>
              <h3>Friends Leaderboard Coming Soon!</h3>
              <p>Connect with other traders to compare your progress and compete for the top spot.</p>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <UserStatsContainer>
              <UserStatsTitle>Your Trading Stats</UserStatsTitle>
              
              <StatsGrid>
                <StatCard>
                  <StatCardTitle>Total XP</StatCardTitle>
                  <StatCardValue>{formatXP(userProfile.totalXP)}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Level</StatCardTitle>
                  <StatCardValue>{userProfile.level}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Rank</StatCardTitle>
                  <StatCardValue>#{userRank}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Trades Executed</StatCardTitle>
                  <StatCardValue>{userProfile.stats.tradesExecuted}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Win Rate</StatCardTitle>
                  <StatCardValue>
                    {userProfile.stats.tradesExecuted > 0 
                      ? `${Math.round(userProfile.stats.profitableTrades / userProfile.stats.tradesExecuted * 100)}%` 
                      : '0%'}
                  </StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Longest Streak</StatCardTitle>
                  <StatCardValue>{userProfile.stats.longestStreak}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Total Profit</StatCardTitle>
                  <StatCardValue>${userProfile.stats.totalProfit.toFixed(2)}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Patterns Detected</StatCardTitle>
                  <StatCardValue>{userProfile.stats.patternsDetected}</StatCardValue>
                </StatCard>
                
                <StatCard>
                  <StatCardTitle>Achievements</StatCardTitle>
                  <StatCardValue>{userProfile.achievements.length}</StatCardValue>
                </StatCard>
              </StatsGrid>
              
              <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px' }}>
                <strong>Next Level:</strong> {userProfile.level + 1} ({getLevelTitle(userProfile.level + 1)}) - 
                Need {formatXP(userProfile.nextLevelXP - userProfile.currentLevelXP)} more XP
              </div>
            </UserStatsContainer>
          )}
        </LeaderboardContent>
      </LeaderboardPanel>
    </LeaderboardContainer>
  );
};

export default Leaderboard;
