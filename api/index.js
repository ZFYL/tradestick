// API route handler for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const { MarketDataGenerator } = require('../backend/src/marketDataGenerator');

// Create Express app
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Default settings
const settings = {
  symbol: 'ETHUSDT',
  interval: 1000,
  volatility: 0.002,
  trend: 0,
  volumeVolatility: 0.5
};

// Create market data generator
const marketDataGenerator = new MarketDataGenerator(settings);

// API routes
app.get('/', (req, res) => {
  res.send('TradeStick API is running');
});

app.get('/market-data', (req, res) => {
  res.json(marketDataGenerator.generateNextCandle());
});

app.post('/settings', (req, res) => {
  Object.assign(settings, req.body);
  res.json(settings);
});

// Export the Express API
module.exports = app;
