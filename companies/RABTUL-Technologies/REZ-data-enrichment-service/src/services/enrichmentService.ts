/**
 * Data Enrichment Service
 * Clay parity - Waterfall enrichment, data reconciliation, workflow automation
 */

import {
  ContactEnrichment,
  CompanyEnrichment,
  EnrichmentResult,
  EnrichmentRequest,
  BulkEnrichmentRequest,
  BulkEnrichmentResult,
  WaterfallConfig,
  DataReconciliation,
  TransformRule,
  ProviderName,
} from '../types';
import { getEnabledProviders, getProvider, providers } from '../providers/base';

export class EnrichmentService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Waterfall enrichment - try providers in sequence until data found
   */
  async waterfallEnrichContact(
    params: EnrichmentRequest['contact'],
    config?: Partial<WaterfallConfig>
  ): Promise<EnrichmentResult<ContactEnrichment>> {
    const waterfallConfig: WaterfallConfig = {
      providers: config?.providers || ['apollo', 'hunter', 'clearbit'],
      fallbackOrder: config?.fallbackOrder || ['apollo', 'hunter', 'clearbit', 'linkedin'],
      maxProviders: config?.maxProviders || 4,
      stopOnFirstMatch: config?.stopOnFirstMatch ?? false,
    };

    const errors: string[] = [];
    const providersUsed: ProviderName[] = [];
    let contact: ContactEnrichment | null = null;
    let confidence = 0;

    // Determine what to search by
    const searchByEmail = params?.email;
    const searchByNameCompany = params?.firstName && params?.lastName && params?.company;

    for (let i = 0; i < waterfallConfig.maxProviders && i < waterfallConfig.providers.length; i++) {
      const providerName = waterfallConfig.providers[i];
      const provider = getProvider(providerName);

      if (!provider || !provider.enabled) continue;

      try {
        if (searchByEmail) {
          const result = await provider.enrichContact(params.email!);
          if (result) {
            contact = this.mergeContacts(contact, result);
            confidence = Math.min(confidence + 30, 100);
            providersUsed.push(providerName);
            if (waterfallConfig.stopOnFirstMatch) break;
          }
        } else if (searchByNameCompany) {
          const email = await provider.findEmail({
            firstName: params.firstName!,
            lastName: params.lastName!,
            company: params.company!,
            domain: params.domain,
          });
          if (email) {
            contact = contact || {};
            contact.email = email;
            contact.firstName = params.firstName;
            contact.lastName = params.lastName;
            contact.company = params.company;
            contact.companyDomain = params.domain;
            confidence = Math.min(confidence + 25, 100);
            providersUsed.push(providerName);

            // Try to get full profile
            const fullProfile = await provider.enrichContact(email);
            if (fullProfile) {
              contact = this.mergeContacts(contact, fullProfile);
              confidence = Math.min(confidence + 25, 100);
            }

            if (waterfallConfig.stopOnFirstMatch) break;
          }
        }
      } catch (error) {
        errors.push(`${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Verify email if found
    if (contact?.email) {
      const isValid = await this.verifyEmail(contact.email);
      if (isValid) {
        confidence = Math.min(confidence + 20, 100);
      }
    }

    return {
      data: contact,
      source: providersUsed.length > 0 ? 'combined' : providersUsed[0] || 'apollo',
      confidence,
      verified: confidence >= 70,
      timestamp: new Date().toISOString(),
      providersUsed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Enrich company data
   */
  async waterfallEnrichCompany(
    params: EnrichmentRequest['company'],
    config?: Partial<WaterfallConfig>
  ): Promise<EnrichmentResult<CompanyEnrichment>> {
    const waterfallConfig: WaterfallConfig = {
      providers: config?.providers || ['clearbit', 'apollo', 'crunchbase'],
      fallbackOrder: config?.fallbackOrder || ['clearbit', 'apollo', 'crunchbase', 'builtwith'],
      maxProviders: config?.maxProviders || 4,
      stopOnFirstMatch: config?.stopOnFirstMatch ?? false,
    };

    const errors: string[] = [];
    const providersUsed: ProviderName[] = [];
    let company: CompanyEnrichment | null = null;
    let confidence = 0;

    const domain = params?.domain || params?.name?.toLowerCase().replace(/\s+/g, '') + '.com';

    for (let i = 0; i < waterfallConfig.maxProviders && i < waterfallConfig.providers.length; i++) {
      const providerName = waterfallConfig.providers[i];
      const provider = getProvider(providerName);

      if (!provider || !provider.enabled) continue;

      try {
        if (domain) {
          const result = await provider.enrichCompany(domain);
          if (result) {
            company = this.mergeCompanies(company, result);
            confidence = Math.min(confidence + 35, 100);
            providersUsed.push(providerName);
            if (waterfallConfig.stopOnFirstMatch) break;
          }
        }
      } catch (error) {
        errors.push(`${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Get technographics
    if (domain && company) {
      try {
        const techProvider = getProvider('builtwith');
        if (techProvider) {
          const techs = await techProvider.getTechnologies(domain);
          if (techs.length > 0) {
            company.technologies = techs;
            confidence = Math.min(confidence + 15, 100);
          }
        }
      } catch (error) {
        // Non-critical
      }
    }

    return {
      data: company,
      source: 'combined',
      confidence,
      verified: confidence >= 60,
      timestamp: new Date().toISOString(),
      providersUsed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Full enrichment (contact + company)
   */
  async enrich(params: EnrichmentRequest): Promise<{
    contact?: EnrichmentResult<ContactEnrichment>;
    company?: EnrichmentResult<CompanyEnrichment>;
  }> {
    const results: {
      contact?: EnrichmentResult<ContactEnrichment>;
      company?: EnrichmentResult<CompanyEnrichment>;
    } = {};

    if (params.type === 'contact' || params.type === 'both') {
      results.contact = await this.waterfallEnrichContact(params.contact, params.waterfall);
    }

    if (params.type === 'company' || params.type === 'both') {
      results.company = await this.waterfallEnrichCompany(params.company, params.waterfall);
    }

    return results;
  }

  /**
   * Bulk enrichment
   */
  async bulkEnrich(params: BulkEnrichmentRequest): Promise<BulkEnrichmentResult> {
    const results: BulkEnrichmentResult = {
      total: params.records.length,
      successful: 0,
      failed: 0,
      results: [],
      errors: [],
    };

    for (let i = 0; i < params.records.length; i++) {
      try {
        const record = params.records[i];

        if (params.type === 'contact') {
          const result = await this.waterfallEnrichContact(
            record as EnrichmentRequest['contact'],
            params.waterfall
          );
          results.results.push(result);
          if (result.data) results.successful++;
          else results.failed++;
        } else {
          const result = await this.waterfallEnrichCompany(
            record as EnrichmentRequest['company'],
            params.waterfall
          );
          results.results.push(result);
          if (result.data) results.successful++;
          else results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Verify email
   */
  async verifyEmail(email: string): Promise<boolean> {
    // Mock verification - check format and domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Simulate SMTP check
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Find phone number
   */
  async findPhone(company: string, title?: string): Promise<string | null> {
    for (const provider of getEnabledProviders()) {
      try {
        const phone = await provider.findPhone({ company, title });
        if (phone) return phone;
      } catch {
        // Continue to next provider
      }
    }
    return null;
  }

  /**
   * Data reconciliation - merge conflicting values from multiple sources
   */
  async reconcile(
    field: string,
    values: { value: string; source: ProviderName; confidence: number }[]
  ): Promise<DataReconciliation> {
    if (values.length === 0) {
      return { field, values: [], resolved: '', confidence: 0 };
    }

    if (values.length === 1) {
      return {
        field,
        values,
        resolved: values[0].value,
        confidence: values[0].confidence,
      };
    }

    // Weighted average confidence
    const totalWeight = values.reduce((sum, v) => sum + v.confidence, 0);
    const weightedConfidence = totalWeight / values.length;

    // Pick highest confidence value
    const resolved = values.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      field,
      values,
      resolved: resolved.value,
      confidence: Math.round(weightedConfidence),
    };
  }

  /**
   * Apply transform rule
   */
  applyTransform(value: string, rule: TransformRule): string {
    switch (rule.type) {
      case 'format':
        return this.formatValue(value, rule.formula || 'uppercase');

      case 'filter':
        return rule.conditions?.every(c => this.checkCondition(value, c))
          ? value
          : '';

      case 'calculate':
        return this.calculateValue(value, rule.formula || 'value');

      default:
        return value;
    }
  }

  private formatValue(value: string, format: string): string {
    switch (format.toLowerCase()) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'titlecase':
        return value.replace(/\w\S*/g, txt =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'trim':
        return value.trim();
      default:
        return value;
    }
  }

  private checkCondition(value: string, condition: { field: string; operator: string; value: any }): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return value.toLowerCase().includes(String(condition.value).toLowerCase());
      case 'startsWith':
        return value.toLowerCase().startsWith(String(condition.value).toLowerCase());
      case 'endsWith':
        return value.toLowerCase().endsWith(String(condition.value).toLowerCase());
      default:
        return true;
    }
  }

  private calculateValue(value: string, formula: string): string {
    // Simple formula evaluation
    try {
      // Replace variables
      const expr = formula.replace(/\{value\}/g, value);
      const result = Function(`"use strict"; return (${expr})`)();
      return String(result);
    } catch {
      return value;
    }
  }

  private mergeContacts(base: ContactEnrichment | null, update: ContactEnrichment): ContactEnrichment {
    if (!base) return update;

    return {
      ...base,
      ...update,
      email: update.email || base.email,
      firstName: update.firstName || base.firstName,
      lastName: update.lastName || base.lastName,
      company: update.company || base.company,
      title: update.title || base.title,
      phone: update.phone || base.phone,
      linkedinUrl: update.linkedinUrl || base.linkedinUrl,
    };
  }

  private mergeCompanies(base: CompanyEnrichment | null, update: CompanyEnrichment): CompanyEnrichment {
    if (!base) return update;

    return {
      ...base,
      ...update,
      companyName: update.companyName || base.companyName,
      domain: update.domain || base.domain,
      industry: update.industry || base.industry,
      employees: update.employees || base.employees,
      technologies: [...new Set([...(base.technologies || []), ...(update.technologies || [])])],
    };
  }

  /**
   * Get available providers
   */
  getProviders(): { name: ProviderName; enabled: boolean; priority: number }[] {
    return providers.map(p => ({
      name: p.name,
      enabled: p.enabled,
      priority: p.priority,
    }));
  }
}

export const enrichmentService = new EnrichmentService();
