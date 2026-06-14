/**
 * REZ CRM Hub Integration Client
 *
 * Connected Services:
 * - REZ Identity Hub (6000): Unified identity
 * - REZ Merchant: Business data
 * - REZ Consumer: Consumer profiles
 * - REZ CRM Hub: Sales pipeline
 */

import axios from 'axios';

const REZ_CRM_CONFIG = {
  identityHub: process.env.REZ_IDENTITY_HUB || 'http://localhost:6000',
  merchant: process.env.REZ_MERCHANT || 'http://localhost:4100',
  consumer: process.env.REZ_CONSUMER || 'http://localhost:4200',
  crmHub: process.env.REZ_CRM_HUB || 'http://localhost:6100',
};

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  source: string;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  score: number;
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  contactId: string;
  ownerId: string;
  expectedClose: Date;
  notes?: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject: string;
  description?: string;
  contactId: string;
  userId: string;
  timestamp: Date;
  duration?: number;
}

export class REZCRMClient {
  private identityClient = axios.create({ baseURL: REZ_CRM_CONFIG.identityHub, timeout: 5000 });
  private merchantClient = axios.create({ baseURL: REZ_CRM_CONFIG.merchant, timeout: 5000 });
  private consumerClient = axios.create({ baseURL: REZ_CRM_CONFIG.consumer, timeout: 5000 });
  private crmClient = axios.create({ baseURL: REZ_CRM_CONFIG.crmHub, timeout: 5000 });

  /**
   * Get unified identity for a person
   */
  async getIdentity(personId: string): Promise<any> {
    try {
      const response = await this.identityClient.get('/api/identity/' + personId);
      return response.data;
    } catch (error) {
      console.log('REZ Identity Hub unavailable');
      return null;
    }
  }

  /**
   * Get merchant profile
   */
  async getMerchantProfile(merchantId: string): Promise<any> {
    try {
      const response = await this.merchantClient.get('/api/merchants/' + merchantId);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get consumer profile
   */
  async getConsumerProfile(consumerId: string): Promise<any> {
    try {
      const response = await this.consumerClient.get('/api/profiles/' + consumerId);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get leads from CRM
   */
  async getLeads(filters?: { stage?: string; owner?: string }): Promise<Lead[]> {
    try {
      const response = await this.crmClient.get('/api/leads', { params: filters });
      return response.data.leads || [];
    } catch (error) {
      console.log('REZ CRM Hub unavailable');
      return [];
    }
  }

  /**
   * Get lead by ID
   */
  async getLead(leadId: string): Promise<Lead | null> {
    try {
      const response = await this.crmClient.get('/api/leads/' + leadId);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<Lead>): Promise<Lead | null> {
    try {
      const response = await this.crmClient.post('/api/leads', leadData);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update lead stage
   */
  async updateLeadStage(leadId: string, stage: Lead['stage']): Promise<boolean> {
    try {
      await this.crmClient.patch('/api/leads/' + leadId, { stage });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get deals from CRM
   */
  async getDeals(filters?: { stage?: string; owner?: string }): Promise<Deal[]> {
    try {
      const response = await this.crmClient.get('/api/deals', { params: filters });
      return response.data.deals || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get deal by ID
   */
  async getDeal(dealId: string): Promise<Deal | null> {
    try {
      const response = await this.crmClient.get('/api/deals/' + dealId);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(dealData: Partial<Deal>): Promise<Deal | null> {
    try {
      const response = await this.crmClient.post('/api/deals', dealData);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update deal stage
   */
  async updateDealStage(dealId: string, stage: Deal['stage']): Promise<boolean> {
    try {
      await this.crmClient.patch('/api/deals/' + dealId, { stage });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get activities for a contact
   */
  async getActivities(contactId: string): Promise<Activity[]> {
    try {
      const response = await this.crmClient.get('/api/activities', {
        params: { contactId }
      });
      return response.data.activities || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Log a new activity
   */
  async logActivity(activityData: Partial<Activity>): Promise<Activity | null> {
    try {
      const response = await this.crmClient.post('/api/activities', activityData);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get sales pipeline summary
   */
  async getPipelineSummary(): Promise<any> {
    try {
      const response = await this.crmClient.get('/api/pipeline/summary');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.crmClient.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}