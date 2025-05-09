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

// Default market configuration
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
  initialBalance: 10000  // Default initial balance
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

app.get('/api/config', (req, res) => {
  res.json(marketSimulator.getConfig());
});

app.post('/api/config', (req, res) => {
  marketSimulator.updateConfig(req.body);
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
