import { z } from 'zod';

// Validation Schemas
export const TrackImpressionSchema = z.object({
  adId: z.string(),
  placementId: z.string().optional(),
  campaignId: z.string().optional(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.object({
    width: z.number(),
    height: z.number(),
    position: z.enum(['above', 'below', 'unknown']).optional(),
    format: z.enum(['display', 'video', 'native', 'rich_media']).optional(),
  }).optional(),
});

export const TrackViewEventSchema = z.object({
  adId: z.string(),
  sessionId: z.string().uuid(),
  eventType: z.enum(['enter_viewport', 'exit_viewport', '50_percent_viewable', '100_percent_viewable', 'background', 'foreground']),
  timestamp: z.string().datetime().optional(),
  viewportInfo: z.object({
    visibleArea: z.number(),
    timeInView: z.number(),
    percentVisible: z.number(),
    isVisible: z.boolean(),
  }).optional(),
});

export const TrackVideoEventSchema = z.object({
  adId: z.string(),
  sessionId: z.string().uuid(),
  eventType: z.enum(['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'pause', 'resume', 'mute', 'unmute', 'fullscreen', 'exitFullscreen']),
  timestamp: z.string().datetime().optional(),
  videoInfo: z.object({
    currentTime: z.number(),
    duration: z.number(),
    volume: z.number(),
    isMuted: z.boolean(),
    isFullscreen: z.boolean(),
  }).optional(),
});

// Type Definitions
export type AdFormat = 'display' | 'video' | 'native' | 'rich_media';
export type ViewabilityStatus = 'measurable' | 'viewable' | 'not_viewable' | 'unknown';
export type VideoEventType = 'start' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'complete' | 'pause' | 'resume' | 'mute' | 'unmute' | 'fullscreen' | 'exitFullscreen';

export interface Impression {
  id: string;
  adId: string;
  placementId?: string;
  campaignId?: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  measurable: boolean;
  measurableAt?: Date;
  viewableAt?: Date;
  exitTime?: Date;
  metadata: ImpressionMetadata;
}

export interface ImpressionMetadata {
  width: number;
  height: number;
  position?: 'above' | 'below' | 'unknown';
  format?: AdFormat;
}

export interface ViewEvent {
  id: string;
  impressionId: string;
  adId: string;
  sessionId: string;
  eventType: string;
  timestamp: Date;
  viewportInfo?: ViewportInfo;
}

export interface ViewportInfo {
  visibleArea: number;
  timeInView: number;
  percentVisible: number;
  isVisible: boolean;
}

export interface VideoEvent {
  id: string;
  impressionId: string;
  adId: string;
  sessionId: string;
  eventType: VideoEventType;
  timestamp: Date;
  videoInfo?: VideoInfo;
}

export interface VideoInfo {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
}

export interface ViewabilityMetrics {
  adId: string;
  totalImpressions: number;
  measurableImpressions: number;
  viewableImpressions: number;
  viewabilityRate: number; // percentage of measurable that are viewable
  measurableRate: number; // percentage of total that are measurable
  averageTimeInView: number; // ms
  averagePercentVisible: number;
  viewableImpressionRate: number; // IAB standard: viewable / total
}

export interface VideoMetrics {
  adId: string;
  totalStarts: number;
  completions: number;
  completionRate: number;
  quartileCompletion: {
    firstQuartile: number;
    midpoint: number;
    thirdQuartile: number;
  };
  averageWatchTime: number;
  averageCompletionPercentage: number;
  muteRate: number;
  fullscreenRate: number;
}

export interface ViewabilityReport {
  date: string;
  adId?: string;
  campaignId?: string;
  placementId?: string;
  viewabilityMetrics: ViewabilityMetrics;
  videoMetrics?: VideoMetrics;
  breakdown: {
    byFormat: Record<AdFormat, ViewabilityMetrics>;
    byPosition: Record<string, ViewabilityMetrics>;
  };
}

export interface RealTimeViewability {
  adId: string;
  currentViewers: number;
  currentViewabilityRate: number;
  averageTimeInView: number;
  lastUpdated: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Type exports for Zod inference
export type TrackImpressionRequest = z.infer<typeof TrackImpressionSchema>;
export type TrackViewEventRequest = z.infer<typeof TrackViewEventSchema>;
export type TrackVideoEventRequest = z.infer<typeof TrackVideoEventSchema>;
