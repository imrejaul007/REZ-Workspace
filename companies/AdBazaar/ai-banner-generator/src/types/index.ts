/**
 * Type definitions for AI Banner Generator Service
 */

// Banner Generation Request/Response Types
export interface BannerDimensions {
  width: number;
  height: number;
}

export interface BrandGuidelines {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo?: string;
}

export interface BannerVariant {
  size: string;
  imageUrl: string;
}

export interface BannerOutput {
  imageUrl: string;
  thumbnailUrl: string;
  format: 'png' | 'jpg' | 'gif' | 'webp';
  size: number;
  dimensions: BannerDimensions;
  variants?: BannerVariant[];
}

export interface BannerMetadata {
  generationTime: number;
  model: string;
  confidence: number;
}

export interface BannerGenerationRequest {
  description: string;
  dimensions: BannerDimensions;
  format: 'static' | 'animated' | 'video';
  style?: 'modern' | 'classic' | 'bold' | 'minimal';
  colors?: string[];
  brandGuidelines?: BrandGuidelines;
}

export interface BannerGeneration {
  generationId: string;
  advertiserId: string;
  request: BannerGenerationRequest;
  output?: BannerOutput;
  metadata?: BannerMetadata;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Banner Template Types
export interface LayoutElement {
  type: 'text' | 'image' | 'logo' | 'cta';
  position: { x: number; y: number };
  style: Record<string, unknown>;
}

export interface TemplateLayout {
  elements: LayoutElement[];
}

export interface TemplatePerformance {
  avgCTR: number;
  avgConversion: number;
}

export interface BannerTemplate {
  templateId: string;
  name: string;
  category: string;
  dimensions: BannerDimensions;
  layout: TemplateLayout;
  usageCount: number;
  performance: TemplatePerformance;
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface GenerateBannerRequest {
  description: string;
  dimensions: BannerDimensions;
  format?: 'static' | 'animated' | 'video';
  style?: 'modern' | 'classic' | 'bold' | 'minimal';
  colors?: string[];
  brandGuidelines?: BrandGuidelines;
}

export interface GenerateVariantRequest {
  baseGenerationId: string;
  count?: number;
  variations?: {
    style?: 'modern' | 'classic' | 'bold' | 'minimal';
    colors?: string[];
  }[];
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  dimensions: BannerDimensions;
  layout: TemplateLayout;
 isPublic?: boolean;
}

export interface RegenerateRequest {
  changes?: {
    description?: string;
    style?: 'modern' | 'classic' | 'bold' | 'minimal';
    colors?: string[];
    dimensions?: BannerDimensions;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

// Auth Types
export interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: 'advertiser' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

// Metrics Types
export interface GenerationMetrics {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  avgGenerationTime: number;
  byFormat: Record<string, number>;
  byStyle: Record<string, number>;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
