import { authClient, publicClient } from './client';

export interface BillItem {
  name: string;
  qty: number;
  unitPrice: number;
  total?: number;
}

export interface CreateBillPayload {
  storeSlug: string;
  items: BillItem[];
  discount?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface BillDetails {
  billId: string;
  billNumber: string;
  storeName: string;
  storeLogo: string | null;
  storeSlug: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: string;
  paidAt: string | null;
  razorpayOrderId: string | null;
  paymentId: string | null;
  isEditable: boolean;
}

export interface CreateBillResult {
  billId: string;
  billNumber: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string;
  payUrl: string;
  razorpayOrderId: string;
}

/** Merchant: create a new bill with items and get the payment URL. */
export async function createMerchantBill(payload: CreateBillPayload): Promise<CreateBillResult> {
  const { data } = await authClient.post('/api/merchant-bill/create', payload);
  if (!data.success) throw new Error(data.message || 'Failed to create bill');
  return data.data as CreateBillResult;
}

/** Merchant: list active (pending) bills for a store. */
export async function getActiveBills(storeSlug: string) {
  const { data } = await authClient.get(`/api/merchant-bill/store/${storeSlug}/active`);
  if (!data.success) throw new Error(data.message || 'Failed to load bills');
  return data.data.bills as Array<{
    billId: string;
    billNumber: string;
    items: BillItem[];
    subtotal: number;
    discount: number;
    total: number;
    expiresAt: string;
    createdAt: string;
  }>;
}

/** Merchant: cancel a pending bill. */
export async function cancelBill(billId: string): Promise<void> {
  const { data } = await authClient.patch(`/api/merchant-bill/${billId}/cancel`);
  if (!data.success) throw new Error(data.message || 'Failed to cancel bill');
}

/** Customer: get bill details by ID (public). */
export async function getBillDetails(billId: string): Promise<BillDetails> {
  const { data } = await publicClient.get(`/api/merchant-bill/${billId}`);
  if (!data.success) throw new Error(data.message || 'Bill not found');
  return data.data as BillDetails;
}

/** Customer: lightweight status check for polling. */
export async function getBillStatus(billId: string) {
  const { data } = await publicClient.get(`/api/merchant-bill/${billId}/status`);
  if (!data.success) throw new Error(data.message || 'Bill not found');
  return data.data as {
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    expiresAt: string;
    paidAt: string | null;
    paymentId: string | null;
    razorpayOrderId: string | null;
  };
}
