/**
 * REZ Mind Salon Service - REZ-Intelligence Integration
 *
 * Fully integrates with REZ-Intelligence services:
 * - Signal Aggregator (4121)
 * - Predictive Engine (4123)
 * - Unified Profile (4120)
 * - Realtime Segments (4126)
 * - Intent Predictor (4018)
 */

import axios from 'axios';

// ============================================
// Configuration
// ============================================

const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4121';
const INTENT_PREDICTOR_URL = process.env.INTENT_PREDICTOR_URL || 'http://localhost:4018';
const UNIFIED_PROFILE_URL = process.env.UNIFIED_PROFILE_URL || 'http://localhost:4120';
const API_KEY = process.env.REZ_INTELLIGENCE_API_KEY;

// ============================================
// Salon Event Types
// ============================================

export const SALON_EVENTS = {
  APPOINTMENT_SEARCH: 'salon:appointment:search',
  APPOINTMENT_BOOKED: 'salon:appointment:booked',
  APPOINTMENT_CONFIRMED: 'salon:appointment:confirmed',
  APPOINTMENT_CANCELLED: 'salon:appointment:cancelled',
  APPOINTMENT_COMPLETED: 'salon:appointment:completed',
  SERVICE_COMPLETED: 'salon:service:completed',
  PRODUCT_PURCHASED: 'salon:product:purchased',
  MEMBERSHIP_ACTIVATED: 'salon:membership:activated',
  REVENUE_GENERATED: 'salon:revenue:generated',
  PREFERENCES_SET: 'salon:preferences:set',
} as const;

// ============================================
// Signal Types
// ============================================

export interface SalonSearchSignal {
  userId?: string;
  sessionId: string;
  salonId?: string;
  city: string;
  serviceType?: string;
  filters: Record<string, unknown>;
  resultsCount?: number;
}

export interface SalonBookingSignal {
  userId: string;
  sessionId: string;
  salonId: string;
  appointmentId: string;
  services: string[];
  date: string;
  totalAmount: number;
  source: 'app' | 'web' | 'ota';
}

// ============================================
// REZ-Intelligence Client
// ============================================

class REZIntelligenceClient {
  private serviceName = 'rez-mind-salon-service';
  private signalHttp = axios.create({
    baseURL: REZ_INTELLIGENCE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Name': this.serviceName,
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
  });

  private profileHttp = axios.create({
    baseURL: UNIFIED_PROFILE_URL,
    timeout: 10000,
    headers: { 'X-Service-Name': this.serviceName, ...(API_KEY && { 'X-API-Key': API_KEY }) },
  });

  private intentHttp = axios.create({
    baseURL: INTENT_PREDICTOR_URL,
    timeout: 10000,
    headers: { 'X-Service-Name': this.serviceName, ...(API_KEY && { 'X-API-Key': API_KEY }) },
  });

  async sendSearchSignal(signal: SalonSearchSignal): Promise<string> {
    try {
      const event = {
        id: `sln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: SALON_EVENTS.APPOINTMENT_SEARCH,
        source: this.serviceName,
        payload: { ...signal, timestamp: new Date().toISOString(), vertical: 'salon' },
        timestamp: new Date(),
      };
      await this.signalHttp.post('/signals', event);
      return event.id;
    } catch (error: unknown) {
      console.error('[REZ-Intelligence] Search signal failed:', error instanceof Error ? error.message : 'Unknown error');
      return '';
    }
  }

  async sendBookingSignal(signal: SalonBookingSignal): Promise<string> {
    try {
      const event = {
        id: `sln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: SALON_EVENTS.APPOINTMENT_BOOKED,
        source: this.serviceName,
        payload: { ...signal, timestamp: new Date().toISOString(), vertical: 'salon' },
        timestamp: new Date(),
      };
      await this.signalHttp.post('/signals', event);
      return event.id;
    } catch (error: unknown) {
      console.error('[REZ-Intelligence] Booking signal failed:', error instanceof Error ? error.message : 'Unknown error');
      return '';
    }
  }

  async predictIntent(userId: string, context: Record<string, unknown>) {
    try {
      const response = await this.intentHttp.post('/predict', { userId, context: { ...context, vertical: 'salon' } });
      return response.data;
    } catch { return null; }
  }

  async getGuestProfile(userId: string) {
    try {
      const response = await this.profileHttp.get(`/profiles/${userId}`);
      return (response.data as { profile?: unknown }).profile;
    } catch { return null; }
  }

  async updateGuestProfile(userId: string, updates: Record<string, unknown>) {
    try {
      await this.profileHttp.patch(`/profiles/${userId}`, { ...updates, source: 'salon' });
      return true;
    } catch { return false; }
  }
}

export const rezIntelligence = new REZIntelligenceClient();

export const salonIntelligence = {
  sendSearch: (signal: SalonSearchSignal) => rezIntelligence.sendSearchSignal(signal),
  sendBooking: (signal: SalonBookingSignal) => rezIntelligence.sendBookingSignal(signal),
  predictIntent: (userId: string, context: Record<string, unknown>) => rezIntelligence.predictIntent(userId, context),
  getProfile: (userId: string) => rezIntelligence.getGuestProfile(userId),
  updateProfile: (userId: string, updates: Record<string, unknown>) => rezIntelligence.updateGuestProfile(userId, updates),
};
