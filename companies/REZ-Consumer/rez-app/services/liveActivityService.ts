/**
 * Live Activity Service
 * Real-time WebSocket connection using Socket.IO for live data
 */

import { io, Socket } from 'socket.io-client';
import apiClient from './apiClient';
import { logger } from '@/utils/logger';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'https://REZ-realtime.onrender.com';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface LiveActivity {
  id: string;
  type: 'order' | 'purchase' | 'review' | 'checkin' | 'deal' | 'signup';
  city: string;
  count: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LiveMerchantData {
  id: string;
  name: string;
  occupancy: number;
  waitTime: number;
  peopleBuyingNow: number;
  trendingItems: string[];
  flashDeal?: {
    discount: number;
    endsAt: string;
  };
  lastUpdated?: string;
}

export interface TrendingItem {
  id: string;
  name: string;
  category: string;
  orderCount: number;
  trend: 'up' | 'down' | 'stable';
  price: number;
  cashback: number;
  city?: string;
}

export interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: 'bought' | 'reviewed' | 'saved' | 'visited' | 'shared';
  itemName: string;
  itemImage?: string;
  itemPrice?: number;
  storeName?: string;
  cashback?: number;
  timestamp: string;
}

class LiveActivityService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private userId: string | null = null;
  private isConnected = false;

  connect(userId: string) {
    this.userId = userId;

    if (this.socket?.connected) {
      return;
    }

    // Disconnect existing socket
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        query: { userId },
      });

      this.socket.on('connect', () => {
        logger.debug('[LiveActivity] Connected:', { socketId: this.socket?.id });
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribe(['activity', 'merchants', 'trending', 'social']);
      });

      this.socket.on('disconnect', (reason) => {
        logger.debug('[LiveActivity] Disconnected:', { reason });
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        logger.error('[LiveActivity] Connection error:', error.message);
      });

      // Handle incoming messages
      this.socket.on('activity', (data) => this.handleMessage('activity', data));
      this.socket.on('merchants', (data) => this.handleMessage('merchants', data));
      this.socket.on('trending', (data) => this.handleMessage('trending', data));
      this.socket.on('social', (data) => this.handleMessage('social', data));

      // Handle direct responses
      this.socket.on('activities', (data) => this.handleMessage('activities', data));
      this.socket.on('trendingItems', (data) => this.handleMessage('trending', data));
      this.socket.on('merchantLive', (data) => this.handleMessage('merchantLive', data));
    } catch (error) {
      logger.error('[LiveActivity] Connection failed:', error);
      // Fallback to REST API
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private subscribe(channels: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channels });
    }
  }

  private handleMessage(channel: string, data: unknown) {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  on(channel: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    return () => {
      this.listeners.get(channel)?.delete(callback);
    };
  }

  off(channel: string, callback: (data: unknown) => void) {
    this.listeners.get(channel)?.delete(callback);
  }

  // Request data
  requestActivities(options?: { city?: string; type?: string; limit?: number }) {
    if (this.socket?.connected) {
      this.socket.emit('getActivities', options || {});
    }
  }

  requestTrending(options?: { city?: string; category?: string; limit?: number }) {
    if (this.socket?.connected) {
      this.socket.emit('getTrending', options || {});
    }
  }

  requestMerchantLive(merchantId: string) {
    if (this.socket?.connected) {
      this.socket.emit('getMerchantLive', { merchantId });
    }
  }

  get connectionStatus() {
    return this.isConnected;
  }

  // REST API Fallbacks
  async getActivities(options?: { city?: string; type?: string; limit?: number }): Promise<LiveActivity[]> {
    try {
      const response = await apiClient.get<{ activities: LiveActivity[] }>('/live/activities', options);
      if (response.success && response.data) {
        return response.data.activities || [];
      }
    } catch {
      // Fallback to mock data
    }
    return this.getMockActivities();
  }

  async getTrendingItems(options?: { city?: string; category?: string; limit?: number }): Promise<TrendingItem[]> {
    try {
      const response = await apiClient.get<{ items: TrendingItem[] }>('/live/trending', options);
      if (response.success && response.data) {
        return response.data.items || [];
      }
    } catch {
      // Fallback to mock data
    }
    return this.getMockTrendingItems();
  }

  async getMerchantLiveData(merchantId: string): Promise<LiveMerchantData | null> {
    try {
      const response = await apiClient.get<LiveMerchantData>(`/live/merchant/${merchantId}`);
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      // Fallback to mock data
    }
    return this.getMockMerchantData(merchantId);
  }

  async getFriendsActivity(): Promise<FriendActivity[]> {
    try {
      const response = await apiClient.get<{ activities: FriendActivity[] }>('/social/friends/activity');
      if (response.success && response.data) {
        return response.data.activities || [];
      }
    } catch {
      // Fallback to mock data
    }
    return this.getMockFriendsActivity();
  }

  // Mock data for development
  private getMockActivities(): LiveActivity[] {
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];
    const types: LiveActivity['type'][] = ['order', 'purchase', 'review', 'checkin', 'deal'];

    return Array.from({ length: 20 }, (_, i) => ({
      id: `activity-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      count: Math.floor(Math.random() * 50) + 1,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
  }

  private getMockTrendingItems(): TrendingItem[] {
    return [
      { id: '1', name: 'Nike Air Max 270', category: 'Footwear', orderCount: 156, trend: 'up', price: 4999, cashback: 15 },
      { id: '2', name: 'iPhone 15 Case', category: 'Accessories', orderCount: 234, trend: 'up', price: 299, cashback: 10 },
      { id: '3', name: 'Whey Protein 2kg', category: 'Health', orderCount: 89, trend: 'stable', price: 1299, cashback: 20 },
      { id: '4', name: 'Coffee Beans 500g', category: 'Food', orderCount: 67, trend: 'down', price: 499, cashback: 12 },
      { id: '5', name: 'Yoga Mat Premium', category: 'Fitness', orderCount: 123, trend: 'up', price: 799, cashback: 18 },
      { id: '6', name: 'Samsung Earbuds', category: 'Electronics', orderCount: 198, trend: 'up', price: 2499, cashback: 12 },
      { id: '7', name: 'Running Shoes', category: 'Footwear', orderCount: 145, trend: 'up', price: 2999, cashback: 14 },
      { id: '8', name: 'Organic Face Cream', category: 'Beauty', orderCount: 78, trend: 'stable', price: 599, cashback: 15 },
      { id: '9', name: 'LED Desk Lamp', category: 'Home', orderCount: 56, trend: 'up', price: 899, cashback: 10 },
      { id: '10', name: 'Protein Bar Pack', category: 'Health', orderCount: 201, trend: 'up', price: 399, cashback: 22 },
    ];
  }

  private getMockMerchantData(merchantId: string): LiveMerchantData {
    return {
      id: merchantId,
      name: 'Popular Store',
      occupancy: Math.floor(Math.random() * 100),
      waitTime: Math.floor(Math.random() * 30),
      peopleBuyingNow: Math.floor(Math.random() * 20),
      trendingItems: ['Item 1', 'Item 2', 'Item 3'],
      flashDeal: Math.random() > 0.5 ? {
        discount: 25,
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      } : undefined,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getMockFriendsActivity(): FriendActivity[] {
    return [
      { id: '1', userId: 'u1', userName: 'Priya S.', action: 'bought', itemName: 'Nike Air Max', itemPrice: 4999, timestamp: '5 min ago' },
      { id: '2', userId: 'u2', userName: 'Rahul K.', action: 'reviewed', itemName: 'Protein Powder', itemPrice: 1299, timestamp: '12 min ago' },
      { id: '3', userId: 'u3', userName: 'Anita M.', action: 'saved', itemName: 'Yoga Mat', itemPrice: 799, timestamp: '25 min ago' },
      { id: '4', userId: 'u4', userName: 'Vikram J.', action: 'visited', itemName: 'Coffee Shop', storeName: 'Cafe Mocha', timestamp: '1 hour ago' },
    ];
  }
}

export const liveActivityService = new LiveActivityService();
export default liveActivityService;
