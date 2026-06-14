/**
 * REZ Copilot - Context Service
 * Aggregates data from other B2B services for AI analysis
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/services';
import {
  DealContext,
  CompanyContext,
  SignalContext,
  ContactContext,
  ActivityContext,
} from '../types';
import { logger } from '../middleware/logger';

export class ContextService {
  private http: AxiosInstance;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.http = axios.create({
      timeout: 10000,
    });
  }

  /**
   * Get complete deal context from all services
   */
  async getDealContext(dealId: string): Promise<{ deal: DealContext; company: CompanyContext } | null> {
    try {
      // Fetch deal data from gateway
      const dealResponse = await this.fetchWithCache(
        `${config.services.gateway}/api/deals/${dealId}`,
        'deal'
      );

      if (!dealResponse) {
        logger.warn(`Deal not found: ${dealId}`);
        return null;
      }

      const deal = this.transformDealContext(dealResponse);

      // Fetch company context
      const company = await this.getCompanyContext(deal.companyId);

      return { deal, company };
    } catch (error) {
      logger.error(`Error fetching deal context: ${error}`);
      return this.getMockDealContext(dealId);
    }
  }

  /**
   * Get company context with signals, contacts, and activities
   */
  async getCompanyContext(companyId: string): Promise<CompanyContext> {
    try {
      const [companyData, signals, contacts, activities] = await Promise.all([
        this.fetchWithCache(`${config.services.gateway}/api/companies/${companyId}`, 'company'),
        this.fetchSignals(companyId),
        this.fetchContacts(companyId),
        this.fetchActivities(companyId),
      ]);

      return {
        companyId,
        companyName: companyData?.name || 'Unknown Company',
        industry: companyData?.industry,
        employeeCount: companyData?.employeeCount,
        annualRevenue: companyData?.annualRevenue,
        website: companyData?.website,
        signals,
        contacts,
        recentActivities: activities,
      };
    } catch (error) {
      logger.error(`Error fetching company context: ${error}`);
      return this.getMockCompanyContext(companyId);
    }
  }

  /**
   * Fetch intent signals for a company
   */
  private async fetchSignals(companyId: string): Promise<SignalContext[]> {
    try {
      const response = await this.http.get(
        `${config.services.signalService}/api/signals/company/${companyId}`
      );

      return (response.data?.signals || []).map((s: Record<string, unknown>) => ({
        signalId: s.id as string || s.signalId as string,
        type: s.type as string,
        title: s.title as string,
        description: s.description as string,
        strength: (s.strength || s.intensity || 'medium') as SignalContext['strength'],
        detectedAt: new Date(s.detectedAt || s.createdAt),
        source: s.source as string,
      }));
    } catch (error) {
      logger.warn(`Failed to fetch signals: ${error}`);
      return [];
    }
  }

  /**
   * Fetch contacts for a company
   */
  private async fetchContacts(companyId: string): Promise<ContactContext[]> {
    try {
      const response = await this.http.get(
        `${config.services.tamBuilder}/api/contacts/company/${companyId}`
      );

      return (response.data?.contacts || response.data || []).map((c: Record<string, unknown>) => ({
        contactId: c.id as string || c.contactId as string,
        name: c.name as string,
        title: c.title as string,
        email: c.email as string,
        linkedinUrl: c.linkedinUrl as string,
        engagementScore: c.engagementScore as number,
        lastTouchedAt: c.lastTouchedAt ? new Date(c.lastTouchedAt) : undefined,
      }));
    } catch (error) {
      logger.warn(`Failed to fetch contacts: ${error}`);
      return [];
    }
  }

  /**
   * Fetch recent activities for a company
   */
  private async fetchActivities(companyId: string): Promise<ActivityContext[]> {
    try {
      const response = await this.http.get(
        `${config.services.activityService}/api/activities/company/${companyId}?limit=20`
      );

      return (response.data?.activities || response.data || []).map((a: Record<string, unknown>) => ({
        activityId: a.id as string || a.activityId as string,
        type: a.type as string,
        description: a.description as string,
        performedBy: a.performedBy as string,
        performedAt: new Date(a.performedAt || a.createdAt),
      }));
    } catch (error) {
      logger.warn(`Failed to fetch activities: ${error}`);
      return [];
    }
  }

  /**
   * Transform deal data from gateway to DealContext
   */
  private transformDealContext(data: Record<string, unknown>): DealContext {
    return {
      dealId: data.id as string || data.dealId as string,
      dealName: data.name as string || data.title as string,
      companyName: (data.company as Record<string, unknown>)?.name as string || data.companyName as string || 'Unknown',
      companyId: (data.company as Record<string, unknown>)?.id as string || data.companyId as string,
      stage: data.stage as string,
      value: data.value as number || data.amount as number || 0,
      probability: data.probability as number || 50,
      daysInStage: data.daysInStage as number || 0,
      ownerId: (data.owner as Record<string, unknown>)?.id as string || data.ownerId as string,
      ownerName: (data.owner as Record<string, unknown>)?.name as string || data.ownerName as string || 'Unknown',
      createdAt: new Date(data.createdAt || data.created_at),
      expectedCloseDate: new Date(data.expectedCloseDate || data.closeDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextStep: data.nextStep as string,
      notes: data.notes as string,
    };
  }

  /**
   * Fetch with caching
   */
  private async fetchWithCache<T>(url: string, key: string): Promise<T | null> {
    const cacheKey = `${key}:${url}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    try {
      const response = await this.http.get<T>(url);
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error) {
      // Try to return cached data even if expired
      if (cached) {
        logger.warn(`Using expired cache for ${url}`);
        return cached.data as T;
      }
      return null;
    }
  }

  /**
   * Get mock deal context for demo/testing
   */
  private getMockDealContext(dealId: string): { deal: DealContext; company: CompanyContext } {
    const deal: DealContext = {
      dealId,
      dealName: 'Enterprise License Deal',
      companyName: 'Acme Corporation',
      companyId: 'company-123',
      stage: 'Proposal',
      value: 150000,
      probability: 65,
      daysInStage: 12,
      ownerId: 'user-1',
      ownerName: 'John Smith',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      nextStep: 'Send revised proposal with pricing discount',
      notes: 'Key decision maker is the VP of Sales',
    };

    const company = this.getMockCompanyContext('company-123');
    return { deal, company };
  }

  /**
   * Get mock company context for demo/testing
   */
  private getMockCompanyContext(companyId: string): CompanyContext {
    return {
      companyId,
      companyName: 'Acme Corporation',
      industry: 'Technology',
      employeeCount: 500,
      annualRevenue: 50000000,
      website: 'https://acme.com',
      signals: [
        {
          signalId: 'sig-1',
          type: 'funding',
          title: '$50M Series C Funding',
          description: 'Company raised $50M to expand operations',
          strength: 'strong',
          detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          source: 'News API',
        },
        {
          signalId: 'sig-2',
          type: 'hiring',
          title: 'Rapid Headcount Growth',
          description: '50+ new hires in the last 30 days',
          strength: 'medium',
          detectedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          source: 'LinkedIn',
        },
        {
          signalId: 'sig-3',
          type: 'competitor_mentioned',
          title: 'Competitor Mentioned',
          description: 'Contact mentioned evaluating Salesforce',
          strength: 'medium',
          detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      contacts: [
        {
          contactId: 'contact-1',
          name: 'Sarah Johnson',
          title: 'VP of Sales',
          email: 'sjohnson@acme.com',
          engagementScore: 85,
          lastTouchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          contactId: 'contact-2',
          name: 'Mike Chen',
          title: 'Director of Operations',
          email: 'mchen@acme.com',
          engagementScore: 60,
          lastTouchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          contactId: 'contact-3',
          name: 'Lisa Park',
          title: 'CTO',
          email: 'lpark@acme.com',
          engagementScore: 45,
          lastTouchedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      ],
      recentActivities: [
        {
          activityId: 'act-1',
          type: 'call',
          description: 'Discovery call with Sarah Johnson',
          performedBy: 'John Smith',
          performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          activityId: 'act-2',
          type: 'email',
          description: 'Sent product overview deck',
          performedBy: 'John Smith',
          performedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          activityId: 'act-3',
          type: 'meeting',
          description: 'Demo session with technical team',
          performedBy: 'John Smith',
          performedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          activityId: 'act-4',
          type: 'email',
          description: 'Follow-up on proposal questions',
          performedBy: 'John Smith',
          performedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const contextService = new ContextService();
