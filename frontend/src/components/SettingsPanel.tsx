import React, { useState } from 'react';
import styled from 'styled-components';
import type { Config } from '../types';
import { clearAllSavedData } from '../utils/localStorage';

// Market condition presets
const MARKET_PRESETS = {
  CHILL: {
    volatility: 0.0005,
    spread: 0.0001,
    updateInterval: 20,
    maxTradesPerSecond: 5
  },
  ON_FIRE: {
    volatility: 0.005,
    spread: 0.0005,
    updateInterval: 10,
    maxTradesPerSecond: 10
  },
  CRAZY: {
    volatility: 0.02,
    spread: 0.001,
    updateInterval: 5,
    maxTradesPerSecond: 20
  }
};

interface SettingsPanelProps {
  config: Config;
  updateConfig: (config: Partial<Config>) => void;
}

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const SettingsTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  color: ${props => props.theme.colors.foreground};
`;

const SettingsForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.chart.text};
`;

const Input = styled.input`
  padding: 0.75rem;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.chart.grid};
  border-radius: 4px;
  color: ${props => props.theme.colors.foreground};
`;

const Select = styled.select`
  padding: 0.75rem;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.chart.grid};
  border-radius: 4px;
  color: ${props => props.theme.colors.foreground};
`;

const RangeContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RangeValue = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.chart.text};
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  gap: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : props.theme.colors.foreground};
  border: 1px solid ${props => props.variant === 'primary' ? 'transparent' : props.theme.colors.chart.grid};
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    background-color: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const PresetButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  grid-column: 1 / -1;
  margin-bottom: 1.5rem;
`;

const PresetButton = styled.button<{ $preset: 'CHILL' | 'ON_FIRE' | 'CRAZY' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  background-color: ${props => {
    switch (props.$preset) {
      case 'CHILL':
        return 'rgba(33, 150, 243, 0.2)';
      case 'ON_FIRE':
        return 'rgba(255, 152, 0, 0.2)';
      case 'CRAZY':
        return 'rgba(244, 67, 54, 0.2)';
    }
  }};

  color: ${props => {
    switch (props.$preset) {
      case 'CHILL':
        return '#2196F3';
      case 'ON_FIRE':
        return '#FF9800';
      case 'CRAZY':
        return '#F44336';
    }
  }};

  border: 1px solid ${props => {
    switch (props.$preset) {
      case 'CHILL':
        return '#2196F3';
      case 'ON_FIRE':
        return '#FF9800';
      case 'CRAZY':
        return '#F44336';
    }
  }};

  &:hover {
    background-color: ${props => {
      switch (props.$preset) {
        case 'CHILL':
          return 'rgba(33, 150, 243, 0.4)';
        case 'ON_FIRE':
          return 'rgba(255, 152, 0, 0.4)';
        case 'CRAZY':
          return 'rgba(244, 67, 54, 0.4)';
      }
    }};
  }
`;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, updateConfig }) => {
  const [formValues, setFormValues] = useState<Config>({ ...config });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement;

    // Convert to appropriate type
    let parsedValue: string | number = value;

    // Convert numeric inputs to numbers
    // Include range inputs and specific named fields
    if (
      type === 'number' ||
      type === 'range' ||
      name === 'candleInterval' ||
      name === 'pnlWindowTime'
    ) {
      parsedValue = parseFloat(value);
    }

    setFormValues(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formValues);
  };

  const handleReset = () => {
    setFormValues({ ...config });
  };

  const applyPreset = (preset: 'CHILL' | 'ON_FIRE' | 'CRAZY') => {
    const presetConfig = MARKET_PRESETS[preset];
    const newConfig = { ...formValues, ...presetConfig };
    setFormValues(newConfig);
    updateConfig(newConfig); // Apply immediately
  };

  return (
    <SettingsContainer>
      <SettingsTitle>Simulation Settings</SettingsTitle>

      <PresetButtonsContainer>
        <PresetButton
          type="button"
          $preset="CHILL"
          onClick={() => applyPreset('CHILL')}
        >
          Chill Market
        </PresetButton>
        <PresetButton
          type="button"
          $preset="ON_FIRE"
          onClick={() => applyPreset('ON_FIRE')}
        >
          Market on Fire
        </PresetButton>
        <PresetButton
          type="button"
          $preset="CRAZY"
          onClick={() => applyPreset('CRAZY')}
        >
          Crazy Market
        </PresetButton>
      </PresetButtonsContainer>

      <SettingsForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="initialPrice">Initial Price</Label>
          <Input
            id="initialPrice"
            name="initialPrice"
            type="number"
            min="0.1"
            step="0.00001"
            value={formValues.initialPrice}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="volatility">Volatility</Label>
          <RangeContainer>
            <Input
              id="volatility"
              name="volatility"
              type="range"
              min="0.00001"
              max="0.05"
              step="0.0001"
              value={formValues.volatility}
              onChange={handleChange}
            />
            <RangeValue>
              {typeof formValues.volatility === 'number'
                ? `${formValues.volatility.toFixed(5)} (${(formValues.volatility * 100).toFixed(2)}%)`
                : '0.00000 (0.00%)'}
            </RangeValue>
          </RangeContainer>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="spread">Spread</Label>
          <RangeContainer>
            <Input
              id="spread"
              name="spread"
              type="range"
              min="0.00001"
              max="0.005"
              step="0.00001"
              value={formValues.spread}
              onChange={handleChange}
            />
            <RangeValue>
              {typeof formValues.spread === 'number'
                ? `${formValues.spread.toFixed(5)} (${(formValues.spread * 10000).toFixed(1)} pips)`
                : '0.00000 (0.0 pips)'}
            </RangeValue>
          </RangeContainer>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="updateInterval">Update Interval (ms)</Label>
          <Input
            id="updateInterval"
            name="updateInterval"
            type="number"
            min="1"
            max="100"
            step="1"
            value={formValues.updateInterval}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="orderBookLevels">Order Book Levels</Label>
          <Input
            id="orderBookLevels"
            name="orderBookLevels"
            type="number"
            min="1"
            max="20"
            step="1"
            value={formValues.orderBookLevels}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="maxTradeSize">Maximum Trade Size</Label>
          <Input
            id="maxTradeSize"
            name="maxTradeSize"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={formValues.maxTradeSize}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="tradeSizeStep">Trade Size Step</Label>
          <Input
            id="tradeSizeStep"
            name="tradeSizeStep"
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={formValues.tradeSizeStep}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="initialBalance">Initial Balance ($)</Label>
          <Input
            id="initialBalance"
            name="initialBalance"
            type="number"
            min="100"
            max="1000000"
            step="100"
            value={formValues.initialBalance}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="maxTradesPerSecond">Max Trades Per Second</Label>
          <RangeContainer>
            <Input
              id="maxTradesPerSecond"
              name="maxTradesPerSecond"
              type="range"
              min="1"
              max="20"
              step="1"
              value={formValues.maxTradesPerSecond}
              onChange={handleChange}
            />
            <RangeValue>{typeof formValues.maxTradesPerSecond === 'number' ? formValues.maxTradesPerSecond : '0'}</RangeValue>
          </RangeContainer>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="candleInterval">Candle Interval</Label>
          <Select
            id="candleInterval"
            name="candleInterval"
            value={formValues.candleInterval}
            onChange={handleChange}
          >
            <option value="10">10ms</option>
            <option value="100">100ms</option>
            <option value="1000">1s</option>
            <option value="5000">5s</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="pnlWindowTime">PnL Rolling Window</Label>
          <Select
            id="pnlWindowTime"
            name="pnlWindowTime"
            value={formValues.pnlWindowTime}
            onChange={handleChange}
          >
            <option value="5000">5s</option>
            <option value="15000">15s</option>
            <option value="30000">30s</option>
            <option value="60000">60s</option>
          </Select>
        </FormGroup>

        <ButtonContainer>
          <Button type="button" onClick={handleReset}>Reset Form</Button>
          <Button
            type="button"
            onClick={() => {
              if (window.confirm('This will reset all settings and clear your balance and holdings. Are you sure?')) {
                clearAllSavedData();
                window.location.reload();
              }
            }}
            style={{ color: '#f44336' }}
          >
            Reset All Data
          </Button>
          <Button type="submit" variant="primary">Apply Settings</Button>
        </ButtonContainer>
      </SettingsForm>
    </SettingsContainer>
  );
};

export default SettingsPanel;
