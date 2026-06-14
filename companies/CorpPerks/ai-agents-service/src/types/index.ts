// ==========================================
// AI Agents Service - Type Definitions
// ==========================================

import { z } from 'zod';

// ==========================================
// Agent Types
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
  prompt: string;
  status: AgentStatus;
  welcomeMessage: string;
  suggestions: string[];
  contextFields: string[];
}

export interface AgentConfig {
  userId: string;
  agentId: AgentId;
  preferences: Record<string, any>;
  customInstructions?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Conversation Types
// ==========================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
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

// ==========================================
// Agent Response Types
// ==========================================

export interface AgentResponse {
  agentId: AgentId;
  response: string;
  suggestions?: string[];
  actions?: AgentAction[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AgentAction {
  type: 'navigate' | 'open_url' | 'show_benefit' | 'calculate' | 'book' | 'notify';
  label: string;
  data: Record<string, any>;
}

// ==========================================
// Chat Request/Response Types
// ==========================================

export interface ChatRequest {
  message: string;
  context?: Partial<ConversationContext>;
  history?: Message[];
}

export interface ChatResponse {
  success: boolean;
  data?: AgentResponse;
  error?: string;
}

export interface ListAgentsResponse {
  success: boolean;
  data?: Agent[];
  error?: string;
}

export interface GetAgentResponse {
  success: boolean;
  data?: Agent;
  error?: string;
}

export interface GetConversationsResponse {
  success: boolean;
  data?: Conversation[];
  error?: string;
}

export interface ConfigureAgentRequest {
  preferences: Record<string, any>;
  customInstructions?: string;
  enabled?: boolean;
}

// ==========================================
// AI Insights Types
// ==========================================

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

// ==========================================
// Zod Schemas for Validation
// ==========================================

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    employeeId: z.string().optional(),
    employeeName: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    tenure: z.number().optional(),
    skills: z.array(z.string()).optional(),
    projects: z.array(z.string()).optional(),
    salary: z.number().optional(),
    benefits: z.array(z.string()).optional(),
    leaveBalance: z.object({
      sick: z.number(),
      casual: z.number(),
      earned: z.number(),
    }).optional(),
    performance: z.object({
      score: z.number(),
      trend: z.enum(['up', 'down', 'stable']),
    }).optional(),
  }).optional(),
  history: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
  })).optional(),
});

export const ConfigureAgentRequestSchema = z.object({
  preferences: z.record(z.any()),
  customInstructions: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
});

// ==========================================
// Agent Definitions
// ==========================================

export const AGENTS: Record<AgentId, Agent> = {
  'career-coach': {
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
    prompt: `You are an expert Career Coach for corporate employees. You help employees with:
- Career planning and goal setting
- Skill gap analysis and development
- Promotion readiness assessment
- Interview preparation
- Professional development plans

Provide personalized, actionable advice based on the employee's context. Be encouraging but realistic.`,
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
  'productivity-advisor': {
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
    prompt: `You are a Productivity Advisor helping employees maximize their efficiency. You specialize in:
- Time management techniques
- Focus and deep work optimization
- Meeting efficiency
- Work-life balance
- Task prioritization

Provide practical, implementable tips that fit into a busy corporate schedule.`,
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
  'learning-coach': {
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
    prompt: `You are a Learning Coach helping employees develop new skills and grow professionally. You help with:
- Identifying skill gaps
- Recommending learning resources
- Creating personalized learning paths
- Tracking learning progress
- Finding certifications

Make learning engaging and achievable. Connect learning to career goals.`,
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
  'financial-advisor': {
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
    prompt: `You are a Financial Advisor helping employees with their personal finances. You provide guidance on:
- Salary structure optimization
- Tax saving strategies
- Investment recommendations
- Budget planning
- EMI and loan management

Always remind users to consult a certified financial planner for major decisions.`,
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
  'benefits-assistant': {
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
    prompt: `You are a Benefits Assistant helping employees understand and maximize their company benefits. You help with:
- Explaining available benefits
- Choosing the right plans
- Calculating benefit values
- Guiding through claims
- Comparing options

Help employees get the most value from their benefits package.`,
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
  'hr-assistant': {
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
    prompt: `You are an HR Assistant helping employees with company policies and procedures. You assist with:
- Leave policies and requests
- Attendance rules and tracking
- Company holidays and events
- Escalation procedures
- Policy clarifications

Be helpful, accurate, and direct. Refer to HR for complex issues.`,
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
};

// ==========================================
// Type exports
// ==========================================

export type {
  Agent,
  AgentConfig,
  Message,
  Conversation,
  ConversationContext,
  AgentResponse,
  AgentAction,
  DailyInsight,
  WeeklyDigest,
};
