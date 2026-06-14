import { logger } from '../utils/logger';
import { Workflow, Execution, WorkflowNode, NodeExecution } from '../types';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, Execution> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  start() {
    logger.info('Workflow Engine started');
    this.loadActiveWorkflows();
    this.startScheduledTriggers();
  }

  private async loadActiveWorkflows() {
    // Load workflows with scheduled triggers
    for (const workflow of this.workflows.values()) {
      if (workflow.status === 'active') {
        this.registerWorkflow(workflow);
      }
    }
  }

  private startScheduledTriggers() {
    // Check every minute for schedule changes
    setInterval(() => {
      this.syncScheduledTasks();
    }, 60000);
  }

  private syncScheduledTasks() {
    for (const workflow of this.workflows.values()) {
      if (workflow.status === 'active') {
        this.registerWorkflow(workflow);
      }
    }
  }

  registerWorkflow(workflow: Workflow) {
    const existingTask = this.scheduledTasks.get(workflow.id);
    if (existingTask) {
      existingTask.stop();
    }

    for (const trigger of workflow.triggers) {
      if (trigger.type === 'scheduled' && trigger.config.schedule) {
        try {
          const task = cron.schedule(trigger.config.schedule, async () => {
            await this.execute(workflow.id, { source: 'scheduled', timestamp: new Date().toISOString() });
          });
          this.scheduledTasks.set(workflow.id, task);
          logger.info(`Registered scheduled workflow: ${workflow.name}`);
        } catch (error) {
          logger.error(`Invalid cron expression for workflow ${workflow.id}:`, error);
        }
      }
    }
  }

  async execute(workflowId: string, input: Record<string, any>): Promise<Execution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: Execution = {
      id: uuidv4(),
      workflowId,
      status: 'running',
      startedAt: new Date(),
      input,
      nodeExecutions: []
    };
    this.executions.set(execution.id, execution);

    try {
      // Execute nodes in order
      const sortedNodes = this.topologicalSort(workflow);

      for (const node of sortedNodes) {
        const nodeExecution = await this.executeNode(workflow, node, input);
        execution.nodeExecutions.push(nodeExecution);
        input = nodeExecution.output || input;

        // Handle conditional edges
        const edges = workflow.edges.filter(e => e.source === node.id);
        const nextEdge = edges.find(e => !e.condition || this.evaluateCondition(e.condition, input));
        if (!nextEdge && edges.length > 0) {
          break;
        }
      }

      execution.status = 'completed';
      execution.output = input;
      execution.completedAt = new Date();

      // Update workflow stats
      workflow.stats.totalRuns++;
      workflow.stats.successRuns++;
      workflow.stats.lastRun = new Date();

    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      workflow.stats.totalRuns++;
      workflow.stats.failedRuns++;
    }

    return execution;
  }

  private topologicalSort(workflow: Workflow): WorkflowNode[] {
    const visited = new Set<string>();
    const result: WorkflowNode[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return;

      result.push(node);

      const outgoing = workflow.edges.filter(e => e.source === nodeId);
      for (const edge of outgoing) {
        visit(edge.target);
      }
    };

    // Start from trigger nodes
    const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
    for (const node of triggerNodes) {
      visit(node.id);
    }

    return result;
  }

  private async executeNode(workflow: Workflow, node: WorkflowNode, input: any): Promise<NodeExecution> {
    const execution: NodeExecution = {
      nodeId: node.id,
      status: 'running',
      startedAt: new Date(),
      input
    };

    try {
      switch (node.type) {
        case 'action':
          execution.output = await this.executeAction(node, input);
          break;
        case 'condition':
          execution.output = this.evaluateCondition(node.config.expression as string, input);
          break;
        case 'delay':
          await this.delay(node.config.duration as number);
          execution.output = input;
          break;
        case 'transform':
          execution.output = this.transformData(node.config.mapping as string, input);
          break;
        case 'filter':
          if (this.evaluateCondition(node.config.condition as string, input)) {
            execution.output = input;
          } else {
            execution.status = 'skipped';
          }
          break;
        default:
          execution.output = input;
      }
      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
    }

    return execution;
  }

  private async executeAction(node: WorkflowNode, input: any): Promise<any> {
    const { actionType, config } = node.config;

    switch (actionType) {
      case 'post':
        logger.info(`Posting content: ${JSON.stringify(config.content || input.content)}`);
        return { posted: true, content: config.content || input.content };
      case 'email':
        logger.info(`Sending email to: ${config.to}`);
        return { emailSent: true, to: config.to };
      case 'sms':
        logger.info(`Sending SMS to: ${config.to}`);
        return { smsSent: true, to: config.to };
      case 'http':
        logger.info(`Making HTTP request: ${config.url}`);
        return { httpRequest: true, url: config.url };
      case 'notify':
        logger.info(`Sending notification: ${config.message}`);
        return { notified: true, message: config.message };
      default:
        return input;
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluator
      const [field, operator, value] = condition.split(' ');
      const fieldValue = field.split('.').reduce((obj: any, key: string) => obj?.[key], data);

      switch (operator) {
        case '==': return fieldValue == value;
        case '===': return fieldValue === value;
        case '!=': return fieldValue != value;
        case '>': return Number(fieldValue) > Number(value);
        case '<': return Number(fieldValue) < Number(value);
        case 'contains': return String(fieldValue).includes(value);
        default: return true;
      }
    } catch {
      return true;
    }
  }

  private transformData(mapping: string, data: any): any {
    try {
      // Simple JSONata-like transformation
      const mappings = JSON.parse(mapping);
      const result: any = {};
      for (const [key, path] of Object.entries(mappings)) {
        result[key] = String(path).split('.').reduce((obj: any, k: string) => obj?.[k], data);
      }
      return result;
    } catch {
      return data;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API methods
  createWorkflow(workflow: Omit<Workflow, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      id: uuidv4(),
      stats: { totalRuns: 0, successRuns: 0, failedRuns: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getExecutions(workflowId: string): Execution[] {
    return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updated = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(id, updated);

    if (updated.status === 'active') {
      this.registerWorkflow(updated);
    }

    return updated;
  }
}
