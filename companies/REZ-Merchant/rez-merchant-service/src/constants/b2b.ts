/**
 * B2B Constants for ReZ Merchant Platform
 * Contains default values, limits, and configuration constants
 */

// ============================================================================
// Credit & Payment Defaults
// ============================================================================

/** Default credit period in days */
export const DEFAULT_CREDIT_PERIOD_DAYS = 30;

/** Default interest rate per month (%) */
export const DEFAULT_INTEREST_RATE = 2.5;

/** Default grace period in days after due date */
export const DEFAULT_GRACE_DAYS = 5;

/** Maximum allowed interest rate (%) */
export const MAX_INTEREST_RATE = 24;

/** Maximum credit limit per supplier */
export const MAX_CREDIT_LIMIT = 999999999;

/** Minimum credit limit */
export const MIN_CREDIT_LIMIT = 0;

// ============================================================================
// Aging Buckets
// ============================================================================

/** Aging bucket configuration */
export const AGING_BUCKETS = {
  BUCKET_0_30: { min: 0, max: 30, label: '0-30 days' },
  BUCKET_30_60: { min: 31, max: 60, label: '31-60 days' },
  BUCKET_60_90: { min: 61, max: 90, label: '61-90 days' },
  BUCKET_90_PLUS: { min: 91, max: Infinity, label: '90+ days' },
} as const;

/** Type for aging bucket keys */
export type AgingBucketKey = keyof typeof AGING_BUCKETS;

// ============================================================================
// Business Hours & Timezone
// ============================================================================

/** Default business hours */
export const BUSINESS_HOURS = {
  /** Start time in HH:mm format */
  start: '09:00',
  /** End time in HH:mm format */
  end: '20:00',
  /** IANA timezone identifier */
  timezone: 'Asia/Kolkata',
  /** Days to exclude (0 = Sunday, 1 = Monday, etc.) */
  excludeDays: [0] as number[],
} as const;

/** Default date format */
export const DATE_FORMAT = 'DD/MM/YYYY';

/** Default date-time format */
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

/** India timezone */
export const INDIA_TIMEZONE = 'Asia/Kolkata';

// ============================================================================
// GST Tax Rates
// ============================================================================

/** GST tax rate options with labels */
export const GST_TAX_RATES = {
  0: 'Exempt',
  5: '5%',
  12: '12%',
  18: '18%',
  28: '28%',
} as const;

/** Default GST rate */
export const DEFAULT_GST_RATE = 18;

/** All taxable GST rates */
export const TAXABLE_GST_RATES = [5, 12, 18, 28] as const;

// ============================================================================
// Dunning Configuration
// ============================================================================

/** Default dunning notification steps */
export const DUNNING_DEFAULT_STEPS = [
  { days: -7, channel: 'whatsapp', priority: 'low' as const },
  { days: -3, channel: 'whatsapp', priority: 'medium' as const },
  { days: 0, channel: 'all', priority: 'medium' as const },
  { days: 1, channel: 'all', priority: 'high' as const },
  { days: 7, channel: 'all', priority: 'high' as const },
  { days: 14, channel: 'all', priority: 'critical' as const },
  { days: 30, channel: 'all', priority: 'critical' as const },
] as const;

/** Maximum dunning attempts per channel */
export const MAX_DUNNING_ATTEMPTS = 5;

/** Dunning reminder interval in days */
export const DUNNING_REMINDER_INTERVAL = 3;

// ============================================================================
// Document Number Formats
// ============================================================================

/** PO number prefix */
export const PO_NUMBER_PREFIX = 'PO';

/** RFQ number prefix */
export const RFQ_NUMBER_PREFIX = 'RFQ';

/** Quote number prefix */
export const QUOTE_NUMBER_PREFIX = 'QT';

/** Payment number prefix */
export const PAYMENT_NUMBER_PREFIX = 'PAY';

/** Voucher number prefix */
export const VOUCHER_NUMBER_PREFIX = 'V';

/** Invoice number prefix */
export const INVOICE_NUMBER_PREFIX = 'INV';

/** Credit note number prefix */
export const CREDIT_NOTE_PREFIX = 'CN';

/** Document number length (without prefix) */
export const DOCUMENT_NUMBER_LENGTH = 8;

// ============================================================================
// Validation Limits
// ============================================================================

/** Maximum name length */
export const MAX_NAME_LENGTH = 200;

/** Maximum email length */
export const MAX_EMAIL_LENGTH = 255;

/** Maximum phone length */
export const PHONE_LENGTH = 10;

/** Maximum GST number length */
export const GST_NUMBER_LENGTH = 15;

/** Maximum PAN length */
export const PAN_LENGTH = 10;

/** Maximum IFSC length */
export const IFSC_LENGTH = 11;

/** Maximum notes length */
export const MAX_NOTES_LENGTH = 1000;

/** Maximum items per PO */
export const MAX_PO_ITEMS = 1000;

/** Maximum attachments per document */
export const MAX_ATTACHMENTS = 10;

/** Maximum file size (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================================
// Currency
// ============================================================================

/** Default currency */
export const DEFAULT_CURRENCY = 'INR';

/** Currency symbol */
export const CURRENCY_SYMBOL = '₹';

/** Currency code for INR */
export const INR_CODE = 'INR';

/** Decimal places for currency */
export const CURRENCY_DECIMAL_PLACES = 2;

// ============================================================================
// API Limits
// ============================================================================

/** Default page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size */
export const MAX_PAGE_SIZE = 100;

/** Default sort field */
export const DEFAULT_SORT_FIELD = 'createdAt';

/** Default sort order */
export const DEFAULT_SORT_ORDER = 'desc' as const;

// ============================================================================
// Regex Patterns
// ============================================================================

/** GST number pattern */
export const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** PAN number pattern */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** IFSC code pattern */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Indian phone number pattern (10 digits) */
export const PHONE_PATTERN = /^[6-9][0-9]{9}$/;

/** Email pattern */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** HSN code pattern (4, 6, or 8 digits) */
export const HSN_PATTERN = /^[0-9]{4,8}$/;

// ============================================================================
// Status Transitions
// ============================================================================

/** Valid PO status transitions */
export const PO_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'draft'],
  approved: ['ordered', 'cancelled'],
  rejected: ['draft'],
  ordered: ['partial_received', 'received', 'cancelled'],
  partial_received: ['received', 'partial_received', 'cancelled'],
  received: ['closed', 'partial_received'],
  cancelled: [],
  closed: [],
} as const;

/** Valid supplier status transitions */
export const SUPPLIER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'rejected'],
  approved: ['blocked', 'pending'],
  rejected: ['pending'],
  blocked: ['approved', 'pending'],
} as const;

/** Valid RFQ status transitions */
export const RFQ_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'cancelled'],
  open: ['closed', 'awarded', 'cancelled'],
  closed: ['awarded'],
  awarded: [],
  cancelled: [],
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/** Error messages */
export const ERROR_MESSAGES = {
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  SUPPLIER_INACTIVE: 'Supplier is not active',
  PO_NOT_FOUND: 'Purchase order not found',
  PO_ALREADY_APPROVED: 'Purchase order is already approved',
  PO_ALREADY_PAID: 'Purchase order is already fully paid',
  INSUFFICIENT_CREDIT: 'Insufficient credit limit',
  DUPLICATE_GST: 'A supplier with this GST number already exists',
  DUPLICATE_PAN: 'A supplier with this PAN number already exists',
  INVALID_TRANSITION: 'Invalid status transition',
  INVALID_GST: 'Invalid GST number format',
  INVALID_PAN: 'Invalid PAN number format',
  INVALID_IFSC: 'Invalid IFSC code format',
  INVALID_PHONE: 'Invalid phone number format',
  DUPLICATE_PO_NUMBER: 'Purchase order number already exists',
  QUOTE_NOT_FOUND: 'Quote not found',
  RFQ_NOT_FOUND: 'RFQ not found',
  RFQ_CLOSED: 'RFQ is closed for submissions',
  PAYMENT_FAILED: 'Payment processing failed',
  CREDIT_LINE_SUSPENDED: 'Credit line is suspended',
} as const;

// ============================================================================
// Email/Notification Templates
// ============================================================================

/** Email template IDs */
export const EMAIL_TEMPLATE_IDS = {
  PO_CREATED: 'po_created',
  PO_APPROVED: 'po_approved',
  PO_REJECTED: 'po_rejected',
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_OVERDUE: 'payment_overdue',
  CREDIT_LINE_SUSPENDED: 'credit_line_suspended',
  RFQ_RECEIVED: 'rfq_received',
  QUOTE_RECEIVED: 'quote_received',
} as const;

/** WhatsApp template names */
export const WHATSAPP_TEMPLATE_NAMES = {
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_OVERDUE: 'payment_overdue',
  PO_STATUS_UPDATE: 'po_status_update',
} as const;

// ============================================================================
// Cache Keys
// ============================================================================

/** Redis cache key prefixes */
export const CACHE_KEYS = {
  SUPPLIER_PREFIX: 'b2b:supplier:',
  PO_PREFIX: 'b2b:po:',
  CREDIT_PREFIX: 'b2b:credit:',
  DUNNING_PREFIX: 'b2b:dunning:',
  DASHBOARD_PREFIX: 'b2b:dashboard:',
} as const;

/** Cache TTL in seconds */
export const CACHE_TTL = {
  SUPPLIER: 300, // 5 minutes
  PO: 60, // 1 minute
  CREDIT: 300, // 5 minutes
  DASHBOARD: 60, // 1 minute
} as const;

// ============================================================================
// Event Types
// ============================================================================

/** B2B event types for event sourcing */
export const B2B_EVENTS = {
  SUPPLIER_CREATED: 'supplier.created',
  SUPPLIER_UPDATED: 'supplier.updated',
  SUPPLIER_STATUS_CHANGED: 'supplier.status_changed',
  PO_CREATED: 'po.created',
  PO_UPDATED: 'po.updated',
  PO_STATUS_CHANGED: 'po.status_changed',
  PAYMENT_RECORDED: 'payment.recorded',
  CREDIT_LIMIT_CHANGED: 'credit.limit_changed',
  DUNNING_TRIGGERED: 'dunning.triggered',
  DUNNING_COMPLETED: 'dunning.completed',
} as const;
