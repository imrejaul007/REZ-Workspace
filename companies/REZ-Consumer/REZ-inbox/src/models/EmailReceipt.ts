import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Email receipt category types
 */
export type ReceiptCategory = 'travel' | 'food' | 'shopping' | 'subscription' | 'invoice' | 'other';

/**
 * Email receipt data model for storing imported email receipts
 */
export interface EmailReceipt {
  receipt_id: string;
  user_id: string;
  source_email: string;
  merchant_name: string;
  category: ReceiptCategory;
  amount?: number;
  currency?: string;
  date: Date;
  items?: string[];
  travel_date?: Date;
  booking_reference?: string;
  imported_at: Date;
  metadata?: Record<string, unknown>;
  confidence_score?: number;
}

/**
 * Zod schema for EmailReceipt validation
 */
export const EmailReceiptSchema = z.object({
  receipt_id: z.string().uuid(),
  user_id: z.string().min(1),
  source_email: z.string().email(),
  merchant_name: z.string().min(1),
  category: z.enum(['travel', 'food', 'shopping', 'subscription', 'invoice', 'other']),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  date: z.date(),
  items: z.array(z.string()).optional(),
  travel_date: z.date().optional(),
  booking_reference: z.string().optional(),
  imported_at: z.date(),
  metadata: z.record(z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
});

/**
 * Parsed email content structure
 */
export interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  body: string;
  htmlBody?: string;
  date: Date;
  attachments?: EmailAttachment[];
}

/**
 * Email attachment structure
 */
export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer | string;
  size: number;
}

/**
 * Email import request
 */
export interface ImportEmailRequest {
  user_id: string;
  email: ParsedEmail;
  options?: ImportOptions;
}

/**
 * Import options
 */
export interface ImportOptions {
  skip_duplicates?: boolean;
  category_override?: ReceiptCategory;
  confidence_threshold?: number;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  receipt?: EmailReceipt;
  error?: string;
  is_duplicate?: boolean;
}

/**
 * Create a new EmailReceipt instance
 */
export function createEmailReceipt(
  data: Omit<EmailReceipt, 'receipt_id' | 'imported_at'>
): EmailReceipt {
  return {
    ...data,
    receipt_id: uuidv4(),
    imported_at: new Date(),
  };
}

/**
 * Validate email receipt data
 */
export function validateEmailReceipt(data: unknown): EmailReceipt {
  return EmailReceiptSchema.parse(data);
}

/**
 * Category detection result
 */
export interface CategoryDetection {
  category: ReceiptCategory;
  confidence: number;
  indicators: string[];
}
