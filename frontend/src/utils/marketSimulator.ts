import type { MarketData, OrderBook, Candle, Trade } from '../types';

// Market pattern types
export type MarketPatternType = 
  | 'random_walk'
  | 'uptrend'
  | 'downtrend'
  | 'volatile'
  | 'sideways'
  | 'breakout_up'
  | 'breakout_down'
  | 'head_and_shoulders'
  | 'double_top'
  | 'double_bottom';

export interface SimulatorConfig {
  initialPrice: number;
  volatility: number;
  spread: number;
  updateInterval: number;
  orderBookLevels: number;
  patternType?: MarketPatternType;
  patternStrength?: number; // 0-1
  patternDuration?: number; // in ms
}

export class MarketSimulator {
  private currentPrice: number;
  private lastUpdateTime: number;
  private candles: Candle[];
  private trades: Trade[];
  private config: SimulatorConfig;
  private patternStartTime: number;
  private patternProgress: number; // 0-1
  private patternBasePrice: number;

  constructor(config: SimulatorConfig) {
    this.config = config;
    this.currentPrice = config.initialPrice;
    this.lastUpdateTime = Date.now();
    this.candles = [];
    this.trades = [];
    this.patternStartTime = 0;
    this.patternProgress = 0;
    this.patternBasePrice = config.initialPrice;
    
    // Initialize with a first candle
    this.updateCandle(this.lastUpdateTime);
  }

  // Generate next market data update
  public generateMarketData(): MarketData {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Update price based on selected pattern
    this.updatePrice(deltaTime);

    // Calculate bid and ask prices
    const halfSpread = this.config.spread / 2;
    const bidPrice = this.currentPrice - halfSpread;
    const askPrice = this.currentPrice + halfSpread;

    // Update candle
    this.updateCandle(now);

    // Generate order book
    const orderBook = this.generateOrderBook(bidPrice, askPrice);

    return {
      timestamp: now,
      price: this.currentPrice,
      bid: bidPrice,
      ask: askPrice,
      orderBook,
      trades: [...this.trades],
      candles: [...this.candles]
    };
  }

  // Update configuration
  public updateConfig(config: Partial<SimulatorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If pattern type changed, reset pattern progress
    if (config.patternType) {
      this.patternStartTime = Date.now();
      this.patternProgress = 0;
      this.patternBasePrice = this.currentPrice;
    }
  }

  // Add a trade
  public addTrade(side: 'buy' | 'sell', size: number, price: number): void {
    const trade: Trade = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      side,
      size,
      price,
      value: Math.abs(size) * price
    };

    this.trades.unshift(trade);
    
    // Keep only the last 50 trades
    if (this.trades.length > 50) {
      this.trades = this.trades.slice(0, 50);
    }
  }

  // Private methods
  private updatePrice(deltaTime: number): void {
    // Base volatility component (random walk)
    const volatility = this.config.volatility;
    const randomComponent = this.normalRandom() * Math.sqrt(deltaTime) * volatility;
    
    // Default drift (slight upward bias)
    let drift = 0.0001;
    
    // If a pattern is active, apply pattern-specific price movement
    if (this.config.patternType) {
      const now = Date.now();
      const patternDuration = this.config.patternDuration || 30000; // Default 30 seconds
      
      // Calculate pattern progress (0 to 1)
      this.patternProgress = Math.min(1, (now - this.patternStartTime) / patternDuration);
      
      // Apply pattern-specific price movement
      drift += this.getPatternDrift(deltaTime);
    }
    
    // Update price with drift and random component
    const priceChange = drift * deltaTime + randomComponent;
    this.currentPrice *= Math.exp(priceChange);
    
    // Ensure price doesn't go too low
    this.currentPrice = Math.max(this.currentPrice, 0.00001);
  }

  private getPatternDrift(deltaTime: number): number {
    const strength = this.config.patternStrength || 0.5;
    const adjustedStrength = strength * 0.01; // Scale down for reasonable movements
    
    switch (this.config.patternType) {
      case 'uptrend':
        return adjustedStrength;
        
      case 'downtrend':
        return -adjustedStrength;
        
      case 'volatile':
        return this.normalRandom() * adjustedStrength * 3;
        
      case 'sideways':
        // Mean-reverting around pattern base price
        return (this.patternBasePrice - this.currentPrice) * 0.01 * adjustedStrength;
        
      case 'breakout_up':
        // Sideways then sudden upward movement
        if (this.patternProgress < 0.7) {
          return (this.patternBasePrice - this.currentPrice) * 0.01; // Mean-reversion
        } else {
          return adjustedStrength * 3; // Strong upward movement
        }
        
      case 'breakout_down':
        // Sideways then sudden downward movement
        if (this.patternProgress < 0.7) {
          return (this.patternBasePrice - this.currentPrice) * 0.01; // Mean-reversion
        } else {
          return -adjustedStrength * 3; // Strong downward movement
        }
        
      case 'head_and_shoulders':
        // Three peaks with middle one higher
        if (this.patternProgress < 0.25) {
          return adjustedStrength; // First shoulder up
        } else if (this.patternProgress < 0.3) {
          return -adjustedStrength; // Down from first shoulder
        } else if (this.patternProgress < 0.5) {
          return adjustedStrength * 1.5; // Head up (higher)
        } else if (this.patternProgress < 0.55) {
          return -adjustedStrength * 1.5; // Down from head
        } else if (this.patternProgress < 0.75) {
          return adjustedStrength; // Second shoulder up
        } else {
          return -adjustedStrength * 2; // Final breakdown
        }
        
      case 'double_top':
        // Two equal peaks with a breakdown
        if (this.patternProgress < 0.3) {
          return adjustedStrength; // First peak up
        } else if (this.patternProgress < 0.4) {
          return -adjustedStrength; // Down from first peak
        } else if (this.patternProgress < 0.7) {
          return adjustedStrength; // Second peak up
        } else {
          return -adjustedStrength * 2; // Final breakdown
        }
        
      case 'double_bottom':
        // Two equal troughs with a breakout
        if (this.patternProgress < 0.3) {
          return -adjustedStrength; // First trough down
        } else if (this.patternProgress < 0.4) {
          return adjustedStrength; // Up from first trough
        } else if (this.patternProgress < 0.7) {
          return -adjustedStrength; // Second trough down
        } else {
          return adjustedStrength * 2; // Final breakout
        }
        
      default:
        return 0; // Random walk (no drift)
    }
  }

  private updateCandle(timestamp: number): void {
    // Determine candle interval (1 second default)
    const interval = 1000;
    const intervalStart = Math.floor(timestamp / interval) * interval;
    
    // Check if we need to create a new candle
    if (this.candles.length === 0 || this.candles[this.candles.length - 1].timestamp < intervalStart) {
      // Create a new candle
      const newCandle: Candle = {
        timestamp: intervalStart,
        open: this.currentPrice,
        high: this.currentPrice,
        low: this.currentPrice,
        close: this.currentPrice,
        volume: Math.floor(Math.random() * 100) // Random initial volume
      };
      
      this.candles.push(newCandle);
      
      // Limit the number of candles to 500
      if (this.candles.length > 500) {
        this.candles = this.candles.slice(-500);
      }
    } else {
      // Update the current candle
      const currentCandle = this.candles[this.candles.length - 1];
      currentCandle.high = Math.max(currentCandle.high, this.currentPrice);
      currentCandle.low = Math.min(currentCandle.low, this.currentPrice);
      currentCandle.close = this.currentPrice;
      currentCandle.volume += Math.floor(Math.random() * 10); // Increment volume
    }
  }

  private generateOrderBook(bidPrice: number, askPrice: number): OrderBook {
    const bids = [];
    const asks = [];
    
    // Generate bid levels (buy orders)
    for (let i = 0; i < this.config.orderBookLevels; i++) {
      const price = bidPrice * (1 - 0.0001 * (i + 1));
      const volume = Math.floor(Math.random() * 100) * (this.config.orderBookLevels - i);
      bids.push({ price, volume });
    }
    
    // Generate ask levels (sell orders)
    for (let i = 0; i < this.config.orderBookLevels; i++) {
      const price = askPrice * (1 + 0.0001 * (i + 1));
      const volume = Math.floor(Math.random() * 100) * (this.config.orderBookLevels - i);
      asks.push({ price, volume });
    }
    
    return { bids, asks };
  }

  // Standard normal random number generator (Box-Muller transform)
  private normalRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

// Create market pattern presets
export const MARKET_PATTERN_PRESETS: Record<string, { 
  patternType: MarketPatternType, 
  volatility: number,
  patternStrength: number,
  patternDuration: number,
  description: string
}> = {
  UPTREND: {
    patternType: 'uptrend',
    volatility: 0.0005,
    patternStrength: 0.6,
    patternDuration: 60000, // 1 minute
    description: 'Steady upward price movement'
  },
  DOWNTREND: {
    patternType: 'downtrend',
    volatility: 0.0005,
    patternStrength: 0.6,
    patternDuration: 60000, // 1 minute
    description: 'Steady downward price movement'
  },
  VOLATILE: {
    patternType: 'volatile',
    volatility: 0.002,
    patternStrength: 0.8,
    patternDuration: 45000, // 45 seconds
    description: 'High volatility with large price swings'
  },
  SIDEWAYS: {
    patternType: 'sideways',
    volatility: 0.0003,
    patternStrength: 0.7,
    patternDuration: 60000, // 1 minute
    description: 'Sideways consolidation with low volatility'
  },
  BREAKOUT_UP: {
    patternType: 'breakout_up',
    volatility: 0.0008,
    patternStrength: 0.9,
    patternDuration: 45000, // 45 seconds
    description: 'Consolidation followed by upward breakout'
  },
  BREAKOUT_DOWN: {
    patternType: 'breakout_down',
    volatility: 0.0008,
    patternStrength: 0.9,
    patternDuration: 45000, // 45 seconds
    description: 'Consolidation followed by downward breakdown'
  },
  HEAD_AND_SHOULDERS: {
    patternType: 'head_and_shoulders',
    volatility: 0.0006,
    patternStrength: 0.8,
    patternDuration: 90000, // 1.5 minutes
    description: 'Classic head and shoulders reversal pattern'
  },
  DOUBLE_TOP: {
    patternType: 'double_top',
    volatility: 0.0006,
    patternStrength: 0.8,
    patternDuration: 75000, // 1.25 minutes
    description: 'Double top reversal pattern'
  },
  DOUBLE_BOTTOM: {
    patternType: 'double_bottom',
    volatility: 0.0006,
    patternStrength: 0.8,
    patternDuration: 75000, // 1.25 minutes
    description: 'Double bottom reversal pattern'
  }
};
