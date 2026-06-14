import { logger } from '../../shared/logger';
/**
 * CorpPerks Workforce OS Hub Client
 *
 * Connects CorpPerks services to REZ ecosystem through the Unified Hub
 * Provides access to RABTUL services, HOJAI AI, and cross-company integrations
 *
 * CorpPerks - Workforce OS for Human + Agent + Hybrid Twins
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
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',

  // Genie
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_RELATION: process.env.GENIE_RELATION || 'http://localhost:4704',
  GENIE_BRIEFING: process.env.GENIE_BRIEFING || 'http://localhost:4706',

  // SUTAR OS
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_GOAL: process.env.SUTAR_GOAL || 'http://localhost:4242',

  // CorpPerks Services
  PEOPLE_OS: process.env.PEOPLE_OS_URL || 'http://localhost:4720',
  TALENT_AI: process.env.TALENT_AI_URL || 'http://localhost:4721',
  HR_APP: process.env.HR_APP_URL || 'http://localhost:4722',
} as const;

// ============================================
// HUB CLIENT CLASS
// ============================================

class CorpPerksHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      timeout: TIMEOUT_MS,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'X-Service-Name': 'CorpPerks',
        'Content-Type': 'application/json',
      },
    });

    (Object.keys(SERVICES) as (keyof typeof SERVICES)[]).forEach((service) => {
      const client = axios.create({
        baseURL: SERVICES[service],
        timeout: TIMEOUT_MS,
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'X-Service-Name': 'CorpPerks',
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
      logger.error(`[CorpPerks-Hub] ${service}${endpoint} failed:`, error);
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
      logger.error(`[CorpPerks-Hub] Direct call to ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES
  // ============================================

  async authenticateEmployee(phone: string, company: string) {
    return this.callViaHub('auth', '/employee/create', 'POST', { phone, company });
  }

  async verifyEmployee(token: string) {
    return this.callViaHub('auth', '/verify', 'POST', { token });
  }

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async processPayroll(employeeId: string, amount: number) {
    return this.callViaHub('payment', '/payroll', 'POST', { employee_id: employeeId, amount });
  }

  async awardEmployeeBonus(employeeId: string, amount: number, reason: string) {
    return this.callViaHub('wallet', '/credit', 'POST', {
      user_id: employeeId,
      amount,
      source: 'CorpPerks',
      reason,
    });
  }

  // ============================================
  // HOJAI AI SERVICES
  // ============================================

  async getEmployeeTwin(employeeId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: employeeId,
      type: 'employee',
    });
  }

  async createEmployeeTwin(employeeId: string, data: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins', 'POST', {
      entity_id: employeeId,
      type: 'employee',
      data,
    });
  }

  async updateEmployeeTwin(employeeId: string, updates: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/update', 'POST', {
      entity_id: employeeId,
      type: 'employee',
      updates,
    });
  }

  async storeEmployeeMemory(employeeId: string, memory: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: employeeId,
      type: 'employee_experience',
      data: memory,
    });
  }

  async getEmployeeMemories(employeeId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/retrieve', 'POST', {
      user_id: employeeId,
      type: 'employee_experience',
    });
  }

  async getEmployeeInsights(employeeId: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/insights/employee', 'POST', {
      employee_id: employeeId,
    });
  }

  async chatWithAssistant(employeeId: string, message: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/hr-assistant/query', 'POST', {
      employee_id: employeeId,
      message,
      context: 'workforce',
    });
  }

  // ============================================
  // GENIE PERSONAL AI
  // ============================================

  async remember(employeeId: string, content: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/remember', 'POST', {
      user_id: employeeId,
      content,
      type: 'work_experience',
    });
  }

  async recall(employeeId: string, query: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/recall', 'POST', { user_id: employeeId, query });
  }

  async trackRelationship(employeeId: string, colleagueId: string, type: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/track', 'POST', {
      user_id: employeeId,
      target_id: colleagueId,
      type,
    });
  }

  async getColleagues(employeeId: string) {
    return this.callDirect('GENIE_RELATION', '/api/v1/relationships', 'POST', { user_id: employeeId });
  }

  async generateBriefing(employeeId: string) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/generate', 'POST', { user_id: employeeId });
  }

  // ============================================
  // CORPPERKS SERVICES
  // ============================================

  async onboardEmployee(employeeData: unknown) {
    return this.callDirect('PEOPLE_OS', '/api/v1/employees', 'POST', employeeData);
  }

  async getEmployeeProfile(employeeId: string) {
    return this.callDirect('PEOPLE_OS', `/api/v1/employees/${employeeId}`, 'GET');
  }

  async updateEmployeeProfile(employeeId: string, updates: unknown) {
    return this.callDirect('PEOPLE_OS', `/api/v1/employees/${employeeId}`, 'PATCH', updates);
  }

  async getEmployeeBenefits(employeeId: string) {
    return this.callDirect('PEOPLE_OS', `/api/v1/employees/${employeeId}/benefits`, 'GET');
  }

  async applyForLeave(employeeId: string, leaveData: unknown) {
    return this.callDirect('HR_APP', '/api/v1/leave/apply', 'POST', { employee_id: employeeId, ...leaveData });
  }

  async getLeaveBalance(employeeId: string) {
    return this.callDirect('HR_APP', `/api/v1/leave/balance/${employeeId}`, 'GET');
  }

  async submitExpense(employeeId: string, expenseData: unknown) {
    return this.callDirect('HR_APP', '/api/v1/expenses', 'POST', { employee_id: employeeId, ...expenseData });
  }

  async getPerformanceReview(employeeId: string) {
    return this.callDirect('TALENT_AI', `/api/v1/performance/${employeeId}`, 'GET');
  }

  async getTrainingRecommendations(employeeId: string) {
    return this.callDirect('TALENT_AI', '/api/v1/training/recommend', 'POST', { employee_id: employeeId });
  }

  // ============================================
  // CROSS-COMPANY SERVICES
  // ============================================

  async getLoyaltyPoints(employeeId: string) {
    return this.callViaHub('karma', '/balance', 'POST', { user_id: employeeId });
  }

  async awardPoints(employeeId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', {
      user_id: employeeId,
      points,
      action,
      source: 'CorpPerks',
    });
  }

  async trackEvent(employeeId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'CorpPerks',
      event,
      user_id: employeeId,
      data,
    });
  }

  async getIntentPrediction(employeeId: string) {
    return this.callViaHub('intent', '/predict', 'POST', { user_id: employeeId });
  }

  // ============================================
  // GOALS (SUTAR OS)
  // ============================================

  async setEmployeeGoal(employeeId: string, goal: unknown) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals', 'POST', { entity_id: employeeId, goal });
  }

  async getEmployeeGoals(employeeId: string) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals', 'POST', { entity_id: employeeId });
  }
}

export const corpPerksHub = new CorpPerksHubClient();
export default corpPerksHub;