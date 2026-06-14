/**
 * Go4Food API - REZ Merchant Service
 * Integration with REZ Merchant for restaurant and menu data
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { Restaurant, MenuItem } from '../types/index.js';

interface MerchantRestaurant {
  id: string;
  name: string;
  description: string;
  image?: string;
  cuisines: string[];
  rating?: number;
  deliveryTime?: number;
  priceForTwo?: number;
  address?: string;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  isPureVeg?: boolean;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MerchantMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  rating?: number;
  calories?: number;
  dietary?: string[];
  allergens?: string[];
  customizations?: {
    id: string;
    name: string;
    options: { id: string; name: string; price: number }[];
    required: boolean;
    maxSelect: number;
  }[];
}

interface MerchantOrder {
  id: string;
  restaurantId: string;
  customerId: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    customizations?: Record<string, string>;
  }[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryAddress?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

class RezMerchantService {
  private client: AxiosInstance;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: config.rezMerchant.baseUrl,
      timeout: config.rezMerchant.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.rezMerchant.internalToken,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('REZ Merchant API error', {
          message: error.message,
          url: error.config?.url,
          status: error.response?.status,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get cache value or return null if expired/missing
   */
  private getCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Set cache value with TTL (default 5 minutes)
   */
  private setCache(key: string, data: unknown, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  /**
   * Transform REZ Merchant restaurant to Go4Food format
   */
  private transformRestaurant(merchant: MerchantRestaurant): Restaurant {
    return {
      id: merchant.id,
      name: merchant.name,
      description: merchant.description || '',
      image: merchant.image || '',
      cuisines: merchant.cuisines || [],
      rating: merchant.rating || 0,
      deliveryTime: merchant.deliveryTime || 30,
      priceForTwo: merchant.priceForTwo || 0,
      address: merchant.address || '',
      city: merchant.city || '',
      area: merchant.area || '',
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      isOpen: merchant.isOpen ?? true,
      isPureVeg: merchant.isPureVeg ?? false,
      source: 'internal',
    };
  }

  /**
   * Transform REZ Merchant menu item to Go4Food format
   */
  private transformMenuItem(merchant: MerchantMenuItem): MenuItem {
    return {
      id: merchant.id,
      restaurantId: merchant.restaurantId,
      name: merchant.name,
      description: merchant.description || '',
      price: merchant.price,
      image: merchant.image,
      category: merchant.category,
      isVeg: merchant.isVeg ?? true,
      isAvailable: merchant.isAvailable ?? true,
      rating: merchant.rating,
      calories: merchant.calories,
      dietary: (merchant.dietary as MenuItem['dietary']) || [],
      customizations: merchant.customizations?.map(c => ({
        id: c.id,
        name: c.name,
        options: c.options,
        required: c.required,
        maxSelect: c.maxSelect,
      })),
      source: 'internal',
    };
  }

  // ==================== RESTAURANT METHODS ====================

  /**
   * Get all restaurants from REZ Merchant
   */
  async getRestaurants(options?: {
    city?: string;
    area?: string;
    cuisine?: string;
    page?: number;
    limit?: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const cacheKey = `restaurants:${JSON.stringify(options)}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      logger.info('REZ Merchant: Using cached restaurants');
      return cached as { restaurants: Restaurant[]; total: number };
    }

    try {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.area) params.append('area', options.area);
      if (options?.cuisine) params.append('cuisine', options.cuisine);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.client.get(`/api/restaurants?${params.toString()}`);
      const merchants: MerchantRestaurant[] = response.data.restaurants || response.data.data || [];

      const result = {
        restaurants: merchants.map(m => this.transformRestaurant(m)),
        total: response.data.total || merchants.length,
      };

      this.setCache(cacheKey, result, 5 * 60 * 1000);
      return result;
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch restaurants', { error });
      return { restaurants: [], total: 0 };
    }
  }

  /**
   * Get restaurant by ID from REZ Merchant
   */
  async getRestaurant(restaurantId: string): Promise<Restaurant | null> {
    const cacheKey = `restaurant:${restaurantId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached as Restaurant;
    }

    try {
      const response = await this.client.get(`/api/restaurants/${restaurantId}`);
      const merchant: MerchantRestaurant = response.data.restaurant || response.data.data;

      if (!merchant) return null;

      const restaurant = this.transformRestaurant(merchant);
      this.setCache(cacheKey, restaurant, 10 * 60 * 1000);
      return restaurant;
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch restaurant', { restaurantId, error });
      return null;
    }
  }

  /**
   * Search restaurants by name or cuisine
   */
  async searchRestaurants(query: string, options?: {
    city?: string;
    cuisines?: string[];
    minRating?: number;
    isPureVeg?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      if (options?.city) params.append('city', options.city);
      if (options?.cuisines?.length) params.append('cuisines', options.cuisines.join(','));
      if (options?.minRating) params.append('minRating', options.minRating.toString());
      if (options?.isPureVeg) params.append('pureVeg', 'true');
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.client.get(`/api/restaurants/search?${params.toString()}`);
      const merchants: MerchantRestaurant[] = response.data.restaurants || response.data.data || [];

      return {
        restaurants: merchants.map(m => this.transformRestaurant(m)),
        total: response.data.total || merchants.length,
      };
    } catch (error) {
      logger.error('REZ Merchant: Failed to search restaurants', { query, error });
      return { restaurants: [], total: 0 };
    }
  }

  // ==================== MENU METHODS ====================

  /**
   * Get menu for a restaurant from REZ Merchant
   */
  async getMenu(restaurantId: string, options?: {
    category?: string;
    isVeg?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: MenuItem[]; total: number }> {
    const cacheKey = `menu:${restaurantId}:${JSON.stringify(options)}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached as { items: MenuItem[]; total: number };
    }

    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.isVeg) params.append('veg', 'true');
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.client.get(`/api/restaurants/${restaurantId}/menu?${params.toString()}`);
      const merchants: MerchantMenuItem[] = response.data.menu || response.data.items || response.data.data || [];

      const result = {
        items: merchants.map(m => this.transformMenuItem(m)),
        total: response.data.total || merchants.length,
      };

      this.setCache(cacheKey, result, 3 * 60 * 1000);
      return result;
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch menu', { restaurantId, error });
      return { items: [], total: 0 };
    }
  }

  /**
   * Get menu item by ID
   */
  async getMenuItem(restaurantId: string, itemId: string): Promise<MenuItem | null> {
    const cacheKey = `menu-item:${itemId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached as MenuItem;
    }

    try {
      const response = await this.client.get(`/api/restaurants/${restaurantId}/menu/${itemId}`);
      const merchant: MerchantMenuItem = response.data.item || response.data;

      if (!merchant) return null;

      const item = this.transformMenuItem(merchant);
      this.setCache(cacheKey, item, 5 * 60 * 1000);
      return item;
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch menu item', { itemId, error });
      return null;
    }
  }

  /**
   * Get all categories for a restaurant
   */
  async getCategories(restaurantId: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/api/restaurants/${restaurantId}/categories`);
      return response.data.categories || response.data || [];
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch categories', { restaurantId, error });
      return [];
    }
  }

  // ==================== ORDER METHODS ====================

  /**
   * Create order in REZ Merchant
   */
  async createOrder(orderData: {
    restaurantId: string;
    customerId: string;
    items: { menuItemId: string; quantity: number; customizations?: Record<string, string> }[];
    deliveryAddress?: string;
    customerPhone?: string;
  }): Promise<MerchantOrder | null> {
    try {
      const response = await this.client.post('/api/orders', orderData);
      logger.info('REZ Merchant: Order created', { orderId: response.data.id });
      return response.data.order || response.data;
    } catch (error) {
      logger.error('REZ Merchant: Failed to create order', { error });
      return null;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<MerchantOrder | null> {
    try {
      const response = await this.client.get(`/api/orders/${orderId}`);
      return response.data.order || response.data;
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch order', { orderId, error });
      return null;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: MerchantOrder['status']): Promise<boolean> {
    try {
      await this.client.patch(`/api/orders/${orderId}`, { status });
      // Clear order cache
      this.cache.delete(`order:${orderId}`);
      return true;
    } catch (error) {
      logger.error('REZ Merchant: Failed to update order', { orderId, status, error });
      return false;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId: string, options?: {
    status?: MerchantOrder['status'];
    page?: number;
    limit?: number;
  }): Promise<MerchantOrder[]> {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      if (options?.status) params.append('status', options.status);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.client.get(`/api/orders?${params.toString()}`);
      return response.data.orders || response.data || [];
    } catch (error) {
      logger.error('REZ Merchant: Failed to fetch customer orders', { customerId, error });
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('REZ Merchant cache cleared');
  }

  /**
   * Health check for REZ Merchant connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      logger.warn('REZ Merchant health check failed', { error });
      return false;
    }
  }
}

export const rezMerchantService = new RezMerchantService();