/**
 * B2B Types for ReZ Merchant Platform
 * Contains all TypeScript interfaces for supplier management, purchase orders, RFQs, quotes, and dunning
 */

import { Types } from 'mongoose';
import {
  SupplierStatus,
  POStatus,
  PaymentStatus,
  DueDatePreference,
  RFQStatus,
  QuoteStatus,
  CreditLineStatus,
  TransactionType,
  LedgerEntryType,
  ReconciliationMatchType,
  DunningChannel,
  DunningPriority,
  DunningTrigger,
  ApprovalAction,
  AttachmentType,
  InvoiceLineItemType,
  GstTaxRate,
  PaymentMode,
  B2BNotificationType,
} from '../enums/b2b';

/** MongoDB ObjectId type alias */
export type ObjectId = Types.ObjectId;

// ============================================================================
// Common Types
// ============================================================================

/**
 * Geographic address
 */
export interface Address {
  /** Street address line 1 */
  street1?: string;
  /** Street address line 2 */
  street2?: string;
  /** City name */
  city?: string;
  /** State name */
  state?: string;
  /** Postal/ZIP code */
  postalCode?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Google Maps formatted address */
  formatted?: string;
  /** Latitude coordinate */
  latitude?: number;
  /** Longitude coordinate */
  longitude?: number;
}

/**
 * Bank account details
 */
export interface BankDetails {
  /** Bank name */
  bankName?: string;
  /** Branch name */
  branchName?: string;
  /** Account holder name */
  accountHolderName?: string;
  /** Account number (encrypted at rest) */
  accountNumber?: string;
  /** IFSC code */
  ifscCode?: string;
  /** SWIFT code (for international) */
  swiftCode?: string;
  /** Account type (savings/current) */
  accountType?: 'savings' | 'current';
  /** UPI ID */
  upiId?: string;
}

/**
 * File attachment metadata
 */
export interface Attachment {
  /** Unique attachment ID */
  id: string;
  /** Original filename */
  fileName: string;
  /** File URL */
  url: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Attachment type category */
  type: AttachmentType;
  /** Upload timestamp */
  uploadedAt: Date;
  /** User ID who uploaded */
  uploadedBy?: string;
}

/**
 * Audit entry for approval/rejection history
 */
export interface ApprovalEntry {
  /** Unique entry ID */
  id: string;
  /** Action performed */
  action: ApprovalAction;
  /** User ID who performed action */
  userId: string;
  /** User name for display */
  userName?: string;
  /** User role */
  userRole?: string;
  /** Timestamp of action */
  timestamp: Date;
  /** Comments/reason for action */
  comments?: string;
  /** Previous status (for audit trail) */
  previousStatus?: string;
  /** New status after action */
  newStatus?: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  /** Contact person name */
  name?: string;
  /** Email address */
  email?: string;
  /** Phone number (10 digits for India) */
  phone?: string;
  /** Mobile number */
  mobile?: string;
  /** Designation/role */
  designation?: string;
  /** Department */
  department?: string;
}

/**
 * Payment details for settling invoices
 */
export interface PaymentDetails {
  /** Amount paid */
  amount: number;
  /** Payment mode used */
  mode: PaymentMode;
  /** Payment reference number */
  referenceNumber?: string;
  /** Transaction ID from payment gateway */
  transactionId?: string;
  /** Payment timestamp */
  paidAt: Date;
  /** Bank details used */
  bankDetails?: BankDetails;
  /** Notes for payment */
  notes?: string;
}

// ============================================================================
// Supplier Types
// ============================================================================

/**
 * Supplier/vendor in the B2B system
 */
export interface Supplier {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Associated store ID (optional for multi-store) */
  storeId?: ObjectId;
  /** Supplier business name */
  name: string;
  /** Primary contact person */
  contactPerson?: string;
  /** Primary email address */
  email?: string;
  /** Primary phone number (10 digits) */
  phone: string;
  /** Business address */
  address?: Address;
  /** GST registration number */
  gstNumber?: string;
  /** PAN card number */
  pan?: string;
  /** Maximum credit limit extended */
  creditLimit: number;
  /** Credit period in days */
  creditPeriodDays: number;
  /** Due date calculation preference */
  dueDatePreference: DueDatePreference;
  /** Bank account details */
  bankDetails?: BankDetails;
  /** Whether supplier is active */
  isActive: boolean;
  /** Supplier status */
  status: SupplierStatus;
  /** Tags for categorization */
  tags: string[];
  /** Internal notes */
  notes?: string;
  /** Default payment terms */
  paymentTerms?: string;
  /** Minimum order value */
  minimumOrderValue?: number;
  /** Average delivery time in days */
  avgDeliveryDays?: number;
  /** Rating (1-5) */
  rating?: number;
  /** Total orders count */
  totalOrders?: number;
  /** Last order date */
  lastOrderDate?: Date;
  /** Contact information array */
  contacts?: ContactInfo[];
  /** Business registration number */
  registrationNumber?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Supplier summary for list views
 */
export interface SupplierSummary {
  _id: ObjectId;
  name: string;
  phone: string;
  email?: string;
  status: SupplierStatus;
  isActive: boolean;
  creditLimit: number;
  dueDatePreference: DueDatePreference;
  totalOrders: number;
}

/**
 * Supplier statistics
 */
export interface SupplierStats {
  supplierId: ObjectId;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  avgOrderValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  lastOrderDate?: Date;
}

// ============================================================================
// Purchase Order Types
// ============================================================================

/**
 * Individual line item in a purchase order
 */
export interface POLineItem {
  /** Unique line item ID */
  id?: string;
  /** Product/service name */
  productName: string;
  /** Stock keeping unit */
  sku?: string;
  /** Quantity ordered */
  quantity: number;
  /** Unit price */
  unitPrice: number;
  /** Discount amount */
  discount: number;
  /** Tax amount */
  tax: number;
  /** GST tax rate */
  taxRate?: GstTaxRate;
  /** HSN/SAC code */
  hsnCode?: string;
  /** Unit of measurement */
  unit?: string;
  /** Description */
  description?: string;
  /** Expected delivery date for this item */
  expectedDeliveryDate?: Date;
  /** Quantity received so far */
  receivedQuantity?: number;
  /** Internal product ID reference */
  productId?: string;
  /** Category */
  category?: string;
}

/**
 * Purchase Order document
 */
export interface PurchaseOrder {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** Store ID (optional) */
  storeId?: ObjectId;
  /** Human-readable PO number */
  poNumber: string;
  /** PO status */
  status: POStatus;
  /** Line items */
  items: POLineItem[];
  /** Subtotal before tax and discount */
  subtotal: number;
  /** Total discount applied */
  discount: number;
  /** Total tax amount */
  taxAmount: number;
  /** Final total amount */
  totalAmount: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Order creation date */
  orderDate: Date;
  /** Expected delivery date */
  expectedDeliveryDate?: Date;
  /** Payment due date */
  dueDate: Date;
  /** Payment status */
  paymentStatus: PaymentStatus;
  /** Amount paid so far */
  paidAmount: number;
  /** Approval history */
  approvalHistory: ApprovalEntry[];
  /** File attachments */
  attachments: Attachment[];
  /** Internal notes */
  notes?: string;
  /** Billing address (if different from supplier) */
  billingAddress?: Address;
  /** Shipping address */
  shippingAddress?: Address;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Reference to RFQ if created from quote */
  rfqId?: ObjectId;
  /** Reference to accepted quote */
  quoteId?: ObjectId;
  /** Delivery instructions */
  deliveryInstructions?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Approved by user ID */
  approvedBy?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Purchase Order summary for list views
 */
export interface POSummary {
  _id: ObjectId;
  poNumber: string;
  supplierId: ObjectId;
  supplierName: string;
  status: POStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  dueDate: Date;
  orderDate: Date;
  itemCount: number;
}

/**
 * PO statistics and summary
 */
export interface POStats {
  totalPOs: number;
  draftPOs: number;
  pendingApproval: number;
  approvedPOs: number;
  receivedPOs: number;
  totalValue: number;
  paidValue: number;
  outstandingValue: number;
}

// ============================================================================
// RFQ (Request for Quotation) Types
// ============================================================================

/**
 * Line item specification in RFQ
 */
export interface RFQLineItem {
  /** Unique line item ID */
  id?: string;
  /** Product/service description needed */
  description: string;
  /** Quantity needed */
  quantity: number;
  /** Required unit */
  unit?: string;
  /** Specifications */
  specifications?: string;
  /** Quality requirements */
  qualityRequirements?: string;
  /** Preferred delivery date */
  preferredDeliveryDate?: Date;
  /** Category */
  category?: string;
  /** Estimated budget (optional) */
  estimatedBudget?: number;
}

/**
 * Request for Quotation document
 */
export interface RFQ {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Store ID (optional) */
  storeId?: ObjectId;
  /** Human-readable RFQ number */
  rfqNumber: string;
  /** RFQ status */
  status: RFQStatus;
  /** Title/subject of RFQ */
  title: string;
  /** Line items requested */
  items: RFQLineItem[];
  /** Supplier IDs invited to quote */
  invitedSupplierIds: ObjectId[];
  /** Supplier IDs who have submitted quotes */
  respondingSupplierIds: ObjectId[];
  /** Submission deadline */
  submissionDeadline: Date;
  /** Expected delivery date */
  expectedDeliveryDate?: Date;
  /** Additional terms and conditions */
  terms?: string;
  /** Attachments */
  attachments: Attachment[];
  /** Notes */
  notes?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Awarded supplier ID */
  awardedSupplierId?: ObjectId;
  /** Awarded quote ID */
  awardedQuoteId?: ObjectId;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * RFQ summary for list views
 */
export interface RFQSummary {
  _id: ObjectId;
  rfqNumber: string;
  title: string;
  status: RFQStatus;
  itemCount: number;
  invitedSupplierCount: number;
  responseCount: number;
  submissionDeadline: Date;
  createdAt: Date;
}

// ============================================================================
// Quote Types
// ============================================================================

/**
 * Quote line item
 */
export interface QuoteLineItem {
  /** Unique line item ID */
  id?: string;
  /** RFQ line item reference */
  rfqLineItemId: string;
  /** Product description quoted */
  productName: string;
  /** SKU if applicable */
  sku?: string;
  /** Quantity quoted */
  quantity: number;
  /** Unit price quoted */
  unitPrice: number;
  /** Discount offered */
  discount: number;
  /** Tax amount */
  tax: number;
  /** Tax rate */
  taxRate?: GstTaxRate;
  /** HSN/SAC code */
  hsnCode?: string;
  /** Lead time in days */
  leadTimeDays?: number;
  /** Remarks */
  remarks?: string;
}

/**
 * Quote from supplier
 */
export interface Quote {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** RFQ reference */
  rfqId: ObjectId;
  /** Supplier ID who submitted quote */
  supplierId: ObjectId;
  /** Human-readable quote number */
  quoteNumber: string;
  /** Quote status */
  status: QuoteStatus;
  /** Line items */
  items: QuoteLineItem[];
  /** Subtotal */
  subtotal: number;
  /** Discount */
  discount: number;
  /** Tax amount */
  taxAmount: number;
  /** Total amount */
  totalAmount: number;
  /** Currency */
  currency: string;
  /** Validity period (days) */
  validityDays: number;
  /** Valid until date */
  validUntil: Date;
  /** Payment terms offered */
  paymentTerms?: string;
  /** Delivery period in days */
  deliveryPeriodDays?: number;
  /** Warranty terms */
  warrantyTerms?: string;
  /** Additional notes */
  notes?: string;
  /** Attachments */
  attachments: Attachment[];
  /** Submitted timestamp */
  submittedAt: Date;
  /** Last revised timestamp */
  revisedAt?: Date;
  /** Revision count */
  revisionCount: number;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Quote comparison entry
 */
export interface QuoteComparison {
  quoteId: ObjectId;
  supplierId: ObjectId;
  supplierName: string;
  totalAmount: number;
  deliveryPeriodDays?: number;
  paymentTerms?: string;
  isLowest: boolean;
  items: QuoteLineItem[];
}

// ============================================================================
// Credit Line Types
// ============================================================================

/**
 * Credit line for a supplier
 */
export interface CreditLine {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** Credit limit */
  creditLimit: number;
  /** Used credit amount */
  usedAmount: number;
  /** Available credit */
  availableAmount: number;
  /** Credit period in days */
  creditPeriodDays: number;
  /** Interest rate per month (%) */
  interestRatePerMonth: number;
  /** Grace period in days */
  graceDays: number;
  /** Credit line status */
  status: CreditLineStatus;
  /** Activation date */
  activatedAt?: Date;
  /** Suspension reason */
  suspensionReason?: string;
  /** Suspended at */
  suspendedAt?: Date;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Entry in supplier ledger
 */
export interface SupplierLedgerEntry {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** Entry type */
  entryType: LedgerEntryType;
  /** Transaction type */
  transactionType: TransactionType;
  /** Amount */
  amount: number;
  /** Balance after this entry */
  balance: number;
  /** Reference document type */
  referenceType: 'po' | 'payment' | 'credit_note' | 'adjustment' | 'interest';
  /** Reference document ID */
  referenceId?: ObjectId;
  /** Reference document number */
  referenceNumber?: string;
  /** Description */
  description?: string;
  /** Due date (for PO entries) */
  dueDate?: Date;
  /** Payment date (for payment entries) */
  paymentDate?: Date;
  /** Days overdue (calculated) */
  daysOverdue?: number;
  /** Interest amount (if applicable) */
  interestAmount?: number;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Credit summary for a supplier
 */
export interface CreditSummary {
  supplierId: ObjectId;
  creditLimit: number;
  usedAmount: number;
  availableAmount: number;
  outstandingPOs: number;
  overdueAmount: number;
  overdueDays: number;
  nextDueDate?: Date;
}

// ============================================================================
// Bank Transaction Types
// ============================================================================

/**
 * Bank transaction record for reconciliation
 */
export interface BankTransaction {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Transaction date from bank statement */
  transactionDate: Date;
  /** Value date */
  valueDate?: Date;
  /** Transaction description */
  description: string;
  /** Amount */
  amount: number;
  /** Transaction type */
  transactionType: TransactionType;
  /** Reference number from bank */
  bankReferenceNumber?: string;
  /** UTR number (for NEFT/RTGS) */
  utrNumber?: string;
  /** Cheque number */
  chequeNumber?: string;
  /** Account number */
  accountNumber?: string;
  /** Branch name */
  branchName?: string;
  /** Balance after transaction */
  runningBalance?: number;
  /** Whether reconciled */
  isReconciled: boolean;
  /** Reconciliation timestamp */
  reconciledAt?: Date;
  /** Match type used */
  matchType?: ReconciliationMatchType;
  /** Matched PO ID */
  matchedPOId?: ObjectId;
  /** Matched payment ID */
  matchedPaymentId?: ObjectId;
  /** Raw statement data */
  rawData?: Record<string, unknown>;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Payment record for supplier
 */
export interface Payment {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** PO ID (if against PO) */
  poId?: ObjectId;
  /** Payment number */
  paymentNumber: string;
  /** Amount paid */
  amount: number;
  /** Payment mode */
  mode: PaymentMode;
  /** Reference number */
  referenceNumber?: string;
  /** Bank reference/UTR */
  bankReference?: string;
  /** Payment date */
  paymentDate: Date;
  /** Settlement status */
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
  /** Processed by user ID */
  processedBy?: string;
  /** Notes */
  notes?: string;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

// ============================================================================
// Dunning Types
// ============================================================================

/**
 * Dunning step configuration
 */
export interface DunningStep {
  /** Days relative to due date (negative = before, positive = after) */
  days: number;
  /** Channel to use */
  channel: DunningChannel;
  /** Priority level */
  priority: DunningPriority;
  /** Message template ID */
  templateId?: string;
  /** Whether to include payment link */
  includePaymentLink?: boolean;
  /** Whether to escalate */
  escalate?: boolean;
  /** Escalation contact */
  escalationContact?: string;
}

/**
 * Dunning configuration for a merchant
 */
export interface DunningConfig {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Configuration name */
  name: string;
  /** Whether enabled */
  isEnabled: boolean;
  /** Trigger type */
  trigger: DunningTrigger;
  /** Trigger threshold (days overdue or amount) */
  triggerValue?: number;
  /** Dunning sequence steps */
  steps: DunningStep[];
  /** Business hours for notifications */
  businessHours?: {
    start: string;
    end: string;
    timezone: string;
    excludeDays: number[];
  };
  /** Holiday handling */
  skipHolidays: boolean;
  /** Maximum attempts per channel */
  maxAttemptsPerChannel?: number;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Active dunning sequence for an invoice
 */
export interface DunningSequence {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Associated merchant ID */
  merchantId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** PO ID being chased */
  poId: ObjectId;
  /** Config used */
  configId: ObjectId;
  /** Current step index */
  currentStepIndex: number;
  /** Next action date */
  nextActionDate: Date;
  /** Completed steps */
  completedSteps: Array<{
    stepIndex: number;
    executedAt: Date;
    channel: DunningChannel;
    success: boolean;
    errorMessage?: string;
  }>;
  /** Status */
  status: 'active' | 'completed' | 'cancelled' | 'paid';
  /** Paid date (if settled) */
  paidAt?: Date;
  /** Last reminder sent */
  lastReminderAt?: Date;
  /** Reminder count */
  reminderCount: number;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Dunning notification record
 */
export interface DunningNotification {
  /** MongoDB _id */
  _id?: ObjectId;
  /** Sequence ID */
  sequenceId: ObjectId;
  /** Supplier ID */
  supplierId: ObjectId;
  /** PO ID */
  poId: ObjectId;
  /** Channel used */
  channel: DunningChannel;
  /** Priority */
  priority: DunningPriority;
  /** Recipient (phone/email) */
  recipient: string;
  /** Message content */
  message: string;
  /** Status */
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  /** Sent timestamp */
  sentAt?: Date;
  /** Delivered timestamp */
  deliveredAt?: Date;
  /** Read timestamp */
  readAt?: Date;
  /** Failure reason */
  failureReason?: string;
  /** External message ID */
  externalMessageId?: string;
  /** Created timestamp */
  createdAt: Date;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Aging bucket definition
 */
export interface AgingBucket {
  /** Bucket label (e.g., "0-30 days") */
  label: string;
  /** Minimum days */
  min: number;
  /** Maximum days */
  max: number;
  /** Total amount in bucket */
  amount: number;
  /** Count of entries */
  count: number;
}

/**
 * Aging report by bucket
 */
export interface AgingReport {
  /** As of date */
  asOfDate: Date;
  /** Supplier ID */
  supplierId?: ObjectId;
  /** Total outstanding */
  totalOutstanding: number;
  /** Buckets */
  buckets: AgingBucket[];
}

/**
 * Supplier performance metrics
 */
export interface SupplierPerformance {
  supplierId: ObjectId;
  supplierName: string;
  period: {
    from: Date;
    to: Date;
  };
  totalOrders: number;
  totalValue: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  qualityReturns: number;
  avgDeliveryDays: number;
  complianceScore: number;
}

/**
 * Payment analytics
 */
export interface PaymentAnalytics {
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  averagePaymentDays: number;
  onTimePaymentRate: number;
  byAgingBucket: AgingBucket[];
  bySupplier: Array<{
    supplierId: ObjectId;
    supplierName: string;
    outstanding: number;
    overdue: number;
  }>;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * B2B webhook event payload
 */
export interface B2BWebhookEvent {
  /** Event type */
  eventType: B2BNotificationType;
  /** Event timestamp */
  timestamp: Date;
  /** Merchant ID */
  merchantId: ObjectId;
  /** Supplier ID (if applicable) */
  supplierId?: ObjectId;
  /** PO ID (if applicable) */
  poId?: ObjectId;
  /** Event data */
  data: Record<string, unknown>;
  /** Signature for verification */
  signature?: string;
}

/**
 * Webhook subscription
 */
export interface WebhookSubscription {
  _id?: ObjectId;
  merchantId: ObjectId;
  supplierId?: ObjectId;
  eventTypes: B2BNotificationType[];
  url: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * B2B dashboard summary
 */
export interface B2BDashboardSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPOs: number;
  pendingPOs: number;
  totalOutstanding: number;
  overdueAmount: number;
  creditUtilization: number;
  pendingApprovals: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    entityId?: ObjectId;
  }>;
}

/**
 * Dashboard KPI card
 */
export interface KPICard {
  title: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'number' | 'percent';
  color?: string;
}
