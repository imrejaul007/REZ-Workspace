/**
 * RABTUL Service Client
 * Auto-generated integration client
 * 
 * SECURITY: Uses Constants.expoConfig.extra for environment variables
 * DO NOT use process.env - it doesn't work in Expo/React Native
 */

import Constants from 'expo-constants';
import axios from 'axios';
import { logger } from '../../shared/logger';

// RABTUL Service URLs from environment (via app.json extra config)
const AUTH_SERVICE_URL = Constants.expoConfig?.extra?.AUTH_SERVICE_URL || 'http://localhost:4002';
const PAYMENT_SERVICE_URL = Constants.expoConfig?.extra?.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_SERVICE_URL = Constants.expoConfig?.extra?.WALLET_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = Constants.expoConfig?.extra?.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const ANALYTICS_SERVICE_URL = Constants.expoConfig?.extra?.ANALYTICS_SERVICE_URL || 'http://localhost:4016';
const EVENT_BUS_URL = Constants.expoConfig?.extra?.EVENT_BUS_URL || 'http://localhost:4025';

// Base API URL
const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 'https://api.khaimove.com';

/**
 * Get headers for authenticated requests
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get internal headers for service-to-service calls
 * Note: INTERNAL_SERVICE_TOKEN should be stored securely and never exposed to client
 */
export function getInternalHeaders(): Record<string, string> {
  // In production, this should come from secure storage or a secure backend
  const internalToken = Constants.expoConfig?.extra?.INTERNAL_SERVICE_TOKEN || '';
  return {
    'Content-Type': 'application/json',
    ...(internalToken && { 'X-Internal-Token': internalToken })
  };
}

/**
 * Verify JWT token with RABTUL Auth
 */
export async function verifyToken(token: string) {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Auth verification failed:', error.message);
    throw error;
  }
}

/**
 * Process payment via RABTUL Payment
 */
export async function processPayment(paymentData: Record<string, unknown>, token: string) {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/create`,
      paymentData,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Payment failed:', error.message);
    throw error;
  }
}

/**
 * Add coins to wallet via RABTUL Wallet
 */
export async function addCoins(userId: string, amount: number, reason: string, token: string) {
  try {
    const response = await axios.post(
      `${WALLET_SERVICE_URL}/api/coins/credit`,
      { userId, amount, reason },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Wallet credit failed:', error.message);
    throw error;
  }
}

/**
 * Send notification via RABTUL Notifications
 */
export async function sendNotification(userId: string, notification: Record<string, unknown>, token: string) {
  try {
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      { userId, ...notification },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Notification failed:', error.message);
    throw error;
  }
}

/**
 * Track event via REZ Event Bus
 */
export async function trackEvent(eventType: string, eventData: Record<string, unknown>) {
  try {
    const response = await axios.post(
      `${EVENT_BUS_URL}/api/events`,
      { type: eventType, data: eventData },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Event tracking failed:', error.message);
    throw error;
  }
}

/**
 * Get predictions from REZ Intelligence
 */
export async function getPredictions(userId: string, features: Record<string, unknown>, token: string) {
  try {
    const INTENT_SERVICE_URL = Constants.expoConfig?.extra?.INTENT_SERVICE_URL || 'http://localhost:4018';
    const response = await axios.post(
      `${INTENT_SERVICE_URL}/api/predict`,
      { userId, features },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Prediction failed:', error.message);
    throw error;
  }
}

// Export API_BASE_URL for general API calls
export { API_BASE_URL };

export default {
  verifyToken,
  processPayment,
  addCoins,
  sendNotification,
  trackEvent,
  getPredictions,
  API_BASE_URL,
  getAuthHeaders,
};
