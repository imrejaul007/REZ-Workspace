import { PublisherModel } from '../models/index.js';
import { SDKConfig, SDKConfigResponse } from '../types/index.js';
import { createLogger } from '../utils/index.js';
import { config } from '../config/index.js';

const logger = createLogger('SDKConfigService');

export class SDKConfigService {
  async getSDKConfig(publisherId: string): Promise<SDKConfigResponse | null> {
    logger.debug(`Getting SDK config for publisher: ${publisherId}`);

    const publisher = await PublisherModel.findOne({ publisherId });
    if (!publisher) {
      logger.warn(`Publisher not found: ${publisherId}`);
      return null;
    }

    if (publisher.status !== 'active') {
      logger.warn(`Publisher not active: ${publisherId}, status: ${publisher.status}`);
      return null;
    }

    const sdkConfig: SDKConfig = {
      publisherId: publisher.publisherId,
      apiKey: publisher.publisherId, // Use publisherId as API key reference
      adFormats: publisher.settings.adFormats,
      headerBidding: publisher.settings.headerBidding,
      minCPM: publisher.settings.minCPM,
      refreshInterval: 60000, // 1 minute default
      debug: config.nodeEnv !== 'production',
    };

    return {
      config: sdkConfig,
      baseUrl: config.sdk.baseUrl,
      version: '1.0.0',
    };
  }

  async validateSDKConfig(config: SDKConfig): Promise<boolean> {
    logger.debug(`Validating SDK config for publisher: ${config.publisherId}`);

    const publisher = await PublisherModel.findOne({ publisherId: config.publisherId });
    if (!publisher) {
      return false;
    }

    return publisher.status === 'active' &&
           publisher.settings.headerBidding === config.headerBidding &&
           publisher.settings.minCPM === config.minCPM;
  }

  async getHeaderBiddingConfig(publisherId: string): Promise<{
    enabled: boolean;
    timeout: number;
    priceGranularity: string;
  } | null> {
    logger.debug(`Getting header bidding config for publisher: ${publisherId}`);

    const publisher = await PublisherModel.findOne({ publisherId });
    if (!publisher || publisher.status !== 'active') {
      return null;
    }

    return {
      enabled: publisher.settings.headerBidding,
      timeout: 1000, // 1 second timeout
      priceGranularity: 'dense', // Standard price granularity
    };
  }
}

export const sdkConfigService = new SDKConfigService();