// Query Intent Types
export type QueryIntent = 'analysis' | 'recommendation' | 'comparison' | 'prediction' | 'general';

// Parsed Query Interface
export interface ParsedQuery {
  intent: QueryIntent;
  metric: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  filters: Record<string, unknown>;
  entities: string[];
  rawQuery: string;
}

// Message Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  parsedQuery?: ParsedQuery;
  response?: CopilotResponse;
}

// Chart Types
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'donut';

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: ChartType;
  data: ChartDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
}

// Metric Types
export interface Metric {
  id: string;
  name: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changePercentage?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

// Action Types
export interface Action {
  id: string;
  label: string;
  description: string;
  type: 'navigation' | 'execution' | 'export' | 'filter';
  payload?: Record<string, unknown>;
  icon?: string;
}

// Response Types
export interface CopilotResponse {
  answer: string;
  summary?: string;
  metrics?: Metric[];
  charts?: ChartConfig[];
  actions?: Action[];
  insights?: Insight[];
  sources?: DataSource[];
  followUpSuggestions?: string[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'opportunity' | 'info' | 'success';
  impact: 'high' | 'medium' | 'low';
  category: string;
}

export interface DataSource {
  id: string;
  name: string;
  url?: string;
  description?: string;
}

// Query History
export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  responseSummary?: string;
}

// Conversation Context
export interface ConversationContext {
  merchantId: string;
  conversationId: string;
  previousQueries: ParsedQuery[];
  focusAreas: string[];
}

// Suggested Questions
export interface SuggestedQuestion {
  id: string;
  text: string;
  category: string;
  icon?: string;
}

// API Request/Response Types
export interface QueryRequest {
  query: string;
  merchantId: string;
  conversationHistory?: Message[];
  context?: ConversationContext;
}

export interface QueryResponse {
  success: boolean;
  data?: CopilotResponse;
  error?: string;
}

export interface RecommendationRequest {
  merchantId: string;
  category?: string;
  constraints?: Record<string, unknown>;
}

export interface RecommendationResponse {
  success: boolean;
  data?: {
    recommendations: Action[];
    reasoning: string;
  };
  error?: string;
}

// Voice Input State
export interface VoiceInputState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error?: string;
}

// Store State
export interface ChatStoreState {
  messages: Message[];
  isLoading: boolean;
  queryHistory: QueryHistoryItem[];
  suggestedQuestions: SuggestedQuestion[];
  conversationContext: ConversationContext | null;
  voiceInputState: VoiceInputState;

  // Actions
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  addToHistory: (item: QueryHistoryItem) => void;
  setSuggestedQuestions: (questions: SuggestedQuestion[]) => void;
  updateContext: (context: Partial<ConversationContext>) => void;
  setVoiceInputState: (state: Partial<VoiceInputState>) => void;
}

// Export default suggested questions
export const DEFAULT_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: '1', text: 'Why are sales down this week?', category: 'analysis', icon: 'TrendingDown' },
  { id: '2', text: 'What offer should I run for summer?', category: 'recommendation', icon: 'Sun' },
  { id: '3', text: 'How many customers did I lose last month?', category: 'analysis', icon: 'Users' },
  { id: '4', text: 'Which campaign generated the most revenue?', category: 'comparison', icon: 'BarChart3' },
  { id: '5', text: 'Compare my performance vs last month', category: 'comparison', icon: 'GitCompare' },
  { id: '6', text: 'What should I do to increase repeat customers?', category: 'recommendation', icon: 'Repeat' },
];