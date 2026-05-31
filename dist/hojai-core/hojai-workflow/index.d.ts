/**
 * Hojai Workflow Platform - Enhanced
 *
 * PORT: 4560
 *
 * Enhanced with:
 * - Orchestration Engine (multi-step workflows)
 * - Action Engine (execute actions)
 * - Trigger System (event-driven)
 * - Workflow Versioning
 */
/**
 * Workflow types
 */
export type WorkflowType = 'automation' | 'sequence' | 'broadcast' | 'reaction' | 'orchestration';
/**
 * Workflow status
 */
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'stopped';
/**
 * Workflow trigger types
 */
export type TriggerType = 'event' | 'schedule' | 'manual' | 'api' | 'condition';
/**
 * Step types
 */
export type StepType = 'message' | 'delay' | 'condition' | 'action' | 'ai' | 'wait' | 'split' | 'join';
/**
 * Workflow trigger
 */
export interface WorkflowTrigger {
    type: TriggerType;
    event_type?: string;
    schedule_cron?: string;
    schedule_timezone?: string;
    condition?: TriggerCondition;
}
export interface TriggerCondition {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
}
/**
 * Workflow step
 */
export interface WorkflowStep {
    id: string;
    name: string;
    order: number;
    type: StepType;
    config: StepConfig;
    retry?: RetryConfig;
    timeout?: number;
}
export interface StepConfig {
    channel?: string;
    template_id?: string;
    content?: string;
    variables?: Record<string, string>;
    delay_seconds?: number;
    delay_minutes?: number;
    conditions?: Condition[];
    then_steps?: string[];
    else_steps?: string[];
    action_type?: string;
    action_config?: Record<string, any>;
    ai_prompt?: string;
    ai_model?: string;
    wait_for?: string;
    wait_timeout?: number;
    branches?: SplitBranch[];
    wait_for_steps?: string[];
}
export interface Condition {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
    logical?: 'and' | 'or';
}
export interface SplitBranch {
    name: string;
    step_ids: string[];
    condition?: Condition;
}
export interface RetryConfig {
    max_attempts: number;
    backoff_seconds: number;
    backoff_multiplier?: number;
}
/**
 * Workflow
 */
export interface Workflow {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: WorkflowType;
    status: WorkflowStatus;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    version: number;
    is_current_version: boolean;
    previous_version_id?: string;
    created_by: string;
    stats: WorkflowStats;
    created_at: string;
    updated_at: string;
    last_executed_at?: string;
}
export interface WorkflowStats {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    avg_execution_time_seconds: number;
}
/**
 * Workflow execution
 */
export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    workflow_version: number;
    tenant_id: string;
    trigger_type: TriggerType;
    trigger_data?: Record<string, any>;
    context: Record<string, any>;
    current_step_id?: string;
    status: ExecutionStatus;
    step_results: StepResult[];
    started_at: string;
    completed_at?: string;
    error?: string;
}
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting';
export interface StepResult {
    step_id: string;
    step_name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    started_at?: string;
    completed_at?: string;
    output?: any;
    error?: string;
    retry_count: number;
}
/**
 * Action types
 */
export type ActionType = 'send_message' | 'send_email' | 'send_sms' | 'send_whatsapp' | 'create_task' | 'update_customer' | 'add_tag' | 'remove_tag' | 'update_segment' | 'trigger_webhook' | 'call_api' | 'delay' | 'condition' | 'ai_action';
/**
 * Action definition
 */
export interface ActionDefinition {
    type: ActionType;
    name: string;
    description: string;
    parameters: ActionParameter[];
    returns: string;
    category: 'communication' | 'data' | 'automation' | 'ai';
}
/**
 * Action parameter
 */
export interface ActionParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: any;
}
/**
 * Predefined actions
 */
export declare const PREDEFINED_ACTIONS: ActionDefinition[];
export declare class HojaiWorkflowPlatform {
    private orchestrationEngine;
    private actionEngine;
    constructor();
    createWorkflow(tenantId: string, createdBy: string, data: any): Promise<Workflow>;
    updateWorkflow(tenantId: string, workflowId: string, data: any): Promise<Workflow | null>;
    getWorkflow(tenantId: string, workflowId: string): Promise<Workflow | null>;
    listWorkflows(tenantId: string, options?: any): Promise<Workflow[]>;
    activateWorkflow(tenantId: string, workflowId: string): Promise<Workflow | null>;
    pauseWorkflow(tenantId: string, workflowId: string): Promise<Workflow | null>;
    execute(tenantId: string, workflowId: string, triggerData?: any): Promise<WorkflowExecution>;
    getExecution(tenantId: string, executionId: string): Promise<WorkflowExecution | null>;
    listExecutions(tenantId: string, workflowId?: string): Promise<WorkflowExecution[]>;
    cancelExecution(tenantId: string, executionId: string): Promise<boolean>;
    listActions(): ActionDefinition[];
    getAction(type: ActionType): ActionDefinition | undefined;
}
export declare function createWorkflowRoutes(platform: HojaiWorkflowPlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiWorkflowPlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiWorkflowPlatform: typeof HojaiWorkflowPlatform;
    createWorkflowRoutes: typeof createWorkflowRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map