import { useEffect, useState, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import TradingChart from './components/TradingChart';
import OrderBook from './components/OrderBook';
import GamepadController from './components/GamepadController';
import SettingsPanel from './components/SettingsPanel';
import TradeBook from './components/TradeBook';
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
    maxTradeSize: 1.0,
    maxTradesPerSecond: 2,
    tradeSizeStep: 0.1,
    initialBalance: 10000,
    candleInterval: 1000, // Default to 1 second candles
    pnlWindowTime: 15000 // Default to 15 second rolling window
  };

  // Load config from localStorage or use default
  const [config, setConfig] = useState<Config>(() => loadConfig(defaultConfig));

  // Mock wallet state
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState('0x7F9e54Bb92D4652E2c8Bd1fB7529457B8e5c7aD3');
  const [showWalletOptions, setShowWalletOptions] = useState(false);

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

  // Trade rate limiting

  // Trade rate limiting
  const lastTradeTime = useRef<number>(0);

  // Initialize API connection
  useEffect(() => {
    console.log('Initializing API connection...');

    // Set up polling for market data
    const fetchMarketData = () => {
      fetch('http://localhost:3001/api/market-data')
        .then(response => response.json())
        .then(data => {
          // Log every 10th update to avoid flooding the console
          if (Math.random() < 0.1) {
            console.log('Received market data:', {
              timestamp: data.timestamp,
              price: data.price,
              candles: data.candles?.length || 0
            });
          }
          setMarketData(data);
          setIsConnected(true);
        })
        .catch(error => {
          console.error('Error fetching market data:', error);
          setIsConnected(false);
        });
    };

    // Initial fetch
    fetchMarketData();

    // Set up polling interval (every 500ms)
    const intervalId = setInterval(fetchMarketData, 500);

    // Clean up
    return () => {
      console.log('Cleaning up API polling...');
      clearInterval(intervalId);
    };
  }, []);

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

  // Execute a trade
  const executeTrade = (side: 'buy' | 'sell', size: number) => {
    if (!isConnected || !marketData) return;

    // Apply trade rate limiting
    const now = Date.now();
    const timeSinceLastTrade = now - lastTradeTime.current;
    const minTimeBetweenTrades = 1000 / config.maxTradesPerSecond;

    if (timeSinceLastTrade < minTimeBetweenTrades) {
      console.log(`Trade rejected: Rate limit (${config.maxTradesPerSecond} per second) exceeded`);
      return;
    }

    // Round size to the nearest step
    const roundedSize = Math.round(size / config.tradeSizeStep) * config.tradeSizeStep;

    // Check if we have enough balance for buying
    const price = side === 'buy' ? marketData.ask : marketData.bid;
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

    console.log('Executed trade:', trade);
  };



  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Header>
          <Title>Gamified Forex Trading Simulator</Title>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
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
                  <BalanceLabel>BTC Value</BalanceLabel>
                  <BalanceValue>${portfolioValue.toFixed(2)}</BalanceValue>
                </BalanceMetric>

                <BalanceMetric color="rgba(255, 152, 0, 0.3)">
                  <BalanceLabel>Net Worth</BalanceLabel>
                  <BalanceValue>${totalValue.toFixed(2)}</BalanceValue>
                </BalanceMetric>

                <BalanceMetric color="rgba(156, 39, 176, 0.3)">
                  <BalanceLabel>BTC Holdings</BalanceLabel>
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
          <SettingsPanel
            config={config}
            updateConfig={(newConfig) => {
              const updatedConfig = { ...config, ...newConfig };
              setConfig(updatedConfig);
              saveConfig(updatedConfig);
            }}
          />
        )}

        <MainContent>
          <ChartContainer>
            {marketData ? (
              <TradingChart
                marketData={marketData}
                trades={trades}
              />
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
            Connection: {isConnected ? 'Connected' : 'Disconnected'}
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
        </StatusBar>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App
