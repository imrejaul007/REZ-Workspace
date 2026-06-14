/**
 * REZ B2B Revenue OS - Shared TypeScript Types
 *
 * Comprehensive type definitions for all B2B sales services.
 * Use these types across TAM Builder, Signal Service, Outbound,
 * Deal Intelligence, Activity, Meeting Notes, Buyer Mapping,
 * Personalization, AI CRM Updates, and Pipeline Services.
 */

// ============================================
// COMMON TYPES
// ============================================

export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  settings: Record<string, unknown>;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'sales_rep' | 'viewer';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================
// TAM BUILDER TYPES (4128)
// ============================================

export type CompanySize = 'startup' | 'smb' | 'mid-market' | 'enterprise';
export type CompanyStage = 'prospect' | 'active' | 'churned' | 'inactive';

export interface ICP {
  id: string;
  tenantId: string;
  name: string;
  description: string;

  // Firmographics
  firmographics: {
    industries: string[];
    companySizes: CompanySize[];
    locations: string[];
    revenueRange?: { min: number; max: number };
    employeeRange?: { min: number; max: number };
  };

  // Technographics
  technographics: {
    tools: string[];
    integrations: string[];
    techStack: string[];
  };

  // Behavioral
  behavioral: {
    useCases: string[];
    buyingStage: 'awareness' | 'consideration' | 'decision';
    budgetRange?: { min: number; max: number };
  };

  // Scoring
  scoringWeights: {
    firmographic: number;
    technographic: number;
    behavioral: number;
  };

  // Stats
  matchingCompanies: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  tenantId: string;

  // Basic Info
  name: string;
  domain: string;
  description?: string;

  // Classification
  industry: string;
  subIndustry?: string;
  companySize: CompanySize;
  stage: CompanyStage;

  // Metrics
  revenue?: number;
  employeeCount?: number;
  foundedYear?: number;

  // Location
  location: {
    address?: string;
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
  };

  // Contact
  linkedInUrl?: string;
  logoUrl?: string;

  // Scoring
  icpScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

export interface Contact {
  id: string;
  tenantId: string;
  companyId: string;

  // Identity
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  seniority: 'cxo' | 'vp' | 'director' | 'manager' | 'individual';

  // LinkedIn
  linkedInUrl?: string;
  linkedInId?: string;

  // Decision Role
  decisionRole: DecisionRole;
  influenceLevel: 'critical' | 'high' | 'medium' | 'low';

  // Engagement
  engagementLevel: 'none' | 'low' | 'medium' | 'high' | 'champion';
  lastContactedAt?: Date;
  touchpoints: number;

  // Status
  isPrimary: boolean;
  isCoach: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type DecisionRole =
  | 'champion'
  | 'economic_buyer'
  | 'technical_buyer'
  | 'legal_buyer'
  | 'user_buyer'
  | 'executive_sponsor'
  | 'influencer'
  | 'coach';

// ============================================
// SIGNAL SERVICE TYPES (4129)
// ============================================

export type SignalType =
  | 'job_posting'
  | 'funding'
  | 'news'
  | 'technology_change'
  | 'expansion'
  | 'executive_change'
  | 'partnership'
  | 'product_launch'
  | 'regulatory'
  | 'social_engagement'
  | 'website_visit'
  | 'content_download'
  | 'pricing_change'
  | 'layoffs';

export type IntentStage = 'awareness' | 'consideration' | 'decision' | 'purchase';

export interface Signal {
  id: string;
  tenantId: string;
  companyId: string;

  // Signal Info
  type: SignalType;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;

  // Intent
  intentStage: IntentStage;
  intentScore: number; // 0-100
  confidence: number; // 0-100

  // Impact
  impact: 'critical' | 'high' | 'medium' | 'low';

  // Metadata
  publishedAt: Date;
  detectedAt: Date;
  expiresAt?: Date;
  isActionable: boolean;
}

export interface Alert {
  id: string;
  tenantId: string;
  companyId: string;

  title: string;
  description: string;

  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'actioned' | 'dismissed';

  signals: string[]; // Signal IDs
  recommendedAction: string;

  createdAt: Date;
  actionedAt?: Date;
}

// ============================================
// OUTBOUND SERVICE TYPES (4130)
// ============================================

export type ChannelType = 'email' | 'linkedin' | 'sms' | 'call' | 'task';
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed';
export type StepType = 'email' | 'linkedin_message' | 'linkedin_connect' | 'sms' | 'call' | 'task';

export interface Sequence {
  id: string;
  tenantId: string;
  name: string;
  description?: string;

  // Configuration
  channels: ChannelType[];
  status: SequenceStatus;

  // Steps
  steps: SequenceStep[];

  // Settings
  settings: {
    delayBetweenSteps: number; // hours
    maxTouchesPerDay: number;
    stopOnReply: boolean;
    stopOnClick: boolean;
    workingHoursOnly: boolean;
  };

  // Stats
  stats: {
    totalProspects: number;
    activeProspects: number;
    completedProspects: number;
    repliedProspects: number;
    avgOpenRate: number;
    avgReplyRate: number;
  };

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SequenceStep {
  id: string;
  order: number;
  channel: StepType;

  // Content
  subject?: string; // For email
  template?: string;

  // Timing
  delayDays: number;
  delayHours: number;

  // Conditions
  conditions?: {
    stopOnReply: boolean;
    stopOnClick: boolean;
    skipIfNoResponse: boolean;
  };

  // A/B Test
  variants?: {
    name: string;
    weight: number;
    subject?: string;
    template: string;
  }[];
}

export interface Prospect {
  id: string;
  tenantId: string;
  contactId: string;
  companyId: string;

  // Sequence Assignment
  sequenceId?: string;
  sequenceStep?: number;

  // Status
  status: 'active' | 'replied' | 'converted' | 'bounced' | 'opted_out';

  // Engagement
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  replies: number;

  // Last Activity
  lastEmailAt?: Date;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
  lastRepliedAt?: Date;

  // Next Steps
  nextScheduledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEAL INTELLIGENCE TYPES (4131)
// ============================================

export type DealStage = 'qualification' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type DealTemperature = 'hot' | 'warm' | 'cold';
export type WinLikelihood = 'strong' | 'possible' | 'unlikely' | 'at_risk';

export interface Deal {
  id: string;
  tenantId: string;
  companyId: string;
  contactId?: string;

  // Basic Info
  name: string;
  description?: string;
  value: number;
  currency: string;

  // Stage
  stage: DealStage;
  stageProbability: number;

  // Timeline
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  daysInStage: number;

  // AI Scoring
  aiScore: {
    overall: number; // 0-100
    companyFit: number;
    intentSignals: number;
    engagement: number;
    activity: number;
    sentiment: number;
  };

  // Classification
  temperature: DealTemperature;
  winLikelihood: WinLikelihood;

  // Risks
  risks: DealRisk[];

  // Recommendations
  recommendations: DealRecommendation[];

  // Metadata
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

export interface DealRisk {
  id: string;
  type: 'stalled' | 'low_engagement' | 'competitor' | 'budget' | 'timeline' | 'stakeholder';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
}

export interface DealRecommendation {
  id: string;
  type: 'next_action' | 'meeting' | 'email' | 'content' | 'discount';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedOutcome?: string;
}

// ============================================
// ACTIVITY SERVICE TYPES (4132)
// ============================================

export type ActivityType =
  | 'call'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'meeting'
  | 'demo'
  | 'lunch'
  | 'linkedin_message'
  | 'linkedin_connection'
  | 'linkedin_post_viewed'
  | 'sms'
  | 'note'
  | 'task'
  | 'campaign_email'
  | 'ad_click'
  | 'form_submit'
  | 'webinar_attended'
  | 'proposal_sent'
  | 'contract_sent'
  | 'presentation'
  | 'trade_show'
  | 'cold_outreach'
  | 'inbound_reply'
  | 'trial_started'
  | 'onboarding_call'
  | 'support_ticket'
  | 'renewal_discussed'
  | 'feedback_call'
  | 'reference_shared';

export interface Activity {
  id: string;
  tenantId: string;

  // Reference
  type: ActivityType;
  entityType: 'company' | 'contact' | 'deal' | 'prospect';
  entityId: string;

  // Content
  title: string;
  description?: string;

  // Details
  channel?: string;
  duration?: number; // minutes
  outcome?: string;

  // People
  userId: string;
  userName: string;
  contactId?: string;

  // Engagement
  engagement?: 'positive' | 'neutral' | 'negative';

  // Metadata
  occurredAt: Date;
  createdAt: Date;
}

// ============================================
// MEETING NOTES TYPES (4133)
// ============================================

export type MeetingType = 'video' | 'phone' | 'in-person' | 'conference';
export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface MeetingNote {
  id: string;
  tenantId: string;

  // Meeting Info
  title: string;
  description?: string;
  date: Date;
  duration?: number;
  location?: string;
  meetingType: MeetingType;
  status: MeetingStatus;

  // Attendees
  attendees: MeetingAttendee[];

  // Content
  notes?: string;
  aiSummary?: string;
  keyDecisions: string[];
  topicsDiscussed: string[];

  // Action Items
  actionItems: ActionItem[];

  // References
  dealId?: string;
  companyId?: string;

  // AI Analysis
  sentiment?: 'positive' | 'neutral' | 'negative';
  engagementLevel?: 'high' | 'medium' | 'low';

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface MeetingAttendee {
  contactId?: string;
  name: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignedTo?: {
    userId?: string;
    name: string;
    email: string;
  };
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  completedAt?: Date;
}

// ============================================
// BUYER MAPPING TYPES (4134)
// ============================================

export interface BuyerPersona {
  id: string;
  tenantId: string;

  name: string;
  description: string;

  // Characteristics
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
  objections: string[];

  // Communication
  communicationStyle: 'formal' | 'casual' | 'technical' | 'relationship';
  preferredChannel: 'email' | 'phone' | 'linkedin' | 'in-person';

  // Decision
  decisionTimeline: 'impulsive' | 'short' | 'moderate' | 'long';

  // Usage
  usageCount: number;
  successRate?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface StakeholderMap {
  id: string;
  tenantId: string;
  companyId: string;
  companyName: string;

  // Contacts
  contacts: Contact[];

  // Relationships
  relationships: StakeholderRelationship[];

  // Coverage
  coverage: {
    overall: number;
    economic: number;
    technical: number;
    champion: number;
    executive: number;
  };

  // Gaps
  gaps: BuyerGap[];

  // Status
  status: 'incomplete' | 'in_progress' | 'complete';

  createdAt: Date;
  updatedAt: Date;
}

export interface StakeholderRelationship {
  fromContactId: string;
  toContactId: string;
  type: 'reports_to' | 'peers' | 'works_with' | 'supports';
  strength: number; // 1-10
}

export interface BuyerGap {
  type: 'missing_role' | 'low_influence' | 'disengaged' | 'negative';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  priority: number;
}

// ============================================
// PERSONALIZATION TYPES (4135)
// ============================================

export type ContentType = 'email' | 'linkedin' | 'sequence' | 'social' | 'ad';

export interface ContentTemplate {
  id: string;
  tenantId: string;

  name: string;
  description?: string;
  contentType: ContentType;

  // Content
  subject?: string;
  title?: string;
  body: string;
  cta?: {
    text: string;
    url: string;
  };

  // Variables
  variables: TemplateVariable[];

  // A/B Testing
  variants?: TemplateVariant[];

  // Stats
  usageCount: number;
  avgOpenRate?: number;
  avgClickRate?: number;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  source: 'contact' | 'company' | 'deal' | 'custom';
  defaultValue?: string;
  description?: string;
}

export interface TemplateVariant {
  name: string;
  weight: number;
  subject?: string;
  body: string;
}

// ============================================
// AI CRM UPDATES TYPES (4136)
// ============================================

export type UpdateType =
  | 'field_enrichment'
  | 'health_score'
  | 'sentiment_analysis'
  | 'next_action'
  | 'intent_detection';

export interface HealthScore {
  score: number; // 0-100
  components: {
    name: string;
    score: number;
    weight: number;
    reason: string;
  }[];
  positiveFactors: string[];
  negativeFactors: string[];
  riskFactors: string[];
  period: 'daily' | 'weekly' | 'monthly';
  calculatedAt: Date;
}

export interface AutoUpdateRule {
  id: string;
  tenantId: string;

  name: string;
  description?: string;

  // Trigger
  trigger: {
    type: 'scheduled' | 'event' | 'manual';
    schedule?: string; // Cron
    eventType?: string;
  };

  // Update Config
  updateType: UpdateType;
  targetEntity: 'contact' | 'company' | 'deal';

  // Status
  isActive: boolean;
  runCount: number;
  successCount: number;
  failureCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PIPELINE TYPES (4137)
// ============================================

export type ForecastPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Pipeline {
  id: string;
  tenantId: string;

  name: string;
  description?: string;

  stages: PipelineStage[];

  settings: {
    defaultCurrency: string;
    isDefault: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number; // 0-100
  avgDaysInStage: number;

  isWonStage: boolean;
  isLostStage: boolean;

  stats: {
    dealCount: number;
    totalValue: number;
  };
}

export interface Forecast {
  id: string;
  tenantId: string;
  pipelineId: string;

  period: ForecastPeriod;
  startDate: Date;
  endDate: Date;

  // Values
  totalPipeline: number;
  weightedPipeline: number;
  closedWon: number;
  closedLost: number;

  // Confidence
  confidence: number;
  confidenceFactors: string[];

  calculatedAt: Date;
}

export interface PipelineSuggestion {
  id: string;
  tenantId: string;

  type: 'stall_warning' | 'risk_alert' | 'opportunity' | 'accelerate' | 'move_stage';
  priority: 'critical' | 'high' | 'medium' | 'low';

  dealId?: string;
  title: string;
  description: string;
  reason: string;
  action: string;

  potentialValue?: number;

  status: 'pending' | 'accepted' | 'dismissed' | 'completed';

  createdAt: Date;
  expiresAt?: Date;
}

// ============================================
// UNIFIED TYPES (B2B Gateway)
// ============================================

export interface AccountView {
  account: Company;
  signals: Signal[];
  deals: Deal[];
  activities: Activity[];
  contacts: Contact[];
  insights: AccountInsights;
}

export interface AccountInsights {
  intentLevel: 'high' | 'medium' | 'low';
  engagementScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface DealView {
  deal: Deal;
  activities: Activity[];
  notes: MeetingNote[];
  contacts: Contact[];
  signals: Signal[];
  buyerMatrix?: StakeholderMap;
  score: Deal['aiScore'];
  recommendations: DealRecommendation[];
}

export interface PipelineOverview {
  pipeline: Pipeline;
  deals: Deal[];
  forecasts: Forecast[];
  suggestions: PipelineSuggestion[];
  analytics: PipelineAnalytics;
}

export interface PipelineAnalytics {
  totalDeals: number;
  totalValue: number;
  avgDealSize: number;
  conversionRate: number;
  avgDaysToClose: number;
  stageDistribution: Record<string, { count: number; value: number }>;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateCompanyRequest {
  name: string;
  domain: string;
  industry: string;
  companySize: CompanySize;
  revenue?: number;
  employeeCount?: number;
  location: { city?: string; state?: string; country: string };
}

export interface CreateDealRequest {
  name: string;
  companyId: string;
  value: number;
  expectedCloseDate: Date;
  stage?: DealStage;
  ownerId?: string;
}

export interface CreateActivityRequest {
  type: ActivityType;
  entityType: 'company' | 'contact' | 'deal';
  entityId: string;
  title: string;
  description?: string;
  occurredAt?: Date;
}

export interface CreateSequenceRequest {
  name: string;
  description?: string;
  channels: ChannelType[];
  steps: Omit<SequenceStep, 'id'>[];
  settings?: Sequence['settings'];
}

export interface GenerateContentRequest {
  templateId: string;
  contactId: string;
  companyId?: string;
  dealId?: string;
  customVariables?: Record<string, string>;
}

export interface GenerateForecastRequest {
  pipelineId: string;
  period: ForecastPeriod;
  startDate?: Date;
}


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-b2b-types',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
