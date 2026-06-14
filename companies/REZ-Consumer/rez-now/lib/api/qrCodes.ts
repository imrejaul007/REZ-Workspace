/**
 * QR Code Generation API client for generating styled QR codes.
 *
 * Endpoints:
 * POST /qr/generate       - Generate a QR code image (base64)
 * POST /qr/generate/png   - Generate a QR code as PNG buffer
 * GET  /qr/:storeId/links - Get QR codes for all store links
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export type QRType = 'store' | 'menu' | 'reservation' | 'custom';

export interface QRStyle {
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string;
  width?: number;
  margin?: number;
}

export interface QRGenerateRequest {
  storeId: string;
  type: QRType;
  url: string;
  style?: QRStyle;
}

export interface QRGenerateResponse {
  storeId: string;
  type: QRType;
  url: string;
  qrCode: string; // base64 data URL
  style: {
    foregroundColor: string;
    backgroundColor: string;
    width: number;
    margin: number;
  };
}

export interface QRLinkResponse {
  linkId: string;
  type: string;
  title: string;
  url: string;
  qrCode: string; // base64 data URL
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Generate a QR code as base64 data URL.
 */
export async function generateQRCode(request: QRGenerateRequest): Promise<QRGenerateResponse | null> {
  try {
    const { data } = await authClient.post('/qr/generate', request);
    if (!data.success) throw new Error(data.message || 'Failed to generate QR code');
    return data.data as QRGenerateResponse;
  } catch (error) {
    logger.error('[qrCodes] Failed to generate QR code:', { error });
    return null;
  }
}

/**
 * Generate a QR code as PNG buffer (base64).
 */
export async function generateQRCodePNG(
  storeId: string,
  url: string,
  style?: QRStyle
): Promise<string | null> {
  try {
    const { data } = await authClient.post('/qr/generate/png', { storeId, url, style });
    if (!data.success) throw new Error(data.message || 'Failed to generate QR PNG');
    return data.data?.png as string | null;
  } catch (error) {
    logger.error('[qrCodes] Failed to generate QR PNG:', { error });
    return null;
  }
}

/**
 * Get QR codes for all store links.
 */
export async function getStoreLinkQRCodes(
  storeId: string,
  baseUrl?: string
): Promise<QRLinkResponse[]> {
  try {
    const { data } = await authClient.get(`/qr/${storeId}/links`, {
      params: { baseUrl },
    });
    if (!data.success) throw new Error(data.message || 'Failed to fetch QR codes');
    return data.data as QRLinkResponse[];
  } catch (error) {
    logger.error('[qrCodes] Failed to fetch QR codes:', { error });
    return [];
  }
}

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Convert QR code base64 to downloadable blob.
 */
export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Download QR code as file.
 */
export function downloadQRCode(base64: string, filename = 'qr-code.png'): void {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy QR code to clipboard.
 */
export async function copyQRCodeToClipboard(base64: string): Promise<boolean> {
  try {
    const blob = base64ToBlob(base64);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (error) {
    logger.error('[qrCodes] Failed to copy QR to clipboard:', { error });
    return false;
  }
}

/**
 * Share QR code using Web Share API.
 */
export async function shareQRCode(
  base64: string,
  title: string,
  text: string,
  url?: string
): Promise<boolean> {
  try {
    if (navigator.share) {
      const blob = base64ToBlob(base64);
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      await navigator.share({
        title,
        text,
        url,
        files: [file],
      });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[qrCodes] Failed to share QR code:', { error });
    return false;
  }
}

/**
 * Common QR style presets.
 */
export const QR_PRESETS = {
  classic: {
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  brand: {
    foregroundColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  dark: {
    foregroundColor: '#FFFFFF',
    backgroundColor: '#000000',
  },
  gradient: {
    foregroundColor: '#6366F1',
    backgroundColor: '#FFFFFF',
  },
};
