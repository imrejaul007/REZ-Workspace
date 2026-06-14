import { z } from 'zod';

// Validation Schemas
export const EmailValidationRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  options: z.object({
    checkMX: z.boolean().optional().default(true),
    checkSMTP: z.boolean().optional().default(false),
    checkDisposable: z.boolean().optional().default(true),
  }).optional(),
});

export const BulkEmailValidationRequestSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(100),
  options: z.object({
    checkMX: z.boolean().optional().default(true),
    checkSMTP: z.boolean().optional().default(false),
    checkDisposable: z.boolean().optional().default(true),
  }).optional(),
});

// Type Definitions
export interface EmailValidationResult {
  email: string;
  valid: boolean;
  syntax: SyntaxValidation;
  mx?: MXValidation;
  smtp?: SMTPValidation;
  disposable?: DisposableCheck;
  score: number;
  isRisky: boolean;
  riskFactors: string[];
}

export interface SyntaxValidation {
  valid: boolean;
  normalized: string;
  domain: string;
  localPart: string;
}

export interface MXValidation {
  hasMX: boolean;
  mxRecords: string[];
  reachable: boolean;
  score: number;
}

export interface SMTPValidation {
  connected: boolean;
  acceptsMail: boolean | null;
  hasCatchAll: boolean | null;
  responseTime: number;
  score: number;
}

export interface DisposableCheck {
  isDisposable: boolean;
  provider: string | null;
  score: number;
}

export interface MXRecord {
  priority: number;
  exchange: string;
}

export interface ValidationCache {
  email: string;
  result: EmailValidationResult;
  timestamp: Date;
  ttl: number;
}

export interface BulkValidationResult {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  results: EmailValidationResult[];
  summary: {
    syntaxFailures: number;
    mxFailures: number;
    smtpFailures: number;
    disposableCount: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Disposable email providers list
export const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'spam4.me',
  'grr.la',
  'dispostable.com',
  'mintemail.com',
  'mailnesia.com',
  'tempr.email',
  'discard.email',
  'discardmail.com',
  'spamgourmet.com',
  'mytrashmail.com',
  'mailexpire.com',
  'mailnull.com',
  'e4ward.com',
  'spambox.us',
  'jetable.org',
  'trash-mail.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'tempail.com',
  'tempinbox.com',
  'emailondeck.com',
  'mohmal.com',
  'fakemailgenerator.com',
  'emkei.cz',
  'anonymbox.com',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'hide.biz.st',
  'mytrashmail.com',
];

// Type exports for Zod inference
export type EmailValidationRequest = z.infer<typeof EmailValidationRequestSchema>;
export type BulkEmailValidationRequest = z.infer<typeof BulkEmailValidationRequestSchema>;
