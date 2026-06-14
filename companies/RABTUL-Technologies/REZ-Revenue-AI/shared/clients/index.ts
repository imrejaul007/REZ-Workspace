/**
 * REZ Revenue AI - Integration Clients
 * Clients for connecting to existing REZ services
 */

import axios, { AxiosInstance } from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })],
});

// ================== SIGNAL AGGREGATOR CLIENT ==================

export interface SignalData {
  userId: string;
  overall: number;
  signals: {
    location: number;
    behavioral: number;
    social: number;
    competitor: number;
    engagement: number;
  };
  segments: string[];
  qualityScore: number;
  signalCoverage: number;
}

export class SignalAggregatorClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.SIGNAL_AGGREGATOR_URL || 'http://localhost:4142') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000,
    });
  }

  async getSignals(userId: string): Promise<SignalData | null> {
    try {
      const response = await this.client.get(`/signals/${userId}`);
      return response.data;
    } catch (error) {
      logger.warn('Signal aggregator unavailable', { userId, error });
      return null;
    }
  }

  async getSignalsSummary(userId: string): Promise<{ overall: number; segments: string[] } | null> {
    try {
      const response = await this.client.get(`/signals/${userId}/summary`);
      return response.data;
    } catch (error) {
      logger.warn('Signal aggregator unavailable', { userId, error });
      return null;
    }
  }

  async getSegments(userId: string): Promise<string[] | null> {
    try {
      const response = await this.client.get(`/signals/${userId}/segments`);
      return response.data.segments;
    } catch (error) {
      logger.warn('Signal aggregator unavailable', { userId, error });
      return null;
    }
  }
}

// ================== PREDICTIVE ENGINE CLIENT ==================

export interface PredictionData {
  userId: string;
  type: 'churn' | 'ltv' | 'revisit' | 'conversion';
  score: number;
  probability: number;
  confidence: number;
  factors: Array<{ name: string; impact: number; value: string | number }>;
  recommendation: string;
}

export class PredictiveEngineClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.PREDICTIVE_ENGINE_URL || 'http://localhost:4141') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000,
    });
  }

  async predictChurn(userId: string): Promise<PredictionData | null> {
    try {
      const response = await this.client.get(`/predict/${userId}/churn`);
      return response.data;
    } catch (error) {
      logger.warn('Predictive engine unavailable', { userId, error });
      return null;
    }
  }

  async predictLTV(userId: string): Promise<PredictionData | null> {
    try {
      const response = await this.client.get(`/predict/${userId}/ltv`);
      return response.data;
    } catch (error) {
      logger.warn('Predictive engine unavailable', { userId, error });
      return null;
    }
  }

  async predictAll(userId: string): Promise<Record<string, PredictionData>> {
    try {
      const response = await this.client.get(`/predict/${userId}/all`);
      return response.data;
    } catch (error) {
      logger.warn('Predictive engine unavailable', { userId, error });
      return {};
    }
  }
}

// ================== FEATURE STORE CLIENT ==================

export interface FeatureData {
  entity_id: string;
  features: Record<string, number>;
}

export class FeatureStoreClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.FEATURE_STORE_URL || 'http://localhost:4128') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000,
    });
  }

  async getFeatures(entityId: string, featureGroup?: string): Promise<FeatureData | null> {
    try {
      const response = await this.client.post('/api/serving/online', {
        entity_id: entityId,
        feature_group: featureGroup,
      });
      return response.data;
    } catch (error) {
      logger.warn('Feature store unavailable', { entityId, error });
      return null;
    }
  }

  async getBatchFeatures(entityIds: string[], featureGroup?: string): Promise<FeatureData[]> {
    try {
      const response = await this.client.post('/api/serving/online/batch', {
        entity_ids: entityIds,
        feature_group: featureGroup,
      });
      return response.data.features || [];
    } catch (error) {
      logger.warn('Feature store unavailable', { error });
      return [];
    }
  }
}

// ================== DEMAND FORECAST CLIENT ==================

export interface DemandForecast {
  merchantId: string;
  date: string;
  totalDemand: number;
  peakHour: number;
  peakDemand: number;
  confidence: number;
}

export class DemandForecastClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.DEMAND_FORECAST_URL || 'http://localhost:4042') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
    });
  }

  async getForecast(merchantId: string, days: number = 7): Promise<DemandForecast[]> {
    try {
      const response = await this.client.get(`/api/forecast/${merchantId}`, {
        params: { days },
      });
      return response.data.forecasts || [];
    } catch (error) {
      logger.warn('Demand forecast unavailable', { merchantId, error });
      return [];
    }
  }

  async recordDemand(merchantId: string, date: string, demand: number): Promise<boolean> {
    try {
      await this.client.post(`/api/forecast/${merchantId}/record`, { date, demand });
      return true;
    } catch (error) {
      logger.warn('Failed to record demand', { merchantId, error });
      return false;
    }
  }
}

// ================== HYPERLOCAL BRAIN CLIENT ==================

export interface LocationData {
  zoneId: string;
  zoneName: string;
  demandIndex: number;
  footfallIndex: number;
  nearbyEvents: number;
  weather: string;
}

export class HyperlocalBrainClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.HYPERLOCAL_BRAIN_URL || 'http://localhost:4148') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000,
    });
  }

  async getZoneInsights(latitude: number, longitude: number): Promise<LocationData | null> {
    try {
      const response = await this.client.post('/api/locations/analyze', {
        coordinates: { latitude, longitude },
      });
      return response.data;
    } catch (error) {
      logger.warn('Hyperlocal brain unavailable', { latitude, longitude, error });
      return null;
    }
  }

  async predictNextLocation(userId: string): Promise<string | null> {
    try {
      const response = await this.client.post(`/api/locations/predict`, { userId });
      return response.data.nextLocation;
    } catch (error) {
      logger.warn('Hyperlocal brain unavailable', { userId, error });
      return null;
    }
  }
}

// ================== EVENT BUS CLIENT ==================

export interface Event {
  type: string;
  source: string;
  tenantId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export class EventBusClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.EVENT_BUS_URL || 'http://localhost:4082') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000,
    });
  }

  async publish(event: Event): Promise<boolean> {
    try {
      await this.client.post('/events', event);
      return true;
    } catch (error) {
      logger.warn('Event bus unavailable', { event, error });
      return false;
    }
  }

  async subscribe(eventType: string, callback: (event: Event) => void): Promise<string | null> {
    try {
      const response = await this.client.post('/subscriptions', {
        eventType,
        callbackUrl: process.env.SUBSCRIPTION_CALLBACK_URL,
      });
      return response.data.subscriptionId;
    } catch (error) {
      logger.warn('Event bus unavailable', { eventType, error });
      return null;
    }
  }
}

// ================== REZ INTELLIGENCE CLIENT (UNIFIED) ==================

export class RezIntelligenceClient {
  signals: SignalAggregatorClient;
  predictions: PredictiveEngineClient;
  features: FeatureStoreClient;
  demand: DemandForecastClient;
  hyperlocal: HyperlocalBrainClient;
  events: EventBusClient;

  constructor() {
    this.signals = new SignalAggregatorClient();
    this.predictions = new PredictiveEngineClient();
    this.features = new FeatureStoreClient();
    this.demand = new DemandForecastClient();
    this.hyperlocal = new HyperlocalBrainClient();
    this.events = new EventBusClient();
  }

  /**
   * Get complete user intelligence for pricing decisions
   */
  async getUserIntelligence(userId: string): Promise<{
    signals: SignalData | null;
    predictions: Record<string, PredictionData>;
    features: FeatureData | null;
  }> {
    const [signals, predictions, features] = await Promise.allSettled([
      this.signals.getSignals(userId),
      this.predictions.predictAll(userId),
      this.features.getFeatures(userId),
    ]);

    return {
      signals: signals.status === 'fulfilled' ? signals.value : null,
      predictions: predictions.status === 'fulfilled' ? predictions.value : {},
      features: features.status === 'fulfilled' ? features.value : null,
    };
  }

  /**
   * Get location intelligence for pricing
   */
  async getLocationIntelligence(lat: number, lng: number): Promise<LocationData | null> {
    return this.hyperlocal.getZoneInsights(lat, lng);
  }

  /**
   * Get demand forecast for merchant
   */
  async getMerchantDemand(merchantId: string, days: number = 7): Promise<DemandForecast[]> {
    return this.demand.getForecast(merchantId, days);
  }
}

// ================== RABTUL SERVICE CLIENTS ==================

export class RabtulAuthClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.AUTH_SERVICE_URL || 'http://localhost:4002') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
    });
  }

  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const response = await this.client.post('/api/auth/verify', { token });
      return { valid: true, userId: response.data.userId };
    } catch (error) {
      return { valid: false };
    }
  }
}

export class RabtulWalletClient {
  private client: AxiosInstance;
  private internalToken: string;

  constructor(
    baseUrl: string = process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    internalToken: string = process.env.INTERNAL_SERVICE_TOKEN || ''
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: { 'X-Internal-Token': internalToken },
    });
    this.internalToken = internalToken;
  }

  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.client.get(`/api/wallet/balance/${userId}`);
      return response.data.balance || 0;
    } catch (error) {
      logger.warn('Wallet service unavailable', { userId, error });
      return 0;
    }
  }

  async creditCashback(userId: string, amount: number, reason: string): Promise<boolean> {
    try {
      await this.client.post('/api/wallet/credit', {
        userId,
        amount,
        type: 'cashback',
        reason,
      });
      return true;
    } catch (error) {
      logger.warn('Failed to credit cashback', { userId, amount, error });
      return false;
    }
  }
}

// ================== EXPORTS ==================

export const signalAggregator = new SignalAggregatorClient();
export const predictiveEngine = new PredictiveEngineClient();
export const featureStore = new FeatureStoreClient();
export const demandForecast = new DemandForecastClient();
export const hyperlocalBrain = new HyperlocalBrainClient();
export const eventBus = new EventBusClient();
export const rezIntelligence = new RezIntelligenceClient();
export const rabtulAuth = new RabtulAuthClient();
export const rabtulWallet = new RabtulWalletClient();
