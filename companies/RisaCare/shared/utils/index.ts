// RisaCare Shared Utils - Common Utilities

import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';

// ============================================
// ID GENERATION
// ============================================

export function generateId(prefix: string = ''): string {
  const uuid = randomUUID().replace(/-/g, '').substring(0, 16);
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function generateRecordId(): string {
  return generateId('rec');
}

export function generateAppointmentId(): string {
  return generateId('apt');
}

export function generateProfileId(): string {
  return randomUUID();
}

export function generateRiskId(): string {
  return generateId('risk');
}

export function generateEventId(): string {
  return randomUUID();
}

// ============================================
// DATE UTILITIES
// ============================================

export function now(): string {
  return new Date().toISOString();
}

export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function toTimeString(date: Date = new Date()): string {
  return date.toTimeString().substring(0, 5);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function diffDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function diffMonths(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12;
  return months + date2.getMonth() - date1.getMonth();
}

export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    case 'long':
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    case 'iso':
      return date.toISOString();
    default:
      return date.toDateString();
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// ============================================
// CRYPTO UTILITIES
// ============================================

export function hashString(str: string, secret: string): string {
  return createHmac('sha256', secret).update(str).digest('hex');
}

export function generateSecureToken(length: number = 32): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').substring(0, length);
}

// ============================================
// OBJECT UTILITIES
// ============================================

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function merge<T extends object>(target: T, source: Partial<T>): T {
  return { ...target, ...source };
}

// ============================================
// ARRAY UTILITIES
// ============================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((result, item) => {
    if (Array.isArray(item)) {
      result.push(...item);
    } else {
      result.push(item);
    }
    return result;
  }, []);
}

// ============================================
// PAGINATION UTILITIES
// ============================================

export function paginate<T>(
  array: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const items = array.slice(offset, offset + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages
  };
}

// ============================================
// STRING UTILITIES
// ============================================

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export function maskPhone(phone: string): string {
  if (phone.length < 10) return phone;
  const visible = phone.slice(-4);
  return `****${visible}`;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.substring(0, 2) + '***';
  return `${maskedName}@${domain}`;
}

// ============================================
// NUMBER UTILITIES
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount);
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return round((value / total) * 100);
}

// ============================================
// HEALTH-SPECIFIC UTILITIES
// ============================================

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return round(weightKg / (heightM * heightM));
}

export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: 'Underweight', color: '#F59E0B' };
  if (bmi < 25) return { category: 'Normal', color: '#22C55E' };
  if (bmi < 30) return { category: 'Overweight', color: '#F59E0B' };
  return { category: 'Obese', color: '#EF4444' };
}

export function getAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateCycleDay(
  lastPeriodStart: string,
  cycleLength: number = 28
): { day: number; phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal' } {
  const today = new Date();
  const lastPeriod = new Date(lastPeriodStart);
  const diffDays = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
  const day = (diffDays % cycleLength) + 1;

  let phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal';
  if (day <= 5) phase = 'menstruation';
  else if (day <= 14) phase = 'follicular';
  else if (day <= 16) phase = 'ovulation';
  else phase = 'luteal';

  return { day, phase };
}

export function predictNextPeriod(
  lastPeriodStart: string,
  cycleLength: number = 28
): string {
  const lastPeriod = new Date(lastPeriodStart);
  lastPeriod.setDate(lastPeriod.getDate() + cycleLength);
  return lastPeriod.toISOString().split('T')[0];
}

export function predictFertileWindow(
  lastPeriodStart: string,
  cycleLength: number = 28
): { start: string; end: string } {
  const ovulation = new Date(lastPeriodStart);
  ovulation.setDate(ovulation.getDate() + cycleLength - 14);

  const start = new Date(ovulation);
  start.setDate(start.getDate() - 5);

  const end = new Date(ovulation);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// ============================================
// FILE UTILITIES
// ============================================

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function isValidFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType);
}

export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// ============================================
// REQUEST ID UTILITIES
// ============================================

export function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
}

// ============================================
// RETRY UTILITIES
// ============================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoffMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000, onRetry } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        if (onRetry) onRetry(lastError, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError!;
}

// ============================================
// SLEEP UTILITIES
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// LOGGER UTILITIES (Simple)
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  profileId?: string;
  [key: string]: unknown;
}

export function createLogger(service: string) {
  const formatContext = (context?: LogContext): string => {
    if (!context) return '';
    const parts = [`[${service}]`];
    if (context.requestId) parts.push(`[${context.requestId}]`);
    if (context.userId) parts.push(`[${context.userId}]`);
    if (context.profileId) parts.push(`[${context.profileId}]`);
    return parts.join(' ');
  };

  return {
    debug: (message: string, context?: LogContext) => {
      logger.debug(`${formatContext(context)} ${message}`);
    },
    info: (message: string, context?: LogContext) => {
      logger.info(`${formatContext(context)} ${message}`);
    },
    warn: (message: string, context?: LogContext) => {
      logger.warn(`${formatContext(context)} ${message}`);
    },
    error: (message: string, error?: Error, context?: LogContext) => {
      logger.error(`${formatContext(context)} ${message}`, error?.stack || error?.message);
    }
  };
}

export const logger = createLogger('risa-care');
