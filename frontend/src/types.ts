// Market data types
export interface OrderBookLevel {
  price: number;
  volume: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  value: number;
}

export interface MarketData {
  timestamp: number;
  price: number;
  bid: number;
  ask: number;
  orderBook: OrderBook;
  trades: Trade[];
  candles: Candle[];
}

// Configuration types
export interface Config {
  initialPrice: number;
  volatility: number;
  spread: number;
  updateInterval: number;
  orderBookLevels: number;
  maxTradeSize: number;
  maxTradesPerSecond: number;
  tradeSizeStep: number;
  initialBalance: number;
  candleInterval: number; // in milliseconds (10, 100, 1000, 5000)
  pnlWindowTime: number; // in milliseconds (5000, 15000, 30000, 60000)
  // Price change threshold sliders (percent, e.g. 3 for 3%)
  priceChangeThreshold15s: number; // 0-20, default 3
  priceChangeThreshold1m: number;  // 1-30, default 5
  priceChangeThreshold15m: number; // 5-45, default 5
  priceChangeThreshold1h: number;  // 5-100, default 5
  marketDataSource: 'simulator' | 'binance' | 'else';
  symbol: string; // Trading symbol (e.g., 'btcusdt', 'ethusdt')
  // Pattern simulation options
  patternType?: 'random_walk' | 'uptrend' | 'downtrend' | 'volatile' | 'sideways' |
               'breakout_up' | 'breakout_down' | 'head_and_shoulders' | 'double_top' | 'double_bottom';
  patternStrength?: number; // 0-1, controls how strong the pattern is
  patternDuration?: number; // in milliseconds, how long the pattern lasts
}



// Gamepad types
export interface GamepadState {
  connected: boolean;
  leftTriggerPressed: boolean;  // L2
  rightTriggerPressed: boolean; // R2
  leftBumperPressed: boolean;   // L1
  rightBumperPressed: boolean;  // R1
  rightJoystickPressed: boolean; // R3
  leftJoystickY: number;
  rightJoystickY: number;
}
