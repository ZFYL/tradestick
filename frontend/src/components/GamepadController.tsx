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

const TriggerButton = styled.div<{ $pressed: boolean; $type: 'L1' | 'L2' | 'R1' | 'R2' | 'R3'; $multiplier?: number }>`
  width: 50px;
  height: 50px;
  background-color: ${props => props.$pressed
    ? props.$type === 'R2' || props.$type === 'R3'
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

// Define a pulse animation
const pulseAnimation = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }
`;

const TradeIndicator = styled.div<{
  $side: 'buy' | 'sell' | null;
  $size: number;
  $triggerPressed?: boolean;
  $justExecuted?: boolean;
}>`
  ${pulseAnimation}
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 100px;
  background-color: ${props =>
    props.$side === 'buy'
      ? `rgba(76, 175, 80, 0.8)` // Green for buy
      : props.$side === 'sell'
        ? `rgba(128, 128, 128, 0.8)` // Grey for sell
        : `rgba(180, 180, 180, 0.4)` // Neutral/default
  };
  border-radius: 4px;
  color: white;
  font-weight: bold;
  transition: background-color 0.2s;
  border: ${props => props.$triggerPressed ? '2px solid white' : 'none'};
  animation: ${props => props.$justExecuted ? 'pulse 0.5s' : 'none'};
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
`;

const GamepadController: React.FC<GamepadControllerProps> = ({
  executeTrade,
  maxTradeSize,
  tradeSizeStep = 0.000000001,
  currentPrice
}) => {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    leftTriggerPressed: false,  // L2
    rightTriggerPressed: false, // R2
    leftBumperPressed: false,   // L1
    rightBumperPressed: false,  // R1
    rightJoystickPressed: false, // R3
    leftJoystickY: 0,
    rightJoystickY: 0
  });

  // Preview trade state: always reflects joystick position, regardless of trigger
  const [previewTrade, setPreviewTrade] = useState<{ side: 'buy' | 'sell' | null; size: number }>({
    side: null,
    size: 0
  });

  // Active trade state: only set when a trade is actually executed
  const [activeTrade, setActiveTrade] = useState<{ side: 'buy' | 'sell' | null; size: number }>({
    side: null,
    size: 0
  });

  // Track when a trade was last executed for visual feedback
  const [lastTradeExecuted, setLastTradeExecuted] = useState<number>(0);

  // Force re-render when a trade is executed to update the visual feedback
  useEffect(() => {
    if (lastTradeExecuted > 0) {
      const timer = setTimeout(() => {
        // This will force a re-render after the animation completes
        setLastTradeExecuted(prev => prev);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [lastTradeExecuted]);

  const lastTradeTime = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // --- BEGIN: Repeated trade interval management ---
  const tradeIntervalRef = useRef<number | null>(null);
  const activeTradeDirectionRef = useRef<'buy' | 'sell' | null>(null);
  const TRADE_INTERVAL_MS = 500; // 2 trades per second (can be adjusted or made configurable)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (tradeIntervalRef.current) {
        clearInterval(tradeIntervalRef.current);
        tradeIntervalRef.current = null;
      }
    };
  }, []);
  // --- END: Repeated trade interval management ---

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

  // Track previous R2 state to detect changes
  const prevR2State = useRef(false);

  // Track previous right joystick Y state to detect transitions
  const prevRightJoystickY = useRef(0);

  // Poll gamepad state
  useEffect(() => {
    if (!gamepadState.connected) return;

    /**
     * updateGamepadState
     * - Always updates previewTrade based on right joystick position and multipliers.
     * - Only executes a trade (and updates activeTrade) when the right trigger is pressed.
     * - Ensures the UI can always show a real-time preview, and only confirms a trade on trigger.
     */
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
        const leftTriggerPressed = leftTriggerValue > 0.1;

        // Bumpers (L1/R1)
        const rightBumperPressed = activeGamepad.buttons[5]?.pressed || false; // R1
        const leftBumperPressed = activeGamepad.buttons[4]?.pressed || false;  // L1

        // Joystick buttons (R3/L3)
        const rightJoystickPressed = activeGamepad.buttons[11]?.pressed || false; // R3 (right stick press)

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
          rightJoystickPressed,
          rightJoystickY,
          leftJoystickY
        });

        // --- BEGIN: Real-time trade preview logic ---
        const threshold = 0.1;
        let previewSide: 'buy' | 'sell' | null = null;
        if (rightJoystickY < -threshold) previewSide = 'buy';
        else if (rightJoystickY > threshold) previewSide = 'sell';

        // Calculate multipliers for preview
        let previewMultiplier = 1;
        if (leftBumperPressed) previewMultiplier *= 5;
        if (leftTriggerPressed) previewMultiplier *= 10;
        if (rightBumperPressed) previewMultiplier *= 20;

        const previewSizeCoefficient = Math.min(1, Math.abs(rightJoystickY));
        const previewRawSize = Math.max(tradeSizeStep, previewSizeCoefficient * maxTradeSize * previewMultiplier);
        const previewSize = Math.max(tradeSizeStep, Math.round(previewRawSize / tradeSizeStep) * tradeSizeStep);

        setPreviewTrade({
          side: previewSide,
          size: previewSizeCoefficient
        });
        // --- END: Real-time trade preview logic ---

        // --- BEGIN: Trade execution logic (only on trigger) ---
        const r2Held = rightTriggerValue > 0.1;
        let execSide: 'buy' | 'sell' | null = null;
        if (r2Held && rightJoystickY < -threshold) execSide = 'buy';
        else if (r2Held && rightJoystickY > threshold) execSide = 'sell';

        if (execSide) {
          // Only start a new interval if direction changed or not running
          if (
            activeTradeDirectionRef.current !== execSide ||
            !tradeIntervalRef.current
          ) {
            // Clear any previous interval
            if (tradeIntervalRef.current) {
              clearInterval(tradeIntervalRef.current);
              tradeIntervalRef.current = null;
            }
            activeTradeDirectionRef.current = execSide;

            // Calculate trade size for this direction
            const sizeCoefficient = Math.min(1, Math.abs(rightJoystickY));
            const rawSize = Math.max(tradeSizeStep, sizeCoefficient * maxTradeSize * previewMultiplier);
            const size = Math.max(tradeSizeStep, Math.round(rawSize / tradeSizeStep) * tradeSizeStep);

            // Immediately execute a trade on direction start
            setActiveTrade({
              side: execSide,
              size: sizeCoefficient
            });
            const now = Date.now();
            setLastTradeExecuted(now);
            executeTrade(execSide, size);

            // Start interval for repeated trades while trigger is held
            tradeIntervalRef.current = setInterval(() => {
              // Recalculate size in case joystick position or multipliers change
              const gamepadsNow = navigator.getGamepads ? navigator.getGamepads() : [];
              const gp = gamepadsNow && gamepadsNow[activeGamepad.index];
              let y = rightJoystickY;
              let l1 = leftBumperPressed, l2 = leftTriggerPressed, r1 = rightBumperPressed;
              if (gp) {
                y = gp.axes[3] || 0;
                l1 = gp.buttons[4]?.pressed || false;
                l2 = gp.buttons[6]?.value > 0.1;
                r1 = gp.buttons[5]?.pressed || false;
              }
              let multiplier = 1;
              if (l1) multiplier *= 5;
              if (l2) multiplier *= 10;
              if (r1) multiplier *= 20;
              const coeff = Math.min(1, Math.abs(y));
              const raw = Math.max(tradeSizeStep, coeff * maxTradeSize * multiplier);
              const sz = Math.max(tradeSizeStep, Math.round(raw / tradeSizeStep) * tradeSizeStep);

              setActiveTrade({
                side: execSide,
                size: coeff
              });
              setLastTradeExecuted(Date.now());
              executeTrade(execSide, sz);
            }, TRADE_INTERVAL_MS);
          }
        } else {
          // No direction active, clear interval if running
          if (tradeIntervalRef.current) {
            clearInterval(tradeIntervalRef.current);
            tradeIntervalRef.current = null;
            activeTradeDirectionRef.current = null;
          }
          setActiveTrade({
            side: null,
            size: 0
          });
        }
        // --- END: Trade execution logic ---
      }

      animationFrameRef.current = requestAnimationFrame(updateGamepadState);
    };

    animationFrameRef.current = requestAnimationFrame(updateGamepadState);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (tradeIntervalRef.current) {
        clearInterval(tradeIntervalRef.current);
        tradeIntervalRef.current = null;
        activeTradeDirectionRef.current = null;
      }
    };
  }, [
    gamepadState.connected,
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
        <div><strong>Step 1:</strong> Press and hold R2 to open trade window</div>
        <div><strong>Step 2:</strong> While holding R2, move right joystick up (BUY) or down (SELL)</div>
        <div>Multipliers: L1 (5x), L2 (10x), R1 (20x) - All can be combined!</div>
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
        {/*
          TradeIndicator now always shows the previewed trade (side/size) based on joystick position.
          When a trade is actually executed (trigger pressed), a visual highlight or badge is shown for 500ms.
        */}
        <TradeIndicator
          $side={previewTrade.side}
          $size={previewTrade.size}
          $triggerPressed={gamepadState.rightTriggerPressed}
          $justExecuted={Date.now() - lastTradeExecuted < 500}
        >
          <div>
            {/* Show previewed direction */}
            {previewTrade.side === 'buy'
              ? 'BUY (Preview)'
              : previewTrade.side === 'sell'
                ? 'SELL (Preview)'
                : 'NONE'}
          </div>
          <div>
            {/* Show previewed size */}
            {previewTrade.side
              ? (
                  (Math.abs(gamepadState.rightJoystickY) > 0.1
                    ? ((Math.min(1, Math.abs(gamepadState.rightJoystickY)) * maxTradeSize) *
                        (gamepadState.leftBumperPressed ? 5 : 1) *
                        (gamepadState.leftTriggerPressed ? 10 : 1) *
                        (gamepadState.rightBumperPressed ? 20 : 1)
                      ).toFixed(2)
                    : '0.00'
                  )
                )
              : ''}
          </div>
          {(previewTrade.side && (gamepadState.leftBumperPressed || gamepadState.leftTriggerPressed || gamepadState.rightBumperPressed)) && (
            <div>
              {gamepadState.leftBumperPressed && gamepadState.leftTriggerPressed && gamepadState.rightBumperPressed
                ? '1000x'
                : `${gamepadState.leftBumperPressed ? '5x ' : ''}${gamepadState.leftTriggerPressed ? '10x ' : ''}${gamepadState.rightBumperPressed ? '20x' : ''}`
              }
            </div>
          )}
          {/* Show price preview */}
          {previewTrade.side && Math.abs(gamepadState.rightJoystickY) > 0.1 && (
            <div style={{ fontSize: '0.7rem', marginTop: '3px' }}>
              @ ${currentPrice.toFixed(5)}
            </div>
          )}
          {/* If a trade was just executed, show a badge or highlight */}
          {activeTrade.side && (Date.now() - lastTradeExecuted < 500) && (
            <div style={{ color: '#fff', background: '#28a745', borderRadius: 4, padding: '2px 6px', marginTop: 4, fontWeight: 600 }}>
              TRADE CONFIRMED!
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
