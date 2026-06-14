import { z } from 'zod';

// ============== Common Types ==============

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'inactive';
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'churned';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type ReportFormat = 'pdf' | 'csv' | 'json' | 'html';

// ============== Tenant/Branding Types ==============

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  success: string;
  warning: string;
}

export interface SocialLinks {
  website?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export interface CustomDomain {
  id: string;
  domain: string;
  isVerified: boolean;
  verifiedAt?: Date;
  sslEnabled: boolean;
  dnsRecord?: string;
  createdAt: Date;
}

export interface TenantBranding extends BaseEntity {
  tenantId: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandName: string;
  tagline?: string;
  description?: string;
  colors: BrandColors;
  fontFamily?: string;
  socialLinks?: SocialLinks;
  emailTemplates?: Record<string, string>;
  customCss?: string;
}

export interface CustomDomainConfig extends BaseEntity {
  tenantId: string;
  domain: string;
  isVerified: boolean;
  verifiedAt?: Date;
  sslEnabled: boolean;
  dnsConfig?: {
    type: string;
    name: string;
    value: string;
    priority?: number;
  };
}

// ============== Tenant Types ==============

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  status: TenantStatus;
  ownerId: string;
  plan: 'starter' | 'professional' | 'enterprise';
  customDomains: string[];
  settings: TenantSettings;
  metadata?: Record<string, unknown>;
}

export interface TenantSettings {
  allowCustomDomains: boolean;
  maxClients: number;
  maxUsers: number;
  maxCampaigns: number;
  features: string[];
  whiteLabel: boolean;
  clientPortalEnabled: boolean;
  analyticsEnabled: boolean;
  invoiceEnabled: boolean;
}

// ============== Client Types ==============

export interface Client extends BaseEntity {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  logoUrl?: string;
  status: ClientStatus;
  industry?: string;
  website?: string;
  address?: ClientAddress;
  contacts: ClientContact[];
  settings: ClientSettings;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface ClientAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

export interface ClientSettings {
  reportFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  currency: Currency;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  dashboardView: 'compact' | 'expanded';
}

// ============== Campaign Types ==============

export interface CampaignPerformance extends BaseEntity {
  clientId: string;
  campaignId: string;
  campaignName: string;
  startDate: Date;
  endDate?: Date;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  platform: string;
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  daily: DailyMetric[];
  weekly: WeeklyMetric[];
  monthly: MonthlyMetric[];
  demographics?: DemographicsData;
  devices?: DeviceBreakdown;
  locations?: LocationData[];
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface WeeklyMetric {
  weekStart: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface MonthlyMetric {
  month: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface DemographicsData {
  age: Record<string, number>;
  gender: Record<string, number>;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface LocationData {
  country: string;
  region?: string;
  city?: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

// ============== Invoice Types ==============

export interface Invoice extends BaseEntity {
  tenantId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  currency: Currency;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  lineItems: InvoiceLineItem[];
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentReference?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  campaignId?: string;
}

export interface InvoiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  headerLogo?: string;
  headerText?: string;
  footerText?: string;
  terms?: string;
  customStyles?: Record<string, string>;
}

// ============== Analytics Types ==============

export interface PortalAnalytics {
  clientId: string;
  period: AnalyticsPeriod;
  overview: AnalyticsOverview;
  campaignPerformance: CampaignPerformanceSummary[];
  trends: TrendData[];
  topPerformers: TopPerformer[];
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  granularity: 'day' | 'week' | 'month';
}

export interface AnalyticsOverview {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  averageCtr: number;
  averageCpc: number;
  averageCpa: number;
  averageRoas: number;
  impressionsChange: number;
  clicksChange: number;
  conversionsChange: number;
  spendChange: number;
  revenueChange: number;
}

export interface CampaignPerformanceSummary {
  campaignId: string;
  campaignName: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface TrendData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface TopPerformer {
  type: 'campaign' | 'ad_group' | 'keyword' | 'creative';
  id: string;
  name: string;
  metric: string;
  value: number;
  change: number;
}

// ============== Report Types ==============

export interface Report extends BaseEntity {
  tenantId: string;
  clientId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: 'generating' | 'ready' | 'failed';
  scheduled?: ReportSchedule;
  filters: ReportFilters;
  generatedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export type ReportType = 
  | 'performance'
  | 'campaign_summary'
  | 'financial'
  | 'audience'
  | 'custom';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface ReportFilters {
  campaignIds?: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  platforms?: string[];
  metrics?: string[];
}

// ============== API Response Types ==============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    requestId: string;
    timestamp: Date;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============== Zod Schemas for Validation ==============

export const BrandColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  error: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
});

export const CreateTenantBrandingSchema = z.object({
  tenantId: z.string().uuid(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  brandName: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  colors: BrandColorsSchema,
  fontFamily: z.string().optional(),
  socialLinks: z.object({
    website: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    instagram: z.string().url().optional(),
  }).optional(),
  customCss: z.string().optional(),
});

export const CreateClientSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  logoUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'churned']).default('pending'),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  contacts: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.string().optional(),
    isPrimary: z.boolean(),
  })).optional(),
  settings: z.object({
    reportFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
    emailNotifications: z.boolean().default(true),
    dashboardView: z.enum(['compact', 'expanded']).default('expanded'),
  }).optional(),
  tags: z.array(z.string()).default([]),
});

export const CreateInvoiceSchema = z.object({
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    amount: z.number().nonnegative(),
    taxRate: z.number().min(0).max(100).optional(),
    campaignId: z.string().uuid().optional(),
  })),
  taxRate: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const CreateReportSchema = z.object({
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['performance', 'campaign_summary', 'financial', 'audience', 'custom']),
  format: z.enum(['pdf', 'csv', 'json', 'html']).default('pdf'),
  filters: z.object({
    campaignIds: z.array(z.string().uuid()).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    platforms: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
  }),
  scheduled: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string(),
    recipients: z.array(z.string().email()),
    enabled: z.boolean().default(false),
  }).optional(),
});

export const CustomDomainSchema = z.object({
  tenantId: z.string().uuid(),
  domain: z.string().min(1).max(255),
});

// ============== User/Access Types ==============

export interface PortalUser extends BaseEntity {
  clientId: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'viewer' | 'editor' | 'admin';
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface PortalAccess {
  id: string;
  clientId: string;
  userId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// ============== Export Types ==============

export type {
  Tenant,
  TenantSettings,
  TenantBranding,
  CustomDomainConfig,
  Client,
  ClientSettings,
  ClientContact,
  ClientAddress,
  Invoice,
  InvoiceLineItem,
  InvoiceTemplate,
  CampaignPerformance,
  CampaignMetrics,
  DailyMetric,
  WeeklyMetric,
  MonthlyMetric,
  DemographicsData,
  DeviceBreakdown,
  LocationData,
  PortalAnalytics,
  AnalyticsPeriod,
  AnalyticsOverview,
  CampaignPerformanceSummary,
  TrendData,
  TopPerformer,
  Report,
  ReportSchedule,
  ReportFilters,
  ReportType,
  ReportFormat,
  PortalUser,
  PortalAccess,
  ApiResponse,
  ApiError,
};
