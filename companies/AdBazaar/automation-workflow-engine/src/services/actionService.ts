import { Action, IAction, ActionStatus } from '../models';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('ActionService');

export class ActionService {
  async createAction(data: {
    workflowId: string;
    executionId: string;
    name: string;
    type: string;
    order: number;
    config: Record<string, unknown>;
    maxRetries?: number;
  }): Promise<IAction> {
    const action = new Action({
      workflowId: data.workflowId,
      executionId: data.executionId,
      name: data.name,
      type: data.type,
      order: data.order,
      config: data.config,
      status: 'pending',
      maxRetries: data.maxRetries || 3
    });

    await action.save();
    return action;
  }

  async updateStatus(id: string, status: ActionStatus, error?: string): Promise<IAction | null> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'running') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    if (error) {
      updateData.error = error;
      const action = await Action.findById(id);
      if (action) {
        updateData.retryCount = action.retryCount + 1;
      }
    }

    return Action.findByIdAndUpdate(id, updateData, { new: true });
  }

  async setOutput(id: string, output: Record<string, unknown>): Promise<IAction | null> {
    return Action.findByIdAndUpdate(id, { output }, { new: true });
  }

  async findByExecution(executionId: string): Promise<IAction[]> {
    return Action.find({ executionId }).sort({ order: 1 });
  }

  async findById(id: string): Promise<IAction | null> {
    return Action.findById(id);
  }

  async retryAction(id: string): Promise<IAction | null> {
    const action = await Action.findById(id);
    if (!action || action.retryCount >= action.maxRetries) {
      return null;
    }

    return Action.findByIdAndUpdate(
      id,
      { status: 'pending', error: undefined },
      { new: true }
    );
  }

  async getActionStats(executionId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    running: number;
  }> {
    const actions = await Action.find({ executionId });

    return {
      total: actions.length,
      completed: actions.filter(a => a.status === 'completed').length,
      failed: actions.filter(a => a.status === 'failed').length,
      pending: actions.filter(a => a.status === 'pending').length,
      running: actions.filter(a => a.status === 'running').length
    };
  }
}

export const actionService = new ActionService();