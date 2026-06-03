/**
 * HOJAI AI SDK - TypeScript Client
 *
 * A comprehensive SDK for interacting with HOJAI AI services.
 *
 * @example
 * ```typescript
 * import { HojaiClient, createAgentBuilder, HojaiError } from '@hojai/sdk';
 *
 * const client = new HojaiClient({
 *   baseUrl: 'https://api.hojai.ai',
 *   tenantId: 'my-tenant',
 *   apiKey: process.env.HOJAI_API_KEY
 * });
 *
 * // Health check
 * const health = await client.health();
 *
 * // Create and use an agent
 * const agent = await client.agents.create({
 *   name: 'My Sales Agent',
 *   type: 'sales'
 * });
 *
 * const response = await client.agents.chat(agent.id, {
 *   message: 'Find me enterprise software companies'
 * });
 * ```
 *
 * @module @hojai/sdk
 */
export { HojaiClient, HojaiError } from './client.js';
export type { HojaiConfig } from './types.js';
export { createAgentBuilder, defineTool, defineTools, systemPromptTemplates, getSystemPrompt, createPredefinedAgent, estimateAgentCost, validateAgentConfig, PredefinedAgentType, } from './agents.js';
export type { AgentBuilder, AgentExecutionOptions, AgentExecutionResult, } from './agents.js';
export type { Agent, AgentStatus, AgentConfig, AgentExecution, CreateAgentRequest, UpdateAgentRequest, ToolDefinition, Memory, MemoryType, CreateMemoryRequest, SearchMemoriesRequest, ConversationMessage, Workflow, WorkflowStatus, WorkflowStep, WorkflowStepType, CreateWorkflowRequest, ExecuteWorkflowRequest, Message, MessageRole, LLMRequest, LLMResponse, TokenUsage, LLMProvider, EmbeddingRequest, EmbeddingResponse, RAGQuery, RAGResponse, RAGCitation, DataExportRequest, DataExportResponse, ConsentType, ConsentStatus, AgentTrustScore, UserTrustLevel, PaginationParams, PaginatedResponse, APIError, ErrorCode, WebhookEventType, WebhookPayload, UsageMetrics, AgentAnalytics, } from './types.js';
declare const _default: {
    HojaiClient: any;
    HojaiError: any;
    createAgentBuilder: any;
    defineTool: any;
    defineTools: any;
    systemPromptTemplates: any;
    getSystemPrompt: any;
    createPredefinedAgent: any;
    estimateAgentCost: any;
    validateAgentConfig: any;
    PredefinedAgentType: any;
};
export default _default;
//# sourceMappingURL=index.d.ts.map