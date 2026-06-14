import { SafeQRPayload, SafeQRPayloadSchema } from '../schemas/safeQR';
import { SafeQRMode } from '../schemas/safeQR';
import { randomBytes } from 'crypto';

/**
 * QR Parser Service
 * Parses and validates QR code payloads
 */

export interface ParseResult {
 success: boolean;
 payload?: SafeQRPayload;
 error?: string;
 mode?: SafeQRMode;
}

/**
 * Parse a QR code payload
 */
export function parseQRPayload(data: string | object): ParseResult {
 try {
   // Try to parse if string
   let parsed;
   if (typeof data === 'string') {
     try {
       parsed = JSON.parse(data);
     } catch {
       // Try URL format
       parsed = parseUrlFormat(data);
     }
   } else {
     parsed = data;
   }

   // Validate with Zod
   const result = SafeQRPayloadSchema.safeParse(parsed);
   if (!result.success) {
     return {
       success: false,
       error: result.error.errors.map((e) => e.message).join(', '),
     };
   }

   return {
     success: true,
     payload: result.data,
   };
 } catch (error) {
   return {
     success: false,
     error: 'Invalid QR payload',
   };
 }
}

/**
 * Parse URL format QR (e.g., https://rez.app/s/REZP01)
 */
function parseUrlFormat(url: string): object | null {
 try {
   // Extract shortcode from URL
   const match = url.match(/\/s\/([A-Z0-9]{6})/i);
   if (match) {
     // We need the full payload, this is just the shortcode
     // In practice, we'd look up the shortcode in DB
     return null;
   }
   return null;
 } catch {
   return null;
 }
}

/**
 * Create QR payload from shortcode and mode
 */
export function createQRPayload(
 shortcode: string,
 qrId: string,
 mode: SafeQRMode
): SafeQRPayload {
 return {
   v: 1,
   type: 'safe',
   mode,
   id: qrId,
   shortcode,
 };
}

/**
 * Encode payload for QR code
 */
export function encodeQRPayload(payload: SafeQRPayload): string {
 return JSON.stringify(payload);
}

/**
 * Validate shortcode format
 */
export function validateShortcode(shortcode: string): boolean {
 // Format: 4 letter prefix + 2 alphanumeric chars
 const regex = /^[A-Z]{4}[A-Z0-9]{2}$/i;
 return regex.test(shortcode);
}

/**
 * Get mode from shortcode prefix
 */
export function getModeFromShortcode(shortcode: string): SafeQRMode | null {
 const prefix = shortcode.substring(0, 4).toUpperCase();
 const modeMap: Record<string, SafeQRMode> = {
   'REZP': 'pet',
   'REZN': 'personal',
   'REZD': 'device',
   'REZM': 'medical',
   'REZH': 'helmet',
   'REZC': 'child',
   'REZV': 'vehicle',
   'REZB': 'bicycle',
   'REZK': 'key',
   'REZL': 'luggage',
   'REZA': 'home',
   'REZO': 'office',
   'REZE': 'event',
   'REZS': 'student',
   'REZP': 'package',
 };
 return modeMap[prefix] || null;
}

/**
 * Generate a random shortcode suffix using crypto
 */
export function generateShortcodeSuffix(length = 2): string {
 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 // Use crypto.randomBytes for secure random generation
 const bytes = randomBytes(length);
 let result = '';
 for (let i = 0; i < length; i++) {
   result += chars[bytes[i] % chars.length];
 }
 return result;
}

/**
 * Generate unique QR ID using crypto
 */
export function generateQRId(mode: SafeQRMode): string {
 const prefix = mode.substring(0, 3);
 const random = randomBytes(8).toString('hex');
 return `${prefix}_${random}`;
}
