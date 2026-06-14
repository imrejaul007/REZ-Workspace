import { logger } from '../../shared/logger';
/**
 * RisnaEstate Unified Hub Client
 *
 * Connects RisnaEstate services to REZ ecosystem through the Unified Hub
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
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',

  // HOJAI AI
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',
  HOJAI_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_SIMULATION: process.env.SUTAR_SIMULATION || 'http://localhost:4241',
  COMMERCE_AI: process.env.COMMERCE_AI || 'http://localhost:4750',

  // RisnaEstate Services
  PROPERTY: process.env.PROPERTY_SERVICE_URL || 'http://localhost:4902',
  CRM: process.env.CRM_SERVICE_URL || 'http://localhost:4903',
  PROPFLOW: process.env.PROPFLOW_SERVICE_URL || 'http://localhost:4904',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4905',
} as const;

// ============================================
// HUB CLIENT CLASS
// ============================================

class RisnaEstateHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      timeout: TIMEOUT_MS,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'X-Service-Name': 'RisnaEstate',
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
          'X-Service-Name': 'RisnaEstate',
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
      logger.error(`[RisnaEstate-Hub] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  /**
   * Call service directly
   */
  async callDirect(service: string, endpoint: string, method: string, data?: unknown) {
    const client = this.clients.get(service);
    if (!client) {
      logger.error(`[RisnaEstate-Hub] Unknown service: ${service}`);
      return null;
    }

    try {
      const response = await client.request({ method, url: endpoint, data });
      return response.data;
    } catch (error) {
      logger.error(`[RisnaEstate-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES
  // ============================================

  async authenticateUser(phone: string, name?: string) {
    return this.callViaHub('auth', '/user/create', 'POST', { phone, name });
  }

  async verifyUser(token: string) {
    return this.callViaHub('auth', '/verify', 'POST', { token });
  }

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async processPayment(userId: string, amount: number, method: 'wallet' | 'upi' | 'card') {
    return this.callViaHub('payment', '/initiate', 'POST', {
      user_id: userId,
      amount,
      method,
      purpose: 'property',
    });
  }

  async transferDeposit(userId: string, propertyId: string, amount: number) {
    return this.callViaHub('payment', '/transfer', 'POST', {
      user_id: userId,
      to: 'property_owner',
      amount,
      reference: propertyId,
    });
  }

  // ============================================
  // HOJAI AI SERVICES
  // ============================================

  async getPropertyRecommendations(userId: string, criteria: unknown) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/recommend/property', 'POST', {
      user_id: userId,
      ...criteria,
    });
  }

  async predictPrice(propertyId: string, date?: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/price/predict', 'POST', {
      property_id: propertyId,
      date: date || new Date().toISOString(),
    });
  }

  async storeBuyerPreference(userId: string, preference: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: userId,
      type: 'buyer_preference',
      data: preference,
    });
  }

  async getBuyerPreferences(userId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: userId,
      type: 'buyer_preference',
    });
  }

  async getPropertyAssistantResponse(userId: string, query: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/property-assistant/query', 'POST', {
      user_id: userId,
      query,
      context: 'real_estate',
    });
  }

  async createPropertyTwin(propertyId: string, data: unknown) {
    return this.callDirect('HOJAI_TWIN_OS', '/api/v1/twins', 'POST', {
      entity_id: propertyId,
      type: 'property',
      data,
    });
  }

  async getPropertyTwin(propertyId: string) {
    return this.callDirect('HOJAI_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: propertyId,
      type: 'property',
    });
  }

  async simulateMarketScenario(scenario: unknown) {
    return this.callDirect('SUTAR_SIMULATION', '/api/v1/market/simulate', 'POST', scenario);
  }

  async getMarketInsights(region?: string) {
    return this.callDirect('COMMERCE_AI', '/api/v1/market/insights', 'POST', {
      region,
      industry: 'real_estate',
    });
  }

  // ============================================
  // RISNAESTATE SERVICES
  // ============================================

  async getPropertyListings(filters?: unknown) {
    return this.callDirect('PROPERTY', '/api/v1/listings', 'POST', filters);
  }

  async getPropertyDetails(propertyId: string) {
    return this.callDirect('PROPERTY', `/api/v1/properties/${propertyId}`, 'GET');
  }

  async createPropertyListing(listingData: unknown) {
    return this.callDirect('PROPERTY', '/api/v1/listings', 'POST', listingData);
  }

  async updatePropertyListing(propertyId: string, updates: unknown) {
    return this.callDirect('PROPERTY', `/api/v1/properties/${propertyId}`, 'PATCH', updates);
  }

  async getLeadDetails(leadId: string) {
    return this.callDirect('CRM', `/api/v1/leads/${leadId}`, 'GET');
  }

  async createLead(leadData: unknown) {
    return this.callDirect('CRM', '/api/v1/leads', 'POST', leadData);
  }

  async updateLeadStatus(leadId: string, status: string) {
    return this.callDirect('CRM', `/api/v1/leads/${leadId}/status`, 'PATCH', { status });
  }

  async getPropFlowRecommendations(userId: string) {
    return this.callDirect('PROPFLOW', '/api/v1/recommendations', 'POST', {
      user_id: userId,
    });
  }

  async getMarketAnalytics(region?: string, period?: string) {
    return this.callDirect('ANALYTICS', '/api/v1/market', 'POST', {
      region,
      period: period || '30d',
    });
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
      source: 'RisnaEstate',
    });
  }

  async trackPropertyView(userId: string, propertyId: string) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'RisnaEstate',
      event: 'property.viewed',
      user_id: userId,
      property_id: propertyId,
    });
  }

  async getIntentPrediction(userId: string) {
    return this.callViaHub('intent', '/predict', 'POST', { user_id: userId });
  }

  // ============================================
  // EVENT PUBLISHING
  // ============================================

  async publishPropertyEvent(propertyId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/realestate/property', 'POST', {
      property_id: propertyId,
      event,
      data,
      source: 'RisnaEstate',
    });
  }

  async publishLeadEvent(leadId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/crm/lead', 'POST', {
      lead_id: leadId,
      event,
      data,
      source: 'RisnaEstate',
    });
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const risnaEstateHub = new RisnaEstateHubClient();
export default risnaEstateHub;