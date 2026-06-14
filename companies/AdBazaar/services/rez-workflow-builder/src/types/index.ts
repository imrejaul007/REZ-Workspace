export type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'filter' | 'transform';
export type TriggerType = 'scheduled' | 'webhook' | 'event' | 'manual';
export type ActionType = 'post' | 'email' | 'sms' | 'push' | 'http' | 'transform' | 'notify';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  stats: {
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
    lastRun?: Date;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: {
    schedule?: string; // cron expression
    url?: string;
    event?: string;
    filter?: Record<string, any>;
  };
}

export interface Execution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  nodeExecutions: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
}
