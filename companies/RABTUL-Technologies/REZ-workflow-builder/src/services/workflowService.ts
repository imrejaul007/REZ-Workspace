/**
 * Workflow Service
 */

import { Workflow, WorkflowExecution, WorkflowNode } from '../models/workflow';

export interface WorkflowService {
  createWorkflow(data: Partial<Workflow>): Workflow;
  getWorkflow(id: string): Workflow | null;
  updateWorkflow(id: string, data: Partial<Workflow>): Workflow | null;
  deleteWorkflow(id: string): boolean;
  publishWorkflow(id: string): Workflow | null;
  executeWorkflow(id: string, trigger: WorkflowExecution['trigger']): WorkflowExecution;
}

export function validateWorkflow(workflow: Partial<Workflow>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (workflow.name && workflow.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateNode(node: Partial<WorkflowNode>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!node.type) {
    errors.push('Node type is required');
  }

  const validTypes = ['trigger', 'action', 'condition', 'delay', 'filter'];
  if (node.type && !validTypes.includes(node.type)) {
    errors.push(`Node type must be one of: ${validTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function findTriggerNode(workflow: Workflow): WorkflowNode | null {
  return workflow.nodes.find(n => n.type === 'trigger') || null;
}

export function getNextNodes(workflow: Workflow, nodeId: string): WorkflowNode[] {
  const edges = workflow.edges.filter(e => e.source === nodeId);
  return edges.map(e => workflow.nodes.find(n => n.id === e.target)).filter(Boolean) as WorkflowNode[];
}
