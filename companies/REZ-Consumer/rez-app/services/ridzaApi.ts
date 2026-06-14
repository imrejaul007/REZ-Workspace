// @ts-nocheck
/**
 * RidZa Finance API Service - REZ App Integration
 *
 * Connects REZ App Finance Hub to RidZa Platform
 * - AI-powered financial product search
 * - Eligibility checking
 * - Lead creation & tracking
 * - Product recommendations
 * - Insurance quotes & policies
 */

import axios from 'axios';
import { logger } from '@/utils/logger';

// Configuration
const RIDZA_CORE_URL = process.env.RIDZA_CORE_URL || 'http://localhost:4500';
const RIDZA_AI_URL = process.env.RIDZA_AI_URL || 'http://localhost:4505';
const RIDZA_PARTNER_URL = process.env.RIDZA_PARTNER_URL || 'http://localhost:4501';
const RIDZA_INSURANCE_URL = process.env.RIDZA_INSURANCE_URL || 'http://localhost:4520';

// Create axios instances
const coreApi = axios.create({ baseURL: RIDZA_CORE_URL, timeout: 15000 });
const aiApi = axios.create({ baseURL: RIDZA_AI_URL, timeout: 20000 });
const partnerApi = axios.create({ baseURL: RIDZA_PARTNER_URL, timeout: 15000 });
const insuranceApi = axios.create({ baseURL: RIDZA_INSURANCE_URL, timeout: 15000 });

// Add auth header
const addAuth = (config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

coreApi.interceptors.request.use(addAuth);
aiApi.interceptors.request.use(addAuth);
insuranceApi.interceptors.request.use(addAuth);

// Types
export interface EligibilityResult {
  eligible: boolean;
  score: number;
  creditScore?: number;
  maxAmount?: number;
  reason?: string;
  recommendations?: string[];
}

export interface ProductMatch {
  productId: string;
  productName: string;
  providerName: string;
  type: string;
  interestRate: { min: number; max: number };
  processingFee: { type: string; value: number };
  matchScore: number;
  matchReasons: string[];
  eligibilityMatch: 'high' | 'medium' | 'low';
  cashback?: number;
  emi?: number;
}

export interface LeadResult {
  leadId: string;
  status: string;
  productType: string;
  eligibilityScore: number;
}

export interface Lead {
  leadId: string;
  productType: string;
  status: string;
  amount?: number;
  partnerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  query: string;
  understanding: string;
  matches: ProductMatch[];
  insights: string[];
  recommendations: string[];
  comparison?: { bestOption: string; why: string; tips: string[] };
}

// Insurance Types
export interface InsuranceQuote {
  quoteId: string;
  insurerId: string;
  insurerName: string;
  productName: string;
  premium: number;
  sumAssured: number;
  features: string[];
}

export interface InsurancePolicy {
  policyId: string;
  policyNumber?: string;
  insurerName: string;
  insuranceType: string;
  status: string;
  sumAssured: number;
  premium: { amount: number; frequency: string };
  startDate?: string;
  endDate?: string;
}

export interface InsuranceLead {
  leadId: string;
  insuranceType: string;
  status: string;
  createdAt: string;
}

// API Functions
export const ridzaFinanceApi = {
  // ============ FINANCIAL PRODUCTS ============

  async searchNaturalLanguage(query: string, userId?: string): Promise<SearchResult | null> {
    try {
      const response = await aiApi.post('/api/search/nl', { query, userId });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] NL search failed', error, 'RidZaAPI');
      return null;
    }
  },

  async checkEligibility(userId: string, productType: string, amount?: number): Promise<EligibilityResult | null> {
    try {
      const response = await coreApi.get(`/api/ridza/eligibility/${userId}`, { params: { type: productType, amount } });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Eligibility check failed', error, 'RidZaAPI');
      return null;
    }
  },

  async getMatchedProducts(userId: string, productType?: string): Promise<ProductMatch[]> {
    try {
      const response = await coreApi.get(`/api/ridza/products/match/${userId}`, { params: { type: productType, limit: 10 } });
      return response.data.success ? response.data.data?.matches || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Product matching failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getProducts(params?: { type?: string; minAmount?: number; maxAmount?: number; limit?: number }): Promise<unknown[]> {
    try {
      const response = await coreApi.get('/api/ridza/products', { params });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get products failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getProduct(productId: string): Promise<unknown | null> {
    try {
      const response = await coreApi.get(`/api/ridza/products/${productId}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Get product failed', error, 'RidZaAPI');
      return null;
    }
  },

  async createLead(params: { userId: string; userPhone: string; userEmail?: string; productType: string; amount?: number; tenure?: number }): Promise<LeadResult | null> {
    try {
      const response = await coreApi.post('/api/ridza/leads', params);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Lead creation failed', error, 'RidZaAPI');
      return null;
    }
  },

  async getUserLeads(userId: string): Promise<Lead[]> {
    try {
      const response = await coreApi.get(`/api/ridza/leads/user/${userId}`);
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Fetching leads failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getLeadStatus(leadId: string): Promise<Lead | null> {
    try {
      const response = await coreApi.get(`/api/ridza/leads/${leadId}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Fetching lead status failed', error, 'RidZaAPI');
      return null;
    }
  },

  async submitLeadToPartner(leadId: string): Promise<{ success: boolean; partnerLeadId?: string }> {
    try {
      const response = await coreApi.post(`/api/ridza/leads/${leadId}/submit`);
      return { success: response.data.success, partnerLeadId: response.data.data?.partnerLeadId };
    } catch (error) {
      logger.error('[RidZaAPI] Submit to partner failed', error, 'RidZaAPI');
      return { success: false };
    }
  },

  async applyForProduct(params: { userId: string; userPhone: string; userEmail?: string; productId: string; productType: string; amount?: number; tenure?: number }): Promise<{ success: boolean; leadId?: string; redirectUrl?: string }> {
    try {
      const lead = await this.createLead(params);
      if (!lead) return { success: false };
      return { success: true, leadId: lead.leadId };
    } catch (error) {
      logger.error('[RidZaAPI] Apply failed', error, 'RidZaAPI');
      return { success: false };
    }
  },

  async getCommissions(agentId: string): Promise<unknown[]> {
    try {
      const response = await coreApi.get('/api/ridza/commissions', { params: { agentId } });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get commissions failed', error, 'RidZaAPI');
      return [];
    }
  },

  // ============ INSURANCE ============

  async getInsuranceTypes(): Promise<{ type: string; name: string; icon: string }[]> {
    try {
      const response = await insuranceApi.get('/api/insurance/types');
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get insurance types failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getInsuranceQuotes(params: { userId: string; insuranceType: string; age: number; sumAssured?: number; members?: number }): Promise<InsuranceQuote[]> {
    try {
      const response = await insuranceApi.post('/api/insurance/quotes', params);
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get insurance quotes failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getInsuranceProducts(type?: string): Promise<unknown[]> {
    try {
      const response = await insuranceApi.get('/api/insurance/products', { params: { type } });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get insurance products failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getInsurers(): Promise<unknown[]> {
    try {
      const response = await insuranceApi.get('/api/insurance/insurers');
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get insurers failed', error, 'RidZaAPI');
      return [];
    }
  },

  async createInsuranceLead(params: { userId: string; userPhone: string; insuranceType: string; productId?: string; insurerId?: string }): Promise<InsuranceLead | null> {
    try {
      const response = await insuranceApi.post('/api/insurance/leads', params);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Create insurance lead failed', error, 'RidZaAPI');
      return null;
    }
  },

  async getInsuranceLeads(params?: { userId?: string; type?: string; status?: string }): Promise<InsuranceLead[]> {
    try {
      const response = await insuranceApi.get('/api/insurance/leads', { params });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get insurance leads failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getUserPolicies(userId: string): Promise<InsurancePolicy[]> {
    try {
      const response = await insuranceApi.get('/api/insurance/policies', { params: { userId } });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      logger.error('[RidZaAPI] Get user policies failed', error, 'RidZaAPI');
      return [];
    }
  },

  async getPolicyDetails(policyId: string): Promise<InsurancePolicy | null> {
    try {
      const response = await insuranceApi.get(`/api/insurance/policies/${policyId}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Get policy details failed', error, 'RidZaAPI');
      return null;
    }
  },

  async applyForInsurance(params: { userId: string; userPhone: string; insuranceType: string; quoteId: string }): Promise<{ success: boolean; leadId?: string }> {
    try {
      const lead = await this.createInsuranceLead(params);
      return { success: !!lead, leadId: lead?.leadId };
    } catch (error) {
      logger.error('[RidZaAPI] Apply for insurance failed', error, 'RidZaAPI');
      return { success: false };
    }
  },

  async getInsuranceStats(): Promise<unknown | null> {
    try {
      const response = await insuranceApi.get('/api/insurance/stats');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error('[RidZaAPI] Get insurance stats failed', error, 'RidZaAPI');
      return null;
    }
  },
};

export default ridzaFinanceApi;
