/**
 * Hojai Agents Service
 * Version: 1.0 | Port: 4550
 * AI agent orchestration, registry, and execution
 */
export interface Agent {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    type: AgentType;
    capabilities: string[];
    config: AgentConfig;
    status: 'active' | 'inactive' | 'training' | 'error';
    skills: string[];
    createdAt: string;
    updatedAt: string;
}
export type AgentType = 'support' | 'sales' | 'orchestrator' | 'data' | 'communication' | 'workflow' | 'custom';
export interface AgentConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    prompts?: Record<string, string>;
}
export interface AgentExecution {
    id: string;
    agentId: string;
    tenantId: string;
    userId?: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    duration?: number;
    steps?: ExecutionStep[];
}
export interface ExecutionStep {
    id: string;
    name: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    startedAt: string;
    completedAt?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}
export interface AgentRegistry {
    id: string;
    type: string;
    name: string;
    description: string;
    capabilities: string[];
    category: string;
    config?: Record<string, unknown>;
}
export declare const agentStore: Map<string, Agent[]>;
export declare const executionStore: Map<string, AgentExecution[]>;
export declare const AGENT_TEMPLATES: AgentRegistry[];
interface TenantContext {
    tenant_id: string;
    user_id?: string;
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
declare function executeAgent(agent: Agent, input: Record<string, unknown>): Promise<Record<string, unknown>>;
declare class HojaiAgents {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    start(): void;
}
declare const agents: HojaiAgents;
export { HojaiAgents, executeAgent, AGENT_TEMPLATES };
export default agents;
//# sourceMappingURL=index.d.ts.map