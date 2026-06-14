import { Execution, IExecution, Workflow, Log, Action } from '../models';
import { createChildLogger } from '../utils/logger';
import { workflowExecutionsTotal, workflowExecutionDuration } from '../utils/metrics';

const logger = createChildLogger('ExecutionService');

export class ExecutionService {
  async createExecution(workflowId: string, userId: string, trigger: {
    type: string;
    source?: string;
    payload?: Record<string, unknown>;
  }, input?: Record<string, unknown>): Promise<IExecution> {
    logger.info('Creating workflow execution', { workflowId, userId });

    const execution = new Execution({
      workflowId,
      userId,
      status: 'pending',
      trigger,
      input: input || {},
      startedAt: new Date()
    });

    await execution.save();

    // Create log entry
    await this.createLog(workflowId, execution._id.toString(), undefined, 'info', 'Execution started');

    return execution;
  }

  async startExecution(executionId: string): Promise<IExecution | null> {
    return Execution.findByIdAndUpdate(
      executionId,
      { status: 'running', startedAt: new Date() },
      { new: true }
    );
  }

  async completeExecution(
    executionId: string,
    output?: Record<string, unknown>,
    error?: string
  ): Promise<IExecution | null> {
    const execution = await Execution.findById(executionId);
    if (!execution) return null;

    const completedAt = new Date();
    const duration = completedAt.getTime() - new Date(execution.startedAt).getTime();

    const updateData: Record<string, unknown> = {
      completedAt,
      duration,
      output,
      status: error ? 'failed' : 'completed'
    };

    if (error) updateData.error = error;

    const updated = await Execution.findByIdAndUpdate(executionId, updateData, { new: true });

    if (updated) {
      workflowExecutionsTotal.inc({ status: updated.status });
      workflowExecutionDuration.observe(duration / 1000);

      // Update workflow stats
      const workflow = await Workflow.findById(execution.workflowId);
      if (workflow) {
        const newCount = workflow.executionCount + 1;
        const newAvgTime = workflow.avgExecutionTime
          ? (workflow.avgExecutionTime * (newCount - 1) + duration) / newCount
          : duration;

        await Workflow.findByIdAndUpdate(execution.workflowId, {
          executionCount: newCount,
          lastExecutedAt: new Date(),
          avgExecutionTime: newAvgTime,
          errorCount: error ? workflow.errorCount + 1 : workflow.errorCount
        });
      }

      // Create completion log
      await this.createLog(
        execution.workflowId.toString(),
        executionId,
        undefined,
        error ? 'error' : 'info',
        error ? `Execution failed: ${error}` : 'Execution completed successfully'
      );
    }

    return updated;
  }

  async cancelExecution(executionId: string): Promise<IExecution | null> {
    const execution = await Execution.findById(executionId);
    if (!execution) return null;

    const completedAt = new Date();
    const duration = completedAt.getTime() - new Date(execution.startedAt).getTime();

    const updated = await Execution.findByIdAndUpdate(
      executionId,
      { status: 'cancelled', completedAt, duration },
      { new: true }
    );

    if (updated) {
      workflowExecutionsTotal.inc({ status: 'cancelled' });
      await this.createLog(
        execution.workflowId.toString(),
        executionId,
        undefined,
        'warn',
        'Execution cancelled'
      );
    }

    return updated;
  }

  async findById(id: string): Promise<IExecution | null> {
    return Execution.findById(id).populate('workflowId');
  }

  async findByWorkflow(workflowId: string, options?: { limit?: number; status?: string }): Promise<IExecution[]> {
    const query: Record<string, unknown> = { workflowId };
    if (options?.status) query.status = options.status;

    return Execution.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50);
  }

  async findByUser(userId: string, options?: { limit?: number; status?: string }): Promise<IExecution[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;

    return Execution.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .populate('workflowId');
  }

  async createLog(
    workflowId: string,
    executionId: string,
    actionId?: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const log = new Log({
      workflowId,
      executionId,
      actionId: actionId || undefined,
      level,
      message,
      context
    });
    await log.save();
  }

  async getLogs(executionId: string, options?: { level?: string; limit?: number }): Promise<unknown[]> {
    const query: Record<string, unknown> = { executionId };
    if (options?.level) query.level = options.level;

    return Log.find(query)
      .sort({ createdAt: 1 })
      .limit(options?.limit || 100);
  }

  async getExecutionStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    avgDuration: number;
  }> {
    const executions = await Execution.find({ userId });

    const stats = executions.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        if (e.duration) acc.durationSum += e.duration;
        return acc;
      },
      { total: executions.length, completed: 0, failed: 0, running: 0, durationSum: 0 }
    );

    return {
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
      running: stats.running,
      avgDuration: stats.total > 0 ? stats.durationSum / stats.total : 0
    };
  }
}

export const executionService = new ExecutionService();