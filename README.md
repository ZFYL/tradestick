# TradeStick - Gamified Trading Simulator

A highly gamified trading simulator with PS5 DualShock joystick integration, real-time market data visualization, pattern recognition, and achievement system. TradeStick turns trading into an engaging game that helps users develop pattern recognition skills.

## Features

- **Client-side Market Simulator**: Generate realistic price movements with various patterns right in the browser
- **Pattern Recognition System**: Automatically detects and highlights trading patterns
- **Achievement System**: Unlock rewards and features as you improve your trading skills
- **PS5 DualShock Integration**: Trade using the joystick and trigger buttons for an immersive experience
- **Real-time Visualization**: Displays candlestick charts and order book with 60fps updates
- **Binance Integration**: Connect to real market data or use the simulator
- **Sound Effects**: Audio feedback enhances the gaming experience
- **Streak Multipliers**: Build consecutive profitable trades to earn multipliers
- **Simplified Settings**: Easy-to-use interface with presets for different market conditions

## Tech Stack

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: React with TypeScript and Vite
- **Charting**: Lightweight Charts for financial data visualization
- **Styling**: Styled Components for component-based styling
- **Gamepad**: Web Gamepad API for controller integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PS5 DualShock controller (optional, for joystick trading)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/gamified-trade.git
   cd gamified-trade
   ```

2. Install dependencies
   ```
   npm run install:all
   ```

### Running the Application

1. Start both backend and frontend
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. Connect your PS5 DualShock controller via USB or Bluetooth

## Usage

### Trading with Joystick

1. Hold the R2 trigger button
2. Move the right joystick up to buy, down to sell
3. The size of the trade is proportional to how far you move the joystick

### Manual Trading

1. Enter the trade size in the trade panel
2. Click "BUY" or "SELL" to execute a trade

### Configuration

1. Click the "Settings" button to open the settings panel
2. Adjust parameters like volatility, spread, and maximum trade size
3. Click "Apply Settings" to update the simulation

## Development

### Project Structure

```
gamified-trade/
├── backend/             # Node.js backend
│   ├── src/
│   │   ├── index.js     # Server entry point
│   │   └── marketSimulator.js  # Market data generation
│   └── package.json
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.tsx      # Main application
│   │   └── types.ts     # TypeScript types
│   └── package.json
└── package.json         # Root package.json
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Lightweight Charts](https://github.com/tradingview/lightweight-charts) for the charting library
- [Socket.IO](https://socket.io/) for real-time communication
- [Web Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) for controller support
