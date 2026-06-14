import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingService } from './training.service';
import { CourseFilters, CourseLevel, MarkCompleteDto } from './training.dto';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /**
   * GET /training/feed
   * JWT-protected. Returns personalised course feed for authenticated user.
   * If user has a linked REZ merchant account (rezMerchantId claim in JWT),
   * gap-driven recommendations are included.
   */
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(@Request() req) {
    const userId: string = req.user.id;
    const rezMerchantId: string | undefined = req.user.rezMerchantId;
    return this.trainingService.getPersonalizedFeed(userId, rezMerchantId);
  }

  /**
   * GET /training/courses
   * Public. Returns full catalog with optional ?tag= and ?level= filters.
   */
  @Get('courses')
  getCourses(
    @Query('tag') tag?: string,
    @Query('level') level?: CourseLevel,
  ) {
    const filters: CourseFilters = {};
    if (tag) filters.tag = tag;
    if (level) filters.level = level;
    return this.trainingService.getFilteredCourses(filters);
  }

  /**
   * GET /training/courses/:slug
   * Public. Returns detail for a single course.
   */
  @Get('courses/:slug')
  getCourseDetail(@Param('slug') slug: string) {
    return this.trainingService.getCourseDetail(slug);
  }

  /**
   * POST /training/complete
   * JWT-protected. Marks a course as completed for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Post('complete')
  markComplete(@Request() req, @Body() dto: MarkCompleteDto) {
    return this.trainingService.markComplete(req.user.id, dto.courseSlug);
  }

  /**
   * GET /training/certifications
   * JWT-protected. Lists all earned certifications for the authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('certifications')
  getCertifications(@Request() req) {
    return this.trainingService.getCertifications(req.user.id);
  }
}
