/**
 * REZ Go QR Image Generation Service
 *
 * Generates QR code images for:
 * - Store entry QR
 * - Exit QR
 * - Recovery QR
 */

import QRCode from 'qrcode';
import { config } from '../config/index.js';

export interface QRImageOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_OPTIONS: QRImageOptions = {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

/**
 * Generate QR code as base64 PNG image
 */
export async function generateQRImage(
  data: string,
  options: QRImageOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: 'M', // Medium error correction
    });

    return dataUrl;
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as Buffer (for file storage)
 */
export async function generateQRBuffer(
  data: string,
  options: QRImageOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const buffer = await QRCode.toBuffer(data, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: 'M',
    });

    return buffer;
  } catch (error) {
    console.error('QR buffer generation error:', error);
    throw new Error('Failed to generate QR buffer');
  }
}

/**
 * Generate store entry QR
 */
export async function generateStoreQR(storeId: string, storeName: string): Promise<{
  imageData: string;
  payload: object;
}> {
  const payload = {
    intent: 'go-session',
    v: 1,
    storeId,
    action: 'start',
    storeName,
  };

  const imageData = await generateQRImage(JSON.stringify(payload), {
    width: 400,
  });

  return { imageData, payload };
}

/**
 * Generate exit QR (HMAC-signed)
 */
export async function generateExitQR(
  sessionId: string,
  signature: string,
  expiresAt: number
): Promise<{
  imageData: string;
  token: string;
}> {
  const token = Buffer.from(`${sessionId}:${expiresAt}:${signature}`).toString('base64url');
  const qrData = `REZG:${token}`;

  const imageData = await generateQRImage(qrData, {
    width: 300,
  });

  return { imageData, token };
}

/**
 * Generate recovery transfer QR
 */
export async function generateRecoveryQR(
  transferId: string,
  sessionId: string
): Promise<{
  imageData: string;
  payload: object;
}> {
  const payload = {
    intent: 'go-recovery',
    v: 1,
    transferId,
    sessionId,
  };

  const imageData = await generateQRImage(JSON.stringify(payload), {
    width: 400,
  });

  return { imageData, payload };
}

/**
 * Generate product QR
 */
export async function generateProductQR(
  barcode: string,
  storeId: string,
  sessionId?: string
): Promise<{
  imageData: string;
  payload: object;
}> {
  const payload: Record<string, string> = {
    intent: 'go-product',
    v: 1,
    storeId,
    barcode,
  };

  if (sessionId) {
    payload.sessionId = sessionId;
  }

  const imageData = await generateQRImage(JSON.stringify(payload), {
    width: 200,
  });

  return { imageData, payload };
}

/**
 * Generate QR for bulk printing
 */
export async function generateBulkQRCodes(
  storeId: string,
  storeName: string,
  count: number
): Promise<Array<{
  index: number;
  imageData: string;
  trackingId: string;
}>> {
  const results = [];

  for (let i = 0; i < count; i++) {
    const trackingId = `QR-${Date.now().toString(36).toUpperCase()}-${i + 1}`;
    const payload = {
      intent: 'go-session',
      v: 1,
      storeId,
      action: 'start',
      storeName,
      trackingId,
    };

    const imageData = await generateQRImage(JSON.stringify(payload), {
      width: 300,
    });

    results.push({
      index: i + 1,
      imageData,
      trackingId,
    });
  }

  return results;
}

export default {
  generateQRImage,
  generateQRBuffer,
  generateStoreQR,
  generateExitQR,
  generateRecoveryQR,
  generateProductQR,
  generateBulkQRCodes,
};
