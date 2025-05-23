// Sound effects utility for TradeStick

// Define sound types
export type SoundEffect = 
  | 'buy'
  | 'sell'
  | 'achievement'
  | 'pattern_detected'
  | 'level_up'
  | 'error'
  | 'success'
  | 'click'
  | 'hover';

// Create audio context when needed (to comply with browser autoplay policies)
let audioContext: AudioContext | null = null;

// Cache for loaded sounds
const soundCache: Record<string, AudioBuffer> = {};

// Volume settings
let masterVolume = 0.5;
let soundEnabled = true;

// Initialize audio context (call this on user interaction)
export const initAudio = (): void => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }
  }
};

// Set master volume
export const setVolume = (volume: number): void => {
  masterVolume = Math.max(0, Math.min(1, volume));
};

// Enable/disable sound
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

// Get sound enabled state
export const isSoundEnabled = (): boolean => {
  return soundEnabled;
};

// Load a sound file
const loadSound = async (url: string): Promise<AudioBuffer> => {
  if (!audioContext) {
    initAudio();
    if (!audioContext) {
      throw new Error('Audio context not available');
    }
  }

  // Check cache first
  if (soundCache[url]) {
    return soundCache[url];
  }

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundCache[url] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error('Error loading sound:', error);
    throw error;
  }
};

// Play a sound effect
export const playSound = async (sound: SoundEffect, volume = 1.0): Promise<void> => {
  if (!soundEnabled || !audioContext) {
    return;
  }

  // Map sound type to file path
  const soundMap: Record<SoundEffect, string> = {
    buy: '/sounds/buy.mp3',
    sell: '/sounds/sell.mp3',
    achievement: '/sounds/achievement.mp3',
    pattern_detected: '/sounds/pattern.mp3',
    level_up: '/sounds/level_up.mp3',
    error: '/sounds/error.mp3',
    success: '/sounds/success.mp3',
    click: '/sounds/click.mp3',
    hover: '/sounds/hover.mp3'
  };

  try {
    // For development, we'll use placeholder sounds
    // In production, these would be replaced with actual sound files
    const soundUrl = soundMap[sound] || '/sounds/click.mp3';
    
    // Create oscillator as fallback if sound file doesn't exist
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume
    gainNode.gain.value = volume * masterVolume;
    
    // Set frequency based on sound type (as a fallback)
    switch (sound) {
      case 'buy':
        oscillator.frequency.value = 440; // A4
        break;
      case 'sell':
        oscillator.frequency.value = 330; // E4
        break;
      case 'achievement':
        oscillator.frequency.value = 880; // A5
        break;
      case 'pattern_detected':
        oscillator.frequency.value = 660; // E5
        break;
      case 'level_up':
        oscillator.frequency.value = 1320; // E6
        break;
      case 'error':
        oscillator.frequency.value = 220; // A3
        break;
      default:
        oscillator.frequency.value = 440; // A4
    }
    
    // Start and stop the oscillator
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    // Try to load and play the actual sound file
    try {
      const buffer = await loadSound(soundUrl);
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set volume
      gainNode.gain.value = volume * masterVolume;
      
      // Play the sound
      source.start();
    } catch (error) {
      // Fallback to oscillator already played
      console.log('Using oscillator fallback for sound:', sound);
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Preload common sounds
export const preloadSounds = async (): Promise<void> => {
  if (!audioContext) {
    initAudio();
    if (!audioContext) {
      return;
    }
  }

  const soundsToPreload: SoundEffect[] = ['buy', 'sell', 'achievement', 'click'];
  
  try {
    await Promise.all(
      soundsToPreload.map(sound => {
        const soundMap: Record<SoundEffect, string> = {
          buy: '/sounds/buy.mp3',
          sell: '/sounds/sell.mp3',
          achievement: '/sounds/achievement.mp3',
          pattern_detected: '/sounds/pattern.mp3',
          level_up: '/sounds/level_up.mp3',
          error: '/sounds/error.mp3',
          success: '/sounds/success.mp3',
          click: '/sounds/click.mp3',
          hover: '/sounds/hover.mp3'
        };
        
        return loadSound(soundMap[sound]);
      })
    );
    console.log('Preloaded sounds');
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
};
