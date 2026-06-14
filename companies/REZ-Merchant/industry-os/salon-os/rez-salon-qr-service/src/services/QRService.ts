import logger from './utils/logger';

import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface QRPayload {
  salonId: string;
  locationId: string;
  timestamp: number;
  nonce: string;
}

export class QRService {
  private readonly secret: string;

  constructor(secret?: string) {
    // CRITICAL: Fail if QR_SECRET is not set in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (!secret && !process.env.QR_SECRET) {
      if (isProduction) {
        throw new Error('QR_SECRET environment variable is required in production');
      }
      logger.warn('[QRService] QR_SECRET not set, using insecure default (development only)');
    }
    this.secret = secret || process.env.QR_SECRET || 'dev-only-secret-do-not-use-in-prod';
  }

  /**
   * Generate a unique salon QR code payload
   */
  generatePayload(salonId: string, locationId: string): QRPayload {
    return {
      salonId,
      locationId,
      timestamp: Date.now(),
      nonce: uuidv4(),
    };
  }

  /**
   * Create a signed QR payload to prevent tampering
   */
  signPayload(payload: QRPayload): string {
    const data = `${payload.salonId}:${payload.locationId}:${payload.timestamp}:${payload.nonce}`;
    const signature = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
    return Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64url');
  }

  /**
   * Verify QR code signature
   */
  verifyPayload(encoded: string): QRPayload | null {
    try {
      const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      const { sig, ...payload } = decoded;

      const data = `${payload.salonId}:${payload.locationId}:${payload.timestamp}:${payload.nonce}`;
      const expectedSig = crypto.createHmac('sha256', this.secret).update(data).digest('hex');

      // Check signature
      if (sig !== expectedSig) {
        return null;
      }

      // Check if QR is not too old (24 hours max)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - payload.timestamp > maxAge) {
        return null;
      }

      return payload as QRPayload;
    } catch {
      return null;
    }
  }

  /**
   * Generate a QR code as data URL (for display)
   */
  async generateQRDataURL(salonId: string, locationId: string): Promise<string> {
    const payload = this.generatePayload(salonId, locationId);
    const signed = this.signPayload(payload);

    return QRCode.toDataURL(signed, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Generate a QR code as buffer (for saving to file)
   */
  async generateQRBuffer(salonId: string, locationId: string): Promise<Buffer> {
    const payload = this.generatePayload(salonId, locationId);
    const signed = this.signPayload(payload);

    return QRCode.toBuffer(signed, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      type: 'png',
    });
  }

  /**
   * Generate multiple QR codes for different locations in a salon
   */
  async generateSalonQRCodes(
    salonId: string,
    locations: Array<{ id: string; name: string }>
  ): Promise<Array<{ locationId: string; locationName: string; qrDataUrl: string }>> {
    const results = await Promise.all(
      locations.map(async (loc) => ({
        locationId: loc.id,
        locationName: loc.name,
        qrDataUrl: await this.generateQRDataURL(salonId, loc.id),
      }))
    );
    return results;
  }
}

export const qrService = new QRService();
