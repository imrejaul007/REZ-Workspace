/**
 * Store Links API client for managing configurable links on REZ Now store pages.
 *
 * Endpoints:
 * GET    /store-links/:storeId      - Get all links for a store
 * POST   /store-links/:storeId      - Create/update links for a store
 * PATCH  /store-links/:storeId/:linkId - Update a specific link
 * DELETE /store-links/:storeId/:linkId - Delete a specific link
 * POST   /store-links/:storeId/:linkId/click - Track a link click
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';
import { randomBytes } from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────────

export type LinkType = 'website' | 'menu' | 'reservation' | 'order' | 'contact' | 'social';

export interface StoreLinkItem {
  id: string;
  type: LinkType;
  title: string;
  url: string;
  icon?: string;
  order: number;
  clickCount: number;
}

export interface StoreLinksResponse {
  storeId: string;
  links: StoreLinkItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinksRequest {
  links: Omit<StoreLinkItem, 'clickCount'>[];
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  type?: LinkType;
  icon?: string;
  order?: number;
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Get all links for a store.
 */
export async function getStoreLinks(storeId: string): Promise<StoreLinksResponse | null> {
  try {
    const { data } = await authClient.get(`/store-links/${storeId}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch store links');
    return data.data as StoreLinksResponse;
  } catch (error) {
    logger.error('[storeLinks] Failed to fetch store links:', { error });
    return null;
  }
}

/**
 * Create or replace all links for a store.
 */
export async function updateStoreLinks(
  storeId: string,
  links: CreateLinksRequest['links']
): Promise<StoreLinksResponse | null> {
  try {
    const { data } = await authClient.post(`/store-links/${storeId}`, { links });
    if (!data.success) throw new Error(data.message || 'Failed to update store links');
    return data.data as StoreLinksResponse;
  } catch (error) {
    logger.error('[storeLinks] Failed to update store links:', { error });
    return null;
  }
}

/**
 * Update a specific link.
 */
export async function updateStoreLink(
  storeId: string,
  linkId: string,
  updates: UpdateLinkRequest
): Promise<StoreLinksResponse | null> {
  try {
    const { data } = await authClient.patch(`/store-links/${storeId}/${linkId}`, updates);
    if (!data.success) throw new Error(data.message || 'Failed to update link');
    return data.data as StoreLinksResponse;
  } catch (error) {
    logger.error('[storeLinks] Failed to update link:', { error });
    return null;
  }
}

/**
 * Delete a specific link.
 */
export async function deleteStoreLink(
  storeId: string,
  linkId: string
): Promise<StoreLinksResponse | null> {
  try {
    const { data } = await authClient.delete(`/store-links/${storeId}/${linkId}`);
    if (!data.success) throw new Error(data.message || 'Failed to delete link');
    return data.data as StoreLinksResponse;
  } catch (error) {
    logger.error('[storeLinks] Failed to delete link:', { error });
    return null;
  }
}

/**
 * Track a link click.
 */
export async function trackLinkClick(
  storeId: string,
  linkId: string
): Promise<{ clickCount: number } | null> {
  try {
    const { data } = await authClient.post(`/store-links/${storeId}/${linkId}/click`);
    if (!data.success) throw new Error(data.message || 'Failed to track click');
    return data.data as { clickCount: number };
  } catch (error) {
    logger.error('[storeLinks] Failed to track link click:', { error });
    return null;
  }
}

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Generate a new link ID using crypto.
 */
export function generateLinkId(): string {
  return `link_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

/**
 * Validate link URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Predefined link templates for common use cases.
 */
export const LINK_TEMPLATES = {
  website: (url: string) => ({ type: 'website' as LinkType, title: 'Website', url }),
  menu: (url: string) => ({ type: 'menu' as LinkType, title: 'View Menu', url }),
  reservation: (url: string) => ({ type: 'reservation' as LinkType, title: 'Book a Table', url }),
  order: (url: string) => ({ type: 'order' as LinkType, title: 'Order Now', url }),
  contact: (phone?: string) => ({
    type: 'contact' as LinkType,
    title: 'Call Us',
    url: phone ? `tel:${phone}` : '',
  }),
  social: {
    instagram: (handle: string) => ({
      type: 'social' as LinkType,
      title: 'Instagram',
      url: `https://instagram.com/${handle.replace('@', '')}`,
      icon: 'instagram',
    }),
    facebook: (url: string) => ({
      type: 'social' as LinkType,
      title: 'Facebook',
      url,
      icon: 'facebook',
    }),
    twitter: (handle: string) => ({
      type: 'social' as LinkType,
      title: 'Twitter',
      url: `https://twitter.com/${handle.replace('@', '')}`,
      icon: 'twitter',
    }),
  },
};
