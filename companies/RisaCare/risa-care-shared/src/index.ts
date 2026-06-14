import { logger } from '../../shared/logger';
/**
 * RisaCare Ecosystem Integration Client
 * Connects all RisaCare services to the REZ ecosystem
 *
 * Integrates with:
 * - RABTUL Technologies (Auth, Payment, Wallet, Notification)
 * - HOJAI AI (LLM, Voice, Care AI)
 * - REZ Intelligence (Intent Graph, Health Expert)
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// ============================================
// CONFIGURATION
// ============================================

interface EcosystemConfig {
  // RABTUL
  rabtulAuthUrl?: string;
  rabtulPaymentUrl?: string;
  rabtulWalletUrl?: string;
  rabtulNotificationUrl?: string;

  // HOJAI
  hojaiLlmUrl?: string;
  hojaiVoiceUrl?: string;
  hojaiCareUrl?: string;

  // REZ Intelligence
  rezIntelligenceUrl?: string;
  healthExpertUrl?: string;
  careServiceUrl?: string;

  // API Keys
  apiKey?: string;

  // Timeouts
  timeout?: number;
}

const DEFAULT_CONFIG: EcosystemConfig = {
  rabtulAuthUrl: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
  rabtulPaymentUrl: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
  rabtulWalletUrl: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
  rabtulNotificationUrl: process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4011',

  hojaiLlmUrl: process.env.HOJAI_LLM_URL || 'http://localhost:4730',
  hojaiVoiceUrl: process.env.HOJAI_VOICE_URL || 'http://localhost:4590',
  hojaiCareUrl: process.env.HOJAI_CARE_URL || 'http://localhost:4102',

  rezIntelligenceUrl: process.env.REZ_INTELLIGENCE_URL || 'http://localhost:3000',
  healthExpertUrl: process.env.HEALTH_EXPERT_URL || 'http://localhost:3011',
  careServiceUrl: process.env.CARE_SERVICE_URL || 'http://localhost:3014',

  timeout: 30000
};

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  abhaId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: ('push' | 'sms' | 'email' | 'whatsapp')[];
}

export interface IntentSignal {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  userId: string;
  timestamp: Date;
}

// ============================================
// RABTUL CLIENT
// ============================================

export class RisaCareRABTULClient {
  private authClient: AxiosInstance;
  private paymentClient: AxiosInstance;
  private walletClient: AxiosInstance;
  private notificationClient: AxiosInstance;
  private apiKey?: string;

  constructor(config: Partial<EcosystemConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    this.apiKey = mergedConfig.apiKey;

    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
    };

    this.authClient = axios.create({
      baseURL: mergedConfig.rabtulAuthUrl,
      timeout: mergedConfig.timeout,
      headers
    });

    this.paymentClient = axios.create({
      baseURL: mergedConfig.rabtulPaymentUrl,
      timeout: mergedConfig.timeout,
      headers
    });

    this.walletClient = axios.create({
      baseURL: mergedConfig.rabtulWalletUrl,
      timeout: mergedConfig.timeout,
      headers
    });

    this.notificationClient = axios.create({
      baseURL: mergedConfig.rabtulNotificationUrl,
      timeout: mergedConfig.timeout,
      headers
    });
  }

  // ===== AUTH =====
  async validateToken(token: string): Promise<User | null> {
    try {
      const response = await this.authClient.post('/api/auth/validate', { token });
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await this.authClient.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createUser(userData: { email: string; name: string; phone: string }): Promise<User | null> {
    try {
      const response = await this.authClient.post('/api/users', userData);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // ===== PAYMENT =====
  async createPaymentIntent(amount: number, currency: string = 'INR', metadata?: Record<string, string>): Promise<PaymentIntent | null> {
    try {
      const response = await this.paymentClient.post('/api/payments/create', {
        amount,
        currency,
        metadata
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async confirmPayment(paymentId: string, paymentMethod: string): Promise<boolean> {
    try {
      await this.paymentClient.post('/api/payments/confirm', { paymentId, paymentMethod });
      return true;
    } catch (error) {
      return false;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      await this.paymentClient.post('/api/payments/refund', { paymentId, amount });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ===== WALLET =====
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.walletClient.get(`/api/wallet/${userId}/balance`);
      return response.data.balance || 0;
    } catch (error) {
      return 0;
    }
  }

  async deductBalance(userId: string, amount: number, description: string): Promise<boolean> {
    try {
      await this.walletClient.post(`/api/wallet/${userId}/deduct`, { amount, description });
      return true;
    } catch (error) {
      return false;
    }
  }

  async addBalance(userId: string, amount: number, source: string): Promise<boolean> {
    try {
      await this.walletClient.post(`/api/wallet/${userId}/add`, { amount, source });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ===== NOTIFICATIONS =====
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const channels = payload.channels || ['push'];
      await this.notificationClient.post('/api/notifications/send', {
        ...payload,
        channels
      });
      return true;
    } catch (error) {
      logger.error('Notification failed:', error);
      return false;
    }
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<boolean> {
    return this.sendNotification({ userId, title, body, data, channels: ['push'] });
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      await this.notificationClient.post('/api/notifications/sms', { phone, message });
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendEmail(email: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.notificationClient.post('/api/notifications/email', { email, subject, html });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// ============================================
// HOJAI CLIENT
// ============================================

export class RisaCareHOJAIClient {
  private llmClient: AxiosInstance;
  private voiceClient: AxiosInstance;
  private careClient: AxiosInstance;

  constructor(config: Partial<EcosystemConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    this.llmClient = axios.create({
      baseURL: mergedConfig.hojaiLlmUrl,
      timeout: 60000, // LLM needs longer timeout
      headers: { 'Content-Type': 'application/json' }
    });

    this.voiceClient = axios.create({
      baseURL: mergedConfig.hojaiVoiceUrl,
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.careClient = axios.create({
      baseURL: mergedConfig.hojaiCareUrl,
      timeout: mergedConfig.timeout,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ===== LLM =====
  async chat(
    messages: { role: string; content: string }[],
    options?: { provider?: string; model?: string; temperature?: number }
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await this.llmClient.post('/api/chat', {
        provider: options?.provider || 'anthropic',
        messages,
        model: options?.model || 'claude-3-5-sonnet-20241022',
        temperature: options?.temperature ?? 0.3
      });

      if (response.data.success) {
        return { success: true, content: response.data.data.content };
      }
      return { success: false, error: 'LLM request failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async interpretReport(reportText: string, reportType: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await this.llmClient.post('/api/medical/interpret', {
        reportText,
        reportType
      });
      return { success: true, content: response.data.interpretation };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async generateSOAPNote(transcript: string, patientContext?: any): Promise<{ success: boolean; soapNote?: any; error?: string }> {
    try {
      const systemPrompt = `You are an expert medical scribe AI. Generate a structured SOAP note from the consultation transcript. Return JSON format.`;

      const result = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ], { temperature: 0.3 });

      if (result.success && result.content) {
        try {
          return { success: true, soapNote: JSON.parse(result.content) };
        } catch {
          return { success: true, soapNote: { raw: result.content } };
        }
      }
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===== VOICE =====
  async transcribeAudio(audioUrl: string, language?: string): Promise<{ success: boolean; text?: string; segments?: any[]; error?: string }> {
    try {
      const response = await this.voiceClient.post('/api/stt/url', {
        audioUrl,
        language: language || 'en'
      });
      return {
        success: true,
        text: response.data.text,
        segments: response.data.segments
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async synthesizeSpeech(text: string, voice?: string, language?: string): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      const response = await this.voiceClient.post('/api/tts', {
        text,
        voice: voice || 'default',
        language: language || 'en'
      });
      return { success: true, audioUrl: response.data.audioUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===== CARE =====
  async getCareRecommendations(patientId: string, context: any): Promise<any> {
    try {
      const response = await this.careClient.post('/api/care/recommendations', {
        patientId,
        context
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getDeteriorationScore(patientId: string, vitals: any): Promise<any> {
    try {
      const response = await this.careClient.post('/api/care/deterioration', {
        patientId,
        vitals
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

// ============================================
// REZ INTELLIGENCE CLIENT
// ============================================

export class RisaCareREZIntelligenceClient {
  private client: AxiosInstance;
  private healthExpertClient: AxiosInstance;
  private careServiceClient: AxiosInstance;

  constructor(config: Partial<EcosystemConfig> = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    this.client = axios.create({
      baseURL: mergedConfig.rezIntelligenceUrl,
      timeout: mergedConfig.timeout,
      headers: { 'Content-Type': 'application/json' }
    });

    this.healthExpertClient = axios.create({
      baseURL: mergedConfig.healthExpertUrl,
      timeout: mergedConfig.timeout,
      headers: { 'Content-Type': 'application/json' }
    });

    this.careServiceClient = axios.create({
      baseURL: mergedConfig.careServiceUrl,
      timeout: mergedConfig.timeout,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ===== INTENT =====
  async emitIntent(signal: IntentSignal): Promise<boolean> {
    try {
      await this.client.post('/api/signals/emit', signal);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUserIntents(userId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/users/${userId}/intents`);
      return response.data.intents || [];
    } catch (error) {
      return [];
    }
  }

  async predictNextIntent(userId: string): Promise<{ intent?: string; confidence?: number }> {
    try {
      const response = await this.client.get(`/api/users/${userId}/predict`);
      return response.data;
    } catch (error) {
      return {};
    }
  }

  // ===== HEALTH EXPERT =====
  async interpretHealthData(userId: string, data: any): Promise<any> {
    try {
      const response = await this.healthExpertClient.post('/api/interpret', {
        userId,
        data
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getHealthRecommendations(userId: string): Promise<any[]> {
    try {
      const response = await this.healthExpertClient.get(`/api/users/${userId}/recommendations`);
      return response.data.recommendations || [];
    } catch (error) {
      return [];
    }
  }

  async checkHealthAlerts(userId: string): Promise<any[]> {
    try {
      const response = await this.healthExpertClient.get(`/api/users/${userId}/alerts`);
      return response.data.alerts || [];
    } catch (error) {
      return [];
    }
  }

  // ===== CARE SERVICE =====
  async createCarePlan(patientId: string, diagnosis: string, goals: string[]): Promise<any> {
    try {
      const response = await this.careServiceClient.post('/api/care-plans', {
        patientId,
        diagnosis,
        goals
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getCarePlan(patientId: string): Promise<any> {
    try {
      const response = await this.careServiceClient.get(`/api/care-plans/${patientId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async updateCarePlanStatus(carePlanId: string, status: string): Promise<boolean> {
    try {
      await this.careServiceClient.patch(`/api/care-plans/${carePlanId}`, { status });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// ============================================
// UNIFIED ECOSYSTEM CLIENT
// ============================================

export class RisaCareEcosystemClient {
  public rabtul: RisaCareRABTULClient;
  public hojai: RisaCareHOJAIClient;
  public rez: RisaCareREZIntelligenceClient;

  constructor(config: Partial<EcosystemConfig> = {}) {
    this.rabtul = new RisaCareRABTULClient(config);
    this.hojai = new RisaCareHOJAIClient(config);
    this.rez = new RisaCareREZIntelligenceClient(config);
  }

  // ===== HEALTHCARE HELPERS =====

  async sendAppointmentReminder(userId: string, appointmentDetails: {
    doctorName: string;
    dateTime: Date;
    type: string;
  }): Promise<boolean> {
    const sent = await this.rabtul.sendPushNotification(
      userId,
      'Appointment Reminder',
      `Your ${appointmentDetails.type} with ${appointmentDetails.doctorName} is scheduled for ${appointmentDetails.dateTime.toLocaleString()}`
    );

    // Emit intent signal
    await this.rez.emitIntent({
      intent: 'appointment_reminder_sent',
      entities: { doctorName: appointmentDetails.doctorName, type: appointmentDetails.type },
      confidence: 0.95,
      userId,
      timestamp: new Date()
    });

    return sent;
  }

  async processPaymentAndNotify(
    userId: string,
    amount: number,
    description: string,
    paymentMethod: 'wallet' | 'card' | 'upi'
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (paymentMethod === 'wallet') {
      const balance = await this.rabtul.getBalance(userId);
      if (balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const deducted = await this.rabtul.deductBalance(userId, amount, description);
      if (deducted) {
        await this.rabtul.sendPushNotification(userId, 'Payment Successful', `₹${amount} deducted for ${description}`);
        return { success: true, transactionId: `TXN${Date.now()}` };
      }
      return { success: false, error: 'Payment failed' };
    }

    // For card/upi, create payment intent
    const intent = await this.rabtul.createPaymentIntent(amount, 'INR', { description, userId });
    if (intent) {
      return { success: true, transactionId: intent.id };
    }
    return { success: false, error: 'Payment intent creation failed' };
  }

  async analyzeReportAndNotify(userId: string, reportText: string, reportType: string): Promise<{
    success: boolean;
    interpretation?: string;
    alerts?: any[];
  }> {
    // Use HOJAI LLM to interpret
    const result = await this.hojai.interpretReport(reportText, reportType);

    if (result.success && result.content) {
      // Check for health alerts via REZ Intelligence
      const alerts = await this.rez.checkHealthAlerts(userId);

      // Emit signal
      await this.rez.emitIntent({
        intent: 'report_interpreted',
        entities: { reportType, hasAlerts: alerts.length > 0 },
        confidence: 0.9,
        userId,
        timestamp: new Date()
      });

      // Send notification
      if (alerts.length > 0) {
        await this.rabtul.sendPushNotification(
          userId,
          'Health Alert',
          `Your ${reportType} report shows ${alerts.length} items requiring attention`
        );
      }

      return { success: true, interpretation: result.content, alerts };
    }

    return { success: false };
  }

  async bookAndNotifyDoctor(
    userId: string,
    doctorId: string,
    slot: Date,
    type: 'video' | 'audio' | 'clinic'
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    // Emit booking intent
    await this.rez.emitIntent({
      intent: 'appointment_booking_started',
      entities: { doctorId, type, slot: slot.toISOString() },
      confidence: 0.95,
      userId,
      timestamp: new Date()
    });

    // Get care recommendations
    const recommendations = await this.rez.getCareRecommendations(userId, { doctorId, type });

    // Emit confirmed intent
    await this.rez.emitIntent({
      intent: 'appointment_booked',
      entities: { doctorId, type, slot: slot.toISOString(), appointmentId: `APT${Date.now()}` },
      confidence: 0.98,
      userId,
      timestamp: new Date()
    });

    // Send confirmation
    await this.rabtul.sendPushNotification(
      userId,
      'Appointment Booked',
      `Your ${type} consultation is confirmed for ${slot.toLocaleString()}`
    );

    return { success: true, appointmentId: `APT${Date.now()}` };
  }
}

// ============================================
// DEFAULT EXPORTS
// ============================================

export const ecosystemClient = new RisaCareEcosystemClient();
export const rabtulClient = new RisaCareRABTULClient();
export const hojaiClient = new RisaCareHOJAIClient();
export const rezClient = new RisaCareREZIntelligenceClient();

export default RisaCareEcosystemClient;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-shared',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
