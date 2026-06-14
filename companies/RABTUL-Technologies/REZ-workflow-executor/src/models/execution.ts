export interface WorkflowExecution {
  id: string;
  workflowId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  currentNodeId?: string;
  context: Record<string, any>;
  variables: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export interface ExecutionNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'ai_agent' | 'approval' | 'transform' | 'error';
  name: string;
  config: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  position: { x: number; y: number };
  data?: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface ExecutionEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface ExecutionResult {
  execution: WorkflowExecution;
  completedNodes: number;
  totalNodes: number;
  success: boolean;
  output?: any;
}

export interface NodeExecutor {
  type: string;
  execute(config: Record<string, any>, context: Record<string, any>): Promise<any>;
}

export interface ExecutionEvent {
  id: string;
  executionId: string;
  nodeId?: string;
  type: 'started' | 'node_started' | 'node_completed' | 'node_failed' | 'completed' | 'failed' | 'paused' | 'resumed';
  message: string;
  data?: any;
  timestamp: string;
}

export interface ExecutionStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  avgDuration: number;
  successRate: number;
}
