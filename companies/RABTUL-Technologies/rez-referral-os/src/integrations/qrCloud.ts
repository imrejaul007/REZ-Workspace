/**
 * QR Cloud Integration for REZ Referral OS
 * Connects Creator QR functionality with the Referral System
 *
 * QR Cloud Service: http://localhost:4300
 */

import axios, { AxiosInstance } from 'axios';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

export interface QRCodeResponse {
  success: boolean;
  qrCode: string;
  url: string;
  shortCode?: string;
}

export interface QRScannedEvent {
  qrId: string;
  collectionSlug?: string;
  userId?: string;
  ip?: string;
  deviceId?: string;
  location?: { lat: number; lng: number };
  scannedAt: string;
}

export interface CreatorCollection {
  id: string;
  creatorId: string;
  name: string;
  slug: string;
  description?: string;
  items?: string[];
  qrEnabled: boolean;
  createdAt: string;
}

export class QRCloudIntegration {
  private client: AxiosInstance;
  private static instance: QRCloudIntegration;

  private constructor() {
    const env = validateEnv();
    this.client = axios.create({
      baseURL: process.env.QR_CLOUD_SERVICE_URL || 'http://localhost:4300',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add internal auth
    this.client.interceptors.request.use((config) => {
      const env = validateEnv();
      config.headers['X-Internal-Token'] = env.INTERNAL_SERVICE_TOKEN || '';
      config.headers['X-Internal-Service'] = 'rez-referral-os';
      return config;
    });
  }

  static getInstance(): QRCloudIntegration {
    if (!QRCloudIntegration.instance) {
      QRCloudIntegration.instance = new QRCloudIntegration();
    }
    return QRCloudIntegration.instance;
  }

  /**
   * Generate a QR code for a referral/collection
   */
  async generateQRCode(params: {
    type: 'referral' | 'creator_collection';
    collectionSlug?: string;
    referralCode?: string;
    creatorHandle?: string;
    metadata?: Record<string, unknown>;
  }): Promise<QRCodeResponse> {
    try {
      const response = await this.client.post('/api/qr/generate', {
        type: params.type,
        collectionSlug: params.collectionSlug,
        referralCode: params.referralCode,
        creatorHandle: params.creatorHandle,
        metadata: {
          ...params.metadata,
          source: 'referral-os',
        },
      });

      logger.info('[QRCloud] QR generated:', {
        type: params.type,
        collectionSlug: params.collectionSlug,
      });

      return {
        success: true,
        qrCode: response.data.qrCode,
        url: response.data.url,
        shortCode: response.data.shortCode,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[QRCloud] QR generation failed:', {
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        qrCode: '',
        url: '',
      };
    }
  }

  /**
   * Register a QR scan event
   */
  async registerScan(data: QRScannedEvent): Promise<{ success: boolean; scanId?: string }> {
    try {
      const response = await this.client.post('/api/qr/scan', {
        qrId: data.qrId,
        collectionSlug: data.collectionSlug,
        userId: data.userId,
        ip: data.ip,
        deviceId: data.deviceId,
        location: data.location,
        scannedAt: data.scannedAt,
        source: 'referral-os',
      });

      logger.info('[QRCloud] Scan registered:', { qrId: data.qrId });

      return {
        success: true,
        scanId: response.data.scanId,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[QRCloud] Scan registration failed:', {
        error: err.response?.data?.message || err.message,
      });

      return { success: false };
    }
  }

  /**
   * Get QR analytics for a creator
   */
  async getCreatorQRAnalytics(creatorHandle: string): Promise<{
    success: boolean;
    analytics?: {
      totalScans: number;
      uniqueUsers: number;
      scansToday: number;
      scansThisWeek: number;
      topLocations?: Array<{ lat: number; lng: number; count: number }>;
    };
  }> {
    try {
      const response = await this.client.get(`/api/analytics/creator/${creatorHandle}`);

      return {
        success: true,
        analytics: response.data.analytics,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[QRCloud] Analytics fetch failed:', {
        error: err.response?.data?.message || err.message,
      });

      return { success: false };
    }
  }

  /**
   * Create a collection with QR enabled
   */
  async createCollection(params: {
    creatorId: string;
    creatorHandle: string;
    name: string;
    slug: string;
    description?: string;
    items?: string[];
  }): Promise<{ success: boolean; collection?: CreatorCollection; qrUrl?: string }> {
    try {
      const response = await this.client.post('/api/collections', {
        creatorId: params.creatorId,
        creatorHandle: params.creatorHandle,
        name: params.name,
        slug: params.slug,
        description: params.description,
        items: params.items,
        qrEnabled: true,
        source: 'referral-os',
      });

      logger.info('[QRCloud] Collection created:', {
        creatorHandle: params.creatorHandle,
        slug: params.slug,
      });

      return {
        success: true,
        collection: response.data.collection,
        qrUrl: response.data.qrUrl,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[QRCloud] Collection creation failed:', {
        error: err.response?.data?.message || err.message,
      });

      return { success: false };
    }
  }

  /**
   * Get collection QR data
   */
  async getCollectionQR(collectionSlug: string): Promise<QRCodeResponse> {
    try {
      const response = await this.client.get(`/api/qr/collection/${collectionSlug}`);

      return {
        success: true,
        qrCode: response.data.qrCode,
        url: response.data.url,
        shortCode: response.data.shortCode,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[QRCloud] Collection QR fetch failed:', {
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        qrCode: '',
        url: '',
      };
    }
  }

  /**
   * Track offline scan (for when device is offline)
   */
  async queueOfflineScan(data: QRScannedEvent): Promise<void> {
    // In production, this would queue to Redis for later sync
    logger.info('[QRCloud] Offline scan queued:', {
      qrId: data.qrId,
      userId: data.userId,
    });
  }
}

// Singleton export
export const qrCloud = QRCloudIntegration.getInstance();
