/**
 * REZ Business AI - Types
 *
 * Core type definitions for the autonomous business AI service
 */

// Merchant Configuration
export interface MerchantConfig {
  merchantId: string;
  businessType: BusinessType;
  goals: BusinessGoals;
  constraints: BusinessConstraints;
  brandVoice: BrandVoice;
  approvalMode: ApprovalMode;
  createdAt: Date;
  updatedAt: Date;
}

export type BusinessType =
  | 'restaurant'
  | 'hotel'
  | 'salon'
  | 'gym'
  | 'clinic'
  | 'spa'
  | 'retail'
  | 'pharmacy'
  | 'education';

export interface BusinessGoals {
  primary: Goal[];
  secondary: Goal[];
  metrics: GoalMetrics;
}

export interface Goal {
  type: 'revenue' | 'customers' | 'retention' | 'footfall' | 'avg_order';
  target: number;
  timeline: 'daily' | 'weekly' | 'monthly';
}

export interface GoalMetrics {
  targetRevenue?: number;
  targetCustomers?: number;
  targetRetention?: number;
  targetFootfall?: number;
}

export interface BusinessConstraints {
  maxDiscount: number;
  maxAdBudget: number;
  minMargin: number;
  operatingHours: OperatingHours;
  restrictedDays?: string[];
  maxCashback: number;
  maxOfferValue: number;
  requireApprovalAbove: number;
}

export interface OperatingHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface BrandVoice {
  tone: 'professional' | 'friendly' | 'luxury' | 'casual';
  keywords: string[];
  avoidWords: string[];
  language: 'en' | 'hi' | 'regional';
}

export type ApprovalMode = 'suggestion' | 'semi_autonomous' | 'autonomous';

// AI Action Types
export interface AIAction {
  id: string;
  type: ActionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ActionStatus;
  agent: string;
  merchantId: string;
  data: ActionData;
  confidence: number;
  reasoning: string;
  estimatedImpact: ImpactEstimate;
  requiresApproval: boolean;
  approvedBy?: string;
  executedAt?: Date;
  createdAt: Date;
}

export type ActionType =
  | 'pricing_adjustment'
  | 'campaign_create'
  | 'offer_launch'
  | 'notification_send'
  | 'whatsapp_campaign'
  | 'loyalty_boost'
  | 'ad_create'
  | 'customer_reengagement'
  | 'inventory_alert'
  | 'staffing_suggestion'
  | 'demand_forecast'
  | 'competitor_response'
  | 'event_campaign'
  | 'report_generate';

export type ActionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed';

export interface ActionData {
  [key: string]: unknown;
  // Specific fields based on action type
  price?: number;
  originalPrice?: number;
  campaignName?: string;
  offerType?: string;
  offerValue?: number;
  targetAudience?: AudienceSegment;
  message?: string;
  channels?: ('push' | 'sms' | 'whatsapp' | 'email')[];
}

export interface AudienceSegment {
  type: 'all' | 'inactive' | 'high_value' | 'new' | 'regular' | 'churning' | 'custom';
  conditions?: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'between' | 'contains';
  value: unknown;
}

export interface ImpactEstimate {
  revenue: number;
  customers: number;
  conversionRate: number;
  roi: number;
  confidence: number;
}

// Intelligence Data
export interface BusinessIntelligence {
  merchantId: string;
  timestamp: Date;
  demandSignals: DemandSignal[];
  marketTrends: MarketTrend[];
  customerInsights: CustomerInsight[];
  competitorData: CompetitorIntel[];
  weatherImpact: WeatherImpact;
  eventImpact: EventImpact[];
  financialHealth: FinancialHealth;
}

export interface DemandSignal {
  type: string;
  strength: number;
  confidence: number;
  source: string;
  description: string;
  recommendedAction?: string;
}

export interface MarketTrend {
  category: string;
  trend: 'rising' | 'falling' | 'stable';
  change: number;
  forecast: number;
}

export interface CustomerInsight {
  segment: string;
  count: number;
  avgOrderValue: number;
  retentionRate: number;
  churnRisk: 'low' | 'medium' | 'high';
  topProducts: string[];
}

export interface CompetitorIntel {
  name: string;
  distance: string;
  pricing: number;
  offers: string[];
  rating: number;
  lastSeen: Date;
}

export interface WeatherImpact {
  condition: string;
  expectedDemandChange: number;
  recommendedOffers: string[];
}

export interface EventImpact {
  event: string;
  type: 'sports' | 'festival' | 'holiday' | 'local';
  date: Date;
  expectedBoost: number;
  relevantAudience: string[];
}

export interface FinancialHealth {
  revenue: number;
  expenses: number;
  profitMargin: number;
  cashFlow: number;
  outstandingPayments: number;
  healthScore: number;
}

// Execution Results
export interface ExecutionResult {
  actionId: string;
  success: boolean;
  executedActions: ExecutedAction[];
  metrics: ExecutionMetrics;
  errors?: string[];
  warnings?: string[];
}

export interface ExecutedAction {
  type: string;
  channel: string;
  targetCount: number;
  delivered: number;
  failed: number;
  cost: number;
}

export interface ExecutionMetrics {
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
}

// Reports
export interface BusinessReport {
  id: string;
  merchantId: string;
  type: ReportType;
  period: { start: Date; end: Date };
  summary: ReportSummary;
  insights: ReportInsight[];
  recommendations: AIRecommendation[];
  generatedAt: Date;
}

export type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'custom'
  | 'competitor_analysis'
  | 'performance_review';

export interface ReportSummary {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  customers: number;
  customersChange: number;
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  customerSegments: { segment: string; count: number; revenue: number }[];
}

export interface ReportInsight {
  type: 'positive' | 'negative' | 'neutral' | 'opportunity' | 'warning';
  title: string;
  description: string;
  data: Record<string, unknown>;
  impact: 'high' | 'medium' | 'low';
}

export interface AIRecommendation {
  priority: number;
  action: string;
  reason: string;
  expectedImpact: ImpactEstimate;
  effort: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
}
