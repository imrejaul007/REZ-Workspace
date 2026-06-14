import { Sponsor, ISponsorDocument } from '../models';
import { AddSponsorRequest, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { recordSponsorAdded, sponsorImpressions, sponsorClicks } from '../utils/metrics';

export class SponsorService {
  /**
   * Create a new sponsor
   */
  async createSponsor(videoId: string, data: AddSponsorRequest): Promise<ISponsorDocument> {
    logger.info('Creating sponsor', { videoId, advertiserId: data.advertiserId });

    const sponsor = new Sponsor({
      videoId,
      advertiserId: data.advertiserId,
      placement: data.placement,
      bid: data.bid,
      startDate: data.startDate,
      endDate: data.endDate,
      impressions: 0,
      clicks: 0,
      status: 'active',
    });

    await sponsor.save();
    recordSponsorAdded(data.placement, 'active');

    logger.info('Sponsor created successfully', { sponsorId: sponsor._id });
    return sponsor;
  }

  /**
   * Get sponsor by ID
   */
  async getSponsorById(id: string): Promise<ISponsorDocument | null> {
    return Sponsor.findById(id);
  }

  /**
   * Get sponsor or throw error
   */
  async getSponsorOrFail(id: string): Promise<ISponsorDocument> {
    const sponsor = await this.getSponsorById(id);
    if (!sponsor) {
      const error = new Error(`Sponsor not found: ${id}`);
      (error as any).code = 'SPONSOR_NOT_FOUND';
      throw error;
    }
    return sponsor;
  }

  /**
   * List sponsors for a video
   */
  async listSponsorsByVideo(
    videoId: string,
    params?: {
      status?: string;
      placement?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ISponsorDocument>> {
    const { status, placement, page = 1, limit = 20 } = params || {};

    const query: Record<string, any> = { videoId };
    if (status) query.status = status;
    if (placement) query.placement = placement;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Sponsor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sponsor.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List sponsors by advertiser
   */
  async listSponsorsByAdvertiser(
    advertiserId: string,
    params?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ISponsorDocument>> {
    const { status, page = 1, limit = 20 } = params || {};

    const query: Record<string, any> = { advertiserId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Sponsor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sponsor.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update sponsor
   */
  async updateSponsor(
    id: string,
    data: Partial<{
      placement: string;
      bid: { amount: number; currency: string; type: string };
      startDate: Date;
      endDate: Date;
      status: string;
    }>
  ): Promise<ISponsorDocument> {
    logger.info('Updating sponsor', { sponsorId: id });

    const sponsor = await this.getSponsorOrFail(id);
    Object.assign(sponsor, data);
    await sponsor.save();

    logger.info('Sponsor updated successfully', { sponsorId: id });
    return sponsor;
  }

  /**
   * Pause sponsor
   */
  async pauseSponsor(id: string): Promise<ISponsorDocument> {
    logger.info('Pausing sponsor', { sponsorId: id });

    const sponsor = await this.getSponsorOrFail(id);
    sponsor.status = 'paused';
    await sponsor.save();

    logger.info('Sponsor paused successfully', { sponsorId: id });
    return sponsor;
  }

  /**
   * Resume sponsor
   */
  async resumeSponsor(id: string): Promise<ISponsorDocument> {
    logger.info('Resuming sponsor', { sponsorId: id });

    const sponsor = await this.getSponsorOrFail(id);
    sponsor.status = 'active';
    await sponsor.save();

    logger.info('Sponsor resumed successfully', { sponsorId: id });
    return sponsor;
  }

  /**
   * Delete sponsor
   */
  async deleteSponsor(id: string): Promise<void> {
    logger.info('Deleting sponsor', { sponsorId: id });

    const sponsor = await this.getSponsorOrFail(id);
    await Sponsor.deleteOne({ _id: id });

    logger.info('Sponsor deleted successfully', { sponsorId: id });
  }

  /**
   * Get active sponsors for a video
   */
  async getActiveSponsorsForVideo(videoId: string): Promise<ISponsorDocument[]> {
    return Sponsor.findActiveByVideo(videoId);
  }

  /**
   * Record impression
   */
  async recordImpression(id: string, count: number = 1): Promise<void> {
    const sponsor = await this.getSponsorOrFail(id);
    sponsor.impressions += count;
    await sponsor.save();

    sponsorImpressions.inc({ advertiserId: sponsor.advertiserId, placement: sponsor.placement }, count);
  }

  /**
   * Record click
   */
  async recordClick(id: string): Promise<void> {
    const sponsor = await this.getSponsorOrFail(id);
    sponsor.clicks += 1;
    await sponsor.save();

    sponsorClicks.inc({ advertiserId: sponsor.advertiserId, placement: sponsor.placement });
  }

  /**
   * Get sponsor statistics
   */
  async getSponsorStats(id: string): Promise<{
    impressions: number;
    clicks: number;
    ctr: number;
    effectiveCpc: number;
  }> {
    const sponsor = await this.getSponsorOrFail(id);

    const ctr = sponsor.impressions > 0 ? (sponsor.clicks / sponsor.impressions) * 100 : 0;
    const totalCost = sponsor.impressions * (sponsor.bid.amount / 1000);
    const effectiveCpc = sponsor.clicks > 0 ? totalCost / sponsor.clicks : 0;

    return {
      impressions: sponsor.impressions,
      clicks: sponsor.clicks,
      ctr,
      effectiveCpc,
    };
  }

  /**
   * Get top sponsors by impressions
   */
  async getTopSponsorsByImpressions(limit: number = 10): Promise<ISponsorDocument[]> {
    return Sponsor.find({ status: 'active' })
      .sort({ impressions: -1 })
      .limit(limit);
  }

  /**
   * Get sponsors by placement type
   */
  async getSponsorsByPlacement(
    placement: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ISponsorDocument>> {
    const { page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Sponsor.find({ placement, status: 'active' }).sort({ 'bid.amount': -1 }).skip(skip).limit(limit),
      Sponsor.countDocuments({ placement, status: 'active' }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const sponsorService = new SponsorService();
export default sponsorService;