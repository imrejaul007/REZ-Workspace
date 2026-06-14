// Environment Configuration for Expo
// Use Constants.expoConfig.extra for accessing env vars set in app.json
// DO NOT use process.env directly - it doesn't work in Expo/React Native

import Constants from 'expo-constants';

// API Configuration
export const API_URL = Constants.expoConfig?.extra?.API_URL || 'https://api.khaimove.com';
export const SOCKET_URL = Constants.expoConfig?.extra?.SOCKET_URL || 'wss://api.khaimove.com';
export const ENVIRONMENT = Constants.expoConfig?.extra?.environment || 'production';

// Map Configuration
export const MAPS_API_KEY = Constants.expoConfig?.extra?.MAPS_API_KEY || '';

// Service URLs (RABTUL integration)
export const SERVICE_URLS = {
  AUTH: Constants.expoConfig?.extra?.AUTH_SERVICE_URL || 'https://api.khaimove.com/auth',
  PAYMENT: Constants.expoConfig?.extra?.PAYMENT_SERVICE_URL || 'https://api.khaimove.com/payment',
  WALLET: Constants.expoConfig?.extra?.WALLET_SERVICE_URL || 'https://api.khaimove.com/wallet',
  NOTIFICATION: Constants.expoConfig?.extra?.NOTIFICATION_SERVICE_URL || 'https://api.khaimove.com/notification',
  RIDE: Constants.expoConfig?.extra?.RIDE_SERVICE_URL || 'https://api.khaimove.com/ride',
  FLEET: Constants.expoConfig?.extra?.FLEET_SERVICE_URL || 'https://api.khaimove.com/fleet',
};

// App Version
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId || 'khaimove-user-app';

export default {
  API_URL,
  SOCKET_URL,
  ENVIRONMENT,
  MAPS_API_KEY,
  SERVICE_URLS,
  APP_VERSION,
  PROJECT_ID,
};
