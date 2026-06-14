/**
 * QR Service - Event Connector
 *
 * Hook into QR services to emit events
 */

import { eventConnector } from './eventConnectors';

export interface QRConnector {
  /**
   * Hook: QR scanned
   */
  onQRScan(scan: {
    qrId: string;
    userId?: string;
    qrType: 'merchant' | 'product' | 'payment' | 'menu' | 'safe' | 'verify' | 'campaign';
    merchantId?: string;
    source: 'camera' | 'deeplink' | 'nfc' | 'beacon';
    location?: { lat: number; lng: number };
  }): void;

  /**
   * Hook: QR shared
   */
  onQRShared(qr: {
    qrId: string;
    userId: string;
    qrType: string;
    shareMethod: 'whatsapp' | 'sms' | 'email' | 'copy' | 'social';
  }): void;

  /**
   * Hook: QR campaign scanned
   */
  onCampaignScan(scan: {
    qrId: string;
    campaignId: string;
    userId?: string;
    merchantId: string;
    location?: { lat: number; lng: number };
  }): void;

  /**
   * Hook: QR created
   */
  onQRCreated(qr: {
    qrId: string;
    merchantId?: string;
    qrType: string;
    createdAt: string;
  }): void;

  /**
   * Hook: QR expired
   */
  onQRExpired(qr: {
    qrId: string;
    qrType: string;
    expiredAt: string;
  }): void;
}

export function createQRConnector(): QRConnector {
  return {
    onQRScan: (scan) => {
      eventConnector.emit('qr.scanned', {
        qrId: scan.qrId,
        qrType: scan.qrType,
        merchantId: scan.merchantId,
        source: scan.source,
        location: scan.location,
        scannedAt: new Date().toISOString()
      }, {
        userId: scan.userId,
        correlationId: scan.qrId
      });
    },

    onQRShared: (qr) => {
      eventConnector.emit('qr.shared', {
        qrId: qr.qrId,
        qrType: qr.qrType,
        shareMethod: qr.shareMethod,
        sharedAt: new Date().toISOString()
      }, {
        userId: qr.userId,
        correlationId: qr.qrId
      });
    },

    onCampaignScan: (scan) => {
      eventConnector.emit('qr.campaign.scanned', {
        qrId: scan.qrId,
        campaignId: scan.campaignId,
        merchantId: scan.merchantId,
        location: scan.location,
        scannedAt: new Date().toISOString()
      }, {
        userId: scan.userId,
        correlationId: scan.campaignId
      });
    },

    onQRCreated: (qr) => {
      eventConnector.emit('qr.created', {
        qrId: qr.qrId,
        merchantId: qr.merchantId,
        qrType: qr.qrType,
        createdAt: qr.createdAt
      }, {
        correlationId: qr.qrId
      });
    },

    onQRExpired: (qr) => {
      eventConnector.emit('qr.expired', {
        qrId: qr.qrId,
        qrType: qr.qrType,
        expiredAt: qr.expiredAt
      }, {
        correlationId: qr.qrId
      });
    }
  };
}

export const qrConnector = createQRConnector();
export default qrConnector;
