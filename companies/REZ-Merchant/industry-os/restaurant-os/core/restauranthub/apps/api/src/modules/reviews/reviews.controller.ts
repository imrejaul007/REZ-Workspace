import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async listReviews(@Request() req) {
    return this.reviewsService.listReviews(req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.reviewsService.getStats(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Request() req,
    @Body() body: { rating: number; comment?: string; orderId?: string },
  ) {
    this.logger.log(`User ${req.user.id} submitting review`);
    return this.reviewsService.createReview(req.user.id, body);
  }
}
