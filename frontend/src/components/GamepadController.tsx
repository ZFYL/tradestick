import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import type { GamepadState } from '../types';

interface GamepadControllerProps {
  executeTrade: (side: 'buy' | 'sell', size: number) => void;
  maxTradeSize: number;
  tradeSizeStep?: number;
  currentPrice: number;
}

const GamepadContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${props => props.theme.colors.chart.background};
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
`;

const GamepadStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  color: ${props => props.$connected ? props.theme.colors.buy : props.theme.colors.chart.text};
`;

const StatusDot = styled.div<{ $connected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.$connected ? props.theme.colors.buy : props.theme.colors.chart.text};
  margin-right: 0.5rem;
`;

const GamepadInstructions = styled.div`
  color: ${props => props.theme.colors.chart.text};
  font-size: 0.9rem;
`;

const GamepadVisualizer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  width: 100%;
  margin: 0 auto;
`;

const JoystickContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.chart.grid};
`;

const JoystickDot = styled.div<{ $positionY: number; $positionX?: number }>`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.$positionY > 0 ? props.theme.colors.buy : props.$positionY < 0 ? props.theme.colors.sell : props.theme.colors.chart.text};
  left: 50%;
  top: 50%;
  transform: translate(
    calc(-50% + ${props => (props.$positionX || 0) * 30}px),
    calc(-50% + ${props => props.$positionY * 30}px)
  );
  transition: transform 0.1s ease-out, background-color 0.1s ease-out;
`;

const TriggerContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const TriggerButton = styled.div<{ $pressed: boolean; $type: 'L1' | 'L2' | 'R1' | 'R2'; $multiplier?: number }>`
  width: 50px;
  height: 50px;
  background-color: ${props => props.$pressed
    ? props.$type === 'R2'
      ? props.theme.colors.accent
      : `rgba(76, 175, 80, ${props.$multiplier ? 0.8 : 0.3})`
    : props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.chart.grid};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.$pressed ? 'bold' : 'normal'};
  color: ${props => props.$pressed ? 'white' : props.theme.colors.chart.text};
  transition: all 0.1s ease-out;
`;

const MultiplierText = styled.div`
  font-size: 0.8rem;
  margin-top: 2px;
`;

const TradeIndicator = styled.div<{ $side: 'buy' | 'sell' | null; $size: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 80px;
  background-color: ${props =>
    props.$side === 'buy'
      ? `rgba(76, 175, 80, ${Math.min(1, props.$size * 0.5 + 0.2)})`
      : props.$side === 'sell'
        ? `rgba(244, 67, 54, ${Math.min(1, props.$size * 0.5 + 0.2)})`
        : 'rgba(100, 100, 100, 0.1)'
  };
  border-radius: 4px;
  color: ${props => props.$side ? 'white' : 'rgba(200, 200, 200, 0.7)'};
  font-weight: bold;
  transition: background-color 0.2s;
`;

const GamepadController: React.FC<GamepadControllerProps> = ({
  executeTrade,
  maxTradeSize,
  tradeSizeStep = 0.1,
  currentPrice
}) => {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    leftTriggerPressed: false,  // L2
    rightTriggerPressed: false, // R2
    leftBumperPressed: false,   // L1
    rightBumperPressed: false,  // R1
    leftJoystickY: 0,
    rightJoystickY: 0
  });

  const [activeTrade, setActiveTrade] = useState<{ side: 'buy' | 'sell' | null; size: number }>({
    side: null,
    size: 0
  });

  const lastTradeTime = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize gamepad detection
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      setGamepadState(prev => ({ ...prev, connected: true }));
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      setGamepadState(prev => ({ ...prev, connected: false }));
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Check if gamepad is already connected
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads) {
      for (const gamepad of gamepads) {
        if (gamepad) {
          setGamepadState(prev => ({ ...prev, connected: true }));
          break;
        }
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Poll gamepad state
  useEffect(() => {
    if (!gamepadState.connected) return;

    const updateGamepadState = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activeGamepad = null;

      // Find the first connected gamepad
      if (gamepads) {
        for (const gamepad of gamepads) {
          if (gamepad) {
            activeGamepad = gamepad;
            break;
          }
        }
      }

      if (activeGamepad) {
        // PS5 DualSense controller mapping
        // Triggers
        const rightTriggerValue = activeGamepad.buttons[7]?.value || 0; // R2
        const leftTriggerValue = activeGamepad.buttons[6]?.value || 0;  // L2

        // Bumpers (L1/R1)
        const rightBumperPressed = activeGamepad.buttons[5]?.pressed || false; // R1
        const leftBumperPressed = activeGamepad.buttons[4]?.pressed || false;  // L1

        // Joysticks
        const rightJoystickY = activeGamepad.axes[3] || 0; // Right joystick Y-axis
        const leftJoystickY = activeGamepad.axes[1] || 0;  // Left joystick Y-axis

        // Update gamepad state
        setGamepadState({
          connected: true,
          rightTriggerPressed: rightTriggerValue > 0.1,
          leftTriggerPressed: leftTriggerValue > 0.1,
          rightBumperPressed,
          leftBumperPressed,
          rightJoystickY,
          leftJoystickY
        });

        // Calculate multipliers based on trigger buttons (compounding)
        let sizeMultiplier = 1;
        if (leftBumperPressed) sizeMultiplier *= 5;  // L1: 5x multiplier
        if (leftTriggerPressed) sizeMultiplier *= 10; // L2: 10x multiplier
        if (rightBumperPressed) sizeMultiplier *= 20; // R1: 20x multiplier

        // If all three are pressed: 5 * 10 * 20 = 1000x multiplier

        // Handle trade execution with right trigger (R2) and joystick
        if (gamepadState.rightTriggerPressed && Math.abs(gamepadState.rightJoystickY) > 0.1) {
          const side = gamepadState.rightJoystickY > 0 ? 'buy' : 'sell';
          const sizeCoefficient = Math.min(1, Math.abs(gamepadState.rightJoystickY));

          // Calculate size with multipliers and round to nearest step
          const rawSize = sizeCoefficient * maxTradeSize * sizeMultiplier;
          const size = Math.round(rawSize / tradeSizeStep) * tradeSizeStep;

          setActiveTrade({
            side,
            size: sizeCoefficient
          });

          // Execute the trade
          executeTrade(side, size);
        } else {
          setActiveTrade({
            side: null,
            size: 0
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateGamepadState);
    };

    animationFrameRef.current = requestAnimationFrame(updateGamepadState);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gamepadState,
    executeTrade,
    maxTradeSize,
    tradeSizeStep,
    currentPrice
  ]);

  return (
    <GamepadContainer>
      <GamepadStatus $connected={gamepadState.connected}>
        <StatusDot $connected={gamepadState.connected} />
        {gamepadState.connected ? 'Gamepad Connected' : 'No Gamepad Detected'}
      </GamepadStatus>

      <GamepadInstructions>
        <div>R2 + Right Joystick: Execute trades</div>
        <div>Multipliers: L1 (5x), L2 (10x), R1 (20x) - All can be combined!</div>
        <div>Maximum multiplier when all pressed: 1000x (5 × 10 × 20)</div>
      </GamepadInstructions>

      <GamepadVisualizer>
        {/* Trigger Buttons Container */}
        <TriggerContainer>
          <TriggerButton
            $pressed={gamepadState.leftBumperPressed}
            $type="L1"
            $multiplier={5}
          >
            L1
            <MultiplierText>5x</MultiplierText>
          </TriggerButton>

          <TriggerButton
            $pressed={gamepadState.leftTriggerPressed}
            $type="L2"
            $multiplier={10}
          >
            L2
            <MultiplierText>10x</MultiplierText>
          </TriggerButton>

          <TriggerButton
            $pressed={gamepadState.rightBumperPressed}
            $type="R1"
            $multiplier={20}
          >
            R1
            <MultiplierText>20x</MultiplierText>
          </TriggerButton>

          <TriggerButton
            $pressed={gamepadState.rightTriggerPressed}
            $type="R2"
          >
            R2
            <MultiplierText>Trade</MultiplierText>
          </TriggerButton>
        </TriggerContainer>

        {/* Left Joystick */}
        <JoystickContainer>
          <JoystickDot $positionY={gamepadState.leftJoystickY} />
        </JoystickContainer>

        {/* Trade Indicator */}
        <TradeIndicator
          $side={activeTrade.side}
          $size={activeTrade.size}
        >
          {/* Always show potential trade info, but highlight only when side is selected */}
          <div>{activeTrade.side === 'buy' ? 'BUY' : activeTrade.side === 'sell' ? 'SELL' : 'TRADE'}</div>

          {/* Calculate potential size based on joystick position and multipliers */}
          <div>
            {Math.abs(gamepadState.rightJoystickY) > 0.1
              ? ((Math.min(1, Math.abs(gamepadState.rightJoystickY)) * maxTradeSize) *
                 (gamepadState.leftBumperPressed ? 5 : 1) *
                 (gamepadState.leftTriggerPressed ? 10 : 1) *
                 (gamepadState.rightBumperPressed ? 20 : 1)
                ).toFixed(2)
              : '0.00'
            }
          </div>

          {/* Show multipliers */}
          {(gamepadState.leftBumperPressed || gamepadState.leftTriggerPressed || gamepadState.rightBumperPressed) && (
            <div>
              {gamepadState.leftBumperPressed && gamepadState.leftTriggerPressed && gamepadState.rightBumperPressed
                ? '1000x'
                : `${gamepadState.leftBumperPressed ? '5x ' : ''}${gamepadState.leftTriggerPressed ? '10x ' : ''}${gamepadState.rightBumperPressed ? '20x' : ''}`
              }
            </div>
          )}

          {/* Show price */}
          {Math.abs(gamepadState.rightJoystickY) > 0.1 && (
            <div style={{ fontSize: '0.7rem', marginTop: '3px' }}>
              @ ${currentPrice.toFixed(5)}
            </div>
          )}
        </TradeIndicator>

        {/* Right Joystick */}
        <JoystickContainer>
          <JoystickDot $positionY={gamepadState.rightJoystickY} />
        </JoystickContainer>
      </GamepadVisualizer>
    </GamepadContainer>
  );
};

export default GamepadController;
