import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JobModerationService } from './job-moderation.service';
import { ModerateJobDto, ModerationAction } from './dto/moderate-job.dto';
import { UserRole } from '@prisma/client';

@ApiTags('job-moderation')
@Controller('job-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class JobModerationController {
  constructor(private readonly jobModerationService: JobModerationService) {}

  @Post(':jobId/moderate')
  @ApiOperation({ summary: 'Moderate a job posting' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job moderated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job not found' })
  async moderateJob(
    @Param('jobId') jobId: string,
    @Body() moderationData: ModerateJobDto,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobModerationService.moderateJob(jobId, moderationData, user.id);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get jobs pending moderation' })
  @ApiQuery({ name: 'status', required: false, type: 'string' })
  @ApiQuery({ name: 'since', required: false, type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'skip', required: false, type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Moderation queue retrieved successfully' })
  async getModerationQueue(@Query() filters) {
    return this.jobModerationService.getJobsForModeration(filters);
  }

  @Get('flagged')
  @ApiOperation({ summary: 'Get all flagged jobs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flagged jobs retrieved successfully' })
  async getFlaggedJobs() {
    return this.jobModerationService.getFlaggedJobs();
  }

  @Post('flagged/:jobId/resolve')
  @ApiOperation({ summary: 'Resolve a flagged job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flagged job resolved successfully' })
  async resolveFlaggedJob(
    @Param('jobId') jobId: string,
    @Body() resolutionData: {
      resolution: 'approved' | 'rejected' | 'escalated';
      notes: string;
    },
    @Req() req,
  ) {
    const { user } = req;
    return this.jobModerationService.resolveFlaggedJob(
      jobId,
      resolutionData.resolution,
      user.id,
      resolutionData.notes,
    );
  }

  @Get(':jobId/history')
  @ApiOperation({ summary: 'Get moderation history for a job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Moderation history retrieved successfully' })
  async getModerationHistory(@Param('jobId') jobId: string) {
    return this.jobModerationService.getModerationHistory(jobId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Moderation statistics retrieved successfully' })
  async getModerationStats() {
    return this.jobModerationService.getModerationStats();
  }

  @Post('bulk-moderate')
  @ApiOperation({ summary: 'Bulk moderate multiple jobs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bulk moderation completed' })
  async bulkModerate(
    @Body() bulkData: {
      jobIds: string[];
      action: ModerationAction;
      notes: string;
    },
    @Req() req,
  ) {
    const { user } = req;
    return this.jobModerationService.bulkModerateJobs(
      bulkData.jobIds,
      bulkData.action,
      bulkData.notes,
      user.id,
    );
  }

  @Get('quality-report')
  @ApiOperation({ summary: 'Generate job quality report' })
  @ApiQuery({ name: 'days', required: false, type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quality report generated successfully' })
  async getQualityReport(@Query('days') days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const jobs = await this.jobModerationService.getJobsForModeration({
      since: since.toISOString(),
      limit: 1000,
    });

    // Calculate quality metrics
    const qualityMetrics = {
      totalJobs: jobs.jobs.length,
      averageScore: jobs.jobs.reduce((sum, job) => sum + job.moderationScore, 0) / jobs.jobs.length,
      highQuality: jobs.jobs.filter(job => job.moderationScore >= 80).length,
      mediumQuality: jobs.jobs.filter(job => job.moderationScore >= 60 && job.moderationScore < 80).length,
      lowQuality: jobs.jobs.filter(job => job.moderationScore < 60).length,
      flaggedCount: jobs.flaggedCount,
      topIssues: this.analyzeCommonIssues(jobs.jobs),
      recommendations: this.generateRecommendations(jobs.jobs),
    };

    return {
      period: `Last ${days} days`,
      generatedAt: new Date(),
      metrics: qualityMetrics,
    };
  }

  @Post('auto-moderate')
  @ApiOperation({ summary: 'Run automated moderation checks' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Auto-moderation completed' })
  async runAutoModeration(@Req() req) {
    const { user } = req;
    
    const jobs = await this.jobModerationService.getJobsForModeration({ limit: 100 });
    const autoModerationResults = [];

    for (const job of jobs.jobs) {
      // Auto-approve high-quality jobs
      if (job.moderationScore >= 90 && !job.isFlagged && job.moderationHistory.length === 0) {
        const result = await this.jobModerationService.moderateJob(
          job.id,
          {
            action: ModerationAction.APPROVE,
            moderatorNotes: 'Auto-approved: High quality score and no previous issues',
          } as ModerateJobDto,
          `auto-moderator-${user.id}`,
        );
        autoModerationResults.push({ jobId: job.id, action: 'auto-approved', score: job.moderationScore });
      }
      
      // Auto-flag low-quality jobs
      else if (job.moderationScore <= 30 && !job.isFlagged) {
        const result = await this.jobModerationService.moderateJob(
          job.id,
          {
            action: ModerationAction.FLAG,
            moderatorNotes: 'Auto-flagged: Low quality score detected',
            flagReasons: ['low-quality-content', 'incomplete-information'],
            priority: 'HIGH',
          } as ModerateJobDto,
          `auto-moderator-${user.id}`,
        );
        autoModerationResults.push({ jobId: job.id, action: 'auto-flagged', score: job.moderationScore });
      }
    }

    return {
      processed: jobs.jobs.length,
      autoModerated: autoModerationResults.length,
      results: autoModerationResults,
      summary: {
        approved: autoModerationResults.filter(r => r.action === 'auto-approved').length,
        flagged: autoModerationResults.filter(r => r.action === 'auto-flagged').length,
      },
    };
  }

  private analyzeCommonIssues(jobs: unknown[]) {
    const issues = {
      'missing-salary': 0,
      'short-description': 0,
      'no-requirements': 0,
      'no-skills': 0,
      'suspicious-content': 0,
    };

    jobs.forEach(job => {
      if (!job.salaryMin && !job.salaryMax) issues['missing-salary']++;
      if (!job.description || job.description.length < 50) issues['short-description']++;
      if (!job.requirements || job.requirements.length === 0) issues['no-requirements']++;
      if (!job.skills || job.skills.length === 0) issues['no-skills']++;
      if (job.title.includes('$$$') || job.title.includes('URGENT!!!')) issues['suspicious-content']++;
    });

    return Object.entries(issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  private generateRecommendations(jobs: unknown[]) {
    const recommendations = [];
    
    const averageScore = jobs.reduce((sum, job) => sum + job.moderationScore, 0) / jobs.length;
    
    if (averageScore < 70) {
      recommendations.push('Consider implementing stricter job posting guidelines');
    }
    
    const flaggedRate = jobs.filter(job => job.isFlagged).length / jobs.length;
    if (flaggedRate > 0.1) {
      recommendations.push('High flag rate detected - review posting requirements');
    }
    
    const incompletePosts = jobs.filter(job => job.moderationScore < 60).length;
    if (incompletePosts > jobs.length * 0.3) {
      recommendations.push('Many incomplete posts - add validation checks');
    }

    return recommendations;
  }
}