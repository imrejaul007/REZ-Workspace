export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  trigger: TriggerConfig;
  status: 'draft' | 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface TriggerConfig {
  type: 'event' | 'schedule' | 'manual' | 'api' | 'webhook';
  config: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  trigger: TriggerConfig;
  popularity: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface NodeDefinition {
  type: string;
  category: string;
  label: string;
  description: string;
  icon: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
}

// ReactFlow node data type
export interface FlowNodeData {
  label: string;
  description?: string;
  config?: Record<string, unknown>;
}
