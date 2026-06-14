/**
 * REZ Hotel OS - Unified SDK
 * Single SDK for all hotel services
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// =============================================================================
// Client Configuration
// =============================================================================

export interface HotelSDKConfig {
  baseURL?: string;
  apiKey?: string;
  internalToken?: string;
  timeout?: number;
}

export interface ServiceClients {
  booking: BookingClient;
  staybot: StaybotClient;
  housekeeping: HousekeepingClient;
  payments: PaymentClient;
  reviews: ReviewClient;
  analytics: AnalyticsClient;
  guest: GuestClient;
  channel: ChannelClient;
}

// =============================================================================
// Base Client
// =============================================================================

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: HotelSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.internalToken && { 'X-Internal-Token': config.internalToken }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[${baseURL}] Error:`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
}

// =============================================================================
// Booking Client
// =============================================================================

export interface Booking {
  id: string;
  hotelId: string;
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  source: 'direct' | 'ota' | 'channel';
}

export class BookingClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4801', config);
  }

  async createBooking(data: Partial<Booking>): Promise<Booking> {
    const response = await this.client.post('/api/bookings', data);
    return response.data;
  }

  async getBooking(id: string): Promise<Booking> {
    const response = await this.client.get(`/api/bookings/${id}`);
    return response.data;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const response = await this.client.patch(`/api/bookings/${id}`, data);
    return response.data;
  }

  async cancelBooking(id: string): Promise<void> {
    await this.client.post(`/api/bookings/${id}/cancel`);
  }

  async checkIn(guestId: string, bookingId: string): Promise<void> {
    await this.client.post(`/api/bookings/${bookingId}/checkin`, { guestId });
  }

  async checkOut(guestId: string, bookingId: string): Promise<void> {
    await this.client.post(`/api/bookings/${bookingId}/checkout`, { guestId });
  }
}

// =============================================================================
// Staybot Client (AI Chatbot)
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class StaybotClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4840', config);
  }

  async sendMessage(guestId: string, message: string): Promise<string> {
    const response = await this.client.post('/api/chat', {
      guestId,
      message,
    });
    return response.data.reply;
  }

  async getConversation(guestId: string): Promise<ChatMessage[]> {
    const response = await this.client.get(`/api/conversations/${guestId}`);
    return response.data.messages;
  }

  async getPreferences(guestId: string): Promise<Record<string, any>> {
    const response = await this.client.get(`/api/preferences/${guestId}`);
    return response.data;
  }

  async updatePreferences(guestId: string, preferences: Record<string, any>): Promise<void> {
    await this.client.patch(`/api/preferences/${guestId}`, preferences);
  }
}

// =============================================================================
// Housekeeping Client
// =============================================================================

export interface HousekeepingTask {
  id: string;
  roomId: string;
  type: 'cleaning' | 'maintenance' | 'turndown' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  scheduledTime?: Date;
}

export class HousekeepingClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4830', config);
  }

  async createTask(data: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
    const response = await this.client.post('/api/tasks', data);
    return response.data;
  }

  async getTasks(filters?: {
    status?: string;
    roomId?: string;
    priority?: string;
  }): Promise<HousekeepingTask[]> {
    const response = await this.client.get('/api/tasks', { params: filters });
    return response.data;
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    await this.client.patch(`/api/tasks/${id}`, { status });
  }

  async assignTask(id: string, staffId: string): Promise<void> {
    await this.client.patch(`/api/tasks/${id}/assign`, { staffId });
  }

  async getRoomStatus(roomId: string): Promise<string> {
    const response = await this.client.get(`/api/rooms/${roomId}/status`);
    return response.data.status;
  }
}

// =============================================================================
// Payment Client
// =============================================================================

export interface Payment {
  id: string;
  bookingId: string;
  guestId: string;
  amount: number;
  method: 'card' | 'upi' | 'wallet' | 'cash';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transactionId?: string;
}

export class PaymentClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4870', config);
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const response = await this.client.post('/api/payments', data);
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await this.client.get(`/api/payments/${id}`);
    return response.data;
  }

  async refundPayment(id: string, amount?: number): Promise<void> {
    await this.client.post(`/api/payments/${id}/refund`, { amount });
  }

  async getWalletBalance(guestId: string): Promise<number> {
    const response = await this.client.get(`/api/wallet/${guestId}/balance`);
    return response.data.balance;
  }

  async addToWallet(guestId: string, amount: number): Promise<void> {
    await this.client.post(`/api/wallet/${guestId}/add`, { amount });
  }
}

// =============================================================================
// Review Client
// =============================================================================

export interface Review {
  id: string;
  bookingId: string;
  guestId: string;
  rating: number;
  category: 'service' | 'cleanliness' | 'amenities' | 'food';
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export class ReviewClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4820', config);
  }

  async createReview(data: Partial<Review>): Promise<Review> {
    const response = await this.client.post('/api/reviews', data);
    return response.data;
  }

  async getReviews(hotelId: string): Promise<Review[]> {
    const response = await this.client.get('/api/reviews', {
      params: { hotelId },
    });
    return response.data;
  }

  async respondToReview(id: string, response: string): Promise<void> {
    await this.client.post(`/api/reviews/${id}/respond`, { response });
  }

  async getNPS(hotelId: string): Promise<number> {
    const response = await this.client.get('/api/analytics/nps', {
      params: { hotelId },
    });
    return response.data.score;
  }
}

// =============================================================================
// Analytics Client
// =============================================================================

export interface HotelMetrics {
  occupancyRate: number;
  revPAR: number;
  avgDailyRate: number;
  totalBookings: number;
  totalRevenue: number;
  npsScore: number;
  pendingTasks: number;
}

export class AnalyticsClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4804', config);
  }

  async getMetrics(hotelId: string, period: 'day' | 'week' | 'month'): Promise<HotelMetrics> {
    const response = await this.client.get('/api/metrics', {
      params: { hotelId, period },
    });
    return response.data;
  }

  async getOccupancy(hotelId: string, date: string): Promise<number> {
    const response = await this.client.get('/api/analytics/occupancy', {
      params: { hotelId, date },
    });
    return response.data.occupancyRate;
  }

  async getRevenue(hotelId: string, period: 'day' | 'week' | 'month'): Promise<number> {
    const response = await this.client.get('/api/analytics/revenue', {
      params: { hotelId, period },
    });
    return response.data.revenue;
  }
}

// =============================================================================
// Guest Client
// =============================================================================

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: Record<string, any>;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalStays: number;
}

export class GuestClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4801/guest', config);
  }

  async getGuest(id: string): Promise<Guest> {
    const response = await this.client.get(`/api/guests/${id}`);
    return response.data;
  }

  async updatePreferences(id: string, preferences: Record<string, any>): Promise<void> {
    await this.client.patch(`/api/guests/${id}/preferences`, preferences);
  }

  async getHistory(id: string): Promise<Booking[]> {
    const response = await this.client.get(`/api/guests/${id}/history`);
    return response.data;
  }

  async getMemory(id: string): Promise<Record<string, any>> {
    const response = await this.client.get(`/api/guests/${id}/memory`);
    return response.data;
  }
}

// =============================================================================
// Channel Manager Client
// =============================================================================

export interface ChannelConnection {
  id: string;
  channel: 'booking.com' | 'makemytrip' | 'oyo' | 'agoda' | 'airbnb';
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
}

export class ChannelClient extends BaseClient {
  constructor(config: HotelSDKConfig) {
    super(config.baseURL || 'http://localhost:4860', config);
  }

  async getConnections(hotelId: string): Promise<ChannelConnection[]> {
    const response = await this.client.get('/api/channels', {
      params: { hotelId },
    });
    return response.data;
  }

  async syncChannel(hotelId: string, channelId: string): Promise<void> {
    await this.client.post(`/api/channels/${channelId}/sync`, { hotelId });
  }

  async getInventory(hotelId: string, date: string): Promise<Record<string, number>> {
    const response = await this.client.get('/api/inventory', {
      params: { hotelId, date },
    });
    return response.data;
  }

  async updateInventory(hotelId: string, roomId: string, date: string, available: number): Promise<void> {
    await this.client.patch('/api/inventory', {
      hotelId,
      roomId,
      date,
      available,
    });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create all hotel service clients
 */
export function createHotelSDK(config: HotelSDKConfig = {}): ServiceClients {
  return {
    booking: new BookingClient(config),
    staybot: new StaybotClient(config),
    housekeeping: new HousekeepingClient(config),
    payments: new PaymentClient(config),
    reviews: new ReviewClient(config),
    analytics: new AnalyticsClient(config),
    guest: new GuestClient(config),
    channel: new ChannelClient(config),
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default createHotelSDK;
