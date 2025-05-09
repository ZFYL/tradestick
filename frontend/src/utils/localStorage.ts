/**
 * Utility functions for working with localStorage
 */

import type { Config } from '../types';

// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'gamifiedTrade_config',
  BALANCE: 'gamifiedTrade_balance',
  ASSET_HOLDINGS: 'gamifiedTrade_assetHoldings',
};

/**
 * Save config to localStorage
 */
export const saveConfig = (config: Config): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
};

/**
 * Load config from localStorage
 */
export const loadConfig = (defaultConfig: Config): Config => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedConfig) {
      return { ...defaultConfig, ...JSON.parse(savedConfig) };
    }
  } catch (error) {
    console.error('Error loading config from localStorage:', error);
  }
  return defaultConfig;
};

/**
 * Save balance to localStorage
 */
export const saveBalance = (balance: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
  } catch (error) {
    console.error('Error saving balance to localStorage:', error);
  }
};

/**
 * Load balance from localStorage
 */
export const loadBalance = (defaultBalance: number): number => {
  try {
    const savedBalance = localStorage.getItem(STORAGE_KEYS.BALANCE);
    if (savedBalance) {
      return parseFloat(savedBalance);
    }
  } catch (error) {
    console.error('Error loading balance from localStorage:', error);
  }
  return defaultBalance;
};

/**
 * Save asset holdings to localStorage
 */
export const saveAssetHoldings = (holdings: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSET_HOLDINGS, holdings.toString());
  } catch (error) {
    console.error('Error saving asset holdings to localStorage:', error);
  }
};

/**
 * Load asset holdings from localStorage
 */
export const loadAssetHoldings = (defaultHoldings: number = 0): number => {
  try {
    const savedHoldings = localStorage.getItem(STORAGE_KEYS.ASSET_HOLDINGS);
    if (savedHoldings) {
      return parseFloat(savedHoldings);
    }
  } catch (error) {
    console.error('Error loading asset holdings from localStorage:', error);
  }
  return defaultHoldings;
};

/**
 * Clear all saved data from localStorage
 */
export const clearAllSavedData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.BALANCE);
    localStorage.removeItem(STORAGE_KEYS.ASSET_HOLDINGS);
  } catch (error) {
    console.error('Error clearing saved data from localStorage:', error);
  }
};
