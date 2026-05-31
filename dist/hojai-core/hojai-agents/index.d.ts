/**
 * Hojai Agent Platform
 *
 * Migration Strategy: Fork & Sync
 *
 * SOURCE: REZ-Intelligence/REZ-autonomous-agents
 * PORT: 4550
 */
import { AIEmployee } from '../../shared/types';
/**
 * Hojai Agent Platform
 */
export declare class HojaiAgentPlatform {
    /**
     * Create AI employee
     */
    createAgent(tenantId: string, data: Omit<AIEmployee, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'version' | 'stats'>): Promise<AIEmployee>;
    /**
     * Get agent by ID
     */
    getAgent(tenantId: string, agentId: string): Promise<AIEmployee | null>;
    /**
     * List agents for tenant
     */
    listAgents(tenantId: string, options?: {
        status?: AIEmployee['status'];
        type?: AIEmployee['type'];
    }): Promise<AIEmployee[]>;
    /**
     * Update agent
     */
    updateAgent(tenantId: string, agentId: string, updates: Partial<AIEmployee>): Promise<AIEmployee | null>;
    /**
     * Delete agent
     */
    deleteAgent(tenantId: string, agentId: string): Promise<boolean>;
    /**
     * Invoke agent (send message and get response)
     */
    invokeAgent(tenantId: string, agentId: string, input: {
        customerId: string;
        message: string;
        context?: Record<string, any>;
    }): Promise<{
        response: string;
        conversationId: string;
        escalated: boolean;
    }>;
    /**
     * Check if conversation should be escalated
     */
    private checkEscalation;
    /**
     * Generate AI response (placeholder - would integrate with LLM)
     */
    private generateResponse;
    /**
     * Update agent statistics
     */
    updateStats(tenantId: string, agentId: string, increments: Partial<AIEmployee['stats']>): Promise<void>;
    /**
     * Train agent (placeholder)
     */
    trainAgent(tenantId: string, agentId: string): Promise<{
        status: 'started' | 'completed';
        jobId: string;
    }>;
    private generateId;
}
/**
 * Create Express routes for Agent Platform
 */
export declare function createAgentRoutes(agentPlatform: HojaiAgentPlatform): import("express-serve-static-core").Router;
/**
 * Bootstrap the Agent Platform service
 */
export declare function bootstrap(port?: number): Promise<{
    agentPlatform: HojaiAgentPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiAgentPlatform: typeof HojaiAgentPlatform;
    createAgentRoutes: typeof createAgentRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map