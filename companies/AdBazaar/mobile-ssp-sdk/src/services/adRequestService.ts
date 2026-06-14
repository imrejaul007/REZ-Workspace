import { v4 as uuidv4 } from 'uuid';
import { AdRequestModel, AdRequestDocument, PlacementModel } from '../models/index.js';
import { publisherService } from './publisherService.js';
import { config } from '../config/index.js';
import type { AdRequest, AdResponse, AdRequestInput, AdRequestStatus, Platform, AdFormat } from '../types/index.js';

export class AdRequestService {
  /**
   * Create a new ad request
   */
  async createRequest(input: AdRequestInput): Promise<{ request: AdRequest; ad?: AdResponse }> {
    const requestId = `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const startTime = Date.now();

    // Get placement details
    const placement = await placementService.getById(input.placementId);
    if (!placement) {
      throw new Error('Placement not found');
    }

    if (placement.status !== 'active') {
      throw new Error('Placement is not active');
    }

    // Create ad request record
    const request = await AdRequestModel.create({
      requestId,
      placementId: input.placementId,
      appId: input.appId,
      publisherId: input.publisherId,
      platform: input.platform,
      adFormat: input.adFormat,
      deviceId: input.deviceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      language: input.language,
      country: input.country,
      timestamp: new Date(),
      status: 'pending',
    });

    const responseTime = Date.now() - startTime;

    // Simulate ad fill (in production, this would call DSP/SSP integration)
    const ad = await this.simulateAdFill(request, placement, input);

    if (ad) {
      // Update request status to filled
      request.status = 'filled';
      request.responseTime = responseTime;
      request.filledAt = new Date();
      await request.save();

      // Update publisher stats
      await publisherService.updateStats(input.publisherId, {
        impressions: 0,
        clicks: 0,
        earnings: 0,
      });

      return { request: this.toAdRequest(request), ad };
    } else {
      // No fill
      request.status = 'no-fill';
      request.noFillReason = 'No suitable ads available';
      request.responseTime = responseTime;
      await request.save();

      return { request: this.toAdRequest(request) };
    }
  }

  /**
   * Simulate ad fill (placeholder for real SSP integration)
   */
  private async simulateAdFill(
    request: AdRequestDocument,
    placement: any,
    input: AdRequestInput
  ): Promise<AdResponse | null> {
    // Simulate 80% fill rate
    if (Math.random() > 0.8) {
      return null;
    }

    const adId = `ad_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const adType = this.getAdType(placement.adFormat);

    return {
      requestId: request.requestId,
      adId,
      adType,
      adFormat: placement.adFormat,
      creativeUrl: this.getCreativeUrl(adType, placement.adFormat),
      clickUrl: `https://click.adbazaar.com/track?ad=${adId}&req=${request.requestId}`,
      impressionUrl: `https://imp.adbazaar.com/track?ad=${adId}&req=${request.requestId}`,
      width: placement.width || this.getDefaultWidth(placement.adFormat),
      height: placement.height || this.getDefaultHeight(placement.adFormat),
      duration: adType === 'video' ? 15 : undefined,
      skipable: adType === 'video',
      vpaid: adType === 'video',
      ecpm: placement.ecpm,
      currency: 'USD',
      fallback: false,
    };
  }

  /**
   * Get ad type based on format
   */
  private getAdType(adFormat: AdFormat): 'display' | 'video' | 'native' | 'rich-media' {
    switch (adFormat) {
      case 'interstitial':
        return Math.random() > 0.5 ? 'video' : 'display';
      case 'rewarded':
        return 'video';
      case 'native':
        return 'native';
      default:
        return 'display';
    }
  }

  /**
   * Get creative URL (placeholder)
   */
  private getCreativeUrl(adType: string, adFormat: AdFormat): string {
    const creatives = {
      display: 'https://creative.adbazaar.com/creatives/display/300x250.png',
      video: 'https://creative.adbazaar.com/creatives/video/rewarded_15s.mp4',
      native: 'https://creative.adbazaar.com/creatives/native/card.png',
      'rich-media': 'https://creative.adbazaar.com/creatives/rich/expandable.html',
    };
    return creatives[adType as keyof typeof creatives] || creatives.display;
  }

  /**
   * Get default width for ad format
   */
  private getDefaultWidth(adFormat: AdFormat): number {
    switch (adFormat) {
      case 'banner':
        return 320;
      case 'interstitial':
        return 320;
      case 'native':
        return 320;
      case 'rewarded':
        return 320;
      case 'app-open':
        return 320;
      default:
        return 300;
    }
  }

  /**
   * Get default height for ad format
   */
  private getDefaultHeight(adFormat: AdFormat): number {
    switch (adFormat) {
      case 'banner':
        return 50;
      case 'interstitial':
        return 480;
      case 'native':
        return 250;
      case 'rewarded':
        return 480;
      case 'app-open':
        return 480;
      default:
        return 250;
    }
  }

  /**
   * Get request by ID
   */
  async getById(requestId: string): Promise<AdRequest | null> {
    const request = await AdRequestModel.findOne({ requestId });
    return request ? this.toAdRequest(request) : null;
  }

  /**
   * Get requests by publisher
   */
  async getByPublisher(
    publisherId: string,
    options: { page?: number; limit?: number; status?: AdRequestStatus }
  ): Promise<{ requests: AdRequest[]; total: number }> {
    const { page = 1, limit = 50, status } = options;

    const query: Record<string, unknown> = { publisherId };
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      AdRequestModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdRequestModel.countDocuments(query),
    ]);

    return {
      requests: requests.map((r) => this.toAdRequest(r)),
      total,
    };
  }

  /**
   * Get requests by placement
   */
  async getByPlacement(
    placementId: string,
    options: { page?: number; limit?: number; status?: AdRequestStatus }
  ): Promise<{ requests: AdRequest[]; total: number }> {
    const { page = 1, limit = 50, status } = options;

    const query: Record<string, unknown> = { placementId };
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      AdRequestModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdRequestModel.countDocuments(query),
    ]);

    return {
      requests: requests.map((r) => this.toAdRequest(r)),
      total,
    };
  }

  /**
   * Update request status
   */
  async updateStatus(requestId: string, status: AdRequestStatus, reason?: string): Promise<AdRequest | null> {
    const update: Record<string, unknown> = { status };
    if (status === 'no-fill' && reason) {
      update.noFillReason = reason;
    }

    const request = await AdRequestModel.findOneAndUpdate(
      { requestId },
      { $set: update },
      { new: true }
    );

    return request ? this.toAdRequest(request) : null;
  }

  /**
   * Get request statistics
   */
  async getStats(
    publisherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    filledRequests: number;
    noFillRequests: number;
    fillRate: number;
    averageResponseTime: number;
  }> {
    const requests = await AdRequestModel.find({
      publisherId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const filledRequests = requests.filter((r) => r.status === 'filled').length;
    const noFillRequests = requests.filter((r) => r.status === 'no-fill').length;

    const responseTimes = requests
      .filter((r) => r.responseTime)
      .map((r) => r.responseTime as number);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      totalRequests: requests.length,
      filledRequests,
      noFillRequests,
      fillRate: requests.length > 0 ? (filledRequests / requests.length) * 100 : 0,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }

  /**
   * Convert document to AdRequest type
   */
  private toAdRequest(doc: AdRequestDocument): AdRequest {
    return {
      requestId: doc.requestId,
      placementId: doc.placementId,
      appId: doc.appId,
      publisherId: doc.publisherId,
      platform: doc.platform,
      adFormat: doc.adFormat,
      deviceId: doc.deviceId,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      language: doc.language,
      country: doc.country,
      timestamp: doc.timestamp,
      status: doc.status,
      responseTime: doc.responseTime,
      filledAt: doc.filledAt,
      noFillReason: doc.noFillReason,
    };
  }
}

export const adRequestService = new AdRequestService();