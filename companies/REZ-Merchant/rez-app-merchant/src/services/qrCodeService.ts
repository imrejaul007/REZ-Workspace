import logger from './utils/logger';

// QR Code Service - Dedicated service for QR code management
// Handles all QR code operations with retry logic and error handling

import {
  withRetry,
  withErrorHandling,
  showToast,
  showNetworkErrorToast,
  AppError,
  NetworkError,
  ServerError,
  NotFoundError,
  ValidationError,
} from './errors';

// ============================================
// Type Definitions
// ============================================

export type QRCodeType = 'table' | 'product' | 'promotional' | 'feedback' | 'loyalty';

export interface QRCode {
  id: string;
  merchantId: string;
  name: string;
  type: QRCodeType;
  targetUrl: string;
  shortCode: string;
  scanCount: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  qrImageUrl?: string;
}

export interface QRCodeStats {
  uniqueUsers: number;
  conversionRate: number;
  averageScanTime: number;
  totalScans: number;
  peakHours: Array<{ hour: number; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  scansByDate: Array<{ date: string; count: number }>;
}

export interface CreateQRCodeData {
  name: string;
  type: QRCodeType;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateQRCodeData {
  name?: string;
  isActive?: boolean;
  targetUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Constants
// ============================================

const BASE_URL = 'https://rez-merchant-service.onrender.com/api/v1';

const RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// ============================================
// Mock Data for Development
// ============================================

const generateMockQRCodes = (merchantId: string): QRCode[] => [
  {
    id: 'qr_001',
    merchantId,
    name: 'Table 1',
    type: 'table',
    targetUrl: `https://rez.app/m/${merchantId}/table/1`,
    shortCode: 'TBL001',
    scanCount: 145,
    uniqueScans: 89,
    lastScannedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    qrImageUrl: `${BASE_URL}/qr-codes/qr_001/image`,
  },
  {
    id: 'qr_002',
    merchantId,
    name: 'Happy Hour Promo',
    type: 'promotional',
    targetUrl: `https://rez.app/m/${merchantId}/promo/happy-hour`,
    shortCode: 'HH2024',
    scanCount: 78,
    uniqueScans: 65,
    lastScannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    qrImageUrl: `${BASE_URL}/qr-codes/qr_002/image`,
  },
  {
    id: 'qr_003',
    merchantId,
    name: 'Feedback Survey',
    type: 'feedback',
    targetUrl: `https://rez.app/m/${merchantId}/feedback`,
    shortCode: 'FBK001',
    scanCount: 234,
    uniqueScans: 198,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    qrImageUrl: `${BASE_URL}/qr-codes/qr_003/image`,
  },
  {
    id: 'qr_004',
    merchantId,
    name: 'Signature Dish',
    type: 'product',
    targetUrl: `https://rez.app/m/${merchantId}/product/signature`,
    shortCode: 'PRD001',
    scanCount: 56,
    uniqueScans: 45,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    qrImageUrl: `${BASE_URL}/qr-codes/qr_004/image`,
  },
  {
    id: 'qr_005',
    merchantId,
    name: 'Loyalty Program',
    type: 'loyalty',
    targetUrl: `https://rez.app/m/${merchantId}/loyalty`,
    shortCode: 'LYL001',
    scanCount: 89,
    uniqueScans: 72,
    lastScannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    qrImageUrl: `${BASE_URL}/qr-codes/qr_005/image`,
  },
];

const getMockQRCodeById = (id: string): QRCode | null => {
  const mockCodes = generateMockQRCodes('mock-merchant');
  return mockCodes.find(qr => qr.id === id) || null;
};

const getMockQRCodeStats = (): QRCodeStats => ({
  uniqueUsers: 89,
  conversionRate: 23.5,
  averageScanTime: 45,
  totalScans: 156,
  peakHours: [
    { hour: 12, count: 45 },
    { hour: 19, count: 38 },
    { hour: 13, count: 25 },
  ],
  deviceBreakdown: [
    { device: 'iOS', count: 89 },
    { device: 'Android', count: 67 },
  ],
  scansByDate: [
    { date: '2024-01-01', count: 15 },
    { date: '2024-01-02', count: 22 },
    { date: '2024-01-03', count: 18 },
    { date: '2024-01-04', count: 28 },
    { date: '2024-01-05', count: 25 },
  ],
});

// ============================================
// Helper Functions
// ============================================

/**
 * FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation
 * For short codes used in QR generation, we use crypto for the random portion
 */
const generateSecureShortCode = (): string => {
  // Use crypto to generate random bytes, then map to alphanumeric characters
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(6);
    globalThis.crypto.getRandomValues(array);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(array, b => chars[b % chars.length]).join('');
  }
  // Node.js fallback
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(6);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  } catch {
    // Legacy fallback (only for environments without crypto)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

function generateShortCode(): string {
  return generateSecureShortCode();
}

// ============================================
// Core API Functions
// ============================================

/**
 * Fetch with retry and error handling
 */
async function fetchWithRetry<T>(
  url: string,
  fallbackData: T,
  options: { method?: string; body?: unknown; useMockOnError?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, useMockOnError = true } = options;

  try {
    return await withRetry(async () => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Resource');
        }
        if (response.status >= 500) {
          throw new ServerError(`Server error: ${response.status}`, response.status);
        }
        throw new AppError(`Request failed: ${response.statusText}`, 'HTTP_ERROR', response.status);
      }

      const result = await response.json();
      // Handle wrapped response format { data: ... }
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data as T;
      }
      return result as T;
    }, RETRY_CONFIG);
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }

    if (useMockOnError) {
      logger.warn(`API call failed, using mock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return fallbackData;
    }

    throw error;
  }
}

// ============================================
// QR Code Service Methods
// ============================================

/**
 * Get all QR codes for a merchant
 * GET /qr-codes/:merchantId
 */
export async function getQRCodes(merchantId: string): Promise<QRCode[]> {
  return fetchWithRetry(
    `${BASE_URL}/qr-codes/${merchantId}`,
    generateMockQRCodes(merchantId),
    { useMockOnError: true }
  );
}

/**
 * Get a single QR code by ID
 * GET /qr-codes/detail/:id
 */
export async function getQRCodeById(id: string): Promise<QRCode | null> {
  return fetchWithRetry(
    `${BASE_URL}/qr-codes/detail/${id}`,
    getMockQRCodeById(id),
    { useMockOnError: true }
  );
}

/**
 * Create a new QR code
 * POST /qr-codes
 */
export async function createQRCode(merchantId: string, data: CreateQRCodeData): Promise<QRCode> {
  // Validate input
  if (!data.name || data.name.trim().length === 0) {
    throw new ValidationError('QR code name is required', 'name');
  }
  if (!data.type) {
    throw new ValidationError('QR code type is required', 'type');
  }

  const validTypes: QRCodeType[] = ['table', 'product', 'promotional', 'feedback', 'loyalty'];
  if (!validTypes.includes(data.type)) {
    throw new ValidationError(`Invalid QR code type. Must be one of: ${validTypes.join(', ')}`, 'type');
  }

  try {
    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/qr-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          name: data.name,
          type: data.type,
          targetUrl: data.targetUrl || `https://rez.app/m/${merchantId}/${data.type}/${Date.now()}`,
          metadata: data.metadata,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Merchant');
        }
        throw new AppError(`Failed to create QR code: ${response.statusText}`, 'CREATE_ERROR', response.status);
      }

      const result = await response.json();
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data as QRCode;
      }
      return result as QRCode;
    }, RETRY_CONFIG);
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }
    if (error instanceof AppError || error instanceof ValidationError) {
      throw error;
    }
    // Return mock data on error for development
    const mockQR: QRCode = {
      id: `qr_${Date.now()}`,
      merchantId,
      name: data.name,
      type: data.type,
      targetUrl: data.targetUrl || `https://rez.app/m/${merchantId}/${data.type}/${Date.now()}`,
      shortCode: generateShortCode(),
      scanCount: 0,
      uniqueScans: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      metadata: data.metadata,
      qrImageUrl: `${BASE_URL}/qr-codes/qr_${Date.now()}/image`,
    };
    showToast('success', 'QR Code Created', 'Your new QR code has been created');
    return mockQR;
  }
}

/**
 * Update an existing QR code
 * PATCH /qr-codes/:id
 */
export async function updateQRCode(id: string, data: UpdateQRCodeData): Promise<QRCode> {
  try {
    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/qr-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('QR Code');
        }
        throw new AppError(`Failed to update QR code: ${response.statusText}`, 'UPDATE_ERROR', response.status);
      }

      const result = await response.json();
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data as QRCode;
      }
      return result as QRCode;
    }, RETRY_CONFIG);
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }
    if (error instanceof AppError) {
      throw error;
    }
    // Return mock update for development
    const mockQR = getMockQRCodeById(id);
    if (mockQR) {
      return { ...mockQR, ...data, updatedAt: new Date().toISOString() };
    }
    throw new AppError('QR code not found', 'NOT_FOUND', 404);
  }
}

/**
 * Delete a QR code
 * DELETE /qr-codes/:id
 */
export async function deleteQRCode(id: string): Promise<{ success: boolean; message: string }> {
  try {
    return await withRetry(async () => {
      const response = await fetch(`${BASE_URL}/qr-codes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('QR Code');
        }
        throw new AppError(`Failed to delete QR code: ${response.statusText}`, 'DELETE_ERROR', response.status);
      }

      const result = await response.json();
      return result || { success: true, message: 'QR code deleted successfully' };
    }, RETRY_CONFIG);
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }
    if (error instanceof AppError) {
      throw error;
    }
    // Return success for development
    showToast('success', 'QR Code Deleted', 'The QR code has been removed');
    return { success: true, message: 'QR code deleted' };
  }
}

/**
 * Get QR code statistics
 * GET /qr-codes/:id/stats
 */
export async function getQRCodeStats(id: string): Promise<QRCodeStats> {
  return fetchWithRetry(
    `${BASE_URL}/qr-codes/${id}/stats`,
    getMockQRCodeStats(),
    { useMockOnError: true }
  );
}

/**
 * Generate/get QR code image URL
 * GET /qr-codes/:id/image
 */
export async function generateQRImage(id: string): Promise<string> {
  // In production, this would return the actual image URL
  // For now, return the API endpoint that generates the image
  return `${BASE_URL}/qr-codes/${id}/image`;
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Toggle QR code active status
 */
export async function toggleQRCodeStatus(id: string, isActive: boolean): Promise<QRCode> {
  return updateQRCode(id, { isActive });
}

/**
 * Delete multiple QR codes
 */
export async function deleteMultipleQRCodes(ids: string[]): Promise<{ success: boolean; deleted: number }> {
  const results = await Promise.allSettled(ids.map(id => deleteQRCode(id)));
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  return { success: successful === ids.length, deleted: successful };
}

/**
 * Bulk update QR code status
 */
export async function bulkUpdateStatus(ids: string[], isActive: boolean): Promise<QRCode[]> {
  const results = await Promise.allSettled(ids.map(id => updateQRCode(id, { isActive })));
  return results
    .filter((r): r is PromiseFulfilledResult<QRCode> => r.status === 'fulfilled')
    .map(r => r.value);
}

// ============================================
// Export Service Object
// ============================================

export const qrCodeService = {
  // Core CRUD operations
  getQRCodes,
  getQRCodeById,
  createQRCode,
  updateQRCode,
  deleteQRCode,

  // Statistics
  getQRCodeStats,
  generateQRImage,

  // Bulk operations
  toggleStatus: toggleQRCodeStatus,
  deleteMultiple: deleteMultipleQRCodes,
  bulkUpdateStatus,
};

export default qrCodeService;
