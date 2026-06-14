/**
 * Gallery API client for managing store portfolio/media gallery.
 *
 * Endpoints:
 * GET    /gallery/:storeId         - List gallery items
 * POST   /gallery/:storeId         - Add gallery items
 * GET    /gallery/:storeId/:id     - Get specific item
 * PATCH  /gallery/:storeId/:id     - Update item
 * DELETE /gallery/:storeId/:id     - Delete item
 * POST   /gallery/:storeId/reorder - Reorder items
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export type GalleryItemType = 'image' | 'video';

export interface GalleryMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos
  thumbnail?: string;
}

export interface GalleryItem {
  _id: string;
  storeId: string;
  type: GalleryItemType;
  url: string;
  caption?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: GalleryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGalleryItemRequest {
  type: GalleryItemType;
  url: string;
  caption?: string;
  category?: string;
  isActive?: boolean;
  metadata?: GalleryMetadata;
}

export interface UpdateGalleryItemRequest {
  url?: string;
  caption?: string;
  category?: string;
  type?: GalleryItemType;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: GalleryMetadata;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export interface GalleryListParams {
  type?: GalleryItemType;
  category?: string;
  active?: boolean;
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * List gallery items for a store.
 */
export async function getGalleryItems(
  storeId: string,
  params?: GalleryListParams
): Promise<GalleryItem[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.active !== undefined) queryParams.set('active', String(params.active));

    const { data } = await authClient.get(`/gallery/${storeId}?${queryParams}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch gallery items');
    return data.data as GalleryItem[];
  } catch (error) {
    logger.error('[gallery] Failed to fetch gallery items:', { error });
    return [];
  }
}

/**
 * Get a specific gallery item.
 */
export async function getGalleryItem(
  storeId: string,
  itemId: string
): Promise<GalleryItem | null> {
  try {
    const { data } = await authClient.get(`/gallery/${storeId}/${itemId}`);
    if (!data.success) throw new Error(data.message || 'Gallery item not found');
    return data.data as GalleryItem;
  } catch (error) {
    logger.error('[gallery] Failed to fetch gallery item:', { error });
    return null;
  }
}

/**
 * Add gallery items (single or batch).
 */
export async function addGalleryItems(
  storeId: string,
  items: CreateGalleryItemRequest | CreateGalleryItemRequest[]
): Promise<GalleryItem[]> {
  try {
    const payload = Array.isArray(items) ? { items } : { items: [items] };
    const { data } = await authClient.post(`/gallery/${storeId}`, payload);
    if (!data.success) throw new Error(data.message || 'Failed to add gallery items');
    return data.data as GalleryItem[];
  } catch (error) {
    logger.error('[gallery] Failed to add gallery items:', { error });
    return [];
  }
}

/**
 * Update a gallery item.
 */
export async function updateGalleryItem(
  storeId: string,
  itemId: string,
  updates: UpdateGalleryItemRequest
): Promise<GalleryItem | null> {
  try {
    const { data } = await authClient.patch(`/gallery/${storeId}/${itemId}`, updates);
    if (!data.success) throw new Error(data.message || 'Failed to update gallery item');
    return data.data as GalleryItem;
  } catch (error) {
    logger.error('[gallery] Failed to update gallery item:', { error });
    return null;
  }
}

/**
 * Delete a gallery item.
 */
export async function deleteGalleryItem(
  storeId: string,
  itemId: string
): Promise<boolean> {
  try {
    const { data } = await authClient.delete(`/gallery/${storeId}/${itemId}`);
    if (!data.success) throw new Error(data.message || 'Failed to delete gallery item');
    return true;
  } catch (error) {
    logger.error('[gallery] Failed to delete gallery item:', { error });
    return false;
  }
}

/**
 * Reorder gallery items.
 */
export async function reorderGalleryItems(
  storeId: string,
  items: ReorderItem[]
): Promise<GalleryItem[]> {
  try {
    const { data } = await authClient.post(`/gallery/${storeId}/reorder`, { items });
    if (!data.success) throw new Error(data.message || 'Failed to reorder gallery items');
    return data.data as GalleryItem[];
  } catch (error) {
    logger.error('[gallery] Failed to reorder gallery items:', { error });
    return [];
  }
}

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Group gallery items by category.
 */
export function groupByCategory(items: GalleryItem[]): Record<string, GalleryItem[]> {
  return items.reduce((groups, item) => {
    const category = item.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, GalleryItem[]>);
}

/**
 * Separate images and videos.
 */
export function separateByType(items: GalleryItem[]): {
  images: GalleryItem[];
  videos: GalleryItem[];
} {
  return items.reduce(
    (acc, item) => {
      if (item.type === 'image') {
        acc.images.push(item);
      } else {
        acc.videos.push(item);
      }
      return acc;
    },
    { images: [] as GalleryItem[], videos: [] as GalleryItem[] }
  );
}

/**
 * Get optimized image URL based on size.
 */
export function getOptimizedImageUrl(
  url: string,
  width: number
): string {
  // If the URL is a cloudinary URL, apply transformations
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`);
  }
  // For other CDNs, append size parameter if supported
  if (url.includes('imgix.net')) {
    return `${url}?w=${width}&auto=format`;
  }
  // Return original URL if no optimization available
  return url;
}

/**
 * Get video thumbnail URL.
 */
export function getVideoThumbnail(item: GalleryItem): string {
  // If metadata has a thumbnail, use it
  if (item.metadata?.thumbnail) {
    return item.metadata.thumbnail;
  }
  // For YouTube/Vimeo, would need to generate from video service
  return '';
}

/**
 * Get aspect ratio class for grid layout.
 */
export function getAspectRatioClass(item: GalleryItem): string {
  if (!item.metadata?.width || !item.metadata?.height) {
    return 'aspect-square';
  }
  const ratio = item.metadata.width / item.metadata.height;
  if (ratio > 1.5) return 'aspect-video';
  if (ratio < 0.8) return 'aspect-[3/4]';
  return 'aspect-square';
}

/**
 * Predefined categories for galleries.
 */
export const GALLERY_CATEGORIES = [
  'Interior',
  'Exterior',
  'Products',
  'Services',
  'Team',
  'Events',
  'Customer Photos',
  'Awards',
  'Menu',
  'Special Offers',
] as const;

export type GalleryCategory = typeof GALLERY_CATEGORIES[number];
