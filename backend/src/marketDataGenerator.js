/**
 * Market Data Generator for Forex Trading
 * Generates synthetic market data using Geometric Brownian Motion
 */
class MarketDataGenerator {
  constructor(settings) {
    this.settings = settings;
    this.currentPrice = 1000; // Default starting price
    this.lastUpdateTime = Date.now();
    this.candles = [];
    this.currentCandle = null;
    this.lastCandleTime = 0;
  }

  /**
   * Generate a random number from a normal distribution
   * @returns {number} Random number from a normal distribution
   */
  normalRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Generate the next candle
   * @returns {Object} Candle data
   */
  generateNextCandle() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Generate new price using Geometric Brownian Motion
    const drift = 0;
    const volatility = this.settings.volatility || 0.002;
    const randomComponent = this.normalRandom() * Math.sqrt(deltaTime);
    const priceChange = drift * deltaTime + volatility * randomComponent;
    
    // Update price
    this.currentPrice *= Math.exp(priceChange);

    // Calculate bid and ask prices
    const spread = 0.0001; // 1 pip spread
    const halfSpread = spread / 2;
    const bidPrice = this.currentPrice - halfSpread;
    const askPrice = this.currentPrice + halfSpread;

    // Generate random volume
    const volume = Math.floor(Math.random() * 100000);

    // Create or update candle
    const intervalStart = Math.floor(now / this.settings.interval) * this.settings.interval;
    
    if (intervalStart > this.lastCandleTime) {
      // If we have a current candle, push it to the candles array
      if (this.currentCandle) {
        this.candles.push(this.currentCandle);
        
        // Keep only the last 200 candles
        if (this.candles.length > 200) {
          this.candles = this.candles.slice(-200);
        }
      }
      
      // Create a new candle
      this.currentCandle = {
        timestamp: intervalStart,
        open: this.currentPrice,
        high: this.currentPrice,
        low: this.currentPrice,
        close: this.currentPrice,
        volume: volume
      };
      
      this.lastCandleTime = intervalStart;
    } else if (this.currentCandle) {
      // Update the current candle
      this.currentCandle.high = Math.max(this.currentCandle.high, this.currentPrice);
      this.currentCandle.low = Math.min(this.currentCandle.low, this.currentPrice);
      this.currentCandle.close = this.currentPrice;
      this.currentCandle.volume += Math.floor(Math.random() * 10000);
    }

    return {
      timestamp: now,
      price: this.currentPrice,
      bid: bidPrice,
      ask: askPrice,
      symbol: this.settings.symbol || 'ETHUSDT',
      candles: [...this.candles, this.currentCandle]
    };
  }
}

module.exports = { MarketDataGenerator };
