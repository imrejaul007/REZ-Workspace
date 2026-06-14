import { v4 as uuid } from 'uuid';
import { Session, SessionContext, Message, MemoryEntry, SessionState, SessionConfig, SessionSummary, Attachment } from '../models/session';
import logger from '../utils/logger';

// In-memory storage
const sessions: Map<string, Session> = new Map();

// Default config
const defaultConfig: SessionConfig = {
  maxMessages: 100,
  maxTokens: 100000,
  contextWindow: 8000,
  autoSave: true,
  expirationMinutes: 60,
};

export const createSession = (
  userId: string,
  agentId: string,
  initialContext?: Partial<SessionContext>,
  config?: Partial<SessionConfig>
): Session => {
  const id = `sess_${uuid()}`;
  const now = new Date().toISOString();
  const cfg = { ...defaultConfig, ...config };

  const session: Session = {
    id,
    userId,
    agentId,
    context: {
      variables: initialContext?.variables || {},
      memory: initialContext?.memory || [],
      attachments: initialContext?.attachments || [],
      userProfile: initialContext?.userProfile,
    },
    messages: [],
    state: {
      status: 'active',
      tags: [],
    },
    metadata: {
      config: cfg,
    },
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
    expiresAt: cfg.expirationMinutes
      ? new Date(Date.now() + cfg.expirationMinutes * 60000).toISOString()
      : undefined,
  };

  sessions.set(id, session);
  logger.info(`Session created: ${id} for user ${userId}`);

  return session;
};

export const getSession = (id: string): Session | undefined => {
  return sessions.get(id);
};

export const deleteSession = (id: string): boolean => {
  return sessions.delete(id);
};

export const addMessage = (
  sessionId: string,
  role: 'user' | 'agent' | 'system',
  content: string,
  attachments?: Attachment[],
  metadata?: Record<string, any>
): Message | null => {
  const session = sessions.get(sessionId);
  if (!session) {
    logger.error(`Session not found: ${sessionId}`);
    return null;
  }

  const message: Message = {
    id: `msg_${uuid()}`,
    role,
    content,
    attachments,
    metadata,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(message);
  session.lastActivityAt = message.timestamp;
  session.updatedAt = message.timestamp;

  // Trim old messages if exceeding max
  const cfg = session.metadata.config;
  if (session.messages.length > cfg.maxMessages) {
    session.messages = session.messages.slice(-cfg.maxMessages);
  }

  logger.debug(`Message added to session ${sessionId}: ${role}`);
  return message;
};

export const getMessages = (sessionId: string, limit?: number): Message[] => {
  const session = sessions.get(sessionId);
  if (!session) return [];

  if (limit) {
    return session.messages.slice(-limit);
  }
  return session.messages;
};

export const updateSessionContext = (
  sessionId: string,
  updates: {
    variables?: Record<string, any>;
    memory?: MemoryEntry[];
    attachments?: Attachment[];
    userProfile?: any;
  }
): Session | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (updates.variables) {
    session.context.variables = { ...session.context.variables, ...updates.variables };
  }
  if (updates.memory) {
    session.context.memory = [...session.context.memory, ...updates.memory];
  }
  if (updates.attachments) {
    session.context.attachments = [...session.context.attachments, ...updates.attachments];
  }
  if (updates.userProfile) {
    session.context.userProfile = updates.userProfile;
  }

  session.updatedAt = new Date().toISOString();
  return session;
};

export const addMemory = (
  sessionId: string,
  type: MemoryEntry['type'],
  content: string,
  source: 'user' | 'agent' | 'system',
  importance: number = 0.5
): MemoryEntry | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const entry: MemoryEntry = {
    id: `mem_${uuid()}`,
    type,
    content,
    source,
    importance,
    createdAt: new Date().toISOString(),
  };

  session.context.memory.push(entry);
  session.updatedAt = new Date().toISOString();

  return entry;
};

export const getMemory = (sessionId: string, type?: MemoryEntry['type']): MemoryEntry[] => {
  const session = sessions.get(sessionId);
  if (!session) return [];

  if (type) {
    return session.context.memory.filter(m => m.type === type);
  }
  return session.context.memory;
};

export const updateSessionState = (
  sessionId: string,
  updates: Partial<SessionState>
): Session | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.state = { ...session.state, ...updates };
  session.updatedAt = new Date().toISOString();

  return session;
};

export const getSessionsByUser = (userId: string): Session[] => {
  return Array.from(sessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
};

export const getSessionsByAgent = (agentId: string): Session[] => {
  return Array.from(sessions.values())
    .filter(s => s.agentId === agentId)
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
};

export const getActiveSessions = (): Session[] => {
  return Array.from(sessions.values())
    .filter(s => s.state.status === 'active')
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
};

export const getSessionSummaries = (filters?: { userId?: string; agentId?: string; status?: string }): SessionSummary[] => {
  let result = Array.from(sessions.values());

  if (filters?.userId) {
    result = result.filter(s => s.userId === filters.userId);
  }
  if (filters?.agentId) {
    result = result.filter(s => s.agentId === filters.agentId);
  }
  if (filters?.status) {
    result = result.filter(s => s.state.status === filters.status);
  }

  return result.map(s => ({
    id: s.id,
    userId: s.userId,
    agentId: s.agentId,
    messageCount: s.messages.length,
    lastMessageAt: s.messages[s.messages.length - 1]?.timestamp || s.createdAt,
    status: s.state.status,
    createdAt: s.createdAt,
  }));
};

export const resumeSession = (sessionId: string): Session | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.state.status === 'paused') {
    session.state.status = 'active';
    session.lastActivityAt = new Date().toISOString();
    session.updatedAt = session.lastActivityAt;
  }

  return session;
};

export const pauseSession = (sessionId: string): Session | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.state.status = 'paused';
  session.updatedAt = new Date().toISOString();

  return session;
};

export const completeSession = (sessionId: string): Session | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.state.status = 'completed';
  session.updatedAt = new Date().toISOString();

  return session;
};

export const getSessionStats = () => {
  const all = Array.from(sessions.values());
  return {
    total: all.length,
    active: all.filter(s => s.state.status === 'active').length,
    paused: all.filter(s => s.state.status === 'paused').length,
    completed: all.filter(s => s.state.status === 'completed').length,
    totalMessages: all.reduce((sum, s) => sum + s.messages.length, 0),
    avgMessagesPerSession: all.length > 0 ? all.reduce((sum, s) => sum + s.messages.length, 0) / all.length : 0,
  };
};
