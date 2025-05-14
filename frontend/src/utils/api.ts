/**
 * API utility functions for TradeStick
 */

// Determine the base API URL based on the environment
export const getApiBaseUrl = (): string => {
  // In production (Vercel), use relative URLs
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use localhost
  return 'http://localhost:3001';
};

// Get market data from the API
export const fetchMarketData = async () => {
  const response = await fetch(`${getApiBaseUrl()}/market-data`);
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  return response.json();
};

// Update settings
export const updateSettings = async (settings: any) => {
  const response = await fetch(`${getApiBaseUrl()}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
  
  return response.json();
};
