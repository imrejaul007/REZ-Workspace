import { Types } from 'mongoose';
import { Goal, IGoalDocument } from '../models/Goal.js';
import { Feedback } from '../models/Feedback.js';
import {
  CreateGoalSchema,
  UpdateGoalProgressSchema,
  UpdateKeyResultSchema,
  CreateFeedbackSchema,
  ListQuerySchema,
  IApiResponse,
  IPaginatedResult,
  IGoal,
  IFeedback,
} from '../types/index.js';

export class GoalServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'GoalServiceError';
  }
}

// ============================================
// GOAL SERVICE
// ============================================

export class GoalService {
  /**
   * Create a new goal
   */
  async createGoal(data: z.infer<typeof CreateGoalSchema>): Promise<IApiResponse<IGoal>> {
    try {
      const validated = CreateGoalSchema.parse(data);

      const goalData: Record<string, unknown> = {
        title: validated.title,
        description: validated.description,
        employeeId: validated.employeeId,
        cycleId: validated.cycleId,
        managerId: validated.managerId,
        keyResults: validated.keyResults || [],
        timeframe: validated.timeframe,
        status: validated.status,
        weight: validated.weight,
      };

      if (validated.startDate) {
        goalData.startDate = new Date(validated.startDate);
      }
      if (validated.dueDate) {
        goalData.dueDate = new Date(validated.dueDate);
      }

      const goal = new Goal(goalData);
      await goal.save();

      // Calculate initial progress from key results
      if (goal.keyResults.length > 0) {
        goal.progress = goal.calculateProgressFromKeyResults();
        await goal.save();
      }

      return {
        success: true,
        data: goal.toJSON() as IGoal,
        message: 'Goal created successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new GoalServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new GoalServiceError('Failed to create goal', 'CREATE_ERROR', 500);
    }
  }

  /**
   * Get all goals with pagination and filtering
   */
  async listGoals(
    query: Record<string, unknown>
  ): Promise<IApiResponse<IPaginatedResult<IGoal>>> {
    try {
      const validated = ListQuerySchema.parse(query);
      const { page, limit, status, search, sortBy, sortOrder } = validated;

      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (search) {
        filter.$text = { $search: search };
      }

      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const skip = (page - 1) * limit;

      const [goals, total] = await Promise.all([
        Goal.find(filter)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(limit)
          .lean(),
        Goal.countDocuments(filter),
      ]);

      return {
        success: true,
        data: {
          data: goals as unknown as IGoal[],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new GoalServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw error;
    }
  }

  /**
   * Get a goal by ID
   */
  async getGoalById(goalId: string): Promise<IApiResponse<IGoal>> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new GoalServiceError('Invalid goal ID', 'INVALID_ID', 400);
      }

      const goal = await Goal.findById(goalId).lean();
      if (!goal) {
        throw new GoalServiceError('Goal not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        data: goal as unknown as IGoal,
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get goal', 'GET_ERROR', 500);
    }
  }

  /**
   * Get goals by employee
   */
  async getGoalsByEmployee(
    employeeId: string,
    status?: string
  ): Promise<IApiResponse<IGoal[]>> {
    try {
      const filter: Record<string, unknown> = { employeeId };
      if (status) filter.status = status;

      const goals = await Goal.find(filter).sort({ dueDate: 1, createdAt: -1 }).lean();

      return {
        success: true,
        data: goals as unknown as IGoal[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get goals', 'GET_ERROR', 500);
    }
  }

  /**
   * Get goals by manager
   */
  async getGoalsByManager(
    managerId: string,
    status?: string
  ): Promise<IApiResponse<IGoal[]>> {
    try {
      const filter: Record<string, unknown> = { managerId };
      if (status) filter.status = status;

      const goals = await Goal.find(filter)
        .sort({ dueDate: 1, employeeId: 1, createdAt: -1 })
        .lean();

      return {
        success: true,
        data: goals as unknown as IGoal[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get goals', 'GET_ERROR', 500);
    }
  }

  /**
   * Update goal progress
   */
  async updateProgress(
    goalId: string,
    data: z.infer<typeof UpdateGoalProgressSchema>
  ): Promise<IApiResponse<IGoal>> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new GoalServiceError('Invalid goal ID', 'INVALID_ID', 400);
      }

      const validated = UpdateGoalProgressSchema.parse(data);

      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new GoalServiceError('Goal not found', 'NOT_FOUND', 404);
      }

      goal.progress = validated.progress;

      // Auto-update status based on progress
      if (validated.progress >= 100 && goal.status !== 'completed' && goal.status !== 'cancelled') {
        goal.status = 'completed';
      } else if (validated.progress > 0 && goal.status === 'not_started') {
        goal.status = 'in_progress';
      }

      await goal.save();

      return {
        success: true,
        data: goal.toJSON() as IGoal,
        message: 'Goal progress updated successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new GoalServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new GoalServiceError('Failed to update progress', 'UPDATE_ERROR', 500);
    }
  }

  /**
   * Update a key result
   */
  async updateKeyResult(
    goalId: string,
    data: z.infer<typeof UpdateKeyResultSchema>
  ): Promise<IApiResponse<IGoal>> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new GoalServiceError('Invalid goal ID', 'INVALID_ID', 400);
      }

      const validated = UpdateKeyResultSchema.parse(data);

      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new GoalServiceError('Goal not found', 'NOT_FOUND', 404);
      }

      const keyResult = goal.keyResults.find((kr) => kr.id === validated.keyResultId);
      if (!keyResult) {
        throw new GoalServiceError('Key result not found', 'KEY_RESULT_NOT_FOUND', 404);
      }

      if (validated.currentValue !== undefined) {
        keyResult.currentValue = validated.currentValue;
      }

      // Recalculate progress from key results
      goal.progress = goal.calculateProgressFromKeyResults();

      // Auto-complete if all key results are at 100%
      if (goal.progress >= 100 && goal.status !== 'cancelled') {
        goal.status = 'completed';
      }

      await goal.save();

      return {
        success: true,
        data: goal.toJSON() as IGoal,
        message: 'Key result updated successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new GoalServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new GoalServiceError('Failed to update key result', 'UPDATE_ERROR', 500);
    }
  }

  /**
   * Add a key result to a goal
   */
  async addKeyResult(
    goalId: string,
    keyResult: { title: string; metric?: string; targetValue?: number; unit?: string }
  ): Promise<IApiResponse<IGoal>> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new GoalServiceError('Invalid goal ID', 'INVALID_ID', 400);
      }

      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new GoalServiceError('Goal not found', 'NOT_FOUND', 404);
      }

      if (goal.keyResults.length >= 10) {
        throw new GoalServiceError(
          'Cannot add more than 10 key results',
          'MAX_KEY_RESULTS',
          400
        );
      }

      goal.keyResults.push({
        id: crypto.randomUUID(),
        title: keyResult.title,
        metric: keyResult.metric,
        targetValue: keyResult.targetValue,
        currentValue: 0,
        unit: keyResult.unit,
      });

      await goal.save();

      return {
        success: true,
        data: goal.toJSON() as IGoal,
        message: 'Key result added successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to add key result', 'ADD_ERROR', 500);
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<IApiResponse<null>> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new GoalServiceError('Invalid goal ID', 'INVALID_ID', 400);
      }

      const goal = await Goal.findByIdAndDelete(goalId);
      if (!goal) {
        throw new GoalServiceError('Goal not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        message: 'Goal deleted successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to delete goal', 'DELETE_ERROR', 500);
    }
  }

  /**
   * Get overdue goals
   */
  async getOverdueGoals(): Promise<IApiResponse<IGoal[]>> {
    try {
      const goals = await Goal.findOverdue();
      return {
        success: true,
        data: goals as unknown as IGoal[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get overdue goals', 'GET_ERROR', 500);
    }
  }

  /**
   * Get upcoming goals (due within specified days)
   */
  async getUpcomingGoals(days: number = 7): Promise<IApiResponse<IGoal[]>> {
    try {
      const goals = await Goal.findUpcoming(days);
      return {
        success: true,
        data: goals as unknown as IGoal[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get upcoming goals', 'GET_ERROR', 500);
    }
  }

  /**
   * Get goal statistics for an employee
   */
  async getEmployeeGoalStats(
    employeeId: string
  ): Promise<IApiResponse<{ total: number; completed: number; inProgress: number; overdue: number; avgProgress: number }>> {
    try {
      const goals = await Goal.find({ employeeId });

      const stats = {
        total: goals.length,
        completed: goals.filter((g) => g.status === 'completed').length,
        inProgress: goals.filter((g) => g.status === 'in_progress').length,
        overdue: goals.filter(
          (g) => g.dueDate && g.dueDate < new Date() && !['completed', 'cancelled'].includes(g.status)
        ).length,
        avgProgress: goals.length > 0
          ? Math.round((goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) * 10) / 10
          : 0,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get goal stats', 'STATS_ERROR', 500);
    }
  }
}

// ============================================
// FEEDBACK SERVICE
// ============================================

export class FeedbackService {
  /**
   * Submit 360 feedback
   */
  async createFeedback(data: z.infer<typeof CreateFeedbackSchema>): Promise<IApiResponse<IFeedback>> {
    try {
      const validated = CreateFeedbackSchema.parse(data);

      // Verify cycle exists
      if (!Types.ObjectId.isValid(validated.cycleId)) {
        throw new GoalServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      // Check for existing feedback
      const existingFeedback = await Feedback.findOne({
        cycleId: new Types.ObjectId(validated.cycleId),
        fromUserId: validated.fromUserId,
        toUserId: validated.toUserId,
      });

      if (existingFeedback) {
        throw new GoalServiceError(
          'Feedback already submitted from this user to the same recipient',
          'DUPLICATE_FEEDBACK',
          409
        );
      }

      const feedback = new Feedback({
        ...validated,
        cycleId: new Types.ObjectId(validated.cycleId),
      });

      await feedback.save();

      return {
        success: true,
        data: feedback.toJSON() as IFeedback,
        message: 'Feedback submitted successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new GoalServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new GoalServiceError('Failed to create feedback', 'CREATE_ERROR', 500);
    }
  }

  /**
   * Get feedback received by a user
   */
  async getFeedbackReceived(
    userId: string,
    cycleId?: string
  ): Promise<IApiResponse<IFeedback[]>> {
    try {
      const filter: Record<string, unknown> = { toUserId: userId };
      if (cycleId) {
        if (!Types.ObjectId.isValid(cycleId)) {
          throw new GoalServiceError('Invalid cycle ID', 'INVALID_ID', 400);
        }
        filter.cycleId = new Types.ObjectId(cycleId);
      }

      const feedbacks = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        data: feedbacks as unknown as IFeedback[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get feedback', 'GET_ERROR', 500);
    }
  }

  /**
   * Get feedback given by a user
   */
  async getFeedbackGiven(
    userId: string,
    cycleId?: string
  ): Promise<IApiResponse<IFeedback[]>> {
    try {
      const filter: Record<string, unknown> = { fromUserId: userId };
      if (cycleId) {
        if (!Types.ObjectId.isValid(cycleId)) {
          throw new GoalServiceError('Invalid cycle ID', 'INVALID_ID', 400);
        }
        filter.cycleId = new Types.ObjectId(cycleId);
      }

      const feedbacks = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        data: feedbacks as unknown as IFeedback[],
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get feedback', 'GET_ERROR', 500);
    }
  }

  /**
   * Get 360 feedback for a user (all types)
   */
  async get360Feedback(
    userId: string,
    cycleId: string
  ): Promise<IApiResponse<{ type: string; avgRating: number | null; count: number; feedbacks: IFeedback[] }[]>> {
    try {
      if (!Types.ObjectId.isValid(cycleId)) {
        throw new GoalServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const feedbacks = await Feedback.find360ForUser(userId, new Types.ObjectId(cycleId));

      // Group by type
      const grouped: Record<string, IFeedback[]> = {};
      for (const feedback of feedbacks) {
        const type = feedback.type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(feedback as unknown as IFeedback);
      }

      const result = Object.entries(grouped).map(([type, fbs]) => {
        const avgRating =
          fbs.length > 0
            ? Math.round(
                (fbs.reduce((acc, f) => {
                  const fb = f as unknown as { ratings: { score: number }[] };
                  return acc + (fb.ratings?.length > 0
                    ? fb.ratings.reduce((a, r) => a + r.score, 0) / fb.ratings.length
                    : 0);
                }, 0) / fbs.length) * 10
              ) / 10
            : null;

        return {
          type,
          avgRating,
          count: fbs.length,
          feedbacks: fbs,
        };
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to get 360 feedback', 'GET_ERROR', 500);
    }
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(feedbackId: string): Promise<IApiResponse<null>> {
    try {
      if (!Types.ObjectId.isValid(feedbackId)) {
        throw new GoalServiceError('Invalid feedback ID', 'INVALID_ID', 400);
      }

      const feedback = await Feedback.findByIdAndDelete(feedbackId);
      if (!feedback) {
        throw new GoalServiceError('Feedback not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        message: 'Feedback deleted successfully',
      };
    } catch (error) {
      if (error instanceof GoalServiceError) throw error;
      throw new GoalServiceError('Failed to delete feedback', 'DELETE_ERROR', 500);
    }
  }
}

import { z } from 'zod';

// Import at the top - removed duplicate from end
