/**
 * RABTUL Service Client
 * Auto-generated integration client
 */

import axios from 'axios';

// Simple console logger (shared/logger not available in frontend)
const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
};

// RABTUL Service URLs from environment
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4002';
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_SERVICE_URL = import.meta.env.VITE_WALLET_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const EVENT_BUS_URL = import.meta.env.VITE_EVENT_BUS_URL || 'http://localhost:4025';

// Internal token for service-to-service calls
const getInternalHeaders = (): Record<string, string> => ({
  'X-Internal-Token': import.meta.env.VITE_INTERNAL_SERVICE_TOKEN || '',
  'Content-Type': 'application/json'
});

/**
 * Verify JWT token with RABTUL Auth
 */
export async function verifyToken(token: string): Promise<unknown> {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Auth verification failed:', err.message);
    throw error;
  }
}

/**
 * Process payment via RABTUL Payment
 */
interface PaymentData {
  amount: number;
  currency?: string;
  orderId: string;
  [key: string]: unknown;
}

export async function processPayment(paymentData: PaymentData): Promise<unknown> {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/create`,
      paymentData,
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Payment failed:', err.message);
    throw error;
  }
}

/**
 * Add coins to wallet via RABTUL Wallet
 */
export async function addCoins(userId: string, amount: number, reason: string): Promise<unknown> {
  try {
    const response = await axios.post(`${WALLET_SERVICE_URL}/api/coins/credit`,
      { userId, amount, reason },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Wallet credit failed:', err.message);
    throw error;
  }
}

/**
 * Send notification via RABTUL Notifications
 */
interface NotificationPayload {
  title: string;
  body: string;
  type?: string;
}

export async function sendNotification(userId: string, notification: NotificationPayload): Promise<unknown> {
  try {
    const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      { userId, ...notification },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Notification failed:', err.message);
    throw error;
  }
}

/**
 * Track event via REZ Event Bus
 */
export async function trackEvent(eventType: string, eventData: Record<string, unknown>): Promise<unknown> {
  try {
    const response = await axios.post(`${EVENT_BUS_URL}/api/events`,
      { type: eventType, data: eventData },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Event tracking failed:', err.message);
    throw error;
  }
}

/**
 * Get predictions from REZ Intelligence
 */
export async function getPredictions(userId: string, features: Record<string, unknown>): Promise<unknown> {
  try {
    const intentServiceUrl = import.meta.env.VITE_INTENT_SERVICE_URL || 'http://localhost:4018';
    const response = await axios.post(
      `${intentServiceUrl}/api/predict`,
      { userId, features },
      { headers: getInternalHeaders() }
    );
    return response.data;
  } catch (error) {
    const err = error as Error;
    logger.error('Prediction failed:', err.message);
    throw error;
  }
}

export default {
  verifyToken,
  processPayment,
  addCoins,
  sendNotification,
  trackEvent,
  getPredictions
};
