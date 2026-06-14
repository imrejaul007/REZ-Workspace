/**
 * REZ Mind Hotel Service - REZ-Intelligence Integration
 *
 * Fully integrates with REZ-Intelligence services:
 * - Signal Aggregator (4121)
 * - Predictive Engine (4123)
 * - Unified Profile (4120)
 * - Realtime Segments (4126)
 * - Intent Predictor (4018)
 */

import axios, { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';

// ============================================
// Configuration
// ============================================

const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4121';
const INTENT_PREDICTOR_URL = process.env.INTENT_PREDICTOR_URL || 'http://localhost:4018';
const UNIFIED_PROFILE_URL = process.env.UNIFIED_PROFILE_URL || 'http://localhost:4120';
const API_KEY = process.env.REZ_INTELLIGENCE_API_KEY;

// ============================================
// Hotel Event Types
// ============================================

export const HOTEL_EVENTS = {
  // Booking Events
  ROOM_SEARCH: 'hotel:room:search',
  ROOM_VIEWED: 'hotel:room:viewed',
  BOOKING_CREATED: 'hotel:booking:created',
  BOOKING_CONFIRMED: 'hotel:booking:confirmed',
  BOOKING_CANCELLED: 'hotel:booking:cancelled',
  CHECKOUT_COMPLETED: 'hotel:checkout:completed',

  // Guest Events
  GUEST_SEARCHED: 'hotel:guest:searched',
  GUEST_REGISTERED: 'hotel:guest:registered',
  GUEST_PREFERENCES_SET: 'hotel:guest:preferences',

  // Service Events
  ROOM_SERVICE_ORDERED: 'hotel:service:room:ordered',
  HOUSEKEEPING_REQUESTED: 'hotel:service:housekeeping',
  SPA_BOOKED: 'hotel:service:spa',
  DINING_BOOKED: 'hotel:service:dining',

  // Revenue Events
  REVENUE_GENERATED: 'hotel:revenue:generated',
  PRICE_VIEWED: 'hotel:price:viewed',
  PRICE_ACCEPTED: 'hotel:price:accepted',

  // Operational Events
  OCCUPANCY_CHANGED: 'hotel:occupancy:changed',
  DEMAND_SPIKE: 'hotel:demand:spike',
  SEASONAL_TREND: 'hotel:seasonal:trend',
} as const;

// ============================================
// Signal Types
// ============================================

export interface HotelSearchSignal {
  userId?: string;
  sessionId: string;
  hotelId?: string;
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType?: string;
  filters: {
    priceMin?: number;
    priceMax?: number;
    starRating?: number[];
    amenities?: string[];
  };
  resultsCount?: number;
  viewedHotelIds?: string[];
  searchDurationMs?: number;
}

export interface HotelBookingSignal {
  userId: string;
  sessionId: string;
  hotelId: string;
  roomTypeId: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentMethod?: string;
  source: 'app' | 'web' | 'ota' | 'pms' | 'stayown';
}

export interface HotelCheckoutSignal {
  userId: string;
  bookingId: string;
  hotelId: string;
  roomCharges: number;
  serviceCharges: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  servicesUsed: string[];
}

// ============================================
// REZ-Intelligence Client
// ============================================

class REZIntelligenceClient {
  private serviceName = 'rez-mind-hotel-service';
  private http: AxiosInstance;
  private signalHttp: AxiosInstance;
  private profileHttp: AxiosInstance;
  private intentHttp: AxiosInstance;
  private emitter: EventEmitter;
  private eventQueue: unknown[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.emitter = new EventEmitter();

    // Signal Aggregator (4121)
    this.signalHttp = axios.create({
      baseURL: REZ_INTELLIGENCE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': this.serviceName,
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    // Unified Profile (4120)
    this.profileHttp = axios.create({
      baseURL: UNIFIED_PROFILE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': this.serviceName,
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    // Intent Predictor (4018)
    this.intentHttp = axios.create({
      baseURL: INTENT_PREDICTOR_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': this.serviceName,
        ...(API_KEY && { 'X-API-Key': API_KEY }),
      },
    });

    // Generic HTTP for other services
    this.http = this.signalHttp;

    // Start periodic flush
    this.startFlushInterval();
  }

  // ============================================
  // SIGNAL METHODS
  // ============================================

  /**
   * Send search signal to Signal Aggregator
   */
  async sendSearchSignal(signal: HotelSearchSignal): Promise<string> {
    try {
      const event = {
        id: this.generateId(),
        type: HOTEL_EVENTS.ROOM_SEARCH,
        source: this.serviceName,
        payload: {
          ...signal,
          timestamp: new Date().toISOString(),
          metadata: {
            service: 'hotel',
            vertical: 'hospitality',
          },
        },
        timestamp: new Date(),
      };

      await this.signalHttp.post('/signals', event);
      this.emitter.emit(HOTEL_EVENTS.ROOM_SEARCH, event);
      return event.id;
    } catch (error) {
      console.error('[REZ-Intelligence] Failed to send search signal:', error.message);
      return '';
    }
  }

  /**
   * Send booking signal
   */
  async sendBookingSignal(signal: HotelBookingSignal): Promise<string> {
    try {
      const event = {
        id: this.generateId(),
        type: HOTEL_EVENTS.BOOKING_CREATED,
        source: this.serviceName,
        payload: {
          ...signal,
          timestamp: new Date().toISOString(),
          metadata: {
            service: 'hotel',
            vertical: 'hospitality',
          },
        },
        timestamp: new Date(),
      };

      await this.signalHttp.post('/signals', event);
      this.emitter.emit(HOTEL_EVENTS.BOOKING_CREATED, event);
      return event.id;
    } catch (error) {
      console.error('[REZ-Intelligence] Failed to send booking signal:', error.message);
      return '';
    }
  }

  /**
   * Send checkout signal
   */
  async sendCheckoutSignal(signal: HotelCheckoutSignal): Promise<string> {
    try {
      const event = {
        id: this.generateId(),
        type: HOTEL_EVENTS.CHECKOUT_COMPLETED,
        source: this.serviceName,
        payload: {
          ...signal,
          timestamp: new Date().toISOString(),
          metadata: {
            service: 'hotel',
            vertical: 'hospitality',
          },
        },
        timestamp: new Date(),
      };

      await this.signalHttp.post('/signals', event);
      this.emitter.emit(HOTEL_EVENTS.CHECKOUT_COMPLETED, event);
      return event.id;
    } catch (error) {
      console.error('[REZ-Intelligence] Failed to send checkout signal:', error.message);
      return '';
    }
  }

  /**
   * Send generic hotel event
   */
  async sendEvent(type: string, payload): Promise<string> {
    try {
      const event = {
        id: this.generateId(),
        type,
        source: this.serviceName,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
          metadata: {
            service: 'hotel',
            vertical: 'hospitality',
          },
        },
        timestamp: new Date(),
      };

      await this.signalHttp.post('/signals', event);
      this.emitter.emit(type, event);
      return event.id;
    } catch (error) {
      console.error(`[REZ-Intelligence] Failed to send ${type}:`, error.message);
      return '';
    }
  }

  // ============================================
  // INTENT PREDICTION
  // ============================================

  /**
   * Predict booking intent
   */
  async predictIntent(userId: string, context): Promise<{
    intent: string;
    confidence: number;
    recommendations: string[];
  } | null> {
    try {
      const response = await this.intentHttp.post('/predict', {
        userId,
        context: {
          ...context,
          vertical: 'hotel',
          service: 'booking',
        },
      });

      return response.data;
    } catch (error) {
      console.error('[Intent-Predictor] Failed:', error.message);
      return null;
    }
  }

  /**
   * Get booking recommendations for user
   */
  async getRecommendations(userId: string, limit = 5): Promise<unknown[]> {
    try {
      const response = await this.intentHttp.get(`/recommendations/${userId}`, {
        params: { vertical: 'hotel', limit },
      });

      return response.data.recommendations || [];
    } catch (error) {
      console.error('[Intent-Predictor] Recommendations failed:', error.message);
      return [];
    }
  }

  // ============================================
  // UNIFIED PROFILE
  // ============================================

  /**
   * Get unified guest profile
   */
  async getGuestProfile(userId: string): Promise<unknown | null> {
    try {
      const response = await this.profileHttp.get(`/profiles/${userId}`);
      return response.data.profile;
    } catch (error) {
      console.error('[Unified-Profile] Failed:', error.message);
      return null;
    }
  }

  /**
   * Update guest profile
   */
  async updateGuestProfile(userId: string, updates): Promise<boolean> {
    try {
      await this.profileHttp.patch(`/profiles/${userId}`, {
        ...updates,
        source: 'hotel',
        lastUpdated: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('[Unified-Profile] Update failed:', error.message);
      return false;
    }
  }

  /**
   * Get guest preferences for personalization
   */
  async getGuestPreferences(userId: string): Promise<unknown | null> {
    try {
      const response = await this.profileHttp.get(`/profiles/${userId}/preferences`, {
        params: { vertical: 'hotel' },
      });
      return response.data.preferences;
    } catch (error) {
      console.error('[Unified-Profile] Preferences failed:', error.message);
      return null;
    }
  }

  // ============================================
  // DEMAND PREDICTION
  // ============================================

  /**
   * Get demand forecast from Predictive Engine
   */
  async getDemandForecast(hotelId: string, startDate: string, endDate: string): Promise<unknown[]> {
    try {
      const response = await this.http.get(`/predict/demand/${hotelId}`, {
        params: { startDate, endDate },
      });
      return response.data.forecast || [];
    } catch (error) {
      console.error('[Predictive-Engine] Demand forecast failed:', error.message);
      return [];
    }
  }

  /**
   * Get churn risk for guest
   */
  async getChurnRisk(userId: string): Promise<number> {
    try {
      const response = await this.http.get(`/predict/churn/${userId}`);
      return response.data.riskScore || 0;
    } catch (error) {
      console.error('[Predictive-Engine] Churn risk failed:', error.message);
      return 0;
    }
  }

  /**
   * Get LTV prediction
   */
  async getLTV(userId: string): Promise<number> {
    try {
      const response = await this.http.get(`/predict/ltv/${userId}`);
      return response.data.ltv || 0;
    } catch (error) {
      console.error('[Predictive-Engine] LTV failed:', error.message);
      return 0;
    }
  }

  // ============================================
  // REAL-TIME SEGMENTS
  // ============================================

  /**
   * Get real-time segments for user
   */
  async getUserSegments(userId: string): Promise<string[]> {
    try {
      const response = await this.http.get(`/segments/user/${userId}`);
      return response.data.segments || [];
    } catch (error) {
      console.error('[Realtime-Segments] Failed:', error.message);
      return [];
    }
  }

  /**
   * Get hotels in segment
   */
  async getHotelsInSegment(segmentId: string, limit = 20): Promise<string[]> {
    try {
      const response = await this.http.get(`/segments/${segmentId}/hotels`);
      return response.data.hotelIds || [];
    } catch (error) {
      console.error('[Realtime-Segments] Hotels failed:', error.message);
      return [];
    }
  }

  // ============================================
  // EVENT LISTENING
  // ============================================

  on(event: string, handler: (data) => void): void {
    this.emitter.on(event, handler);
  }

  off(event: string, handler: (data) => void): void {
    this.emitter.off(event, handler);
  }

  // ============================================
  // UTILITIES
  // ============================================

  private generateId(): string {
    return `htl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushInterval(): void {
    // Flush queued events every 30 seconds
    this.flushInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
          await this.signalHttp.post('/signals/batch', { events });
        } catch (error) {
          console.error('[REZ-Intelligence] Batch flush failed:', error.message);
          // Re-queue failed events
          this.eventQueue.push(...events);
        }
      }
    }, 30000);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.emitter.removeAllListeners();
  }
}

// ============================================
// Singleton Instance
// ============================================

export const rezIntelligence = new REZIntelligenceClient();

// ============================================
// Convenience Methods
// ============================================

export const hotelIntelligence = {
  // Signals
  sendSearch: (signal: HotelSearchSignal) => rezIntelligence.sendSearchSignal(signal),
  sendBooking: (signal: HotelBookingSignal) => rezIntelligence.sendBookingSignal(signal),
  sendCheckout: (signal: HotelCheckoutSignal) => rezIntelligence.sendCheckoutSignal(signal),
  sendEvent: (type: string, payload) => rezIntelligence.sendEvent(type, payload),

  // Intent
  predictIntent: (userId: string, context) => rezIntelligence.predictIntent(userId, context),
  getRecommendations: (userId: string, limit?: number) => rezIntelligence.getRecommendations(userId, limit),

  // Profile
  getProfile: (userId: string) => rezIntelligence.getGuestProfile(userId),
  updateProfile: (userId: string, updates) => rezIntelligence.updateGuestProfile(userId, updates),
  getPreferences: (userId: string) => rezIntelligence.getGuestPreferences(userId),

  // Predictions
  getDemandForecast: (hotelId: string, start: string, end: string) =>
    rezIntelligence.getDemandForecast(hotelId, start, end),
  getChurnRisk: (userId: string) => rezIntelligence.getChurnRisk(userId),
  getLTV: (userId: string) => rezIntelligence.getLTV(userId),

  // Segments
  getSegments: (userId: string) => rezIntelligence.getUserSegments(userId),
  getHotelsInSegment: (segmentId: string) => rezIntelligence.getHotelsInSegment(segmentId),
};
