/**
 * Workflow Models
 */

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'filter';
  subtype?: string;
  config: Record<string, unknown>;
  next?: string[];
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'published' | 'active' | 'paused';
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger: {
    type: 'event' | 'schedule' | 'manual' | 'api' | 'webhook';
    data: Record<string, unknown>;
  };
  currentNode?: string;
  context: Record<string, unknown>;
  logs: ExecutionLog[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  status: 'enter' | 'exit' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
  usageCount: number;
}
