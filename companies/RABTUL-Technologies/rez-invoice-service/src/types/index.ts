export interface Address {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: number;
  discountPercent?: number;
  taxableValue: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  cessRate?: number;
  cessAmount?: number;
  total: number;
}

export interface BankDetails {
  bankName?: string;
  branch?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountType?: string;
  upiId?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'check' | 'card' | 'other';
export type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'receipt' | 'credit_note' | 'debit_note';

export interface TaxBreakup {
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  taxTotal: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface ReminderRecord {
  id: string;
  sentAt: string;
  type: 'first' | 'second' | 'final' | 'custom';
  recipientEmail: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;

  // Business Info
  businessName: string;
  businessAddress: Address;
  businessGstin?: string;
  businessPan?: string;

  // Customer Info
  customerName: string;
  customerAddress: Address;
  customerGstin?: string;
  customerPan?: string;

  // Invoice Details
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;

  // Line Items
  items: LineItem[];

  // Totals
  subtotal: number;
  totalDiscount: number;
  taxableValue: number;
  taxBreakup: TaxBreakup;
  totalTax: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;

  // Payment Info
  bankDetails?: BankDetails;
  amountPaid: number;
  amountDue: number;
  payments: PaymentRecord[];

  // Notes & Terms
  notes?: string;
  terms?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;

  // Reminders
  reminders: ReminderRecord[];

  // Extra
  reference?: string;
  template?: string;
  color?: string;
  currency: string;
  exchangeRate?: number;
}

export interface CreateInvoiceInput {
  type?: InvoiceType;
  customerName: string;
  customerAddress: Address;
  customerGstin?: string;
  customerPan?: string;
  items: Omit<LineItem, 'id'>[];
  invoiceDate?: string;
  dueDate?: string;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
  bankDetails?: BankDetails;
  reference?: string;
  template?: string;
  color?: string;
}

export interface UpdateInvoiceInput {
  customerName?: string;
  customerAddress?: Address;
  customerGstin?: string;
  customerPan?: string;
  items?: Omit<LineItem, 'id'>[];
  invoiceDate?: string;
  dueDate?: string;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
  bankDetails?: BankDetails;
  status?: InvoiceStatus;
  reference?: string;
  template?: string;
  color?: string;
}

export interface RecordPaymentInput {
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface SendInvoiceEmailInput {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
  attachPdf?: boolean;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
  customerName?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: 'invoiceDate' | 'invoiceNumber' | 'totalAmount' | 'dueDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface GSTSummary {
  cgstCollected: number;
  sgstCollected: number;
  igstCollected: number;
  cessCollected: number;
  totalTaxCollected: number;
  totalTaxableValue: number;
}
