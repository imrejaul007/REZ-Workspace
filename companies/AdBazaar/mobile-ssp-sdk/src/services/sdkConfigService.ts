import { AppPublisherModel } from '../models/index.js';
import { PlacementModel } from '../models/index.js';
import { config } from '../config/index.js';
import type { SDKConfig, Platform, AdFormat } from '../types/index.js';

export class SDKConfigService {
  /**
   * Get SDK configuration for an app
   */
  async getConfig(appId: string): Promise<SDKConfig | null> {
    // Find publisher with this app
    const publisher = await AppPublisherModel.findOne({ 'apps.appId': appId });
    if (!publisher) {
      return null;
    }

    // Find the app
    const app = publisher.apps.find((a: any) => a.appId === appId);
    if (!app) {
      return null;
    }

    // Check if publisher and app are active
    if (publisher.status !== 'active' || app.status !== 'active') {
      return null;
    }

    // Get all placements for this app
    const placements = await PlacementModel.find({ appId, status: 'active' });

    return {
      appId,
      publisherId: publisher.publisherId,
      platform: app.platform,
      adFormats: publisher.settings.adFormats,
      ecpm: publisher.settings.minCPM,
      refreshInterval: placements.length > 0 ? placements[0].refreshInterval : 30,
      timeout: 5000,
      retryAttempts: 3,
      testMode: publisher.settings.testMode,
      consentRequired: true,
      gdprEnabled: true,
      coppaEnabled: true,
      customParameters: {},
    };
  }

  /**
   * Get SDK configuration by bundle ID
   */
  async getConfigByBundleId(bundleId: string): Promise<SDKConfig | null> {
    // Find publisher with this bundle ID
    const publisher = await AppPublisherModel.findOne({ 'apps.bundleId': bundleId });
    if (!publisher) {
      return null;
    }

    // Find the app
    const app = publisher.apps.find((a: any) => a.bundleId === bundleId);
    if (!app) {
      return null;
    }

    return this.getConfig(app.appId);
  }

  /**
   * Validate app credentials
   */
  async validateApp(appId: string, publisherId: string): Promise<boolean> {
    const publisher = await AppPublisherModel.findOne({
      publisherId,
      'apps.appId': appId,
      status: 'active',
    });

    if (!publisher) {
      return false;
    }

    const app = publisher.apps.find((a: any) => a.appId === appId);
    return app?.status === 'active';
  }

  /**
   * Get platform-specific SDK config
   */
  async getPlatformConfig(appId: string, platform: Platform): Promise<Partial<SDKConfig> | null> {
    const publisher = await AppPublisherModel.findOne({ 'apps.appId': appId });
    if (!publisher) {
      return null;
    }

    const app = publisher.apps.find((a: any) => a.appId === appId);
    if (!app || app.platform !== platform) {
      return null;
    }

    return {
      platform,
      testMode: publisher.settings.testMode,
      adFormats: publisher.settings.adFormats,
      refreshInterval: 30,
      timeout: 5000,
      retryAttempts: 3,
    };
  }

  /**
   * Get ad formats for platform
   */
  async getAdFormats(appId: string): Promise<AdFormat[]> {
    const publisher = await AppPublisherModel.findOne({ 'apps.appId': appId });
    if (!publisher) {
      return [];
    }

    return publisher.settings.adFormats;
  }

  /**
   * Get ECPM for placement
   */
  async getPlacementECPM(placementId: string): Promise<number> {
    const placement = await PlacementModel.findOne({ placementId, status: 'active' });
    if (!placement) {
      return config.ssp.defaultECPM;
    }

    return placement.ecpm;
  }

  /**
   * Get minimum ECPM for publisher
   */
  async getMinECPM(publisherId: string): Promise<number> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      return config.ssp.minECPM;
    }

    return publisher.settings.minCPM;
  }

  /**
   * Check if test mode is enabled for publisher
   */
  async isTestMode(publisherId: string): Promise<boolean> {
    const publisher = await AppPublisherModel.findOne({ publisherId });
    if (!publisher) {
      return false;
    }

    return publisher.settings.testMode;
  }
}

export const sdkConfigService = new SDKConfigService();