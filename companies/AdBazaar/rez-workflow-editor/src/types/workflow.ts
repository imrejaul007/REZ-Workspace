// Core workflow types for the Visual Workflow Editor

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'ai_agent'
  | 'delay'
  | 'webhook'
  | 'filter'
  | 'transform';

export type TriggerType =
  | 'review_received'
  | 'purchase_completed'
  | 'customer_checkin'
  | 'cart_abandoned'
  | 'birthday_anniversary'
  | 'manual_trigger'
  | 'scheduled_trigger';

export type ActionType =
  | 'send_whatsapp'
  | 'send_email'
  | 'create_campaign'
  | 'add_to_segment'
  | 'update_crm'
  | 'trigger_loyalty'
  | 'send_push_notification';

export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';

export type ConditionLogic = 'and' | 'or';

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  type: WorkflowNodeType;
  icon?: string;
  description?: string;
  config: Record<string, unknown>;
  // Trigger specific
  triggerType?: TriggerType;
  // Action specific
  actionType?: ActionType;
  // Condition specific
  conditions?: Condition[];
  logic?: ConditionLogic;
  // Delay specific
  delayDuration?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  // AI Agent specific
  agentTask?: string;
  agentModel?: string;
  // Webhook specific
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  webhookHeaders?: Record<string, string>;
  // Filter specific
  filterField?: string;
  filterOperator?: ConditionOperator;
  filterValue?: string;
  // Transform specific
  transformOperations?: TransformOperation[];
}

export interface TransformOperation {
  field: string;
  operation: 'uppercase' | 'lowercase' | 'trim' | 'replace' | 'concat' | 'date_format';
  value?: string;
}

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: string;
  label?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: Position;
  data: NodeData;
  handles?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface WorkflowMetadata {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  triggerCount?: number;
  actionCount?: number;
}

export interface Workflow {
  id: string;
  metadata: WorkflowMetadata;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings?: WorkflowSettings;
}

export interface WorkflowSettings {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  errorHandling?: 'continue' | 'stop' | 'retry';
  notifications?: {
    onError?: boolean;
    onSuccess?: boolean;
    email?: string;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  workflow: Omit<Workflow, 'id' | 'metadata'>;
  tags?: string[];
  popularity?: number;
}

// Node type configuration for the palette
export interface NodeTypeConfig {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'triggers' | 'actions' | 'logic' | 'integration';
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeployResponse {
  success: boolean;
  workflowId: string;
  deploymentId?: string;
  message?: string;
}

// Version history
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  snapshot: Workflow;
  changelog?: string;
}

// Analytics
export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageExecutionTime: number;
  lastRunAt?: string;
}

// Node categories for sidebar
export const NODE_CATEGORIES = {
  triggers: {
    label: 'Triggers',
    description: 'Events that start your workflow',
    color: 'bg-green-500',
  },
  actions: {
    label: 'Actions',
    description: 'Tasks that execute in your workflow',
    color: 'bg-blue-500',
  },
  logic: {
    label: 'Logic',
    description: 'Control flow and decisions',
    color: 'bg-purple-500',
  },
  integration: {
    label: 'Integration',
    description: 'Connect to external services',
    color: 'bg-orange-500',
  },
} as const;

// Node type icons (using Lucide icon names)
export const NODE_ICONS: Record<WorkflowNodeType, string> = {
  trigger: 'Zap',
  action: 'Play',
  condition: 'GitBranch',
  ai_agent: 'Bot',
  delay: 'Clock',
  webhook: 'Globe',
  filter: 'Filter',
  transform: 'Shuffle',
};

// Color mapping for node types
export const NODE_COLORS: Record<WorkflowNodeType, { bg: string; border: string; text: string }> = {
  trigger: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
  action: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  condition: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
  ai_agent: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
  delay: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
  webhook: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-500' },
  filter: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
  transform: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-500' },
};

// Trigger type labels
export const TRIGGER_LABELS: Record<TriggerType, string> = {
  review_received: 'Review Received',
  purchase_completed: 'Purchase Completed',
  customer_checkin: 'Customer Check-in',
  cart_abandoned: 'Cart Abandoned',
  birthday_anniversary: 'Birthday / Anniversary',
  manual_trigger: 'Manual Trigger',
  scheduled_trigger: 'Scheduled Trigger',
};

// Action type labels
export const ACTION_LABELS: Record<ActionType, string> = {
  send_whatsapp: 'Send WhatsApp',
  send_email: 'Send Email',
  create_campaign: 'Create Campaign',
  add_to_segment: 'Add to Segment',
  update_crm: 'Update CRM',
  trigger_loyalty: 'Trigger Loyalty',
  send_push_notification: 'Send Push Notification',
};

// Condition operators
export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

// Default node configurations
export const DEFAULT_NODE_DATA: Record<WorkflowNodeType, Partial<NodeData>> = {
  trigger: {
    label: 'Trigger',
    config: {},
    triggerType: 'manual_trigger',
  },
  action: {
    label: 'Action',
    config: {},
    actionType: 'send_email',
  },
  condition: {
    label: 'Condition',
    config: {},
    conditions: [],
    logic: 'and',
  },
  ai_agent: {
    label: 'AI Agent',
    config: {},
    agentTask: '',
    agentModel: 'gpt-4',
  },
  delay: {
    label: 'Delay',
    config: {},
    delayDuration: 1,
    delayUnit: 'hours',
  },
  webhook: {
    label: 'Webhook',
    config: {},
    webhookUrl: '',
    webhookMethod: 'POST',
  },
  filter: {
    label: 'Filter',
    config: {},
    filterField: '',
    filterOperator: 'equals',
    filterValue: '',
  },
  transform: {
    label: 'Transform',
    config: {},
    transformOperations: [],
  },
};