/**
 * Image QR Scanner
 * Decodes QR codes from uploaded images using @zxing/library
 */

import { BrowserMultiFormatReader } from '@zxing/library';
import { logger } from '@/lib/utils/logger';
import type { QRCodeData, ScanResult } from '../types';
import { detectQRType } from './detectQRType';

/**
 * Scans a QR code from an image file
 * @param file - The image file to scan
 * @returns Promise resolving to the scan result or null if no QR found
 */
export async function scanImageQRCode(file: File): Promise<ScanResult | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      if (!imageUrl) {
        reject(new Error('Failed to read image file'));
        return;
      }

      try {
        const result = await scanFromImageUrl(imageUrl);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Scans a QR code from an image URL (data URL or remote URL)
 */
export async function scanFromImageUrl(imageUrl: string): Promise<ScanResult | null> {
  const codeReader = new BrowserMultiFormatReader();

  try {
    // Decode from image source
    const result = await codeReader.decodeFromImageUrl(imageUrl);

    if (result) {
      return {
        text: result.getText(),
        format: result.getBarcodeFormat().toString(),
        timestamp: Date.now(),
      };
    }

    return null;
  } catch (err) {
    // NotFoundException means no QR code found
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes('NotFound') || errorMessage.includes('no barcode')) {
      logger.debug('[ImageQRScanner] No QR code found in image');
      return null;
    }

    logger.error('[ImageQRScanner] Failed to decode image:', { error: err });
    throw err;
  }
}

/**
 * Scans a QR code from an HTMLImageElement
 */
export async function scanFromImageElement(img: HTMLImageElement): Promise<ScanResult | null> {
  const codeReader = new BrowserMultiFormatReader();

  try {
    const result = await codeReader.decodeFromImageElement(img);

    if (result) {
      return {
        text: result.getText(),
        format: result.getBarcodeFormat().toString(),
        timestamp: Date.now(),
      };
    }

    return null;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes('NotFound') || errorMessage.includes('no barcode')) {
      return null;
    }

    logger.error('[ImageQRScanner] Failed to decode from element:', { error: err });
    throw err;
  }
}

/**
 * Validates an image file before scanning
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or BMP image.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image is too large. Please upload an image smaller than 10MB.',
    };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Image file is empty or corrupted.',
    };
  }

  return { valid: true };
}

/**
 * Creates a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Extract QR data from scan result
 */
export function extractQRData(result: ScanResult): QRCodeData {
  return {
    raw: result.text,
    type: detectQRType(result.text),
    metadata: extractMetadata(result.text),
  };
}

/**
 * Extract metadata from QR code content
 */
function extractMetadata(code: string): QRCodeData['metadata'] {
  const metadata: QRCodeData['metadata'] = {};

  // Extract store slug from URL
  try {
    if (code.startsWith('http://') || code.startsWith('https://')) {
      const url = new URL(code);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length >= 1) {
        metadata.storeSlug = segments[0];
      }
    }
  } catch {
    // Not a URL
  }

  // Extract room code
  const roomMatch = code.match(/RZ-ROOM-([A-Z0-9]+)/i);
  if (roomMatch) {
    metadata.roomCode = roomMatch[1];
  }

  // Extract campaign ID
  const campaignMatch = code.match(/campaign[_-]?id[=:](\w+)/i);
  if (campaignMatch) {
    metadata.campaignId = campaignMatch[1];
  }

  return metadata;
}
