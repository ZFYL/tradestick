/**
 * Market Simulator for Forex Trading
 * Generates synthetic market data using Geometric Brownian Motion
 */
class MarketSimulator {
  constructor(config) {
    // Set default candle interval to 1000ms (1 second) if not provided
    this.config = {
      ...config,
      candleInterval: config.candleInterval || 1000
    };
    this.currentPrice = config.initialPrice;
    this.lastUpdateTime = Date.now();
    this.intervalId = null;
    this.trades = [];
    this.candles = [];
    this.lastCandleTime = 0;
    this.currentCandle = null;
    this.lastTradeTime = 0;

    // Trackers for distributed amplitude enforcement
    // Each key: { startTime, startPrice, minPrice, maxPrice }
    this.priceChangeTrackers = {
      '15s': { startTime: Date.now(), startPrice: this.currentPrice, minPrice: this.currentPrice, maxPrice: this.currentPrice },
      '1m': { startTime: Date.now(), startPrice: this.currentPrice, minPrice: this.currentPrice, maxPrice: this.currentPrice },
      '15m': { startTime: Date.now(), startPrice: this.currentPrice, minPrice: this.currentPrice, maxPrice: this.currentPrice },
      '1h': { startTime: Date.now(), startPrice: this.currentPrice, minPrice: this.currentPrice, maxPrice: this.currentPrice }
    };

    // Store candles for different intervals
    this.candlesByInterval = {
      10: [],    // 10ms candles
      100: [],   // 100ms candles
      1000: [],  // 1s candles
      5000: []   // 5s candles
    };

    // Current candles for each interval
    this.currentCandles = {
      10: null,
      100: null,
      1000: null,
      5000: null
    };

    // Last candle time for each interval
    this.lastCandleTimes = {
      10: 0,
      100: 0,
      1000: 0,
      5000: 0
    };
  }

  /**
   * Start the market simulation
   * @param {Function} callback - Function to call with market data on each update
   */
  start(callback) {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      const marketData = this.generateMarketData();
      this.updateCandles(marketData);
      callback(marketData);
    }, this.config.updateInterval);
  }

  /**
   * Stop the market simulation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generate market data using Geometric Brownian Motion
   * @returns {Object} Market data including price, bid, ask, and order book
   */
  generateMarketData() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // --- Distributed amplitude enforcement logic ---
    // For each timeframe, track min/max and dynamically adjust volatility if needed
    // This avoids single-candle jumps and distributes volatility over the interval.
    // The process:
    //   - Track min/max price within the interval.
    //   - If amplitude is lagging as the interval progresses, increase volatility for the remaining candles.
    //   - Never force a single-candle correction.
    //   - Reset tracker at the end of the interval.
    const timeframes = [
      { key: '15s', ms: 15000, configKey: 'priceChangeThreshold15s' },
      { key: '1m', ms: 60000, configKey: 'priceChangeThreshold1m' },
      { key: '15m', ms: 900000, configKey: 'priceChangeThreshold15m' },
      { key: '1h', ms: 3600000, configKey: 'priceChangeThreshold1h' }
    ];

    // Track the highest and lowest price seen in each interval
    for (const tf of timeframes) {
      const tracker = this.priceChangeTrackers[tf.key];
      tracker.minPrice = Math.min(tracker.minPrice, this.currentPrice);
      tracker.maxPrice = Math.max(tracker.maxPrice, this.currentPrice);

      // If interval elapsed, reset tracker
      if (now - tracker.startTime >= tf.ms) {
        this.priceChangeTrackers[tf.key] = {
          startTime: now,
          startPrice: this.currentPrice,
          minPrice: this.currentPrice,
          maxPrice: this.currentPrice
        };
      }
    }

    // Calculate the required volatility multiplier for this tick
    // If any interval is lagging in amplitude, boost volatility for this tick
    let volatilityMultiplier = 1.0;
    for (const tf of timeframes) {
      const tracker = this.priceChangeTrackers[tf.key];
      const thresholdPct = this.config[tf.configKey] || 0;
      if (thresholdPct === 0) continue;
      const amplitude = (tracker.maxPrice - tracker.minPrice) / tracker.startPrice * 100;
      const elapsed = now - tracker.startTime;
      const progress = Math.min(1, elapsed / tf.ms);

      // If we're past 60% of the interval and amplitude is lagging, boost volatility
      if (progress > 0.6 && amplitude < thresholdPct) {
        // The closer to the end, the more we boost
        const boost = 1 + ((thresholdPct - amplitude) / thresholdPct) * (progress - 0.6) * 5;
        volatilityMultiplier = Math.max(volatilityMultiplier, boost);
      }
    }

    // Generate new price using Geometric Brownian Motion with reduced mean reversion
    // dS = μS dt + σS dW, where μ is a small drift to allow for more extreme movements
    // Higher volatility settings will now allow for more extreme price movements
    // --- Stochastic price simulation with distributed amplitude enforcement ---
    // The volatility is dynamically boosted if amplitude is lagging in any interval.
    // This ensures amplitude guarantees are met in a natural, distributed way.
    const drift = this.config.volatility > 0.05 ? 0.01 * this.normalRandom() : 0; // Add small random drift for high volatility
    const volatility = this.config.volatility;

    // Use a more extreme random component for higher volatility settings
    const randomFactor = this.config.volatility > 0.1 ? 1.5 : 1.0;
    const randomComponent = this.normalRandom() * Math.sqrt(deltaTime) * randomFactor * volatilityMultiplier;

    const priceChange = drift * deltaTime + volatility * randomComponent;

    // Update price with less constraint to allow for more extreme movements
    this.currentPrice *= Math.exp(priceChange);

    // Calculate bid and ask prices
    const halfSpread = this.config.spread / 2;
    const bidPrice = this.currentPrice - halfSpread;
    const askPrice = this.currentPrice + halfSpread;

    // Generate order book
    const orderBook = this.generateOrderBook(bidPrice, askPrice);

    // Limit the number of candles sent to the frontend to improve performance
    const maxCandlesToSend = 150; // Only send the most recent 150 candles
    const limitedCandles = this.candles.length > maxCandlesToSend
      ? this.candles.slice(-maxCandlesToSend)
      : [...this.candles];

    // Only send the most recent trades
    const recentTrades = this.trades.slice(-20);

    return {
      timestamp: now,
      price: this.currentPrice,
      bid: bidPrice,
      ask: askPrice,
      orderBook,
      trades: recentTrades,
      candles: limitedCandles
    };
  }

  /**
   * Generate synthetic order book
   * @param {number} bidPrice - Current bid price
   * @param {number} askPrice - Current ask price
   * @returns {Object} Order book with bids and asks
   */
  generateOrderBook(bidPrice, askPrice) {
    const bids = [];
    const asks = [];

    // Generate bid levels
    for (let i = 0; i < this.config.orderBookLevels; i++) {
      const price = bidPrice - (i * this.config.spread * 0.2);
      const volume = Math.floor(Math.random() * 10 + 1) * 100000; // Random volume between 100K and 1M
      bids.push({ price, volume });
    }

    // Generate ask levels
    for (let i = 0; i < this.config.orderBookLevels; i++) {
      const price = askPrice + (i * this.config.spread * 0.2);
      const volume = Math.floor(Math.random() * 10 + 1) * 100000; // Random volume between 100K and 1M
      asks.push({ price, volume });
    }

    return { bids, asks };
  }

  /**
   * Update candles with new market data
   * @param {Object} marketData - Current market data
   */
  updateCandles(marketData) {
    const now = marketData.timestamp;

    // Update candles for all intervals
    [10, 100, 1000, 5000].forEach(interval => {
      this.updateCandleForInterval(interval, now, marketData.price);
    });

    // Set the main candles array based on the selected interval
    this.candles = this.candlesByInterval[this.config.candleInterval];
  }

  /**
   * Update candle for a specific interval
   * @param {number} interval - Candle interval in milliseconds
   * @param {number} now - Current timestamp
   * @param {number} price - Current price
   */
  updateCandleForInterval(interval, now, price) {
    // Calculate the start of the current interval
    const intervalStart = Math.floor(now / interval) * interval;

    // If we're in a new interval, create a new candle
    if (intervalStart > this.lastCandleTimes[interval]) {
      // If we have a current candle, push it to the candles array
      if (this.currentCandles[interval]) {
        this.candlesByInterval[interval].push(this.currentCandles[interval]);

        // Keep only the last 200 candles to limit memory usage and improve performance
        if (this.candlesByInterval[interval].length > 200) {
          this.candlesByInterval[interval] = this.candlesByInterval[interval].slice(-200);
        }
      }

      // Create a new candle
      this.currentCandles[interval] = {
        timestamp: intervalStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: Math.floor(Math.random() * 100000) // Initial random volume
      };

      this.lastCandleTimes[interval] = intervalStart;
    } else if (this.currentCandles[interval]) {
      // Update the current candle
      this.currentCandles[interval].high = Math.max(this.currentCandles[interval].high, price);
      this.currentCandles[interval].low = Math.min(this.currentCandles[interval].low, price);
      this.currentCandles[interval].close = price;
      this.currentCandles[interval].volume += Math.floor(Math.random() * 10000); // Add random volume
    }
  }

  /**
   * Execute a trade
   * @param {Object} trade - Trade details
   * @returns {Object} Trade result
   */
  executeTrade(trade) {
    const now = Date.now();

    // Check if we're within the rate limit
    if (now - this.lastTradeTime < 1000 / this.config.maxTradesPerSecond) {
      return { success: false, message: 'Rate limit exceeded' };
    }

    // Check if trade size is valid
    if (Math.abs(trade.size) > this.config.maxTradeSize) {
      return { success: false, message: 'Trade size exceeds maximum' };
    }

    // Execute the trade
    const price = trade.side === 'buy' ? this.currentPrice + (this.config.spread / 2) : this.currentPrice - (this.config.spread / 2);
    const executedTrade = {
      id: Date.now().toString(),
      timestamp: now,
      side: trade.side,
      size: trade.size,
      price,
      value: Math.abs(trade.size) * price
    };

    // Add to trades list
    this.trades.push(executedTrade);

    // Keep only the last 50 trades to limit memory usage
    if (this.trades.length > 50) {
      this.trades = this.trades.slice(-50);
    }

    // Update last trade time
    this.lastTradeTime = now;

    return { success: true, trade: executedTrade };
  }

  /**
   * Generate a random number from a normal distribution
   * Using Box-Muller transform
   * @returns {number} Random number from normal distribution
   */
  normalRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

module.exports = { MarketSimulator };
