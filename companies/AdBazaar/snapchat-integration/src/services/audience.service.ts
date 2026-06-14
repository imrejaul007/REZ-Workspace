import { SnapchatAudience } from '../models/snapchatAudience.model.js';
import { SnapchatAdAccount } from '../models/snapchatAdAccount.model.js';
import { snapchatApiService } from './snapchatApi.service.js';
import { generateId } from '../utils/helpers.js';
import { logger } from 'utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateAudienceParams {
  adAccountId: string;
  name: string;
  description?: string;
  source: 'CUSTOMER_LIST' | 'WEB_PIXEL' | 'APP_PIXEL' | 'ENGAGEMENT';
}

class AudienceService {
  async createAudience(
    organizationId: string,
    params: CreateAudienceParams
  ): Promise<SnapchatAudience> {
    const adAccount = await SnapchatAdAccount.findOne({
      id: params.adAccountId,
      organizationId,
      status: 'connected',
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found or not connected');
    }

    const audience = new SnapchatAudience({
      id: generateId('aud'),
      adAccountId: params.adAccountId,
      name: params.name,
      description: params.description || '',
      source: params.source,
      size: 0,
      status: 'CREATING',
    });

    if (adAccount.accessToken) {
      snapchatApiService.setAccessToken(adAccount.accessToken);

      try {
        const snapchatAudience = await snapchatApiService.createAudience(
          adAccount.snapchatAccountId,
          {
            name: params.name,
            description: params.description,
            source: params.source,
          }
        );

        audience.snapchatAudienceId = (snapchatAudience as unknown as { id: string }).id;
        audience.status = 'READY';
      } catch (error) {
        logger.warn('Failed to create audience in Snapchat, saving locally', { error });
      }
    }

    await audience.save();

    logger.info('Audience created', {
      organizationId,
      audienceId: audience.id,
      name: params.name,
    });

    return audience;
  }

  async getAudiences(
    organizationId: string,
    adAccountId?: string
  ): Promise<SnapchatAudience[]> {
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

    return SnapchatAudience.find(query).sort({ createdAt: -1 });
  }

  async getAudience(organizationId: string, audienceId: string): Promise<SnapchatAudience> {
    const audience = await SnapchatAudience.findOne({ id: audienceId });

    if (!audience) {
      throw new NotFoundError('Audience not found');
    }

    const adAccount = await SnapchatAdAccount.findOne({
      id: audience.adAccountId,
      organizationId,
    });

    if (!adAccount) {
      throw new NotFoundError('Ad account not found');
    }

    return audience;
  }

  async updateAudience(
    organizationId: string,
    audienceId: string,
    updates: { name?: string; description?: string }
  ): Promise<SnapchatAudience> {
    const audience = await this.getAudience(organizationId, audienceId);

    if (updates.name) audience.name = updates.name;
    if (updates.description) audience.description = updates.description;

    await audience.save();

    logger.info('Audience updated', { organizationId, audienceId });

    return audience;
  }

  async deleteAudience(organizationId: string, audienceId: string): Promise<void> {
    const audience = await this.getAudience(organizationId, audienceId);

    await SnapchatAudience.deleteOne({ id: audienceId });

    logger.info('Audience deleted', { organizationId, audienceId });
  }
}

export const audienceService = new AudienceService();
export default audienceService;