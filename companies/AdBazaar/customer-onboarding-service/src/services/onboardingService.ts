/**
 * Onboarding Service - Core business logic
 */

import { OnboardingModel, IOnboarding } from '../models/onboarding';
import { TaskModel } from '../models/task';
import { ProgressModel } from '../models/progress';
import { ChecklistModel } from '../models/checklist';
import { logger } from 'utils/logger.js';
import { onboardingProgressGauge, onboardingCompletionCounter, taskCompletionHistogram } from '../utils/metrics';

export class OnboardingService {
  /**
   * Create a new onboarding
   */
  async createOnboarding(data: {
    customerId: string;
    type: 'standard' | 'enterprise' | 'agency' | 'publisher' | 'creator';
    dueDate: Date;
    assignedTo?: string;
  }): Promise<IOnboarding> {
    logger.info(`Creating onboarding for customer ${data.customerId}`);

    // Get the appropriate checklist
    const checklist = await ChecklistModel.findOne({ type: data.type, active: true });
    if (!checklist) {
      throw new Error(`No active checklist found for type: ${data.type}`);
    }

    // Create onboarding
    const onboarding = await OnboardingModel.create({
      customerId: data.customerId,
      type: data.type,
      status: 'not_started',
      progress: 0,
      currentStep: 0,
      totalSteps: checklist.steps.length,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      checklist: checklist.steps.map(step => ({
        checklistId: step.order.toString(),
        name: step.name,
        completed: false,
      })),
    });

    // Create tasks from checklist
    const tasks = checklist.steps.map(step => ({
      onboardingId: onboarding._id.toString(),
      customerId: data.customerId,
      stepOrder: step.order,
      name: step.name,
      description: step.description,
      category: step.category,
      required: step.required,
      status: 'pending' as const,
      estimatedMinutes: step.estimatedMinutes,
    }));

    await TaskModel.insertMany(tasks);

    logger.info(`Onboarding created: ${onboarding._id} with ${tasks.length} tasks`);
    return onboarding;
  }

  /**
   * Get onboarding by ID
   */
  async getOnboarding(onboardingId: string): Promise<IOnboarding | null> {
    return OnboardingModel.findById(onboardingId).lean();
  }

  /**
   * Get onboarding by customer ID
   */
  async getOnboardingByCustomer(customerId: string): Promise<IOnboarding | null> {
    return OnboardingModel.findOne({ customerId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Update onboarding
   */
  async updateOnboarding(
    onboardingId: string,
    updates: Partial<{
      status: string;
      assignedTo: string;
      dueDate: Date;
    }>
  ): Promise<IOnboarding | null> {
    const onboarding = await OnboardingModel.findByIdAndUpdate(
      onboardingId,
      updates,
      { new: true }
    ).lean();

    if (onboarding) {
      logger.info(`Onboarding ${onboardingId} updated`);
    }

    return onboarding;
  }

  /**
   * Update progress for a task
   */
  async updateProgress(
    onboardingId: string,
    taskId: string,
    action: 'start' | 'complete' | 'skip',
    completedBy: string,
    notes?: string
  ): Promise<{ onboarding: IOnboarding; task: any }> {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const startTime = Date.now();

    if (action === 'start') {
      task.status = 'in_progress';
    } else if (action === 'complete') {
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedBy = completedBy;
      task.actualMinutes = Math.round((Date.now() - startTime) / 60000);

      // Record metrics
      taskCompletionHistogram.observe({ task_category: task.category }, task.actualMinutes * 60);
    } else if (action === 'skip') {
      task.status = 'skipped';
      task.completedAt = new Date();
      task.completedBy = completedBy;
    }

    if (notes) {
      task.notes = notes;
    }

    await task.save();

    // Record progress
    await ProgressModel.create({
      onboardingId,
      customerId: task.customerId,
      step: task.stepOrder,
      action: action === 'start' ? 'started' : action === 'complete' ? 'completed' : 'skipped',
      taskId: task._id.toString(),
      taskName: task.name,
      completedBy,
      notes,
      duration: action === 'complete' ? task.actualMinutes : undefined,
    });

    // Update onboarding progress
    const onboarding = await this.recalculateProgress(onboardingId);

    return { onboarding, task };
  }

  /**
   * Recalculate onboarding progress
   */
  private async recalculateProgress(onboardingId: string): Promise<IOnboarding> {
    const tasks = await TaskModel.find({ onboardingId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const currentStep = tasks.find(t => t.status === 'pending' || t.status === 'in_progress')?.stepOrder ?? totalTasks;

    let status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled' = 'not_started';
    if (progress === 0) {
      status = 'not_started';
    } else if (progress === 100) {
      status = 'completed';
      onboardingCompletionCounter.inc({ status: 'completed' });
    } else {
      status = 'in_progress';
    }

    const onboarding = await OnboardingModel.findByIdAndUpdate(
      onboardingId,
      {
        progress,
        currentStep,
        status,
        startedAt: progress > 0 ? undefined : new Date(),
        completedAt: progress === 100 ? new Date() : undefined,
      },
      { new: true }
    ).lean();

    if (onboarding) {
      onboardingProgressGauge.set(
        { customer_id: onboarding.customerId, onboarding_id: onboardingId },
        progress
      );
    }

    return onboarding!;
  }

  /**
   * Get checklist for an onboarding
   */
  async getChecklist(onboardingId: string): Promise<any> {
    const onboarding = await OnboardingModel.findById(onboardingId);
    if (!onboarding) {
      throw new Error('Onboarding not found');
    }

    const tasks = await TaskModel.find({ onboardingId }).sort({ stepOrder: 1 }).lean();

    return {
      onboardingId,
      customerId: onboarding.customerId,
      type: onboarding.type,
      progress: onboarding.progress,
      currentStep: onboarding.currentStep,
      totalSteps: onboarding.totalSteps,
      tasks: tasks.map(task => ({
        id: task._id,
        stepOrder: task.stepOrder,
        name: task.name,
        description: task.description,
        category: task.category,
        required: task.required,
        status: task.status,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        notes: task.notes,
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: task.actualMinutes,
      })),
    };
  }

  /**
   * Get onboarding progress history
   */
  async getProgressHistory(onboardingId: string): Promise<any[]> {
    return ProgressModel.find({ onboardingId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get all onboardings (with filters)
   */
  async getAllOnboardings(filters: {
    status?: string;
    assignedTo?: string;
    type?: string;
  }): Promise<IOnboarding[]> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.type) query.type = filters.type;

    return OnboardingModel.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get overdue onboardings
   */
  async getOverdueOnboardings(): Promise<IOnboarding[]> {
    return OnboardingModel.find({
      status: { $in: ['not_started', 'in_progress'] },
      dueDate: { $lt: new Date() },
    }).lean();
  }
}

export const onboardingService = new OnboardingService();