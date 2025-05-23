import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { MarketData, Candle } from '../types';

interface PatternRecognitionProps {
  marketData: MarketData;
  unlockedPatterns: string[];
  onPatternDetected?: (patternType: string) => void;
}

// Pattern types
export interface DetectedPattern {
  type: string;
  startIndex: number;
  endIndex: number;
  description: string;
  strength: number; // 0-100
  direction: 'bullish' | 'bearish' | 'neutral';
}

const PatternContainer = styled.div`
  position: absolute;
  top: 50px;
  left: 10px;
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 4px;
  padding: 10px;
  color: white;
  max-width: 250px;
  z-index: 100;
`;

const PatternTitle = styled.div`
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 5px;
`;

const PatternList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const PatternItem = styled.div<{ $direction: 'bullish' | 'bearish' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border-radius: 3px;
  background-color: ${props =>
    props.$direction === 'bullish' ? 'rgba(76, 175, 80, 0.2)' :
    props.$direction === 'bearish' ? 'rgba(244, 67, 54, 0.2)' :
    'rgba(255, 255, 255, 0.1)'
  };
`;

const PatternIcon = styled.div<{ $direction: 'bullish' | 'bearish' | 'neutral' }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props =>
    props.$direction === 'bullish' ? 'rgba(76, 175, 80, 0.8)' :
    props.$direction === 'bearish' ? 'rgba(244, 67, 54, 0.8)' :
    'rgba(255, 255, 255, 0.5)'
  };
  font-size: 14px;
`;

const PatternInfo = styled.div`
  flex: 1;
`;

const PatternName = styled.div`
  font-size: 12px;
  font-weight: bold;
`;

const PatternDescription = styled.div`
  font-size: 11px;
  opacity: 0.8;
`;

const PatternStrength = styled.div<{ $strength: number }>`
  width: 50px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$strength}%;
    background-color: ${props =>
      props.$strength > 70 ? '#4CAF50' :
      props.$strength > 40 ? '#FFC107' :
      '#F44336'
    };
  }
`;

// Pattern detection functions
const detectSupportResistance = (candles: Candle[]): DetectedPattern[] => {
  if (candles.length < 10) return [];

  const patterns: DetectedPattern[] = [];
  const prices = candles.map(c => c.close);

  // Simple algorithm to find support/resistance levels
  // In a real app, this would be much more sophisticated
  const recentPrices = prices.slice(-20);
  const min = Math.min(...recentPrices);
  const max = Math.max(...recentPrices);

  // Check if current price is near support
  const currentPrice = prices[prices.length - 1];
  const supportDiff = (currentPrice - min) / min;
  const resistanceDiff = (max - currentPrice) / currentPrice;

  if (supportDiff < 0.01) {
    patterns.push({
      type: 'support',
      startIndex: prices.length - 20,
      endIndex: prices.length - 1,
      description: 'Price is testing a support level',
      strength: 80,
      direction: 'bullish'
    });
  }

  if (resistanceDiff < 0.01) {
    patterns.push({
      type: 'resistance',
      startIndex: prices.length - 20,
      endIndex: prices.length - 1,
      description: 'Price is testing a resistance level',
      strength: 75,
      direction: 'bearish'
    });
  }

  return patterns;
};

const detectTrendLines = (candles: Candle[]): DetectedPattern[] => {
  if (candles.length < 15) return [];

  const patterns: DetectedPattern[] = [];
  const prices = candles.map(c => c.close);

  // Simple trend detection
  // In a real app, this would use linear regression or more sophisticated methods
  let upCount = 0;
  let downCount = 0;

  for (let i = prices.length - 10; i < prices.length - 1; i++) {
    if (prices[i] < prices[i + 1]) upCount++;
    if (prices[i] > prices[i + 1]) downCount++;
  }

  const strength = Math.max(upCount, downCount) * 10;

  if (upCount > downCount && upCount >= 6) {
    patterns.push({
      type: 'uptrend',
      startIndex: prices.length - 10,
      endIndex: prices.length - 1,
      description: 'Price is in an uptrend',
      strength,
      direction: 'bullish'
    });
  } else if (downCount > upCount && downCount >= 6) {
    patterns.push({
      type: 'downtrend',
      startIndex: prices.length - 10,
      endIndex: prices.length - 1,
      description: 'Price is in a downtrend',
      strength,
      direction: 'bearish'
    });
  }

  return patterns;
};

const detectDojiPattern = (candles: Candle[]): DetectedPattern[] => {
  if (candles.length < 5) return [];

  const patterns: DetectedPattern[] = [];
  const latestCandle = candles[candles.length - 1];

  // Check for doji (open and close are very close)
  const bodySize = Math.abs(latestCandle.open - latestCandle.close);
  const wickSize = latestCandle.high - latestCandle.low;

  if (bodySize / wickSize < 0.1 && wickSize > 0) {
    patterns.push({
      type: 'doji',
      startIndex: candles.length - 1,
      endIndex: candles.length - 1,
      description: 'Doji pattern indicates market indecision',
      strength: 65,
      direction: 'neutral'
    });
  }

  return patterns;
};

const detectEngulfingPattern = (candles: Candle[]): DetectedPattern[] => {
  if (candles.length < 5) return [];

  const patterns: DetectedPattern[] = [];
  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  // Bullish engulfing
  if (
    previous.close < previous.open && // Previous candle is bearish
    current.close > current.open && // Current candle is bullish
    current.open < previous.close && // Current opens below previous close
    current.close > previous.open // Current closes above previous open
  ) {
    patterns.push({
      type: 'bullish_engulfing',
      startIndex: candles.length - 2,
      endIndex: candles.length - 1,
      description: 'Bullish engulfing pattern suggests potential reversal',
      strength: 75,
      direction: 'bullish'
    });
  }

  // Bearish engulfing
  if (
    previous.close > previous.open && // Previous candle is bullish
    current.close < current.open && // Current candle is bearish
    current.open > previous.close && // Current opens above previous close
    current.close < previous.open // Current closes below previous open
  ) {
    patterns.push({
      type: 'bearish_engulfing',
      startIndex: candles.length - 2,
      endIndex: candles.length - 1,
      description: 'Bearish engulfing pattern suggests potential reversal',
      strength: 75,
      direction: 'bearish'
    });
  }

  return patterns;
};

// Map pattern types to detection functions
const patternDetectors: Record<string, (candles: Candle[]) => DetectedPattern[]> = {
  'support_resistance': detectSupportResistance,
  'trend_lines': detectTrendLines,
  'doji': detectDojiPattern,
  'engulfing': detectEngulfingPattern
};

// Map pattern types to icons
const patternIcons: Record<string, string> = {
  'support': '—',
  'resistance': '—',
  'uptrend': '↗',
  'downtrend': '↘',
  'doji': '✚',
  'bullish_engulfing': '▲',
  'bearish_engulfing': '▼'
};

const PatternRecognition: React.FC<PatternRecognitionProps> = ({ marketData, unlockedPatterns, onPatternDetected }) => {
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!marketData.candles || marketData.candles.length < 10) return;

    // Run all unlocked pattern detectors
    let allPatterns: DetectedPattern[] = [];

    unlockedPatterns.forEach(patternType => {
      if (patternDetectors[patternType]) {
        const patterns = patternDetectors[patternType](marketData.candles);
        allPatterns = [...allPatterns, ...patterns];
      }
    });

    // Sort by strength (highest first)
    allPatterns.sort((a, b) => b.strength - a.strength);

    // Check if we have new patterns that weren't in the previous state
    if (allPatterns.length > 0 && onPatternDetected) {
      const prevPatternTypes = detectedPatterns.map(p => p.type);
      const newPatterns = allPatterns.filter(p => !prevPatternTypes.includes(p.type));

      // Notify about new patterns
      newPatterns.forEach(pattern => {
        onPatternDetected(pattern.type);
      });
    }

    setDetectedPatterns(allPatterns);
  }, [marketData.candles, unlockedPatterns]);

  if (!visible || detectedPatterns.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50px',
          left: '10px',
          zIndex: 100,
          background: 'rgba(30, 30, 30, 0.8)',
          padding: '5px 10px',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer'
        }}
        onClick={() => setVisible(true)}
      >
        Show Patterns
      </div>
    );
  }

  return (
    <PatternContainer>
      <PatternTitle>
        Detected Patterns
        <span
          style={{ float: 'right', cursor: 'pointer' }}
          onClick={() => setVisible(false)}
        >
          ✕
        </span>
      </PatternTitle>
      <PatternList>
        {detectedPatterns.map((pattern, index) => (
          <PatternItem key={index} $direction={pattern.direction}>
            <PatternIcon $direction={pattern.direction}>
              {patternIcons[pattern.type] || '?'}
            </PatternIcon>
            <PatternInfo>
              <PatternName>
                {pattern.type.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </PatternName>
              <PatternDescription>{pattern.description}</PatternDescription>
              <PatternStrength $strength={pattern.strength} />
            </PatternInfo>
          </PatternItem>
        ))}
      </PatternList>
    </PatternContainer>
  );
};

export default PatternRecognition;
