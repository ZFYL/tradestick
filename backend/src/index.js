const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MarketSimulator } = require('./marketSimulator');

// Create Express app
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 5000
});

console.log('Socket.IO server created');

/**
* Default market configuration, including amplitude (volatility) guarantees for each interval.
* Amplitude settings are editable via the /api/amplitude-settings endpoint.
*/
const defaultConfig = {
 initialPrice: 1.10000, // EUR/USD starting price
 volatility: 0.0001,    // Annualized volatility (scaled for milliseconds)
 spread: 0.0001,        // 1 pip spread
 updateInterval: 10,    // Update every 10ms
 orderBookLevels: 5,    // 5 levels of depth in order book
 maxTradeSize: 1.0,     // Maximum trade size
 maxTradesPerSecond: 10, // Maximum trades per second
 candleInterval: 1000,  // Default to 1 second candles
 tradeSizeStep: 0.1,    // Default trade size step
 initialBalance: 10000, // Default initial balance

 // Amplitude (volatility) guarantees for each interval (percent)
 priceChangeThreshold15s: 0.2,
 priceChangeThreshold1m: 0.5,
 priceChangeThreshold15m: 1.5,
 priceChangeThreshold1h: 3.0
};

/**
* Shared amplitude settings object.
* These values are editable via the /api/amplitude-settings endpoint and used by the market simulator.
*/
const amplitudeSettings = {
 priceChangeThreshold15s: defaultConfig.priceChangeThreshold15s,
 priceChangeThreshold1m: defaultConfig.priceChangeThreshold1m,
 priceChangeThreshold15m: defaultConfig.priceChangeThreshold15m,
 priceChangeThreshold1h: defaultConfig.priceChangeThreshold1h
};

// Create market simulator
const marketSimulator = new MarketSimulator(defaultConfig);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current configuration to client
  console.log('Sending config to client:', marketSimulator.getConfig());
  socket.emit('config', marketSimulator.getConfig());

  // Handle configuration updates
  socket.on('updateConfig', (config) => {
    console.log('Updating configuration:', config);
    marketSimulator.updateConfig(config);
    io.emit('config', marketSimulator.getConfig());
  });

  // Handle trade execution
  socket.on('executeTrade', (trade) => {
    console.log('Executing trade:', trade);
    const result = marketSimulator.executeTrade(trade);
    console.log('Trade result:', result);
    socket.emit('tradeResult', result);
  });

  // Handle error
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
});

// Start market simulation
console.log('Starting market simulation...');
marketSimulator.start((marketData) => {
  // Log every 100th update to avoid flooding the console
  if (marketData.timestamp % 1000 < 10) {
    console.log('Market data update:', {
      timestamp: marketData.timestamp,
      price: marketData.price,
      candles: marketData.candles.length
    });
  }
  io.emit('marketData', marketData);
});

// API routes
app.get('/', (req, res) => {
 res.send('Forex Trading Simulator API is running');
});

/**
* @api {get} /api/amplitude-settings Get amplitude (volatility) guarantee settings
* @apiSuccess {Object} settings Current amplitude settings for 15s, 1m, 15m, 1h intervals (percent).
* Example response:
*   {
*     "priceChangeThreshold15s": 0.2,
*     "priceChangeThreshold1m": 0.5,
*     "priceChangeThreshold15m": 1.5,
*     "priceChangeThreshold1h": 3.0
*   }
*/
app.get('/api/amplitude-settings', (req, res) => {
 res.json({ ...amplitudeSettings });
});

/**
* @api {post} /api/amplitude-settings Update amplitude (volatility) guarantee settings
* @apiBody {Object} settings New amplitude settings (any/all of: priceChangeThreshold15s, priceChangeThreshold1m, priceChangeThreshold15m, priceChangeThreshold1h)
* @apiSuccess {Object} settings Updated amplitude settings.
* Example request body:
*   {
*     "priceChangeThreshold15m": 2.0,
*     "priceChangeThreshold1h": 4.0
*   }
*/
app.post('/api/amplitude-settings', (req, res) => {
 // Only update known keys
 const allowedKeys = [
   'priceChangeThreshold15s',
   'priceChangeThreshold1m',
   'priceChangeThreshold15m',
   'priceChangeThreshold1h'
 ];
 let changed = false;
 for (const key of allowedKeys) {
   if (typeof req.body[key] === 'number') {
     amplitudeSettings[key] = req.body[key];
     changed = true;
   }
 }
 if (changed) {
   // Update the simulator config so new settings take effect immediately
   marketSimulator.updateConfig({ ...amplitudeSettings });
 }
 res.json({ ...amplitudeSettings });
});

app.get('/api/config', (req, res) => {
 res.json(marketSimulator.getConfig());
});

app.post('/api/config', (req, res) => {
 marketSimulator.updateConfig(req.body);
 // If amplitude settings are included, update the shared object as well
 const allowedKeys = [
   'priceChangeThreshold15s',
   'priceChangeThreshold1m',
   'priceChangeThreshold15m',
   'priceChangeThreshold1h'
 ];
 for (const key of allowedKeys) {
   if (typeof req.body[key] === 'number') {
     amplitudeSettings[key] = req.body[key];
   }
 }
 res.json(marketSimulator.getConfig());
});

app.get('/api/market-data', (req, res) => {
 res.json(marketSimulator.generateMarketData());
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  marketSimulator.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
