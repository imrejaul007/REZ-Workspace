import logger from './utils/logger';

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ModerateJobDto, ModerationAction, ModerationPriority } from './dto/moderate-job.dto';
import { JobStatus, UserRole } from '@prisma/client';

export interface ModerationRecord {
  id: string;
  jobId: string;
  moderatorId: string;
  action: ModerationAction;
  moderatorNotes: string;
  feedback?: string;
  priority?: ModerationPriority;
  flagReasons?: string[];
  createdAt: Date;
  requiresFollowUp: boolean;
}

@Injectable()
export class JobModerationService {
  private moderationCache = new Map<string, ModerationRecord[]>(); // In-memory cache for moderation history
  private flaggedJobs = new Map<string, any>(); // Cache for flagged jobs

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async moderateJob(jobId: string, moderationData: ModerateJobDto, moderatorId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        applications: {
          include: {
            employee: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Create moderation record
    const moderationRecord: ModerationRecord = {
      id: `mod_${Date.now()}_${crypto.randomInt(100000000, 999999999)}`,
      jobId,
      moderatorId,
      action: moderationData.action,
      moderatorNotes: moderationData.moderatorNotes,
      feedback: moderationData.feedback,
      priority: moderationData.priority || ModerationPriority.MEDIUM,
      flagReasons: moderationData.flagReasons || [],
      createdAt: new Date(),
      requiresFollowUp: moderationData.requiresFollowUp || false,
    };

    // Store moderation history
    const existing = this.moderationCache.get(jobId) || [];
    existing.push(moderationRecord);
    this.moderationCache.set(jobId, existing);

    // Apply moderation action
    let updatedJob;
    switch (moderationData.action) {
      case ModerationAction.APPROVE:
        updatedJob = await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.OPEN },
          include: { restaurant: { include: { user: { include: { profile: true } } } } },
        });
        await this.notifyModerationDecision(job, moderationRecord, 'approved');
        break;

      case ModerationAction.REJECT:
        updatedJob = await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CLOSED },
          include: { restaurant: { include: { user: { include: { profile: true } } } } },
        });
        await this.notifyModerationDecision(job, moderationRecord, 'rejected');
        break;

      case ModerationAction.REQUEST_CHANGES:
        // Keep status as is but send feedback
        updatedJob = job;
        await this.notifyModerationDecision(job, moderationRecord, 'changes_requested');
        break;

      case ModerationAction.FLAG:
        this.flaggedJobs.set(jobId, {
          job,
          moderationRecord,
          flaggedAt: new Date(),
        });
        updatedJob = job;
        await this.notifyModerationDecision(job, moderationRecord, 'flagged');
        break;

      case ModerationAction.SUSPEND:
        updatedJob = await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CLOSED },
          include: { restaurant: { include: { user: { include: { profile: true } } } } },
        });
        await this.notifyModerationDecision(job, moderationRecord, 'suspended');
        break;

      default:
        updatedJob = job;
    }

    // Publish real-time moderation event
    await this.redisService.publish(
      `job:${jobId}:moderation`,
      JSON.stringify({
        type: 'job:moderated',
        data: {
          jobId,
          action: moderationData.action,
          moderatorNotes: moderationData.moderatorNotes,
          newStatus: updatedJob.status,
          timestamp: new Date(),
        },
      }),
    );

    return {
      job: updatedJob,
      moderationRecord,
      message: `Job ${moderationData.action.toLowerCase()} successfully`,
    };
  }

  async getJobsForModeration(filters?) {
    const where: unknown = {};

    // Filter by status if specified
    if (filters?.status) {
      where.status = filters.status;
    } else {
      // Default to jobs that might need moderation
      where.status = { in: [JobStatus.OPEN, 'PENDING'] };
    }

    // Filter by creation date (recent jobs first)
    if (filters?.since) {
      where.createdAt = { gte: new Date(filters.since) };
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        applications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            employee: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.skip || 0,
    });

    // Enhance with moderation data
    const enhancedJobs = jobs.map(job => ({
      ...job,
      moderationHistory: this.moderationCache.get(job.id) || [],
      isFlagged: this.flaggedJobs.has(job.id),
      flagDetails: this.flaggedJobs.get(job.id) || null,
      moderationScore: this.calculateModerationScore(job),
    }));

    return {
      jobs: enhancedJobs,
      total: enhancedJobs.length,
      flaggedCount: this.flaggedJobs.size,
    };
  }

  async getModerationHistory(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const history = this.moderationCache.get(jobId) || [];
    
    return {
      job,
      moderationHistory: history,
      totalModerations: history.length,
      lastModeration: history[history.length - 1] || null,
      isFlagged: this.flaggedJobs.has(jobId),
      flagDetails: this.flaggedJobs.get(jobId) || null,
    };
  }

  async getFlaggedJobs() {
    const flagged = Array.from(this.flaggedJobs.entries()).map(([jobId, data]) => ({
      jobId,
      ...data,
    }));

    return {
      flaggedJobs: flagged,
      total: flagged.length,
    };
  }

  async resolveFlaggedJob(jobId: string, resolution: 'approved' | 'rejected' | 'escalated', moderatorId: string, notes: string) {
    if (!this.flaggedJobs.has(jobId)) {
      throw new NotFoundException('Flagged job not found');
    }

    const flaggedData = this.flaggedJobs.get(jobId);
    
    // Create resolution record
    const resolutionRecord: ModerationRecord = {
      id: `res_${Date.now()}_${crypto.randomInt(100000000, 999999999)}`,
      jobId,
      moderatorId,
      action: resolution === 'approved' ? ModerationAction.APPROVE : ModerationAction.REJECT,
      moderatorNotes: `Flag resolved: ${notes}`,
      createdAt: new Date(),
      requiresFollowUp: resolution === 'escalated',
    };

    // Update moderation history
    const existing = this.moderationCache.get(jobId) || [];
    existing.push(resolutionRecord);
    this.moderationCache.set(jobId, existing);

    // Update job status if needed
    if (resolution === 'approved') {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.OPEN },
      });
    } else if (resolution === 'rejected') {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.CLOSED },
      });
    }

    // Remove from flagged if resolved
    if (resolution !== 'escalated') {
      this.flaggedJobs.delete(jobId);
    }

    return {
      resolution,
      resolutionRecord,
      message: `Flagged job ${resolution} successfully`,
    };
  }

  async getModerationStats() {
    const totalJobs = await this.prisma.job.count();
    const activeJobs = await this.prisma.job.count({
      where: { status: JobStatus.OPEN },
    });
    const closedJobs = await this.prisma.job.count({
      where: { status: JobStatus.CLOSED },
    });

    // Calculate moderation stats from cache
    let totalModerations = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let flaggedCount = this.flaggedJobs.size;

    for (const [jobId, history] of this.moderationCache.entries()) {
      totalModerations += history.length;
      for (const record of history) {
        if (record.action === ModerationAction.APPROVE) approvedCount++;
        if (record.action === ModerationAction.REJECT) rejectedCount++;
      }
    }

    return {
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs,
        flagged: flaggedCount,
      },
      moderations: {
        total: totalModerations,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingReview: flaggedCount,
      },
      moderationRate: totalJobs > 0 ? ((totalModerations / totalJobs) * 100).toFixed(1) : 0,
    };
  }

  private calculateModerationScore(job): number {
    let score = 100; // Start with perfect score

    // Deduct for missing information
    if (!job.description || job.description.length < 50) score -= 20;
    if (!job.salaryMin && !job.salaryMax) score -= 15;
    if (!job.requirements || job.requirements.length === 0) score -= 10;
    if (!job.skills || job.skills.length === 0) score -= 10;

    // Deduct for suspicious patterns
    if (job.title.includes('$$$') || job.title.includes('URGENT!!!')) score -= 25;
    if (job.description.includes('guaranteed') && job.description.includes('money')) score -= 30;
    
    // Add points for completeness
    if (job.validTill && new Date(job.validTill) > new Date()) score += 5;
    if (job.requirements && job.requirements.length > 3) score += 5;
    if (job.skills && job.skills.length > 2) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private async notifyModerationDecision(job, moderationRecord: ModerationRecord, decision: string) {
    // Send notification to restaurant
    await this.redisService.publish(
      `restaurant:${job.restaurantId}`,
      JSON.stringify({
        type: 'job:moderation_decision',
        data: {
          jobId: job.id,
          jobTitle: job.title,
          decision,
          moderatorNotes: moderationRecord.moderatorNotes,
          feedback: moderationRecord.feedback,
          timestamp: new Date(),
        },
      }),
    );

    // Log moderation action
    logger.info(`Job ${job.id} (${job.title}) ${decision} by moderator ${moderationRecord.moderatorId}`);
  }

  async bulkModerateJobs(jobIds: string[], action: ModerationAction, notes: string, moderatorId: string) {
    const results = [];

    for (const jobId of jobIds) {
      try {
        const result = await this.moderateJob(jobId, {
          action,
          moderatorNotes: notes,
        } as ModerateJobDto, moderatorId);
        results.push({ jobId, success: true, ...result });
      } catch (error) {
        results.push({ jobId, success: false, error: (error as Error).message });
      }
    }

    return {
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
  }
}