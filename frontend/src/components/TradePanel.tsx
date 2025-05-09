import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import type { Trade } from '../types';

interface TradePanelProps {
  trades: Trade[];
  currentPrice: number;
  executeTrade: (side: 'buy' | 'sell', size: number) => void;
}

const TradePanelContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100%;
  padding: 1rem;
`;

const TradeForm = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 1rem;
  border-right: 1px solid ${props => props.theme.colors.chart.grid};
`;

const TradeTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: ${props => props.theme.colors.foreground};
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.chart.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.chart.grid};
  border-radius: 4px;
  color: ${props => props.theme.colors.foreground};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ variant: 'buy' | 'sell' }>`
  flex: 1;
  padding: 0.75rem;
  background-color: ${props => props.variant === 'buy' ? props.theme.colors.buy : props.theme.colors.sell};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TradeHistory = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
  overflow: auto;
`;

const TradeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TradeTableHeader = styled.thead`
  position: sticky;
  top: 0;
  background-color: ${props => props.theme.colors.chart.background};
  z-index: 1;

  th {
    padding: 0.5rem;
    text-align: left;
    color: ${props => props.theme.colors.chart.text};
    border-bottom: 1px solid ${props => props.theme.colors.chart.grid};
  }
`;

const TradeTableBody = styled.tbody`
  tr {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  td {
    padding: 0.5rem;
    border-bottom: 1px solid ${props => props.theme.colors.chart.grid};
    color: ${props => props.theme.colors.foreground};
  }
`;

const TradeRow = styled.tr<{ side: 'buy' | 'sell' }>`
  td:nth-child(3) {
    color: ${props => props.side === 'buy' ? props.theme.colors.buy : props.theme.colors.sell};
  }
`;

const ProfitLoss = styled.div<{ value: number }>`
  color: ${props => props.value >= 0 ? props.theme.colors.buy : props.theme.colors.sell};
  font-weight: ${props => Math.abs(props.value) > 0.0001 ? 'bold' : 'normal'};
`;

const TradePanel: React.FC<TradePanelProps> = ({ trades, currentPrice, executeTrade }) => {
  const [tradeSize, setTradeSize] = useState<string>('0.1');

  // Calculate total P&L
  const totalPnL = useMemo(() => {
    return trades.reduce((total, trade) => {
      const pnl = trade.side === 'buy'
        ? (currentPrice - trade.price) * Math.abs(trade.size)
        : (trade.price - currentPrice) * Math.abs(trade.size);
      return total + pnl;
    }, 0);
  }, [trades, currentPrice]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  // Handle trade execution
  const handleTrade = (side: 'buy' | 'sell') => {
    const size = parseFloat(tradeSize);
    if (isNaN(size) || size <= 0) return;

    executeTrade(side, size);
  };

  return (
    <TradePanelContainer>
      <TradeForm>
        <TradeTitle>Manual Trading</TradeTitle>

        <FormGroup>
          <Label htmlFor="tradeSize">Trade Size</Label>
          <Input
            id="tradeSize"
            type="number"
            min="0.01"
            step="0.01"
            value={tradeSize}
            onChange={(e) => setTradeSize(e.target.value)}
          />
        </FormGroup>

        <ButtonGroup>
          <Button
            variant="buy"
            onClick={() => handleTrade('buy')}
            disabled={parseFloat(tradeSize) <= 0}
          >
            BUY
          </Button>
          <Button
            variant="sell"
            onClick={() => handleTrade('sell')}
            disabled={parseFloat(tradeSize) <= 0}
          >
            SELL
          </Button>
        </ButtonGroup>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>Current P&L:</p>
          <ProfitLoss value={totalPnL}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(5)}
          </ProfitLoss>
        </div>
      </TradeForm>

      <TradeHistory>
        <TradeTitle>Trade History</TradeTitle>

        <TradeTable>
          <TradeTableHeader>
            <tr>
              <th>Time</th>
              <th>Price</th>
              <th>Side</th>
              <th>Size</th>
              <th>Value</th>
              <th>P&L</th>
            </tr>
          </TradeTableHeader>
          <TradeTableBody>
            {trades.map((trade) => {
              const pnl = trade.side === 'buy'
                ? (currentPrice - trade.price) * Math.abs(trade.size)
                : (trade.price - currentPrice) * Math.abs(trade.size);

              return (
                <TradeRow key={trade.id} side={trade.side}>
                  <td>{formatTime(trade.timestamp)}</td>
                  <td>{trade.price.toFixed(5)}</td>
                  <td>{trade.side.toUpperCase()}</td>
                  <td>{Math.abs(trade.size).toFixed(2)}</td>
                  <td>{trade.value.toFixed(2)}</td>
                  <td>
                    <ProfitLoss value={pnl}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(5)}
                    </ProfitLoss>
                  </td>
                </TradeRow>
              );
            })}
          </TradeTableBody>
        </TradeTable>
      </TradeHistory>
    </TradePanelContainer>
  );
};

export default TradePanel;
