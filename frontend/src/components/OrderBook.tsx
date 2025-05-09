import React from 'react';
import styled from 'styled-components';
import type { OrderBook as OrderBookType } from '../types';

interface OrderBookProps {
  orderBook: OrderBookType;
}

const OrderBookContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.4rem;
  font-family: 'Roboto Mono', monospace;
`;

const OrderBookTitle = styled.h2`
  margin: 0 0 0.25rem 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => props.theme.colors.foreground};
  border-bottom: 1px solid ${props => props.theme.colors.chart.grid};
  padding-bottom: 0.2rem;
`;

const OrderBookTable = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`;

const OrderBookHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.2rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.chart.grid};
  font-weight: 600;
  color: ${props => props.theme.colors.chart.text};
  font-size: 0.6rem;
  opacity: 0.8;
`;

const OrderBookSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.25rem;
`;

const OrderBookRow = styled.div<{ $isBid: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.1rem 0;
  font-size: 0.65rem;
  color: ${props => props.$isBid ? props.theme.colors.buy : props.theme.colors.sell};
  position: relative;
  line-height: 1.2;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const OrderBookVolume = styled.div<{ $isBid: boolean, $volumePercentage: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: ${props => props.$volumePercentage}%;
  background-color: ${props => props.$isBid ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)'};
  z-index: 0;
`;

const OrderBookCell = styled.div`
  z-index: 1;
  text-align: right;
  letter-spacing: -0.2px;

  &:first-child {
    text-align: left;
  }
`;

const Spread = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.15rem 0;
  font-size: 0.6rem;
  color: ${props => props.theme.colors.chart.text};
  border-top: 1px dashed ${props => props.theme.colors.chart.grid};
  border-bottom: 1px dashed ${props => props.theme.colors.chart.grid};
  margin: 0.15rem 0;
  opacity: 0.8;
`;

const OrderBook: React.FC<OrderBookProps> = ({ orderBook }) => {
  // Calculate max volume for visualization
  const maxVolume = Math.max(
    ...orderBook.bids.map(level => level.volume),
    ...orderBook.asks.map(level => level.volume)
  );

  // Format price with 5 decimal places - more compact for trading display
  const formatPrice = (price: number) => price.toFixed(5);

  // Format volume with abbreviated numbers for compact display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    } else {
      return volume.toFixed(1);
    }
  };

  // Calculate spread
  const spread = orderBook.asks[0]?.price - orderBook.bids[0]?.price;
  const spreadPips = spread * 10000; // Convert to pips (4 decimal places)

  return (
    <OrderBookContainer>
      <OrderBookTitle>Order Book</OrderBookTitle>

      <OrderBookTable>
        <OrderBookHeader>
          <OrderBookCell>Price</OrderBookCell>
          <OrderBookCell>Size</OrderBookCell>
          <OrderBookCell>Total</OrderBookCell>
        </OrderBookHeader>

        <OrderBookSection>
          {/* Asks (Sell orders) - displayed in reverse order */}
          {[...orderBook.asks].reverse().map((level, index) => (
            <OrderBookRow key={`ask-${index}`} $isBid={false}>
              <OrderBookVolume
                $isBid={false}
                $volumePercentage={(level.volume / maxVolume) * 100}
              />
              <OrderBookCell>{formatPrice(level.price)}</OrderBookCell>
              <OrderBookCell>{formatVolume(level.volume)}</OrderBookCell>
              <OrderBookCell>{formatVolume(level.volume * level.price)}</OrderBookCell>
            </OrderBookRow>
          ))}
        </OrderBookSection>

        <Spread>
          SPR: {formatPrice(spread)} ({spreadPips.toFixed(1)}p)
        </Spread>

        <OrderBookSection>
          {/* Bids (Buy orders) */}
          {orderBook.bids.map((level, index) => (
            <OrderBookRow key={`bid-${index}`} $isBid={true}>
              <OrderBookVolume
                $isBid={true}
                $volumePercentage={(level.volume / maxVolume) * 100}
              />
              <OrderBookCell>{formatPrice(level.price)}</OrderBookCell>
              <OrderBookCell>{formatVolume(level.volume)}</OrderBookCell>
              <OrderBookCell>{formatVolume(level.volume * level.price)}</OrderBookCell>
            </OrderBookRow>
          ))}
        </OrderBookSection>
      </OrderBookTable>
    </OrderBookContainer>
  );
};

export default OrderBook;
