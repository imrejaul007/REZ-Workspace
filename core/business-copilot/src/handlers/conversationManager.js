/**
 * ConversationManager - Manages chat sessions
 */
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
  constructor(config = {}) {
    this.redis = config.redis;
    this.logger = config.logger;
    this.sessions = new Map();
  }

  createSession({ industry, userId }) {
    const session = {
      id: uuidv4(),
      industry,
      userId,
      context: {},
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: new Date().toISOString()
      });
      session.lastActivity = new Date().toISOString();
    }
    return session;
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  updateContext(sessionId, context) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = { ...session.context, ...context };
    }
    return session;
  }
}

export default ConversationManager;
