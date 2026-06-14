/**
 * REZ Restaurant OS - Unified SDK
 * Single SDK for all restaurant services
 */

import axios, { AxiosInstance } from 'axios';

// =============================================================================
// Configuration
// =============================================================================

export interface RestaurantSDKConfig {
  baseURL?: string;
  apiKey?: string;
  internalToken?: string;
  timeout?: number;
}

export interface RestaurantClients {
  main: MainClient;
  pos: POSClient;
  kds: KDSClient;
  orders: OrdersClient;
  analytics: AnalyticsClient;
  loyalty: LoyaltyClient;
  inventory: InventoryClient;
}

// =============================================================================
// Base Client
// =============================================================================

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: RestaurantSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.internalToken && { 'X-Internal-Token': config.internalToken }),
      },
    });
  }

  protected async get<T>(path: string, params?: object): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.post(path, data);
    return response.data;
  }

  protected async patch<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.patch(path, data);
    return response.data;
  }
}

// =============================================================================
// Main Restaurant Client
// =============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string[];
  rating: number;
}

export class MainClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4101', config);
  }

  async getRestaurant(id: string): Promise<Restaurant> {
    return this.get(`/api/restaurants/${id}`);
  }

  async getMenu(restaurantId: string): Promise<MenuItem[]> {
    return this.get(`/api/restaurants/${restaurantId}/menu`);
  }

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    return this.patch(`/api/menu/${id}`, data);
  }
}

// =============================================================================
// POS Client
// =============================================================================

export interface Order {
  id: string;
  tableId?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
  total: number;
  createdAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export class POSClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4102', config);
  }

  async createOrder(data: { tableId?: string; items: OrderItem[] }): Promise<Order> {
    return this.post('/api/orders', data);
  }

  async getOrder(id: string): Promise<Order> {
    return this.get(`/api/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await this.patch(`/api/orders/${id}/status`, { status });
  }

  async processPayment(id: string, method: 'card' | 'upi' | 'cash'): Promise<void> {
    await this.post(`/api/orders/${id}/pay`, { method });
  }
}

// =============================================================================
// KDS Client
// =============================================================================

export interface KitchenTicket {
  id: string;
  orderId: string;
  items: KitchenItem[];
  priority: 'normal' | 'rush';
  status: 'pending' | 'cooking' | 'ready';
  createdAt: Date;
}

export interface KitchenItem {
  name: string;
  quantity: number;
  notes?: string;
}

export class KDSClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4103', config);
  }

  async getTickets(status?: string): Promise<KitchenTicket[]> {
    return this.get('/api/tickets', { status });
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    await this.patch(`/api/tickets/${id}`, { status });
  }

  async bumpTicket(id: string): Promise<void> {
    await this.post(`/api/tickets/${id}/bump`);
  }
}

// =============================================================================
// Orders/Reservations Client
// =============================================================================

export interface Reservation {
  id: string;
  guestName: string;
  guestPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'seated';
}

export class OrdersClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4104', config);
  }

  async createReservation(data: Partial<Reservation>): Promise<Reservation> {
    return this.post('/api/reservations', data);
  }

  async getReservation(id: string): Promise<Reservation> {
    return this.get(`/api/reservations/${id}`);
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
    return this.patch(`/api/reservations/${id}`, data);
  }

  async cancelReservation(id: string): Promise<void> {
    await this.post(`/api/reservations/${id}/cancel`);
  }

  async getAvailableSlots(date: string, partySize: number): Promise<string[]> {
    return this.get('/api/reservations/slots', { date, partySize });
  }
}

// =============================================================================
// Analytics Client
// =============================================================================

export interface RestaurantMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgWaitTime: number;
  popularItems: MenuItem[];
}

export class AnalyticsClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4106', config);
  }

  async getMetrics(restaurantId: string, period: 'day' | 'week' | 'month'): Promise<RestaurantMetrics> {
    return this.get('/api/metrics', { restaurantId, period });
  }

  async getPopularItems(restaurantId: string, limit: number = 10): Promise<MenuItem[]> {
    return this.get(`/api/analytics/popular`, { restaurantId, limit });
  }
}

// =============================================================================
// Loyalty Client
// =============================================================================

export interface LoyaltyMember {
  id: string;
  guestId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalVisits: number;
}

export class LoyaltyClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4108', config);
  }

  async getMember(guestId: string): Promise<LoyaltyMember> {
    return this.get(`/api/loyalty/${guestId}`);
  }

  async addPoints(guestId: string, points: number): Promise<void> {
    await this.post(`/api/loyalty/${guestId}/add`, { points });
  }

  async redeemPoints(guestId: string, points: number): Promise<void> {
    await this.post(`/api/loyalty/${guestId}/redeem`, { points });
  }
}

// =============================================================================
// Inventory Client
// =============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  expiryDate?: Date;
}

export class InventoryClient extends BaseClient {
  constructor(config: RestaurantSDKConfig) {
    super(config.baseURL || 'http://localhost:4110', config);
  }

  async getItems(): Promise<InventoryItem[]> {
    return this.get('/api/inventory');
  }

  async updateQuantity(id: string, quantity: number): Promise<void> {
    await this.patch(`/api/inventory/${id}`, { quantity });
  }

  async getLowStock(): Promise<InventoryItem[]> {
    return this.get('/api/inventory/low-stock');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createRestaurantSDK(config: RestaurantSDKConfig = {}): RestaurantClients {
  return {
    main: new MainClient(config),
    pos: new POSClient(config),
    kds: new KDSClient(config),
    orders: new OrdersClient(config),
    analytics: new AnalyticsClient(config),
    loyalty: new LoyaltyClient(config),
    inventory: new InventoryClient(config),
  };
}

export default createRestaurantSDK;
