import { logger } from '../../shared/logger';
/**
 * RisaCare Healthcare OS Hub Client
 *
 * Connects RisaCare services to REZ ecosystem through the Unified Hub
 * Provides access to RABTUL services, HOJAI AI, and cross-company integrations
 *
 * RisaCare - Healthcare OS for Patient, Clinic, Hospital, Telemedicine
 */

import axios, { AxiosInstance } from 'axios';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';
const TIMEOUT_MS = parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10);

const SERVICES = {
  // RABTUL Core
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',

  // HOJAI AI
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',

  // Genie
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_RELATION: process.env.GENIE_RELATION || 'http://localhost:4704',

  // SUTAR OS
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',

  // RisaCare Services
  PATIENT_PLATFORM: process.env.PATIENT_PLATFORM_URL || 'http://localhost:4800',
  CLINIC: process.env.CLINIC_URL || 'http://localhost:4801',
  HOSPITAL: process.env.HOSPITAL_URL || 'http://localhost:4802',
  TELEMEDICINE: process.env.TELEMEDICINE_URL || 'http://localhost:4803',
} as const;

class RisaCareHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      timeout: TIMEOUT_MS,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'X-Service-Name': 'RisaCare',
        'Content-Type': 'application/json',
      },
    });

    (Object.keys(SERVICES) as (keyof typeof SERVICES)[]).forEach((service) => {
      const client = axios.create({
        baseURL: SERVICES[service],
        timeout: TIMEOUT_MS,
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'X-Service-Name': 'RisaCare',
          'Content-Type': 'application/json',
        },
      });
      this.clients.set(service, client);
    });
  }

  async callViaHub(service: string, endpoint: string, method: string, data?: unknown) {
    try {
      const response = await this.hubClient.request({ method, url: `/api/${service}${endpoint}`, data });
      return response.data;
    } catch (error) {
      logger.error(`[RisaCare-Hub] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  async callDirect(service: string, endpoint: string, method: string, data?: unknown) {
    const client = this.clients.get(service);
    if (!client) return null;
    try {
      const response = await client.request({ method, url: endpoint, data });
      return response.data;
    } catch (error) {
      logger.error(`[RisaCare-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES
  // ============================================

  async authenticatePatient(phone: string, name?: string) {
    return this.callViaHub('auth', '/patient/create', 'POST', { phone, name });
  }

  async verifyPatient(token: string) {
    return this.callViaHub('auth', '/verify', 'POST', { token });
  }

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async processPayment(userId: string, amount: number, method: string) {
    return this.callViaHub('payment', '/initiate', 'POST', { user_id: userId, amount, method });
  }

  // ============================================
  // HOJAI AI SERVICES
  // ============================================

  async getPatientTwin(patientId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: patientId,
      type: 'patient',
    });
  }

  async createPatientTwin(patientId: string, data: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins', 'POST', {
      entity_id: patientId,
      type: 'patient',
      data,
    });
  }

  async getHealthInsights(patientId: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/health/insights', 'POST', {
      patient_id: patientId,
    });
  }

  async getMedicalRecommendations(patientId: string, condition?: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/health/recommendations', 'POST', {
      patient_id: patientId,
      condition,
    });
  }

  async chatWithHealthAssistant(patientId: string, message: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/health-assistant/query', 'POST', {
      patient_id: patientId,
      message,
      context: 'healthcare',
    });
  }

  async storePatientHistory(patientId: string, history: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: patientId,
      type: 'medical_history',
      data: history,
    });
  }

  async getPatientHistory(patientId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: patientId,
      type: 'medical_history',
    });
  }

  // ============================================
  // GENIE PERSONAL AI
  // ============================================

  async remember(patientId: string, content: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/remember', 'POST', {
      user_id: patientId,
      content,
      type: 'health_experience',
    });
  }

  async recall(patientId: string, query: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/recall', 'POST', { user_id: patientId, query });
  }

  async trackDoctorRelationship(patientId: string, doctorId: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/track', 'POST', {
      user_id: patientId,
      target_id: doctorId,
      type: 'doctor',
    });
  }

  async getDoctors(patientId: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/relationships', 'POST', { user_id: patientId });
  }

  // ============================================
  // RISACARE SERVICES
  // ============================================

  async registerPatient(patientData: unknown) {
    return this.callDirect('PATIENT_PLATFORM', '/api/v1/patients', 'POST', patientData);
  }

  async getPatientProfile(patientId: string) {
    return this.callDirect('PATIENT_PLATFORM', `/api/v1/patients/${patientId}`, 'GET');
  }

  async bookAppointment(appointmentData: unknown) {
    return this.callDirect('CLINIC', '/api/v1/appointments', 'POST', appointmentData);
  }

  async getAppointments(patientId: string) {
    return this.callDirect('CLINIC', `/api/v1/appointments/patient/${patientId}`, 'GET');
  }

  async getDoctorAvailability(doctorId: string, date: string) {
    return this.callDirect('CLINIC', '/api/v1/availability', 'POST', { doctor_id: doctorId, date });
  }

  async requestLabTest(labData: unknown) {
    return this.callDirect('HOSPITAL', '/api/v1/lab-tests', 'POST', labData);
  }

  async getLabResults(patientId: string) {
    return this.callDirect('HOSPITAL', `/api/v1/lab-results/patient/${patientId}`, 'GET');
  }

  async startTelemedicineSession(sessionData: unknown) {
    return this.callDirect('TELEMEDICINE', '/api/v1/sessions', 'POST', sessionData);
  }

  async getTelemedicineHistory(patientId: string) {
    return this.callDirect('TELEMEDICINE', `/api/v1/sessions/patient/${patientId}`, 'GET');
  }

  // ============================================
  // CROSS-COMPANY SERVICES
  // ============================================

  async getLoyaltyPoints(patientId: string) {
    return this.callViaHub('karma', '/balance', 'POST', { user_id: patientId });
  }

  async awardPoints(patientId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', {
      user_id: patientId,
      points,
      action,
      source: 'RisaCare',
    });
  }

  async trackEvent(patientId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'RisaCare',
      event,
      user_id: patientId,
      data,
    });
  }
}

export const risaCareHub = new RisaCareHubClient();
export default risaCareHub;