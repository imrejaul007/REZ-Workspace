/**
 * Agent Middleware - Request/response processing hooks
 */

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(limit = 40, windowMs = 60000) {
  const requests = new Map();
  
  return async (agent, task) => {
    const now = Date.now();
    const key = agent.id;
    
    // Get or initialize request tracking
    let tracked = requests.get(key) || [];
    tracked = tracked.filter(ts => ts > now - windowMs);
    
    if (tracked.length >= limit) {
      const oldest = Math.min(...tracked);
      const waitMs = oldest + windowMs - now;
      throw new Error(`Rate limited. Wait ${waitMs}ms before next request.`);
    }
    
    tracked.push(now);
    requests.set(key, tracked);
    
    return { allowed: true, remaining: limit - tracked.length };
  };
}

/**
 * Caching middleware
 */
export function cacheMiddleware(cache, options = {}) {
  const {
    ttl = 60000,        // 1 minute default
    keyGenerator = JSON.stringify
  } = options;
  
  return async (agent, task) => {
    const cacheKey = `${agent.id}:${keyGenerator(task)}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return { cached: true, data: cached.data };
    }
    
    return { cached: false };
  };
}

/**
 * Retry middleware with exponential backoff
 */
export function retryMiddleware(options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED']
  } = options;
  
  return async (agent, task, next) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        if (!retryableErrors.includes(error.code)) break;
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    throw lastError;
  };
}

/**
 * Metrics middleware
 */
export function metricsMiddleware(metrics) {
  return async (agent, task, next) => {
    const start = Date.now();
    
    try {
      const result = await next();
      const duration = Date.now() - start;
      
      metrics.record({
        type: 'success',
        agentId: agent.id,
        taskType: task.type || 'unknown',
        duration,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      metrics.record({
        type: 'error',
        agentId: agent.id,
        taskType: task.type || 'unknown',
        duration,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  };
}

/**
 * Validation middleware
 */
export function validationMiddleware(schema) {
  return async (agent, task, next) => {
    // Validate task against schema
    if (schema.task) {
      validate(task, schema.task);
    }
    
    return await next();
  };
}

/**
 * Simple validation helper
 */
function validate(data, schema) {
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
  
  if (schema.type) {
    const actualType = typeof data;
    if (actualType !== schema.type) {
      throw new Error(`Invalid type: expected ${schema.type}, got ${actualType}`);
    }
  }
}

/**
 * Chain middleware together
 */
export function compose(...middlewares) {
  return async (agent, task, next) => {
    let index = 0;
    
    const run = async () => {
      if (index >= middlewares.length) {
        return await next();
      }
      
      const middleware = middlewares[index++];
      return await middleware(agent, task, run);
    };
    
    return await run();
  };
}
