import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Integration Hub - Connects ReZ Ride with all ecosystem services
 * RABTUL, REZ Intelligence, REZ Media, CorpPerks
 */

export interface IntegrationStatus {
  service: string;
  connected: boolean;
  latency: number;
  lastSync: Date;
}

// ===========================================
// RABTUL INTEGRATION
// ===========================================

@Injectable()
export class RABTULClient {
  private readonly logger = new Logger('RABTULClient');
  private readonly authUrl: string;
  private readonly walletUrl: string;
  private readonly notifsUrl: string;
  private readonly profileUrl: string;

  constructor() {
    this.authUrl = process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002';
    this.walletUrl = process.env.REZ_WALLET_SERVICE_URL || 'http://localhost:4004';
    this.notifsUrl = process.env.REZ_NOTIFICATIONS_URL || 'http://localhost:4011';
    this.profileUrl = process.env.REZ_PROFILE_SERVICE_URL || 'http://localhost:4013';
  }

  // Auth
  async verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await axios.post(
        `${this.authUrl}/api/auth/verify`,
        { token },
        { timeout: 5000 }
      );
      return { valid: true, user: response.data };
    } catch (error) {
      return { valid: false };
    }
  }

  // Wallet
  async debitWallet(userId: string, amount: number, rideId: string) {
    try {
      const response = await axios.post(
        `${this.walletUrl}/api/wallet/debit`,
        { user_id: userId, amount, ride_id: rideId },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Wallet debit failed: ${error.message}`);
      throw error;
    }
  }

  async creditWallet(userId: string, amount: number, rideId: string) {
    try {
      const response = await axios.post(
        `${this.walletUrl}/api/wallet/credit`,
        { user_id: userId, amount, ride_id: rideId },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Wallet credit failed: ${error.message}`);
      throw error;
    }
  }

  async getBalance(userId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.walletUrl}/api/wallet/balance/${userId}`,
        { timeout: 5000 }
      );
      return response.data.balance || 0;
    } catch (error) {
      return 0;
    }
  }

  // Notifications
  async sendPush(userId: string, notification: any): Promise<void> {
    try {
      await axios.post(
        `${this.notifsUrl}/api/notifications/send`,
        { userId, ...notification },
        { timeout: 5000 }
      );
    } catch (error) {
      this.logger.warn(`Push failed: ${error.message}`);
    }
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${this.notifsUrl}/api/notifications/sms`,
        { phone, message },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`SMS failed: ${error.message}`);
    }
  }

  async sendWhatsApp(phone: string, template: string, data: any): Promise<void> {
    try {
      await axios.post(
        `${this.notifsUrl}/api/notifications/whatsapp`,
        { phone, template, data },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`WhatsApp failed: ${error.message}`);
    }
  }

  // Profile
  async getProfile(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.profileUrl}/api/profiles/${userId}`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(userId: string, updates: any): Promise<void> {
    try {
      await axios.patch(
        `${this.profileUrl}/api/profiles/${userId}`,
        updates,
        { timeout: 5000 }
      );
    } catch (error) {
      this.logger.warn(`Profile update failed: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<IntegrationStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.authUrl}/health`, { timeout: 3000 });
      return { service: 'RABTUL', connected: true, latency: Date.now() - start, lastSync: new Date() };
    } catch {
      return { service: 'RABTUL', connected: false, latency: 0, lastSync: new Date() };
    }
  }
}

// ===========================================
// REZ INTELLIGENCE INTEGRATION
// ===========================================

@Injectable()
export class REZIntelligenceClient {
  private readonly logger = new Logger('REZIntelligence');
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4062';
  }

  // Intent prediction
  async predictIntent(userId: string, context: any): Promise<{
    intent: string;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/intent/predict`,
        { userId, context },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Intent prediction failed: ${error.message}`);
      return { intent: 'ride', confidence: 0.5, suggestions: [] };
    }
  }

  // Churn prediction
  async predictChurn(userId: string): Promise<{
    score: number;
    risk: string;
    recommendedActions: string[];
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/churn/${userId}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      return { score: 50, risk: 'medium', recommendedActions: [] };
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: string;
    score: number;
    emotions: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/sentiment`,
        { text },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return { sentiment: 'neutral', score: 0, emotions: [] };
    }
  }

  // LTV prediction
  async predictLTV(userId: string): Promise<{
    ltv3Month: number;
    ltv6Month: number;
    segment: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/ltv/${userId}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      return { ltv3Month: 0, ltv6Month: 0, segment: 'new' };
    }
  }

  // Attribution tracking
  async trackEvent(event: any): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/events/track`,
        event,
        { timeout: 5000 }
      );
    } catch (error) {
      this.logger.warn(`Event tracking failed: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<IntegrationStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return { service: 'REZ Intelligence', connected: true, latency: Date.now() - start, lastSync: new Date() };
    } catch {
      return { service: 'REZ Intelligence', connected: false, latency: 0, lastSync: new Date() };
    }
  }
}

// ===========================================
// REZ MEDIA INTEGRATION
// ===========================================

@Injectable()
export class REZMediaClient {
  private readonly logger = new Logger('REZMedia');
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REZ_MEDIA_URL || 'http://localhost:4000';
  }

  // Check campaign eligibility
  async checkCampaignEligibility(userId: string, campaignType: string): Promise<{
    eligible: boolean;
    voucher?: { code: string; discount: number };
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/campaigns/eligibility`,
        { params: { userId, type: campaignType }, timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return { eligible: false };
    }
  }

  // Apply voucher
  async applyVoucher(userId: string, voucherCode: string): Promise<{
    success: boolean;
    discount: number;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/vouchers/apply`,
        { userId, code: voucherCode },
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return { success: false, discount: 0 };
    }
  }

  // Track ad impression
  async trackImpression(userId: string, adId: string, context: any): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/ads/impression`,
        { userId, adId, context, timestamp: new Date() },
        { timeout: 5000 }
      );
    } catch (error) {
      this.logger.warn(`Impression tracking failed: ${error.message}`);
    }
  }

  // Get personalized offer
  async getPersonalizedOffer(userId: string, context: any): Promise<{
    offer?: { type: string; value: number; expiresAt: Date };
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/offers/personalized`,
        { params: { userId, context }, timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return {};
    }
  }

  // Health check
  async healthCheck(): Promise<IntegrationStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return { service: 'REZ Media', connected: true, latency: Date.now() - start, lastSync: new Date() };
    } catch {
      return { service: 'REZ Media', connected: false, latency: 0, lastSync: new Date() };
    }
  }
}

// ===========================================
// CORPPARKS INTEGRATION
// ===========================================

@Injectable()
export class CorpPerksClient {
  private readonly logger = new Logger('CorpPerks');
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor() {
    this.baseUrl = process.env.CORPPARKS_URL || 'http://localhost:4000';
    this.internalToken = process.env.INTERNAL_SERVICE_TOKEN || '';
  }

  // Verify corporate employee
  async verifyEmployee(email: string): Promise<{
    valid: boolean;
    employee?: {
      id: string;
      companyId: string;
      department: string;
      level: string;
      benefits: string[];
    };
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/employees/verify`,
        {
          params: { email },
          headers: { 'X-Internal-Token': this.internalToken },
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }

  // Create expense record
  async createExpense(expense: {
    employeeId: string;
    companyId: string;
    amount: number;
    category: string;
    rideId: string;
  }): Promise<{ expenseId: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/expenses`,
        expense,
        {
          headers: { 'X-Internal-Token': this.internalToken },
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Expense creation failed: ${error.message}`);
      return { expenseId: '' };
    }
  }

  // Generate GST invoice
  async generateInvoice(companyId: string, expenses: any[]): Promise<{
    invoiceId: string;
    invoiceUrl: string;
    gstAmount: number;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/invoices`,
        { companyId, expenses },
        {
          headers: { 'X-Internal-Token': this.internalToken },
          timeout: 10000
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Invoice generation failed: ${error.message}`);
      throw error;
    }
  }

  // Sync employee data
  async syncEmployees(companyId: string): Promise<{ synced: number }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/employees/sync`,
        { companyId },
        {
          headers: { 'X-Internal-Token': this.internalToken },
          timeout: 30000
        }
      );
      return response.data;
    } catch (error) {
      return { synced: 0 };
    }
  }

  // Health check
  async healthCheck(): Promise<IntegrationStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return { service: 'CorpPerks', connected: true, latency: Date.now() - start, lastSync: new Date() };
    } catch {
      return { service: 'CorpPerks', connected: false, latency: 0, lastSync: new Date() };
    }
  }
}

// ===========================================
// INTEGRATION HUB
// ===========================================

@Injectable()
export class IntegrationHub {
  private readonly logger = new Logger('IntegrationHub');

  private rabtul = new RABTULClient();
  private rezIntelligence = new REZIntelligenceClient();
  private rezMedia = new REZMediaClient();
  private corpPerks = new CorpPerksClient();

  // Get all integration statuses
  async getStatuses(): Promise<IntegrationStatus[]> {
    const [rabtul, intelligence, media, corpperks] = await Promise.all([
      this.rabtul.healthCheck(),
      this.rezIntelligence.healthCheck(),
      this.rezMedia.healthCheck(),
      this.corpPerks.healthCheck(),
    ]);

    return [rabtul, intelligence, media, corpperks];
  }

  // Process ride lifecycle with all integrations
  async onRideCompleted(ride: any): Promise<void> {
    this.logger.log(`Processing ride ${ride.id} across integrations`);

    // 1. Track in Intelligence
    await this.rezIntelligence.trackEvent({
      type: 'ride_completed',
      userId: ride.userId,
      rideId: ride.id,
      amount: ride.fare.total,
      timestamp: new Date(),
    });

    // 2. Track impression for media
    if (ride.adImpression) {
      await this.rezMedia.trackImpression(ride.userId, ride.adId, { rideId: ride.id });
    }

    // 3. Create expense for corporate
    if (ride.corporateAccountId) {
      await this.corpPerks.createExpense({
        employeeId: ride.userId,
        companyId: ride.corporateAccountId,
        amount: ride.fare.total,
        category: 'ride',
        rideId: ride.id,
      });
    }

    // 4. Send notification
    await this.rabtul.sendPush(ride.userId, {
      title: 'Ride Completed',
      body: `Your ride is complete. ₹${ride.cashback} cashback earned!`,
    });
  }

  // Process user booking with AI
  async onBookingRequest(userId: string, context: any): Promise<{
    intent: any;
    churn: any;
    campaigns: any;
    profile: any;
  }> {
    const [intent, churn, campaigns, profile] = await Promise.all([
      this.rezIntelligence.predictIntent(userId, context),
      this.rezIntelligence.predictChurn(userId),
      this.rezMedia.checkCampaignEligibility(userId, 'ride'),
      this.rabtul.getProfile(userId),
    ]);

    return { intent, churn, campaigns, profile };
  }
}
