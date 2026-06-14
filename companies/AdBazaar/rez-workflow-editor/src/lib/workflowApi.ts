import {
  Workflow,
  WorkflowListResponse,
  ApiResponse,
  DeployResponse,
  WorkflowVersion,
  WorkflowStats,
} from '@/types/workflow';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class WorkflowApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'WorkflowApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new WorkflowApiError(
      error.message || `HTTP ${response.status}`,
      response.status,
      error.code
    );
  }
  return response.json();
}

// Workflow CRUD operations
export async function fetchWorkflows(
  page = 1,
  pageSize = 20
): Promise<WorkflowListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/workflows?page=${page}&pageSize=${pageSize}`
  );
  return handleResponse<WorkflowListResponse>(response);
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`);
  return handleResponse<Workflow>(response);
}

export async function createWorkflow(
  workflow: Omit<Workflow, 'id'>
): Promise<ApiResponse<Workflow>> {
  const response = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  return handleResponse<ApiResponse<Workflow>>(response);
}

export async function updateWorkflow(
  id: string,
  workflow: Partial<Workflow>
): Promise<ApiResponse<Workflow>> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  return handleResponse<ApiResponse<Workflow>>(response);
}

export async function deleteWorkflow(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<ApiResponse<{ deleted: boolean }>>(response);
}

// Deploy workflow
export async function deployWorkflow(
  id: string
): Promise<ApiResponse<DeployResponse>> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}/deploy`, {
    method: 'POST',
  });
  return handleResponse<ApiResponse<DeployResponse>>(response);
}

export async function pauseWorkflow(
  id: string
): Promise<ApiResponse<{ paused: boolean }>> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}/pause`, {
    method: 'POST',
  });
  return handleResponse<ApiResponse<{ paused: boolean }>>(response);
}

export async function resumeWorkflow(
  id: string
): Promise<ApiResponse<{ resumed: boolean }>> {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}/resume`, {
    method: 'POST',
  });
  return handleResponse<ApiResponse<{ resumed: boolean }>>(response);
}

// Version history
export async function fetchWorkflowVersions(
  workflowId: string
): Promise<ApiResponse<WorkflowVersion[]>> {
  const response = await fetch(
    `${API_BASE_URL}/workflows/${workflowId}/versions`
  );
  return handleResponse<ApiResponse<WorkflowVersion[]>>(response);
}

export async function restoreWorkflowVersion(
  workflowId: string,
  versionId: string
): Promise<ApiResponse<Workflow>> {
  const response = await fetch(
    `${API_BASE_URL}/workflows/${workflowId}/versions/${versionId}/restore`,
    { method: 'POST' }
  );
  return handleResponse<ApiResponse<Workflow>>(response);
}

// Analytics
export async function fetchWorkflowStats(
  id: string
): Promise<ApiResponse<WorkflowStats>> {
  const response = await fetch(
    `${API_BASE_URL}/workflows/${id}/stats`
  );
  return handleResponse<ApiResponse<WorkflowStats>>(response);
}

// Export/Import
export async function exportWorkflow(id: string): Promise<string> {
  const workflow = await fetchWorkflow(id);
  return JSON.stringify(workflow, null, 2);
}

export async function importWorkflow(
  jsonString: string
): Promise<ApiResponse<Workflow>> {
  try {
    const workflow = JSON.parse(jsonString) as Workflow;
    // Generate new ID to avoid conflicts
    const { v4: uuidv4 } = await import('uuid');
    const importedWorkflow: Workflow = {
      ...workflow,
      id: uuidv4(),
      metadata: {
        ...workflow.metadata,
        name: `${workflow.metadata.name} (Imported)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      },
    };
    return createWorkflow(importedWorkflow);
  } catch (error) {
    throw new WorkflowApiError(
      'Invalid workflow JSON',
      400,
      'INVALID_JSON'
    );
  }
}

// Validate workflow before save/deploy
export async function validateWorkflow(
  workflow: Workflow
): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> {
  const response = await fetch(`${API_BASE_URL}/workflows/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  return handleResponse<ApiResponse<{ valid: boolean; errors: string[] }>>(response);
}

// Duplicate workflow
export async function duplicateWorkflow(
  id: string
): Promise<ApiResponse<Workflow>> {
  const original = await fetchWorkflow(id);
  const { v4: uuidv4 } = await import('uuid');
  const duplicated: Workflow = {
    ...original,
    id: uuidv4(),
    metadata: {
      ...original.metadata,
      name: `${original.metadata.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    },
  };
  return createWorkflow(duplicated);
}

// Integration with external services

// REZ-trigger-service integration
export async function subscribeToTrigger(
  workflowId: string,
  triggerType: string
): Promise<ApiResponse<{ subscriptionId: string }>> {
  const response = await fetch(`${API_BASE_URL}/triggers/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowId, triggerType }),
  });
  return handleResponse<ApiResponse<{ subscriptionId: string }>>(response);
}

export async function unsubscribeFromTrigger(
  subscriptionId: string
): Promise<ApiResponse<{ unsubscribed: boolean }>> {
  const response = await fetch(
    `${API_BASE_URL}/triggers/unsubscribe/${subscriptionId}`,
    { method: 'DELETE' }
  );
  return handleResponse<ApiResponse<{ unsubscribed: boolean }>>(response);
}

// REZ-action-engine integration
export async function testAction(
  actionType: string,
  config: Record<string, unknown>
): Promise<ApiResponse<{ success: boolean; output?: unknown }>> {
  const response = await fetch(`${API_BASE_URL}/actions/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, config }),
  });
  return handleResponse<ApiResponse<{ success: boolean; output?: unknown }>>(response);
}

// Utility function for polling
export async function pollUntilComplete<T>(
  checkFn: () => Promise<T>,
  isComplete: (result: T) => boolean,
  maxAttempts = 30,
  interval = 1000
): Promise<T> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const result = await checkFn();
    if (isComplete(result)) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }
  throw new Error('Polling timed out');
}