import { v4 as uuid } from 'uuid';
import { WorkflowExecution, ExecutionNode, ExecutionEdge, ExecutionResult, WorkflowDefinition, ExecutionEvent, ExecutionStats } from '../models/execution';
import logger from '../utils/logger';

// In-memory storage
const executions: Map<string, WorkflowExecution> = new Map();
const workflows: Map<string, WorkflowDefinition> = new Map();
const events: Map<string, ExecutionEvent[]> = new Map();
const runningExecutions: Set<string> = new Set();

// Node executors registry
const nodeExecutors: Map<string, (config: Record<string, any>, context: Record<string, any>) => Promise<any>> = new Map();

// Register default executors
registerNodeExecutor('trigger', async (config, context) => {
  return { triggered: true, event: config.event || 'manual' };
});

registerNodeExecutor('action', async (config, context) => {
  logger.info(`Executing action: ${config.label || 'unnamed'}`);
  return { actionExecuted: true, result: 'success' };
});

registerNodeExecutor('delay', async (config, context) => {
  const waitMs = config.wait || 1000;
  await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 1000))); // Cap at 1s for simulation
  return { delayed: true, waitMs };
});

registerNodeExecutor('condition', async (config, context) => {
  const { field, value, operator } = config;
  const fieldValue = context.variables?.[field];
  let result = false;

  switch (operator) {
    case '==': result = fieldValue == value; break;
    case '!=': result = fieldValue != value; break;
    case '>': result = fieldValue > value; break;
    case '<': result = fieldValue < value; break;
    case '>=': result = fieldValue >= value; break;
    case '<=': result = fieldValue <= value; break;
    default: result = fieldValue == value;
  }

  return { conditionMet: result, branch: result ? 'yes' : 'no' };
});

registerNodeExecutor('ai_agent', async (config, context) => {
  return { agentExecuted: true, agent: config.agent || 'default' };
});

registerNodeExecutor('approval', async (config, context) => {
  return { approvalRequired: true, approvalId: `apr_${uuid()}` };
});

export function registerNodeExecutor(type: string, executor: (config: Record<string, any>, context: Record<string, any>) => Promise<any>) {
  nodeExecutors.set(type, executor);
}

export const createWorkflow = (definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): WorkflowDefinition => {
  const workflow: WorkflowDefinition = {
    ...definition,
    id: `wf_${uuid()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.set(workflow.id, workflow);
  logger.info(`Workflow created: ${workflow.id}`);
  return workflow;
};

export const getWorkflow = (id: string): WorkflowDefinition | undefined => {
  return workflows.get(id);
};

export const getWorkflows = (): WorkflowDefinition[] => {
  return Array.from(workflows.values());
};

export const createExecution = async (
  workflowId: string,
  name: string,
  initialContext: Record<string, any> = {}
): Promise<WorkflowExecution | null> => {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    logger.error(`Workflow not found: ${workflowId}`);
    return null;
  }

  const execution: WorkflowExecution = {
    id: `exec_${uuid()}`,
    workflowId,
    name,
    status: 'pending',
    nodes: workflow.nodes.map(n => ({
      id: n.id,
      type: n.type as any,
      name: n.data?.label || n.type,
      config: n.data?.config || {},
      status: 'pending' as const,
      input: {},
      output: {},
      position: n.position,
      data: n.data,
    })),
    edges: workflow.edges,
    context: { ...initialContext },
    variables: {},
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
  };

  executions.set(execution.id, execution);
  emitEvent(execution.id, 'started', 'Execution started');

  logger.info(`Execution created: ${execution.id} for workflow ${workflowId}`);

  // Start execution asynchronously
  executeWorkflow(execution.id);

  return execution;
};

export const executeWorkflow = async (executionId: string): Promise<ExecutionResult | null> => {
  const execution = executions.get(executionId);
  if (!execution) return null;

  if (runningExecutions.has(executionId)) {
    logger.warn(`Execution ${executionId} already running`);
    return null;
  }

  runningExecutions.add(executionId);
  execution.status = 'running';
  execution.startedAt = new Date().toISOString();

  logger.info(`Starting execution: ${executionId}`);

  try {
    // Find trigger node
    const triggerNode = execution.nodes.find(n => n.type === 'trigger');
    if (triggerNode) {
      await executeNode(execution, triggerNode.id);
    }

    // Execute remaining nodes in order (simplified - in production use topological sort)
    const completedIds = new Set<string>();
    const triggerOutput = execution.nodes.find(n => n.type === 'trigger')?.output;
    if (triggerOutput) {
      execution.context = { ...execution.context, ...triggerOutput };
    }

    // BFS execution
    let progress = true;
    while (progress) {
      progress = false;
      for (const edge of execution.edges) {
        if (completedIds.has(edge.source) && !completedIds.has(edge.target)) {
          const targetNode = execution.nodes.find(n => n.id === edge.target);
          if (targetNode && targetNode.status !== 'completed') {
            // Check condition if edge has one
            if (!edge.condition || shouldTakeEdge(execution, edge)) {
              await executeNode(execution, targetNode.id);
              completedIds.add(edge.target);
              progress = true;
            }
          }
        }
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt!).getTime();

    emitEvent(executionId, 'completed', 'Execution completed successfully');
    logger.info(`Execution ${executionId} completed in ${execution.duration}ms`);

    return {
      execution,
      completedNodes: execution.nodes.filter(n => n.status === 'completed').length,
      totalNodes: execution.nodes.length,
      success: true,
      output: execution.context,
    };
  } catch (error: any) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
    if (execution.startedAt) {
      execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
    }

    emitEvent(executionId, 'failed', `Execution failed: ${error.message}`);
    logger.error(`Execution ${executionId} failed:`, error);

    return {
      execution,
      completedNodes: execution.nodes.filter(n => n.status === 'completed').length,
      totalNodes: execution.nodes.length,
      success: false,
    };
  } finally {
    runningExecutions.delete(executionId);
  }
};

async function executeNode(execution: WorkflowExecution, nodeId: string): Promise<void> {
  const node = execution.nodes.find(n => n.id === nodeId);
  if (!node) return;

  node.status = 'running';
  node.startedAt = new Date().toISOString();

  emitEvent(execution.id, 'node_started', `Node ${node.name} started`, nodeId);

  try {
    const executor = nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor registered for node type: ${node.type}`);
    }

    const config = node.data?.config || {};
    node.output = await executor(config, { variables: execution.variables, context: execution.context });
    node.status = 'completed';
    node.completedAt = new Date().toISOString();
    node.duration = new Date(node.completedAt).getTime() - new Date(node.startedAt).getTime();

    // Update context with node output
    execution.context[nodeId] = node.output;
    execution.variables[node.name] = node.output;

    emitEvent(execution.id, 'node_completed', `Node ${node.name} completed`, nodeId);
  } catch (error: any) {
    node.status = 'failed';
    node.error = error.message;
    node.completedAt = new Date().toISOString();
    if (node.startedAt) {
      node.duration = new Date(node.completedAt).getTime() - new Date(node.startedAt).getTime();
    }

    emitEvent(execution.id, 'node_failed', `Node ${node.name} failed: ${error.message}`, nodeId);
    throw error;
  }
}

function shouldTakeEdge(execution: WorkflowExecution, edge: ExecutionEdge): boolean {
  const sourceNode = execution.nodes.find(n => n.id === edge.source);
  if (!sourceNode || !sourceNode.output) return true;

  if (edge.label?.toLowerCase() === 'yes' && sourceNode.output.conditionMet) return true;
  if (edge.label?.toLowerCase() === 'no' && !sourceNode.output.conditionMet) return true;
  if (edge.label === 'Yes' && sourceNode.output.branch === 'yes') return true;
  if (edge.label === 'No' && sourceNode.output.branch === 'no') return true;

  return !edge.label; // No label = always take
}

function emitEvent(executionId: string, type: ExecutionEvent['type'], message: string, nodeId?: string) {
  const event: ExecutionEvent = {
    id: `evt_${uuid()}`,
    executionId,
    nodeId,
    type,
    message,
    timestamp: new Date().toISOString(),
  };

  if (!events.has(executionId)) {
    events.set(executionId, []);
  }
  events.get(executionId)!.push(event);
}

export const getExecution = (id: string): WorkflowExecution | undefined => {
  return executions.get(id);
};

export const getExecutionsByWorkflow = (workflowId: string): WorkflowExecution[] => {
  return Array.from(executions.values()).filter(e => e.workflowId === workflowId);
};

export const getExecutionEvents = (executionId: string): ExecutionEvent[] => {
  return events.get(executionId) || [];
};

export const cancelExecution = (id: string): WorkflowExecution | undefined => {
  const execution = executions.get(id);
  if (!execution) return undefined;

  execution.status = 'cancelled';
  execution.completedAt = new Date().toISOString();

  if (execution.startedAt) {
    execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
  }

  emitEvent(id, 'paused', 'Execution cancelled');
  return execution;
};

export const getExecutionStats = (): ExecutionStats => {
  const all = Array.from(executions.values());
  const completed = all.filter(e => e.status === 'completed');
  const failed = all.filter(e => e.status === 'failed');

  const totalDuration = completed.reduce((sum, e) => sum + (e.duration || 0), 0);

  return {
    total: all.length,
    running: all.filter(e => e.status === 'running').length,
    completed: completed.length,
    failed: failed.length,
    avgDuration: completed.length > 0 ? totalDuration / completed.length : 0,
    successRate: all.length > 0 ? (completed.length / all.length) * 100 : 0,
  };
};
