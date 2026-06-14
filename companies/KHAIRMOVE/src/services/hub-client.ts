import { logger } from '../../shared/logger';
/**
 * KHAIRMOVE Mobility OS Hub Client
 * Port: 4600
 */

import axios, { AxiosInstance } from 'axios';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';

const SERVICES = {
  // RABTUL
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',

  // REZ Intelligence
  INTENT: process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com',
  SIGNAL: process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com',
  FRAUD: process.env.FRAUD_URL || 'https://rez-fraud-agent.onrender.com',
  PREDICT: process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com',
  MEMORY: process.env.MEMORY_LAYER_URL || 'https://REZ-memory-layer.onrender.com',

  // HOJAI AI
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',

  // KHAIRMOVE Services
  RIDE: process.env.RIDE_SERVICE_URL || 'http://localhost:4601',
  FLEET: process.env.FLEET_SERVICE_URL || 'http://localhost:4602',
  DELIVERY: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4603',
  BUZZLOCAL: process.env.BUZZLOCAL_URL || 'http://localhost:4606',
} as const;

class KHAIRMOVEHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'KHAIRMOVE' },
    });

    (Object.keys(SERVICES) as (keyof typeof SERVICES)[]).forEach((service) => {
      this.clients.set(service, axios.create({
        baseURL: SERVICES[service],
        headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'KHAIRMOVE' },
      }));
    });
  }

  async callViaHub(service: string, endpoint: string, method = 'POST', data?: unknown) {
    try {
      const response = await this.hubClient.request({ method, url: `/api/${service}${endpoint}`, data });
      return response.data;
    } catch (error) {
      logger.error(`[KHAIRMOVE-Hub] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  async callDirect(service: string, endpoint: string, method = 'POST', data?: unknown) {
    const client = this.clients.get(service);
    if (!client) return null;
    try {
      const response = await client.request({ method, url: endpoint, data });
      return response.data;
    } catch (error) {
      logger.error(`[KHAIRMOVE-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // RABTUL
  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async sendNotification(userId: string, message: string) {
    return this.callViaHub('notifications', '/send', 'POST', { user_id: userId, message });
  }

  // REZ Intelligence
  async getIntentPrediction(userId: string) {
    return this.callViaHub('intent', '/predict', 'POST', { user_id: userId });
  }

  async trackEvent(userId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', { service: 'KHAIRMOVE', event, user_id: userId, data });
  }

  async checkFraud(userId: string, transactionType: string, amount?: number) {
    return this.callViaHub('fraud', '/score', 'POST', { user_id: userId, transaction_type: transactionType, amount });
  }

  async getLocationPrediction(lat: number, lng: number) {
    return this.callDirect('MEMORY', '/api/v1/location/predict', 'POST', { lat, lng });
  }

  // HOJAI AI
  async getRouteOptimization(from: {lat: number, lng: number}, to: {lat: number, lng: number}) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/route/optimize', 'POST', { from, to });
  }

  async storeDriverMemory(driverId: string, memory: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: driverId, type: 'driver_experience', data: memory,
    });
  }

  // KHAIRMOVE Services
  async bookRide(rideData: unknown) {
    return this.callDirect('RIDE', '/api/v1/rides', 'POST', rideData);
  }

  async getRideStatus(rideId: string) {
    return this.callDirect('RIDE', `/api/v1/rides/${rideId}`, 'GET');
  }

  async getFleetVehicles(filters?: unknown) {
    return this.callDirect('FLEET', '/api/v1/vehicles', 'POST', filters);
  }

  async createDelivery(deliveryData: unknown) {
    return this.callDirect('DELIVERY', '/api/v1/deliveries', 'POST', deliveryData);
  }

  async getBuzzLocalRides(location: {lat: number, lng: number}, radius?: number) {
    return this.callDirect('BUZZLOCAL', '/api/v1/rides/nearby', 'POST', { location, radius: radius || 5000 });
  }

  // Loyalty
  async awardPoints(userId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', { user_id: userId, points, action, source: 'KHAIRMOVE' });
  }

  async getLoyaltyPoints(userId: string) {
    return this.callViaHub('karma', '/balance', 'POST', { user_id: userId });
  }
}

export const khaimoveHub = new KHAIRMOVEHubClient();
export default khaimoveHub;