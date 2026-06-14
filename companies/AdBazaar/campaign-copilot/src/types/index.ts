// Campaign Copilot Types

export interface CopilotMessageAction {
  type: 'create_campaign' | 'pause_campaign' | 'adjust_budget' | 'generate_report' | 'recommend';
  params: Record<string, unknown>;
  executed: boolean;
  result?: Record<string, unknown>;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'copilot' | 'system';
  content: string;
  timestamp: Date;
  actions?: CopilotMessageAction[];
}

export interface CopilotContext {
  currentCampaigns: CampaignSummary[];
  recentMetrics: CampaignMetrics;
  recommendations: string[];
}

export interface CampaignSummary {
  campaignId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  roas: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CopilotConversation {
  conversationId: string;
  advertiserId: string;
  campaignId?: string;
  messages: CopilotMessage[];
  context: CopilotContext;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  campaignId?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: CopilotMessage;
  context: CopilotContext;
  actions?: CopilotMessageAction[];
}

export interface SuggestRequest {
  advertiserId: string;
  conversationId?: string;
  triggerType?: 'idle' | 'performance_drop' | 'budget_alert' | 'opportunity';
}

export interface SuggestResponse {
  suggestions: CopilotSuggestion[];
  conversationId?: string;
}

export interface CopilotSuggestion {
  id: string;
  type: 'optimization' | 'alert' | 'opportunity' | 'action';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
  campaignId?: string;
}

export interface CampaignContextResponse {
  campaign: CampaignSummary;
  historicalMetrics: {
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }[];
  insights: string[];
  recommendations: string[];
}

export interface AuthPayload {
  userId: string;
  advertiserId: string;
  email: string;
  role: string;
}

// Intent types for NLP processing
export interface ParsedIntent {
  action: string;
  entities: {
    campaignId?: string;
    campaignName?: string;
    budget?: number;
    dateRange?: { start: Date; end: Date };
    metric?: string;
    operation?: string;
  };
  confidence: number;
  rawQuery: string;
}