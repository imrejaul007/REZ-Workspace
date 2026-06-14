import { logger } from '../../shared/logger';
/**
 * StayOwn Unified Hub Client
 *
 * Connects StayOwn services to REZ ecosystem through the Unified Hub
 * Provides access to RABTUL services, HOJAI AI, and cross-company integrations
 */

import axios, { AxiosInstance } from 'axios';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';
const TIMEOUT_MS = parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10);

// ============================================
// SERVICE URLs
// ============================================

const SERVICES = {
  // RABTUL Core
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com',

  // HOJAI AI
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',

  // StayOwn Services
  HOTEL: process.env.HOTEL_SERVICE_URL || 'http://localhost:4802',
  HABIXO: process.env.HABIXO_SERVICE_URL || 'http://localhost:4804',
  ROOM_QR: process.env.ROOM_QR_SERVICE_URL || 'http://localhost:4805',
} as const;

// ============================================
// HUB CLIENT CLASS
// ============================================

class StayOwnHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      timeout: TIMEOUT_MS,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'X-Service-Name': 'StayOwn',
        'Content-Type': 'application/json',
      },
    });

    // Initialize service clients
    (Object.keys(SERVICES) as (keyof typeof SERVICES)[]).forEach((service) => {
      const client = axios.create({
        baseURL: SERVICES[service],
        timeout: TIMEOUT_MS,
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'X-Service-Name': 'StayOwn',
          'Content-Type': 'application/json',
        },
      });
      this.clients.set(service, client);
    });
  }

  /**
   * Call service through Unified Hub
   */
  async callViaHub(service: string, endpoint: string, method: string, data?: unknown) {
    try {
      const response = await this.hubClient.request({
        method,
        url: `/api/${service}${endpoint}`,
        data,
      });
      return response.data;
    } catch (error) {
      logger.error(`[StayOwn-Hub] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  /**
   * Call service directly
   */
  async callDirect(service: string, endpoint: string, method: string, data?: unknown) {
    const client = this.clients.get(service);
    if (!client) {
      logger.error(`[StayOwn-Hub] Unknown service: ${service}`);
      return null;
    }

    try {
      const response = await client.request({ method, url: endpoint, data });
      return response.data;
    } catch (error) {
      logger.error(`[StayOwn-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES
  // ============================================

  async authenticateGuest(phone: string, name?: string) {
    return this.callViaHub('auth', '/guest/create', 'POST', { phone, name });
  }

  async verifyGuest(token: string) {
    return this.callViaHub('auth', '/verify', 'POST', { token });
  }

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async creditGuestWallet(userId: string, amount: number, source: string) {
    return this.callViaHub('wallet', '/credit', 'POST', {
      user_id: userId,
      amount,
      source,
    });
  }

  async processPayment(userId: string, amount: number, method: 'wallet' | 'upi' | 'card') {
    return this.callViaHub('payment', '/initiate', 'POST', {
      user_id: userId,
      amount,
      method,
    });
  }

  // ============================================
  // HOJAI AI SERVICES
  // ============================================

  async storeGuestPreference(userId: string, preference: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: userId,
      type: 'guest_preference',
      data: preference,
    });
  }

  async getGuestPreferences(userId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: userId,
      type: 'guest_preference',
    });
  }

  async getAICociergeResponse(guestId: string, query: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/concierge/query', 'POST', {
      guest_id: guestId,
      query,
      context: 'hospitality',
    });
  }

  async getPricingRecommendation(hotelId: string, date: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/pricing/recommend', 'POST', {
      hotel_id: hotelId,
      date,
      context: 'hospitality',
    });
  }

  async storeGuestMemory(guestId: string, memory: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/remember', 'POST', {
      user_id: guestId,
      content: memory,
      type: 'hotel_experience',
    });
  }

  // ============================================
  // STAYOWN SERVICES
  // ============================================

  async checkRoomAvailability(hotelId: string, checkIn: string, checkOut: string, roomType?: string) {
    return this.callDirect('HOTEL', '/api/v1/availability', 'POST', {
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
      room_type: roomType,
    });
  }

  async createBooking(bookingData: unknown) {
    return this.callDirect('HOTEL', '/api/v1/bookings', 'POST', bookingData);
  }

  async getBooking(bookingId: string) {
    return this.callDirect('HOTEL', `/api/v1/bookings/${bookingId}`, 'GET');
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.callDirect('HOTEL', `/api/v1/bookings/${bookingId}/cancel`, 'POST', { reason });
  }

  async processRoomService(orderData: unknown) {
    return this.callDirect('ROOM_QR', '/api/v1/orders', 'POST', orderData);
  }

  async getHabixoListings(filters?: unknown) {
    return this.callDirect('HABIXO', '/api/v1/listings', 'POST', filters);
  }

  // ============================================
  // CROSS-COMPANY SERVICES
  // ============================================

  async getLoyaltyPoints(userId: string) {
    return this.callViaHub('karma', '/balance', 'POST', { user_id: userId });
  }

  async awardLoyaltyPoints(userId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', {
      user_id: userId,
      points,
      action,
      source: 'StayOwn',
    });
  }

  async trackEvent(userId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'StayOwn',
      event,
      user_id: userId,
      data,
    });
  }

  async getRecommendations(userId: string, context?: unknown) {
    return this.callViaHub('recommend', '/products', 'POST', {
      user_id: userId,
      context: { ...context, industry: 'hospitality' },
    });
  }

  // ============================================
  // EVENT PUBLISHING
  // ============================================

  async publishBookingEvent(bookingId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/hospitality/booking', 'POST', {
      booking_id: bookingId,
      event,
      data,
      source: 'StayOwn',
    });
  }

  async publishGuestEvent(guestId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/engagement/guest', 'POST', {
      guest_id: guestId,
      event,
      data,
      source: 'StayOwn',
    });
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const stayOwnHub = new StayOwnHubClient();
export default stayOwnHub;