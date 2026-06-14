import { z } from 'zod';

// Client types
export interface ClientProfile {
  clientId: string;
  name: string;
  industry: string;
  agencyId: string;
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  contacts: ContactInfo[];
  campaigns: CampaignSummary[];
  budget: BudgetInfo;
  spending: SpendingInfo;
  performance: PerformanceMetrics;
  metadata: ClientMetadata;
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  contactId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isPrimary: boolean;
}

export interface CampaignSummary {
  campaignId: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
}

export interface BudgetInfo {
  monthly: number;
  quarterly: number;
  yearly: number;
  currency: string;
}

export interface SpendingInfo {
  total: number;
  currentMonth: number;
  lastMonth: number;
  ytd: number;
}

export interface PerformanceMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCPC: number;
  avgROAS: number;
}

export interface ClientMetadata {
  website?: string;
  logo?: string;
  address?: AddressInfo;
  social?: SocialInfo;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface SocialInfo {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

// Contact types
export interface ContactDetails {
  contactId: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  metadata: ContactMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMetadata {
  birthday?: Date;
  linkedin?: string;
  timezone?: string;
  preferences?: Record<string, any>;
}

// Campaign types
export interface LinkedCampaign {
  campaignId: string;
  clientId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft' | 'archived';
  budget: CampaignBudget;
  dates: CampaignDates;
  performance: CampaignPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignBudget {
  allocated: number;
  spent: number;
  remaining: number;
  currency: string;
}

export interface CampaignDates {
  start: Date;
  end?: Date;
}

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
}

// Note types
export interface ClientNoteInfo {
  noteId: string;
  clientId: string;
  author: NoteAuthor;
  content: string;
  type: 'general' | 'meeting' | 'strategy' | 'issue' | 'update';
  isPinned: boolean;
  tags: string[];
  attachments: NoteAttachment[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteAuthor {
  id: string;
  name: string;
  role: string;
}

export interface NoteAttachment {
  name: string;
  url: string;
  type: string;
}

// Analytics types
export interface SpendAnalytics {
  analyticsId: string;
  clientId: string;
  period: AnalyticsPeriod;
  budget: AnalyticsBudget;
  spend: SpendBreakdown;
  projections: SpendProjections;
  benchmarks: SpendBenchmarks;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface AnalyticsBudget {
  allocated: number;
  spent: number;
  remaining: number;
  utilizationRate: number;
}

export interface SpendBreakdown {
  total: number;
  byChannel: Record<string, number>;
  byCampaign: Record<string, number>;
  daily: number[];
}

export interface SpendProjections {
  endOfPeriod: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface SpendBenchmarks {
  industryAverage: number;
  clientVsBenchmark: number;
  percentile: number;
}

// Dashboard types
export interface ClientDashboard {
  client: ClientProfile;
  contacts: ContactInfo[];
  campaigns: CampaignSummary[];
  spendAnalytics: SpendAnalytics;
  recentNotes: ClientNoteInfo[];
  performance: PerformanceMetrics;
  alerts: DashboardAlert[];
}

export interface DashboardAlert {
  type: 'budget' | 'performance' | 'inactive' | 'campaign';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Query types
export interface ClientQuery {
  page?: number;
  limit?: number;
  status?: string;
  industry?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SpendQuery {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
}

// Zod schemas for validation
export const ClientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['active', 'inactive', 'prospect', 'churned']).optional(),
  industry: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'spending.total', 'performance.avgROAS']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SpendQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export default {
  ClientQuerySchema,
  SpendQuerySchema,
};