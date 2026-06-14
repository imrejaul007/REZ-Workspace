/**
 * Types for Enrichment Workflow Builder
 * Visual workflow automation for data enrichment sequences
 */

export type WorkflowStepType =
  | 'input'
  | 'enrich_contact'
  | 'enrich_company'
  | 'find_email'
  | 'find_phone'
  | 'verify_email'
  | 'enrich_technographics'
  | 'filter'
  | 'transform'
  | 'condition'
  | 'merge'
  | 'export'
  | 'webhook'
  | 'crm_sync';

export interface WorkflowNode {
  id: string;
  type: WorkflowStepType;
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  inputFields: string[];
  outputFields: string[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output?: Record<string, any>;
  errors?: string[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  stepsCompleted: number;
  totalSteps: number;
}

export interface WorkflowExecution {
  stepId: string;
  stepType: WorkflowStepType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface TransformRule {
  field: string;
  type: 'uppercase' | 'lowercase' | 'titlecase' | 'trim' | 'replace' | 'regex' | 'concat' | 'split';
  formula?: string;
  from?: string;
  to?: string;
  delimiter?: string;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  mapping?: Record<string, string>;
}

export interface CrmSyncConfig {
  crm: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho';
  object: 'contact' | 'lead' | 'account';
  mapping: Record<string, string>;
  createNew: boolean;
  updateExisting: boolean;
}
