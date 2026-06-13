/**
 * ContextManager - Manages agent context and memory
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Memory types
 */
export const MEMORY_TYPES = {
  EPISODIC: 'episodic',     // Specific experiences/events
  SEMANTIC: 'semantic',     // General knowledge/facts
  WORKING: 'working',       // Current task context
  PROCEDURAL: 'procedural'  // Skills and procedures
};

/**
 * ContextManager - Manages agent context across sessions
 */
class ContextManager {
  constructor(config = {}) {
    this.id = uuidv4();
    this.sessionId = uuidv4();
    
    // Memory stores
    this.episodicMemory = [];
    this.semanticMemory = new Map();
    this.workingMemory = {};
    this.proceduralMemory = new Map();
    
    // Context state
    this.contextStack = [];
    this.activeContext = null;
    
    // Configuration
    this.maxEpisodic = config.maxEpisodic || 1000;
    this.maxContextAge = config.maxContextAge || 3600000; // 1 hour default
    
    // LLM context window (tokens)
    this.contextWindow = config.contextWindow || 128000;
    this.currentTokens = 0;
  }

  /**
   * Start new session
   */
  startSession(userId, metadata = {}) {
    this.sessionId = uuidv4();
    this.workingMemory = {
      userId,
      startTime: Date.now(),
      metadata
    };
    this.contextStack = [];
    this.activeContext = null;
    
    return this.sessionId;
  }

  /**
   * Push context onto stack
   */
  pushContext(context) {
    const contextEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      data: context,
      tokens: this._estimateTokens(context)
    };
    
    this.contextStack.push(contextEntry);
    this.currentTokens += contextEntry.tokens;
    this.activeContext = contextEntry;
    
    // Trim if over context window
    this._trimContext();
    
    return contextEntry.id;
  }

  /**
   * Pop context from stack
   */
  popContext() {
    const popped = this.contextStack.pop();
    if (popped) {
      this.currentTokens -= popped.tokens;
    }
    this.activeContext = this.contextStack[this.contextStack.length - 1] || null;
    return popped;
  }

  /**
   * Add episodic memory (experience)
   */
  addEpisodic(type, content, metadata = {}) {
    const memory = {
      id: uuidv4(),
      type,
      content,
      timestamp: Date.now(),
      metadata,
      importance: metadata.importance || 1
    };
    
    this.episodicMemory.push(memory);
    
    // Trim old memories
    if (this.episodicMemory.length > this.maxEpisodic) {
      this._pruneEpisodic();
    }
    
    return memory.id;
  }

  /**
   * Add semantic memory (facts)
   */
  addSemantic(key, value, metadata = {}) {
    this.semanticMemory.set(key, {
      value,
      timestamp: Date.now(),
      metadata
    });
    return key;
  }

  /**
   * Get semantic memory
   */
  getSemantic(key) {
    return this.semanticMemory.get(key);
  }

  /**
   * Add procedural memory (skills)
   */
  addProcedural(skillId, procedure, metadata = {}) {
    this.proceduralMemory.set(skillId, {
      procedure,
      timestamp: Date.now(),
      metadata,
      usageCount: 0
    });
    return skillId;
  }

  /**
   * Get procedural memory
   */
  getProcedural(skillId) {
    const skill = this.proceduralMemory.get(skillId);
    if (skill) {
      skill.usageCount++;
    }
    return skill;
  }

  /**
   * Update working memory
   */
  setWorking(key, value) {
    this.workingMemory[key] = value;
  }

  /**
   * Get working memory
   */
  getWorking(key) {
    return this.workingMemory[key];
  }

  /**
   * Search episodic memory
   */
  searchEpisodic(query, options = {}) {
    const { limit = 10, minImportance = 0, since = 0 } = options;
    const q = query.toLowerCase();
    
    return this.episodicMemory
      .filter(m => {
        if (m.timestamp < since) return false;
        if (m.importance < minImportance) return false;
        return JSON.stringify(m.content).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Sort by importance first, then recency
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }

  /**
   * Get context for LLM
   */
  getContextForLLM(options = {}) {
    const { maxTokens = this.contextWindow, includeTypes = Object.values(MEMORY_TYPES) } = options;
    
    let context = [];
    let tokens = 0;
    
    // Add working memory first (highest priority)
    if (includeTypes.includes(MEMORY_TYPES.WORKING)) {
      const working = {
        type: MEMORY_TYPES.WORKING,
        content: this.workingMemory
      };
      const workingTokens = this._estimateTokens(working);
      if (tokens + workingTokens <= maxTokens) {
        context.push(working);
        tokens += workingTokens;
      }
    }
    
    // Add recent episodic memories
    if (includeTypes.includes(MEMORY_TYPES.EPISODIC)) {
      const recentEpisodic = this.episodicMemory
        .slice(-20)
        .reverse();
      
      for (const memory of recentEpisodic) {
        const memTokens = this._estimateTokens(memory);
        if (tokens + memTokens <= maxTokens) {
          context.push({
            type: MEMORY_TYPES.EPISODIC,
            content: memory.content,
            timestamp: memory.timestamp
          });
          tokens += memTokens;
        }
      }
    }
    
    // Add semantic memories
    if (includeTypes.includes(MEMORY_TYPES.SEMANTIC)) {
      for (const [key, entry] of this.semanticMemory) {
        const semTokens = this._estimateTokens(entry);
        if (tokens + semTokens <= maxTokens) {
          context.push({
            type: MEMORY_TYPES.SEMANTIC,
            key,
            content: entry.value,
            timestamp: entry.timestamp
          });
          tokens += semTokens;
        }
      }
    }
    
    return {
      context,
      tokens,
      truncated: tokens >= maxTokens
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  _estimateTokens(data) {
    const str = JSON.stringify(data);
    return Math.ceil(str.length / 4); // Rough: 1 token ≈ 4 chars
  }

  /**
   * Trim context if over window
   */
  _trimContext() {
    while (this.currentTokens > this.contextWindow && this.contextStack.length > 1) {
      this.popContext();
    }
  }

  /**
   * Prune old episodic memories
   */
  _pruneEpisodic() {
    const cutoff = Date.now() - this.maxContextAge;
    
    this.episodicMemory = this.episodicMemory
      .filter(m => m.timestamp > cutoff || m.importance > 3)
      .slice(-this.maxEpisodic);
  }

  /**
   * Clear all memory
   */
  clear() {
    this.episodicMemory = [];
    this.semanticMemory.clear();
    this.workingMemory = {};
    this.proceduralMemory.clear();
    this.contextStack = [];
    this.activeContext = null;
  }

  /**
   * Serialize for persistence
   */
  serialize() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      episodicMemory: this.episodicMemory,
      semanticMemory: Array.from(this.semanticMemory.entries()),
      workingMemory: this.workingMemory,
      proceduralMemory: Array.from(this.proceduralMemory.entries()),
      contextStack: this.contextStack
    };
  }

  /**
   * Restore from serialized state
   */
  static deserialize(data) {
    const manager = new ContextManager();
    manager.id = data.id;
    manager.sessionId = data.sessionId;
    manager.episodicMemory = data.episodicMemory || [];
    manager.semanticMemory = new Map(data.semanticMemory || []);
    manager.workingMemory = data.workingMemory || {};
    manager.proceduralMemory = new Map(data.proceduralMemory || []);
    manager.contextStack = data.contextStack || [];
    return manager;
  }
}

export default ContextManager;
