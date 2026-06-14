// Do App API Client
// Connects to: Auth + Profile + Wallet services

import axios, { AxiosInstance, AxiosError } from 'axios';
import { useUserStore } from '@/stores';

// ==================== SERVICE URLs ====================

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'https://rez-auth-service.onrender.com';
const PROFILE_URL = process.env.EXPO_PUBLIC_PROFILE_URL || 'https://rezprofile.onrender.com';
const WALLET_URL = process.env.EXPO_PUBLIC_WALLET_URL || 'https://rez-wallet-service-36vo.onrender.com';
const REE_URL = process.env.EXPO_PUBLIC_REE_URL || 'https://rez-economic-engine.onrender.com';

// ==================== TYPES ====================

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  name?: string;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: {
      push: boolean;
      sms: boolean;
      email: boolean;
      whatsapp: boolean;
    };
  };
  addresses: Address[];
  role: string;
  segment: string;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface WalletData {
  coins: number;
  balance: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface SubscriptionTier {
  tier: 'basic' | 'student' | 'gold' | 'pro' | 'diamond';
  benefits: string[];
  expiresAt: string;
}

export interface KarmaStatus {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  multiplier: number;
}

export interface Booking {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  dateTime: string;
  partySize?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  confirmationCode?: string;
  qrCode?: string;
}

// Combined user state from all services
export interface UserState {
  auth: AuthUser;
  profile: UserProfile;
  wallet: WalletData;
  subscription?: SubscriptionTier;
  karma: KarmaStatus;
}

// ==================== API CLIENTS ====================

class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AUTH_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  async sendOTP(phone: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/auth/otp/send', { phone });
    return response.data;
  }

  async verifyOTP(phone: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    user?: AuthUser;
  }> {
    const response = await this.client.post('/auth/otp/verify', { phone, otp });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async getMe(): Promise<AuthUser> {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }
}

class ProfileClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: PROFILE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const response = await this.client.get(`/profile/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.client.patch(`/profile/${userId}`, data);
    return response.data;
  }

  async getPreferences(userId: string): Promise<UserProfile['preferences']> {
    const response = await this.client.get(`/profile/${userId}/preferences`);
    return response.data;
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }): Promise<boolean> {
    try {
      await this.client.put(`/profile/${userId}`, data);
      return true;
    } catch (error) {
      logger.error('Failed to update profile:', error);
      return false;
    }
  }

  async updatePreferences(userId: string, data: Partial<UserProfile['preferences']>): Promise<boolean> {
    try {
      await this.client.patch(`/profile/${userId}/preferences`, data);
      return true;
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      return false;
    }
  }

  async updateStylePreferences(userId: string, stylePrefs: {
    vibes?: string[];
    occasions?: string[];
    cuisines?: string[];
  }): Promise<boolean> {
    try {
      await this.client.patch(`/profile/${userId}/style-preferences`, stylePrefs);
      return true;
    } catch (error) {
      logger.error('Failed to update style preferences:', error);
      return false;
    }
  }

  async getAddresses(userId: string): Promise<Address[]> {
    try {
      const response = await this.client.get(`/profile/${userId}/addresses`);
      return response.data?.addresses ?? [];
    } catch {
      return [];
    }
  }

  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<Address> {
    try {
      const response = await this.client.post(`/profile/${userId}/addresses`, address);
      return response.data;
    } catch (error) {
      logger.error('Failed to add address:', error);
      throw new Error('Failed to add address');
    }
  }

  async getCachedTier(userId: string): Promise<{ subscriptionTier?: string; karmaTier?: string } | null> {
    try {
      const response = await this.client.get(`/profile/${userId}/tier`);
      return response.data?.tier ?? null;
    } catch {
      return null;
    }
  }
}

class WalletClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: WALLET_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getWallet(userId: string): Promise<WalletData> {
    try {
      const response = await this.client.get(`/wallet/${userId}`);
      return response.data ?? { coins: 0, balance: 0, transactions: [] };
    } catch {
      return { coins: 0, balance: 0, transactions: [] };
    }
  }

  async getTransactions(userId: string, limit = 20): Promise<Transaction[]> {
    try {
      const response = await this.client.get(`/wallet/${userId}/transactions?limit=${limit}`);
      return response.data?.transactions ?? [];
    } catch {
      return [];
    }
  }
}

class REEClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: REE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getUserState(userId: string): Promise<{
    subscription?: SubscriptionTier;
    karma?: KarmaStatus;
    activeOffers?: string[];
  }> {
    try {
      const response = await this.client.get(`/ree/user/${userId}/state`);
      return response.data;
    } catch {
      // REE not built yet, return empty
      return {};
    }
  }

  async getSubscription(userId: string): Promise<SubscriptionTier | null> {
    try {
      const response = await this.client.get(`/ree/user/${userId}/subscription`);
      return response.data;
    } catch {
      return null;
    }
  }
}

// ==================== UNIFIED API CLIENT ====================

class UnifiedApiClient {
  auth = new AuthClient();
  profile = new ProfileClient();
  wallet = new WalletClient();
  ree = new REEClient();

  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      this.auth.setToken(token);
      this.profile.setToken(token);
      this.wallet.setToken(token);
      this.ree.setToken(token);
    }
  }

  // ==================== AUTH ====================

  async sendOTP(phone: string): Promise<{ success: boolean }> {
    return this.auth.sendOTP(phone);
  }

  async verifyOTP(phone: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    user?: AuthUser;
  }> {
    const result = await this.auth.verifyOTP(phone, otp);
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.setToken(null);
  }

  // ==================== GET COMPLETE USER STATE ====================

  /**
   * Get complete user state from all services in parallel
   * This is the recommended way to fetch user data after login
   */
  async getUserState(userId: string): Promise<UserState> {
    // Parallel calls to all services
    const [profileData, walletData, reeData] = await Promise.all([
      this.profile.getProfile(userId).catch(() => null),
      this.wallet.getWallet(userId).catch(() => null),
      this.ree.getUserState(userId).catch(() => null),
    ]);

    // Get cached tier from profile service
    const cachedTier = await this.profile.getCachedTier(userId).catch(() => null);

    return {
      auth: {
        id: userId,
        phone: '',
        email: profileData?.email,
        name: profileData?.firstName,
      },
      profile: profileData || {
        id: userId,
        preferences: {
          language: 'en',
          theme: 'light',
          notifications: { push: true, sms: true, email: true, whatsapp: false },
        },
        addresses: [],
        role: 'user',
        segment: 'normal',
      },
      wallet: walletData || { coins: 0, balance: 0, transactions: [] },
      subscription: reeData?.subscription || undefined,
      karma: {
        tier: (cachedTier?.karmaTier as KarmaStatus['tier']) || 'bronze',
        points: 0,
        multiplier: 1,
      },
    };
  }

  // ==================== PROFILE ====================

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profile.getProfile(userId);
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.profile.updateProfile(userId, data);
  }

  async getPreferences(userId: string) {
    return this.profile.getPreferences(userId);
  }

  async updatePreferences(userId: string, data: Partial<UserProfile['preferences']>) {
    return this.profile.updatePreferences(userId, data);
  }

  async getAddresses(userId: string) {
    return this.profile.getAddresses(userId);
  }

  async addAddress(userId: string, address: Omit<Address, 'id'>) {
    return this.profile.addAddress(userId, address);
  }

  // ==================== WALLET ====================

  async getWallet(userId: string): Promise<WalletData | null> {
    return this.wallet.getWallet(userId);
  }

  async getTransactions(userId: string, limit = 20) {
    return this.wallet.getTransactions(userId, limit);
  }

  // ==================== REE ====================

  async getSubscription(userId: string) {
    return this.ree.getSubscription(userId);
  }

  async getUserREEState(userId: string) {
    return this.ree.getUserState(userId);
  }

  // ==================== GENERIC HTTP METHODS ====================

  /**
   * Generic POST request with auth token
   */
  async post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await axios.post<T>(endpoint, data, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch (error) {
      logger.error(`POST ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Generic PUT request with auth token
   */
  async put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await axios.put<T>(endpoint, data, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch (error) {
      logger.error(`PUT ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Generic PATCH request with auth token
   */
  async patch<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await axios.patch<T>(endpoint, data, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch (error) {
      logger.error(`PATCH ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request with auth token
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    try {
      const response = await axios.delete<T>(endpoint, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch (error) {
      logger.error(`DELETE ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Request failed';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }

  // ==================== CHAT ====================

  async sendMessage(params: {
    sessionId: string;
    message: string;
    location?: { lat: number; lng: number };
  }): Promise<{ messages: Array<{ id: string; content: string; timestamp: string }> }> {
    const response = await axios.post('/do/chat/message', params, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    return response.data;
  }

  async getChatHistory(sessionId: string): Promise<{ messages: unknown[] }> {
    const response = await axios.get(`/do/chat/history?sessionId=${sessionId}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    return response.data;
  }

  // ==================== DISCOVERY ====================

  async getTrending(lat: number, lng: number): Promise<Entity[]> {
    try {
      const response = await axios.get('/discovery/trending', {
        params: { lat, lng },
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data.items || [];
    } catch {
      return [];
    }
  }

  async getNearby(params: { lat: number; lng: number; limit?: number }): Promise<Entity[]> {
    try {
      const response = await axios.get('/discovery/nearby', {
        params,
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data.items || [];
    } catch {
      return [];
    }
  }

  async getMoodDiscovery(moodId: string, lat?: number, lng?: number): Promise<{ items: Entity[] }> {
    try {
      const response = await axios.get('/discovery/mood', {
        params: { mood: moodId, lat, lng },
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch {
      return { items: [] };
    }
  }

  // ==================== BOOKINGS ====================

  async getBookings(): Promise<Booking[]> {
    try {
      const response = await axios.get('/bookings', {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data.bookings || [];
    } catch {
      return [];
    }
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const response = await axios.get(`/bookings/${bookingId}`, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch {
      return null;
    }
  }

  // ==================== PUSH NOTIFICATIONS ====================

  async registerPushToken(token: string): Promise<void> {
    try {
      await axios.post('/notifications/register-token', { token }, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
    } catch (error) {
      logger.error('Failed to register push token:', error);
    }
  }

  // ==================== WALLET ====================

  async getKarmaStatus(): Promise<{
    tier: string;
    points: number;
    multiplier: number;
    nextTier: { pointsRequired: number };
  }> {
    try {
      const response = await axios.get('/wallet/karma', {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      });
      return response.data;
    } catch {
      return { tier: 'bronze', points: 0, multiplier: 1, nextTier: { pointsRequired: 1000 } };
    }
  }
}

// Export singleton
export const rezApi = new UnifiedApiClient();
export default rezApi;

// Re-export REZ Mind service
export { rezMind } from './rezMindService';
export type { DormantStatus, BehavioralProfile, Recommendation } from './rezMindService';

