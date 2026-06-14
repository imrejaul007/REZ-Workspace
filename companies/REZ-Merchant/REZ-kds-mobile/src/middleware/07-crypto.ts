/**
 * REZ Security Utilities - Cryptography
 * Copy to: src/utils/crypto.ts
 *
 * Usage:
 *   import { encrypt, decrypt, generateApiKey, hash } from './utils/crypto';
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 * Returns: iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt encrypted data
 */
export function decrypt(encrypted: string): string {
  if (!encrypted || !encrypted.includes(':')) return encrypted;

  try {
    const [ivHex, authTagHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    throw new Error('Decryption failed');
  }
}

/**
 * Generate cryptographically secure random string
 */
export function randomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate secure API key with prefix
 * Format: prefix_randomId
 */
export function generateApiKey(prefix: string = 'rez'): string {
  const random = crypto.randomBytes(24).toString('base64url');
  return `${prefix}_${random}`;
}

/**
 * Hash sensitive identifiers (one-way)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Timing-safe comparison
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    try {
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    } catch { /* ignore */ }
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Escape regex special characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate idempotency key
 */
export function idempotencyKey(): string {
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
}
