// ============================================================================
// Role AI Agents - Type Definitions
// ============================================================================

export type AgentLevel = 'L1' | 'L2' | 'L3' | 'L4';

export type JobRole =
  | 'software-engineer'
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'hr'
  | 'operations'
  | 'product'
  | 'design'
  | 'support'
  | 'admin';

export interface RoleCapability {
  category: string;
  skills: string[];
  description: string;
}

export interface RoleAgent {
  role: JobRole;
  level: AgentLevel;
  name: string;
  title: string;
  experience: string;
  capabilities: RoleCapability[];
  systemPrompt: string;
  tools: string[];
  traits: string[];
  goals: string[];
  constraints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleInfo {
  id: string;
  role: JobRole;
  name: string;
  description: string;
  icon: string;
  color: string;
  levels: {
    L1: string;
    L2: string;
    L3: string;
    L4: string;
  };
  totalCapabilities: number;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  role: JobRole;
  level: AgentLevel;
  message: string;
  userId?: string;
  context?: {
    previousMessages?: ChatMessage[];
    userProfile?: UserProfile;
    sessionData?: Record<string, unknown>;
  };
}

export interface ChatResponse {
  message: string;
  agent: {
    role: JobRole;
    level: AgentLevel;
    name: string;
  };
  suggestions?: string[];
  timestamp: Date;
  sessionId: string;
}

// User Profile for Recommendations
export interface UserProfile {
  userId: string;
  currentRole?: JobRole;
  currentLevel?: AgentLevel;
  experience: number; // years
  skills: string[];
  interests: string[];
  goals: string[];
}

// Recommendation Types
export interface RoleRecommendation {
  role: JobRole;
  roleName: string;
  levels: {
    recommended: AgentLevel;
    alternatives: AgentLevel[];
  };
  matchScore: number; // 0-100
  reasoning: string[];
  skillGaps: string[];
  growthPath: string[];
}

// Session Types
export interface AgentSession {
  id: string;
  userId?: string;
  role: JobRole;
  level: AgentLevel;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    messageCount: number;
    lastActivity: Date;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

// Level Configuration
export interface LevelConfig {
  level: AgentLevel;
  name: string;
  experience: string;
  primaryFocus: string;
  color: string;
  icon: string;
}

// Tool Definition
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'analytics' | 'communication' | 'automation' | 'ai';
  requiredRoles: JobRole[];
  requiredLevels: AgentLevel[];
}

// Notification Types
export interface AgentNotification {
  id: string;
  type: 'recommendation' | 'tip' | 'achievement' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
