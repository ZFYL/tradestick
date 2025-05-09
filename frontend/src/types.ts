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
}



// Gamepad types
export interface GamepadState {
  connected: boolean;
  leftTriggerPressed: boolean;  // L2
  rightTriggerPressed: boolean; // R2
  leftBumperPressed: boolean;   // L1
  rightBumperPressed: boolean;  // R1
  leftJoystickY: number;
  rightJoystickY: number;
}
