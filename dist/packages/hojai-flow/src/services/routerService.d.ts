/**
 * Hojai Flow - Router Service
 *
 * Determines request execution path based on intent:
 * - Dictation Router
 * - Knowledge Router
 * - Workflow Router
 * - Agent Router
 * - Multi-Agent Router
 */
export interface RouteResult {
    route: RouterType;
    executionPlan: ExecutionStep[];
    estimatedLatency: number;
    confidence: number;
}
export type RouterType = 'DICTATION' | 'KNOWLEDGE' | 'WORKFLOW' | 'AGENT' | 'MULTI_AGENT' | 'UNKNOWN';
export interface ExecutionStep {
    order: number;
    service: string;
    action: string;
    params: Record<string, unknown>;
    dependsOn: number[];
}
export interface RouterConfig {
    enableDictation: boolean;
    enableKnowledge: boolean;
    enableWorkflow: boolean;
    enableAgent: boolean;
    enableMultiAgent: boolean;
    fallbackRoute: RouterType;
}
export declare class RouterService {
    private config;
    private intentService;
    private voiceService;
    constructor(config?: Partial<RouterConfig>);
    /**
     * Route a request to the appropriate handler
     */
    route(input: string | {
        transcript: string;
        audio?: Buffer;
    }, context?: Record<string, unknown>): Promise<RouteResult>;
    /**
     * Map intent type to router type
     */
    private mapIntentToRouter;
    /**
     * Generate execution plan
     */
    private generateExecutionPlan;
    /**
     * Generate dictation execution plan
     */
    private generateDictationPlan;
    /**
     * Generate knowledge execution plan
     */
    private generateKnowledgePlan;
    /**
     * Generate workflow execution plan
     */
    private generateWorkflowPlan;
    /**
     * Generate agent execution plan
     */
    private generateAgentPlan;
    /**
     * Generate multi-agent execution plan
     */
    private generateMultiAgentPlan;
    /**
     * Process audio input
     */
    private processAudio;
    /**
     * Estimate execution latency
     */
    private estimateLatency;
    /**
     * Get router status
     */
    getStatus(): {
        enabledRouters: RouterType[];
        config: RouterConfig;
        stats: {
            routesProcessed: number;
            avgLatency: number;
        };
    };
}
export declare const routerService: RouterService;
export default routerService;
//# sourceMappingURL=routerService.d.ts.map