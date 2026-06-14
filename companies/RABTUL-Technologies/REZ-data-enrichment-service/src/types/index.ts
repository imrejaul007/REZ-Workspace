/**
 * Type definitions for Data Enrichment Service
 * Clay parity - B2B data enrichment and CRM enrichment
 */

export type ProviderName =
  | 'apollo'
  | 'hunter'
  | 'clearbit'
  | 'zoominfo'
  | 'linkedin'
  | 'crunchbase'
  | 'builtwith'
  | 'wappalyzer';

export interface EnrichmentProvider {
  name: ProviderName;
  enabled: boolean;
  priority: number;
  creditsPerRequest: number;
  rateLimit: number; // requests per minute
}

export interface ContactEnrichment {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  company?: string;
  companyDomain?: string;
  phone?: string;
  linkedinUrl?: string;
  twitter?: string;
  location?: string;
  avatar?: string;
}

export interface CompanyEnrichment {
  companyName?: string;
  domain?: string;
  description?: string;
  founded?: number;
  employees?: number;
  employeesRange?: string;
  industry?: string;
  subIndustry?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  logo?: string;
  linkedinUrl?: string;
  twitter?: string;
  facebook?: string;
  crunchbaseUrl?: string;
  alexaRank?: number;
  technologies?: string[];
}

export interface EnrichmentResult<T> {
  data: T | null;
  source: ProviderName | 'combined';
  confidence: number; // 0-100
  verified: boolean;
  timestamp: string;
  providersUsed: ProviderName[];
  errors?: string[];
}

export interface WaterfallConfig {
  providers: ProviderName[];
  fallbackOrder: ProviderName[];
  maxProviders: number;
  stopOnFirstMatch: boolean;
}

export interface EnrichmentRequest {
  type: 'contact' | 'company' | 'both';
  contact?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    domain?: string;
    linkedinUrl?: string;
  };
  company?: {
    name?: string;
    domain?: string;
    linkedinUrl?: string;
  };
  waterfall?: Partial<WaterfallConfig>;
  forceRefresh?: boolean;
}

export interface BulkEnrichmentRequest {
  type: 'contact' | 'company';
  records: EnrichmentRequest['contact'][] | EnrichmentRequest['company'][];
  waterfall?: Partial<WaterfallConfig>;
}

export interface BulkEnrichmentResult {
  total: number;
  successful: number;
  failed: number;
  results: EnrichmentResult<ContactEnrichment | CompanyEnrichment>[];
  errors: { index: number; error: string }[];
}

export interface DataReconciliation {
  field: string;
  values: { value: string; source: ProviderName; confidence: number }[];
  resolved: string;
  confidence: number;
}

export interface TransformRule {
  id: string;
  name: string;
  type: 'format' | 'filter' | 'calculate' | 'lookup' | 'custom';
  input: string[];
  output: string;
  formula?: string;
  conditions?: { field: string; operator: string; value: any }[];
}

export interface WorkflowStep {
  id: string;
  type: 'enrich' | 'transform' | 'filter' | 'lookup' | 'export' | 'webhook';
  provider?: ProviderName;
  operation: string;
  params?: Record<string, any>;
  next?: string[];
}

export interface EnrichmentWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
