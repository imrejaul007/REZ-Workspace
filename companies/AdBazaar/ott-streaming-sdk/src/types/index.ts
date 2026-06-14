import { z } from 'zod';

// SDK Configuration Schema
export const StreamConfigSchema = z.object({
  hls: z.object({
    enabled: z.boolean(),
    maxBitrate: z.number(),
    minBitrate: z.number(),
  }),
  dash: z.object({
    enabled: z.boolean(),
    manifestVersion: z.string(),
  }),
});

export const DRMConfigSchema = z.object({
  widevine: z.object({
    licenseUrl: z.string().url(),
    serverCertificate: z.string(),
  }),
  fairplay: z.object({
    licenseUrl: z.string().url(),
    certificateUrl: z.string().url(),
  }),
});

export const AnalyticsConfigSchema = z.object({
  endpoint: z.string().url(),
  heartbeatInterval: z.number().min(1000).max(60000),
});

export const AdConfigSchema = z.object({
  adServerUrl: z.string().url(),
  adTimeout: z.number().min(1000).max(30000),
});

export const OTTStreamingConfigSchema = z.object({
  sdkVersion: z.string(),
  streamConfig: StreamConfigSchema,
  drm: DRMConfigSchema,
  analytics: AnalyticsConfigSchema,
  adConfig: AdConfigSchema,
});

export type OTTStreamingConfig = z.infer<typeof OTTStreamingConfigSchema>;

// Stream Asset Schema
export const StreamQualitySchema = z.object({
  url: z.string().url(),
  type: z.enum(['hls', 'dash']),
  quality: z.string(),
  bitrate: z.number(),
});

export const DRMInfoSchema = z.object({
  widevine: z.boolean(),
  fairplay: z.boolean(),
});

export const StreamAssetSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  duration: z.number(),
  streams: z.array(StreamQualitySchema),
  thumbnail: z.string().url(),
  drm: DRMInfoSchema,
});

export type StreamAsset = z.infer<typeof StreamAssetSchema>;

// Playback Event Schema
export const PlaybackEventMetadataSchema = z.object({
  position: z.number(),
  quality: z.string(),
  bitrate: z.number(),
  bufferDuration: z.number().optional(),
});

export const PlaybackEventSchema = z.object({
  eventId: z.string(),
  contentId: z.string(),
  deviceId: z.string(),
  eventType: z.enum(['play', 'pause', 'seek', 'buffer', 'complete', 'error']),
  timestamp: z.string().datetime(),
  metadata: PlaybackEventMetadataSchema,
});

export type PlaybackEvent = z.infer<typeof PlaybackEventSchema>;

// Heartbeat Schema
export const HeartbeatSchema = z.object({
  deviceId: z.string(),
  contentId: z.string(),
  position: z.number(),
  quality: z.string(),
  timestamp: z.string().datetime(),
});

export type Heartbeat = z.infer<typeof HeartbeatSchema>;

// DRM License Request Schema
export const DRMLicenseRequestSchema = z.object({
  contentId: z.string(),
  drmType: z.enum(['widevine', 'fairplay']),
  deviceInfo: z.object({
    manufacturer: z.string(),
    model: z.string(),
    osVersion: z.string(),
  }),
});

export type DRMLicenseRequest = z.infer<typeof DRMLicenseRequestSchema>;

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
  events: z.array(PlaybackEventSchema).min(1).max(100),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// MongoDB Document Types
export interface SDKConfigDocument {
  appId: string;
  config: OTTStreamingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybackEventDocument {
  eventId: string;
  contentId: string;
  deviceId: string;
  eventType: string;
  timestamp: Date;
  metadata: {
    position: number;
    quality: string;
    bitrate: number;
    bufferDuration?: number;
  };
  sessionId: string;
  createdAt: Date;
}

export interface StreamAssetDocument {
  contentId: string;
  title: string;
  duration: number;
  streams: {
    url: string;
    type: 'hls' | 'dash';
    quality: string;
    bitrate: number;
  }[];
  thumbnail: string;
  drm: {
    widevine: boolean;
    fairplay: boolean;
  };
  cdn: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeartbeatDocument {
  deviceId: string;
  contentId: string;
  position: number;
  quality: string;
  timestamp: Date;
  sessionId: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SDKConfigResponse {
  appId: string;
  config: OTTStreamingConfig;
}

export interface StreamResponse {
  contentId: string;
  streams: {
    url: string;
    type: 'hls' | 'dash';
    quality: string;
    bitrate: number;
  }[];
  drm: {
    widevine: boolean;
    fairplay: boolean;
  };
}

export interface ManifestResponse {
  contentId: string;
  manifestUrl: string;
  expiresAt: string;
}

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      appId?: string;
      deviceId?: string;
      sessionId?: string;
    }
  }
}
