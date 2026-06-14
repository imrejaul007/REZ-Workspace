import { logger } from '../../shared/logger';
// KHAIRMOVE × REZ Intelligence Integration
// Unified AI/ML client for mobility intelligence

import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

export interface REZConfig {
  // REZ Intelligence Services
  intentPredictorUrl?: string;      // 4018 - Intent prediction
  signalAggregatorUrl?: string;    // 4142 - Behavior signals
  fraudDetectionUrl?: string;      // 3007 - Risk assessment
  predictiveEngineUrl?: string;     // 4123 - Churn/LTV predictions
  locationIntelUrl?: string;        // 4040 - Hot zones, demand
  memoryLayerUrl?: string;          // 4201 - User history
  eventBusUrl?: string;            // 4025 - Event streaming

  // RABTUL Services
  authServiceUrl?: string;          // 4002 - JWT verification
  walletServiceUrl?: string;        // 4004 - Balance, cashback
  paymentServiceUrl?: string;       // 4001 - Razorpay
  notificationServiceUrl?: string;   // 4011 - Push/SMS

  // API Keys
  apiKey?: string;
  internalToken?: string;
}

const DEFAULT_CONFIG: REZConfig = {
  // REZ Intelligence
  intentPredictorUrl: process.env.REZ_INTENT_URL || 'http://localhost:4018',
  signalAggregatorUrl: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
  fraudDetectionUrl: process.env.REZ_FRAUD_URL || 'http://localhost:3007',
  predictiveEngineUrl: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
  locationIntelUrl: process.env.REZ_LOCATION_URL || 'http://localhost:4040',
  memoryLayerUrl: process.env.REZ_MEMORY_URL || 'http://localhost:4201',
  eventBusUrl: process.env.REZ_EVENT_BUS_URL || 'http://localhost:4025',

  // RABTUL
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',

  // Keys
  apiKey: process.env.REZ_INTELLIGENCE_API_KEY || 'rez-api-key',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'khaimove-internal',
};

let config: REZConfig = { ...DEFAULT_CONFIG };

export function configure(configOverrides: Partial<REZConfig>) {
  config = { ...config, ...configOverrides };
}

export function getConfig(): REZConfig {
  return { ...config };
}

// ============================================
// TYPE DEFINITIONS
// ============================================

// --- REZ Intelligence Types ---

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  name?: string;
}

export interface IntentPrediction {
  userId: string;
  predictedIntents: Intent[];
  confidence: number;
  context: Record<string, unknown>;
}

export interface Intent {
  intent: string;
  probability: number;
  action?: string;
  destination?: Location;
}

export interface DestinationPrediction {
  userId: string;
  predictedDestinations: PredictedDestination[];
  routineConfidence: number;
}

export interface PredictedDestination {
  destination: Location;
  probability: number;
  purpose?: string;
  timeOfDay?: string;
  label?: string;
}

export interface Signal {
  type: string;
  value: number;
  weight: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface UserSignals {
  userId: string;
  signals: Signal[];
  score: number;
  segments: string[];
  lastActive?: Date;
}

export interface FraudAssessment {
  userId: string;
  rideId?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  recommendation: 'allow' | 'review' | 'block';
  factors: Record<string, number>;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendedActions: string[];
}

export interface LTVPrediction {
  userId: string;
  predictedLTV: number;
  confidence: number;
  tier: 'standard' | 'premium' | 'elite';
  projectedMonths: number;
}

export interface DemandSignal {
  areaId: string;
  lat: number;
  lng: number;
  demandLevel: 'low' | 'medium' | 'high' | 'surge';
  activeDrivers: number;
  pendingRequests: number;
  waitTime: number;
  surgeMultiplier: number;
}

export interface SurgePrediction {
  lat: number;
  lng: number;
  currentMultiplier: number;
  predictedMultiplier: number;
  confidence: number;
  eta: number;
  reasons?: string[];
}

export interface HotZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  intensity: number;
  type: 'residential' | 'commercial' | 'transit' | 'entertainment';
}

export interface DriverScore {
  driverId: string;
  overallScore: number;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  utilizationRate: number;
  riskFactors: string[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface RideMetrics {
  userId: string;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  averageFare: number;
  totalSpent: number;
  favoriteRoutes: { pickup: Location; drop: Location; count: number }[];
  peakHours: number[];
  lastRide?: Date;
}

// --- RABTUL Types ---

export interface JWTPayload {
  userId: string;
  phone?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  bonus: number;
}

export interface CashbackResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  newBalance?: number;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

// --- Event Types ---

export type RideEventType =
  | 'ride.requested'
  | 'ride.accepted'
  | 'ride.arrived'
  | 'ride.started'
  | 'ride.completed'
  | 'ride.cancelled';

export interface RideEvent {
  type: RideEventType;
  rideId: string;
  userId: string;
  driverId?: string;
  vehicleType?: string;
  pickup?: Location;
  drop?: Location;
  fare?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// HTTP CLIENT
// ============================================

class REZAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private internalToken: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.apiKey = config.apiKey || DEFAULT_CONFIG.apiKey!;
    this.internalToken = config.internalToken || DEFAULT_CONFIG.internalToken!;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Internal-Token': this.internalToken,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
      throw new REZAPIError(response.status, errorData.message || 'API Error', errorData);
    }
    return response.json() as Promise<T>;
  }
}

export class REZAPIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'REZAPIError';
  }
}

// ============================================
// SERVICE CLIENTS
// ============================================

export class IntentService {
  private client: REZAPIClient;

  constructor() {
    const url = config.intentPredictorUrl || DEFAULT_CONFIG.intentPredictorUrl!;
    this.client = new REZAPIClient(url);
  }

  async predictIntent(userId: string, context?: Record<string, unknown>): Promise<IntentPrediction> {
    return this.client.post<IntentPrediction>('/api/intent/predict', {
      userId,
      context: {
        ...context,
        service: 'khaimove',
        timestamp: new Date().toISOString(),
      },
    });
  }

  async predictDestination(userId: string): Promise<DestinationPrediction> {
    return this.client.get<DestinationPrediction>(`/api/intent/destination/${userId}`);
  }

  async recordSearch(userId: string, query: string, results: string[]): Promise<void> {
    await this.client.post('/api/intent/search', {
      userId,
      query,
      results,
      service: 'khaimove',
    });
  }
}

export class SignalService {
  private client: REZAPIClient;
  private eventEmitter: EventEmitter;

  constructor() {
    const url = config.signalAggregatorUrl || DEFAULT_CONFIG.signalAggregatorUrl!;
    this.client = new REZAPIClient(url);
    this.eventEmitter = new EventEmitter();
  }

  async getUserSignals(userId: string): Promise<UserSignals> {
    return this.client.get<UserSignals>(`/api/signals/user/${userId}`);
  }

  async recordSignal(userId: string, signal: Omit<Signal, 'timestamp'>): Promise<void> {
    const fullSignal: Signal = {
      ...signal,
      timestamp: new Date(),
    };
    await this.client.post('/api/signals/record', {
      userId,
      signal: fullSignal,
      service: 'khaimove',
    });
  }

  async recordEvent(event: RideEvent): Promise<void> {
    // Record to signal aggregator
    await this.client.post('/api/signals/events', {
      userId: event.userId,
      event: {
        type: event.type,
        value: 1,
        weight: this.getEventWeight(event.type),
        timestamp: event.timestamp,
        metadata: event,
      },
      service: 'khaimove',
    });

    // Emit locally for real-time processing
    this.eventEmitter.emit(event.type, event);
  }

  onEvent(eventType: RideEventType, handler: (event: RideEvent) => void): void {
    this.eventEmitter.on(eventType, handler);
  }

  offEvent(eventType: RideEventType, handler: (event: RideEvent) => void): void {
    this.eventEmitter.off(eventType, handler);
  }

  private getEventWeight(type: RideEventType): number {
    const weights: Record<RideEventType, number> = {
      'ride.requested': 1,
      'ride.accepted': 1,
      'ride.arrived': 1,
      'ride.started': 2,
      'ride.completed': 5,
      'ride.cancelled': -2,
    };
    return weights[type];
  }
}

export class FraudService {
  private client: REZAPIClient;

  constructor() {
    const url = config.fraudDetectionUrl || DEFAULT_CONFIG.fraudDetectionUrl!;
    this.client = new REZAPIClient(url);
  }

  async assessRideRisk(
    userId: string,
    rideData: {
      pickup: Location;
      drop: Location;
      fare: number;
      vehicleType: string;
      scheduledTime?: Date;
    }
  ): Promise<FraudAssessment> {
    return this.client.post<FraudAssessment>('/api/fraud/assess/ride', {
      userId,
      service: 'khaimove',
      context: {
        ...rideData,
        service: 'khaimove',
      },
    });
  }

  async assessDriverRisk(driverId: string): Promise<FraudAssessment> {
    return this.client.get<FraudAssessment>(`/api/fraud/assess/driver/${driverId}`);
  }

  async recordFraudFeedback(rideId: string, wasFraud: boolean): Promise<void> {
    await this.client.post('/api/fraud/feedback', {
      rideId,
      wasFraud,
      service: 'khaimove',
    });
  }
}

export class PredictiveService {
  private client: REZAPIClient;

  constructor() {
    const url = config.predictiveEngineUrl || DEFAULT_CONFIG.predictiveEngineUrl!;
    this.client = new REZAPIClient(url);
  }

  async predictChurn(userId: string): Promise<ChurnPrediction> {
    return this.client.get<ChurnPrediction>(`/api/predict/churn/${userId}`);
  }

  async predictLTV(userId: string): Promise<LTVPrediction> {
    return this.client.get<LTVPrediction>(`/api/predict/ltv/${userId}`);
  }

  async getUserMetrics(userId: string): Promise<RideMetrics> {
    return this.client.get<RideMetrics>(`/api/metrics/user/${userId}`);
  }

  async predictDriverScore(driverId: string): Promise<DriverScore> {
    return this.client.get<DriverScore>(`/api/predict/driver-score/${driverId}`);
  }

  async shouldOfferPromotion(userId: string): Promise<{
    shouldOffer: boolean;
    reason: string;
    promotionType?: string;
    discount?: number;
  }> {
    const [churn, ltv] = await Promise.all([
      this.predictChurn(userId).catch(() => null),
      this.predictLTV(userId).catch(() => null),
    ]);

    if (churn?.riskLevel === 'high') {
      return {
        shouldOffer: true,
        reason: 'High churn risk',
        promotionType: 'winback',
        discount: 20,
      };
    }

    if (ltv?.tier === 'elite') {
      return {
        shouldOffer: true,
        reason: 'Elite user - retain',
        promotionType: 'exclusive',
        discount: 10,
      };
    }

    return { shouldOffer: false, reason: 'No promotion needed' };
  }
}

export class LocationService {
  private client: REZAPIClient;

  constructor() {
    const url = config.locationIntelUrl || DEFAULT_CONFIG.locationIntelUrl!;
    this.client = new REZAPIClient(url);
  }

  async predictSurge(lat: number, lng: number): Promise<SurgePrediction> {
    return this.client.post<SurgePrediction>('/api/surge/predict', {
      lat,
      lng,
      service: 'khaimove',
    });
  }

  async getDemandSignals(lat: number, lng: number, radiusKm: number = 5): Promise<DemandSignal[]> {
    return this.client.post<DemandSignal[]>('/api/demand/signals', {
      lat,
      lng,
      radius: radiusKm,
      service: 'khaimove',
    });
  }

  async getHotZones(lat: number, lng: number, radiusKm: number = 10): Promise<HotZone[]> {
    return this.client.post<HotZone[]>('/api/location/hot-zones', {
      lat,
      lng,
      radius: radiusKm,
      service: 'khaimove',
    });
  }

  async recordDemandEvent(lat: number, lng: number, event: {
    type: 'request' | 'completion' | 'cancellation';
    vehicleType?: string;
  }): Promise<void> {
    await this.client.post('/api/location/events', {
      lat,
      lng,
      event,
      service: 'khaimove',
    });
  }
}

export class MemoryService {
  private client: REZAPIClient;

  constructor() {
    const url = config.memoryLayerUrl || DEFAULT_CONFIG.memoryLayerUrl!;
    this.client = new REZAPIClient(url);
  }

  async getUserPreference<T = unknown>(userId: string, key: string): Promise<T | null> {
    try {
      const result = await this.client.get<{ data: T }>(`/api/memory/user/${userId}/key/${key}`);
      return result.data;
    } catch {
      return null;
    }
  }

  async setUserPreference(userId: string, key: string, value: unknown): Promise<void> {
    await this.client.put(`/api/memory/user/${userId}/key/${key}`, {
      value,
      service: 'khaimove',
    });
  }

  async getUserHistory<T = unknown>(userId: string, limit: number = 10): Promise<T[]> {
    const result = await this.client.get<{ items: T[] }>(`/api/memory/user/${userId}/history?limit=${limit}`);
    return result.items;
  }

  async getFavoriteRoutes(userId: string): Promise<{ pickup: Location; drop: Location; count: number }[]> {
    try {
      const result = await this.client.get<{ routes: { pickup: Location; drop: Location; count: number }[] }>(
        `/api/memory/user/${userId}/routes`
      );
      return result.routes;
    } catch {
      return [];
    }
  }
}

// ============================================
// RABTUL SERVICE CLIENTS
// ============================================

export class AuthService {
  private client: REZAPIClient;

  constructor() {
    const url = config.authServiceUrl || DEFAULT_CONFIG.authServiceUrl!;
    this.client = new REZAPIClient(url);
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    return this.client.post<JWTPayload>('/api/auth/verify', { token });
  }

  async verifyInternal(): Promise<boolean> {
    try {
      await this.client.post('/api/auth/internal-verify', {
        token: config.internalToken,
      });
      return true;
    } catch {
      return false;
    }
  }

  async generateServiceToken(): Promise<string> {
    const result = await this.client.post<{ token: string }>('/api/auth/service-token', {
      service: 'khaimove',
      scopes: ['rides', 'drivers', 'fleet', 'delivery'],
    });
    return result.token;
  }
}

export class WalletService {
  private client: REZAPIClient;

  constructor() {
    const url = config.walletServiceUrl || DEFAULT_CONFIG.walletServiceUrl!;
    this.client = new REZAPIClient(url);
  }

  async getBalance(userId: string): Promise<WalletBalance> {
    return this.client.get<WalletBalance>(`/api/wallet/${userId}/balance`);
  }

  async creditCashback(
    userId: string,
    amount: number,
    rideId: string,
    source: 'ride_completion' | 'promotion' | 'refund'
  ): Promise<CashbackResult> {
    try {
      const result = await this.client.post<{ transactionId: string; newBalance: number }>(
        `/api/wallet/${userId}/credit`,
        {
          amount,
          type: 'cashback',
          source,
          referenceId: rideId,
          description: `KHAIRMOVE Ride Cashback - Ride ${rideId}`,
          metadata: {
            service: 'khaimove',
            rideId,
          },
        }
      );

      return {
        success: true,
        transactionId: result.transactionId,
        amount,
        newBalance: result.newBalance,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to credit cashback',
      };
    }
  }

  async debit(userId: string, amount: number, rideId: string): Promise<CashbackResult> {
    try {
      const result = await this.client.post<{ transactionId: string; newBalance: number }>(
        `/api/wallet/${userId}/debit`,
        {
          amount,
          type: 'ride_payment',
          referenceId: rideId,
          description: `KHAIRMOVE Ride Payment - Ride ${rideId}`,
        }
      );

      return {
        success: true,
        transactionId: result.transactionId,
        amount,
        newBalance: result.newBalance,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to debit',
      };
    }
  }
}

export class PaymentService {
  private client: REZAPIClient;

  constructor() {
    const url = config.paymentServiceUrl || DEFAULT_CONFIG.paymentServiceUrl!;
    this.client = new REZAPIClient(url);
  }

  async createOrder(
    userId: string,
    amount: number,
    rideId: string
  ): Promise<{ orderId: string; razorpayOrderId: string }> {
    return this.client.post('/api/payments/create-order', {
      userId,
      amount,
      referenceId: rideId,
      service: 'khaimove',
      currency: 'INR',
    });
  }

  async verifyPayment(paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<boolean> {
    try {
      await this.client.post('/api/payments/verify', {
        ...paymentData,
        service: 'khaimove',
      });
      return true;
    } catch {
      return false;
    }
  }

  async refund(rideId: string, amount: number, reason: string): Promise<PaymentResult> {
    try {
      const result = await this.client.post<{ refundId: string }>('/api/payments/refund', {
        referenceId: rideId,
        amount,
        reason,
        service: 'khaimove',
      });

      return {
        success: true,
        paymentId: result.refundId,
        status: 'refunded',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }
}

export class NotificationService {
  private client: REZAPIClient;

  constructor() {
    const url = config.notificationServiceUrl || DEFAULT_CONFIG.notificationServiceUrl!;
    this.client = new REZAPIClient(url);
  }

  async sendPush(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<NotificationResult> {
    try {
      const result = await this.client.post<{ notificationId: string }>('/api/notifications/push', {
        userId,
        notification: {
          ...notification,
          channel: 'khaimove',
        },
        service: 'khaimove',
      });

      return {
        success: true,
        notificationId: result.notificationId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send push',
      };
    }
  }

  async sendSMS(phone: string, message: string): Promise<NotificationResult> {
    try {
      const result = await this.client.post<{ notificationId: string }>('/api/notifications/sms', {
        phone,
        message,
        service: 'khaimove',
      });

      return {
        success: true,
        notificationId: result.notificationId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  async sendRideUpdate(
    userId: string,
    rideId: string,
    update: {
      type: 'driver_assigned' | 'driver_arrived' | 'ride_started' | 'ride_completed';
      driverName?: string;
      eta?: number;
    }
  ): Promise<NotificationResult> {
    const messages: Record<string, { title: string; body: string }> = {
      driver_assigned: {
        title: 'Driver Assigned',
        body: `${update.driverName} is on the way to pick you up`,
      },
      driver_arrived: {
        title: 'Driver Arrived',
        body: 'Your driver has arrived. Share the OTP to start the ride.',
      },
      ride_started: {
        title: 'Ride Started',
        body: 'Your ride is in progress. Have a safe journey!',
      },
      ride_completed: {
        title: 'Ride Completed',
        body: 'Thank you for riding with KHAIRMOVE! ₹10 cashback credited.',
      },
    };

    const msg = messages[update.type];
    return this.sendPush(userId, {
      title: msg.title,
      body: msg.body,
      data: { rideId, type: update.type, ...update },
    });
  }
}

// ============================================
// UNIFIED KHAIRMOVE INTELLIGENCE CLIENT
// ============================================

export class KHAIRMOVEIntelligence {
  // REZ Intelligence
  public intent: IntentService;
  public signals: SignalService;
  public fraud: FraudService;
  public predictive: PredictiveService;
  public location: LocationService;
  public memory: MemoryService;

  // RABTUL
  public auth: AuthService;
  public wallet: WalletService;
  public payment: PaymentService;
  public notification: NotificationService;

  constructor() {
    // Initialize REZ Intelligence services
    this.intent = new IntentService();
    this.signals = new SignalService();
    this.fraud = new FraudService();
    this.predictive = new PredictiveService();
    this.location = new LocationService();
    this.memory = new MemoryService();

    // Initialize RABTUL services
    this.auth = new AuthService();
    this.wallet = new WalletService();
    this.payment = new PaymentService();
    this.notification = new NotificationService();
  }

  configure(configOverrides: Partial<REZConfig>) {
    configure(configOverrides);
    // Re-initialize with new config
    Object.assign(this, {
      intent: new IntentService(),
      signals: new SignalService(),
      fraud: new FraudService(),
      predictive: new PredictiveService(),
      location: new LocationService(),
      memory: new MemoryService(),
      auth: new AuthService(),
      wallet: new WalletService(),
      payment: new PaymentService(),
      notification: new NotificationService(),
    });
  }

  // === RIDE LIFECYCLE INTELLIGENCE ===

  async beforeRideRequest(userId: string, pickup: Location, drop: Location) {
    // Run these in parallel for speed
    const [destinations, signals, churn] = await Promise.allSettled([
      this.intent.predictDestination(userId),
      this.signals.getUserSignals(userId),
      this.predictive.predictChurn(userId),
    ]);

    return {
      predictedDestinations: destinations.status === 'fulfilled' ? destinations.value.predictedDestinations : [],
      userScore: signals.status === 'fulfilled' ? signals.value.score : 0,
      churnRisk: churn.status === 'fulfilled' ? churn.value.riskLevel : 'low',
    };
  }

  async assessRideSafety(
    userId: string,
    rideData: {
      pickup: Location;
      drop: Location;
      fare: number;
      vehicleType: string;
    }
  ): Promise<FraudAssessment> {
    try {
      return await this.fraud.assessRideRisk(userId, rideData);
    } catch (error) {
      // Fail open with low risk if service unavailable
      logger.warn('Fraud service unavailable, allowing ride:', error);
      return {
        userId,
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        recommendation: 'allow',
        factors: {},
      };
    }
  }

  async afterRideCompleted(
    rideId: string,
    userId: string,
    driverId: string,
    fare: number,
    pickup: Location,
    drop: Location
  ) {
    // Record signals
    await Promise.allSettled([
      this.signals.recordEvent({
        type: 'ride.completed',
        rideId,
        userId,
        driverId,
        fare,
        pickup,
        drop,
        timestamp: new Date(),
      }),
      this.location.recordDemandEvent(pickup.lat, pickup.lng, { type: 'completion' }),
    ]);

    // Credit 10% cashback
    const cashbackAmount = Math.round(fare * 0.10 * 100) / 100;
    const cashbackResult = await this.wallet.creditCashback(
      userId,
      cashbackAmount,
      rideId,
      'ride_completion'
    );

    if (!cashbackResult.success) {
      logger.error('Failed to credit cashback:', cashbackResult.error);
    }

    return {
      cashbackCredited: cashbackResult.success,
      cashbackAmount,
      transactionId: cashbackResult.transactionId,
    };
  }

  // === PRICING INTELLIGENCE ===

  async getDynamicFare(
    pickup: Location,
    vehicleType: string,
    baseFare: number,
    distance: number,
    duration: number
  ): Promise<{ fare: number; surge: number; reasons: string[] }> {
    try {
      const [surgePrediction, demandSignals] = await Promise.all([
        this.location.predictSurge(pickup.lat, pickup.lng),
        this.location.getDemandSignals(pickup.lat, pickup.lng),
      ]);

      const surge = surgePrediction.predictedMultiplier;
      const reasons = surgePrediction.reasons || [];

      // Add demand-based reasons
      if (demandSignals.length > 0) {
        const signal = demandSignals[0];
        if (signal.demandLevel === 'surge') {
          reasons.push('High demand in area');
        }
      }

      const surgeFare = Math.round(baseFare * surge * 100) / 100;

      return {
        fare: surgeFare,
        surge,
        reasons,
      };
    } catch (error) {
      // Fallback to base fare
      logger.warn('Dynamic pricing unavailable:', error);
      return {
        fare: baseFare,
        surge: 1.0,
        reasons: [],
      };
    }
  }

  // === DRIVER INTELLIGENCE ===

  async scoreDriver(driverId: string): Promise<DriverScore> {
    try {
      return await this.predictive.predictDriverScore(driverId);
    } catch (error) {
      logger.warn('Driver scoring unavailable:', error);
      return {
        driverId,
        overallScore: 4.5,
        rating: 4.5,
        acceptanceRate: 0.8,
        cancellationRate: 0.1,
        utilizationRate: 0.6,
        riskFactors: [],
        tier: 'silver',
      };
    }
  }

  async shouldIncentivizeDriver(driverId: string): Promise<{
    shouldIncentivize: boolean;
    incentiveType?: 'bonus' | 'guarantee' | 'peak';
    amount?: number;
    reason: string;
  }> {
    const [score, churn] = await Promise.all([
      this.scoreDriver(driverId),
      this.predictive.predictChurn(driverId).catch(() => null),
    ]);

    // High churn risk → guarantee incentive
    if (churn?.riskLevel === 'high') {
      return {
        shouldIncentivize: true,
        incentiveType: 'guarantee',
        amount: 200,
        reason: 'Prevent driver churn',
      };
    }

    // Low utilization → bonus for going online
    if (score.utilizationRate < 0.4) {
      return {
        shouldIncentivize: true,
        incentiveType: 'bonus',
        amount: 50,
        reason: 'Boost utilization',
      };
    }

    // Peak hours → surge bonus
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
      return {
        shouldIncentivize: true,
        incentiveType: 'peak',
        amount: 100,
        reason: 'Peak hours coverage',
      };
    }

    return { shouldIncentivize: false, reason: 'No incentive needed' };
  }

  // === DEMAND BALANCING ===

  async getSupplyDemandInsights(lat: number, lng: number): Promise<{
    demandLevel: 'low' | 'medium' | 'high' | 'surge';
    activeDrivers: number;
    suggestedSurge: number;
    hotZones: HotZone[];
  }> {
    try {
      const [demandSignals, hotZones] = await Promise.all([
        this.location.getDemandSignals(lat, lng),
        this.location.getHotZones(lat, lng),
      ]);

      const signal = demandSignals[0] || {
        demandLevel: 'low' as const,
        activeDrivers: 0,
        surgeMultiplier: 1,
      };

      return {
        demandLevel: signal.demandLevel,
        activeDrivers: signal.activeDrivers,
        suggestedSurge: signal.surgeMultiplier,
        hotZones,
      };
    } catch (error) {
      logger.warn('Demand insights unavailable:', error);
      return {
        demandLevel: 'medium',
        activeDrivers: 0,
        suggestedSurge: 1.0,
        hotZones: [],
      };
    }
  }

  // === UTILITY METHODS ===

  generateSecureOTP(): string {
    return randomBytes(2).toString('hex').toUpperCase();
  }

  generateSecureId(): string {
    return randomBytes(16).toString('hex');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

let intelligenceClient: KHAIRMOVEIntelligence | null = null;

export function getIntelligence(): KHAIRMOVEIntelligence {
  if (!intelligenceClient) {
    intelligenceClient = new KHAIRMOVEIntelligence();
  }
  return intelligenceClient;
}

// Export individual services for direct use
export function getIntentService(): IntentService {
  return getIntelligence().intent;
}

export function getSignalService(): SignalService {
  return getIntelligence().signals;
}

export function getFraudService(): FraudService {
  return getIntelligence().fraud;
}

export function getPredictiveService(): PredictiveService {
  return getIntelligence().predictive;
}

export function getLocationService(): LocationService {
  return getIntelligence().location;
}

export function getMemoryService(): MemoryService {
  return getIntelligence().memory;
}

export function getAuthService(): AuthService {
  return getIntelligence().auth;
}

export function getWalletService(): WalletService {
  return getIntelligence().wallet;
}

export function getPaymentService(): PaymentService {
  return getIntelligence().payment;
}

export function getNotificationService(): NotificationService {
  return getIntelligence().notification;
}
