/**
 * REZ Workflow Builder Client - Use existing service (port 4045)
 * Journey/automation for all services
 */

import { logger } from './config/logger';

const WORKFLOW_URL = process.env.WORKFLOW_BUILDER_URL || 'http://localhost:4045';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual';
  event?: string;
  schedule?: string;
}

interface WorkflowStep {
  type: 'delay' | 'email' | 'sms' | 'push' | 'whatsapp' | 'condition' | 'webhook';
  config: Record<string, unknown>;
  next?: string[];
}

interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enabled: boolean;
}

/**
 * Trigger workflow for user
 */
export async function triggerWorkflow(
  workflowId: string,
  userId: string,
  data?: Record<string, unknown>
): Promise<void> {
  await fetch(`${WORKFLOW_URL}/api/workflows/${workflowId}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN,
    },
    body: JSON.stringify({ userId, data }),
  });
}

/**
 * Trigger workflow by name
 */
export async function triggerWorkflowByName(
  workflowName: string,
  userId: string,
  data?: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${WORKFLOW_URL}/api/workflows/by-name/${encodeURIComponent(workflowName)}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN,
    },
    body: JSON.stringify({ userId, data }),
  });

  if (!response.ok) {
    logger.error('Workflow trigger failed:', await response.text());
  }
}

/**
 * Create one-time workflow run
 */
export async function createRun(
  workflowId: string,
  userId: string,
  inputs: Record<string, unknown>
): Promise<string | null> {
  const response = await fetch(`${WORKFLOW_URL}/api/workflows/${workflowId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN,
    },
    body: JSON.stringify({ userId, inputs }),
  });

  if (!response.ok) return null;
  const run = await response.json();
  return run.id;
}

/**
 * Get workflow run status
 */
export async function getRunStatus(runId: string): Promise<{
  status: string;
  step: string;
  output?: unknown;
} | null> {
  const response = await fetch(`${WORKFLOW_URL}/api/runs/${runId}`, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  });

  if (!response.ok) return null;
  return response.json();
}
