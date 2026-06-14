// ==========================================
// MyTalent - AI Agents Service Client
// ==========================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Configuration
// ==========================================

const AI_AGENTS_URL = process.env.EXPO_PUBLIC_AI_AGENTS_URL || 'http://localhost:4750';

// ==========================================
// Types
// ==========================================

export type AgentId =
  | 'career-coach'
  | 'productivity-advisor'
  | 'learning-coach'
  | 'financial-advisor'
  | 'benefits-assistant'
  | 'hr-assistant';

export type AgentStatus = 'online' | 'busy' | 'offline';

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  status: AgentStatus;
  welcomeMessage: string;
  suggestions: string[];
  contextFields: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    actions?: AgentAction[];
  };
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: AgentId;
  messages: Message[];
  context: ConversationContext;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  isActive: boolean;
}

export interface ConversationContext {
  employeeId?: string;
  employeeName?: string;
  department?: string;
  designation?: string;
  tenure?: number;
  skills?: string[];
  projects?: string[];
  salary?: number;
  benefits?: string[];
  leaveBalance?: {
    sick: number;
    casual: number;
    earned: number;
  };
  performance?: {
    score: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface AgentAction {
  type: 'navigate' | 'open_url' | 'show_benefit' | 'calculate' | 'book' | 'notify';
  label: string;
  data: Record<string, any>;
}

export interface AgentResponse {
  agentId: AgentId;
  response: string;
  suggestions?: string[];
  actions?: AgentAction[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  context?: Partial<ConversationContext>;
  history?: Message[];
}

export interface DailyInsight {
  id: string;
  userId: string;
  date: string;
  type: 'productivity' | 'career' | 'wellness' | 'financial' | 'learning';
  title: string;
  description: string;
  score?: number;
  trend?: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface WeeklyDigest {
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: {
    productivity: number;
    learning: number;
    wellness: number;
    careerProgress: number;
  };
  highlights: string[];
  insights: DailyInsight[];
  upcomingGoals: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==========================================
// API Client
// ==========================================

class AIAgentsServiceClient {
  private baseUrl: string;
  private userId: string = 'demo-user';

  constructor(baseUrl: string = AI_AGENTS_URL) {
    this.baseUrl = baseUrl;
    this.loadUserId();
  }

  private async loadUserId() {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user.id || 'demo-user';
      }
    } catch (error) {
      logger.info('Error loading user ID:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        ...(options.headers as Record<string, string>),
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error: any) {
      logger.error('AI Agents API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ==========================================
  // Agent Methods
  // ==========================================

  /**
   * Get all available agents
   */
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request<Agent[]>('/api/agents');
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: AgentId): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${agentId}`);
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: AgentId): Promise<ApiResponse<{ status: AgentStatus }>> {
    return this.request<{ status: AgentStatus }>(`/api/agents/${agentId}/status`);
  }

  /**
   * Chat with an agent
   */
  async chat(
    agentId: AgentId,
    message: string,
    context?: Partial<ConversationContext>
  ): Promise<ApiResponse<AgentResponse>> {
    return this.request<AgentResponse>(`/api/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        context,
      }),
    });
  }

  /**
   * Configure agent for user
   */
  async configureAgent(
    agentId: AgentId,
    config: {
      preferences?: Record<string, any>;
      customInstructions?: string;
      enabled?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/agents/${agentId}/configure`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // ==========================================
  // Conversation Methods
  // ==========================================

  /**
   * Get user conversations
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request<Conversation[]>('/api/conversations');
  }

  /**
   * Get specific conversation
   */
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>(`/api/conversations/${conversationId}`);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Insights Methods
  // ==========================================

  /**
   * Get daily insights
   */
  async getDailyInsights(): Promise<ApiResponse<DailyInsight[]>> {
    return this.request<DailyInsight[]>('/api/insights/daily');
  }

  /**
   * Get weekly digest
   */
  async getWeeklyDigest(): Promise<ApiResponse<WeeklyDigest>> {
    return this.request<WeeklyDigest>('/api/insights/weekly');
  }
}

// ==========================================
// Default Agent Definitions (fallback when API unavailable)
// ==========================================

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'career-coach',
    name: 'Career Coach',
    description: 'Career planning, skill development, and promotion readiness',
    icon: '🎯',
    color: '#6366F1',
    capabilities: [
      'Analyze skills vs requirements',
      'Suggest career paths',
      'Predict promotion readiness',
      'Generate interview prep questions',
      'Create development plans',
    ],
    status: 'online',
    welcomeMessage: "Hi! I'm your Career Coach. I can help you plan your career growth, identify skill gaps, and prepare for your next promotion. What would you like to work on?",
    suggestions: [
      "What's my promotion readiness?",
      'What skills do I need for the next level?',
      'Help me plan my career path',
      'Prepare me for a job interview',
    ],
    contextFields: ['skills', 'projects', 'performance', 'tenure'],
  },
  {
    id: 'productivity-advisor',
    name: 'Productivity Advisor',
    description: 'Time management, focus optimization, and work-life balance',
    icon: '⚡',
    color: '#F59E0B',
    capabilities: [
      'Analyze work patterns',
      'Suggest optimal focus times',
      'Identify time wasters',
      'Pomodoro suggestions',
      'Meeting efficiency tips',
    ],
    status: 'online',
    welcomeMessage: "Hey! I'm your Productivity Advisor. I can help you manage your time better, stay focused, and achieve more with less stress. Ready to boost your productivity?",
    suggestions: [
      'How can I improve my focus?',
      'Analyze my work patterns',
      'Help me plan my week',
      'Reduce meeting fatigue',
    ],
    contextFields: ['projects', 'performance'],
  },
  {
    id: 'learning-coach',
    name: 'Learning Coach',
    description: 'Course recommendations, learning paths, and skill development',
    icon: '📚',
    color: '#10B981',
    capabilities: [
      'Analyze skill gaps',
      'Recommend courses',
      'Create learning paths',
      'Track progress',
      'Suggest certifications',
    ],
    status: 'online',
    welcomeMessage: "Welcome! I'm your Learning Coach. I can help you identify what to learn next, find the best resources, and create a learning plan that actually works. What skills do you want to develop?",
    suggestions: [
      'What should I learn next?',
      'Create a learning path for me',
      'Find courses for my skill gap',
      'Help me track my progress',
    ],
    contextFields: ['skills', 'department', 'careerGoals'],
  },
  {
    id: 'financial-advisor',
    name: 'Financial Advisor',
    description: 'Salary optimization, tax planning, and investment guidance',
    icon: '💰',
    color: '#8B5CF6',
    capabilities: [
      'Analyze salary structure',
      'Tax saving tips',
      'Investment suggestions',
      'EMI calculations',
      'Budget planning',
    ],
    status: 'online',
    welcomeMessage: "Hi there! I'm your Financial Advisor. I can help you understand your salary better, find tax savings, and make smart money decisions. What financial topic interests you?",
    suggestions: [
      'How can I save more tax?',
      'Where should I invest my savings?',
      'Review my salary structure',
      'Help me plan a budget',
    ],
    contextFields: ['salary', 'benefits'],
  },
  {
    id: 'benefits-assistant',
    name: 'Benefits Assistant',
    description: 'Help choose benefits, understand policies, and claim assistance',
    icon: '🎁',
    color: '#EC4899',
    capabilities: [
      'Explain benefit options',
      'Help choose plans',
      'Calculate benefit value',
      'Claim assistance',
      'Compare plans',
    ],
    status: 'online',
    welcomeMessage: "Hello! I'm your Benefits Assistant. I can help you understand your benefits, choose the right plans, and guide you through claims. Which benefits would you like to explore?",
    suggestions: [
      'What benefits do I have?',
      'Help me choose a health plan',
      'How do I claim my benefits?',
      'Compare my benefit options',
    ],
    contextFields: ['benefits', 'department'],
  },
  {
    id: 'hr-assistant',
    name: 'HR Assistant',
    description: 'Leave policies, attendance rules, and company information',
    icon: '👋',
    color: '#06B6D4',
    capabilities: [
      'Leave policy queries',
      'Attendance rules',
      'Company holidays',
      'Escalation paths',
      'Policy explanations',
    ],
    status: 'online',
    welcomeMessage: "Hi! I'm your HR Assistant. I can answer questions about leave policies, attendance, company rules, and more. What would you like to know?",
    suggestions: [
      'How many leave days do I have?',
      'What are the attendance rules?',
      'List upcoming holidays',
      'Who do I contact for issues?',
    ],
    contextFields: ['leaveBalance', 'department'],
  },
];

// ==========================================
// Export Singleton Instance
// ==========================================

export const aiAgentsService = new AIAgentsServiceClient();
export default aiAgentsService;
