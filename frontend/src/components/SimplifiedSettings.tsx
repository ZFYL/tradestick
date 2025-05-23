import React, { useState } from 'react';
import styled from 'styled-components';
import type { Config } from '../types';
import { MARKET_PATTERN_PRESETS } from '../utils/marketSimulator';

interface SimplifiedSettingsProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => void;
  onClose: () => void;
  unlockedSimulators: string[];
}

const SettingsContainer = styled.div`
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 20px;
  color: white;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
`;

const SettingsTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #4CAF50;
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
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.div<{ $active: boolean }>`
  padding: 10px 20px;
  cursor: pointer;
  opacity: ${props => props.$active ? 1 : 0.6};
  border-bottom: 2px solid ${props => props.$active ? '#4CAF50' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const SettingsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SettingsSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #FFC107;
`;

const PatternGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const PatternCard = styled.div<{ $selected: boolean, $locked?: boolean }>`
  background-color: ${props => props.$selected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$selected ? '#4CAF50' : 'transparent'};
  border-radius: 6px;
  padding: 12px;
  cursor: ${props => props.$locked ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$locked ? 0.5 : 1};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$locked ? 'rgba(255, 255, 255, 0.05)' : props.$selected ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const PatternTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const PatternDescription = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const LockedOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  font-weight: bold;
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const SettingsLabel = styled.label`
  flex: 1;
  font-size: 0.9rem;
`;

const SettingsValue = styled.div`
  width: 60px;
  text-align: right;
  margin-left: 10px;
  font-weight: bold;
`;

const Slider = styled.input`
  flex: 2;
  margin: 0 10px;
  
  &::-webkit-slider-thumb {
    background: #4CAF50;
  }
  
  &::-moz-range-thumb {
    background: #4CAF50;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  background-color: ${props => props.$variant === 'primary' ? '#4CAF50' : 
                               props.$variant === 'danger' ? '#F44336' : '#555'};
  color: white;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SymbolSelector = styled.select`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 8px;
  width: 100%;
  margin-top: 5px;
`;

const SimplifiedSettings: React.FC<SimplifiedSettingsProps> = ({ 
  config, 
  updateConfig, 
  onClose,
  unlockedSimulators
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'simulator' | 'advanced'>('general');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  // Available trading pairs
  const tradingPairs = [
    { symbol: 'btcusdt', name: 'Bitcoin (BTC/USDT)' },
    { symbol: 'ethusdt', name: 'Ethereum (ETH/USDT)' },
    { symbol: 'bnbusdt', name: 'Binance Coin (BNB/USDT)' },
    { symbol: 'solusdt', name: 'Solana (SOL/USDT)' },
    { symbol: 'adausdt', name: 'Cardano (ADA/USDT)' },
    { symbol: 'dogeusdt', name: 'Dogecoin (DOGE/USDT)' },
    { symbol: 'xrpusdt', name: 'Ripple (XRP/USDT)' },
    { symbol: 'dotusdt', name: 'Polkadot (DOT/USDT)' },
    { symbol: 'maticusdt', name: 'Polygon (MATIC/USDT)' },
    { symbol: 'linkusdt', name: 'Chainlink (LINK/USDT)' },
  ];

  const handlePatternSelect = (patternKey: string) => {
    if (unlockedSimulators.includes('advanced') || patternKey === 'UPTREND' || patternKey === 'DOWNTREND') {
      setSelectedPattern(patternKey);
      
      // Apply pattern settings
      const pattern = MARKET_PATTERN_PRESETS[patternKey];
      updateConfig({
        volatility: pattern.volatility,
        patternType: pattern.patternType,
        patternStrength: pattern.patternStrength,
        patternDuration: pattern.patternDuration,
        marketDataSource: 'simulator' // Switch to simulator mode
      });
    }
  };

  const handleReset = () => {
    // Reset to default configuration
    updateConfig({
      initialBalance: 10000,
      volatility: 0.0001,
      spread: 0.0002,
      maxTradesPerSecond: 5,
      patternType: undefined,
      patternStrength: undefined,
      patternDuration: undefined
    });
    setSelectedPattern(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateConfig({ [name]: parseFloat(value) });
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>Game Settings</SettingsTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </SettingsHeader>
      
      <TabContainer>
        <Tab 
          $active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')}
        >
          General
        </Tab>
        <Tab 
          $active={activeTab === 'simulator'} 
          onClick={() => setActiveTab('simulator')}
        >
          Market Simulator
        </Tab>
        <Tab 
          $active={activeTab === 'advanced'} 
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </Tab>
      </TabContainer>
      
      <SettingsContent>
        {activeTab === 'general' && (
          <>
            <SettingsSection>
              <SectionTitle>Data Source</SectionTitle>
              <SettingsRow>
                <SettingsLabel>Market Data:</SettingsLabel>
                <select
                  value={config.marketDataSource}
                  onChange={(e) => updateConfig({ marketDataSource: e.target.value as any })}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '8px',
                    marginLeft: '10px'
                  }}
                >
                  <option value="simulator">Simulator</option>
                  <option value="binance">Binance (Live)</option>
                </select>
              </SettingsRow>
              
              {config.marketDataSource === 'binance' && (
                <SettingsRow>
                  <SettingsLabel>Trading Pair:</SettingsLabel>
                  <SymbolSelector
                    value={config.symbol}
                    onChange={(e) => updateConfig({ symbol: e.target.value })}
                  >
                    {tradingPairs.map(pair => (
                      <option key={pair.symbol} value={pair.symbol}>
                        {pair.name}
                      </option>
                    ))}
                  </SymbolSelector>
                </SettingsRow>
              )}
            </SettingsSection>
            
            <SettingsSection>
              <SectionTitle>Game Settings</SectionTitle>
              <SettingsRow>
                <SettingsLabel>Starting Balance:</SettingsLabel>
                <Slider
                  type="range"
                  name="initialBalance"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={config.initialBalance}
                  onChange={handleSliderChange}
                />
                <SettingsValue>${config.initialBalance}</SettingsValue>
              </SettingsRow>
              
              <SettingsRow>
                <SettingsLabel>Trade Speed Limit:</SettingsLabel>
                <Slider
                  type="range"
                  name="maxTradesPerSecond"
                  min="1"
                  max="20"
                  step="1"
                  value={config.maxTradesPerSecond}
                  onChange={handleSliderChange}
                />
                <SettingsValue>{config.maxTradesPerSecond}/sec</SettingsValue>
              </SettingsRow>
            </SettingsSection>
          </>
        )}
        
        {activeTab === 'simulator' && (
          <SettingsSection>
            <SectionTitle>Market Patterns</SectionTitle>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '15px' }}>
              Select a market pattern to simulate specific price movements. Unlock more patterns by achieving trading goals!
            </p>
            
            <PatternGrid>
              {Object.entries(MARKET_PATTERN_PRESETS).map(([key, pattern]) => {
                const isAdvanced = !['UPTREND', 'DOWNTREND'].includes(key);
                const isLocked = isAdvanced && !unlockedSimulators.includes('advanced');
                
                return (
                  <PatternCard
                    key={key}
                    $selected={selectedPattern === key}
                    $locked={isLocked}
                    onClick={() => !isLocked && handlePatternSelect(key)}
                    style={{ position: 'relative' }}
                  >
                    <PatternTitle>{key.replace(/_/g, ' ')}</PatternTitle>
                    <PatternDescription>{pattern.description}</PatternDescription>
                    
                    {isLocked && (
                      <LockedOverlay>
                        🔒 LOCKED
                      </LockedOverlay>
                    )}
                  </PatternCard>
                );
              })}
            </PatternGrid>
            
            {selectedPattern && (
              <div style={{ marginTop: '20px' }}>
                <SectionTitle>Pattern Settings</SectionTitle>
                <SettingsRow>
                  <SettingsLabel>Volatility:</SettingsLabel>
                  <Slider
                    type="range"
                    name="volatility"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    value={config.volatility}
                    onChange={handleSliderChange}
                  />
                  <SettingsValue>{(config.volatility * 100).toFixed(2)}%</SettingsValue>
                </SettingsRow>
                
                <SettingsRow>
                  <SettingsLabel>Pattern Strength:</SettingsLabel>
                  <Slider
                    type="range"
                    name="patternStrength"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.patternStrength || 0.5}
                    onChange={handleSliderChange}
                  />
                  <SettingsValue>{((config.patternStrength || 0.5) * 100).toFixed(0)}%</SettingsValue>
                </SettingsRow>
              </div>
            )}
          </SettingsSection>
        )}
        
        {activeTab === 'advanced' && (
          <SettingsSection>
            <SectionTitle>Advanced Settings</SectionTitle>
            <SettingsRow>
              <SettingsLabel>Spread:</SettingsLabel>
              <Slider
                type="range"
                name="spread"
                min="0.0001"
                max="0.001"
                step="0.0001"
                value={config.spread}
                onChange={handleSliderChange}
              />
              <SettingsValue>{(config.spread * 10000).toFixed(1)} pips</SettingsValue>
            </SettingsRow>
            
            <SettingsRow>
              <SettingsLabel>Update Interval:</SettingsLabel>
              <Slider
                type="range"
                name="updateInterval"
                min="5"
                max="50"
                step="5"
                value={config.updateInterval}
                onChange={handleSliderChange}
              />
              <SettingsValue>{config.updateInterval}ms</SettingsValue>
            </SettingsRow>
            
            <SettingsRow>
              <SettingsLabel>Order Book Depth:</SettingsLabel>
              <Slider
                type="range"
                name="orderBookLevels"
                min="5"
                max="20"
                step="1"
                value={config.orderBookLevels}
                onChange={handleSliderChange}
              />
              <SettingsValue>{config.orderBookLevels}</SettingsValue>
            </SettingsRow>
            
            <SettingsRow>
              <SettingsLabel>Trade Size Step:</SettingsLabel>
              <Slider
                type="range"
                name="tradeSizeStep"
                min="0.000000001"
                max="0.0001"
                step="0.000000001"
                value={config.tradeSizeStep}
                onChange={handleSliderChange}
              />
              <SettingsValue>{config.tradeSizeStep}</SettingsValue>
            </SettingsRow>
          </SettingsSection>
        )}
        
        <ButtonGroup>
          <Button onClick={handleReset}>Reset</Button>
          <Button $variant="primary" onClick={onClose}>Save & Close</Button>
        </ButtonGroup>
      </SettingsContent>
    </SettingsContainer>
  );
};

export default SimplifiedSettings;
