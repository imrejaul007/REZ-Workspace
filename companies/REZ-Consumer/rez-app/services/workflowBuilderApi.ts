/**
 * WORKFLOW BUILDER API SERVICE
 * Integration with RABTUL Workflow Builder Service
 *
 * Service: REZ-workflow-builder
 * Port: 4045
 * URL: https://rez-workflow-builder.onrender.com
 *
 * Features:
 * - Visual workflow builder
 * - Journey automation
 * - Trigger-based actions
 * - Workflow execution & monitoring
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type WorkflowTriggerType = 'user_action' | 'schedule' | 'event' | 'webhook' | 'date_condition' | 'segment_change';
export type WorkflowActionType = 'send_notification' | 'send_email' | 'send_sms' | 'send_whatsapp' | 'update_segment' | 'add_tag' | 'remove_tag' | 'delay' | 'condition' | 'http_request' | 'update_attribute';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  stats?: WorkflowStats;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end';
  action?: WorkflowActionType;
  config: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  nextStepId?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
  nextStepId?: string;
}

export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  lastRunAt?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface Journey {
  id: string;
  name: string;
  workflowId: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  enrolledUsers: number;
  convertedUsers: number;
  conversionRate: number;
}

// ============================================================================
// WORKFLOW CRUD
// ============================================================================

/**
 * Get all workflows
 */
export async function getWorkflows(params?: { status?: WorkflowStatus; page?: number }): Promise<ApiResponse<{ workflows: Workflow[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/workflows${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('workflowBuilderApi.getWorkflows', { error });
    throw error;
  }
}

/**
 * Get workflow by ID
 */
export async function getWorkflowById(workflowId: string): Promise<ApiResponse<Workflow>> {
  try {
    return await apiClient.get(`/workflows/${workflowId}`);
  } catch (error) {
    logger.error('workflowBuilderApi.getWorkflow', { workflowId, error });
    throw error;
  }
}

/**
 * Create workflow
 */
export async function createWorkflow(workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
  try {
    return await apiClient.post('/workflows', workflow);
  } catch (error) {
    logger.error('workflowBuilderApi.createWorkflow', { error });
    throw error;
  }
}

/**
 * Update workflow
 */
export async function updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
  try {
    return await apiClient.patch(`/workflows/${workflowId}`, updates);
  } catch (error) {
    logger.error('workflowBuilderApi.updateWorkflow', { workflowId, error });
    throw error;
  }
}

/**
 * Activate workflow
 */
export async function activateWorkflow(workflowId: string): Promise<ApiResponse<Workflow>> {
  try {
    return await apiClient.post(`/workflows/${workflowId}/activate`, {});
  } catch (error) {
    logger.error('workflowBuilderApi.activateWorkflow', { workflowId, error });
    throw error;
  }
}

/**
 * Pause workflow
 */
export async function pauseWorkflow(workflowId: string): Promise<ApiResponse<Workflow>> {
  try {
    return await apiClient.post(`/workflows/${workflowId}/pause`, {});
  } catch (error) {
    logger.error('workflowBuilderApi.pauseWorkflow', { workflowId, error });
    throw error;
  }
}

/**
 * Trigger workflow manually
 */
export async function triggerWorkflow(workflowId: string, userId: string): Promise<ApiResponse<WorkflowExecution>> {
  try {
    return await apiClient.post(`/workflows/${workflowId}/trigger`, { userId });
  } catch (error) {
    logger.error('workflowBuilderApi.triggerWorkflow', { workflowId, userId, error });
    throw error;
  }
}

/**
 * Get workflow executions
 */
export async function getWorkflowExecutions(workflowId: string, params?: { page?: number }): Promise<ApiResponse<{ executions: WorkflowExecution[]; pagination: unknown }>> {
  try {
    const query = params?.page ? `?page=${params.page}` : '';
    return await apiClient.get(`/workflows/${workflowId}/executions${query}`);
  } catch (error) {
    logger.error('workflowBuilderApi.getExecutions', { workflowId, error });
    throw error;
  }
}

/**
 * Get journeys
 */
export async function getJourneys(params?: { status?: string; page?: number }): Promise<ApiResponse<{ journeys: Journey[]; pagination: unknown }>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    return await apiClient.get(`/journeys${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('workflowBuilderApi.getJourneys', { error });
    throw error;
  }
}

/**
 * Enroll user in journey
 */
export async function enrollInJourney(journeyId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/journeys/${journeyId}/enroll`, { userId });
  } catch (error) {
    logger.error('workflowBuilderApi.enrollInJourney', { journeyId, userId, error });
    throw error;
  }
}

export default {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  activateWorkflow,
  pauseWorkflow,
  triggerWorkflow,
  getWorkflowExecutions,
  getJourneys,
  enrollInJourney,
};
