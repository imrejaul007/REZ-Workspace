import { Workflow, IWorkflow } from '../models';
import { createChildLogger } from '../utils/logger';
import { workflowsCreatedTotal, activeWorkflowsGauge } from '../utils/metrics';

const logger = createChildLogger('WorkflowService');

export interface CreateWorkflowInput {
  userId: string;
  name: string;
  description?: string;
  trigger: {
    type: 'manual' | 'scheduled' | 'event' | 'webhook' | 'condition';
    config: Record<string, unknown>;
  };
  actions: {
    type: string;
    config: Record<string, unknown>;
    order: number;
    retryConfig?: { maxRetries: number; retryDelay: number };
  }[];
  conditions?: {
    type: 'and' | 'or';
    rules: Record<string, unknown>[];
  };
  variables?: Record<string, unknown>;
  isTemplate?: boolean;
}

export class WorkflowService {
  async create(input: CreateWorkflowInput): Promise<IWorkflow> {
    logger.info('Creating workflow', { userId: input.userId, name: input.name });

    const workflow = new Workflow({
      userId: input.userId,
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      actions: input.actions,
      conditions: input.conditions,
      variables: input.variables || {},
      isTemplate: input.isTemplate || false,
      status: 'draft'
    });

    await workflow.save();
    workflowsCreatedTotal.inc();

    logger.info('Workflow created', { workflowId: workflow._id });
    return workflow;
  }

  async findById(id: string): Promise<IWorkflow | null> {
    return Workflow.findById(id);
  }

  async findByUser(userId: string, options?: { status?: string; isTemplate?: boolean }): Promise<IWorkflow[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;
    if (options?.isTemplate !== undefined) query.isTemplate = options.isTemplate;

    return Workflow.find(query).sort({ createdAt: -1 });
  }

  async update(id: string, input: Partial<CreateWorkflowInput>): Promise<IWorkflow | null> {
    return Workflow.findByIdAndUpdate(id, input, { new: true });
  }

  async updateStatus(id: string, status: 'draft' | 'active' | 'paused' | 'disabled'): Promise<IWorkflow | null> {
    const workflow = await Workflow.findById(id);
    if (!workflow) return null;

    const oldStatus = workflow.status;
    const updated = await Workflow.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (updated) {
      if (status === 'active' && oldStatus !== 'active') {
        activeWorkflowsGauge.inc();
      } else if (status !== 'active' && oldStatus === 'active') {
        activeWorkflowsGauge.dec();
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const workflow = await Workflow.findById(id);
    if (workflow && workflow.status === 'active') {
      activeWorkflowsGauge.dec();
    }
    const result = await Workflow.findByIdAndDelete(id);
    return !!result;
  }

  async incrementExecution(id: string, success: boolean, duration: number): Promise<void> {
    const workflow = await Workflow.findById(id);
    if (!workflow) return;

    const newCount = workflow.executionCount + 1;
    const newAvgTime = workflow.avgExecutionTime
      ? (workflow.avgExecutionTime * (newCount - 1) + duration) / newCount
      : duration;

    await Workflow.findByIdAndUpdate(id, {
      executionCount: newCount,
      lastExecutedAt: new Date(),
      avgExecutionTime: newAvgTime,
      errorCount: success ? workflow.errorCount : workflow.errorCount + 1
    });
  }

  async getWorkflowStats(userId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    draft: number;
    totalExecutions: number;
  }> {
    const workflows = await Workflow.find({ userId });
    return {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'active').length,
      paused: workflows.filter(w => w.status === 'paused').length,
      draft: workflows.filter(w => w.status === 'draft').length,
      totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0)
    };
  }

  async duplicateWorkflow(id: string, userId: string): Promise<IWorkflow> {
    const original = await Workflow.findById(id);
    if (!original) throw new Error('Workflow not found');

    const duplicate = new Workflow({
      userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      trigger: original.trigger,
      actions: original.actions,
      conditions: original.conditions,
      variables: original.variables,
      status: 'draft'
    });

    await duplicate.save();
    return duplicate;
  }
}

export const workflowService = new WorkflowService();