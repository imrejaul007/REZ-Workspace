/**
 * Hojai Core - Shared Types
 * Version: 1.0.0 | Date: May 30, 2026
 */

export interface TenantContext {
  tenant_id: string;
  organization_id?: string;
  user_id?: string;
  tenant_type?: 'commercial' | 'privileged' | 'personal';
  namespace: string;
  plan?: TenantPlan;
  roles?: string[];
  permissions?: string[];
}

export type TenantPlan = 'starter' | 'professional' | 'enterprise';

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  tenantId?: string;
  latencyMs?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorDetail;
  meta: ResponseMeta;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export function createResponse<T>(
  data: T,
  options?: { tenantId?: string; requestId?: string }
): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId || `req_${Date.now()}`,
      tenantId: options?.tenantId
    }
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): APIResponse<null> {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  };
}

// ============================================
// EVENT TYPES
// ============================================

export interface Event {
  id: string;
  type: string;
  source: string;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
  };
}

export interface EventSubscription {
  id: string;
  tenantId: string;
  eventType: string;
  handler: string;
  filter?: Record<string, unknown>;
  createdAt: string;
  active: boolean;
}

// ============================================
// MEMORY TYPES
// ============================================

export interface Memory {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'fact' | 'preference' | 'context' | 'interaction';
  content: string;
  embedding?: number[];
  importance: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
}

// ============================================
// WORKFLOW TYPES
// ============================================

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  config: Record<string, unknown>;
  status: 'active' | 'inactive' | 'training';
  createdAt: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  tenantId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}
