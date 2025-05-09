import React from 'react';
import styled from 'styled-components';
import type { Trade } from '../types';

interface TradeBookProps {
  trades: Trade[];
  maxTrades?: number;
}

const TradeBookContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.4rem;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  margin-bottom: 0.25rem;
`;

const TradeBookTitle = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => props.theme.colors.foreground};
  border-bottom: 1px solid ${props => props.theme.colors.chart.grid};
  padding-bottom: 0.2rem;
`;

const TradeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  max-height: 120px;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
`;

const TradeItem = styled.div<{ side: 'buy' | 'sell' }>`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.3rem;
  padding: 0.1rem 0.3rem;
  border-radius: 2px;
  background-color: ${props =>
    props.side === 'buy'
      ? `rgba(76, 175, 80, 0.05)`
      : `rgba(244, 67, 54, 0.05)`
  };
  font-size: 0.65rem;
  line-height: 1.2;
`;

const TradeTime = styled.div`
  color: ${props => props.theme.colors.chart.text};
  font-size: 0.6rem;
`;

const TradeSide = styled.div<{ side: 'buy' | 'sell' }>`
  font-weight: 600;
  color: ${props =>
    props.side === 'buy'
      ? props.theme.colors.buy
      : props.theme.colors.sell
  };
  font-size: 0.65rem;
`;

const TradeDetails = styled.div`
  text-align: right;
  color: ${props => props.theme.colors.foreground};
  font-size: 0.65rem;
  letter-spacing: -0.2px;
`;

const TradeBook: React.FC<TradeBookProps> = ({ trades, maxTrades = 10 }) => {
  // Format timestamp - more compact for trading display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/:/g, '');
  };

  // Get the most recent trades up to maxTrades
  const recentTrades = trades.slice(0, maxTrades);

  return (
    <TradeBookContainer>
      <TradeBookTitle>Recent Trades</TradeBookTitle>
      <TradeList>
        {recentTrades.map(trade => (
          <TradeItem key={trade.id} side={trade.side}>
            <TradeTime>{formatTime(trade.timestamp)}</TradeTime>
            <TradeSide side={trade.side}>
              {trade.side === 'buy' ? 'B' : 'S'} {Math.abs(trade.size).toFixed(2)}
            </TradeSide>
            <TradeDetails>
              ${trade.price.toFixed(5)}
            </TradeDetails>
          </TradeItem>
        ))}
        {recentTrades.length === 0 && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: '#888' }}>
            No trades yet
          </div>
        )}
      </TradeList>
    </TradeBookContainer>
  );
};

export default TradeBook;
