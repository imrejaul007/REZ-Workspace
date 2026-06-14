/**
 * ShiftWebhookController
 *
 * Two endpoints:
 *
 * 1. POST /jobs/sync-shifts
 *    Authenticated RestoPapa merchants that are REZ-verified can trigger
 *    an on-demand shift gap sync. Creates DRAFT jobs for review.
 *
 * 2. POST /webhooks/rez/hire-confirmed
 *    Internal webhook called by REZ when a hire is confirmed.
 *    Marks the matching RestoPapa job as FILLED.
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Request,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftSyncService, DraftJob } from './shift-sync.service';
import { ConfigService } from '@nestjs/config';

interface SyncShiftsResponse {
  draftsCreated: number;
  jobs: DraftJob[];
}

interface HireConfirmedBody {
  rezMerchantId: string;
  jobId: string;
  candidateName: string;
  candidatePhone: string;
  role: string;
  startDate: string;
}

@Controller()
export class ShiftWebhookController {
  private readonly logger = new Logger(ShiftWebhookController.name);

  constructor(
    private readonly shiftSyncService: ShiftSyncService,
    private readonly config: ConfigService,
  ) {}

  /**
   * POST /jobs/sync-shifts
   *
   * The calling merchant must:
   * - Be authenticated via RestoPapa JWT
   * - Have `rezVerified: true` (set during the rez-bridge SSO flow)
   * - Have a restaurant profile with a linked rezMerchantId
   */
  @Post('jobs/sync-shifts')
  @UseGuards(JwtAuthGuard)
  async syncShifts(@Request() req): Promise<SyncShiftsResponse> {
    if (req.user.role !== 'RESTAURANT') {
      throw new BadRequestException('Only restaurant accounts can sync shifts');
    }

    const rezMerchantId: string | undefined = req.user?.restaurant?.rezMerchantId;
    if (!rezMerchantId) {
      throw new BadRequestException(
        'Restaurant is not linked to a REZ merchant account. Complete REZ SSO first.',
      );
    }

    const restaurantId: string = req.user.restaurant.id;

    this.logger.log(`Shift sync triggered by ${restaurantId} (REZ: ${rezMerchantId})`);

    const jobs = await this.shiftSyncService.syncShiftGapsToJobs(rezMerchantId, restaurantId);

    return { draftsCreated: jobs.length, jobs };
  }

  /**
   * POST /webhooks/rez/hire-confirmed
   *
   * Called by REZ when a hire sourced from RestoPapa is confirmed.
   * Validates X-Internal-Token before processing.
   */
  @Post('webhooks/rez/hire-confirmed')
  async hireConfirmed(
    @Headers('x-internal-token') token: string | undefined,
    @Body() body: HireConfirmedBody,
  ): Promise<{ success: boolean; job: DraftJob }> {
    const expectedToken = this.config.get<string>('INTERNAL_BRIDGE_TOKEN');
    if (!expectedToken || token !== expectedToken) {
      throw new UnauthorizedException('Invalid internal token');
    }

    const { rezMerchantId, jobId, candidateName, candidatePhone, role, startDate } = body;

    if (!jobId || !rezMerchantId || !candidateName || !startDate) {
      throw new BadRequestException('Missing required fields: jobId, rezMerchantId, candidateName, startDate');
    }

    this.logger.log(`Hire confirmed for job ${jobId} — candidate: ${candidateName}`);

    // We pass restaurantId as empty string; markJobFilled only needs it for
    // a future ownership check. The jobId uniquely identifies the record.
    const job = await this.shiftSyncService.markJobFilled(jobId, rezMerchantId, {
      candidateName,
      candidatePhone,
      startDate,
    });

    return { success: true, job };
  }
}
