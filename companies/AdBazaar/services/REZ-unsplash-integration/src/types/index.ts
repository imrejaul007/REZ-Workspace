import { z } from 'zod';

// Unsplash Photo Types
export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string;
  blurHash: string;
  description: string | null;
  altDescription: string | null;
  urls: UnsplashUrls;
  links: UnsplashLinks;
  user: UnsplashUser;
  tags?: UnsplashTag[];
  createdAt: string;
}

export interface UnsplashUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface UnsplashLinks {
  self: string;
  html: string;
  download: string;
  downloadLocation: string;
}

export interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  portfolioUrl: string | null;
  links: {
    html: string;
    photos: string;
  };
  profileImage: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface UnsplashTag {
  type: string;
  title: string;
}

// Download tracking
export interface DownloadRecord {
  id: string;
  tenantId: string;
  photoId: string;
  downloadedAt: Date;
  downloadUrl: string;
  ipAddress?: string;
}

// Collection Types
export interface PhotoCollection {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  photoIds: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Search Types
export interface SearchResult {
  total: number;
  totalPages: number;
  results: UnsplashPhoto[];
}

export interface SearchOptions {
  query: string;
  page?: number;
  perPage?: number;
  orderBy?: 'relevant' | 'latest';
  color?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  contentFilter?: 'low' | 'high';
}

// Attribution Types
export interface AttributionRecord {
  photoId: string;
  photographerName: string;
  photographerUsername: string;
  photographerUrl: string;
  downloadUrl: string;
  downloadLocation: string;
  usedAt: Date;
}

// Zod Schemas
export const SearchOptionsSchema = z.object({
  query: z.string().min(1),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().min(1).max(30).optional().default(20),
  orderBy: z.enum(['relevant', 'latest']).optional().default('relevant'),
  color: z.string().optional(),
  orientation: z.enum(['landscape', 'portrait', 'squarish']).optional(),
  contentFilter: z.enum(['low', 'high']).optional().default('low'),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  photoIds: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const RandomPhotoOptionsSchema = z.object({
  query: z.string().optional(),
  orientation: z.enum(['landscape', 'portrait', 'squarish', 'squarish']).optional(),
  count: z.number().int().min(1).max(30).optional().default(1),
  contentFilter: z.enum(['low', 'high']).optional().default('low'),
});

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
