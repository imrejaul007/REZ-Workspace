export interface SessionMetadata {
  config: SessionConfig;
  tags?: string[];
  custom?: Record<string, any>;
}

export interface Session {
  id: string;
  userId: string;
  agentId: string;
  context: SessionContext;
  messages: Message[];
  state: SessionState;
  metadata: SessionMetadata;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  lastActivityAt: string;
}

export interface SessionContext {
  variables: Record<string, any>;
  memory: MemoryEntry[];
  attachments: Attachment[];
  userProfile?: UserProfile;
}

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'action' | 'result';
  content: string;
  source: 'user' | 'agent' | 'system';
  importance: number;
  createdAt: string;
  expiresAt?: string;
}

export interface Attachment {
  id: string;
  type: 'file' | 'image' | 'document' | 'link';
  name: string;
  url?: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  traits: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  timestamp: string;
  tokens?: number;
}

export interface SessionState {
  status: 'active' | 'paused' | 'completed' | 'expired';
  currentTask?: TaskInfo;
  progress?: number;
  tags: string[];
}

export interface TaskInfo {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
}

export interface SessionConfig {
  maxMessages: number;
  maxTokens: number;
  contextWindow: number;
  autoSave: boolean;
  expirationMinutes?: number;
}

export interface SessionSummary {
  id: string;
  userId: string;
  agentId: string;
  messageCount: number;
  lastMessageAt: string;
  status: string;
  createdAt: string;
}
