import { SDKConfig } from '../models/index.js';
import { config } from '../config/index.js';
import type { OTTStreamingConfig, SDKConfigResponse } from '../types/index.js';

const DEFAULT_SDK_VERSION = '1.0.0';

function getDefaultConfig(appId: string): OTTStreamingConfig {
  return {
    sdkVersion: DEFAULT_SDK_VERSION,
    streamConfig: {
      hls: {
        enabled: true,
        maxBitrate: config.streaming.maxBitrate,
        minBitrate: config.streaming.minBitrate,
      },
      dash: {
        enabled: true,
        manifestVersion: '2.0',
      },
    },
    drm: {
      widevine: {
        licenseUrl: `${config.drm.licenseUrl}/widevine/license`,
        serverCertificate: config.drm.licenseUrl,
      },
      fairplay: {
        licenseUrl: `${config.drm.licenseUrl}/fairplay/license`,
        certificateUrl: config.drm.fairplayCertificateUrl,
      },
    },
    analytics: {
      endpoint: `${config.cdn.baseUrl}/api/analytics`,
      heartbeatInterval: config.analytics.heartbeatInterval,
    },
    adConfig: {
      adServerUrl: config.ad.serverUrl,
      adTimeout: 10000,
    },
  };
}

export async function getSDKConfig(appId: string): Promise<SDKConfigResponse> {
  let sdkConfig = await SDKConfig.findOne({ appId });

  if (!sdkConfig) {
    // Create default config for new apps
    const defaultConfig = getDefaultConfig(appId);
    sdkConfig = await SDKConfig.create({
      appId,
      config: defaultConfig,
    });
  }

  return {
    appId: sdkConfig.appId,
    config: sdkConfig.config,
  };
}

export async function updateSDKConfig(
  appId: string,
  updates: Partial<OTTStreamingConfig>
): Promise<SDKConfigResponse> {
  const sdkConfig = await SDKConfig.findOneAndUpdate(
    { appId },
    {
      $set: {
        config: updates,
        updatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return {
    appId: sdkConfig.appId,
    config: sdkConfig.config,
  };
}

export async function getAllConfigs(): Promise<SDKConfigResponse[]> {
  const configs = await SDKConfig.find({}).sort({ createdAt: -1 });
  return configs.map(c => ({
    appId: c.appId,
    config: c.config,
  }));
}