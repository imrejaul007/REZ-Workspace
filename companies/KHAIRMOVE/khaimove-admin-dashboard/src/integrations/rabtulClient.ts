/**
 * RABTUL Service Client
 * Auto-generated integration client
 * 
 * SECURITY: Uses environment variables properly for Next.js
 */

import axios from 'axios';
import { logger } from '../../shared/logger';

// API Configuration - use NEXT_PUBLIC_ prefix for client-side access
const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600';
const RIDE_SERVICE_URL = process.env.NEXT_PUBLIC_RIDE_SERVICE_URL || 'http://localhost:4601';
const FLEET_SERVICE_URL = process.env.NEXT_PUBLIC_FLEET_SERVICE_URL || 'http://localhost:4602';
const DELIVERY_SERVICE_URL = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || 'http://localhost:4603';

// Internal service URLs (server-side only)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

/**
 * Get headers for authenticated requests
 * Client-side: gets token from localStorage
 */
export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

/**
 * Verify JWT token with RABTUL Auth
 * Server-side function - do not call from client components
 */
export async function verifyToken(token: string) {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      { headers: { 'Content-Type': 'application/json' } }
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
export async function processPayment(paymentData: Record<string, unknown>) {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments/create`,
      paymentData,
      { headers: getAuthHeaders() }
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
export async function addCoins(userId: string, amount: number, reason: string) {
  try {
    const response = await axios.post(
      `${WALLET_SERVICE_URL}/api/coins/credit`,
      { userId, amount, reason },
      { headers: getAuthHeaders() }
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
export async function sendNotification(userId: string, notification: Record<string, unknown>) {
  try {
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      { userId, ...notification },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Notification failed:', error.message);
    throw error;
  }
}

/**
 * Get drivers from fleet service
 */
export async function getDrivers() {
  try {
    const response = await axios.get(
      `${FLEET_SERVICE_URL}/api/drivers`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch drivers:', error.message);
    throw error;
  }
}

/**
 * Get active rides
 */
export async function getActiveRides() {
  try {
    const response = await axios.get(
      `${RIDE_SERVICE_URL}/api/rides/active`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    logger.error('Failed to fetch active rides:', error.message);
    throw error;
  }
}

// Export base URL for direct API calls
export { API_BASE_URL, RIDE_SERVICE_URL, FLEET_SERVICE_URL, DELIVERY_SERVICE_URL };

export default {
  verifyToken,
  processPayment,
  addCoins,
  sendNotification,
  getDrivers,
  getActiveRides,
  API_BASE_URL,
  getAuthHeaders,
};
