/**
 * REZ Unified Hub - API Client
 * Handles service-to-service communication with all RABTUL and ecosystem services
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SERVICES, ServiceName } from '../types/index';
import { logger } from '../utils/logger';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const TIMEOUT_MS = parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10);

// ============================================
// CIRCUIT BREAKER STATE
// ============================================

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers: Map<ServiceName, CircuitState> = new Map();
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_TIMEOUT_MS = 30000;

// ============================================
// API CLIENT CLASS
// ============================================

class ApiClient {
  private clients: Map<ServiceName, AxiosInstance> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    (Object.keys(SERVICES) as ServiceName[]).forEach((service) => {
      const client = axios.create({
        baseURL: SERVICES[service],
        timeout: TIMEOUT_MS,
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'Content-Type': 'application/json',
        },
      });

      // Request interceptor
      client.interceptors.request.use(
        (config) => {
          logger.debug(`[${service}] ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          logger.error(`[${service}] Request error:`, error);
          return Promise.reject(error);
        }
      );

      // Response interceptor
      client.interceptors.response.use(
        (response) => {
          this.recordSuccess(service);
          return response;
        },
        (error: AxiosError) => {
          this.recordFailure(service);
          throw error;
        }
      );

      this.clients.set(service, client);
    });
  }

  private getCircuitState(service: ServiceName): CircuitState {
    if (!circuitBreakers.has(service)) {
      circuitBreakers.set(service, {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
      });
    }
    return circuitBreakers.get(service)!;
  }

  private recordSuccess(service: ServiceName) {
    const state = this.getCircuitState(service);
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failures = 0;
      logger.info(`[${service}] Circuit breaker closed`);
    }
  }

  private recordFailure(service: ServiceName) {
    const state = this.getCircuitState(service);
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= CIRCUIT_THRESHOLD) {
      state.state = 'open';
      logger.warn(`[${service}] Circuit breaker opened after ${state.failures} failures`);
    }
  }

  isCircuitOpen(service: ServiceName): boolean {
    const state = this.getCircuitState(service);
    if (state.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - state.lastFailure > CIRCUIT_TIMEOUT_MS) {
        state.state = 'half-open';
        logger.info(`[${service}] Circuit breaker half-open`);
        return false;
      }
      return true;
    }
    return false;
  }

  // ============================================
  // GENERIC CALL METHOD
  // ============================================

  async call<T = unknown>(
    service: ServiceName,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    data?: unknown
  ): Promise<T | null> {
    if (this.isCircuitOpen(service)) {
      logger.warn(`[${service}] Circuit breaker is open, skipping call to ${endpoint}`);
      return null;
    }

    const client = this.clients.get(service);
    if (!client) {
      logger.error(`[ApiClient] Unknown service: ${service}`);
      return null;
    }

    try {
      const response = await client.request<T>({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error(`[${service}] ${endpoint} failed:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
        url: axiosError.config?.url,
      });
      return null;
    }
  }

  // ============================================
  // BATCH CALLS
  // ============================================

  async batchCall<T extends unknown>(
    calls: Array<{
      service: ServiceName;
      endpoint: string;
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: unknown;
    }>
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    const promises = calls.map(async (call) => {
      const key = `${call.service}:${call.endpoint}`;
      const result = await this.call<T>(call.service, call.endpoint, call.method, call.data);
      results.set(key, result);
    });

    await Promise.allSettled(promises);
    return results;
  }

  // ============================================
  // SERVICE-SPECIFIC METHODS
  // ============================================

  // Auth Service
  async verifyToken(token: string) {
    return this.call('AUTH', '/api/v1/auth/verify', 'POST', { token });
  }

  async getUser(userId: string) {
    return this.call('AUTH', `/api/v1/users/${userId}`, 'GET');
  }

  // Wallet Service
  async getWalletBalance(userId: string) {
    return this.call('WALLET', '/api/v1/wallet/balance', 'POST', { user_id: userId });
  }

  async creditWallet(userId: string, amount: number, source: string) {
    return this.call('WALLET', '/api/v1/wallet/credit', 'POST', {
      user_id: userId,
      amount,
      source,
    });
  }

  // Payment Service
  async initiatePayment(userId: string, amount: number, method: string) {
    return this.call('PAYMENT', '/api/v1/payments/initiate', 'POST', {
      user_id: userId,
      amount,
      method,
    });
  }

  // CDP Service
  async getCDPProfile(userId: string) {
    return this.call('CDP', '/api/v1/profile', 'POST', { user_id: userId });
  }

  async getCDPSegments(userId: string) {
    return this.call('SEGMENTS', '/api/v1/segments', 'POST', { user_id: userId });
  }

  // RFM Service
  async getRFMScore(userId: string) {
    return this.call('RFM', '/api/v1/score', 'POST', { user_id: userId });
  }

  // Fraud Service
  async checkFraud(userId: string, type: string, amount?: number) {
    return this.call('FRAUD', '/api/v1/score', 'POST', {
      user_id: userId,
      transaction_type: type,
      amount,
    });
  }

  // Recommendation Service
  async getRecommendations(userId: string, context?: unknown) {
    return this.call('RECOMMEND', '/api/v1/products', 'POST', {
      user_id: userId,
      context,
    });
  }

  // Intent Service
  async predictIntent(userId: string) {
    return this.call('INTENT', '/api/v1/predict', 'POST', { user_id: userId });
  }

  // Signal Service
  async collectSignal(service: string, event: string, userId: string, entities?: unknown) {
    return this.call('SIGNAL', '/api/v1/collect', 'POST', {
      service,
      event,
      user_id: userId,
      entities,
    });
  }

  // Karma Service
  async awardKarma(userId: string, points: number, source: string, action: string) {
    return this.call('KARMA', '/api/v1/points/award', 'POST', {
      user_id: userId,
      points,
      source,
      action,
    });
  }

  async getKarmaBalance(userId: string) {
    return this.call('KARMA', '/api/v1/balance', 'POST', { user_id: userId });
  }

  // Attribution Service
  async trackAttribution(
    eventType: string,
    userId: string,
    value?: number,
    extras?: Record<string, unknown>
  ) {
    return this.call('ATTRIBUTION', '/api/v1/track', 'POST', {
      event_type: eventType,
      user_id: userId,
      value,
      ...extras,
    });
  }

  // Booking Service
  async createBooking(bookingData: unknown) {
    return this.call('BOOKING', '/api/v1/bookings', 'POST', bookingData);
  }

  // CorpPerks / PeopleOS
  async onboardEmployee(employeeData: unknown) {
    return this.call('PEOPLE_OS', '/api/v1/employees', 'POST', employeeData);
  }

  async getEmployeeBenefits(employeeId: string) {
    return this.call('PEOPLE_OS', '/api/v1/benefits', 'POST', { employee_id: employeeId });
  }

  // QR Services
  async getQRData(qrType: string, qrId: string) {
    const serviceMap: Record<string, ServiceName> = {
      verify: 'VERIFY_QR',
      safe: 'SAFE_QR',
      creator: 'CREATOR_QR',
      ads: 'ADS_QR',
      room: 'ROOM_QR',
    };
    const service = serviceMap[qrType];
    if (!service) return null;
    return this.call(service, '/api/v1/qr/data', 'POST', { qr_id: qrId });
  }

  // ============================================
  // HOJAI AI CORE SERVICES (4500-4590)
  // ============================================

  // Memory Service
  async storeMemory(userId: string, memory: string, context?: unknown) {
    return this.call('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: userId,
      memory,
      context,
    });
  }

  async getMemory(userId: string, query?: string) {
    return this.call('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: userId,
      query,
    });
  }

  // Intelligence Service
  async analyzeData(data: unknown, modelType?: string) {
    return this.call('HOJAI_INTELLIGENCE', '/api/v1/analyze', 'POST', {
      data,
      model_type: modelType,
    });
  }

  // Agents Service
  async createAgent(config: unknown) {
    return this.call('HOJAI_AGENTS', '/api/v1/agents', 'POST', config);
  }

  async getAgent(agentId: string) {
    return this.call('HOJAI_AGENTS', `/api/v1/agents/${agentId}`, 'GET');
  }

  async executeAgent(agentId: string, task: unknown) {
    return this.call('HOJAI_AGENTS', `/api/v1/agents/${agentId}/execute`, 'POST', task);
  }

  // Workflows Service
  async triggerWorkflow(workflowId: string, params?: unknown) {
    return this.call('HOJAI_WORKFLOWS', `/api/v1/workflows/${workflowId}/trigger`, 'POST', params);
  }

  async getWorkflowStatus(workflowId: string, runId: string) {
    return this.call('HOJAI_WORKFLOWS', `/api/v1/workflows/${workflowId}/runs/${runId}`, 'GET');
  }

  // Communications Service
  async sendNotification(userId: string, channel: string, content: unknown) {
    return this.call('HOJAI_COMMS', '/api/v1/send', 'POST', {
      user_id: userId,
      channel,
      content,
    });
  }

  // Hyperlocal Service
  async getNearbyPlaces(lat: number, lng: number, radius?: number) {
    return this.call('HOJAI_HYPERLOCAL', '/api/v1/places/nearby', 'POST', {
      lat,
      lng,
      radius: radius || 1000,
    });
  }

  // ============================================
  // HOJAI GENIE SERVICES (4703-4707)
  // ============================================

  // Genie Memory
  async genieRemember(userId: string, content: string, importance?: number) {
    return this.call('GENIE_MEMORY', '/api/v1/remember', 'POST', {
      user_id: userId,
      content,
      importance: importance || 5,
    });
  }

  async genieRecall(userId: string, query: string) {
    return this.call('GENIE_MEMORY', '/api/v1/recall', 'POST', {
      user_id: userId,
      query,
    });
  }

  // Genie Relationship
  async trackRelationship(userId: string, targetId: string, type: string, strength?: number) {
    return this.call('GENIE_RELATION', '/api/v1/track', 'POST', {
      user_id: userId,
      target_id: targetId,
      type,
      strength: strength || 50,
    });
  }

  async getRelationships(userId: string) {
    return this.call('GENIE_RELATION', '/api/v1/relationships', 'POST', {
      user_id: userId,
    });
  }

  // Genie Briefing
  async generateBriefing(userId: string, date?: string) {
    return this.call('GENIE_BRIEFING', '/api/v1/generate', 'POST', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async getBriefing(userId: string, date?: string) {
    return this.call('GENIE_BRIEFING', '/api/v1/briefing', 'POST', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  // ============================================
  // HOJAI INTELLIGENCE SUITE (4750-4754)
  // ============================================

  // Commerce AI
  async commerceInsight(userId: string, action: string, data?: unknown) {
    return this.call('COMMERCE_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      action,
      data,
    });
  }

  // Merchant AI
  async merchantInsight(merchantId: string, metric: string) {
    return this.call('MERCHANT_AI', '/api/v1/insight', 'POST', {
      merchant_id: merchantId,
      metric,
    });
  }

  // Customer AI (CRM)
  async customerInsight(userId: string, intent?: string) {
    return this.call('CUSTOMER_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      intent,
    });
  }

  // Marketing AI
  async marketingInsight(userId: string, campaignId?: string) {
    return this.call('MARKETING_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      campaign_id: campaignId,
    });
  }

  // Financial AI
  async financialInsight(userId: string, analysisType: string) {
    return this.call('FINANCIAL_AI', '/api/v1/insight', 'POST', {
      user_id: userId,
      type: analysisType,
    });
  }

  // ============================================
  // SUTAR OS SERVICES (4140-4254)
  // ============================================

  // TwinOS - Digital Twins
  async createTwin(userId: string, twinType: string, data?: unknown) {
    return this.call('SUTAR_TWIN_OS', '/api/v1/twins', 'POST', {
      entity_id: userId,
      type: twinType,
      data,
    });
  }

  async getTwin(userId: string, twinType: string) {
    return this.call('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: userId,
      type: twinType,
    });
  }

  async updateTwin(userId: string, twinType: string, updates: unknown) {
    return this.call('SUTAR_TWIN_OS', '/api/v1/twins/update', 'POST', {
      entity_id: userId,
      type: twinType,
      updates,
    });
  }

  // Memory Bridge
  async syncMemory(userId: string, source: string) {
    return this.call('SUTAR_MEMORY', '/api/v1/sync', 'POST', {
      user_id: userId,
      source,
    });
  }

  // Intent Bus
  async propagateIntent(userId: string, intent: unknown) {
    return this.call('SUTAR_INTENT', '/api/v1/propagate', 'POST', {
      user_id: userId,
      intent,
    });
  }

  // Decision Engine
  async makeDecision(context: unknown, options?: unknown) {
    return this.call('SUTAR_DECISION', '/api/v1/decide', 'POST', {
      context,
      options,
    });
  }

  // Goal Engine
  async setGoal(userId: string, goal: unknown) {
    return this.call('SUTAR_GOAL', '/api/v1/goals', 'POST', {
      user_id: userId,
      goal,
    });
  }

  async getGoals(userId: string) {
    return this.call('SUTAR_GOAL', '/api/v1/goals', 'POST', {
      user_id: userId,
    });
  }

  // Network Learning
  async getNetworkInsight(userId: string) {
    return this.call('SUTAR_NETWORK', '/api/v1/insight', 'POST', {
      user_id: userId,
    });
  }

  // Trust Engine
  async getTrustScore(entityId: string, entityType?: string) {
    return this.call('SUTAR_TRUST', '/api/v1/score', 'POST', {
      entity_id: entityId,
      entity_type: entityType || 'user',
    });
  }

  // Discovery Engine
  async discoverSuppliers(category?: string, criteria?: unknown) {
    return this.call('SUTAR_DISCOVERY', '/api/v1/suppliers', 'POST', {
      category,
      criteria,
    });
  }

  // ============================================
  // HOSPITALITY (StayOwn)
  // ============================================

  async bookHotel(guestId: string, hotelData: unknown) {
    return this.call('STAYOWN_BOOKING', '/api/v1/bookings', 'POST', {
      guest_id: guestId,
      ...hotelData,
    });
  }

  async getHotelAvailability(hotelId: string, checkIn: string, checkOut: string) {
    return this.call('STAYOWN_API', '/api/v1/availability', 'POST', {
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
    });
  }

  // ============================================
  // REAL ESTATE (RisnaEstate)
  // ============================================

  async getPropertyListings(filters?: unknown) {
    return this.call('RISNAESTATE_API', '/api/v1/properties', 'POST', filters);
  }

  async getPropertyDetails(propertyId: string) {
    return this.call('RISNAESTATE_API', `/api/v1/properties/${propertyId}`, 'GET');
  }

  async savePropertyInterest(userId: string, propertyId: string) {
    return this.call('RISNAESTATE_CRM', '/api/v1/interests', 'POST', {
      user_id: userId,
      property_id: propertyId,
    });
  }

  // ============================================
  // COMMERCE NETWORK (Nexha)
  // ============================================

  async getFranchiseOpportunities(category?: string) {
    return this.call('NEXHA_FRANCHISE', '/api/v1/opportunities', 'POST', {
      category,
    });
  }

  async getDistributionPartners(region?: string) {
    return this.call('NEXHA_DISTRIBUTION', '/api/v1/partners', 'POST', {
      region,
    });
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const apiClient = new ApiClient();
export default apiClient;
