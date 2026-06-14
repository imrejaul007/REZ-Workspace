/**
 * B2B API Service
 * API endpoints for B2B merchant features: suppliers, orders, ledger, reconciliation, RFQ, dunning, tally, WhatsApp
 */

import { API_BASE_URL } from '@/config/api';
import {
  cacheData,
  getCachedData,
  getCachedOrFetch,
  isOnline,
  queueOfflineAction,
} from './offlineService';
import { logger } from '@/utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

// Supplier Types
export interface Supplier {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  creditLimit?: number;
  creditBalance: number;
  creditStatus: 'active' | 'blocked' | 'pending';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  creditLimit?: number;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  creditStatus?: Supplier['creditStatus'];
}

// Purchase Order Types
export type OrderStatus = 'pending' | 'approved' | 'delivered' | 'paid' | 'cancelled';

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  id: string;
  merchantId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  orderDate: string;
  expectedDelivery?: string;
  deliveredDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  supplierId: string;
  items: Omit<OrderItem, 'totalPrice'>[];
  expectedDelivery?: string;
  notes?: string;
}

// Ledger Types
export type LedgerEntryType = 'credit' | 'debit';

export interface LedgerEntry {
  id: string;
  supplierId: string;
  merchantId: string;
  orderId?: string;
  type: LedgerEntryType;
  amount: number;
  runningBalance: number;
  description: string;
  referenceNumber?: string;
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  createdAt: string;
}

export interface SupplierLedger {
  supplierId: string;
  supplierName: string;
  openingBalance: number;
  currentBalance: number;
  totalCredits: number;
  totalDebits: number;
  entries: LedgerEntry[];
}

// Reconciliation Types
export type TransactionStatus = 'matched' | 'unmatched' | 'disputed';
export type MatchConfidence = 'high' | 'medium' | 'low';

export interface BankTransaction {
  id: string;
  merchantId: string;
  transactionDate: string;
  amount: number;
  description: string;
  reference?: string;
  bankName?: string;
  accountNumber?: string;
  status: TransactionStatus;
  matchedOrderId?: string;
  matchConfidence?: MatchConfidence;
  matchedAt?: string;
  createdAt: string;
}

export interface ReconciliationResult {
  bankTransactionId: string;
  orderId?: string;
  confidence: MatchConfidence;
  suggestedAmount: number;
  actualAmount: number;
  amountDifference: number;
}

// RFQ Types
export type QuoteStatus = 'draft' | 'sent' | 'quoted' | 'accepted' | 'rejected' | 'expired';

export interface RFQItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface RequestForQuote {
  id: string;
  merchantId: string;
  rfqNumber: string;
  title: string;
  items: RFQItem[];
  status: QuoteStatus;
  deadline?: string;
  supplierIds: string[];
  supplierNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  status: QuoteStatus;
  receivedAt: string;
  createdAt: string;
}

export interface CreateRFQData {
  title: string;
  items: RFQItem[];
  deadline?: string;
  supplierIds: string[];
}

// Dunning Types
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'acknowledged';

export interface ReminderTemplate {
  id: string;
  merchantId: string;
  name: string;
  subject?: string;
  message: string;
  daysAfterDue: number;
  priority: 'low' | 'medium' | 'high';
  channel: 'sms' | 'whatsapp' | 'email';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DunningReminder {
  id: string;
  merchantId: string;
  supplierId: string;
  supplierName: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  templateId?: string;
  status: ReminderStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

export interface CreateReminderTemplateData {
  name: string;
  subject?: string;
  message: string;
  daysAfterDue: number;
  priority: 'low' | 'medium' | 'high';
  channel: 'sms' | 'whatsapp' | 'email';
  isActive?: boolean;
}

// Tally Sync Types
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type SyncEntity = 'suppliers' | 'orders' | 'ledger' | 'inventory';

export interface TallySyncRecord {
  id: string;
  merchantId: string;
  entity: SyncEntity;
  status: SyncStatus;
  recordsProcessed: number;
  recordsFailed: number;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface TallySyncConfig {
  tallyUrl?: string;
  tallyCompany?: string;
  syncEnabled: boolean;
  autoSyncInterval?: number;
  lastSyncAt?: string;
}

// WhatsApp Types
export type MessageType = 'template' | 'custom';

export interface WhatsAppTemplate {
  id: string;
  merchantId: string;
  name: string;
  category: 'order_update' | 'payment_reminder' | 'promotion' | 'general';
  content: string;
  variables: string[];
  isActive: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  merchantId: string;
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  message: string;
  messageType: MessageType;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface CreateTemplateData {
  name: string;
  category: WhatsAppTemplate['category'];
  content: string;
  isActive?: boolean;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Error Type
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ============================================================================
// API Response Handler
// ============================================================================

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    };
    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
      error.code = errorData.code;
    } catch {
      // Response might not be JSON
    }
    throw error;
  }
  return response.json();
};

// ============================================================================
// Supplier API
// ============================================================================

/**
 * Get all suppliers for a merchant
 */
export const getSuppliers = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    creditStatus?: Supplier['creditStatus'];
    sortBy?: 'name' | 'creditBalance' | 'totalSpent' | 'lastOrderDate';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Supplier>> => {
  const cacheKey = `suppliers_${merchantId}_${JSON.stringify(options || {})}`;

  const fetchFn = async (): Promise<PaginatedResponse<Supplier>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.creditStatus) params.append('creditStatus', options.creditStatus);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    const url = `${API_BASE_URL}/b2b/suppliers/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return handleResponse<PaginatedResponse<Supplier>>(response);
  };

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 5 * 60 * 1000);
  } catch {
    const cached = await getCachedData<PaginatedResponse<Supplier>>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Get a single supplier by ID
 */
export const getSupplierById = async (id: string): Promise<Supplier> => {
  const cacheKey = `supplier_${id}`;

  const fetchFn = async (): Promise<Supplier> => {
    const response = await fetch(`${API_BASE_URL}/b2b/suppliers/detail/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Supplier>(response);
  };

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 10 * 60 * 1000);
  } catch {
    const cached = await getCachedData<Supplier>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Create a new supplier
 */
export const createSupplier = async (data: CreateSupplierData): Promise<Supplier> => {
  const response = await fetch(`${API_BASE_URL}/b2b/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Supplier>(response);
};

/**
 * Update a supplier
 */
export const updateSupplier = async (id: string, data: UpdateSupplierData): Promise<Supplier> => {
  const response = await fetch(`${API_BASE_URL}/b2b/suppliers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<Supplier>(response);
  await cacheData(`supplier_${id}`, result, 10 * 60 * 1000);
  return result;
};

/**
 * Delete a supplier
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/b2b/suppliers/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }
};

// ============================================================================
// Purchase Order API
// ============================================================================

/**
 * Get all purchase orders for a merchant
 */
export const getOrders = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    supplierId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<PaginatedResponse<PurchaseOrder>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.supplierId) params.append('supplierId', options.supplierId);
  if (options?.search) params.append('search', options.search);
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);

  const url = `${API_BASE_URL}/b2b/orders/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<PurchaseOrder>>(response);
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (id: string): Promise<PurchaseOrder> => {
  const response = await fetch(`${API_BASE_URL}/b2b/orders/detail/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<PurchaseOrder>(response);
};

/**
 * Create a new purchase order
 */
export const createOrder = async (data: CreateOrderData): Promise<PurchaseOrder> => {
  const online = await isOnline();

  if (!online) {
    const actionId = await queueOfflineAction('b2b', 'createOrder', { data });
    logger.debug('[B2BApi] Order creation queued:', actionId);

    return {
      id: `pending_${actionId}`,
      merchantId: '',
      orderNumber: `PO-PENDING-${Date.now()}`,
      supplierId: data.supplierId,
      supplierName: '',
      items: data.items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
      totalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      paidAmount: 0,
      status: 'pending',
      orderDate: new Date().toISOString(),
      expectedDelivery: data.expectedDelivery,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(`${API_BASE_URL}/b2b/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<PurchaseOrder>(response);
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  additionalData?: { deliveredDate?: string; paidDate?: string }
): Promise<PurchaseOrder> => {
  const response = await fetch(`${API_BASE_URL}/b2b/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...additionalData }),
  });

  return handleResponse<PurchaseOrder>(response);
};

/**
 * Delete an order
 */
export const deleteOrder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/b2b/orders/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
};

// ============================================================================
// Ledger API
// ============================================================================

/**
 * Get supplier ledger
 */
export const getSupplierLedger = async (
  supplierId: string,
  options?: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    type?: LedgerEntryType;
  }
): Promise<SupplierLedger> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);
  if (options?.type) params.append('type', options.type);

  const url = `${API_BASE_URL}/b2b/ledger/${supplierId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<SupplierLedger>(response);
};

/**
 * Get all supplier balances
 */
export const getSupplierBalances = async (
  merchantId: string
): Promise<Array<{ supplierId: string; supplierName: string; balance: number }>> => {
  const cacheKey = `supplier_balances_${merchantId}`;

  const fetchFn = async () => {
    const response = await fetch(`${API_BASE_URL}/b2b/ledger/${merchantId}/balances`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<Array<{ supplierId: string; supplierName: string; balance: number }>>(response);
  };

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 2 * 60 * 1000);
  } catch {
    const cached = await getCachedData<Array<{ supplierId: string; supplierName: string; balance: number }>>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Record a payment to supplier
 */
export const recordPayment = async (
  supplierId: string,
  data: {
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
    referenceNumber?: string;
    notes?: string;
  }
): Promise<LedgerEntry> => {
  const response = await fetch(`${API_BASE_URL}/b2b/ledger/${supplierId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<LedgerEntry>(response);
};

// ============================================================================
// Reconciliation API
// ============================================================================

/**
 * Get bank transactions
 */
export const getBankTransactions = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
    fromDate?: string;
    toDate?: string;
  }
): Promise<PaginatedResponse<BankTransaction>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.fromDate) params.append('fromDate', options.fromDate);
  if (options?.toDate) params.append('toDate', options.toDate);

  const url = `${API_BASE_URL}/b2b/reconciliation/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<BankTransaction>>(response);
};

/**
 * Upload bank statement
 */
export const uploadBankStatement = async (
  merchantId: string,
  file: { uri: string; name: string; type: string }
): Promise<{ transactionsImported: number; duplicatesSkipped: number }> => {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  formData.append('merchantId', merchantId);

  const response = await fetch(`${API_BASE_URL}/b2b/reconciliation/${merchantId}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: formData,
  });

  return handleResponse<{ transactionsImported: number; duplicatesSkipped: number }>(response);
};

/**
 * Match bank transaction with order
 */
export const matchTransaction = async (
  transactionId: string,
  orderId: string,
  confidence: MatchConfidence
): Promise<BankTransaction> => {
  const response = await fetch(`${API_BASE_URL}/b2b/reconciliation/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, orderId, confidence }),
  });

  return handleResponse<BankTransaction>(response);
};

/**
 * Unmatch a transaction
 */
export const unmatchTransaction = async (transactionId: string): Promise<BankTransaction> => {
  const response = await fetch(`${API_BASE_URL}/b2b/reconciliation/${transactionId}/unmatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<BankTransaction>(response);
};

/**
 * Auto-match transactions
 */
export const autoMatchTransactions = async (
  merchantId: string
): Promise<{ matched: number; unmatched: number }> => {
  const response = await fetch(`${API_BASE_URL}/b2b/reconciliation/${merchantId}/auto-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<{ matched: number; unmatched: number }>(response);
};

/**
 * Get suggested matches for a transaction
 */
export const getSuggestedMatches = async (
  transactionId: string
): Promise<ReconciliationResult[]> => {
  const response = await fetch(`${API_BASE_URL}/b2b/reconciliation/${transactionId}/suggestions`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<ReconciliationResult[]>(response);
};

// ============================================================================
// RFQ API
// ============================================================================

/**
 * Get all RFQs
 */
export const getRFQs = async (
  merchantId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: QuoteStatus;
    search?: string;
  }
): Promise<PaginatedResponse<RequestForQuote>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);

  const url = `${API_BASE_URL}/b2b/rfq/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<RequestForQuote>>(response);
};

/**
 * Get RFQ by ID
 */
export const getRFQById = async (id: string): Promise<RequestForQuote> => {
  const response = await fetch(`${API_BASE_URL}/b2b/rfq/detail/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<RequestForQuote>(response);
};

/**
 * Create a new RFQ
 */
export const createRFQ = async (data: CreateRFQData): Promise<RequestForQuote> => {
  const response = await fetch(`${API_BASE_URL}/b2b/rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<RequestForQuote>(response);
};

/**
 * Update RFQ status
 */
export const updateRFQStatus = async (id: string, status: QuoteStatus): Promise<RequestForQuote> => {
  const response = await fetch(`${API_BASE_URL}/b2b/rfq/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  return handleResponse<RequestForQuote>(response);
};

/**
 * Get quotes for an RFQ
 */
export const getQuotes = async (rfqId: string): Promise<Quote[]> => {
  const response = await fetch(`${API_BASE_URL}/b2b/quotes/${rfqId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<Quote[]>(response);
};

/**
 * Get quote by ID
 */
export const getQuoteById = async (id: string): Promise<Quote> => {
  const response = await fetch(`${API_BASE_URL}/b2b/quotes/detail/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<Quote>(response);
};

/**
 * Accept or reject a quote
 */
export const updateQuoteStatus = async (id: string, status: 'accepted' | 'rejected'): Promise<Quote> => {
  const response = await fetch(`${API_BASE_URL}/b2b/quotes/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  return handleResponse<Quote>(response);
};

// ============================================================================
// Dunning API
// ============================================================================

/**
 * Get reminder templates
 */
export const getReminderTemplates = async (
  merchantId: string
): Promise<ReminderTemplate[]> => {
  const cacheKey = `reminder_templates_${merchantId}`;

  const fetchFn = async (): Promise<ReminderTemplate[]> => {
    const response = await fetch(`${API_BASE_URL}/b2b/dunning/templates/${merchantId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<ReminderTemplate[]>(response);
  };

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 10 * 60 * 1000);
  } catch {
    const cached = await getCachedData<ReminderTemplate[]>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Create reminder template
 */
export const createReminderTemplate = async (data: CreateReminderTemplateData): Promise<ReminderTemplate> => {
  const response = await fetch(`${API_BASE_URL}/b2b/dunning/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<ReminderTemplate>(response);
};

/**
 * Update reminder template
 */
export const updateReminderTemplate = async (
  id: string,
  data: Partial<CreateReminderTemplateData>
): Promise<ReminderTemplate> => {
  const response = await fetch(`${API_BASE_URL}/b2b/dunning/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<ReminderTemplate>(response);
};

/**
 * Delete reminder template
 */
export const deleteReminderTemplate = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/b2b/dunning/templates/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
};

/**
 * Get pending reminders
 */
export const getPendingReminders = async (
  merchantId: string,
  options?: { supplierId?: string }
): Promise<DunningReminder[]> => {
  const params = new URLSearchParams();
  if (options?.supplierId) params.append('supplierId', options.supplierId);

  const url = `${API_BASE_URL}/b2b/dunning/reminders/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<DunningReminder[]>(response);
};

/**
 * Send reminder
 */
export const sendReminder = async (reminderId: string): Promise<DunningReminder> => {
  const response = await fetch(`${API_BASE_URL}/b2b/dunning/reminders/${reminderId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<DunningReminder>(response);
};

/**
 * Send bulk reminders
 */
export const sendBulkReminders = async (
  reminderIds: string[]
): Promise<{ sent: number; failed: number }> => {
  const response = await fetch(`${API_BASE_URL}/b2b/dunning/reminders/bulk-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reminderIds }),
  });

  return handleResponse<{ sent: number; failed: number }>(response);
};

// ============================================================================
// Tally Sync API
// ============================================================================

/**
 * Get sync config
 */
export const getTallySyncConfig = async (merchantId: string): Promise<TallySyncConfig> => {
  const response = await fetch(`${API_BASE_URL}/b2b/tally/config/${merchantId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<TallySyncConfig>(response);
};

/**
 * Update sync config
 */
export const updateTallySyncConfig = async (
  merchantId: string,
  config: Partial<TallySyncConfig>
): Promise<TallySyncConfig> => {
  const response = await fetch(`${API_BASE_URL}/b2b/tally/config/${merchantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  return handleResponse<TallySyncConfig>(response);
};

/**
 * Get sync history
 */
export const getSyncHistory = async (
  merchantId: string,
  options?: { page?: number; limit?: number }
): Promise<PaginatedResponse<TallySyncRecord>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const url = `${API_BASE_URL}/b2b/tally/history/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<TallySyncRecord>>(response);
};

/**
 * Trigger manual sync
 */
export const triggerSync = async (
  merchantId: string,
  entity: SyncEntity
): Promise<TallySyncRecord> => {
  const response = await fetch(`${API_BASE_URL}/b2b/tally/sync/${merchantId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity }),
  });

  return handleResponse<TallySyncRecord>(response);
};

/**
 * Export data for Tally
 */
export const exportForTally = async (
  merchantId: string,
  entity: SyncEntity,
  format: 'json' | 'csv' = 'json'
): Promise<{ downloadUrl: string }> => {
  const response = await fetch(`${API_BASE_URL}/b2b/tally/export/${merchantId}?entity=${entity}&format=${format}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<{ downloadUrl: string }>(response);
};

// ============================================================================
// WhatsApp API
// ============================================================================

/**
 * Get WhatsApp templates
 */
export const getWhatsAppTemplates = async (merchantId: string): Promise<WhatsAppTemplate[]> => {
  const cacheKey = `whatsapp_templates_${merchantId}`;

  const fetchFn = async (): Promise<WhatsAppTemplate[]> => {
    const response = await fetch(`${API_BASE_URL}/b2b/whatsapp/templates/${merchantId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<WhatsAppTemplate[]>(response);
  };

  try {
    return await getCachedOrFetch(cacheKey, fetchFn, 15 * 60 * 1000);
  } catch {
    const cached = await getCachedData<WhatsAppTemplate[]>(cacheKey);
    if (cached) return cached;
    throw new Error('No cached data available and offline');
  }
};

/**
 * Create WhatsApp template
 */
export const createWhatsAppTemplate = async (
  data: CreateTemplateData
): Promise<WhatsAppTemplate> => {
  const response = await fetch(`${API_BASE_URL}/b2b/whatsapp/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<WhatsAppTemplate>(response);
};

/**
 * Update WhatsApp template
 */
export const updateWhatsAppTemplate = async (
  id: string,
  data: Partial<CreateTemplateData>
): Promise<WhatsAppTemplate> => {
  const response = await fetch(`${API_BASE_URL}/b2b/whatsapp/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<WhatsAppTemplate>(response);
};

/**
 * Delete WhatsApp template
 */
export const deleteWhatsAppTemplate = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/b2b/whatsapp/templates/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
};

/**
 * Send WhatsApp message
 */
export const sendWhatsAppMessage = async (data: {
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  message: string;
  variables?: Record<string, string>;
}): Promise<WhatsAppMessage> => {
  const response = await fetch(`${API_BASE_URL}/b2b/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<WhatsAppMessage>(response);
};

/**
 * Get message history
 */
export const getWhatsAppMessageHistory = async (
  merchantId: string,
  options?: { page?: number; limit?: number; status?: WhatsAppMessage['status'] }
): Promise<PaginatedResponse<WhatsAppMessage>> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);

  const url = `${API_BASE_URL}/b2b/whatsapp/history/${merchantId}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<WhatsAppMessage>>(response);
};

// ============================================================================
// E-waybill Types
// ============================================================================

export type EwaybillStatus = 'draft' | 'generated' | 'cancelled' | 'expired' | 'in_transit' | 'delivered';

export interface EwaybillItem {
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  taxableValue: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cessRate?: number;
}

export interface Ewaybill {
  id: string;
  ewaybillNumber: string;
  ewaybillDate: string;
  validUntil: string;
  type: 'outward' | 'inward';
  documentNumber: string;
  documentDate: string;
  fromName: string;
  fromGstin?: string;
  toName: string;
  toGstin?: string;
  items: EwaybillItem[];
  totalAmount: number;
  taxableValue: number;
  transporterMode: 'road' | 'rail' | 'air' | 'ship';
  vehicleNumber?: string;
  distance: number;
  status: EwaybillStatus;
}

export interface CreateEwaybillData {
  purchaseOrderId: string;
  ewaybillType: 'outward' | 'inward';
  documentNumber: string;
  documentDate: string;
  fromName: string;
  fromGstin?: string;
  fromState: string;
  fromPincode: string;
  toName: string;
  toGstin?: string;
  toState: string;
  toPincode: string;
  items: EwaybillItem[];
  transporterMode: 'road' | 'rail' | 'air' | 'ship';
  vehicleNumber?: string;
  distance: number;
}

// ============================================================================
// TDS/TCS Types
// ============================================================================

export type TDSStatus = 'pending' | 'deducted' | 'deposited' | 'filed' | 'cancelled';
export type TDSRateType = '193J' | '194' | '194A' | '194C' | '194D' | '194H' | '194I' | '194J' | '194Q';

export interface TDSRecord {
  id: string;
  referenceType: 'po' | 'payment' | 'invoice';
  referenceId: string;
  referenceNumber: string;
  deducteeName: string;
  deducteePan?: string;
  section: TDSRateType;
  tdsRate: number;
  paymentAmount: number;
  taxableAmount: number;
  tdsAmount: number;
  paymentDate: string;
  dueDate: string;
  status: TDSStatus;
  challanNumber?: string;
  depositedAt?: string;
  certificateNumber?: string;
  certificateDate?: string;
}

export interface TDSQuarterlySummary {
  quarter: string;
  totalPayments: number;
  totalTdsDeducted: number;
  totalTdsDeposited: number;
  totalTdsPending: number;
  bySection: Record<string, { count: number; amount: number; tds: number }>;
  certificatesIssued: number;
  certificatesPending: number;
}

export interface TDSCalculation {
  taxableAmount: number;
  tdsAmount: number;
  tdsRate: number;
  isTdsApplicable: boolean;
}

// ============================================================================
// GSTR Types
// ============================================================================

export interface GSTR1Summary {
  period: string;
  b2bCount: number;
  b2bTaxableValue: number;
  b2bIgst: number;
  b2bCgst: number;
  b2bSgst: number;
  b2bCess: number;
  b2clCount: number;
  b2clTaxableValue: number;
  b2clIgst: number;
  b2csCount: number;
  b2csTaxableValue: number;
  exportCount: number;
  exportTaxableValue: number;
  totalTaxableValue: number;
  totalIgst: number;
  totalCgst: number;
  totalSgst: number;
  totalCess: number;
}

export interface GSTR2Summary {
  period: string;
  b2bCount: number;
  b2bTaxableValue: number;
  b2bIgst: number;
  b2bCgst: number;
  b2bSgst: number;
  b2bCess: number;
  totalItcAvailable: number;
  totalTaxableValue: number;
}

export interface GSTR3BSummary {
  outwardSummary: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  inwardSummary: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  itcSummary: {
    itcAvailable: number;
    itcRevenues: number;
    netItc: number;
  };
  taxPayable: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    interest: number;
    penalty: number;
    fees: number;
    total: number;
  };
}

// ============================================================================
// Bank Statement Types
// ============================================================================

export interface ParsedTransaction {
  date: string;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance?: number;
  transactionType: 'debit' | 'credit';
  category?: 'neft' | 'rtgs' | 'upi' | 'imps' | 'cash' | 'cheque' | 'other';
  utrNumber?: string;
}

export interface ReconciliationMatch {
  transaction: ParsedTransaction;
  matchConfidence: number;
  matchReason: string;
  matchedLedgerId?: string;
  matchedPOId?: string;
  matchedSupplierId?: string;
}

// ============================================================================
// E-waybill API
// ============================================================================

/**
 * List e-waybills
 */
export const getEwaybills = async (
  merchantId: string,
  options?: { status?: EwaybillStatus; page?: number; limit?: number }
): Promise<PaginatedResponse<Ewaybill>> => {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(`${API_BASE_URL}/merchant/ewaybill?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<Ewaybill>>(response);
};

/**
 * Get e-waybill by number
 */
export const getEwaybillByNumber = async (
  ewaybillNumber: string
): Promise<Ewaybill> => {
  const response = await fetch(`${API_BASE_URL}/merchant/ewaybill/${ewaybillNumber}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<Ewaybill>(response);
};

/**
 * Generate e-waybill
 */
export const generateEwaybill = async (
  data: CreateEwaybillData
): Promise<{ ewaybillNumber: string; ewaybillDate: string; validUntil: string }> => {
  const response = await fetch(`${API_BASE_URL}/merchant/ewaybill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return handleResponse<{ ewaybillNumber: string; ewaybillDate: string; validUntil: string }>(response);
};

/**
 * Cancel e-waybill
 */
export const cancelEwaybill = async (
  ewaybillNumber: string,
  reason: string,
  reasonCode: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/merchant/ewaybill/${ewaybillNumber}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, reasonCode }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
};

// ============================================================================
// TDS/TCS API
// ============================================================================

/**
 * Calculate TDS
 */
export const calculateTDS = async (
  amount: number,
  section: TDSRateType,
  deducteeType?: 'individual' | 'company'
): Promise<TDSCalculation> => {
  const params = new URLSearchParams();
  params.append('amount', amount.toString());
  params.append('section', section);
  if (dedcuteeType) params.append('deducteeType', deducteeType);

  const response = await fetch(`${API_BASE_URL}/merchant/tds/calculate?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<TDSCalculation>(response);
};

/**
 * Get TDS records
 */
export const getTDSRecords = async (
  merchantId: string,
  options?: { status?: TDSStatus; section?: TDSRateType; page?: number; limit?: number }
): Promise<PaginatedResponse<TDSRecord>> => {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.section) params.append('section', options.section);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(`${API_BASE_URL}/merchant/tds/records?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<PaginatedResponse<TDSRecord>>(response);
};

/**
 * Deposit TDS
 */
export const depositTDS = async (
  recordIds: string[],
  challanDetails: { challanNumber: string; bsrCode: string; depositDate: string; amount: number }
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/merchant/tds/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordIds, ...challanDetails }),
  });

  return handleResponse<{ success: boolean; message: string }>(response);
};

/**
 * Get TDS quarterly summary
 */
export const getTDSQuarterlySummary = async (quarter: string): Promise<TDSQuarterlySummary> => {
  const response = await fetch(`${API_BASE_URL}/merchant/tds/quarterly/${quarter}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<TDSQuarterlySummary>(response);
};

/**
 * Generate TDS certificate
 */
export const generateTDSCertificate = async (
  recordId: string
): Promise<{ certificateNumber: string; date: string; deducteeName: string; tdsAmount: number }> => {
  const response = await fetch(`${API_BASE_URL}/merchant/tds/certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId }),
  });

  return handleResponse<{ certificateNumber: string; date: string; deducteeName: string; tdsAmount: number }>(response);
};

// ============================================================================
// GSTR API
// ============================================================================

/**
 * Get GSTR-1 data
 */
export const getGSTR1 = async (
  year: number,
  month: number,
  filingType: 'monthly' | 'quarterly' = 'monthly'
): Promise<{ records: unknown[]; summary: GSTR1Summary }> => {
  const response = await fetch(
    `${API_BASE_URL}/merchant/gstr/gstr1?year=${year}&month=${month}&filingType=${filingType}`,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return handleResponse<{ records: unknown[]; summary: GSTR1Summary }>(response);
};

/**
 * Get GSTR-2 data
 */
export const getGSTR2 = async (
  year: number,
  month: number,
  filingType: 'monthly' | 'quarterly' = 'monthly'
): Promise<{ records: unknown[]; summary: GSTR2Summary }> => {
  const response = await fetch(
    `${API_BASE_URL}/merchant/gstr/gstr2?year=${year}&month=${month}&filingType=${filingType}`,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return handleResponse<{ records: unknown[]; summary: GSTR2Summary }>(response);
};

/**
 * Get GSTR-3B summary
 */
export const getGSTR3B = async (
  year: number,
  month: number
): Promise<GSTR3BSummary> => {
  const response = await fetch(
    `${API_BASE_URL}/merchant/gstr/gstr3b?year=${year}&month=${month}`,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return handleResponse<GSTR3BSummary>(response);
};

// ============================================================================
// Bank Statement & Reconciliation API
// ============================================================================

/**
 * Parse bank statement
 */
export const parseBankStatement = async (
  fileContent: string,
  bankName?: string
): Promise<{ transactions: ParsedTransaction[]; bankName: string; totalTransactions: number }> => {
  const response = await fetch(`${API_BASE_URL}/merchant/bank-statements/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: fileContent, bankName }),
  });

  return handleResponse<{ transactions: ParsedTransaction[]; bankName: string; totalTransactions: number }>(response);
};

/**
 * Reconcile bank statement
 */
export const reconcileBankStatement = async (
  transactions: ParsedTransaction[]
): Promise<{ matches: ReconciliationMatch[]; summary: { total: number; matched: number; uncertain: number; unmatched: number } }> => {
  const response = await fetch(`${API_BASE_URL}/merchant/bank-statements/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  });

  return handleResponse<{
    matches: ReconciliationMatch[];
    summary: { total: number; matched: number; uncertain: number; unmatched: number };
  }>(response);
};

/**
 * Run full reconciliation
 */
export const runFullReconciliation = async (): Promise<{
  processed: number;
  matched: number;
  unmatched: number;
  disputed: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/merchant/reconciliation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<{ processed: number; matched: number; unmatched: number; disputed: number }>(response);
};

/**
 * Get reconciliation summary
 */
export const getReconciliationSummary = async (): Promise<{
  totalRecords: number;
  matched: number;
  unmatched: number;
  disputed: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/merchant/reconciliation/summary`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return handleResponse<{
    totalRecords: number;
    matched: number;
    unmatched: number;
    disputed: number;
    totalMatchedAmount: number;
    totalUnmatchedAmount: number;
  }>(response);
};

// ============================================================================
// Export
// ============================================================================

export const b2bApi = {
  // Suppliers
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,

  // Orders
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,

  // Ledger
  getSupplierLedger,
  getSupplierBalances,
  recordPayment,

  // Reconciliation
  getBankTransactions,
  uploadBankStatement,
  matchTransaction,
  unmatchTransaction,
  autoMatchTransactions,
  getSuggestedMatches,

  // RFQ
  getRFQs,
  getRFQById,
  createRFQ,
  updateRFQStatus,
  getQuotes,
  getQuoteById,
  updateQuoteStatus,

  // Dunning
  getReminderTemplates,
  createReminderTemplate,
  updateReminderTemplate,
  deleteReminderTemplate,
  getPendingReminders,
  sendReminder,
  sendBulkReminders,

  // Tally
  getTallySyncConfig,
  updateTallySyncConfig,
  getSyncHistory,
  triggerSync,
  exportForTally,

  // WhatsApp
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  sendWhatsAppMessage,
  getWhatsAppMessageHistory,

  // E-waybill
  getEwaybills,
  getEwaybillByNumber,
  generateEwaybill,
  cancelEwaybill,

  // TDS/TCS
  calculateTDS,
  getTDSRecords,
  depositTDS,
  getTDSQuarterlySummary,
  generateTDSCertificate,

  // GSTR
  getGSTR1,
  getGSTR2,
  getGSTR3B,

  // Bank Statement & Reconciliation
  parseBankStatement,
  reconcileBankStatement,
  runFullReconciliation,
  getReconciliationSummary,
};

export default b2bApi;
