import React, { useState, useEffect } from 'react';
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
    volatility: 0.01,
    spread: 0.0005,
    updateInterval: 10,
    maxTradesPerSecond: 10
  },
  CRAZY: {
    volatility: 0.05,
    spread: 0.001,
    updateInterval: 5,
    maxTradesPerSecond: 20
  },
  EXTREME: {
    volatility: 0.15,
    spread: 0.002,
    updateInterval: 3,
    maxTradesPerSecond: 30
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

const PresetButton = styled.button<{ $preset: 'CHILL' | 'ON_FIRE' | 'CRAZY' | 'EXTREME' }>`
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
      case 'EXTREME':
        return 'rgba(156, 39, 176, 0.2)';
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
      case 'EXTREME':
        return '#9C27B0';
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
      case 'EXTREME':
        return '#9C27B0';
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
        case 'EXTREME':
          return 'rgba(156, 39, 176, 0.4)';
      }
    }};
  }
`;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, updateConfig }) => {
  const [formValues, setFormValues] = useState<Config>({ ...config });

  // --- Amplitude (volatility guarantee) settings state ---
  const [amplitude, setAmplitude] = useState({
    priceChangeThreshold15s: 0.2,
    priceChangeThreshold1m: 0.5,
    priceChangeThreshold15m: 1.5,
    priceChangeThreshold1h: 3.0,
  });
  const [amplitudeLoading, setAmplitudeLoading] = useState(true);
  const [amplitudeSaving, setAmplitudeSaving] = useState(false);
  const [amplitudeError, setAmplitudeError] = useState<string | null>(null);

  // Fetch amplitude settings from backend on mount
  useEffect(() => {
    setAmplitudeLoading(true);
    setAmplitudeError(null);
    fetch('/api/amplitude-settings')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch amplitude settings');
        // API contract: returns { priceChangeThreshold15s, priceChangeThreshold1m, ... }
        const data = await res.json();
        setAmplitude({
          priceChangeThreshold15s: data.priceChangeThreshold15s ?? 0.2,
          priceChangeThreshold1m: data.priceChangeThreshold1m ?? 0.5,
          priceChangeThreshold15m: data.priceChangeThreshold15m ?? 1.5,
          priceChangeThreshold1h: data.priceChangeThreshold1h ?? 3.0,
        });
        setAmplitudeLoading(false);
      })
      .catch((err) => {
        setAmplitudeError('Could not load amplitude settings.');
        setAmplitudeLoading(false);
      });
  }, []);

  // Handler for amplitude slider changes
  const handleAmplitudeChange = (name: keyof typeof amplitude, value: number) => {
    // Enforce logical lower boundaries (same as local logic)
    let updated = { ...amplitude, [name]: value };
    if (name === 'priceChangeThreshold15s') {
      if (updated.priceChangeThreshold1m < value) updated.priceChangeThreshold1m = value;
      if (updated.priceChangeThreshold15m < updated.priceChangeThreshold1m) updated.priceChangeThreshold15m = updated.priceChangeThreshold1m;
      if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
    }
    if (name === 'priceChangeThreshold1m') {
      if (updated.priceChangeThreshold1m < updated.priceChangeThreshold15s) updated.priceChangeThreshold1m = updated.priceChangeThreshold15s;
      if (updated.priceChangeThreshold15m < value) updated.priceChangeThreshold15m = value;
      if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
    }
    if (name === 'priceChangeThreshold15m') {
      if (updated.priceChangeThreshold15m < updated.priceChangeThreshold1m) updated.priceChangeThreshold15m = updated.priceChangeThreshold1m;
      if (updated.priceChangeThreshold1h < value) updated.priceChangeThreshold1h = value;
    }
    if (name === 'priceChangeThreshold1h') {
      if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
    }

    setAmplitude(updated);
    setAmplitudeSaving(true);
    setAmplitudeError(null);

    // POST updated amplitude to backend
    // Only send the changed value (API accepts any/all keys)
    fetch('/api/amplitude-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [name]: updated[name] }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to save amplitude setting');
        await res.json();
        setAmplitudeSaving(false);
      })
      .catch((err) => {
        setAmplitudeError('Could not save amplitude setting.');
        setAmplitudeSaving(false);
      });
  };

  // --- End amplitude logic ---

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
  
    // Special logic for price change threshold sliders to enforce logical lower boundaries
    setFormValues(prev => {
      let updated = { ...prev, [name]: parsedValue };
      // Only apply logic for the threshold sliders
      const numValue = parsedValue as number;
  
      if (name === 'priceChangeThreshold15s') {
        if (updated.priceChangeThreshold1m < numValue) updated.priceChangeThreshold1m = numValue;
        if (updated.priceChangeThreshold15m < updated.priceChangeThreshold1m) updated.priceChangeThreshold15m = updated.priceChangeThreshold1m;
        if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
      }
      if (name === 'priceChangeThreshold1m') {
        if (updated.priceChangeThreshold1m < updated.priceChangeThreshold15s) updated.priceChangeThreshold1m = updated.priceChangeThreshold15s;
        if (updated.priceChangeThreshold15m < numValue) updated.priceChangeThreshold15m = numValue;
        if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
      }
      if (name === 'priceChangeThreshold15m') {
        if (updated.priceChangeThreshold15m < updated.priceChangeThreshold1m) updated.priceChangeThreshold15m = updated.priceChangeThreshold1m;
        if (updated.priceChangeThreshold1h < numValue) updated.priceChangeThreshold1h = numValue;
      }
      if (name === 'priceChangeThreshold1h') {
        if (updated.priceChangeThreshold1h < updated.priceChangeThreshold15m) updated.priceChangeThreshold1h = updated.priceChangeThreshold15m;
      }
  
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formValues);
  };

  const handleReset = () => {
    setFormValues({ ...config });
  };

  const applyPreset = (preset: 'CHILL' | 'ON_FIRE' | 'CRAZY' | 'EXTREME') => {
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
        <PresetButton
          type="button"
          $preset="EXTREME"
          onClick={() => applyPreset('EXTREME')}
        >
          Extreme Market
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
              max="0.2"
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

        {/* Amplitude (volatility guarantee) sliders - connected to backend */}
        <FormGroup>
          <Label htmlFor="priceChangeThreshold15s">
            Amplitude Guarantee (15s)
          </Label>
          <RangeContainer>
            <Input
              id="priceChangeThreshold15s"
              name="priceChangeThreshold15s"
              type="range"
              min={0}
              max={20}
              step={0.1}
              value={amplitude.priceChangeThreshold15s}
              onChange={e =>
                handleAmplitudeChange('priceChangeThreshold15s', parseFloat(e.target.value))
              }
              disabled={amplitudeLoading || amplitudeSaving}
            />
            <RangeValue>
              {amplitude.priceChangeThreshold15s.toFixed(1)}%
            </RangeValue>
          </RangeContainer>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="priceChangeThreshold1m">
            Amplitude Guarantee (1m)
          </Label>
          <RangeContainer>
            <Input
              id="priceChangeThreshold1m"
              name="priceChangeThreshold1m"
              type="range"
              min={1}
              max={30}
              step={0.1}
              value={amplitude.priceChangeThreshold1m}
              onChange={e =>
                handleAmplitudeChange('priceChangeThreshold1m', parseFloat(e.target.value))
              }
              disabled={amplitudeLoading || amplitudeSaving}
            />
            <RangeValue>
              {amplitude.priceChangeThreshold1m.toFixed(1)}%
            </RangeValue>
          </RangeContainer>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="priceChangeThreshold15m">
            Amplitude Guarantee (15m)
          </Label>
          <RangeContainer>
            <Input
              id="priceChangeThreshold15m"
              name="priceChangeThreshold15m"
              type="range"
              min={5}
              max={45}
              step={0.1}
              value={amplitude.priceChangeThreshold15m}
              onChange={e =>
                handleAmplitudeChange('priceChangeThreshold15m', parseFloat(e.target.value))
              }
              disabled={amplitudeLoading || amplitudeSaving}
            />
            <RangeValue>
              {amplitude.priceChangeThreshold15m.toFixed(1)}%
            </RangeValue>
          </RangeContainer>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="priceChangeThreshold1h">
            Amplitude Guarantee (1h)
          </Label>
          <RangeContainer>
            <Input
              id="priceChangeThreshold1h"
              name="priceChangeThreshold1h"
              type="range"
              min={5}
              max={100}
              step={0.1}
              value={amplitude.priceChangeThreshold1h}
              onChange={e =>
                handleAmplitudeChange('priceChangeThreshold1h', parseFloat(e.target.value))
              }
              disabled={amplitudeLoading || amplitudeSaving}
            />
            <RangeValue>
              {amplitude.priceChangeThreshold1h.toFixed(1)}%
            </RangeValue>
          </RangeContainer>
        </FormGroup>
        {/* Amplitude API feedback */}
        {(amplitudeLoading || amplitudeSaving || amplitudeError) && (
          <div style={{ gridColumn: '1 / -1', marginBottom: '1rem', color: amplitudeError ? '#f44336' : '#888', textAlign: 'center' }}>
            {amplitudeLoading && 'Loading amplitude settings...'}
            {amplitudeSaving && 'Saving...'}
            {amplitudeError && amplitudeError}
          </div>
        )}
        {/* End amplitude sliders */}

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
