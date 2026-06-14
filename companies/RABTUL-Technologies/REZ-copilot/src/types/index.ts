/**
 * REZ Copilot - AI Deal Coaching Types
 */

// Deal context for AI analysis
export interface DealContext {
  dealId: string;
  dealName: string;
  companyName: string;
  companyId: string;
  stage: string;
  value: number;
  probability: number;
  daysInStage: number;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  expectedCloseDate: Date;
  nextStep?: string;
  notes?: string;
}

// Company context
export interface CompanyContext {
  companyId: string;
  companyName: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  website?: string;
  signals: SignalContext[];
  contacts: ContactContext[];
  recentActivities: ActivityContext[];
}

// Signal context
export interface SignalContext {
  signalId: string;
  type: string;
  title: string;
  description: string;
  strength: 'weak' | 'medium' | 'strong';
  detectedAt: Date;
  source?: string;
}

// Contact context
export interface ContactContext {
  contactId: string;
  name: string;
  title?: string;
  email: string;
  linkedinUrl?: string;
  engagementScore?: number;
  lastTouchedAt?: Date;
}

// Activity context
export interface ActivityContext {
  activityId: string;
  type: string;
  description: string;
  performedBy: string;
  performedAt: Date;
}

// Chat message
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'deal' | 'company' | 'contact' | 'signal';
  id: string;
  title: string;
  summary?: string;
}

// Coaching actions
export interface CoachingAction {
  type: 'suggest_next_steps' | 'risk_alert' | 'opportunity' | 'research' | 'email_draft' | 'call_prep';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems?: string[];
  confidence?: number;
}

// Deal analysis
export interface DealAnalysis {
  dealId: string;
  overallScore: number;
  momentum: 'accelerating' | 'stalled' | 'declining';
  healthStatus: 'healthy' | 'at_risk' | 'critical';

  strengths: string[];
  weaknesses: string[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];

  nextBestActions: CoachingAction[];
  recommendedTalkTracks: TalkTrack[];
  competitiveInsights?: CompetitiveInsight[];

  generatedAt: Date;
}

// Risk item
export interface RiskItem {
  category: 'engagement' | 'timing' | 'competition' | 'budget' | 'stakeholder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}

// Opportunity item
export interface OpportunityItem {
  category: 'expansion' | 'acceleration' | 'advocacy' | 'upsell' | 'referral';
  description: string;
  potentialImpact: 'low' | 'medium' | 'high';
  actionRequired?: string;
}

// Talk track
export interface TalkTrack {
  scenario: string;
  objective: string;
  keyPoints: string[];
  exampleQuestions?: string[];
  objectionHandlers?: ObjectionHandler[];
}

export interface ObjectionHandler {
  objection: string;
  response: string;
  confidence: number;
}

// Competitive insight
export interface CompetitiveInsight {
  competitor: string;
  threat: 'low' | 'medium' | 'high';
  evidence?: string;
  counterStrategy?: string;
}

// Email draft
export interface EmailDraft {
  subject: string;
  body: string;
  tone: 'formal' | 'casual' | 'persuasive' | 'collaborative';
  recommendedLength: 'short' | 'medium' | 'long';
  callToAction?: string;
  followUpDate?: Date;
}

// Call preparation
export interface CallPrep {
  dealId: string;
  contactName: string;
  agenda: AgendaItem[];
  keyQuestions: string[];
  discoveryAreas: string[];
  competitivePositioning?: string;
  successCriteria: string[];
  icebreakers?: string[];
  closingAttempt?: string;
}

export interface AgendaItem {
  topic: string;
  duration: string;
  objective: string;
}

// Research result
export interface ResearchResult {
  query: string;
  insights: ResearchInsight[];
  sources: string[];
  generatedAt: Date;
}

export interface ResearchInsight {
  type: 'news' | 'funding' | 'hiring' | 'technology' | 'executive' | 'competitor' | 'general';
  title: string;
  summary: string;
  url?: string;
  relevance: number;
  publishedAt?: Date;
}

// Chat session
export interface ChatSession {
  id: string;
  dealId?: string;
  companyId?: string;
  messages: CopilotMessage[];
  context: {
    deal?: DealContext;
    company?: CompanyContext;
  };
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// AI model config
export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'huggingface' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

// Copilot settings
export interface CopilotSettings {
  userId: string;
  companyId: string;
  defaultModel: ModelConfig;
  notificationPreferences: {
    dealAlerts: boolean;
    weeklyDigest: boolean;
    coachingTips: boolean;
  };
  language: string;
  timezone: string;
}

// Notification
export interface CopilotNotification {
  id: string;
  type: 'risk_alert' | 'opportunity' | 'coaching_tip' | 'deal_update' | 'research_ready';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dealId?: string;
  companyId?: string;
  actionUrl?: string;
  createdAt: Date;
  read: boolean;
}

// Conversation context for AI
export interface ConversationContext {
  sessionId: string;
  deal?: DealContext;
  company?: CompanyContext;
  recentMessages: CopilotMessage[];
  userPreferences?: CopilotSettings;
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  dealId?: string;
  companyId?: string;
  contextOverride?: Partial<ConversationContext>;
}

export interface ChatResponse {
  message: CopilotMessage;
  suggestedActions?: CoachingAction[];
  relatedDeals?: string[];
  generatedAt: Date;
}

export interface AnalyzeDealRequest {
  dealId: string;
  includeResearch?: boolean;
  focusAreas?: ('risks' | 'opportunities' | 'competitive' | 'engagement' | 'next_steps')[];
}

export interface GenerateEmailRequest {
  dealId: string;
  contactId: string;
  template?: string;
  objective: 'follow_up' | 'introduction' | 'proposal' | 'meeting_request' | 'check_in' | 'custom';
  tone?: 'formal' | 'casual' | 'persuasive' | 'collaborative';
  keyPoints?: string[];
}

export interface CallPrepRequest {
  dealId: string;
  contactId: string;
  callObjective?: string;
  duration?: number; // minutes
}

// Streaming response for real-time updates
export interface StreamingChunk {
  type: 'text' | 'action' | 'insight' | 'complete' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}

// Health check
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  modelStatus: 'connected' | 'limited' | 'unavailable';
  responseTime: number;
  lastError?: string;
}
