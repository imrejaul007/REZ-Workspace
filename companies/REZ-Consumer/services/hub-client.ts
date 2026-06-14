/**
 * REZ-Consumer Unified Hub Client
 *
 * Connects REZ Consumer app to REZ ecosystem through the Unified Hub
 * Provides access to RABTUL services, full HOJAI Genie suite, and cross-company integrations
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
  ORDER: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com',

  // REZ Intelligence
  RECOMMEND: process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com',
  FRAUD: process.env.FRAUD_URL || 'https://rez-fraud-agent.onrender.com',
  SIGNAL: process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com',
  INTENT: process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com',
  PREDICT: process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com',

  // HOJAI Genie (4703-4707) - Personal AI
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_RELATION: process.env.GENIE_RELATION || 'http://localhost:4704',
  GENIE_BRIEFING: process.env.GENIE_BRIEFING || 'http://localhost:4706',

  // HOJAI Intelligence Suite
  COMMERCE_AI: process.env.COMMERCE_AI || 'http://localhost:4750',
  CUSTOMER_AI: process.env.CUSTOMER_AI || 'http://localhost:4752',
  MARKETING_AI: process.env.MARKETING_AI || 'http://localhost:4753',
  FINANCIAL_AI: process.env.FINANCIAL_AI || 'http://localhost:4754',

  // HOJAI Core
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',

  // SUTAR OS
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_GOAL: process.env.SUTAR_GOAL || 'http://localhost:4242',

  // Voice AI
  VOICE_OS: process.env.VOICE_OS || 'http://localhost:4760',
  VOICE_AGENTS: process.env.VOICE_AGENTS || 'http://localhost:4780',

  // Karma / Loyalty
  KARMA: process.env.KARMA_URL || 'https://rez-gamification-service.onrender.com',

  // CRM
  CRM: process.env.CRM_URL || 'https://REZ-crm-hub.onrender.com',
} as const;

// ============================================
// HUB CLIENT CLASS
// ============================================

class REZConsumerHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      timeout: TIMEOUT_MS,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'X-Service-Name': 'REZ-Consumer',
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
          'X-Service-Name': 'REZ-Consumer',
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
      console.error(`[REZ-Consumer-Hub] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  /**
   * Call service directly
   */
  async callDirect(service: string, endpoint: string, method: string, data?: unknown) {
    const client = this.clients.get(service);
    if (!client) {
      console.error(`[REZ-Consumer-Hub] Unknown service: ${service}`);
      return null;
    }

    try {
      const response = await client.request({ method, url: endpoint, data });
      return response.data;
    } catch (error) {
      console.error(`[REZ-Consumer-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES
  // ============================================

  async authenticateUser(phone: string, name?: string) {
    return this.callViaHub('auth', '/user/create', 'POST', { phone, name });
  }

  async verifyOTP(phone: string, otp: string) {
    return this.callViaHub('auth', '/otp/verify', 'POST', { phone, otp });
  }

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async creditWallet(userId: string, amount: number, source: string) {
    return this.callViaHub('wallet', '/credit', 'POST', {
      user_id: userId,
      amount,
      source,
    });
  }

  async makePayment(userId: string, amount: number, method: 'wallet' | 'upi' | 'card') {
    return this.callViaHub('payment', '/initiate', 'POST', {
      user_id: userId,
      amount,
      method,
    });
  }

  async createOrder(orderData: unknown) {
    return this.callViaHub('order', '/create', 'POST', orderData);
  }

  async getOrderStatus(orderId: string) {
    return this.callViaHub('order', `/status/${orderId}`, 'GET');
  }

  // ============================================
  // HOJAI GENIE - PERSONAL AI (4703-4707)
  // ============================================

  /**
   * Genie Memory - Remember personal experiences
   */
  async remember(userId: string, content: string, importance?: number) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/remember', 'POST', {
      user_id: userId,
      content,
      importance: importance || 5,
      type: 'personal_experience',
    });
  }

  async recall(userId: string, query: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/recall', 'POST', {
      user_id: userId,
      query,
    });
  }

  async getMemories(userId: string, limit?: number) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/memories', 'POST', {
      user_id: userId,
      limit: limit || 20,
    });
  }

  async forget(userId: string, memoryId: string) {
    return this.callDirect('GENIE_MEMORY', `/api/v1/memories/${memoryId}`, 'DELETE');
  }

  /**
   * Genie Relationship - Track personal connections
   */
  async trackRelationship(userId: string, targetId: string, type: string, strength?: number) {
    return this.callDirect('GENIE_RELATION', '/api/v1/track', 'POST', {
      user_id: userId,
      target_id: targetId,
      type,
      strength: strength || 50,
    });
  }

  async getRelationships(userId: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/relationships', 'POST', {
      user_id: userId,
    });
  }

  async updateRelationshipStrength(userId: string, targetId: string, delta: number) {
    return this.callDirect('GENIE_RELATION', '/api/v1/relationships/update', 'POST', {
      user_id: userId,
      target_id: targetId,
      delta,
    });
  }

  async getRelationshipInsights(userId: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/insights', 'POST', {
      user_id: userId,
    });
  }

  /**
   * Genie Briefing - Daily personalized briefings
   */
  async generateDailyBriefing(userId: string, date?: string) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/generate', 'POST', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async getBriefing(userId: string, date?: string) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/briefing', 'POST', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async getWeeklyBriefing(userId: string) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/weekly', 'POST', {
      user_id: userId,
    });
  }

  async getMonthlyBriefing(userId: string) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/monthly', 'POST', {
      user_id: userId,
    });
  }

  // ============================================
  // HOJAI INTELLIGENCE SUITE
  // ============================================

  async getCommerceInsight(userId: string, action: string) {
    return this.callDirect('COMMERCE_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      action,
    });
  }

  async getCustomerInsight(userId: string, intent?: string) {
    return this.callDirect('CUSTOMER_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      intent,
    });
  }

  async getMarketingOffer(userId: string, context?: unknown) {
    return this.callDirect('MARKETING_AI', '/api/v1/offer', 'POST', {
      user_id: userId,
      ...context,
    });
  }

  async getFinancialSummary(userId: string) {
    return this.callDirect('FINANCIAL_AI', '/api/v1/summary', 'POST', {
      user_id: userId,
    });
  }

  async getSpendingInsights(userId: string, period?: string) {
    return this.callDirect('FINANCIAL_AI', '/api/v1/spending', 'POST', {
      user_id: userId,
      period: period || '30d',
    });
  }

  // ============================================
  // HOJAI CORE SERVICES
  // ============================================

  async getPersonalRecommendations(userId: string, context?: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/recommendations/personal', 'POST', {
      user_id: userId,
      context,
    });
  }

  async storePreference(userId: string, preference: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: userId,
      type: 'consumer_preference',
      data: preference,
    });
  }

  async getPreferences(userId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: userId,
      type: 'consumer_preference',
    });
  }

  async chatWithAssistant(userId: string, message: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/assistant/query', 'POST', {
      user_id: userId,
      message,
      context: 'consumer_app',
    });
  }

  // ============================================
  // SUTAR OS SERVICES
  // ============================================

  async getUserTwin(userId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: userId,
      type: 'user',
    });
  }

  async createUserTwin(userId: string, data: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins', 'POST', {
      entity_id: userId,
      type: 'user',
      data,
    });
  }

  async updateUserTwin(userId: string, updates: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/update', 'POST', {
      entity_id: userId,
      type: 'user',
      updates,
    });
  }

  async setUserGoal(userId: string, goal: unknown) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals', 'POST', {
      entity_id: userId,
      goal,
    });
  }

  async getUserGoals(userId: string) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals', 'POST', {
      entity_id: userId,
    });
  }

  // ============================================
  // VOICE AI
  // ============================================

  async voiceCommand(userId: string, audioData: string) {
    return this.callDirect('VOICE_AGENTS', '/api/v1/command', 'POST', {
      user_id: userId,
      audio: audioData,
    });
  }

  async textToSpeech(text: string, voice?: string) {
    return this.callDirect('VOICE_OS', '/api/v1/tts', 'POST', {
      text,
      voice: voice || 'default',
    });
  }

  async speechToText(audioData: string) {
    return this.callDirect('VOICE_OS', '/api/v1/stt', 'POST', {
      audio: audioData,
    });
  }

  // ============================================
  // CROSS-COMPANY SERVICES
  // ============================================

  async getLoyaltyPoints(userId: string) {
    return this.callViaHub('karma', '/balance', 'POST', { user_id: userId });
  }

  async awardPoints(userId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', {
      user_id: userId,
      points,
      action,
      source: 'REZ-Consumer',
    });
  }

  async getRecommendations(userId: string, context?: unknown) {
    return this.callViaHub('recommend', '/products', 'POST', {
      user_id: userId,
      context,
    });
  }

  async checkFraud(userId: string, transactionType: string, amount?: number) {
    return this.callViaHub('fraud', '/score', 'POST', {
      user_id: userId,
      transaction_type: transactionType,
      amount,
    });
  }

  async predictIntent(userId: string) {
    return this.callViaHub('intent', '/predict', 'POST', { user_id: userId });
  }

  async predictNextAction(userId: string) {
    return this.callViaHub('predict', '/next-action', 'POST', { user_id: userId });
  }

  // ============================================
  // ANALYTICS & SIGNALING
  // ============================================

  async trackEvent(userId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'REZ-Consumer',
      event,
      user_id: userId,
      data,
    });
  }

  async trackPageView(userId: string, page: string) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'REZ-Consumer',
      event: 'page.viewed',
      user_id: userId,
      data: { page },
    });
  }

  async trackSearch(userId: string, query: string) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'REZ-Consumer',
      event: 'search.performed',
      user_id: userId,
      data: { query },
    });
  }

  // ============================================
  // CRM & ENGAGEMENT
  // ============================================

  async getUserProfile(userId: string) {
    return this.callViaHub('crm', '/profile', 'POST', { user_id: userId });
  }

  async updateUserProfile(userId: string, updates: unknown) {
    return this.callViaHub('crm', '/profile', 'PATCH', {
      user_id: userId,
      ...updates,
    });
  }

  async getEngagementScore(userId: string) {
    return this.callViaHub('crm', '/engagement/score', 'POST', { user_id: userId });
  }

  // ============================================
  // BOOKING & RESERVATIONS
  // ============================================

  async createBooking(bookingData: unknown) {
    return this.callViaHub('booking', '/create', 'POST', bookingData);
  }

  async getBookingStatus(bookingId: string) {
    return this.callViaHub('booking', `/status/${bookingId}`, 'GET');
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.callViaHub('booking', `/${bookingId}/cancel`, 'POST', { reason });
  }

  // ============================================
  // EVENT PUBLISHING
  // ============================================

  async publishUserEvent(userId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/engagement/user', 'POST', {
      user_id: userId,
      event,
      data,
      source: 'REZ-Consumer',
    });
  }

  async publishCommerceEvent(userId: string, event: string, data?: unknown) {
    return this.callViaHub('event-bus', '/events/commerce/user', 'POST', {
      user_id: userId,
      event,
      data,
      source: 'REZ-Consumer',
    });
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const rezConsumerHub = new REZConsumerHubClient();
export default rezConsumerHub;