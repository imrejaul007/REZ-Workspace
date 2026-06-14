import { logger } from '../../shared/logger';
/**
 * Ride Service - Production Ready
 * - Proper WebSocket cleanup
 * - Reconnection handling
 * - Memory leak prevention
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/auth.store';
import { useRideStore } from '../stores/ride.store';
import crashReporting from './crash-reporting';
import analytics from './analytics.service';

// Get API URL from environment
const getApiUrl = (): string => {
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  if (__DEV__) {
    return 'http://localhost:4000';
  }
  return 'https://api.rezride.com';
};

const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('http', 'ws') + '/ride';
};

class RideService {
  private api: AxiosInstance;
  private socket: Socket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listenersCleanup: (() => void) | null = null;
  private isConnecting = false;

  constructor() {
    this.api = axios.create({
      baseURL: getApiUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - logout user
          crashReporting.captureMessage('Token expired', 'warning');
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Connect to WebSocket with reconnection support
   */
  connectSocket(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    this.socket = io(getWsUrl(), {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupSocketListeners();
    this.setupReconnectHandlers();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      logger.info('[Socket] Connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      analytics.track('websocket_connected');
      crashReporting.addBreadcrumb('WebSocket connected');

      // Join user room
      if (this.userId) {
        this.socket?.emit('user:join', { userId: this.userId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('[Socket] Disconnected:', reason);
      analytics.track('websocket_disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      logger.error('[Socket] Connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      crashReporting.captureError(error as Error, {
        context: 'websocket_connect',
        attempt: this.reconnectAttempts,
      });
    });

    // Ride events
    this.socket.on('ride:assigned', (data) => {
      logger.info('[Socket] Ride assigned:', data);
      analytics.track('ride_assigned');
      useRideStore.getState().setRide(data);
    });

    this.socket.on('ride:accepted', () => {
      logger.info('[Socket] Ride accepted');
      analytics.track('ride_accepted');
      useRideStore.getState().updateRideStatus('accepted');
    });

    this.socket.on('ride:driver_location', (data) => {
      if (data.location) {
        useRideStore.getState().setDriverLocation(data.location);
      }
    });

    this.socket.on('driver:arrived', () => {
      logger.info('[Socket] Driver arrived');
      analytics.track('driver_arrived');
      useRideStore.getState().updateRideStatus('arrived');
    });

    this.socket.on('ride:started', () => {
      logger.info('[Socket] Ride started');
      analytics.track('ride_started');
      useRideStore.getState().updateRideStatus('in_progress');
    });

    this.socket.on('ride:completed', (data) => {
      logger.info('[Socket] Ride completed:', data);
      analytics.track('ride_completed', { fare: data.fare });
      useRideStore.getState().setRideCompleted(data);
    });

    this.socket.on('ride:cancelled', (data) => {
      logger.info('[Socket] Ride cancelled:', data);
      analytics.track('ride_cancelled', { reason: data.reason });
      useRideStore.getState().cancelRide(data.reason);
    });

    // Error handling
    this.socket.on('error', (error) => {
      logger.error('[Socket] Error:', error);
      crashReporting.captureError(new Error('Socket error'), { error });
    });
  }

  /**
   * Setup reconnection handlers
   */
  private setupReconnectHandlers(): void {
    if (!this.socket) return;

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info('[Socket] Reconnected after', attemptNumber, 'attempts');
      analytics.track('websocket_reconnected', { attemptNumber });
      crashReporting.addBreadcrumb('WebSocket reconnected', { attemptNumber });

      // Rejoin user room
      if (this.userId) {
        this.socket?.emit('user:join', { userId: this.userId });
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      logger.info('[Socket] Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('[Socket] Reconnection failed');
      crashReporting.captureMessage('WebSocket reconnection failed', 'error');
      // Could fallback to polling here
    });
  }

  /**
   * Disconnect WebSocket and cleanup
   */
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      logger.info('[Socket] Disconnected and cleaned up');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ============ Auth ============

  async requestOTP(phone: string): Promise<{ success: boolean; expiresIn: number }> {
    try {
      const response = await this.api.post('/api/auth/request-otp', { phone });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'request_otp', phone });
      throw error;
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<{
    success: boolean;
    token: string;
    refreshToken?: string;
    user: any;
  }> {
    try {
      const response = await this.api.post('/api/auth/verify-otp', { phone, otp });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'verify_otp' });
      throw error;
    }
  }

  // ============ Rides ============

  async getEstimate(params: {
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    vehicleType: string;
  }): Promise<any> {
    try {
      const response = await this.api.get('/api/fares/estimate', { params });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'get_estimate' });
      throw error;
    }
  }

  async createRide(params: {
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    vehicleType: string;
    paymentMethod?: string;
    voucherId?: string;
  }): Promise<{ success: boolean; ride: any }> {
    try {
      analytics.track('ride_created', { vehicleType: params.vehicleType });
      const response = await this.api.post('/api/rides', params);
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'create_ride' });
      throw error;
    }
  }

  async getRide(rideId: string): Promise<any> {
    try {
      const response = await this.api.get(`/api/rides/${rideId}`);
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'get_ride', rideId });
      throw error;
    }
  }

  async getRideHistory(limit = 20, offset = 0): Promise<{ success: boolean; rides: any[] }> {
    try {
      const response = await this.api.get('/api/rides/history', { params: { limit, offset } });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'get_ride_history' });
      throw error;
    }
  }

  async cancelRide(rideId: string, reason?: string): Promise<{ success: boolean; ride: any }> {
    try {
      analytics.track('ride_cancelled_by_user', { rideId, reason });
      const response = await this.api.post(`/api/rides/${rideId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'cancel_ride', rideId });
      throw error;
    }
  }

  async rateRide(
    rideId: string,
    rating: number,
    feedback?: string
  ): Promise<{ success: boolean; ride: any }> {
    try {
      analytics.track('ride_rated', { rideId, rating });
      const response = await this.api.post(`/api/rides/${rideId}/rate`, { rating, feedback });
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'rate_ride', rideId });
      throw error;
    }
  }

  // ============ Wallet ============

  async getWalletBalance(): Promise<{
    balance: number;
    rideCredits: number;
    serviceCredits: number;
  }> {
    try {
      const response = await this.api.get('/api/vouchers/wallet');
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'get_wallet' });
      throw error;
    }
  }

  // ============ Vouchers ============

  async getUserVouchers(): Promise<{ success: boolean; vouchers: any[] }> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return { success: false, vouchers: [] };

      const response = await this.api.get(`/api/vouchers/user/${userId}`);
      return response.data;
    } catch (error) {
      crashReporting.captureError(error as Error, { context: 'get_vouchers' });
      throw error;
    }
  }
}

export const rideService = new RideService();
export default rideService;
