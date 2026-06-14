import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReputationService } from './reputation.service';

/**
 * Review submission DTO
 */
class SubmitReviewDto {
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  deliveryRating?: number;
  comment?: string;
  photos?: string[];
}

/**
 * Update review DTO
 */
class UpdateReviewDto {
  rating?: number;
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  deliveryRating?: number;
  comment?: string;
  photos?: string[];
}

/**
 * Respond to review DTO
 */
class RespondToReviewDto {
  response: string;
}

/**
 * Query parameters for fetching reviews
 */
class ReviewQueryDto {
  page?: number = 1;
  limit?: number = 20;
  minRating?: number;
  maxRating?: number;
  sentiment?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Reputation Controller
 *
 * REST endpoints for reputation management:
 * - Submit/get/update/delete reviews
 * - Get rating summaries
 * - Owner responses
 * - Analytics and competitive analysis
 */
@Controller('reputation')
@UseGuards(JwtAuthGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  // ==========================================
  // REVIEW ENDPOINTS
  // ==========================================

  /**
   * Submit a new review
   */
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  async submitReview(@Body() dto: SubmitReviewDto) {
    const review = await this.reputationService.submitReview(dto);
    return {
      success: true,
      review,
    };
  }

  /**
   * Get reviews for a restaurant
   */
  @Get('reviews/:restaurantId')
  async getReviews(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ReviewQueryDto
  ) {
    const result = await this.reputationService.getReviews(restaurantId, {
      page: query.page,
      limit: query.limit,
      minRating: query.minRating,
      maxRating: query.maxRating,
      sentiment: query.sentiment,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      reviews: result.reviews,
      total: result.total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(result.total / (query.limit || 20)),
    };
  }

  /**
   * Get single review
   */
  @Get('reviews/single/:reviewId')
  async getReview(@Param('reviewId') reviewId: string) {
    const review = await this.reputationService.getReviewById(reviewId);
    return {
      success: true,
      review,
    };
  }

  /**
   * Update a review
   */
  @Put('reviews/:reviewId')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Query('customerId') customerId: string,
    @Body() dto: UpdateReviewDto
  ) {
    const review = await this.reputationService.updateReview(reviewId, customerId, dto);
    return {
      success: true,
      review,
    };
  }

  /**
   * Delete a review
   */
  @Delete('reviews/:reviewId')
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @Query('customerId') customerId: string
  ) {
    await this.reputationService.deleteReview(reviewId, customerId);
    return {
      success: true,
      message: 'Review deleted',
    };
  }

  /**
   * Respond to a review (restaurant owner)
   */
  @Post('reviews/:reviewId/respond')
  @HttpCode(HttpStatus.OK)
  async respondToReview(
    @Param('reviewId') reviewId: string,
    @Query('ownerId') ownerId: string,
    @Body() dto: RespondToReviewDto
  ) {
    const review = await this.reputationService.respondToReview(reviewId, dto.response, ownerId);
    return {
      success: true,
      review,
    };
  }

  // ==========================================
  // RATING SUMMARY
  // ==========================================

  /**
   * Get rating summary for a restaurant
   */
  @Get('summary/:restaurantId')
  async getRatingSummary(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    const summary = await this.reputationService.getRatingSummary(restaurantId, period);
    return {
      success: true,
      summary,
    };
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get review analytics
   */
  @Get('analytics/:restaurantId')
  async getAnalytics(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    const analytics = await this.reputationService.getAnalytics(restaurantId, period);
    return {
      success: true,
      analytics,
    };
  }

  // ==========================================
  // COMPETITIVE ANALYSIS
  // ==========================================

  /**
   * Compare with competitors
   */
  @Get('compare/:restaurantId')
  async compareWithCompetitors(
    @Param('restaurantId') restaurantId: string,
    @Query('category') category?: string
  ) {
    const comparison = await this.reputationService.compareWithCompetitors(restaurantId, category);
    return {
      success: true,
      comparison,
    };
  }
}
