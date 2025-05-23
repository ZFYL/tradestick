import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time, LineData, IPriceLine } from 'lightweight-charts';
import styled from 'styled-components';
import type { MarketData, Trade, Candle } from '../types';

interface TradingChartProps {
  marketData: MarketData;
  trades: Trade[];
  patternLines?: {
    type: string;
    price: number;
    color: string;
    title: string;
    lineStyle?: LineStyle;
  }[];
}

const ChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
`;

const TradeCounters = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  z-index: 5;
`;

const TradeCounter = styled.div<{ $type: 'buy' | 'sell'; $active: boolean }>`
  background-color: ${props => props.$type === 'buy'
    ? 'rgba(76, 175, 80, ' + (props.$active ? '0.9' : '0.3') + ')'
    : 'rgba(244, 67, 54, ' + (props.$active ? '0.9' : '0.3') + ')'};
  color: white;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  transition: all 0.3s ease;
  transform: scale(${props => props.$active ? 1.2 : 1});
`;

const TradingChart: React.FC<TradingChartProps> = ({ marketData, trades, patternLines = [] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineRef = useRef<{
    buy?: ReturnType<ISeriesApi<any>['createPriceLine']>,
    sell?: ReturnType<ISeriesApi<any>['createPriceLine']>,
    patterns: Record<string, ReturnType<ISeriesApi<any>['createPriceLine']>>
  }>({ patterns: {} });

  // Trade counters
  const [buyCount, setBuyCount] = useState(0);
  const [sellCount, setSellCount] = useState(0);
  const [recentBuy, setRecentBuy] = useState(false);
  const [recentSell, setRecentSell] = useState(false);

  // Track last processed trade to avoid duplicates
  const lastProcessedTradeId = useRef<string | null>(null);

  // Track active pattern lines
  const [activePatternLines, setActivePatternLines] = useState<string[]>([]);

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current) {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: '#1E1E1E' },
          textColor: '#AAAAAA',
        },
        grid: {
          vertLines: { color: '#333333' },
          horzLines: { color: '#333333' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
          borderColor: '#333333',
        },
        rightPriceScale: {
          borderColor: '#333333',
        },
        crosshair: {
          mode: 0,
        },
      });

      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#4CAF50',
        downColor: '#F44336',
        borderVisible: false,
        wickUpColor: '#4CAF50',
        wickDownColor: '#F44336',
      });

      // Create volume series as histogram (vertical bars)
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#2196F3',
        priceScaleId: 'volume', // separate scale
        priceFormat: {
          type: 'volume',
        },
        title: 'Volume',
        base: 0,
      });

      // Configure volume scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8, // Position at the bottom of the chart
          bottom: 0,
        },
        visible: true, // Show the scale
        borderVisible: true,
      });

      // Save references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const { clientWidth, clientHeight } = chartContainerRef.current;
          chartRef.current.applyOptions({
            width: clientWidth,
            height: clientHeight,
          });

          // Fit content after resize
          chartRef.current.timeScale().fitContent();
        }
      };

      // Initial resize
      handleResize();

      // Set up resize observer for more reliable resizing
      const resizeObserver = new ResizeObserver(handleResize);
      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
      }

      // Also listen to window resize events as a fallback
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, []);

  // Update chart with new candles
  useEffect(() => {
    if (candlestickSeriesRef.current && volumeSeriesRef.current && marketData.candles && marketData.candles.length > 0) {
      // Limit the number of candles to improve performance
      const maxCandles = 100; // Only show the last 100 candles
      const limitedCandles = marketData.candles.slice(-maxCandles);

      // Prepare candle data
      const candleData = limitedCandles.map((candle: Candle) => ({
        time: candle.timestamp / 1000 as Time, // Convert to seconds for the chart
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      // Prepare volume data for histogram
      const volumeData = limitedCandles.map((candle: Candle) => {
        // Use different colors for up/down candles
        const color = candle.close >= candle.open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        return {
          time: candle.timestamp / 1000 as Time,
          value: candle.volume,
          color: color
        };
      });

      // Update the series data
      candlestickSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content to view all data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [marketData.candles]);

  // Process trades and update counters
  useEffect(() => {
    if (!trades.length) return;

    // Get the most recent trade
    const latestTrade = trades[0];

    // Skip if we've already processed this trade
    if (latestTrade.id === lastProcessedTradeId.current) return;

    // Update the last processed trade ID
    lastProcessedTradeId.current = latestTrade.id;

    // Update trade counters
    if (latestTrade.side === 'buy') {
      setBuyCount(prev => prev + 1);

      // Show animation
      setRecentBuy(true);
      setTimeout(() => setRecentBuy(false), 500);

      // Update price line
      if (priceLineRef.current.buy && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(priceLineRef.current.buy);
      }

      if (candlestickSeriesRef.current) {
        priceLineRef.current.buy = candlestickSeriesRef.current.createPriceLine({
          price: latestTrade.price,
          color: '#4CAF50',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Last Buy',
        });
      }
    } else {
      setSellCount(prev => prev + 1);

      // Show animation
      setRecentSell(true);
      setTimeout(() => setRecentSell(false), 500);

      // Update price line
      if (priceLineRef.current.sell && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(priceLineRef.current.sell);
      }

      if (candlestickSeriesRef.current) {
        priceLineRef.current.sell = candlestickSeriesRef.current.createPriceLine({
          price: latestTrade.price,
          color: '#F44336',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Last Sell',
        });
      }
    }
  }, [trades]);

  // Add pattern lines to the chart
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current) return;

    // Remove old pattern lines that are no longer in the new list
    Object.keys(priceLineRef.current.patterns).forEach(id => {
      if (!patternLines.some(line => `${line.type}-${line.price}` === id)) {
        if (priceLineRef.current.patterns[id] && candlestickSeriesRef.current) {
          candlestickSeriesRef.current.removePriceLine(priceLineRef.current.patterns[id]);
          delete priceLineRef.current.patterns[id];
        }
      }
    });

    // Add new pattern lines
    patternLines.forEach(line => {
      const lineId = `${line.type}-${line.price}`;

      // Skip if this line already exists
      if (priceLineRef.current.patterns[lineId]) return;

      // Create the price line
      if (candlestickSeriesRef.current) {
        priceLineRef.current.patterns[lineId] = candlestickSeriesRef.current.createPriceLine({
          price: line.price,
          color: line.color,
          lineWidth: 1,
          lineStyle: line.lineStyle || 2, // Default to dashed
          axisLabelVisible: true,
          title: line.title,
        });
      }
    });

    // Update active pattern lines for animation
    setActivePatternLines(patternLines.map(line => `${line.type}-${line.price}`));
  }, [patternLines]);

  return (
    <ChartWrapper ref={chartContainerRef}>
      <TradeCounters>
        <TradeCounter $type="buy" $active={recentBuy}>
          Buy: {buyCount}
        </TradeCounter>
        <TradeCounter $type="sell" $active={recentSell}>
          Sell: {sellCount}
        </TradeCounter>
      </TradeCounters>
    </ChartWrapper>
  );
};

export default TradingChart;
