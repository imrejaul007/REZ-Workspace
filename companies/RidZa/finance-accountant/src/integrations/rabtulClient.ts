/**
 * RABTUL Service Client
 * Service-to-service communication for HOJAI ecosystem
 */

import axios, { AxiosError } from 'axios';
import { config } from '../config/index.js';

interface ServiceError extends Error {
  statusCode?: number;
  retryable?: boolean;
}

class ServiceClient {
  private getHeaders() {
    return {
      'X-Internal-Token': config.internalToken,
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: unknown
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await axios.request<T>({
        method,
        url,
        data,
        headers: this.getHeaders(),
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const serviceError: ServiceError = new Error(
        axiosError.response?.data?.message || axiosError.message
      );
      serviceError.statusCode = axiosError.response?.status;
      serviceError.retryable = this.isRetryable(axiosError.response?.status);
      throw serviceError;
    }
  }

  private isRetryable(statusCode?: number): boolean {
    if (!statusCode) return true;
    return [408, 429, 500, 502, 503, 504].includes(statusCode);
  }

  /**
   * Verify JWT token with RABTUL Auth
   */
  async verifyToken(token: string) {
    return this.request<{
      userId: string;
      tenantId: string;
      roles: string[];
    }>(config.services.auth, '/api/auth/verify', 'POST', { token });
  }

  /**
   * Process payment via RABTUL Payment
   */
  async processPayment(paymentData: {
    userId: string;
    amount: number;
    currency?: string;
    reference: string;
  }) {
    return this.request<{
      transactionId: string;
      status: string;
    }>(config.services.payment, '/api/payments/create', 'POST', paymentData);
  }

  /**
   * Add coins to wallet via RABTUL Wallet
   */
  async addCoins(userId: string, amount: number, reason: string) {
    return this.request<{
      transactionId: string;
      newBalance: number;
    }>(config.services.wallet, '/api/coins/credit', 'POST', { userId, amount, reason });
  }

  /**
   * Send notification via RABTUL Notifications
   */
  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    type?: 'email' | 'push' | 'sms';
  }) {
    return this.request<{
      notificationId: string;
      status: string;
    }>(config.services.notification, '/api/notifications/send', 'POST', { userId, ...notification });
  }
}

export const serviceClient = new ServiceClient();

// Legacy exports for backward compatibility
export async function verifyToken(token: string) {
  return serviceClient.verifyToken(token);
}

export async function processPayment(paymentData: Parameters<typeof serviceClient.processPayment>[0]) {
  return serviceClient.processPayment(paymentData);
}

export async function addCoins(userId: string, amount: number, reason: string) {
  return serviceClient.addCoins(userId, amount, reason);
}

export async function sendNotification(userId: string, notification: Parameters<typeof serviceClient.sendNotification>[1]) {
  return serviceClient.sendNotification(userId, notification);
}

export default serviceClient;
