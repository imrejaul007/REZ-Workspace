// @ts-nocheck
// Unified API Client - Connects to all services
// Consumer App uses this to get user state from Auth, Profile, Wallet, REE

import axios, { AxiosInstance } from 'axios';

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const PROFILE_URL = process.env.EXPO_PUBLIC_PROFILE_SERVICE_URL || 'https://rezprofile.onrender.com';
const WALLET_URL = process.env.EXPO_PUBLIC_WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';
const REE_URL = process.env.EXPO_PUBLIC_ECONOMIC_ENGINE_URL || 'https://rez-economic-engine.onrender.com';

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
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
    notifications: { push: boolean; sms: boolean; email: boolean; whatsapp: boolean };
  };
  addresses: unknown[];
  role: string;
  segment: string;
}

export interface WalletData {
  coins: number;
  balance: number;
  transactions: unknown[];
}

export interface KarmaStatus {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  multiplier: number;
}

export interface UserState {
  auth: AuthUser;
  profile: UserProfile | null;
  wallet: WalletData | null;
  karma: KarmaStatus;
}

// Auth Client
class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: AUTH_URL, timeout: 10000 });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async sendOTP(phone: string) {
    const res = await this.client.post('/auth/otp/send', { phone });
    return res.data;
  }

  async verifyOTP(phone: string, otp: string) {
    const res = await this.client.post('/auth/otp/verify', { phone, otp });
    return res.data;
  }

  async getMe(): Promise<AuthUser> {
    const res = await this.client.get('/auth/me');
    return res.data.user;
  }
}

// Profile Client
class ProfileClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: PROFILE_URL, timeout: 10000 });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const res = await this.client.get(`/profile/${userId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    const res = await this.client.patch(`/profile/${userId}`, data);
    return res.data;
  }

  async getPreferences(userId: string) {
    try {
      const res = await this.client.get(`/profile/${userId}/preferences`);
      return res.data;
    } catch {
      return null;
    }
  }

  async updatePreferences(userId: string, data) {
    const res = await this.client.patch(`/profile/${userId}/preferences`, data);
    return res.data;
  }

  async getAddresses(userId: string) {
    try {
      const res = await this.client.get(`/profile/${userId}/addresses`);
      return res.data.addresses || [];
    } catch {
      return [];
    }
  }

  async addAddress(userId: string, address) {
    const res = await this.client.post(`/profile/${userId}/addresses`, address);
    return res.data;
  }
}

// Wallet Client
class WalletClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: WALLET_URL, timeout: 10000 });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getWallet(userId: string): Promise<WalletData | null> {
    try {
      const res = await this.client.get(`/wallet/${userId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  async getTransactions(userId: string, limit = 20) {
    try {
      const res = await this.client.get(`/wallet/${userId}/transactions?limit=${limit}`);
      return res.data.transactions || [];
    } catch {
      return [];
    }
  }
}

// Unified API Client
class UnifiedApiClient {
  auth = new AuthClient();
  profile = new ProfileClient();
  wallet = new WalletClient();

  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      this.auth.setToken(token);
      this.profile.setToken(token);
      this.wallet.setToken(token);
    }
  }

  // Get complete user state from all services in parallel
  async getUserState(userId: string): Promise<UserState> {
    const [profile, wallet] = await Promise.all([
      this.profile.getProfile(userId),
      this.wallet.getWallet(userId),
    ]);

    return {
      auth: { id: userId, phone: '' },
      profile,
      wallet,
      karma: {
        tier: 'bronze',
        points: 0,
        multiplier: 1,
      },
    };
  }
}

export const unifiedApi = new UnifiedApiClient();
export default unifiedApi;
