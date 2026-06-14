/**
 * Workflow Builder Tests
 * Tests for workflow execution, node types, and state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'filter' | 'end';
  config: Record<string, unknown>;
  next?: string[];
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNode?: string;
  context: Record<string, unknown>;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  status: 'enter' | 'exit' | 'error';
  message: string;
}

// Node validation
function validateNode(node: Partial<WorkflowNode>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!node.id) errors.push('id is required');
  if (!node.type) errors.push('type is required');

  const validTypes = ['trigger', 'action', 'condition', 'delay', 'filter', 'end'];
  if (node.type && !validTypes.includes(node.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

// Workflow validation
function validateWorkflow(nodes: WorkflowNode[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have at least one trigger
  const triggers = nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) errors.push('workflow must have at least one trigger');

  if (triggers.length > 1) errors.push('workflow cannot have more than one trigger');

  // Must have at least one end node
  const ends = nodes.filter(n => n.type === 'end');
  if (ends.length === 0) errors.push('workflow must have at least one end node');

  return { valid: errors.length === 0, errors };
}

// Find next nodes
function findNextNodes(nodeId: string, edges: WorkflowEdge[]): string[] {
  return edges.filter(e => e.source === nodeId).map(e => e.target);
}

// Condition evaluation
function evaluateCondition(
  condition: { field: string; operator: string; value: unknown },
  context: Record<string, unknown>
): boolean {
  const fieldValue = context[condition.field];

  switch (condition.operator) {
    case 'eq': return fieldValue === condition.value;
    case 'neq': return fieldValue !== condition.value;
    case 'gt': return fieldValue > condition.value;
    case 'gte': return fieldValue >= condition.value;
    case 'lt': return fieldValue < condition.value;
    case 'lte': return fieldValue <= condition.value;
    case 'contains': return String(fieldValue).includes(String(condition.value));
    case 'startsWith': return String(fieldValue).startsWith(String(condition.value));
    default: return false;
  }
}

// Execution simulation
function executeWorkflow(
  workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
  initialContext: Record<string, unknown>
): WorkflowExecution {
  const execution: WorkflowExecution = {
    id: `exec_${Date.now()}`,
    workflowId: 'workflow_1',
    status: 'running',
    context: { ...initialContext },
    logs: [],
  };

  const triggers = workflow.nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    execution.status = 'failed';
    return execution;
  }

  let currentNodeId = triggers[0].id;

  while (currentNodeId) {
    const node = workflow.nodes.find(n => n.id === currentNodeId);
    if (!node) break;

    execution.currentNode = currentNodeId;
    execution.logs.push({
      timestamp: new Date(),
      nodeId: currentNodeId,
      status: 'enter',
      message: `Executing ${node.type} node`,
    });

    if (node.type === 'condition') {
      const condition = node.config.condition as { field: string; operator: string; value: unknown };
      const result = evaluateCondition(condition, execution.context);
      const nextNodes = findNextNodes(currentNodeId, workflow.edges);
      currentNodeId = result ? nextNodes[0] : nextNodes[1];
    } else if (node.type === 'end') {
      execution.status = 'completed';
      break;
    } else {
      const nextNodes = findNextNodes(currentNodeId, workflow.edges);
      currentNodeId = nextNodes[0];
    }

    execution.logs.push({
      timestamp: new Date(),
      nodeId: currentNodeId || 'end',
      status: 'exit',
      message: `Completed ${node.type} node`,
    });
  }

  return execution;
}

describe('Node Validation', () => {
  it('should validate trigger node', () => {
    const node: Partial<WorkflowNode> = {
      id: 'trigger_1',
      type: 'trigger',
      config: { event: 'order.created' },
    };
    const result = validateNode(node);
    expect(result.valid).toBe(true);
  });

  it('should validate action node', () => {
    const node: Partial<WorkflowNode> = {
      id: 'action_1',
      type: 'action',
      config: { action: 'send_email' },
    };
    const result = validateNode(node);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid type', () => {
    const node: Partial<WorkflowNode> = {
      id: 'node_1',
      type: 'invalid',
    };
    const result = validateNode(node);
    expect(result.valid).toBe(false);
  });

  it('should reject missing id', () => {
    const node: Partial<WorkflowNode> = {
      type: 'action',
    };
    const result = validateNode(node);
    expect(result.valid).toBe(false);
  });
});

describe('Workflow Validation', () => {
  it('should validate complete workflow', () => {
    const nodes: WorkflowNode[] = [
      { id: 'trigger_1', type: 'trigger', config: {} },
      { id: 'action_1', type: 'action', config: {} },
      { id: 'end_1', type: 'end', config: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(true);
  });

  it('should reject workflow without trigger', () => {
    const nodes: WorkflowNode[] = [
      { id: 'action_1', type: 'action', config: {} },
      { id: 'end_1', type: 'end', config: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('workflow must have at least one trigger');
  });

  it('should reject workflow without end', () => {
    const nodes: WorkflowNode[] = [
      { id: 'trigger_1', type: 'trigger', config: {} },
      { id: 'action_1', type: 'action', config: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('workflow must have at least one end node');
  });
});

describe('Edge Navigation', () => {
  const edges: WorkflowEdge[] = [
    { id: 'e1', source: 'trigger_1', target: 'action_1' },
    { id: 'e2', source: 'trigger_1', target: 'action_2' },
    { id: 'e3', source: 'action_1', target: 'end_1' },
  ];

  it('should find next nodes', () => {
    const next = findNextNodes('trigger_1', edges);
    expect(next).toContain('action_1');
    expect(next).toContain('action_2');
  });

  it('should return empty for terminal node', () => {
    const next = findNextNodes('end_1', edges);
    expect(next).toHaveLength(0);
  });
});

describe('Condition Evaluation', () => {
  it('should evaluate equals', () => {
    const condition = { field: 'status', operator: 'eq', value: 'active' };
    expect(evaluateCondition(condition, { status: 'active' })).toBe(true);
    expect(evaluateCondition(condition, { status: 'inactive' })).toBe(false);
  });

  it('should evaluate greater than', () => {
    const condition = { field: 'amount', operator: 'gt', value: 100 };
    expect(evaluateCondition(condition, { amount: 150 })).toBe(true);
    expect(evaluateCondition(condition, { amount: 50 })).toBe(false);
  });

  it('should evaluate contains', () => {
    const condition = { field: 'email', operator: 'contains', value: '@gmail' };
    expect(evaluateCondition(condition, { email: 'user@gmail.com' })).toBe(true);
    expect(evaluateCondition(condition, { email: 'user@yahoo.com' })).toBe(false);
  });
});

describe('Workflow Execution', () => {
  const workflow = {
    nodes: [
      { id: 'trigger_1', type: 'trigger' as const, config: {} },
      {
        id: 'condition_1',
        type: 'condition' as const,
        config: {
          condition: { field: 'status', operator: 'eq', value: 'active' }
        }
      },
      { id: 'action_1', type: 'action' as const, config: {} },
      { id: 'action_2', type: 'action' as const, config: {} },
      { id: 'end_1', type: 'end' as const, config: {} },
    ],
    edges: [
      { id: 'e1', source: 'trigger_1', target: 'condition_1' },
      { id: 'e2', source: 'condition_1', target: 'action_1' },
      { id: 'e3', source: 'condition_1', target: 'action_2' },
      { id: 'e4', source: 'action_1', target: 'end_1' },
      { id: 'e5', source: 'action_2', target: 'end_1' },
    ],
  };

  it('should execute workflow with matching condition', () => {
    const result = executeWorkflow(workflow, { status: 'active' });
    expect(result.status).toBe('completed');
    expect(result.logs.length).toBeGreaterThan(0);
  });

  it('should execute workflow with non-matching condition', () => {
    const result = executeWorkflow(workflow, { status: 'inactive' });
    expect(result.status).toBe('completed');
  });
});

describe('Delay Node', () => {
  function calculateDelay(node: WorkflowNode): number {
    const delay = node.config.delayMs as number || 0;
    const unit = node.config.unit as string || 'ms';

    switch (unit) {
      case 's': return delay * 1000;
      case 'm': return delay * 60 * 1000;
      case 'h': return delay * 60 * 60 * 1000;
      default: return delay;
    }
  }

  it('should calculate delay in milliseconds', () => {
    const node: WorkflowNode = {
      id: 'delay_1',
      type: 'delay',
      config: { delayMs: 5000, unit: 'ms' },
    };
    expect(calculateDelay(node)).toBe(5000);
  });

  it('should calculate delay in seconds', () => {
    const node: WorkflowNode = {
      id: 'delay_1',
      type: 'delay',
      config: { delayMs: 30, unit: 's' },
    };
    expect(calculateDelay(node)).toBe(30000);
  });
});

describe('Filter Node', () => {
  function applyFilter(
    data: Record<string, unknown>[],
    filters: { field: string; operator: string; value: unknown }[]
  ): Record<string, unknown>[] {
    return data.filter(item => {
      return filters.every(filter => evaluateCondition(filter, item));
    });
  }

  it('should filter array of objects', () => {
    const data = [
      { id: 1, status: 'active', amount: 100 },
      { id: 2, status: 'inactive', amount: 200 },
      { id: 3, status: 'active', amount: 300 },
    ];

    const filtered = applyFilter(data, [
      { field: 'status', operator: 'eq', value: 'active' },
    ]);

    expect(filtered).toHaveLength(2);
    expect(filtered.every(d => d.status === 'active')).toBe(true);
  });
});
