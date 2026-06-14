/**
 * RIDZA Finance Hub Client
 * Credit, Insurance, Lending - Service integration layer
 * @module hub-client
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Environment Variables (REQUIRED):
 * - INTERNAL_SERVICE_TOKEN: Internal service authentication token
 * - UNIFIED_HUB_URL: Unified Hub endpoint
 * - RABTUL_AUTH_URL: RABTUL Auth Service
 * - RABTUL_WALLET_URL: RABTUL Wallet Service
 * - RABTUL_PAYMENT_URL: RABTUL Payment Service
 * - HOJAI_GATEWAY: HOJAI AI Gateway
 * - HOJAI_MEMORY: HOJAI Memory Service
 * - HOJAI_INTELLIGENCE: HOJAI Intelligence Service
 * - FINANCIAL_AI: Financial AI Service
 * - SUTAR_TWIN_OS: SUTAR Twin OS
 * - SUTAR_DECISION: SUTAR Decision Engine
 * - FRAUD_URL: Fraud Detection Service
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Validate required environment variables
 * @throws {Error} If required environment variable is missing
 */
function validateEnvironment(): void {
  if (!process.env.INTERNAL_SERVICE_TOKEN) {
    throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required');
  }
}

// Initialize environment validation
validateEnvironment();

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN;
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';

/**
 * Service endpoint configuration
 * @type {Record<string, string>}
 */
const SERVICES: Record<string, string> = {
  AUTH: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
  WALLET: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
  PAYMENT: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  FINANCIAL_AI: process.env.FINANCIAL_AI || 'http://localhost:4754',
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_DECISION: process.env.SUTAR_DECISION || 'http://localhost:4240',
  SUTAR_ECONOMY: process.env.SUTAR_ECONOMY || 'http://localhost:4251',
  FRAUD_DETECTION: process.env.FRAUD_URL || 'http://localhost:3007',
};

/**
 * RIDZA Hub Client - Manages connections to all ecosystem services
 * @class
 */
class RIDZAHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'RIDZA' },
    });

    Object.keys(SERVICES).forEach((service) => {
      this.clients.set(service, axios.create({
        baseURL: SERVICES[service as keyof typeof SERVICES],
        headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'RIDZA' },
      }));
    });
  }

  /**
   * Call a service via the Unified Hub
   * @param {string} service - Service name
   * @param {string} endpoint - API endpoint
   * @param {string} [method='POST'] - HTTP method
   * @param {unknown} [data] - Request body
   * @returns {Promise<any>} Response data or null on error
   */
  async callViaHub(service: string, endpoint: string, method = 'POST', data?: unknown) {
    try {
      return (await this.hubClient.request({ method, url: `/api/${service}${endpoint}`, data })).data;
    } catch (error) {
      console.error(`[RIDZA] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  /**
   * Call a service directly (bypassing hub)
   * @param {string} service - Service name
   * @param {string} endpoint - API endpoint
   * @param {string} [method='POST'] - HTTP method
   * @param {unknown} [data] - Request body
   * @returns {Promise<any>} Response data or null on error
   */
  async callDirect(service: string, endpoint: string, method = 'POST', data?: unknown) {
    const client = this.clients.get(service);
    if (!client) {
      console.error(`[RIDZA] Unknown service: ${service}`);
      return null;
    }
    try {
      return (await client.request({ method, url: endpoint, data })).data;
    } catch (error) {
      console.error(`[RIDZA] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // CREDIT METHODS
  // ============================================

  /**
   * Apply for credit
   * @param {Object} params - Application parameters
   * @param {string} params.customerId - Customer identifier
   * @param {number} params.amount - Requested amount
   * @param {string} params.purpose - Purpose of credit
   * @param {number} params.term - Loan term in months
   * @returns {Promise<any>} Application result
   */
  async applyForCredit(params: { customerId: string; amount: number; purpose: string; term: number }) {
    return this.callViaHub('credit', '/apply', 'POST', params);
  }

  /**
   * Get credit profile for customer
   * @param {string} customerId - Customer identifier
   * @returns {Promise<any>} Credit profile
   */
  async getCreditProfile(customerId: string) {
    return this.callViaHub('credit', `/${customerId}`, 'GET');
  }

  // ============================================
  // INSURANCE METHODS
  // ============================================

  /**
   * Get insurance quote
   * @param {Object} params - Quote parameters
   * @param {string} params.type - Insurance type
   * @param {number} params.coverage - Coverage amount
   * @param {string} params.customerId - Customer identifier
   * @returns {Promise<any>} Insurance quote
   */
  async getInsuranceQuote(params: { type: string; coverage: number; customerId: string }) {
    return this.callViaHub('insurance', '/quote', 'POST', params);
  }

  /**
   * Purchase insurance policy
   * @param {Object} params - Purchase parameters
   * @param {string} params.policyId - Policy identifier
   * @param {string} params.customerId - Customer identifier
   * @param {unknown} params.paymentDetails - Payment information
   * @returns {Promise<any>} Purchase result
   */
  async purchasePolicy(params: { policyId: string; customerId: string; paymentDetails: unknown }) {
    return this.callViaHub('insurance', '/purchase', 'POST', params);
  }

  /**
   * Get customer policies
   * @param {string} customerId - Customer identifier
   * @returns {Promise<any>} Customer policies
   */
  async getCustomerPolicies(customerId: string) {
    return this.callViaHub('insurance', `/${customerId}`, 'GET');
  }

  // ============================================
  // LENDING METHODS
  // ============================================

  /**
   * Calculate loan details
   * @param {Object} params - Loan parameters
   * @param {number} params.principal - Principal amount
   * @param {number} params.rate - Interest rate
   * @param {number} params.term - Loan term in months
   * @param {string} params.type - Loan type
   * @returns {Promise<any>} Loan calculation
   */
  async calculateLoan(params: { principal: number; rate: number; term: number; type: string }) {
    return this.callViaHub('lending', '/calculate', 'POST', params);
  }

  /**
   * Approve loan application
   * @param {Object} params - Approval parameters
   * @param {string} params.applicationId - Application identifier
   * @returns {Promise<any>} Approval result
   */
  async approveLoan(params: { applicationId: string }) {
    return this.callViaHub('lending', '/approve', 'POST', params);
  }

  // ============================================
  // AI FINANCIAL METHODS
  // ============================================

  /**
   * Forecast financial needs using AI
   * @param {Object} params - Forecast parameters
   * @param {string} params.customerId - Customer identifier
   * @param {string} params.period - Forecast period
   * @returns {Promise<any>} Financial forecast
   */
  async forecastFinancialNeeds(params: { customerId: string; period: string }) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/forecast', 'POST', params);
  }

  /**
   * Get AI product recommendations
   * @param {Object} params - Recommendation parameters
   * @param {string} params.customerId - Customer identifier
   * @param {string} params.productType - Product type filter
   * @returns {Promise<any>} Product recommendations
   */
  async getProductRecommendation(params: { customerId: string; productType: string }) {
    return this.callDirect('FINANCIAL_AI', '/api/recommend', 'POST', params);
  }

  // ============================================
  // PORTFOLIO METHODS
  // ============================================

  /**
   * Get customer portfolio
   * @param {string} customerId - Customer identifier
   * @returns {Promise<any>} Portfolio data
   */
  async getPortfolio(customerId: string) {
    return this.callViaHub('portfolio', `/${customerId}`, 'GET');
  }

  // ============================================
  // FRAUD DETECTION
  // ============================================

  /**
   * Check transaction for fraud
   * @param {Object} params - Transaction parameters
   * @param {string} params.transactionId - Transaction identifier
   * @param {number} params.amount - Transaction amount
   * @param {string} params.customerId - Customer identifier
   * @returns {Promise<any>} Fraud check result
   */
  async checkFraud(params: { transactionId: string; amount: number; customerId: string }) {
    return this.callDirect('FRAUD_DETECTION', '/api/check', 'POST', params);
  }

  // ============================================
  // MEMORY OPERATIONS
  // ============================================

  /**
   * Store data in memory
   * @param {string} key - Memory key
   * @param {unknown} value - Data to store
   * @returns {Promise<any>} Store result
   */
  async storeMemory(key: string, value: unknown) {
    return this.callDirect('HOJAI_MEMORY', '/api/memory/store', 'POST', { key, value });
  }

  /**
   * Retrieve data from memory
   * @param {string} key - Memory key
   * @returns {Promise<any>} Stored data
   */
  async getMemory(key: string) {
    return this.callDirect('HOJAI_MEMORY', `/api/memory/${key}`, 'GET');
  }

  // ============================================
  // TWIN OPERATIONS
  // ============================================

  /**
   * Create digital twin
   * @param {Object} params - Twin parameters
   * @param {string} params.type - Twin type
   * @param {unknown} params.data - Twin data
   * @returns {Promise<any>} Created twin
   */
  async createTwin(params: { type: string; data: unknown }) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/twins', 'POST', params);
  }

  /**
   * Get digital twin
   * @param {string} twinId - Twin identifier
   * @returns {Promise<any>} Twin data
   */
  async getTwin(twinId: string) {
    return this.callDirect('SUTAR_TWIN_OS', `/api/twins/${twinId}`, 'GET');
  }

  // ============================================
  // DECISION MAKING
  // ============================================

  /**
   * Make autonomous decision
   * @param {Object} params - Decision parameters
   * @param {unknown} params.context - Decision context
   * @param {unknown[]} params.options - Available options
   * @returns {Promise<any>} Decision result
   */
  async makeDecision(params: { context: unknown; options: unknown[] }) {
    return this.callDirect('SUTAR_DECISION', '/api/decide', 'POST', params);
  }
}

/**
 * Singleton instance of RIDZA Hub Client
 * @constant
 * @type {RIDZAHubClient}
 */
export const ridzaHub = new RIDZAHubClient();
export default ridzaHub;