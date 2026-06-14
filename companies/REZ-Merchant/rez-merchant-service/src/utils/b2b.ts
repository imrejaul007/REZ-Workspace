/**
 * B2B Utilities for ReZ Merchant Platform
 * Contains common utility functions for B2B operations
 */

import crypto from 'crypto';
import { format, addDays, addMonths, differenceInDays, isWeekend, parseISO } from 'date-fns';
import { enIN } from 'date-fns/locale';
import {
  POLineItem,
  DueDatePreference,
  AgingBucket,
  AgingReport,
  SupplierLedgerEntry,
} from '../types/b2b';
import {
  PO_NUMBER_PREFIX,
  RFQ_NUMBER_PREFIX,
  QUOTE_NUMBER_PREFIX,
  PAYMENT_NUMBER_PREFIX,
  VOUCHER_NUMBER_PREFIX,
  DOCUMENT_NUMBER_LENGTH,
  CURRENCY_DECIMAL_PLACES,
  CURRENCY_SYMBOL,
  AGING_BUCKETS,
} from '../constants/b2b';
import {
  GST_PATTERN,
  PAN_PATTERN,
  IFSC_PATTERN,
  PHONE_PATTERN,
} from '../constants/b2b';
import { ObjectId } from 'mongoose';

// ============================================================================
// Number Generation Utilities
// ============================================================================

/**
 * Generate a unique PO number
 * Format: PO-YYYYMMDD-XXXXXXX
 */
export function generatePONumber(): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${PO_NUMBER_PREFIX}-${dateStr}-${randomStr}`;
}

/**
 * Generate a unique RFQ number
 * Format: RFQ-YYYYMMDD-XXXXXXX
 */
export function generateRFQNumber(): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${RFQ_NUMBER_PREFIX}-${dateStr}-${randomStr}`;
}

/**
 * Generate a unique Quote number
 * Format: QT-YYYYMMDD-XXXXXXX
 */
export function generateQuoteNumber(): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${QUOTE_NUMBER_PREFIX}-${dateStr}-${randomStr}`;
}

/**
 * Generate a unique Payment number
 * Format: PAY-YYYYMMDD-XXXXXXX
 */
export function generatePaymentNumber(): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${PAYMENT_NUMBER_PREFIX}-${dateStr}-${randomStr}`;
}

/**
 * Generate a voucher number with custom prefix
 * Format: {PREFIX}-YYYYMMDD-XXXXXXX
 */
export function generateVoucherNumber(prefix: string = VOUCHER_NUMBER_PREFIX): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
}

/**
 * Generate a short document number (numeric only)
 * Format: XXXXXXXXXX (10 digits)
 */
export function generateShortDocumentNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomInt(1000, 9999).toString();
  return `${timestamp}${random}`;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Calculate due date based on order date, credit period, and preference
 */
export function calculateDueDate(
  orderDate: Date,
  creditPeriodDays: number,
  preference: DueDatePreference
): Date {
  const date = new Date(orderDate);

  switch (preference) {
    case DueDatePreference.IMMEDIATE:
      // Due immediately
      return date;

    case DueDatePreference.END_OF_MONTH:
      // Due at end of the month following the credit period
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + creditPeriodDays + 1, 0);
      return endOfMonth;

    case DueDatePreference.SPECIFIC_DAY:
      // Due on the 15th of the month (or last day if month has fewer days)
      const targetMonth = new Date(date.getFullYear(), date.getMonth() + creditPeriodDays, 1);
      const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      const day = Math.min(15, lastDay);
      return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);

    default:
      // Default: credit period days from order date
      return addDays(date, creditPeriodDays);
  }
}

/**
 * Get aging bucket for a given number of days overdue
 */
export function getAgingBucket(days: number): '0-30' | '30-60' | '60-90' | '90+' {
  if (days <= 30) return '0-30';
  if (days <= 60) return '30-60';
  if (days <= 90) return '60-90';
  return '90+';
}

/**
 * Get aging buckets with amounts for a given date
 */
export function getAgingBuckets(date: Date, agingDate: Date): AgingBucket[] {
  const buckets: AgingBucket[] = [];

  for (const [key, bucket] of Object.entries(AGING_BUCKETS)) {
    buckets.push({
      label: bucket.label,
      min: bucket.min,
      max: bucket.max,
      amount: 0,
      count: 0,
    });
  }

  return buckets;
}

/**
 * Group ledger entries by aging bucket
 */
export function groupByAgingBucket(entries: SupplierLedgerEntry[]): AgingReport {
  const now = new Date();
  const buckets: AgingBucket[] = [
    { label: '0-30 days', min: 0, max: 30, amount: 0, count: 0 },
    { label: '31-60 days', min: 31, max: 60, amount: 0, count: 0 },
    { label: '61-90 days', min: 61, max: 90, amount: 0, count: 0 },
    { label: '90+ days', min: 91, max: Infinity, amount: 0, count: 0 },
  ];

  for (const entry of entries) {
    if (entry.entryType !== 'po' || !entry.dueDate) continue;

    const dueDate = typeof entry.dueDate === 'string' ? parseISO(entry.dueDate) : entry.dueDate;
    const daysOverdue = getDaysOverdue(dueDate);

    if (daysOverdue > 0) {
      const bucketIndex = daysOverdue <= 30 ? 0 : daysOverdue <= 60 ? 1 : daysOverdue <= 90 ? 2 : 3;
      buckets[bucketIndex].amount += entry.amount;
      buckets[bucketIndex].count += 1;
    }
  }

  return {
    asOfDate: now,
    totalOutstanding: buckets.reduce((sum, b) => sum + b.amount, 0),
    buckets,
  };
}

/**
 * Get days overdue from due date
 */
export function getDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = differenceInDays(now, due);
  return Math.max(0, diff);
}

/**
 * Check if a date is within business hours
 */
export function isWithinBusinessHours(
  date: Date,
  startTime: string = '09:00',
  endTime: string = '20:00'
): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentTime >= startMinutes && currentTime <= endMinutes;
}

/**
 * Check if a date is a business day (excludes weekends)
 */
export function isBusinessDay(date: Date, excludeDays: number[] = [0]): boolean {
  const dayOfWeek = date.getDay();
  return !excludeDays.includes(dayOfWeek) && !isWeekend(date);
}

/**
 * Get next business day
 */
export function getNextBusinessDay(fromDate: Date, excludeDays: number[] = [0]): Date {
  let nextDay = addDays(fromDate, 1);
  while (!isBusinessDay(nextDay, excludeDays)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Format date for India locale
 */
export function formatDateIndia(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr, { locale: enIN });
}

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format amount as currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCY_DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY_DECIMAL_PLACES,
  }).format(amount);
}

/**
 * Format amount in Indian currency format (₹)
 * Example: 1234567.89 -> ₹12,34,567.89
 */
export function formatIndianCurrency(amount: number): string {
  const formatted = amount.toFixed(CURRENCY_DECIMAL_PLACES);
  const parts = formatted.split('.');

  // Format integer part in Indian style (lakhs/crores)
  const integerPart = parts[0];
  const lastThree = integerPart.substring(integerPart.length - 3);
  const rest = integerPart.substring(0, integerPart.length - 3);

  const formattedInteger = rest
    .split('')
    .reverse()
    .map((char, index) => {
      if (index > 0 && index % 2 === 0) {
        return ',' + char;
      }
      return char;
    })
    .reverse()
    .join('') + lastThree;

  return `${CURRENCY_SYMBOL}${formattedInteger}${parts[1] ? '.' + parts[1] : ''}`;
}

/**
 * Round amount to two decimal places
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate taxable amount with tax rate
 */
export function calculateTaxableAmount(amount: number, taxRate: number): number {
  return roundToTwoDecimals(amount * (1 + taxRate / 100));
}

// ============================================================================
// Order Total Calculations
// ============================================================================

/**
 * Order totals calculated from items
 */
export interface OrderTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Calculate totals from PO line items
 */
export function calculateTotalFromItems(items: POLineItem[]): OrderTotals {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount;
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    const itemTax = item.tax;

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
  }

  const totalAmount = subtotal - totalDiscount + totalTax;

  return {
    subtotal: roundToTwoDecimals(subtotal),
    totalDiscount: roundToTwoDecimals(totalDiscount),
    totalTax: roundToTwoDecimals(totalTax),
    totalAmount: roundToTwoDecimals(totalAmount),
  };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate GST number
 */
export function validateGstNumber(gst: string): boolean {
  if (!gst || gst.length !== 15) return false;
  return GST_PATTERN.test(gst.toUpperCase());
}

/**
 * Validate PAN number
 */
export function validatePan(pan: string): boolean {
  if (!pan || pan.length !== 10) return false;
  return PAN_PATTERN.test(pan.toUpperCase());
}

/**
 * Validate IFSC code
 */
export function validateIfsc(ifsc: string): boolean {
  if (!ifsc || ifsc.length !== 11) return false;
  return IFSC_PATTERN.test(ifsc.toUpperCase());
}

/**
 * Validate Indian phone number (10 digits)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  return PHONE_PATTERN.test(phone);
}

// ============================================================================
// Phone Utilities
// ============================================================================

/**
 * Format Indian phone number
 * Input: 9876543210 -> +91 98765 43210
 */
export function formatIndianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Add +91 if not present and length is 10
  const number = cleaned.length === 10 ? `91${cleaned}` : cleaned;

  if (number.length === 12) {
    return `+${number.slice(0, 2)} ${number.slice(2, 7)} ${number.slice(7)}`;
  }

  return phone;
}

/**
 * Validate and format phone number
 * Returns formatted phone or empty string if invalid
 */
export function validateAndFormatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.slice(1)}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+${cleaned.slice(1)}`;
  }

  return '';
}

/**
 * Mask phone number for display
 * Input: 9876543210 -> 987****210
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';

  const first = cleaned.slice(0, 3);
  const last = cleaned.slice(-3);
  return `${first}****${last}`;
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Parse amount from string (handles ₹, commas, etc.)
 * Input: "₹15,000" or "15,000" -> 15000
 */
export function parseAmountFromString(text: string): number | null {
  const cleaned = text.replace(/[₹,\s]/g, '');
  const amount = parseFloat(cleaned);

  if (isNaN(amount)) return null;
  return amount;
}

// ============================================================================
// ObjectId Utilities
// ============================================================================

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

/**
 * Convert string to ObjectId or return null
 */
export function toObjectId(id: string): ObjectId | null {
  if (!isValidObjectId(id)) return null;
  return new ObjectId(id);
}

/**
 * Create a new ObjectId string
 */
export function createObjectId(): string {
  return new ObjectId().toString();
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Group array by key
 */
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

// ============================================================================
// Percentage Calculations
// ============================================================================

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToTwoDecimals((value / total) * 100);
}

/**
 * Calculate change percentage
 */
export function calculateChangePercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return roundToTwoDecimals(((current - previous) / previous) * 100);
}

/**
 * Calculate credit utilization percentage
 */
export function calculateCreditUtilization(used: number, limit: number): number {
  if (limit === 0) return 0;
  return roundToTwoDecimals((used / limit) * 100);
}

// ============================================================================
// Reference Number Utilities
// ============================================================================

/**
 * Generate a reference number with prefix
 */
export function generateReferenceNumber(prefix: string, sequence: number): string {
  const paddedSequence = sequence.toString().padStart(DOCUMENT_NUMBER_LENGTH, '0');
  return `${prefix}${paddedSequence}`;
}

/**
 * Extract sequence number from reference
 */
export function extractSequenceNumber(reference: string): number {
  const match = reference.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Deep equality check
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Get start of day in IST
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in IST
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month in IST
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month in IST
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ============================================================================
// Safe Access Utilities
// ============================================================================

/**
 * Safe access nested property
 */
export function safeAccess<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current === undefined ? defaultValue : (current as T);
}

/**
 * Map object keys
 */
export function mapKeys<T extends object, U>(
  obj: T,
  fn: (key: keyof T, value: T[keyof T]) => U
): Record<string, U> {
  const result: Record<string, U> = {};

  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key as string] = fn(key, obj[key]);
  }

  return result;
}

/**
 * Invert object keys and values
 */
export function invertObject<T extends Record<string, string | number>>(
  obj: T
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[String(value)] = key;
  }

  return result;
}
