import { useEffect, useState, useRef, useCallback } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import TradingChart from './components/TradingChart';
import OrderBook from './components/OrderBook';
import GamepadController from './components/GamepadController';
import SimplifiedSettings from './components/SimplifiedSettings';
import TradeBook from './components/TradeBook';
import Footer from './components/Footer';
import AchievementSystem from './components/AchievementSystem';
import PatternRecognition from './components/PatternRecognition';
import type { MarketData, Trade, Config } from './types';
import { theme } from './theme';
import {
  saveConfig,
  loadConfig,
  saveBalance,
  loadBalance,
  saveAssetHoldings,
  loadAssetHoldings,
  clearAllSavedData
} from './utils/localStorage';
import { MarketSimulator, MARKET_PATTERN_PRESETS } from './utils/marketSimulator';
import { initAudio, playSound, setSoundEnabled, isSoundEnabled } from './utils/soundEffects';
import {
  XPProfile,
  createDefaultProfile,
  loadXPProfile,
  saveXPProfile,
  processTradeForXP,
  processAchievementForXP,
  processPatternForXP,
  processSessionTimeForXP
} from './utils/xpSystem';
import XPProgressBar from './components/XPProgressBar';
import Leaderboard from './components/Leaderboard';

// Styled components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.foreground};
  padding: 1rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.primary};
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(50, 50, 50, 0.5);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(70, 70, 70, 0.7);
  }
`;

const WalletStatus = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 0.5rem;
`;

const WalletConnected = styled.div`
  font-size: 0.7rem;
  color: #4CAF50;
`;

const WalletAddress = styled.div`
  font-size: 0.8rem;
  color: white;
`;

const WalletIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #F6851B; /* MetaMask color */
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
`;

const WalletDropdown = styled.div`
  position: absolute;
  top: 60px;
  left: 20px;
  background-color: #2A2A2A;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  z-index: 100;
  min-width: 200px;
`;

const WalletDropdownItem = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3A3A3A;
  }
`;

const BalanceDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: 500px;
`;

const BalanceMetric = styled.div<{ color: string; $isCash?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${props => props.color};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  min-width: ${props => props.$isCash ? '200px' : '100px'};
  position: relative;
  overflow: hidden;
`;

const BalanceLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  margin-bottom: 0.2rem;
`;

const BalanceValue = styled.div<{ $positive?: boolean }>`
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  position: relative;
  z-index: 2;
`;

const CashProgressBar = styled.div<{ $percentage: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${props => props.$percentage}%;
  background-color: rgba(255, 255, 255, 0.15);
  transition: width 0.5s ease-out;
  z-index: 1;
`;

const SettingsButton = styled.button`
  background-color: ${props => props.theme.colors.chart.background};
  color: ${props => props.theme.colors.foreground};
  border: 1px solid ${props => props.theme.colors.chart.grid};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.chart.grid};
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: 1fr auto;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
`;

const ChartContainer = styled.div`
  grid-column: 1;
  grid-row: 1;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
`;

const OrderBookContainer = styled.div`
  grid-column: 2;
  grid-row: 1;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  overflow: auto;
  height: 100%;
`;

const ControlsContainer = styled.div`
  grid-column: 1 / span 2;
  grid-row: 2;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  padding: 0.5rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const MetricCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: rgba(33, 33, 33, 0.5);
`;

const MetricLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.chart.text};
  margin-bottom: 0.2rem;
`;

const MetricValue = styled.div<{ $highlight?: boolean }>`
  font-size: 1rem;
  font-weight: ${props => props.$highlight ? 'bold' : 'normal'};
  color: ${props => props.$highlight ? props.theme.colors.accent : props.theme.colors.foreground};
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.chart.text};
`;

const PriceDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin: 2rem 0;
`;

function App() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Default configuration
  const defaultConfig: Config = {
    initialPrice: 1.1,
    volatility: 0.0001,
    spread: 0.0002,
    updateInterval: 10,
    orderBookLevels: 10,
    maxTradeSize: 0.01,
    maxTradesPerSecond: 5,
    tradeSizeStep: 0.001,
    initialBalance: 10000,
    candleInterval: 1000, // Default to 1 second candles
    pnlWindowTime: 15000, // Default to 15 second rolling window
    // Price change threshold sliders (percent)
    priceChangeThreshold15s: 3,   // 0-20, default 3
    priceChangeThreshold1m: 5,    // 1-30, default 5
    priceChangeThreshold15m: 5,   // 5-45, default 5
    priceChangeThreshold1h: 5,    // 5-100, default 5
    marketDataSource: 'simulator', // Default to simulator for better initial experience
    symbol: 'ethusdt',  // Default to Ethereum/USDT
    patternType: 'random_walk',
    patternStrength: 0.5,
    patternDuration: 30000
  };

  // Load config from localStorage or use default
  const [config, setConfig] = useState<Config>(() => loadConfig(defaultConfig));

  // Mock wallet state
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState('0x7F9e54Bb92D4652E2c8Bd1fB7529457B8e5c7aD3');
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Game state
  const [unlockedPatterns, setUnlockedPatterns] = useState<string[]>(['support_resistance']);
  const [unlockedSimulators, setUnlockedSimulators] = useState<string[]>(['basic']);
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [multiplierExpiry, setMultiplierExpiry] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [recentXPGain, setRecentXPGain] = useState(0);

  // XP system
  const [xpProfile, setXPProfile] = useState<XPProfile>(() =>
    loadXPProfile('user123', walletAddress.substring(0, 6))
  );

  // Session time tracking for XP
  const sessionStartTime = useRef(Date.now());
  const lastSessionXP = useRef(Date.now());

  // Client-side simulator
  const simulatorRef = useRef<MarketSimulator | null>(null);

  // Balance tracking - load from localStorage or use default
  const [balance, setBalance] = useState(() => loadBalance(config.initialBalance));
  const [assetHoldings, setAssetHoldings] = useState(() => loadAssetHoldings(0)); // Track how much of the asset we own
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalValue, setTotalValue] = useState(config.initialBalance);

  // PnL tracking
  const [historicalValues, setHistoricalValues] = useState<{timestamp: number, value: number}[]>([]);
  const [rollingPnL, setRollingPnL] = useState(0);

  // Price change tracking
  const [historicalPrices, setHistoricalPrices] = useState<{timestamp: number, price: number}[]>([]);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  // Function to reset chart data when settings change
  const resetChartData = useCallback(() => {
    setMarketData(null);
    setTrades([]);
    setHistoricalValues([]);
    setHistoricalPrices([]);
    setRollingPnL(0);
    setPriceChangePercent(0);
    console.log('Chart data reset');
  }, []);

  // Trade rate limiting
  const lastTradeTime = useRef<number>(0);

  // Initialize API connection
  useEffect(() => {
    let intervalId: number | null = null;
    let ws: WebSocket | null = null;
    let wsReconnectTimeout: number | null = null;
    let isUnmounted = false;

    // This effect should run whenever the market data source or symbol changes
    console.log(`Connecting to ${config.marketDataSource} with symbol ${config.symbol}`);

    // Reset chart data when data source or symbol changes
    resetChartData();

    if (config.marketDataSource === 'simulator') {
      // Initialize client-side simulator
      if (!simulatorRef.current) {
        simulatorRef.current = new MarketSimulator({
          initialPrice: config.initialPrice,
          volatility: config.volatility,
          spread: config.spread,
          updateInterval: config.updateInterval,
          orderBookLevels: config.orderBookLevels,
          patternType: config.patternType,
          patternStrength: config.patternStrength,
          patternDuration: config.patternDuration
        });
      } else {
        // Update simulator config
        simulatorRef.current.updateConfig({
          volatility: config.volatility,
          spread: config.spread,
          updateInterval: config.updateInterval,
          orderBookLevels: config.orderBookLevels,
          patternType: config.patternType,
          patternStrength: config.patternStrength,
          patternDuration: config.patternDuration
        });
      }

      // Set up interval to generate market data
      const generateMarketData = () => {
        if (simulatorRef.current) {
          const data = simulatorRef.current.generateMarketData();
          setMarketData(data);
          setIsConnected(true);
        }
      };

      // Initial data generation
      generateMarketData();

      // Set up interval
      intervalId = window.setInterval(generateMarketData, config.updateInterval);
    } else if (config.marketDataSource === 'binance') {
      // Connect to Binance WebSocket
      const connectWS = () => {
        // Use the user-specified symbol from config
        const symbol = config.symbol.toLowerCase();
        ws = new window.WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_1s`);
        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          console.log(`Connected to Binance WebSocket for ${symbol}`);
        };
        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.k) {
              setMarketData(prev => {
                // Always update price, timestamp, bid, ask
                const base = {
                  price: parseFloat(msg.k.c),
                  timestamp: msg.k.T,
                  bid: parseFloat(msg.k.c),
                  ask: parseFloat(msg.k.c),
                  orderBook: prev?.orderBook ?? { bids: [], asks: [] },
                  trades: prev?.trades ?? []
                };
                // Only add a new candle if kline is closed
                if (msg.k.x) {
                  const newCandle = {
                    open: parseFloat(msg.k.o),
                    high: parseFloat(msg.k.h),
                    low: parseFloat(msg.k.l),
                    close: parseFloat(msg.k.c),
                    volume: parseFloat(msg.k.v),
                    timestamp: msg.k.T
                  };
                  return {
                    ...base,
                    candles: [
                      ...(prev?.candles || []),
                      newCandle
                    ].slice(-100)
                  };
                } else {
                  // Keep existing candles
                  return {
                    ...base,
                    candles: prev?.candles || []
                  };
                }
              });
            }
          } catch (err) {
            console.error('Error parsing Binance message:', err);
          }
        };
        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          console.warn('Binance WebSocket closed, reconnecting...');
          wsReconnectTimeout = setTimeout(connectWS, 2000);
        };
        ws.onerror = (err) => {
          if (isUnmounted) return;
          setIsConnected(false);
          console.error('Binance WebSocket error:', err);
          ws?.close();
        };
      };
      connectWS();
    } else {
      // "Else" (WIP): set disconnected state, no data
      setIsConnected(false);
    }

    // Cleanup
    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
      if (ws) ws.close();
      if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
    };
  }, [config.marketDataSource, config.symbol]);

  // Calculate portfolio value whenever asset holdings or market price changes
  useEffect(() => {
    if (!marketData) return;

    // Calculate the value of current asset holdings
    const currentPositionValue = assetHoldings * marketData.price;
    const newTotalValue = balance + currentPositionValue;

    setPortfolioValue(currentPositionValue);
    setTotalValue(newTotalValue);

    // Add to historical values for PnL calculation
    const now = Date.now();
    setHistoricalValues(prev => {
      // Add current value
      const updated = [...prev, { timestamp: now, value: newTotalValue }];

      // Remove values older than the window time
      const cutoffTime = now - config.pnlWindowTime;
      return updated.filter(item => item.timestamp >= cutoffTime);
    });

    // Calculate rolling PnL if we have historical data
    setHistoricalValues(prev => {
      if (prev.length > 0) {
        // Find the oldest value in our window
        const oldestValue = prev[0].value;
        // Calculate PnL as current value minus oldest value
        setRollingPnL(newTotalValue - oldestValue);
      }
      return prev;
    });

    // Track price changes over the PnL window
    setHistoricalPrices(prev => {
      // Add current price
      const updated = [...prev, { timestamp: now, price: marketData.price }];

      // Remove prices older than the window time
      const cutoffTime = now - config.pnlWindowTime;
      const filtered = updated.filter(item => item.timestamp >= cutoffTime);

      // Calculate price change percentage if we have historical data
      if (filtered.length > 0) {
        const oldestPrice = filtered[0].price;
        const priceChange = ((marketData.price - oldestPrice) / oldestPrice) * 100;
        setPriceChangePercent(priceChange);
      }

      return filtered;
    });
  }, [assetHoldings, marketData, balance, config.pnlWindowTime]);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initOnInteraction = () => {
      initAudio();
      setSoundEnabled(soundEnabled);
      document.removeEventListener('click', initOnInteraction);
    };

    document.addEventListener('click', initOnInteraction);

    return () => {
      document.removeEventListener('click', initOnInteraction);
    };
  }, [soundEnabled]);

  // Session time XP
  useEffect(() => {
    // Award XP for session time every 5 minutes
    const sessionInterval = setInterval(() => {
      const now = Date.now();
      const minutesActive = Math.floor((now - lastSessionXP.current) / (60 * 1000));

      if (minutesActive >= 5) {
        const result = processSessionTimeForXP(xpProfile, minutesActive);
        setXPProfile(result.updatedProfile);
        saveXPProfile(result.updatedProfile);
        setRecentXPGain(result.xpGained);
        lastSessionXP.current = now;
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(sessionInterval);
  }, [xpProfile]);

  // Execute a trade
  const executeTrade = (side: 'buy' | 'sell', size: number) => {
    if (!isConnected || !marketData) return;

    // Apply trade rate limiting
    const now = Date.now();
    const timeSinceLastTrade = now - lastTradeTime.current;
    const minTimeBetweenTrades = 1000 / config.maxTradesPerSecond;

    if (timeSinceLastTrade < minTimeBetweenTrades) {
      console.log(`Trade rejected: Rate limit (${config.maxTradesPerSecond} per second) exceeded`);
      playSound('error', 0.3);
      return;
    }

    // Round size to the nearest step
    const roundedSize = Math.round(size / config.tradeSizeStep) * config.tradeSizeStep;

    // Check if we have enough balance for buying
    const price = side === 'buy' ? marketData.ask : marketData.bid;

    // Apply streak multiplier to trade size if active
    const effectiveMultiplier = Date.now() < multiplierExpiry ? streakMultiplier : 1;
    const tradeValue = Math.abs(roundedSize) * price;

    // Validate the trade
    if (side === 'buy') {
      // Check if we have enough cash balance for buying
      if (tradeValue > balance) {
        console.log(`Trade rejected: Insufficient balance (${balance.toFixed(2)}) for trade value (${tradeValue.toFixed(2)})`);
        return;
      }
    } else {
      // Check if we have enough asset holdings for selling
      if (roundedSize > assetHoldings) {
        console.log(`Trade rejected: Insufficient asset holdings (${assetHoldings.toFixed(2)}) for sell amount (${roundedSize.toFixed(2)})`);
        return;
      }
    }

    // Create the trade
    const trade: Trade = {
      id: now.toString(),
      timestamp: now,
      side,
      size: roundedSize,
      price,
      value: tradeValue
    };

    // Update balance and asset holdings
    if (side === 'buy') {
      const newBalance = balance - tradeValue;
      const newHoldings = assetHoldings + roundedSize;
      setBalance(newBalance);
      setAssetHoldings(newHoldings);
      // Save to localStorage
      saveBalance(newBalance);
      saveAssetHoldings(newHoldings);
    } else {
      const newBalance = balance + tradeValue;
      const newHoldings = assetHoldings - roundedSize;
      setBalance(newBalance);
      setAssetHoldings(newHoldings);
      // Save to localStorage
      saveBalance(newBalance);
      saveAssetHoldings(newHoldings);
    }

    // Update trade history
    setTrades(prevTrades => [trade, ...prevTrades].slice(0, 100));

    // Update last trade time for rate limiting
    lastTradeTime.current = now;

    // Add trade to simulator if using simulator
    if (config.marketDataSource === 'simulator' && simulatorRef.current) {
      simulatorRef.current.addTrade(side, roundedSize, price);
    }

    // Play sound effect
    playSound(side, 0.5);

    // Process trade for XP
    const pnl = side === 'buy'
      ? (marketData.price - price) * Math.abs(roundedSize)
      : (price - marketData.price) * Math.abs(roundedSize);

    const currentStreak = pnl > 0 ? (xpProfile.stats.longestStreak + 1) : 0;

    const xpResult = processTradeForXP(xpProfile, trade, marketData.price, currentStreak);
    setXPProfile(xpResult.updatedProfile);
    saveXPProfile(xpResult.updatedProfile);
    setRecentXPGain(xpResult.xpGained);

    console.log('Executed trade:', trade);
  };

  // Handle achievement rewards
  const handleUnlockReward = (reward: { type: string; value: string | number; description: string }, achievementId: string, achievementName: string) => {
    console.log('Unlocked reward:', reward);

    // Play achievement sound
    playSound('achievement', 0.7);

    // Process achievement for XP
    const xpResult = processAchievementForXP(xpProfile, achievementId, achievementName);
    setXPProfile(xpResult.updatedProfile);
    saveXPProfile(xpResult.updatedProfile);
    setRecentXPGain(xpResult.xpGained);

    switch (reward.type) {
      case 'pattern_highlight':
        // Add pattern to unlocked patterns
        setUnlockedPatterns(prev => [...prev, reward.value as string]);
        break;

      case 'multiplier':
        // Set multiplier and expiry time
        setStreakMultiplier(reward.value as number);
        setMultiplierExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes
        break;

      case 'simulator':
        // Unlock simulator features
        setUnlockedSimulators(prev => [...prev, reward.value as string]);
        break;
    }
  };

  // Toggle sound
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabledState(newState);
    setSoundEnabled(newState);
    playSound('click', 0.3);
  };



  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Header>
          <Title>TradeStick</Title>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <XPProgressBar
              xpProfile={xpProfile}
              recentXP={recentXPGain}
              onLeaderboardClick={() => setShowLeaderboard(true)}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Wallet Connection UI */}
              <div style={{ position: 'relative', marginRight: '20px' }}>
                <WalletContainer onClick={() => setShowWalletOptions(!showWalletOptions)}>
                  <WalletIcon>M</WalletIcon>
                  <WalletStatus>
                    <WalletConnected>Connected</WalletConnected>
                    <WalletAddress>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</WalletAddress>
                  </WalletStatus>
                  <div style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                    {showWalletOptions ? '▲' : '▼'}
                  </div>
                </WalletContainer>

                {showWalletOptions && (
                  <WalletDropdown>
                    <WalletDropdownItem onClick={() => {
                      // Simulate wallet connection
                      setWalletAddress('0x7F9e54Bb92D4652E2c8Bd1fB7529457B8e5c7aD3');
                      setWalletConnected(true);
                      setShowWalletOptions(false);
                    }}>
                      MetaMask
                    </WalletDropdownItem>
                    <WalletDropdownItem onClick={() => {
                      // Simulate wallet connection
                      setWalletAddress('0x3F8CB43e1B1D4e2E48C3eA98A57A7C2e394d51B9');
                      setWalletConnected(true);
                      setShowWalletOptions(false);
                    }}>
                      Coinbase Wallet
                    </WalletDropdownItem>
                    <WalletDropdownItem onClick={() => {
                      // Simulate wallet disconnection
                      setWalletConnected(false);
                      setShowWalletOptions(false);
                    }}>
                      Disconnect
                    </WalletDropdownItem>
                  </WalletDropdown>
                )}
              </div>

              {/* Cash with progress bar - Moved to left side */}
              <BalanceMetric color="rgba(76, 175, 80, 0.3)" $isCash={true}>
                <CashProgressBar $percentage={(balance / config.initialBalance) * 100} />
                <BalanceLabel>Cash</BalanceLabel>
                <BalanceValue>${balance.toFixed(2)}</BalanceValue>
              </BalanceMetric>
            </div>

            <HeaderControls>
              <BalanceDisplay>
                <BalanceMetric color="rgba(33, 150, 243, 0.3)">
                  <BalanceLabel>{config.symbol.slice(0, -4).toUpperCase()} Value</BalanceLabel>
                  <BalanceValue>{assetHoldings.toFixed(8)} {config.symbol.slice(0, -4).toUpperCase()}</BalanceValue>
                </BalanceMetric>

                <BalanceMetric color="rgba(255, 152, 0, 0.3)">
                  <BalanceLabel>PnL</BalanceLabel>
                  <BalanceValue>
                    {(totalValue - config.initialBalance >= 0 ? '+' : '') + (totalValue - config.initialBalance).toFixed(2)}$
                  </BalanceValue>
                  <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '2px' }}>
                    {config.initialBalance > 0
                      ? ((totalValue - config.initialBalance) / config.initialBalance * 100).toFixed(2) + '%'
                      : 'N/A'}
                  </div>
                </BalanceMetric>

                <BalanceMetric color="rgba(156, 39, 176, 0.3)">
                  <BalanceLabel>{config.symbol.slice(0, -4).toUpperCase()} Holdings</BalanceLabel>
                  <BalanceValue>{assetHoldings.toFixed(4)}</BalanceValue>
                </BalanceMetric>

                <BalanceMetric color={rollingPnL >= 0 ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)"}>
                  <BalanceLabel>{config.pnlWindowTime/1000}s PnL</BalanceLabel>
                  <BalanceValue>
                    {rollingPnL >= 0 ? '+' : ''}{rollingPnL.toFixed(2)}
                  </BalanceValue>
                </BalanceMetric>

                <BalanceMetric color={priceChangePercent >= 0 ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)"}>
                  <BalanceLabel>{config.pnlWindowTime/1000}s Price Δ%</BalanceLabel>
                  <BalanceValue>
                    {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                  </BalanceValue>
                </BalanceMetric>
              </BalanceDisplay>
              <SettingsButton onClick={() => setShowSettings(!showSettings)}>
                Settings
              </SettingsButton>
            </HeaderControls>
          </div>
        </Header>

        {showSettings && (
          <SimplifiedSettings
            config={config}
            updateConfig={(newConfig) => {
              const updatedConfig = { ...config, ...newConfig };
              setConfig(updatedConfig);
              saveConfig(updatedConfig);

              // Reset chart data when settings are updated
              resetChartData();
            }}
            onClose={() => setShowSettings(false)}
            unlockedSimulators={unlockedSimulators}
          />
        )}

        <MainContent>
          <ChartContainer>
            {marketData ? (
              <>
                <TradingChart
                  marketData={marketData}
                  trades={trades}
                />
                <PatternRecognition
                  marketData={marketData}
                  unlockedPatterns={unlockedPatterns}
                  onPatternDetected={(patternType) => {
                    // Process pattern detection for XP
                    const result = processPatternForXP(xpProfile, patternType);
                    setXPProfile(result.updatedProfile);
                    saveXPProfile(result.updatedProfile);
                    setRecentXPGain(result.xpGained);

                    // Play pattern detected sound
                    playSound('pattern_detected', 0.4);
                  }}
                />
                <AchievementSystem
                  trades={trades}
                  currentPrice={marketData.price}
                  onUnlockReward={handleUnlockReward}
                />
              </>
            ) : (
              <PriceDisplay>Loading...</PriceDisplay>
            )}
          </ChartContainer>

          <OrderBookContainer>
            {marketData && (
              <>
                <TradeBook trades={trades} maxTrades={10} />
                <OrderBook orderBook={marketData.orderBook} />
              </>
            )}
          </OrderBookContainer>

          <ControlsContainer>
            <MetricCard>
              <MetricLabel>24h High</MetricLabel>
              <MetricValue $highlight={true}>{marketData ? (marketData.price * 1.05).toFixed(5) : 'Loading...'}</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricLabel>24h Low</MetricLabel>
              <MetricValue $highlight={true}>{marketData ? (marketData.price * 0.95).toFixed(5) : 'Loading...'}</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricLabel>24h Volume</MetricLabel>
              <MetricValue>$1,245,678</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricLabel>Market Cap</MetricLabel>
              <MetricValue>$452.8B</MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricLabel>Circulating Supply</MetricLabel>
              <MetricValue>19.4M BTC</MetricValue>
            </MetricCard>
          </ControlsContainer>
        </MainContent>

        <GamepadController
          executeTrade={executeTrade}
          maxTradeSize={config.maxTradeSize}
          tradeSizeStep={config.tradeSizeStep}
          currentPrice={marketData?.price || 0}
        />

        <StatusBar>
          <div>
            Connection: {isConnected ? 'Connected' : 'Disconnected'} ({config.marketDataSource})
          </div>
          <div>
            Symbol: <strong>{config.symbol.toUpperCase()}</strong>
          </div>
          <div>
            Current Price: {marketData?.price.toFixed(5) || 'Loading...'}
          </div>
          <div>
            Spread: {marketData ? (marketData.ask - marketData.bid).toFixed(5) : 'Loading...'}
          </div>
          <div>
            Rate Limit: {config.maxTradesPerSecond}/sec
          </div>
          <div style={{ cursor: 'pointer' }} onClick={toggleSound}>
            Sound: {soundEnabled ? '🔊 ON' : '🔇 OFF'}
          </div>
        </StatusBar>

        <Footer />

        {showLeaderboard && (
          <Leaderboard
            userProfile={xpProfile}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App
