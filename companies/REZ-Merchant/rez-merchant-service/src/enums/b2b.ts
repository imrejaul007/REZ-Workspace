/**
 * B2B Enums for ReZ Merchant Platform
 * Contains all enumerated types for supplier management, purchase orders, RFQs, quotes, and dunning
 */

/**
 * Supplier lifecycle status
 */
export enum SupplierStatus {
  /** Supplier account created, awaiting verification */
  PENDING = 'pending',
  /** Supplier verified and approved for transactions */
  APPROVED = 'approved',
  /** Supplier application rejected */
  REJECTED = 'rejected',
  /** Supplier blocked from new transactions (existing POs honored) */
  BLOCKED = 'blocked',
}

/**
 * Purchase Order lifecycle status
 */
export enum POStatus {
  /** Draft - not yet submitted */
  DRAFT = 'draft',
  /** Awaiting internal approval */
  PENDING_APPROVAL = 'pending_approval',
  /** Approved by authorized personnel */
  APPROVED = 'approved',
  /** Rejected during approval workflow */
  REJECTED = 'rejected',
  /** Sent to supplier */
  ORDERED = 'ordered',
  /** Some items received, others pending */
  PARTIAL_RECEIVED = 'partial_received',
  /** All items received */
  RECEIVED = 'received',
  /** Cancelled before execution */
  CANCELLED = 'cancelled',
  /** Closed after completion or settlement */
  CLOSED = 'closed',
}

/**
 * Payment status for purchase orders and invoices
 */
export enum PaymentStatus {
  /** No payment received */
  UNPAID = 'unpaid',
  /** Partial payment received */
  PARTIAL = 'partial',
  /** Full payment received */
  PAID = 'paid',
}

/**
 * Supplier due date preference for credit calculations
 */
export enum DueDatePreference {
  /** Due at end of current month */
  END_OF_MONTH = 'end_of_month',
  /** Due immediately upon invoice */
  IMMEDIATE = 'immediate',
  /** Due on a specific day of month */
  SPECIFIC_DAY = 'specific_day',
}

/**
 * Request for Quotation lifecycle status
 */
export enum RFQStatus {
  /** Draft - not yet sent to suppliers */
  DRAFT = 'draft',
  /** Open - sent to suppliers, awaiting quotes */
  OPEN = 'open',
  /** Closed - no longer accepting quotes */
  CLOSED = 'closed',
  /** Awarded to a selected supplier */
  AWARDED = 'awarded',
  /** Cancelled before awarding */
  CANCELLED = 'cancelled',
}

/**
 * Quote lifecycle status
 */
export enum QuoteStatus {
  /** Quote submitted by supplier */
  SUBMITTED = 'submitted',
  /** Quote revised by supplier */
  REVISED = 'revised',
  /** Quote accepted by merchant */
  ACCEPTED = 'accepted',
  /** Quote rejected by merchant */
  REJECTED = 'rejected',
  /** Quote withdrawn by supplier */
  WITHDRAWN = 'withdrawn',
}

/**
 * Credit line account status
 */
export enum CreditLineStatus {
  /** Active and available for transactions */
  ACTIVE = 'active',
  /** Temporarily suspended (payment overdue) */
  SUSPENDED = 'suspended',
  /** Permanently closed */
  CLOSED = 'closed',
}

/**
 * Bank transaction type
 */
export enum TransactionType {
  /** Money paid out (debit) */
  DEBIT = 'debit',
  /** Money received (credit) */
  CREDIT = 'credit',
}

/**
 * Types of entries in the supplier ledger
 */
export enum LedgerEntryType {
  /** Purchase order entry */
  PO = 'po',
  /** Payment received entry */
  PAYMENT = 'payment',
  /** Credit note from supplier */
  CREDIT_NOTE = 'credit_note',
  /** Interest charged on overdue amount */
  INTEREST = 'interest',
  /** Manual adjustment entry */
  ADJUSTMENT = 'adjustment',
}

/**
 * Matching algorithm for bank transaction reconciliation
 */
export enum ReconciliationMatchType {
  /** Exact amount and reference match */
  EXACT = 'exact',
  /** Partial reference match */
  CONTAINS = 'contains',
  /** Pattern-based matching */
  REGEX = 'regex',
  /** Amount within a range */
  RANGE = 'range',
}

/**
 * Communication channels for dunning notifications
 */
export enum DunningChannel {
  /** WhatsApp messaging */
  WHATSAPP = 'whatsapp',
  /** SMS messaging */
  SMS = 'sms',
  /** Email */
  EMAIL = 'email',
  /** All available channels */
  ALL = 'all',
}

/**
 * Priority level for dunning actions
 */
export enum DunningPriority {
  /** Low priority reminder */
  LOW = 'low',
  /** Medium priority notice */
  MEDIUM = 'medium',
  /** High priority warning */
  HIGH = 'high',
  /** Critical - immediate action required */
  CRITICAL = 'critical',
}

/**
 * Triggers for dunning sequence activation
 */
export enum DunningTrigger {
  /** Triggered on due date */
  DUE_DATE = 'due_date',
  /** Triggered after X days overdue */
  DAYS_OVERDUE = 'days_overdue',
  /** Triggered when amount exceeds threshold */
  AMOUNT_THRESHOLD = 'amount_threshold',
}

/**
 * Approval action types
 */
export enum ApprovalAction {
  /** Submitted for approval */
  SUBMITTED = 'submitted',
  /** Approved */
  APPROVED = 'approved',
  /** Rejected */
  REJECTED = 'rejected',
  /** Reassigned to another approver */
  REASSIGNED = 'reassigned',
}

/**
 * Document attachment types
 */
export enum AttachmentType {
  /** Purchase order document */
  PURCHASE_ORDER = 'purchase_order',
  /** Invoice from supplier */
  INVOICE = 'invoice',
  /** Proof of delivery */
  DELIVERY_PROOF = 'delivery_proof',
  /** GRN (Goods Received Note) */
  GRN = 'grn',
  /** Payment receipt */
  RECEIPT = 'receipt',
  /** Credit note document */
  CREDIT_NOTE = 'credit_note',
  /** Supplier contract */
  CONTRACT = 'contract',
  /** Other document type */
  OTHER = 'other',
}

/**
 * Invoice line item type
 */
export enum InvoiceLineItemType {
  /** Regular line item */
  PRODUCT = 'product',
  /** Discount line item */
  DISCOUNT = 'discount',
  /** Tax line item */
  TAX = 'tax',
  /** Shipping/handling charge */
  SHIPPING = 'shipping',
  /** Miscellaneous charge */
  MISC = 'misc',
}

/**
 * GST tax rate options
 */
export enum GstTaxRate {
  /** Exempt (0%) */
  EXEMPT = 0,
  /** 5% GST */
  RATE_5 = 5,
  /** 12% GST */
  RATE_12 = 12,
  /** 18% GST */
  RATE_18 = 18,
  /** 28% GST */
  RATE_28 = 28,
}

/**
 * Payment mode for supplier payments
 */
export enum PaymentMode {
  /** Bank transfer */
  BANK_TRANSFER = 'bank_transfer',
  /** Cash payment */
  CASH = 'cash',
  /** Cheque payment */
  CHEQUE = 'cheque',
  /** UPI payment */
  UPI = 'upi',
  /** NEFT transfer */
  NEFT = 'neft',
  /** RTGS transfer */
  RTGS = 'rtgs',
  /** Credit period (no immediate payment) */
  CREDIT = 'credit',
  /** Against delivery */
  COD = 'cod',
  /** Multiple payment modes combined */
  MIXED = 'mixed',
}

/**
 * Notification type for B2B events
 */
export enum B2BNotificationType {
  /** New PO created */
  PO_CREATED = 'po_created',
  /** PO status changed */
  PO_STATUS_CHANGED = 'po_status_changed',
  /** Payment received */
  PAYMENT_RECEIVED = 'payment_received',
  /** Payment reminder */
  PAYMENT_REMINDER = 'payment_reminder',
  /** Credit limit reached */
  CREDIT_LIMIT_REACHED = 'credit_limit_reached',
  /** Credit line suspended */
  CREDIT_LINE_SUSPENDED = 'credit_line_suspended',
  /** RFQ received */
  RFQ_RECEIVED = 'rfq_received',
  /** Quote received */
  QUOTE_RECEIVED = 'quote_received',
  /** Quote accepted/rejected */
  QUOTE_DECIDED = 'quote_decided',
}
