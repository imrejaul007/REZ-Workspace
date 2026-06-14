/**
 * ShiftSyncService
 *
 * Pulls shift gaps from REZ via RezMerchantClient and upserts them as DRAFT
 * job postings on RestoPapa. The merchant must review and publish them
 * manually — nothing goes live automatically.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RezMerchantClient } from '@restopapa/rez-client';
import type { RezShiftGap } from '@restopapa/rez-client';

export interface DraftJob {
  id: string;
  title: string;
  role: string;
  status: 'DRAFT' | 'PUBLISHED' | 'FILLED';
  source: 'manual' | 'rez_shift_sync';
  rezShiftDate?: string;
  merchantId: string;
}

@Injectable()
export class ShiftSyncService {
  private readonly logger = new Logger(ShiftSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rezMerchantClient: RezMerchantClient,
  ) {}

  /**
   * Fetch shift gaps from REZ and upsert as DRAFT jobs.
   *
   * Idempotent: if a DRAFT already exists for the same restaurant + role +
   * rezShiftDate it is updated rather than duplicated.
   *
   * @param rezMerchantId  REZ merchant UUID
   * @param restaurantId   RestoPapa restaurant ID (looked up via rezMerchantId)
   * @returns Array of created/updated draft jobs
   */
  async syncShiftGapsToJobs(
    rezMerchantId: string,
    restaurantId: string,
  ): Promise<DraftJob[]> {
    const gaps = await this.rezMerchantClient.getShiftGaps(rezMerchantId);

    if (!gaps.length) {
      this.logger.log(`No shift gaps found for merchant ${rezMerchantId}`);
      return [];
    }

    const draftJobs: DraftJob[] = [];
    const validTill = this.defaultValidTill();

    for (const gap of gaps) {
      try {
        const job = await this.upsertDraftJob(restaurantId, rezMerchantId, gap, validTill);
        draftJobs.push(this.toDto(job));
      } catch (err: unknown) {
        this.logger.error(
          `Failed to upsert job for gap ${gap.role} on ${gap.startTime}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.log(
      `Synced ${draftJobs.length} draft jobs for merchant ${rezMerchantId}`,
    );
    return draftJobs;
  }

  /**
   * Mark a job as FILLED and record hire attribution.
   * Called by ShiftWebhookController when REZ confirms a hire.
   */
  async markJobFilled(
    jobId: string,
    restaurantId: string,
    hireAttribution: { candidateName: string; candidatePhone: string; startDate: string },
  ): Promise<DraftJob> {
    const job = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FILLED',
        description: this.appendHireNote(hireAttribution),
      },
    });

    return this.toDto(job);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async upsertDraftJob(
    restaurantId: string,
    rezMerchantId: string,
    gap: RezShiftGap,
    validTill: Date,
  ) {
    const shiftDate = gap.startTime ? gap.startTime.split('T')[0] : null;
    const title = `${gap.role} needed${shiftDate ? ` — ${shiftDate}` : ''}`;

    // Try to find an existing DRAFT for this restaurant + role + date
    const existing = await this.prisma.job.findFirst({
      where: {
        restaurantId,
        rezMerchantId,
        rezShiftDate: shiftDate ?? undefined,
        source: 'rez_shift_sync',
        status: 'DRAFT',
        title,
      },
    });

    if (existing) {
      return this.prisma.job.update({
        where: { id: existing.id },
        data: {
          description: this.buildDescription(gap),
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.job.create({
      data: {
        restaurantId,
        title,
        description: this.buildDescription(gap),
        requirements: [gap.role],
        skills: [gap.role],
        location: gap.storeName ?? gap.storeId ?? 'On-site',
        jobType: 'Part-time',
        status: 'DRAFT',
        validTill,
        source: 'rez_shift_sync',
        rezMerchantId,
        rezShiftDate: shiftDate ?? undefined,
      },
    });
  }

  private buildDescription(gap: RezShiftGap): string {
    const lines = [
      `Role: ${gap.role}`,
      `Shift: ${gap.startTime} – ${gap.endTime}`,
      `Duration: ${gap.durationHours}h`,
      `Severity: ${gap.severity}`,
      '',
      'This job was auto-generated from a REZ shift gap. Review and publish when ready.',
    ];
    return lines.join('\n');
  }

  private appendHireNote(hire: {
    candidateName: string;
    candidatePhone: string;
    startDate: string;
  }): string {
    return `Hire confirmed: ${hire.candidateName} (${hire.candidatePhone}), starting ${hire.startDate}.`;
  }

  private defaultValidTill(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2-week default validity
    return d;
  }

  private toDto(job): DraftJob {
    return {
      id: job.id,
      title: job.title,
      role: job.requirements?.[0] ?? job.title,
      status: job.status as DraftJob['status'],
      source: (job.source as DraftJob['source']) ?? 'manual',
      rezShiftDate: job.rezShiftDate ?? undefined,
      merchantId: job.rezMerchantId ?? job.restaurantId,
    };
  }
}
