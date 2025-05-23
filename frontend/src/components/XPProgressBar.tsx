import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { XPProfile, calculateXPProgress, getLevelTitle } from '../utils/xpSystem';
import { playSound } from '../utils/soundEffects';

interface XPProgressBarProps {
  xpProfile: XPProfile;
  recentXP?: number;
  onLeaderboardClick: () => void;
}

// Animations
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

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const xpGain = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const levelUp = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled components
const ProgressBarContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 20px;
  padding: 5px 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 10px 0;
`;

const LevelBadge = styled.div<{ $isLevelUp: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  animation: ${props => props.$isLevelUp ? levelUp : 'none'} 1s ease-in-out;
`;

const ProgressBarWrapper = styled.div`
  flex: 1;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background-color: #4CAF50;
  border-radius: 5px;
  transition: width 0.5s ease-out;
`;

const XPInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 80px;
`;

const XPText = styled.div`
  font-size: 0.8rem;
  color: #CCC;
`;

const XPValue = styled.div`
  font-weight: bold;
  color: white;
`;

const LevelInfo = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(30, 30, 30, 0.9);
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 0.8rem;
  white-space: nowrap;
  animation: ${fadeIn} 0.3s ease-out;
`;

const XPGainIndicator = styled.div`
  position: absolute;
  top: -25px;
  right: 10px;
  color: #4CAF50;
  font-weight: bold;
  animation: ${xpGain} 1.5s ease-out forwards;
`;

const LeaderboardButton = styled.button`
  background: none;
  border: none;
  color: #FFD700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 215, 0, 0.1);
  }
`;

const XPProgressBar: React.FC<XPProgressBarProps> = ({ xpProfile, recentXP, onLeaderboardClick }) => {
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);
  
  // Calculate XP progress percentage
  const progressPercent = calculateXPProgress(xpProfile.currentLevelXP, xpProfile.nextLevelXP);
  
  // Format XP numbers
  const formatXP = (xp: number): string => {
    return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Handle level up animation
  useEffect(() => {
    if (recentXP && recentXP > 0) {
      setShowXPGain(true);
      setTimeout(() => setShowXPGain(false), 1500);
    }
  }, [recentXP]);
  
  // Handle level up animation
  useEffect(() => {
    const storedLevel = localStorage.getItem('tradestick_last_level');
    const currentLevel = xpProfile.level.toString();
    
    if (storedLevel && storedLevel !== currentLevel) {
      setIsLevelUp(true);
      playSound('level_up', 0.7);
      setTimeout(() => setIsLevelUp(false), 1000);
    }
    
    localStorage.setItem('tradestick_last_level', currentLevel);
  }, [xpProfile.level]);
  
  return (
    <ProgressBarContainer 
      onMouseEnter={() => setShowLevelInfo(true)}
      onMouseLeave={() => setShowLevelInfo(false)}
    >
      <LevelBadge $isLevelUp={isLevelUp}>
        {xpProfile.level}
      </LevelBadge>
      
      <ProgressBarWrapper>
        <ProgressBarFill $percent={progressPercent} />
        {showLevelInfo && (
          <LevelInfo>
            {getLevelTitle(xpProfile.level)} • {progressPercent}% to Level {xpProfile.level + 1}
          </LevelInfo>
        )}
      </ProgressBarWrapper>
      
      <XPInfo>
        <XPText>Total XP</XPText>
        <XPValue>{formatXP(xpProfile.totalXP)}</XPValue>
      </XPInfo>
      
      <LeaderboardButton onClick={onLeaderboardClick}>
        <span>🏆</span>
      </LeaderboardButton>
      
      {showXPGain && recentXP && (
        <XPGainIndicator>+{recentXP} XP</XPGainIndicator>
      )}
    </ProgressBarContainer>
  );
};

export default XPProgressBar;
