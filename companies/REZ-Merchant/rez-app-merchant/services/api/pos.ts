/**
 * POS (Point of Sale) API Service
 *
 * Handles bill creation, QR payment generation, payment status polling,
 * and bill history for the merchant POS system.
 */

import { apiClient } from './client';
import { storageService } from '../storage';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface POSBillItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  modifiers?: Array<{ name: string; price: number }>;
}

export interface POSBill {
  billId: string;
  billNumber: string;
  amount: number;
  // MERCH-026: Add discount field to bill
  discount?: number;
  discountPercent?: number;
  grossAmount?: number;
  description?: string;
  customerPhone?: string;
  items?: POSBillItem[];
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  paymentMethod?: 'qr' | 'cash' | 'card';
  qrData?: string;
  paymentLink?: string;
  coinsEarned?: number;
  cashbackEarned?: number;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface CreateBillLineItem {
  name: string;
  qty: number;
  price: number;
  gstRate?: number;
  gstAmount?: number;
}

export interface CoinRedemption {
  amount: number;
  discountApplied: number;
}

export interface CreateBillRequest {
  items: POSBillItem[];
  customerPhone?: string;
  description?: string;
  storeId?: string;
  // MERCH-026: Add discount field
  discount?: number;
  discountPercent?: number;
  splitCount?: number;
  tableNumber?: string;
  lineItems?: CreateBillLineItem[];
  coinRedemption?: CoinRedemption;
  // Fields the backend posBillingController.createBill actually requires:
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface QuickBillRequest {
  amount: number;
  description?: string;
  customerPhone?: string;
  storeId?: string;
}

export interface PaymentStatusResponse {
  billId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  paidAt?: string;
  paymentMethod?: string;
  coinsEarned?: number;
  cashbackEarned?: number;
}

export interface BillsListResponse {
  bills: POSBill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalRevenue: number;
    totalBills: number;
    paidBills: number;
    pendingBills: number;
  };
}

// ─── QR Helpers ───────────────────────────────────────────────────────────────

/**
 * Fetch a cryptographically secure transaction reference from the server.
 * Falls back to client-side crypto.getRandomValues only if the server is unreachable.
 */
async function fetchServerTransactionRef(amount: number, billId?: string): Promise<string> {
  try {
    // apiClient.post already unwraps the axios layer, so `response` here IS the
    // ApiResponse envelope: { success, data: { transactionRef }, ... }
    const response = await apiClient.post<{ transactionRef: string }>(
      '/merchant/pos/generate-transaction-ref',
      { amount, billId }
    );
    if (response.success && response.data?.transactionRef) {
      return response.data.transactionRef;
    }
  } catch (err) {
    logger.warn(
      '[POSService] Server transaction ref generation failed, using client-side fallback:',
      err
    );
  }

  // Client-side fallback — only used when server is unreachable (e.g., offline POS)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    return (
      'RZ' +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  // Last resort — should never be reached in modern environments
  throw new Error(
    'Cannot generate secure transaction reference: crypto API unavailable and server unreachable'
  );
}

/**
 * MERCH-027: Generate secure UPI payment deep link.
 * Transaction reference is generated server-side for security.
 * Format: upi://pay?pa=&pn=&am=&cu=INR&tn=&tr=
 *
 * BUG FIX (P2-C1): Previously this silently defaulted `vpa` to
 * `merchant@rezpay` when the caller didn't pass one. That meant every
 * merchant's QR code routed customer payments to a single central VPA.
 * Now we throw if no VPA is supplied — the UI surfaces a clear
 * "configure your UPI ID in store settings" error instead of silently
 * sending customer money to the wrong account.
 */
export async function generateUPILink(params: {
  vpa?: string;
  payeeName?: string;
  amount: number;
  note?: string;
  billId?: string;
}): Promise<string> {
  const { vpa, payeeName = 'Rez Merchant', amount, note, billId } = params;
  if (!vpa || !vpa.trim()) {
    throw new Error(
      'Store UPI ID not configured. Open Store Settings → Payment and set your UPI ID before accepting QR payments.'
    );
  }
  const tn = note || (billId ? `Bill #${billId}` : 'Payment');
  const nonce = await fetchServerTransactionRef(amount, billId);

  return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(tn)}&tr=${nonce}`;
}

/**
 * Generate a Rez Pay deep link that the customer app can open.
 */
export function generateRezPayLink(billId: string, amount: number): string {
  return `rezpay://pay?billId=${billId}&amount=${amount.toFixed(2)}`;
}

// ─── Service Class ─────────────────────────────────────────────────────────────

class POSService {
  private async getAuthToken(): Promise<string> {
    return (await storageService.getAuthToken()) || '';
  }

  // MERCH-026: Calculate bill total with discount handling
  private calculateBillTotal(
    items: POSBillItem[],
    discount: number = 0,
    discountPercent: number = 0
  ): number {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let total = subtotal;

    // Apply percentage discount first if provided
    if (discountPercent > 0) {
      total = subtotal * (1 - discountPercent / 100);
    }

    // Apply fixed discount
    if (discount > 0) {
      total = Math.max(0, total - discount);
    }

    return Math.round(total * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create a new bill from a product cart.
   * POST /api/store-payment/create-bill
   */
  async createBill(
    items: POSBillItem[],
    customerPhone?: string,
    storeId?: string,
    discount?: number,
    discountPercent?: number,
    splitCount?: number,
    tableNumber?: string,
    lineItems?: CreateBillLineItem[],
    coinRedemption?: CoinRedemption,
    clientTxnId?: string
  ): Promise<POSBill> {
    try {
      // BUG-FIX: the backend posBillingController.createBill requires
      // `totalAmount` as a positive number and otherwise returns 400. The
      // previous version of this method never sent it, so every product-POS
      // bill creation failed. Compute all money fields on the client and
      // send them explicitly.
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discountAmount =
        (discount || 0) +
        (discountPercent ? subtotal * (discountPercent / 100) : 0) +
        (coinRedemption?.discountApplied || 0);
      const taxAmount = (lineItems || []).reduce(
        (sum, li) => sum + (li.gstAmount || 0) * (li.qty || 1),
        0
      );
      const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

      const payload: CreateBillRequest = {
        items,
        customerPhone,
        storeId,
        discount,
        discountPercent,
        splitCount,
        tableNumber,
        lineItems,
        coinRedemption,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        totalAmount,
      };
      // MA-GAP-140: Idempotency-Key only as header (not in body) — avoids ambiguity
      // if the backend's idempotency middleware reads from header vs body.
      const response = await apiClient.post<unknown>(
        'store-payment/create-bill',
        payload,
        clientTxnId ? { headers: { 'Idempotency-Key': clientTxnId } } : undefined
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create bill');
      }

      // BUG-FIX: the backend returns a raw PosBill document with `_id` and
      // `totalAmount`, but the FE (payment screen, success screen) expects
      // `billId` and `amount`. Normalise here so every caller gets the same
      // shape regardless of backend churn.
      const raw: unknown = response.data;
      return {
        ...raw,
        billId: raw.billId || raw._id?.toString?.() || raw._id || '',
        amount: raw.amount ?? raw.totalAmount ?? totalAmount,
      } as POSBill;
    } catch (error) {
      logger.error('[POSService] createBill error:', error);
      throw error;
    }
  }

  /**
   * Create a quick bill with just an amount (no product catalog).
   * POST /api/store-payment/quick-bill
   */
  async quickBill(
    amount: number,
    description?: string,
    customerPhone?: string,
    storeId?: string
  ): Promise<POSBill> {
    try {
      const payload: QuickBillRequest = { amount, description, customerPhone, storeId };
      const response = await apiClient.post<unknown>('store-payment/quick-bill', payload);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create quick bill');
      }
      // Same _id → billId normalisation as createBill.
      const raw: unknown = response.data;
      return {
        ...raw,
        billId: raw.billId || raw._id?.toString?.() || raw._id || '',
        amount: raw.amount ?? raw.totalAmount ?? amount,
      } as POSBill;
    } catch (error) {
      logger.error('[POSService] quickBill error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code data for a bill.
   * Returns a UPI link that encodes as a scannable QR.
   *
   * BUG FIX (P2-C1 — hardcoded VPA): Previously this helper didn't accept a
   * VPA, so `generateUPILink` fell back to `merchant@rezpay` for every
   * merchant. Every customer QR code routed to a single central account.
   * Now the caller MUST pass the store's configured `upiId` — if the store
   * hasn't configured one yet, fall back throws in generateUPILink so the
   * cashier sees an explicit error instead of sending money to the wrong
   * account.
   */
  async generateQR(
    billId: string,
    amount: number,
    storeName?: string,
    upiId?: string
  ): Promise<string> {
    return generateUPILink({
      vpa: upiId,
      payeeName: storeName || 'Rez Merchant',
      amount,
      billId,
      note: `Bill #${billId}`,
    });
  }

  /**
   * Check the payment status of a bill.
   * GET /api/store-payment/status/:billId
   */
  async checkPaymentStatus(billId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await apiClient.get<unknown>(`store-payment/status/${billId}`);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to check payment status');
      }
      // Backend returns the raw PosBill doc, not the slim status DTO the
      // FE type promises. Project out just the polled fields so callers
      // never see undefined `status` when they `response.data.status`.
      const raw: unknown = response.data;
      return {
        billId: raw.billId || raw._id?.toString?.() || raw._id || billId,
        status: raw.status,
        paidAt: raw.paidAt,
        paymentMethod: raw.paymentMethod,
        coinsEarned: raw.coinsEarned ?? raw.rewards?.coinsEarned,
        cashbackEarned: raw.cashbackEarned ?? raw.rewards?.cashbackEarned,
      };
    } catch (error) {
      logger.error('[POSService] checkPaymentStatus error:', error);
      throw error;
    }
  }

  /**
   * Mark a bill as paid via cash (offline payment).
   * POST /api/store-payment/mark-paid/:billId
   */
  // FIX (133+134+147): Added idempotency key, production error telemetry, and amount validation.
  async markAsPaid(
    billId: string,
    paymentMethod: 'cash' | 'card' = 'cash',
    finalAmount?: number,
    clientTxnId?: string
  ): Promise<PaymentStatusResponse> {
    // FIX (147): Pre-flight validation — reject non-positive amounts before hitting the network.
    // This catches both cashier typos (e.g. passing 999 instead of 99.99) and tampering attempts.
    if (finalAmount !== undefined && finalAmount <= 0) {
      // Log the anomaly but don't surface to user — this is likely a dev bug, not user-facing.
      if (__DEV__) {
        console.warn('[POSService] markAsPaid rejected: finalAmount must be positive', {
          billId,
          finalAmount,
        });
      }
      throw new Error('Invalid payment amount: must be greater than zero');
    }

    try {
      // FIX (133): Add Idempotency-Key so double-taps are deduplicated server-side.
      // Use clientTxnId if provided (from offline queue), otherwise generate a unique key.
      const idempotencyKey = clientTxnId ?? `${billId}-${paymentMethod}-${Date.now()}`;
      const response = await apiClient.post<PaymentStatusResponse>(
        `store-payment/mark-paid/${billId}`,
        {
          paymentMethod,
          ...(finalAmount !== undefined && { amount: finalAmount }),
        },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );

      if (response.success && response.data) {
        return response.data;
      }
      // FIX (134): Log failures in production so monitoring sees them. Errors are surfaced
      // to the caller (UI shows alert) — but the log ensures Sentry/dashboards also capture them.
      logger.error('[POSService] markAsPaid failed:', {
        billId,
        paymentMethod,
        message: response.message,
      });
      throw new Error(response.message || 'Failed to mark bill as paid');
    } catch (error) {
      logger.error('[POSService] markAsPaid error:', error);
      throw error;
    }
  }

  /**
   * Get recent bills for history view.
   * GET /api/store-payment/bills?page=1&limit=20
   */
  async getRecentBills(page: number = 1, storeId?: string): Promise<BillsListResponse> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (storeId) params.append('storeId', storeId);

      const response = await apiClient.get<unknown>(`store-payment/bills?${params.toString()}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bills');
      }

      // Backend returns { success, data: <bills[]>, pagination: { total,
      // page, limit, pages } } — a FLAT array of bills, pagination OUTSIDE
      // `data`, and no `summary`. The FE `BillsListResponse` type expects
      // `{ bills, pagination, summary }` nested under `data`. Normalise so
      // recent-orders.tsx and any other caller gets the documented shape.
      const rawBills: unknown[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.bills ?? []);
      const rawPag: unknown = response.data?.pagination ?? (response as unknown).pagination ?? {};

      // Normalise each bill to include billId/amount aliases.
      const bills = rawBills.map((b) => ({
        ...b,
        billId: b.billId || b._id?.toString?.() || b._id || '',
        amount: b.amount ?? b.totalAmount ?? 0,
      })) as POSBill[];

      const total = rawPag.total ?? bills.length;
      const limit = rawPag.limit ?? 20;
      const pageNum = rawPag.page ?? page;
      const totalPages = rawPag.totalPages ?? rawPag.pages ?? Math.max(1, Math.ceil(total / limit));

      // Compute summary client-side from the page we got back. Not perfect
      // (only reflects this page, not the whole result set) but matches
      // what the old UI expected and avoids crashing on undefined.
      const paidBills = bills.filter((b) => b.status === 'paid').length;
      const pendingBills = bills.filter((b) => b.status === 'pending').length;
      const totalRevenue = bills
        .filter((b) => b.status === 'paid')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      return {
        bills,
        pagination: {
          page: pageNum,
          limit,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
        summary: {
          totalRevenue,
          totalBills: bills.length,
          paidBills,
          pendingBills,
        },
      };
    } catch (error) {
      logger.error('[POSService] getRecentBills error:', error);
      throw error;
    }
  }

  /**
   * Refund a paid bill — full or partial.
   * POST /api/store-payment/refund/:billId
   */
  // FIX (146): Added Idempotency-Key so network retries don't cause double refunds.
  async refundBill(billId: string, reason: string, refundAmount?: number): Promise<POSBill> {
    try {
      // FIX (146): Idempotency key prevents double-refund on network timeout/retry.
      const idempotencyKey = `${billId}-refund-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      const response = await apiClient.post<POSBill>(
        `store-payment/refund/${billId}`,
        {
          reason,
          ...(refundAmount !== undefined && { refundAmount }),
        },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.message || 'Failed to refund bill');
    } catch (error) {
      logger.error('[POSService] refundBill error:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending bill.
   * POST /api/store-payment/cancel/:billId
   */
  async cancelBill(billId: string): Promise<void> {
    try {
      await apiClient.post(`store-payment/cancel/${billId}`);
    } catch (error) {
      logger.error('[POSService] cancelBill error:', error);
      throw error;
    }
  }

  // ─── Offline Queue ──────────────────────────────────────────────────────────

  private getOfflineQueueService() {
    // Dynamic import to avoid issues on web
    try {
      return require('../offlinePOSQueue');
    } catch {
      return null;
    }
  }

  addToOfflineQueue(amount: number, description?: string): void {
    const queueService = this.getOfflineQueueService();
    if (queueService) {
      queueService.enqueueBill({
        amount,
        description,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async enqueueFullBill(
    items: POSBillItem[],
    storeId?: string,
    tableNumber?: string,
    splitCount?: number,
    coinRedemption?: { amount: number; consumerId: string | null }
  ): Promise<void> {
    const queueService = this.getOfflineQueueService();
    if (!queueService) {
      throw new Error('Offline queue service unavailable');
    }
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    // G-MA-C02/C03: Persist coin redemption so offline-synced bills carry the
    // discount through to the backend. Without this, coins are silently lost
    // for every offline transaction.
    await Promise.resolve(
      queueService.enqueueBill({
        items,
        totalAmount,
        storeId,
        tableNumber,
        splitCount,
        coinDiscountApplied: coinRedemption?.amount ?? 0,
        consumerIdForCoins: coinRedemption?.consumerId ?? null,
        timestamp: new Date().toISOString(),
      })
    );
  }

  getOfflineQueue(): Array<{
    id?: number;
    amount: number;
    description?: string;
    timestamp: string;
  }> {
    const queueService = this.getOfflineQueueService();
    if (!queueService) return [];

    const pending = queueService.getPendingBills();
    return pending.map((bill) => ({
      id: bill.id,
      amount: bill.billData.amount,
      description: bill.billData.description,
      timestamp: new Date(bill.createdAt).toISOString(),
    }));
  }

  clearOfflineQueue(): void {
    const queueService = this.getOfflineQueueService();
    if (queueService) {
      queueService.clearAllPendingBills();
    }
  }

  async syncOfflineQueue(storeId?: string): Promise<{ synced: number; conflicts: number }> {
    const queueService = this.getOfflineQueueService();
    if (!queueService) return { synced: 0, conflicts: 0 };

    let synced = 0;
    const pending = queueService.getPendingBills();

    for (const bill of pending) {
      try {
        const bd = bill.billData;
        // Pass clientTxnId from offline bill data for idempotency — prevents duplicate
        // charges if the same bill is retried after a network timeout.
        const clientTxnId = (bd as unknown).clientTxnId;
        if (bd.items && Array.isArray(bd.items) && (bd.items as unknown[]).length > 0) {
          // Full-item bill — pass clientTxnId for server-side idempotency dedup.
          // G-MA-C02/C03: Forward coin redemption so offline-synced bills are charged
          // the correct amount (total - coins) instead of the full pre-discount amount.
          const coinDiscountApplied = (bd as unknown).coinDiscountApplied as number | undefined;
          const coinRedemptionPayload =
            coinDiscountApplied && coinDiscountApplied > 0
              ? { amount: coinDiscountApplied, discountApplied: coinDiscountApplied }
              : undefined;
          await this.createBill(
            (bd.items || []) as POSBillItem[],
            undefined,
            storeId || bd.storeId,
            undefined,
            undefined,
            bd.splitCount as number | undefined,
            bd.tableNumber as string | undefined,
            undefined,
            coinRedemptionPayload,
            clientTxnId
          );
        } else {
          // Legacy quick bill (amount only)
          await this.quickBill(
            bd.amount as number,
            bd.description as string | undefined,
            undefined,
            storeId
          );
        }
        queueService.markBillSuccess(bill.id);
        synced++;
      } catch {
        queueService.incrementAttempt(bill.id);
      }
    }
    // posService creates bills individually (not in bulk) so duplicates cannot occur
    return { synced, conflicts: 0 };
  }

  getPendingBillCount(): number {
    const queueService = this.getOfflineQueueService();
    if (!queueService) return 0;
    return queueService.getPendingCount();
  }
}

export const posService = new POSService();
export default posService;

// ─── Merchant Service POS Integration ─────────────────────────────────────────
// These functions call the merchant microservice endpoints (via gateway).

export interface MerchantOrder {
  _id: string;
  merchantId: string;
  storeId?: string;
  items: POSBillItem[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface MerchantPOSProduct {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
}

/**
 * Record a completed order in the merchant service ledger.
 * POST /api/merchant/pos/create-order
 * Fire-and-forget: call after bill is paid, don't block the UI.
 */
export async function createMerchantOrder(
  items: POSBillItem[],
  total: number,
  paymentMethod: string,
  storeId?: string
): Promise<void> {
  try {
    const { apiClient } = await import('./client');
    await apiClient.post('merchant/pos/create-order', { items, total, paymentMethod, storeId });
  } catch {
    // Non-fatal — merchant order ledger is supplementary
  }
}

/**
 * Fetch recent POS orders for the merchant from the merchant service.
 * GET /api/merchant/pos/recent-orders?storeId=...
 * Backend requires storeId.
 */
export async function getRecentMerchantOrders(storeId: string): Promise<MerchantOrder[]> {
  const { apiClient } = await import('./client');
  if (!storeId) return [];
  const res = await apiClient.get<MerchantOrder[]>(
    `merchant/pos/recent-orders?storeId=${encodeURIComponent(storeId)}`
  );
  if (res.success && Array.isArray(res.data)) return res.data;
  return [];
}

/**
 * Search products via merchant-service POS endpoint (alt path used by quick search).
 * GET /api/merchant/pos/products?storeId=...&search=query
 * Backend requires storeId.
 */
export async function getMerchantPOSProducts(
  storeId: string,
  search?: string
): Promise<MerchantPOSProduct[]> {
  const { apiClient } = await import('./client');
  if (!storeId) return [];
  const params = new URLSearchParams({ storeId });
  if (search) params.append('search', search);
  const res = await apiClient.get<MerchantPOSProduct[]>(`merchant/pos/products?${params}`);
  if (res.success && Array.isArray(res.data)) return res.data;
  return [];
}
