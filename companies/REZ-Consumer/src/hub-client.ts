/**
 * REZ-Consumer Hub Client
 *
 * Unified client for all service integrations:
 * - RABTUL (payments, auth, wallet)
 * - HOJAI AI (memory, agents, intelligence)
 * - SUTAR OS (twin, goals, decisions)
 * - REZ Intelligence (fraud, intent, signals)
 * - Internal microservices
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { config, rabtulServices, hojaiServices, sutarServices, rezIntelligenceServices, internalServices } from './config';
import type {
  User,
  WalletBalance,
  Transaction,
  PaymentRequest,
  PaymentResult,
  SafeQRCode,
  SafeQREmergency,
  EmergencyMode,
  VerifyQRCode,
  VerifyResult,
  LoyaltyPoints,
  KarmaScore,
  KarmaAction,
  RiderProfile,
  BikeDigitalTwin,
  Ride,
  SOSAlert,
  Restaurant,
  RestaurantMenu,
  FoodSearch,
  APIResponse,
} from './types';

// ============================================
// HTTP CLIENT FACTORY
// ============================================

function createClient(baseURL: string, timeout: number = 10000): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': config.internalToken,
      'X-Service-Name': 'REZ-Consumer',
    },
  });
}

// ============================================
// SERVICE CLIENTS
// ============================================

// RABTUL Services
const authClient = createClient(rabtulServices.AUTH.url, rabtulServices.AUTH.timeout);
const paymentClient = createClient(rabtulServices.PAYMENT.url, rabtulServices.PAYMENT.timeout);
const walletClient = createClient(rabtulServices.WALLET.url, rabtulServices.WALLET.timeout);
const orderClient = createClient(rabtulServices.ORDER.url, rabtulServices.ORDER.timeout);
const bookingClient = createClient(rabtulServices.BOOKING.url, rabtulServices.BOOKING.timeout);
const notificationClient = createClient(rabtulServices.NOTIFICATIONS.url, rabtulServices.NOTIFICATIONS.timeout);

// HOJAI AI Services
const genieMemoryClient = createClient(hojaiServices.GENIE_MEMORY.url, hojaiServices.GENIE_MEMORY.timeout);
const genieRelationClient = createClient(hojaiServices.GENIE_RELATION.url, hojaiServices.GENIE_RELATION.timeout);
const genieBriefingClient = createClient(hojaiServices.GENIE_BRIEFING.url, hojaiServices.GENIE_BRIEFING.timeout);
const commerceAIClient = createClient(hojaiServices.COMMERCE_AI.url, hojaiServices.COMMERCE_AI.timeout);
const customerAIClient = createClient(hojaiServices.CUSTOMER_AI.url, hojaiServices.CUSTOMER_AI.timeout);
const marketingAIClient = createClient(hojaiServices.MARKETING_AI.url, hojaiServices.MARKETING_AI.timeout);
const financialAIClient = createClient(hojaiServices.FINANCIAL_AI.url, hojaiServices.FINANCIAL_AI.timeout);
const hojaiMemoryClient = createClient(hojaiServices.MEMORY.url, hojaiServices.MEMORY.timeout);
const hojaiAgentsClient = createClient(hojaiServices.AGENTS.url, hojaiServices.AGENTS.timeout);
const voiceOSClient = createClient(hojaiServices.VOICE_OS.url, hojaiServices.VOICE_OS.timeout);
const voiceAgentsClient = createClient(hojaiServices.VOICE_AGENTS.url, hojaiServices.VOICE_AGENTS.timeout);

// SUTAR OS Services
const sutarTwinClient = createClient(sutarServices.TWIN_OS.url, sutarServices.TWIN_OS.timeout);
const sutarGoalClient = createClient(sutarServices.GOAL.url, sutarServices.GOAL.timeout);
const sutarDecisionClient = createClient(sutarServices.DECISION.url, sutarServices.DECISION.timeout);

// REZ Intelligence Services
const fraudClient = createClient(rezIntelligenceServices.FRAUD.url, rezIntelligenceServices.FRAUD.timeout);
const signalClient = createClient(rezIntelligenceServices.SIGNAL.url, rezIntelligenceServices.SIGNAL.timeout);
const intentClient = createClient(rezIntelligenceServices.INTENT.url, rezIntelligenceServices.INTENT.timeout);
const predictClient = createClient(rezIntelligenceServices.PREDICT.url, rezIntelligenceServices.PREDICT.timeout);
const memoryLayerClient = createClient(rezIntelligenceServices.MEMORY_LAYER.url, rezIntelligenceServices.MEMORY_LAYER.timeout);

// Internal Microservices
const safeQRClient = createClient(internalServices.SAFE_QR.url, internalServices.SAFE_QR.timeout);
const verifyQRClient = createClient(internalServices.VERIFY_QR.url, internalServices.VERIFY_QR.timeout);
const go4FoodClient = createClient(internalServices.GO4FOOD.url, internalServices.GO4FOOD.timeout);
const riderCircleClient = createClient(internalServices.RIDER_CIRCLE.url, internalServices.RIDER_CIRCLE.timeout);
const inboxClient = createClient(internalServices.INBOX.url, internalServices.INBOX.timeout);
const assistantClient = createClient(internalServices.ASSISTANT.url, internalServices.ASSISTANT.timeout);
const nearbyClient = createClient(internalServices.NEARBY.url, internalServices.NEARBY.timeout);

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function safeCall<T>(client: AxiosInstance, method: string, url: string, data?: unknown): Promise<T | null> {
  try {
    const response = await client.request({ method, url, data });
    return response.data as T;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`[HubClient] ${method} ${url} failed:`, axiosError.message);
    return null;
  }
}

// ============================================
// REZ-CONSUMER HUB CLIENT CLASS
// ============================================

class REZConsumerHub {
  // ============================================
  // RABTUL SERVICES - Auth, Wallet, Payments
  // ============================================

  async authenticateUser(phone: string, name?: string): Promise<APIResponse<User>> {
    return safeCall(authClient, 'POST', '/api/users/auth', { phone, name }) || {
      success: false,
      error: 'Auth service unavailable',
      timestamp: new Date(),
    };
  }

  async verifyOTP(phone: string, otp: string): Promise<APIResponse<{ token: string; user: User }>> {
    return safeCall(authClient, 'POST', '/api/users/otp/verify', { phone, otp }) || {
      success: false,
      error: 'OTP verification failed',
      timestamp: new Date(),
    };
  }

  async getWalletBalance(userId: string): Promise<APIResponse<WalletBalance>> {
    return safeCall(walletClient, 'POST', '/api/wallet/balance', { user_id: userId }) || {
      success: false,
      error: 'Wallet service unavailable',
      timestamp: new Date(),
    };
  }

  async creditWallet(userId: string, amount: number, source: string): Promise<APIResponse<Transaction>> {
    return safeCall(walletClient, 'POST', '/api/wallet/credit', { user_id: userId, amount, source }) || {
      success: false,
      error: 'Credit operation failed',
      timestamp: new Date(),
    };
  }

  async debitWallet(userId: string, amount: number, source: string): Promise<APIResponse<Transaction>> {
    return safeCall(walletClient, 'POST', '/api/wallet/debit', { user_id: userId, amount, source }) || {
      success: false,
      error: 'Debit operation failed',
      timestamp: new Date(),
    };
  }

  async makePayment(request: PaymentRequest): Promise<APIResponse<PaymentResult>> {
    return safeCall(paymentClient, 'POST', '/api/payments/initiate', request) || {
      success: false,
      error: 'Payment initiation failed',
      timestamp: new Date(),
    };
  }

  async getTransactions(userId: string, limit: number = 20): Promise<APIResponse<Transaction[]>> {
    return safeCall(walletClient, 'POST', '/api/wallet/transactions', { user_id: userId, limit }) || {
      success: false,
      error: 'Failed to fetch transactions',
      timestamp: new Date(),
    };
  }

  async createOrder(orderData: unknown): Promise<APIResponse<unknown>> {
    return safeCall(orderClient, 'POST', '/api/orders/create', orderData) || {
      success: false,
      error: 'Order creation failed',
      timestamp: new Date(),
    };
  }

  async getOrderStatus(orderId: string): Promise<APIResponse<unknown>> {
    return safeCall(orderClient, 'GET', `/api/orders/${orderId}/status`) || {
      success: false,
      error: 'Failed to get order status',
      timestamp: new Date(),
    };
  }

  async createBooking(bookingData: unknown): Promise<APIResponse<unknown>> {
    return safeCall(bookingClient, 'POST', '/api/bookings/create', bookingData) || {
      success: false,
      error: 'Booking creation failed',
      timestamp: new Date(),
    };
  }

  async sendNotification(userId: string, title: string, body: string, data?: unknown): Promise<APIResponse> {
    return safeCall(notificationClient, 'POST', '/api/notifications/send', { user_id: userId, title, body, data }) || {
      success: false,
      error: 'Notification failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // HOJAI GENIE - Personal AI
  // ============================================

  async remember(userId: string, content: string, importance: number = 5): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/remember', {
      user_id: userId,
      content,
      importance,
      type: 'personal_experience',
    }) || { success: false, error: 'Memory service unavailable', timestamp: new Date() };
  }

  async recall(userId: string, query: string): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/recall', { user_id: userId, query }) || {
      success: false,
      error: 'Recall failed',
      timestamp: new Date(),
    };
  }

  async getMemories(userId: string, limit: number = 20): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/memories', { user_id: userId, limit }) || {
      success: false,
      error: 'Failed to get memories',
      timestamp: new Date(),
    };
  }

  async trackRelationship(userId: string, targetId: string, type: string, strength: number = 50): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/track', {
      user_id: userId,
      target_id: targetId,
      type,
      strength,
    }) || { success: false, error: 'Relationship tracking failed', timestamp: new Date() };
  }

  async getRelationships(userId: string): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/relationships', { user_id: userId }) || {
      success: false,
      error: 'Failed to get relationships',
      timestamp: new Date(),
    };
  }

  async getRelationshipInsights(userId: string): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/insights', { user_id: userId }) || {
      success: false,
      error: 'Failed to get insights',
      timestamp: new Date(),
    };
  }

  async generateDailyBriefing(userId: string, date?: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/generate', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    }) || { success: false, error: 'Briefing generation failed', timestamp: new Date() };
  }

  async getBriefing(userId: string, date?: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/briefing', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    }) || { success: false, error: 'Failed to get briefing', timestamp: new Date() };
  }

  async getWeeklyBriefing(userId: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/weekly', { user_id: userId }) || {
      success: false,
      error: 'Failed to get weekly briefing',
      timestamp: new Date(),
    };
  }

  // ============================================
  // HOJAI INTELLIGENCE SUITE
  // ============================================

  async getCommerceInsight(userId: string, action: string): Promise<APIResponse> {
    return safeCall(commerceAIClient, 'POST', '/api/v1/insight', { user_id: userId, action }) || {
      success: false,
      error: 'Commerce AI unavailable',
      timestamp: new Date(),
    };
  }

  async getCustomerInsight(userId: string, intent?: string): Promise<APIResponse> {
    return safeCall(customerAIClient, 'POST', '/api/v1/insight', { user_id: userId, intent }) || {
      success: false,
      error: 'Customer AI unavailable',
      timestamp: new Date(),
    };
  }

  async getMarketingOffer(userId: string, context?: unknown): Promise<APIResponse> {
    return safeCall(marketingAIClient, 'POST', '/api/v1/offer', { user_id: userId, ...context }) || {
      success: false,
      error: 'Marketing AI unavailable',
      timestamp: new Date(),
    };
  }

  async getFinancialSummary(userId: string): Promise<APIResponse> {
    return safeCall(financialAIClient, 'POST', '/api/v1/summary', { user_id: userId }) || {
      success: false,
      error: 'Financial AI unavailable',
      timestamp: new Date(),
    };
  }

  async getSpendingInsights(userId: string, period: string = '30d'): Promise<APIResponse> {
    return safeCall(financialAIClient, 'POST', '/api/v1/spending', { user_id: userId, period }) || {
      success: false,
      error: 'Spending insights unavailable',
      timestamp: new Date(),
    };
  }

  // ============================================
  // HOJAI CORE - Memory& Agents
  // ============================================

  async storePreference(userId: string, preference: unknown): Promise<APIResponse> {
    return safeCall(hojaiMemoryClient, 'POST', '/api/v1/memory/store', {
      user_id: userId,
      type: 'consumer_preference',
      data: preference,
    }) || { success: false, error: 'Preference storage failed', timestamp: new Date() };
  }

  async getPreferences(userId: string): Promise<APIResponse> {
    return safeCall(hojaiMemoryClient, 'POST', '/api/v1/memory/retrieve', {
      user_id: userId,
      type: 'consumer_preference',
    }) || { success: false, error: 'Failed to get preferences', timestamp: new Date() };
  }

  async chatWithAssistant(userId: string, message: string): Promise<APIResponse> {
    return safeCall(hojaiAgentsClient, 'POST', '/api/v1/agents/assistant/query', {
      user_id: userId,
      message,
      context: 'consumer_app',
    }) || { success: false, error: 'Assistant unavailable', timestamp: new Date() };
  }

  async voiceCommand(userId: string, audioData: string): Promise<APIResponse> {
    return safeCall(voiceAgentsClient, 'POST', '/api/v1/command', { user_id: userId, audio: audioData }) || {
      success: false,
      error: 'Voice command failed',
      timestamp: new Date(),
    };
  }

  async textToSpeech(text: string, voice?: string): Promise<APIResponse> {
    return safeCall(voiceOSClient, 'POST', '/api/v1/tts', { text, voice: voice || 'default' }) || {
      success: false,
      error: 'TTS failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // SUTAR OS - Twin, Goals, Decisions
  // ============================================

  async getUserTwin(userId: string): Promise<APIResponse> {
    return safeCall(sutarTwinClient, 'POST', '/api/v1/twins/retrieve', { entity_id: userId, type: 'user' }) || {
      success: false,
      error: 'Twin retrieval failed',
      timestamp: new Date(),
    };
  }

  async createUserTwin(userId: string, data: unknown): Promise<APIResponse> {
    return safeCall(sutarTwinClient, 'POST', '/api/v1/twins', { entity_id: userId, type: 'user', data }) || {
      success: false,
      error: 'Twin creation failed',
      timestamp: new Date(),
    };
  }

  async updateUserTwin(userId: string, updates: unknown): Promise<APIResponse> {
    return safeCall(sutarTwinClient, 'POST', '/api/v1/twins/update', { entity_id: userId, type: 'user', updates }) || {
      success: false,
      error: 'Twin update failed',
      timestamp: new Date(),
    };
  }

  async setUserGoal(userId: string, goal: unknown): Promise<APIResponse> {
    return safeCall(sutarGoalClient, 'POST', '/api/v1/goals', { entity_id: userId, goal }) || {
      success: false,
      error: 'Goal setting failed',
      timestamp: new Date(),
    };
  }

  async getUserGoals(userId: string): Promise<APIResponse> {
    return safeCall(sutarGoalClient, 'POST', '/api/v1/goals', { entity_id: userId }) || {
      success: false,
      error: 'Failed to get goals',
      timestamp: new Date(),
    };
  }

  async makeAutonomousDecision(userId: string, context: unknown): Promise<APIResponse> {
    return safeCall(sutarDecisionClient, 'POST', '/api/v1/decide', { entity_id: userId, context }) || {
      success: false,
      error: 'Decision failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // REZ INTELLIGENCE - Fraud, Intent, Signals
  // ============================================

  async checkFraud(userId: string, transactionType: string, amount?: number): Promise<APIResponse> {
    return safeCall(fraudClient, 'POST', '/api/score', { user_id: userId, transaction_type: transactionType, amount }) || {
      success: false,
      error: 'Fraud check failed',
      timestamp: new Date(),
    };
  }

  async trackEvent(userId: string, event: string, data?: unknown): Promise<APIResponse> {
    return safeCall(signalClient, 'POST', '/api/collect', {
      service: 'REZ-Consumer',
      event,
      user_id: userId,
      data,
    }) || { success: false, error: 'Event tracking failed', timestamp: new Date() };
  }

  async trackPageView(userId: string, page: string): Promise<APIResponse> {
    return this.trackEvent(userId, 'page.viewed', { page });
  }

  async trackSearch(userId: string, query: string): Promise<APIResponse> {
    return this.trackEvent(userId, 'search.performed', { query });
  }

  // ============================================
  // COMMERCE EVENTS
  // ============================================

  async publishCommerceEvent(userId: string, event: string, data?: unknown): Promise<APIResponse> {
    return safeCall(signalClient, 'POST', '/api/commerce/event', {
      user_id: userId,
      event,
      data,
      source: 'REZ-Consumer',
    }) || { success: false, error: 'Event publish failed', timestamp: new Date() };
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<APIResponse> {
    return this.getUserRecommendations(userId, limit);
  }

  async getBookingStatus(bookingId: string): Promise<APIResponse> {
    return safeCall(bookingClient, 'GET', `/api/bookings/${bookingId}/status`) || {
      success: false,
      error: 'Booking status unavailable',
      timestamp: new Date(),
    };
  }

  async predictIntent(userId: string): Promise<APIResponse> {
    return safeCall(intentClient, 'POST', '/api/predict', { user_id: userId }) || {
      success: false,
      error: 'Intent prediction failed',
      timestamp: new Date(),
    };
  }

  async predictNextAction(userId: string): Promise<APIResponse> {
    return safeCall(predictClient, 'POST', '/api/next-action', { user_id: userId }) || {
      success: false,
      error: 'Next action prediction failed',
      timestamp: new Date(),
    };
  }

  async getPersonalRecommendations(userId: string, context?: unknown): Promise<APIResponse> {
    return safeCall(memoryLayerClient, 'POST', '/api/recommendations/personal', { user_id: userId, context }) || {
      success: false,
      error: 'Recommendations unavailable',
      timestamp: new Date(),
    };
  }

  // ============================================
  // SAFE QR - 15 Emergency Modes
  // ============================================

  async createSafeQR(userId: string, mode: EmergencyMode, options?: { expiresIn?: number }): Promise<APIResponse<SafeQRCode>> {
    return safeCall(safeQRClient, 'POST', '/api/qr/create', { user_id: userId, mode, ...options }) || {
      success: false,
      error: 'QR creation failed',
      timestamp: new Date(),
    };
  }

  async getSafeQR(userId: string, mode?: EmergencyMode): Promise<APIResponse<SafeQRCode>> {
    const url = mode ? `/api/qr/${userId}/${mode}` : `/api/qr/${userId}`;
    return safeCall(safeQRClient, 'GET', url) || { success: false, error: 'QR retrieval failed', timestamp: new Date() };
  }

  async triggerEmergency(userId: string, mode: EmergencyMode, location?: { lat: number; lng: number }): Promise<APIResponse<SafeQREmergency>> {
    return safeCall(safeQRClient, 'POST', '/api/emergency/trigger', { user_id: userId, mode, location }) || {
      success: false,
      error: 'Emergency trigger failed',
      timestamp: new Date(),
    };
  }

  async resolveEmergency(emergencyId: string): Promise<APIResponse> {
    return safeCall(safeQRClient, 'POST', `/api/emergency/${emergencyId}/resolve`) || {
      success: false,
      error: 'Emergency resolution failed',
      timestamp: new Date(),
    };
  }

  async getEmergencyHistory(userId: string): Promise<APIResponse<SafeQREmergency[]>> {
    return safeCall(safeQRClient, 'GET', `/api/emergency/history/${userId}`) || {
      success: false,
      error: 'Failed to get emergency history',
      timestamp: new Date(),
    };
  }

  // ============================================
  // VERIFY QR - Product Authenticity
  // ============================================

  async verifyQRCode(serialNumber: string, options?: { includeWarranty?: boolean }): Promise<APIResponse<VerifyResult>> {
    return safeCall(verifyQRClient, 'POST', '/api/verify', { serial_number: serialNumber, ...options }) || {
      success: false,
      error: 'Verification failed',
      timestamp: new Date(),
    };
  }

  async registerProduct(productData: unknown): Promise<APIResponse> {
    return safeCall(verifyQRClient, 'POST', '/api/products/register', productData) || {
      success: false,
      error: 'Product registration failed',
      timestamp: new Date(),
    };
  }

  async fileClaim(userId: string, productId: string, claimType: string, description: string): Promise<APIResponse> {
    return safeCall(verifyQRClient, 'POST', '/api/claims/file', { user_id: userId, product_id: productId, claim_type: claimType, description }) || {
      success: false,
      error: 'Claim filing failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // LOYALTY & REWARDS
  // ============================================

  async getLoyaltyPoints(userId: string): Promise<APIResponse<LoyaltyPoints>> {
    return safeCall(walletClient, 'POST', '/api/loyalty/balance', { user_id: userId }) || {
      success: false,
      error: 'Loyalty service unavailable',
      timestamp: new Date(),
    };
  }

  async awardPoints(userId: string, points: number, action: string): Promise<APIResponse> {
    return safeCall(walletClient, 'POST', '/api/loyalty/award', { user_id: userId, points, action }) || {
      success: false,
      error: 'Points award failed',
      timestamp: new Date(),
    };
  }

  async redeemPoints(userId: string, points: number, rewardId: string): Promise<APIResponse> {
    return safeCall(walletClient, 'POST', '/api/loyalty/redeem', { user_id: userId, points, reward_id: rewardId }) || {
      success: false,
      error: 'Points redemption failed',
      timestamp: new Date(),
    };
  }

  async getKarmaScore(userId: string): Promise<APIResponse<KarmaScore>> {
    return safeCall(safeQRClient, 'GET', `/api/karma/score/${userId}`) || {
      success: false,
      error: 'Karma score unavailable',
      timestamp: new Date(),
    };
  }

  async recordKarmaAction(userId: string, action: KarmaAction): Promise<APIResponse> {
    return safeCall(safeQRClient, 'POST', '/api/karma/action', action) || {
      success: false,
      error: 'Karma action recording failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // RIDER CIRCLE - Adventure Mobility
  // ============================================

  async getRiderProfile(userId: string): Promise<APIResponse<RiderProfile>> {
    return safeCall(riderCircleClient, 'GET', `/api/riders/${userId}`) || {
      success: false,
      error: 'Rider profile unavailable',
      timestamp: new Date(),
    };
  }

  async createRiderProfile(profile: Partial<RiderProfile>): Promise<APIResponse<RiderProfile>> {
    return safeCall(riderCircleClient, 'POST', '/api/riders', profile) || {
      success: false,
      error: 'Rider profile creation failed',
      timestamp: new Date(),
    };
  }

  async getBikeHealth(riderId: string, bikeId: string): Promise<APIResponse<BikeDigitalTwin>> {
    return safeCall(riderCircleClient, 'GET', `/api/bikes/${bikeId}/health`) || {
      success: false,
      error: 'Bike health unavailable',
      timestamp: new Date(),
    };
  }

  async startRide(riderId: string, bikeId: string, title: string): Promise<APIResponse<Ride>> {
    return safeCall(riderCircleClient, 'POST', '/api/rides', { rider_id: riderId, bike_id: bikeId, title }) || {
      success: false,
      error: 'Ride start failed',
      timestamp: new Date(),
    };
  }

  async trackRide(rideId: string, coordinates: [number, number], speed?: number): Promise<APIResponse> {
    return safeCall(riderCircleClient, 'POST', `/api/rides/${rideId}/track`, { coordinates, speed }) || {
      success: false,
      error: 'Ride tracking failed',
      timestamp: new Date(),
    };
  }

  async completeRide(rideId: string): Promise<APIResponse<Ride>> {
    return safeCall(riderCircleClient, 'POST', `/api/rides/${rideId}/complete`) || {
      success: false,
      error: 'Ride completion failed',
      timestamp: new Date(),
    };
  }

  async triggerSOS(riderId: string, type: EmergencyMode, location: { lat: number; lng: number }): Promise<APIResponse<SOSAlert>> {
    return safeCall(riderCircleClient, 'POST', '/api/sos', { rider_id: riderId, type, location }) || {
      success: false,
      error: 'SOS trigger failed',
      timestamp: new Date(),
    };
  }

  async getNearbySOS(lat: number, lng: number): Promise<APIResponse<SOSAlert[]>> {
    return safeCall(riderCircleClient, 'GET', `/api/sos/nearby?lat=${lat}&lng=${lng}`) || {
      success: false,
      error: 'Nearby SOS unavailable',
      timestamp: new Date(),
    };
  }

  // ============================================
  // GO4FOOD - Restaurant Discovery
  // ============================================

  async searchRestaurants(search: FoodSearch): Promise<APIResponse<Restaurant[]>> {
    return safeCall(go4FoodClient, 'POST', '/api/search', search) || {
      success: false,
      error: 'Restaurant search failed',
      timestamp: new Date(),
    };
  }

  async getRestaurantMenu(restaurantId: string): Promise<APIResponse<RestaurantMenu>> {
    return safeCall(go4FoodClient, 'GET', `/api/menu/${restaurantId}`) || {
      success: false,
      error: 'Menu retrieval failed',
      timestamp: new Date(),
    };
  }

  async comparePrices(restaurantId: string, itemId: string): Promise<APIResponse> {
    return safeCall(go4FoodClient, 'POST', '/api/compare', { restaurant_id: restaurantId, item_id: itemId }) || {
      success: false,
      error: 'Price comparison failed',
      timestamp: new Date(),
    };
  }

  async getFoodAdvisor(preferences: unknown): Promise<APIResponse> {
    return safeCall(go4FoodClient, 'POST', '/api/advisor', preferences) || {
      success: false,
      error: 'Food advisor unavailable',
      timestamp: new Date(),
    };
  }

  // ============================================
  // INBOX& ASSISTANT
  // ============================================

  async getInboxMessages(userId: string): Promise<APIResponse> {
    return safeCall(inboxClient, 'GET', `/api/messages/${userId}`) || {
      success: false,
      error: 'Inbox retrieval failed',
      timestamp: new Date(),
    };
  }

  async parseReceipt(imageUrl: string): Promise<APIResponse> {
    return safeCall(inboxClient, 'POST', '/api/parse/receipt', { image_url: imageUrl }) || {
      success: false,
      error: 'Receipt parsing failed',
      timestamp: new Date(),
    };
  }

  async chatWithAssistantService(userId: string, message: string): Promise<APIResponse> {
    return safeCall(assistantClient, 'POST', '/api/chat', { user_id: userId, message }) || {
      success: false,
      error: 'Assistant chat failed',
      timestamp: new Date(),
    };
  }

  async getNearbyPlaces(lat: number, lng: number, category?: string): Promise<APIResponse> {
    return safeCall(nearbyClient, 'GET', `/api/places?lat=${lat}&lng=${lng}&category=${category || ''}`) || {
      success: false,
      error: 'Nearby places unavailable',
      timestamp: new Date(),
    };
  }

  // ============================================
  // USER PROFILE & SOCIAL
  // ============================================

  async getUserProfile(userId: string): Promise<APIResponse<User>> {
    return safeCall(authClient, 'GET', `/api/users/${userId}`) || {
      success: false,
      error: 'Profile retrieval failed',
      timestamp: new Date(),
    };
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<APIResponse<User>> {
    return safeCall(authClient, 'PATCH', `/api/users/${userId}`, updates) || {
      success: false,
      error: 'Profile update failed',
      timestamp: new Date(),
    };
  }

  async addEmergencyContact(userId: string, contact: unknown): Promise<APIResponse> {
    return safeCall(authClient, 'POST', `/api/users/${userId}/emergency-contacts`, contact) || {
      success: false,
      error: 'Emergency contact addition failed',
      timestamp: new Date(),
    };
  }

  async getEmergencyContacts(userId: string): Promise<APIResponse> {
    return safeCall(authClient, 'GET', `/api/users/${userId}/emergency-contacts`) || {
      success: false,
      error: 'Emergency contacts retrieval failed',
      timestamp: new Date(),
    };
  }

  // ============================================
  // ANALYTICS & INSIGHTS
  // ============================================

  async getUserEngagementScore(userId: string): Promise<APIResponse> {
    return safeCall(signalClient, 'POST', '/api/engagement/score', { user_id: userId }) || {
      success: false,
      error: 'Engagement score unavailable',
      timestamp: new Date(),
    };
  }

  async getUserSpendingSummary(userId: string, period: string = '30d'): Promise<APIResponse> {
    return safeCall(financialAIClient, 'POST', '/api/v1/spending/summary', { user_id: userId, period }) || {
      success: false,
      error: 'Spending summary unavailable',
      timestamp: new Date(),
    };
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<APIResponse> {
    return safeCall(commerceAIClient, 'POST', '/api/v1/recommendations', { user_id: userId, limit }) || {
      success: false,
      error: 'Recommendations unavailable',
      timestamp: new Date(),
    };
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const rezConsumerHub = new REZConsumerHub();
export default rezConsumerHub;