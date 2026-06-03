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
// ============================================================================
// MAIN EXPORTS
// ============================================================================
export { HojaiClient, HojaiError } from './client.js';
// ============================================================================
// AGENT MODULE
// ============================================================================
export { createAgentBuilder, defineTool, defineTools, systemPromptTemplates, getSystemPrompt, createPredefinedAgent, estimateAgentCost, validateAgentConfig, PredefinedAgentType, } from './agents.js';
// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default {
    // Main client
    HojaiClient,
    HojaiError,
    // Agent utilities
    createAgentBuilder,
    defineTool,
    defineTools,
    systemPromptTemplates,
    getSystemPrompt,
    createPredefinedAgent,
    estimateAgentCost,
    validateAgentConfig,
    PredefinedAgentType,
};
//# sourceMappingURL=index.js.map