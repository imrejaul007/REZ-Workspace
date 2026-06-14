import { SnapchatPixel } from '../models/snapchatPixel.model.js';
import { SnapchatAdAccount } from '../models/snapchatAdAccount.model.js';
import { snapchatApiService } from './snapchatApi.service.js';
import { generateId } from '../utils/helpers.js';
import { logger } from 'utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface PixelEvent {
  event_type: string;
  timestamp: number;
  user_id?: string;
  email?: string;
  phone?: string;
  event_data?: Record<string, unknown>;
}

export interface CreatePixelParams {
  adAccountId: string;
  name: string;
  description?: string;
}

class PixelService {
  async createPixel(
    organizationId: string,
    params: CreatePixelParams
  ): Promise<SnapchatPixel> {
    const adAccount = await SnapchatAdAccount.findOne({
      id: params.adAccountId,
      organizationId,
      status: 'connected',
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found or not connected');
    }

    const pixel = new SnapchatPixel({
      id: generateId('pix'),
      adAccountId: params.adAccountId,
      name: params.name,
      description: params.description || '',
      status: 'ACTIVE',
      events: [],
    });

    if (adAccount.accessToken) {
      snapchatApiService.setAccessToken(adAccount.accessToken);

      try {
        const snapchatPixel = await snapchatApiService.createPixel(
          adAccount.snapchatAccountId,
          params.name
        );

        pixel.pixelId = (snapchatPixel as unknown as { id: string }).id;
      } catch (error) {
        logger.warn('Failed to create pixel in Snapchat, saving locally', { error });
      }
    }

    await pixel.save();

    logger.info('Pixel created', {
      organizationId,
      pixelId: pixel.id,
      name: params.name,
    });

    return pixel;
  }

  async getPixels(organizationId: string, adAccountId?: string): Promise<SnapchatPixel[]> {
    const query: Record<string, unknown> = {};

    if (adAccountId) {
      query.adAccountId = adAccountId;
    } else {
      const adAccounts = await SnapchatAdAccount.find({
        organizationId,
        status: 'connected',
      });

      query.adAccountId = { $in: adAccounts.map((acc) => acc.id) };
    }

    return SnapchatPixel.find(query).sort({ createdAt: -1 });
  }

  async getPixel(organizationId: string, pixelId: string): Promise<SnapchatPixel> {
    const pixel = await SnapchatPixel.findOne({ id: pixelId });

    if (!pixel) {
      throw new NotFoundError('Pixel not found');
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: pixel.adAccountId,
      organizationId,
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found');
    }

    return pixel;
  }

  async trackEvent(
    organizationId: string,
    pixelId: string,
    event: PixelEvent
  ): Promise<void> {
    const pixel = await this.getPixel(organizationId, pixelId);

    pixel.events.push({
      eventType: event.event_type,
      timestamp: new Date(event.timestamp * 1000),
      userId: event.user_id,
      email: event.email,
      phone: event.phone,
      eventData: event.event_data,
    });

    await pixel.save();

    logger.info('Event tracked', {
      organizationId,
      pixelId,
      eventType: event.event_type,
    });
  }

  async getEvents(
    organizationId: string,
    pixelId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PixelEvent[]> {
    const pixel = await this.getPixel(organizationId, pixelId);

    let events = pixel.events.map((e) => ({
      event_type: e.eventType,
      timestamp: e.timestamp.getTime() / 1000,
      user_id: e.userId,
      email: e.email,
      phone: e.phone,
      event_data: e.eventData,
    }));

    if (startDate) {
      const start = startDate.getTime() / 1000;
      events = events.filter((e) => e.timestamp >= start);
    }

    if (endDate) {
      const end = endDate.getTime() / 1000;
      events = events.filter((e) => e.timestamp <= end);
    }

    return events;
  }

  async getPixelEventsFromSnapchat(
    organizationId: string,
    pixelId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, unknown>> {
    const pixel = await this.getPixel(organizationId, pixelId);

    if (!pixel.pixelId) {
      return { events: [], total: 0 };
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: pixel.adAccountId,
    });

    if (!adAccount?.accessToken) {
      return { events: [], total: 0 };
    }

    snapchatApiService.setAccessToken(adAccount.accessToken);

    try {
      return await snapchatApiService.getPixelEvents(
        adAccount.snapchatAccountId,
        pixel.pixelId,
        startDate,
        endDate
      );
    } catch (error) {
      logger.warn('Failed to get pixel events from Snapchat', { error });
      return { events: [], total: 0 };
    }
  }
}

export const pixelService = new PixelService();
export default pixelService;