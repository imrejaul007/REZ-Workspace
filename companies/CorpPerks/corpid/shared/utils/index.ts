/**
 * CorpID Shared Utilities
 */

import { randomBytes } from 'crypto';

// Entity type prefixes for CorpID
export const ENTITY_TYPE_PREFIXES = {
  INDIVIDUAL: 'IND',
  BUSINESS: 'BIZ',
  SUPPLIER: 'SUP',
  MERCHANT: 'MER',
  DRIVER: 'DRV',
  FRANCHISE: 'FRN',
} as const;

export type EntityTypePrefix = typeof ENTITY_TYPE_PREFIXES[keyof typeof ENTITY_TYPE_PREFIXES];

/**
 * Generate a unique CorpID
 * Format: CI-{TYPE}-{5 Alphanumeric characters}
 */
export function generateCorpId(entityType: string): string {
  const prefix = ENTITY_TYPE_PREFIXES[entityType as keyof typeof ENTITY_TYPE_PREFIXES] || 'IND';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CI-${prefix}-${result}`;
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Calculate checksum for CorpID
 */
export function calculateChecksum(corpId: string): string {
  const hash = randomBytes(2).toString('hex').toUpperCase();
  return hash;
}

/**
 * Validate CorpID format
 */
export function isValidCorpId(corpId: string): boolean {
  const pattern = /^CI-(IND|BIZ|SUP|MER|DRV|FRN)-[A-Z0-9]{5}$/;
  return pattern.test(corpId);
}

/**
 * Extract entity type from CorpID
 */
export function extractEntityType(corpId: string): string | null {
  const match = corpId.match(/^CI-([A-Z]{3})-[A-Z0-9]{5}$/);
  return match ? match[1] : null;
}

/**
 * CI Score tier calculation
 */
export function getCIScoreTier(score: number): 'ELITE' | 'PREMIUM' | 'VERIFIED' | 'BASIC' | 'UNVERIFIED' {
  if (score >= 900) return 'ELITE';
  if (score >= 750) return 'PREMIUM';
  if (score >= 500) return 'VERIFIED';
  if (score >= 300) return 'BASIC';
  return 'UNVERIFIED';
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    ELITE: '#FFD700',      // Gold
    PREMIUM: '#C0C0C0',    // Silver
    VERIFIED: '#3B82F6',   // Blue
    BASIC: '#9CA3AF',      // Gray
    UNVERIFIED: '#EF4444', // Red
  };
  return colors[tier] || '#9CA3AF';
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score <= 20) return 'CRITICAL';
  if (score <= 40) return 'HIGH';
  if (score <= 70) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get risk level color
 */
export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    LOW: '#22C55E',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
  };
  return colors[level] || '#9CA3AF';
}

/**
 * Calculate verification level (0-5) based on completed verifications
 */
export function calculateVerificationLevel(
  identityVerified: boolean,
  employmentVerified: boolean,
  educationVerified: boolean,
  skillsVerified: boolean,
  referencesCount: number
): number {
  let level = 0;
  if (identityVerified) level++;
  if (employmentVerified) level++;
  if (educationVerified) level++;
  if (skillsVerified) level++;
  if (referencesCount >= 3) level++;
  return level;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is expired
 */
export function isExpired(expiryDate: Date | string): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

/**
 * Mask sensitive data for display
 */
export function maskAadhaar(aadhaar: string): string {
  if (aadhaar.length !== 12) return aadhaar;
  return `${aadhaar.slice(0, 4)} **** **** ${aadhaar.slice(-4)}`;
}

export function maskPan(pan: string): string {
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return `***-***-${phone.slice(-4)}`;
}

/**
 * Sanitize input for search
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>]/g, '')
    .replace(/[\/\\]/g, '')
    .trim()
    .slice(0, 100);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Generate random alphanumeric string
 */
export function generateRandomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Delay utility for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await delay(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Pick random items from array
 */
export function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Create slug from string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse pagination from query
 */
export function parsePagination(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const pattern = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return pattern.test(phone);
}

/**
 * Validate GSTIN
 */
export function isValidGSTIN(gstin: string): boolean {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(gstin.toUpperCase());
}

/**
 * Validate PAN
 */
export function isValidPAN(pan: string): boolean {
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return pattern.test(pan.toUpperCase());
}

/**
 * Validate Aadhaar
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const pattern = /^\d{12}$/;
  return pattern.test(aadhaar);
}
