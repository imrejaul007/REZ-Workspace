/**
 * RTMN Agent Framework
 * Shared foundation for all AI agents across 24 industries
 * 
 * @version 1.0.0
 */

import BaseAgent from './base/BaseAgent.js';
import AgentFactory from './base/AgentFactory.js';
import ToolRegistry, { BUILTIN_TOOLS, TOOL_CATEGORIES } from './base/ToolRegistry.js';
import AgentOrchestrator, { STRATEGIES } from './base/AgentOrchestrator.js';
import ContextManager, { MEMORY_TYPES } from './base/ContextManager.js';
import { createLogger, LOG_LEVELS, formatters } from './utils/logger.js';
import {
  rateLimitMiddleware,
  cacheMiddleware,
  retryMiddleware,
  metricsMiddleware,
  validationMiddleware,
  compose
} from './middleware/agentMiddleware.js';
import {
  PromptBuilder,
  UNIVERSAL_PROMPTS,
  INDUSTRY_PROMPTS,
  createPromptBuilder
} from './prompts/promptBuilder.js';

/**
 * Agent Framework exports
 */
export {
  // Core classes
  BaseAgent,
  AgentFactory,
  ToolRegistry,
  AgentOrchestrator,
  ContextManager,
  
  // Enums and constants
  STRATEGIES,
  BUILTIN_TOOLS,
  TOOL_CATEGORIES,
  MEMORY_TYPES,
  LOG_LEVELS,
  UNIVERSAL_PROMPTS,
  INDUSTRY_PROMPTS,
  
  // Utilities
  createLogger,
  formatters,
  createPromptBuilder,
  
  // Middleware
  rateLimitMiddleware,
  cacheMiddleware,
  retryMiddleware,
  metricsMiddleware,
  validationMiddleware,
  compose,
  
  // Classes
  PromptBuilder
};

/**
 * Quick start - create a basic agent
 */
export function createAgent(config) {
  const agent = new BaseAgent({
    name: config.name || 'Agent',
    industry: config.industry || 'general',
    role: config.role || 'assistant',
    capabilities: config.capabilities || [],
    maxRequests: config.maxRequests || 40,
    windowMs: config.windowMs || 60000
  });
  
  // Register tools
  if (config.tools) {
    agent.registerTools(config.tools);
  }
  
  // Override process method if provided
  if (config.process) {
    agent.process = config.process;
  }
  
  return agent;
}

/**
 * Create agent factory with pre-registered types
 */
export function createAgentFactory(config = {}) {
  return new AgentFactory(config);
}

/**
 * Create orchestrator for multi-agent tasks
 */
export function createOrchestrator(config = {}) {
  return new AgentOrchestrator(config);
}

/**
 * Create context manager
 */
export function createContextManager(config = {}) {
  return new ContextManager(config);
}

/**
 * Create tool registry with built-in tools
 */
export function createToolRegistry() {
  const registry = new ToolRegistry();
  
  // Register built-in tools
  Object.values(BUILTIN_TOOLS).forEach(tool => {
    registry.register(tool);
  });
  
  return registry;
}

/**
 * Agent Framework version
 */
export const VERSION = '1.0.0';
export const SUPPORTED_INDUSTRIES = [
  'legal', 'healthcare', 'finance', 'retail', 'education',
  'manufacturing', 'realestate', 'travel', 'restaurant',
  'fitness', 'automotive', 'entertainment', 'gaming',
  'agriculture', 'construction', 'beauty', 'fashion',
  'sports', 'government', 'homeservices', 'professional',
  'nonprofit', 'media', 'energy'
];

export default {
  BaseAgent,
  AgentFactory,
  ToolRegistry,
  AgentOrchestrator,
  ContextManager,
  createAgent,
  createAgentFactory,
  createOrchestrator,
  createContextManager,
  createToolRegistry,
  VERSION,
  SUPPORTED_INDUSTRIES
};
