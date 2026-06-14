/**
 * Bundles API Client for Room QR
 * Handles fetching and ordering smart bundles
 */

import { logger } from '@/lib/utils/logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  includes: string[];
  category: string;
  validUntil?: string;
}

interface BundleOrder {
  bundleId: string;
  bookingId: string;
  roomId: string;
  guestId: string;
  scheduledFor?: string;
  specialNotes?: string;
}

export interface BundlesResponse {
  success: boolean;
  data?: {
    bundles: Bundle[];
    hotelId: string;
  };
  error?: string;
}

export interface BundleOrderResponse {
  success: boolean;
  data?: BundleOrder;
  error?: string;
}

export interface BundleRecommendationsResponse {
  success: boolean;
  data?: {
    recommendations: Bundle[];
  };
  error?: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function getBundles(hotelId: string): Promise<BundlesResponse> {
  try {
    const response = await fetch(`${API_BASE}/bundles?hotelId=${hotelId}`);
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch bundles:', { error });
    return { success: false, error: 'Failed to fetch bundles' };
  }
}

export async function orderBundle(order: BundleOrder): Promise<BundleOrderResponse> {
  try {
    const response = await fetch(`${API_BASE}/bundles/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return await response.json();
  } catch (error) {
    logger.error('Failed to order bundle:', { error });
    return { success: false, error: 'Failed to order bundle' };
  }
}

export async function getRecommendations(
  hotelId: string,
  guestId: string
): Promise<BundleRecommendationsResponse> {
  try {
    const response = await fetch(
      `${API_BASE}/bundles/recommendations?hotelId=${hotelId}&guestId=${guestId}`
    );
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch recommendations:', { error });
    return { success: false, error: 'Failed to fetch recommendations' };
  }
}
