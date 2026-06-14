// Media item types
export interface MediaItem {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  metadata: MediaMetadata;
  transformations: Transformation[];
  createdAt: string;
  updatedAt: string;
  status: MediaStatus;
  tags: string[];
}

export interface MediaMetadata {
  format?: string;
  duration?: number; // for videos/audio
  bitrate?: number;
  colorspace?: string;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Record<string, unknown>;
}

export interface Transformation {
  id: string;
  type: TransformationType;
  params: Record<string, unknown>;
  resultUrl: string;
  createdAt: string;
}

export type TransformationType =
  | 'resize'
  | 'compress'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'blur'
  | 'sharpen'
  | 'grayscale'
  | 'format_convert'
  | 'watermark';

export type MediaStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';

// Request/Response types
export interface UploadResponse {
  success: boolean;
  data: MediaItem;
  message: string;
}

export interface MediaListResponse {
  success: boolean;
  data: {
    items: MediaItem[];
    pagination: PaginationInfo;
  };
  message: string;
}

export interface TransformationRequest {
  type: TransformationType;
  params: Record<string, unknown>;
}

export interface TransformationResponse {
  success: boolean;
  data: {
    original: MediaItem;
    transformed: MediaItem;
  };
  message: string;
}

export interface IntegrationStatus {
  service: string;
  status: 'connected' | 'disconnected' | 'degraded';
  version: string;
  timestamp: string;
  capabilities: string[];
  stats: IntegrationStats;
}

export interface IntegrationStats {
  totalMediaItems: number;
  totalStorageBytes: number;
  totalTransformations: number;
  uptime: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error response
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
