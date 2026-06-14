import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RetryQueueService } from './retry-queue.service';

/**
 * Retry Queue Controller
 *
 * Admin endpoints for managing retry jobs:
 * - View queue statistics
 * - Retry failed jobs
 * - Cleanup old jobs
 */
@Controller('retry-queue')
@UseGuards(JwtAuthGuard)
export class RetryQueueController {
  constructor(private readonly retryQueueService: RetryQueueService) {}

  /**
   * Get queue statistics
   */
  @Get('stats')
  async getStats() {
    const stats = await this.retryQueueService.getStats();
    return {
      success: true,
      ...stats,
    };
  }

  /**
   * Retry a failed job
   */
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param('id') jobId: string) {
    await this.retryQueueService.retryJob(jobId);
    return {
      success: true,
      message: `Job ${jobId} requeued for retry`,
    };
  }

  /**
   * Cleanup old completed/failed jobs
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanup(@Query('days') days?: string) {
    const daysOld = days ? parseInt(days, 10) : 7;
    const deleted = await this.retryQueueService.cleanupOldJobs(daysOld);
    return {
      success: true,
      deleted,
    };
  }
}
