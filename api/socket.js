// Serverless function for Socket.IO
const { Server } = require('socket.io');
const { createServer } = require('http');
const { MarketDataGenerator } = require('../backend/src/marketDataGenerator');

// Create a custom server instance for Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io/'
});

// Market data generator instance
let marketDataGenerator = null;
let settings = {
  symbol: 'ETHUSDT',
  interval: 1000,
  volatility: 0.002,
  trend: 0,
  volumeVolatility: 0.5
};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected');

  // Initialize market data generator if not already created
  if (!marketDataGenerator) {
    marketDataGenerator = new MarketDataGenerator(settings);
  }

  // Send current settings to the client
  socket.emit('settings', settings);

  // Handle settings update
  socket.on('updateSettings', (newSettings) => {
    settings = { ...settings, ...newSettings };
    
    // Recreate market data generator with new settings
    marketDataGenerator = new MarketDataGenerator(settings);
    
    // Broadcast new settings to all clients
    io.emit('settings', settings);
  });

  // Handle trade execution
  socket.on('executeTrade', (trade) => {
    // Broadcast trade to all clients
    io.emit('tradeExecuted', trade);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start sending market data
setInterval(() => {
  if (marketDataGenerator) {
    const data = marketDataGenerator.generateNextCandle();
    io.emit('marketData', data);
  }
}, settings.interval);

// Export the Socket.IO instance for serverless function
module.exports = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO');
  res.socket.server.io = io;
  res.end();
};
