import { Types } from 'mongoose';
import { ReviewCycle, IReviewCycleDocument } from '../models/ReviewCycle.js';
import { Review, IReviewDocument } from '../models/Review.js';
import {
  CreateReviewCycleSchema,
  UpdateReviewCycleSchema,
  CreateReviewSchema,
  UpdateReviewRatingSchema,
  ListQuerySchema,
  IApiResponse,
  IPaginatedResult,
  IReviewCycle,
  IReview,
  IReviewCycleStats,
} from '../types/index.js';

export class ReviewServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ReviewServiceError';
  }
}

// ============================================
// REVIEW CYCLE SERVICE
// ============================================

export class ReviewCycleService {
  /**
   * Create a new review cycle
   */
  async createCycle(
    data: z.infer<typeof CreateReviewCycleSchema>,
    createdBy: string
  ): Promise<IApiResponse<IReviewCycle>> {
    try {
      const validated = CreateReviewCycleSchema.parse(data);

      const cycle = new ReviewCycle({
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        createdBy,
      });

      await cycle.save();

      return {
        success: true,
        data: cycle.toJSON() as IReviewCycle,
        message: 'Review cycle created successfully',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ReviewServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      if (error instanceof Error) {
        throw new ReviewServiceError(error.message, 'CREATE_ERROR', 500);
      }
      throw error;
    }
  }

  /**
   * Get all review cycles with pagination
   */
  async listCycles(
    query: Record<string, unknown>
  ): Promise<IApiResponse<IPaginatedResult<IReviewCycle>>> {
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

      const [cycles, total] = await Promise.all([
        ReviewCycle.find(filter)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(limit)
          .lean(),
        ReviewCycle.countDocuments(filter),
      ]);

      return {
        success: true,
        data: {
          data: cycles as unknown as IReviewCycle[],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ReviewServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw error;
    }
  }

  /**
   * Get a single review cycle by ID
   */
  async getCycleById(cycleId: string): Promise<IApiResponse<IReviewCycle>> {
    try {
      if (!Types.ObjectId.isValid(cycleId)) {
        throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const cycle = await ReviewCycle.findById(cycleId).lean();
      if (!cycle) {
        throw new ReviewServiceError('Review cycle not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        data: cycle as unknown as IReviewCycle,
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to get cycle', 'GET_ERROR', 500);
    }
  }

  /**
   * Update a review cycle
   */
  async updateCycle(
    cycleId: string,
    data: z.infer<typeof UpdateReviewCycleSchema>
  ): Promise<IApiResponse<IReviewCycle>> {
    try {
      if (!Types.ObjectId.isValid(cycleId)) {
        throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const validated = UpdateReviewCycleSchema.parse(data);
      const updateData: Record<string, unknown> = { ...validated };

      if (validated.startDate) updateData.startDate = new Date(validated.startDate);
      if (validated.endDate) updateData.endDate = new Date(validated.endDate);

      const cycle = await ReviewCycle.findByIdAndUpdate(
        cycleId,
        updateData,
        { new: true, runValidators: true }
      ).lean();

      if (!cycle) {
        throw new ReviewServiceError('Review cycle not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        data: cycle as unknown as IReviewCycle,
        message: 'Review cycle updated successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new ReviewServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new ReviewServiceError('Failed to update cycle', 'UPDATE_ERROR', 500);
    }
  }

  /**
   * Delete a review cycle
   */
  async deleteCycle(cycleId: string): Promise<IApiResponse<null>> {
    try {
      if (!Types.ObjectId.isValid(cycleId)) {
        throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const cycle = await ReviewCycle.findByIdAndDelete(cycleId);
      if (!cycle) {
        throw new ReviewServiceError('Review cycle not found', 'NOT_FOUND', 404);
      }

      // Also delete associated reviews
      await Review.deleteMany({ cycleId: new Types.ObjectId(cycleId) });

      return {
        success: true,
        message: 'Review cycle deleted successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to delete cycle', 'DELETE_ERROR', 500);
    }
  }

  /**
   * Get cycle statistics
   */
  async getCycleStats(): Promise<IApiResponse<IReviewCycleStats>> {
    try {
      const [totalCycles, activeCycles, completedCycles, pendingReviews, completedReviews] =
        await Promise.all([
          ReviewCycle.countDocuments(),
          ReviewCycle.countDocuments({ status: 'active' }),
          ReviewCycle.countDocuments({ status: 'completed' }),
          Review.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
          Review.countDocuments({ status: { $in: ['submitted', 'acknowledged'] } }),
        ]);

      return {
        success: true,
        data: {
          totalCycles,
          activeCycles,
          completedCycles,
          pendingReviews,
          completedReviews,
        },
      };
    } catch (error) {
      throw new ReviewServiceError('Failed to get stats', 'STATS_ERROR', 500);
    }
  }
}

// ============================================
// REVIEW SERVICE
// ============================================

export class ReviewService {
  /**
   * Submit a new review
   */
  async createReview(data: z.infer<typeof CreateReviewSchema>): Promise<IApiResponse<IReview>> {
    try {
      const validated = CreateReviewSchema.parse(data);

      // Verify cycle exists
      if (!Types.ObjectId.isValid(validated.cycleId)) {
        throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const cycle = await ReviewCycle.findById(validated.cycleId);
      if (!cycle) {
        throw new ReviewServiceError('Review cycle not found', 'CYCLE_NOT_FOUND', 404);
      }

      // Check for existing review
      const existingReview = await Review.findOne({
        cycleId: new Types.ObjectId(validated.cycleId),
        employeeId: validated.employeeId,
      });

      if (existingReview) {
        throw new ReviewServiceError(
          'Review already exists for this employee in this cycle',
          'DUPLICATE_REVIEW',
          409
        );
      }

      const review = new Review({
        ...validated,
        cycleId: new Types.ObjectId(validated.cycleId),
      });

      await review.save();

      return {
        success: true,
        data: review.toJSON() as IReview,
        message: 'Review submitted successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new ReviewServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new ReviewServiceError('Failed to create review', 'CREATE_ERROR', 500);
    }
  }

  /**
   * Get a review by ID
   */
  async getReviewById(reviewId: string): Promise<IApiResponse<IReview>> {
    try {
      if (!Types.ObjectId.isValid(reviewId)) {
        throw new ReviewServiceError('Invalid review ID', 'INVALID_ID', 400);
      }

      const review = await Review.findById(reviewId).populate('cycleId').lean();
      if (!review) {
        throw new ReviewServiceError('Review not found', 'NOT_FOUND', 404);
      }

      return {
        success: true,
        data: review as unknown as IReview,
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to get review', 'GET_ERROR', 500);
    }
  }

  /**
   * Get reviews by employee
   */
  async getReviewsByEmployee(
    employeeId: string,
    cycleId?: string
  ): Promise<IApiResponse<IReview[]>> {
    try {
      const filter: Record<string, unknown> = { employeeId };
      if (cycleId) {
        if (!Types.ObjectId.isValid(cycleId)) {
          throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
        }
        filter.cycleId = new Types.ObjectId(cycleId);
      }

      const reviews = await Review.find(filter)
        .populate('cycleId')
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        data: reviews as unknown as IReview[],
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to get reviews', 'GET_ERROR', 500);
    }
  }

  /**
   * Update a rating in a review
   */
  async updateRating(
    reviewId: string,
    rating: z.infer<typeof UpdateReviewRatingSchema>
  ): Promise<IApiResponse<IReview>> {
    try {
      if (!Types.ObjectId.isValid(reviewId)) {
        throw new ReviewServiceError('Invalid review ID', 'INVALID_ID', 400);
      }

      const validated = UpdateReviewRatingSchema.parse(rating);

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new ReviewServiceError('Review not found', 'NOT_FOUND', 404);
      }

      // Find and update or add the rating
      const existingRatingIndex = review.ratings.findIndex(
        (r) => r.category === validated.category
      );

      if (existingRatingIndex >= 0) {
        review.ratings[existingRatingIndex] = {
          category: validated.category,
          score: validated.score,
          comment: validated.comment,
        };
      } else {
        review.ratings.push({
          category: validated.category,
          score: validated.score,
          comment: validated.comment,
        });
      }

      // Update status if needed
      if (review.status === 'pending') {
        review.status = 'in_progress';
      }

      await review.save();

      return {
        success: true,
        data: review.toJSON() as IReview,
        message: 'Rating updated successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      if (error instanceof z.ZodError) {
        throw new ReviewServiceError(
          error.errors.map((e) => e.message).join(', '),
          'VALIDATION_ERROR',
          400
        );
      }
      throw new ReviewServiceError('Failed to update rating', 'UPDATE_ERROR', 500);
    }
  }

  /**
   * Submit a review (mark as submitted)
   */
  async submitReview(reviewId: string): Promise<IApiResponse<IReview>> {
    try {
      if (!Types.ObjectId.isValid(reviewId)) {
        throw new ReviewServiceError('Invalid review ID', 'INVALID_ID', 400);
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new ReviewServiceError('Review not found', 'NOT_FOUND', 404);
      }

      if (review.status === 'submitted') {
        throw new ReviewServiceError('Review already submitted', 'ALREADY_SUBMITTED', 400);
      }

      review.status = 'submitted';
      review.submittedAt = new Date();
      await review.save();

      return {
        success: true,
        data: review.toJSON() as IReview,
        message: 'Review submitted successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to submit review', 'SUBMIT_ERROR', 500);
    }
  }

  /**
   * Acknowledge a review
   */
  async acknowledgeReview(reviewId: string): Promise<IApiResponse<IReview>> {
    try {
      if (!Types.ObjectId.isValid(reviewId)) {
        throw new ReviewServiceError('Invalid review ID', 'INVALID_ID', 400);
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new ReviewServiceError('Review not found', 'NOT_FOUND', 404);
      }

      if (review.status !== 'submitted') {
        throw new ReviewServiceError('Review must be submitted first', 'INVALID_STATUS', 400);
      }

      review.status = 'acknowledged';
      review.acknowledgedAt = new Date();
      await review.save();

      return {
        success: true,
        data: review.toJSON() as IReview,
        message: 'Review acknowledged successfully',
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to acknowledge review', 'ACKNOWLEDGE_ERROR', 500);
    }
  }

  /**
   * Get pending reviews for a cycle
   */
  async getPendingReviewsByCycle(
    cycleId: string
  ): Promise<IApiResponse<IReview[]>> {
    try {
      if (!Types.ObjectId.isValid(cycleId)) {
        throw new ReviewServiceError('Invalid cycle ID', 'INVALID_ID', 400);
      }

      const reviews = await Review.find({
        cycleId: new Types.ObjectId(cycleId),
        status: { $in: ['pending', 'in_progress'] },
      })
        .populate('cycleId')
        .sort({ createdAt: 1 })
        .lean();

      return {
        success: true,
        data: reviews as unknown as IReview[],
      };
    } catch (error) {
      if (error instanceof ReviewServiceError) throw error;
      throw new ReviewServiceError('Failed to get pending reviews', 'GET_ERROR', 500);
    }
  }
}

import { z } from 'zod';

// Import at the top - removed duplicate from end
