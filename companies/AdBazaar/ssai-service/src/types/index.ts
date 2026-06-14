export type ContentType = 'live' | 'vod';
export type ManifestType = 'hls' | 'dash';
export type AdBreakPosition = 'preroll' | 'midroll' | 'postroll';
export type AdBreakStatus = 'scheduled' | 'active' | 'completed';
export type StreamStatus = 'active' | 'inactive' | 'completed';
export type InsertedAdStatus = 'pending' | 'playing' | 'completed' | 'skipped';

export interface InsertedAd {
  id: string;
  adId: string;
  creativeUrl: string;
  clickUrl?: string;
  duration: number;
  offset: number;
  status: InsertedAdStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AdBreak {
  id: string;
  position: AdBreakPosition;
  offset?: number;
  duration: number;
  maxAds: number;
  status: AdBreakStatus;
  insertedAds: InsertedAd[];
  scheduledTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
}

export interface StreamManifest {
  streamId: string;
  contentId: string;
  contentType: ContentType;
  originalManifestUrl: string;
  modifiedManifestUrl: string;
  manifestType: ManifestType;
  adBreaks: AdBreak[];
  slateUrl?: string;
  status: StreamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SCTE35CueMessage {
  id: string;
  streamId: string;
  spliceEventType: 'splice_insert' | 'splice_schedule' | 'time_signal' | 'bandwidth_sharing';
  spliceEventId: number;
  spliceCommandType: number;
  spliceInsert: {
    spliceEventId: number;
    spliceExecuteFlag: boolean;
    breakDuration: number;
    availNum?: number;
    availsExpected?: number;
  };
  segmentationDescriptor?: {
    segmentationEventId: number;
    segmentationTypeId: number;
    segmentNum?: number;
    segmentsExpected?: number;
    subSegmentNum?: number;
    subSegmentsExpected?: number;
  };
  ptsOffset?: number;
  duration?: number;
  rawData?: Buffer;
  processedAt: Date;
}

export interface AdManifest {
  id: string;
  streamId: string;
  adBreaks: AdBreak[];
  masterManifestUrl: string;
  variants: VariantManifest[];
  createdAt: Date;
}

export interface VariantManifest {
  resolution: string;
  bandwidth: number;
  url: string;
}

export interface SlateInfo {
  streamId: string;
  slateUrl: string;
  duration: number;
  createdAt: Date;
}

export interface ManifestProcessRequest {
  contentUrl: string;
  contentType: ContentType;
  manifestType: ManifestType;
  adBreaks?: Partial<AdBreak>[];
  userId?: string;
  sessionId?: string;
}

export interface ManifestProcessResponse {
  manifestUrl: string;
  adBreaks: AdBreak[];
  totalAdDuration: number;
  metadata: {
    contentId: string;
    processedAt: Date;
    cdnUrl: string;
  };
}

export interface AdBreakCompleteRequest {
  adBreakId: string;
  completedAds: string[];
  totalDuration: number;
  exitPosition?: 'natural' | 'early' | 'timeout';
}

export interface SCTE35ProcessRequest {
  streamId: string;
  rawData: string;
  ptsTime?: number;
  timestamp?: Date;
}

export interface SpliceInsertRequest {
  streamId: string;
  spliceEventId: number;
  breakDuration: number;
  startTime?: number;
  endTime?: number;
  assets?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    processingTime?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface StreamListQuery {
  status?: StreamStatus;
  contentType?: ContentType;
  page?: number;
  limit?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  services: {
    mongodb: boolean;
    redis: boolean;
  };
  metrics: {
    activeStreams: number;
    activeAdBreaks: number;
    requestsProcessed: number;
  };
}