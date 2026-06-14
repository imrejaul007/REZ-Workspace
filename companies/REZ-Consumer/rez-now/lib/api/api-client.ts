/**
 * Public API Client for Rez-now
 *
 * Non-authenticated client for public endpoints like menu, stores, etc.
 * For authenticated endpoints, use authClient from './client'.
 */

import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token (optional - for semi-authenticated endpoints)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try to get token from localStorage (plaintext fallback for pre-fix sessions)
    const token = localStorage.getItem('rez_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default apiClient;
