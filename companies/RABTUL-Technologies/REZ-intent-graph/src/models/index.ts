/**
 * REZ Intent Graph - Data Models
 */

/**
 * Intent Stage - Buyer's position in the buying journey
 */
export enum IntentStage {
  NONE = 'none',
  AWARENESS = 'awareness',
  CONSIDERATION = 'consideration',
  DECISION = 'decision',
  PURCHASE = 'purchase',
}

/**
 * Intent Level - Heat score
 */
export enum IntentLevel {
  COLD = 'cold',
  WARM = 'warm',
  HOT = 'hot',
}

/**
 * Signal source types
 */
export enum SignalSource {
  SIGNALS_SERVICE = 'signals',
  ACTIVITY_SERVICE = 'activities',
  OUTREACH_SERVICE = 'outreach',
  MEETING_SERVICE = 'meetings',
  DEAL_SERVICE = 'deals',
  CRM = 'crm',
  ENGAGEMENT = 'engagement',
}

/**
 * Intent Signal - Individual signals contributing to intent
 */
export interface IntentSignal {
  id: string;
  source: SignalSource;
  type: string;
  title: string;
  description: string;
  strength: number; // 0-100
  detectedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Company Intent Profile - Full intent analysis for a company
 */
export interface CompanyIntentProfile {
  companyId: string;
  companyName: string;

  // Intent scores
  overallIntentScore: number;      // 0-100
  intentLevel: IntentLevel;
  intentStage: IntentStage;

  // Component scores
  signalScore: number;            // From signals
  activityScore: number;          // From activities
  engagementScore: number;        // From content engagement
  outreachScore: number;           // From outbound

  // Signals breakdown
  signals: IntentSignal[];

  // Timeline
  firstActivityAt?: Date;
  lastActivityAt?: Date;
  daysSinceLastActivity: number;

  // Predictions
  predictedStageChange?: Date;
  predictedCloseDate?: Date;
  confidence: number;             // 0-100

  // Recommendations
  recommendedActions: IntentAction[];

  // Analysis metadata
  analyzedAt: Date;
  analysisWindow: number;         // Days analyzed
}

/**
 * Recommended action based on intent analysis
 */
export interface IntentAction {
  id: string;
  type: 'outreach' | 'meeting' | 'content' | 'follow_up' | 'escalate' | 'nurture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  channel?: 'email' | 'linkedin' | 'call' | 'sms' | 'in_person';
  suggestedContent?: string;
  estimatedImpact?: number;
}

/**
 * Account Priority - Ranked list of accounts by intent
 */
export interface AccountPriority {
  rank: number;
  companyId: string;
  companyName: string;

  // Current state
  intentScore: number;
  intentLevel: IntentLevel;
  intentStage: IntentStage;

  // Deal context
  activeDeals: number;
  totalPipelineValue: number;
  weightedValue: number;        // intent * value

  // Engagement status
  lastActivityAt?: Date;
  daysSinceContact: number;
  contactFrequency: number;     // Contacts per week

  // Recommendations
  topAction: IntentAction;
  secondaryActions: IntentAction[];

  // Risk factors
  risks: string[];
  opportunities: string[];
}

/**
 * Intent Trend - How intent is changing over time
 */
export interface IntentTrend {
  companyId: string;
  period: '7d' | '14d' | '30d' | '90d';

  // Trend data points
  dataPoints: {
    date: Date;
    score: number;
    stage: IntentStage;
  }[];

  // Analysis
  trend: 'accelerating' | 'stable' | 'declining';
  changePercent: number;
  velocity: number;              // Points per day

  // Predictions
  projectedScore7d?: number;
  projectedStageChange?: Date;
}

/**
 * Content Engagement - Track content consumption
 */
export interface ContentEngagement {
  companyId: string;
  contactId?: string;

  contentType: 'email' | 'linkedin' | 'case_study' | 'webinar' | 'blog' | 'demo' | 'proposal';
  contentId: string;
  contentTitle: string;

  // Engagement metrics
  views: number;
  clicks: number;
  shares?: number;
  downloads?: number;

  // Time spent
  timeSpentSeconds?: number;
  completed: boolean;

  // Context
  engagementScore: number;       // 0-100
  engagedAt: Date;
}

/**
 * Outreach Response - Track outreach effectiveness
 */
export interface OutreachResponse {
  companyId: string;
  contactId: string;

  outreachType: 'email' | 'linkedin' | 'call' | 'sms';
  sequenceId?: string;
  stepNumber?: number;

  // Response metrics
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  convertedAt?: Date;

  // Scores
  openRate: number;
  clickRate: number;
  responseRate: number;
  conversionRate: number;
}

/**
 * Deal Acceleration - Factors driving deal forward
 */
export interface DealAcceleration {
  dealId: string;
  companyId: string;

  // Acceleration factors
  positiveSignals: {
    signal: string;
    impact: number;
    description: string;
  }[];

  negativeSignals: {
    signal: string;
    impact: number;
    description: string;
  }[];

  // Movement
  stageVelocity: number;         // Days to move through stage
  stakeholderEngagement: number;  // 0-100
  contentEngagement: number;     // 0-100
  competitionHeat: number;      // 0-100

  // Prediction
  accelerationScore: number;     // 0-100
  predictedOutcome: 'close' | 'stall' | 'lose';
  confidence: number;

  // Recommendations
  actions: IntentAction[];
}

/**
 * Account Intent Summary - Quick view for dashboards
 */
export interface AccountIntentSummary {
  companyId: string;
  companyName: string;

  intentScore: number;
  intentLevel: IntentLevel;
  intentStage: IntentStage;

  topSignals: IntentSignal[];
  topAction: IntentAction;

  lastActivityAt?: Date;
  daysSinceContact: number;

  dealValue?: number;
  predictedClose?: Date;
}

/**
 * Pipeline Intent Overview - Intent across pipeline
 */
export interface PipelineIntentOverview {
  totalAccounts: number;
  totalPipelineValue: number;

  // By intent level
  hotCount: number;
  hotValue: number;
  warmCount: number;
  warmValue: number;
  coldCount: number;
  coldValue: number;

  // By stage
  byStage: Record<IntentStage, { count: number; value: number }>;

  // Trends
  trendingHot: AccountIntentSummary[];   // Accelerating accounts
  trendingCold: AccountIntentSummary[];  // Declining accounts

  // Actions needed
  actionsRequired: {
    immediate: number;
    thisWeek: number;
    thisMonth: number;
  };
}

/**
 * Activity - Generic activity for intent tracking
 */
export interface Activity {
  id: string;
  type: string;
  description: string;
  performedAt: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Deal - Deal/Opportunity data
 */
export interface Deal {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  value: number;
  stage: string;
  closeDate?: string;
  createdAt: string;
  [key: string]: unknown;
}

/**
 * Outreach - Outreach campaign data
 */
export interface Outreach {
  id: string;
  companyId: string;
  type: string;
  status: string;
  sentAt: string;
  responseRate?: number;
  [key: string]: unknown;
}
