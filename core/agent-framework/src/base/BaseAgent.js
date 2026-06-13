/ * eslint-disable no-unused-vars */
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

/**
 * BaseAgent - Shared foundation for all RTMN AI agents
 * Provides core functionality: memory, context, tools, observability, error handling
 */
class BaseAgent {
  constructor(config = {}) {
    this.id = config.id || uuidv4();
    this.name = config.name || 'BaseAgent';
    this.industry = config.industry || 'general';
    this.role = config.role || 'assistant';
    this.capabilities = config.capabilities || [];
    this.version = config.version || '1.0.0';
    
    // Memory and context
    this.shortTermMemory = [];
    this.longTermMemory = null;
    this.context = {
      sessionId: null,
      userId: null,
      properties: {},
      twins: [],
      metadata: {}
    };
    
    // Tool registry
    this.tools = new Map();
    this.toolAliases = new Map();
    
    // State management
    this.state = {
      status: 'idle', // idle, running, paused, error
      lastActivity: null,
      errorCount: 0,
      taskCount: 0
    };
    
    // Rate limiting
    this.rateLimiter = {
      maxRequests: config.maxRequests || 40,
      windowMs: config.windowMs || 60000,
      requests: []
    };
    
    // Observability
    this.logger = this._createLogger(config.logLevel || 'info');
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      avgResponseTime: 0,
      totalTokens: 0
    };
    
    // Error handling
    this.errorHandlers = new Map();
    this._registerDefaultErrorHandlers();
    
    // Initialize hooks
    this._initHooks = [];
    this._preProcessHooks = [];
    this._postProcessHooks = [];
    
    this.logger.info(`BaseAgent initialized: ${this.name} (${this.id})`);
  }

  /**
   * Create Winston logger instance
   */
  _createLogger(level) {
    return winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Register default error handlers
   */
  _registerDefaultErrorHandlers() {
    this.onError('rate_limit', async (error) => {
      this.logger.warn('Rate limit hit, backing off...');
      await this._sleep(5000);
      return { action: 'retry', delay: 5000 };
    });

    this.onError('api_error', async (error) => {
      this.logger.error(`API error: ${error.message}`);
      if (error.status >= 500) {
        return { action: 'retry', delay: 2000 };
      }
      return { action: 'fail' };
    });

    this.onError('timeout', async (error) => {
      this.logger.warn('Request timeout');
      return { action: 'retry', delay: 1000 };
    });
  }

  /**
   * Register error handler for specific error type
   */
  onError(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Register initialization hook
   */
  onInit(hook) {
    this._initHooks.push(hook);
  }

  /**
   * Register pre-processing hook
   */
  onPreProcess(hook) {
    this._preProcessHooks.push(hook);
  }

  /**
   * Register post-processing hook
   */
  onPostProcess(hook) {
    this._postProcessHooks.push(hook);
  }

  /**
   * Register a tool with the agent
   */
  registerTool(tool) {
    if (typeof tool === 'function') {
      tool = { execute: tool };
    }
    
    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || {},
      execute: tool.execute.bind(this),
      aliases: tool.aliases || []
    });
    
    // Register aliases
    (tool.aliases || []).forEach(alias => {
      this.toolAliases.set(alias, tool.name);
    });
    
    this.logger.debug(`Tool registered: ${tool.name}`);
    return this;
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools) {
    tools.forEach(tool => this.registerTool(tool));
    return this;
  }

  /**
   * Get tool by name or alias
   */
  getTool(name) {
    const actualName = this.toolAliases.get(name) || name;
    return this.tools.get(actualName);
  }

  /**
   * Check rate limit before making request
   */
  async checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.rateLimiter.windowMs;
    
    // Remove old requests
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      ts => ts > windowStart
    );
    
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
      throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
    }
    
    this.rateLimiter.requests.push(now);
  }

  /**
   * Execute a task with full lifecycle management
   */
  async execute(task, context = {}) {
    const startTime = Date.now();
    const taskId = uuidv4();
    
    try {
      // Update state
      this.state.status = 'running';
      this.state.lastActivity = startTime;
      this.state.taskCount++;
      
      // Merge context
      const fullContext = { ...this.context, ...context, taskId };
      
      // Run pre-process hooks
      for (const hook of this._preProcessHooks) {
        await hook.call(this, task, fullContext);
      }
      
      // Process task
      let result = await this.process(task, fullContext);
      
      // Run post-process hooks
      for (const hook of this._postProcessHooks) {
        result = await hook.call(this, result, fullContext);
      }
      
      // Update memory
      this._addToMemory({
        type: 'task',
        task,
        result,
        timestamp: startTime,
        duration: Date.now() - startTime
      });
      
      // Update metrics
      this.metrics.tasksCompleted++;
      this._updateAvgResponseTime(Date.now() - startTime);
      
      this.state.status = 'idle';
      
      return {
        success: true,
        taskId,
        result,
        metadata: {
          duration: Date.now() - startTime,
          agent: this.name
        }
      };
      
    } catch (error) {
      return await this._handleError(error, task, taskId);
    }
  }

  /**
   * Process task - override in subclasses
   */
  async process(task, context) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Handle errors with registered handlers
   */
  async _handleError(error, task, taskId) {
    this.state.errorCount++;
    this.state.status = 'error';
    
    const errorInfo = {
      message: error.message,
      type: error.type || 'unknown',
      status: error.status,
      stack: error.stack
    };
    
    // Try registered error handler
    const handler = this.errorHandlers.get(errorInfo.type);
    if (handler) {
      const response = await handler(error);
      if (response.action === 'retry') {
        this.logger.info(`Retrying after ${response.delay}ms`);
        await this._sleep(response.delay);
        return this.execute(task);
      }
    }
    
    this.logger.error(`Task failed: ${error.message}`);
    this.metrics.tasksFailed++;
    this.state.status = 'idle';
    
    return {
      success: false,
      taskId,
      error: errorInfo,
      metadata: {
        agent: this.name,
        errorCount: this.state.errorCount
      }
    };
  }

  /**
   * Add entry to short-term memory
   */
  _addToMemory(entry) {
    this.shortTermMemory.push(entry);
    
    // Keep memory bounded
    const maxMemory = 100;
    if (this.shortTermMemory.length > maxMemory) {
      this.shortTermMemory = this.shortTermMemory.slice(-maxMemory);
    }
  }

  /**
   * Search memory for relevant entries
   */
  searchMemory(query, limit = 10) {
    const results = this.shortTermMemory
      .filter(entry => {
        const searchText = JSON.stringify(entry).toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
      .slice(-limit);
    
    return results;
  }

  /**
   * Update average response time metric
   */
  _updateAvgResponseTime(duration) {
    const n = this.metrics.tasksCompleted;
    this.metrics.avgResponseTime = 
      ((n - 1) * this.metrics.avgResponseTime + duration) / n;
  }

  /**
   * Utility: sleep for ms milliseconds
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get agent status and metrics
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      industry: this.industry,
      role: this.role,
      status: this.state.status,
      metrics: this.metrics,
      toolsCount: this.tools.size,
      memorySize: this.shortTermMemory.length,
      lastActivity: this.state.lastActivity
    };
  }

  /**
   * Reset agent state
   */
  reset() {
    this.shortTermMemory = [];
    this.state = {
      status: 'idle',
      lastActivity: null,
      errorCount: 0,
      taskCount: 0
    };
    this.logger.info('Agent state reset');
  }

  /**
   * Serialize agent state for persistence
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      industry: this.industry,
      role: this.role,
      capabilities: this.capabilities,
      version: this.version,
      context: this.context,
      state: this.state,
      metrics: this.metrics,
      memory: this.shortTermMemory
    };
  }

  /**
   * Restore agent state from serialized data
   */
  static deserialize(data) {
    const agent = new BaseAgent({
      id: data.id,
      name: data.name,
      industry: data.industry,
      role: data.role,
      capabilities: data.capabilities,
      version: data.version
    });
    
    agent.context = data.context;
    agent.state = data.state;
    agent.metrics = data.metrics;
    agent.shortTermMemory = data.memory || [];
    
    return agent;
  }
}

export default BaseAgent;
