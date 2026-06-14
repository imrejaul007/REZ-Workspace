/**
 * Workflow Service for PeopleOS
 * Connects to Workflow Service at port 4731
 */

// API Base URL
const WORKFLOW_API = process.env.WORKFLOW_SERVICE_URL || 'http://localhost:4731';
const REQUEST_TIMEOUT = 10000;

// ─── Types ─────────────────────────────────────────────────────────────────────────

export type WorkflowAction = 'approve' | 'reject' | 'notify' | 'complete';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type InstanceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';

export interface WorkflowStep {
  _id: string;
  name: string;
  order: number;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  action: WorkflowAction;
  actionLabel?: string;
  instructions?: string;
  timeout?: number;
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify';
  condition?: {
    field: string;
    operator: string;
    value: unknown;
  };
}

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  version: number;
  status: WorkflowStatus;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  steps: WorkflowStep[];
  conditions?: Condition[];
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StepHistory {
  stepId: string;
  stepName: string;
  action: WorkflowAction;
  actionBy?: string;
  actionByName?: string;
  actionAt?: string;
  comments?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  previousValue?: unknown;
  newValue?: unknown;
}

export interface WorkflowInstance {
  _id: string;
  workflowId: string;
  workflowName?: string;
  workflowVersion: number;
  initiatorId: string;
  initiatorName?: string;
  currentStepIndex: number;
  status: InstanceStatus;
  data: Record<string, unknown>;
  stepHistory: StepHistory[];
  approverComments?: Record<string, string>;
  escalatedTo?: string;
  dueDate?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  currentStepDetails?: WorkflowStep;
}

export interface WorkflowStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  approvalRate: number;
  avgCompletionTimeMinutes: number;
  recentInstances: WorkflowInstance[];
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  category: string;
  type: string;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  status?: WorkflowStatus;
  steps: Array<{
    name: string;
    approverId?: string;
    approverName?: string;
    approverEmail?: string;
    action: WorkflowAction;
    actionLabel?: string;
    instructions?: string;
    timeout?: number;
    timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify';
    condition?: {
      field: string;
      operator: string;
      value: unknown;
    };
  }>;
  conditions?: Condition[];
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface InitiateWorkflowInput {
  workflowId: string;
  initiatorId: string;
  initiatorName?: string;
  data?: Record<string, unknown>;
  dueDate?: string;
}

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────────

/**
 * List Workflow Templates
 */
export async function listWorkflows(params?: {
  ownerId?: string;
  departmentId?: string;
  category?: string;
  type?: string;
  status?: WorkflowStatus;
  page?: number;
  limit?: number;
}): Promise<{ workflows: Workflow[]; total: number; page: number; pages: number } | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params?.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows${query ? `?${query}` : ''}`, {
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] listWorkflows failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return {
      workflows: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.pages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] listWorkflows failed:', message);
    return null;
  }
}

/**
 * Get single workflow template
 */
export async function getWorkflow(id: string): Promise<Workflow | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/${id}`, {
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] getWorkflow failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] getWorkflow failed:', message);
    return null;
  }
}

/**
 * Create Workflow Template
 */
export async function createWorkflow(data: CreateWorkflowInput): Promise<Workflow | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[Workflow] createWorkflow failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] createWorkflow failed:', message);
    return null;
  }
}

/**
 * Update Workflow Template
 */
export async function updateWorkflow(
  id: string,
  data: Partial<CreateWorkflowInput>
): Promise<Workflow | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[Workflow] updateWorkflow failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] updateWorkflow failed:', message);
    return null;
  }
}

/**
 * Delete Workflow Template
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] deleteWorkflow failed: HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] deleteWorkflow failed:', message);
    return false;
  }
}

/**
 * Initiate Workflow Instance
 */
export async function initiateWorkflow(data: InitiateWorkflowInput): Promise<WorkflowInstance | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/${data.workflowId}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[Workflow] initiateWorkflow failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] initiateWorkflow failed:', message);
    return null;
  }
}

/**
 * List Workflow Instances
 */
export async function listInstances(params?: {
  workflowId?: string;
  initiatorId?: string;
  status?: InstanceStatus;
  page?: number;
  limit?: number;
}): Promise<{ instances: WorkflowInstance[]; total: number; page: number; pages: number } | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.workflowId) searchParams.set('workflowId', params.workflowId);
    if (params?.initiatorId) searchParams.set('initiatorId', params.initiatorId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/instances${query ? `?${query}` : ''}`, {
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] listInstances failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return {
      instances: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.pages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] listInstances failed:', message);
    return null;
  }
}

/**
 * Get Workflow Instance
 */
export async function getInstance(id: string): Promise<WorkflowInstance | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/instances/${id}`, {
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] getInstance failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] getInstance failed:', message);
    return null;
  }
}

/**
 * Approve Workflow Instance
 */
export async function approveInstance(
  id: string,
  data?: { stepIndex?: number; comments?: string }
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/instances/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      logger.error(`[Workflow] approveInstance failed: HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] approveInstance failed:', message);
    return false;
  }
}

/**
 * Reject Workflow Instance
 */
export async function rejectInstance(id: string, reason: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/instances/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      logger.error(`[Workflow] rejectInstance failed: HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] rejectInstance failed:', message);
    return false;
  }
}

/**
 * Cancel Workflow Instance
 */
export async function cancelInstance(id: string, reason: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/instances/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      logger.error(`[Workflow] cancelInstance failed: HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] cancelInstance failed:', message);
    return false;
  }
}

/**
 * Get Pending Approvals for User
 */
export async function getPendingApprovals(
  userId: string,
  params?: { status?: InstanceStatus; page?: number; limit?: number }
): Promise<{ instances: WorkflowInstance[]; count: number } | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(
      `${WORKFLOW_API}/api/workflows/pending/${userId}${query ? `?${query}` : ''}`,
      {
        headers: {
          'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      logger.error(`[Workflow] getPendingApprovals failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return {
      instances: result.data,
      count: result.count,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] getPendingApprovals failed:', message);
    return null;
  }
}

/**
 * Get Workflow Statistics
 */
export async function getWorkflowStats(workflowId?: string): Promise<WorkflowStats | null> {
  try {
    const searchParams = new URLSearchParams();
    if (workflowId) searchParams.set('workflowId', workflowId);

    const query = searchParams.toString();
    const response = await fetchWithTimeout(
      `${WORKFLOW_API}/api/workflows/instances/stats${query ? `?${query}` : ''}`,
      {
        headers: {
          'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      logger.error(`[Workflow] getStats failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] getStats failed:', message);
    return null;
  }
}

/**
 * Get Workflow Categories
 */
export async function getWorkflowCategories(): Promise<{
  categories: Array<{ name: string; count: number }>;
  types: Array<{ name: string; count: number }>;
} | null> {
  try {
    const response = await fetchWithTimeout(`${WORKFLOW_API}/api/workflows/categories`, {
      headers: {
        'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[Workflow] getCategories failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Workflow] getCategories failed:', message);
    return null;
  }
}
