/**
 * AnalyticsController — REST endpoints for the analytics module.
 *
 * GET /analytics/dashboard  (JWT auth) — own KPIs + peer benchmarks
 * GET /analytics/gaps       (JWT auth) — top 3 operational gaps with training slugs
 * GET /analytics/peer-group?city&cuisine (public) — peer group aggregate stats
 *
 * Auth: uses the REZ Merchant JWT strategy established in Phase 1/2.
 */

import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import type { AnalyticsDashboard, OperationalGap, PeerGroupStatsResponse } from './analytics.dto';
import { REZ_MERCHANT_STRATEGY } from '../auth/rez-bridge/rez-merchant.strategy';
import type { RezValidatedPrincipal } from '../auth/rez-bridge/rez-merchant.strategy';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/dashboard
   * Returns the authenticated merchant's own KPIs merged with peer benchmarks.
   */
  @UseGuards(AuthGuard(REZ_MERCHANT_STRATEGY))
  @Get('dashboard')
  async getDashboard(@Req() req: Request): Promise<AnalyticsDashboard> {
    const principal = req.user as RezValidatedPrincipal;
    const rezMerchantId = principal.rezMerchantId ?? principal.rezUserId;
    return this.analyticsService.getMerchantDashboard(rezMerchantId);
  }

  /**
   * GET /analytics/gaps
   * Returns the top 3 operational gaps where this merchant is >5% below peer avg.
   * Each gap includes a trainingModuleSlug for Agent A7 to link to training content.
   */
  @UseGuards(AuthGuard(REZ_MERCHANT_STRATEGY))
  @Get('gaps')
  async getTopGaps(@Req() req: Request): Promise<OperationalGap[]> {
    const principal = req.user as RezValidatedPrincipal;
    const rezMerchantId = principal.rezMerchantId ?? principal.rezUserId;
    return this.analyticsService.getTopGaps(rezMerchantId);
  }

  /**
   * GET /analytics/peer-group?city=bangalore&cuisine=indian
   * Public endpoint — returns anonymized aggregate stats for a peer group.
   * No auth required.
   */
  @Get('peer-group')
  async getPeerGroup(
    @Query('city') city: string,
    @Query('cuisine') cuisine: string,
  ): Promise<PeerGroupStatsResponse> {
    if (!city || !cuisine) {
      throw new BadRequestException('Query params "city" and "cuisine" are required');
    }

    const safe = /^[a-z0-9 \-]+$/i;
    if (!safe.test(city) || !safe.test(cuisine)) {
      throw new BadRequestException('Invalid city or cuisine value');
    }

    return this.analyticsService.getPeerGroupStats(
      city.toLowerCase().trim(),
      cuisine.toLowerCase().trim(),
    );
  }
}
