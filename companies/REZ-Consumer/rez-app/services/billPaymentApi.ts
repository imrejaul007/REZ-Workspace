import apiClient, { ApiResponse, API_TIMEOUTS } from './apiClient';
import uuid from 'react-native-uuid';
import { captureBillIntent, type BillIntentParams } from './intentCaptureService';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────

export interface BillTypeInfo {
  id:            string;
  label:         string;
  icon:          string;
  color:         string;
  category:      string;
  providerCount: number;
}

export interface BillProviderInfo {
  _id:                  string;
  name:                 string;
  code:                 string;
  type:                 string;
  logo:                 string;
  region?:              string;
  requiredFields:       Array<{ fieldName: string; label: string; placeholder: string; type: 'text' | 'number' }>;
  cashbackPercent:      number;
  promoCoinsFixed:      number;   // coins earned on payment
  promoExpiryDays:      number;   // coin expiry in days
  maxRedemptionPercent: number;   // max % redeemable
  displayOrder:         number;
  isFeatured:           boolean;
}

export interface BillPlanInfo {
  id:        string;
  name:      string;
  price:     number;
  validity:  string;
  data?:     string;
  calls?:    string;
  sms?:      string;
  isPopular: boolean;
}

export interface FetchedBillInfo {
  provider:              { _id: string; name: string; code: string; logo: string; type: string };
  customerNumber:        string;
  amount?:               number;
  dueDate?:              string;
  billDate?:             string;
  consumerName?:         string;
  billNumber?:           string;
  cashbackPercent?:      number;
  cashbackAmount?:       number;
  promoCoins:            number;
  promoExpiryDays:       number;
  requiresPlanSelection?: boolean;
  additionalInfo?:       Record<string, string>;
}

export interface BillPaymentRecord {
  _id:                  string;
  provider:             { _id: string; name: string; code: string; logo: string; type: string };
  billType:             string;
  customerNumber:       string;
  amount:               number;
  cashbackAmount:       number;
  promoCoinsIssued:     number;
  promoCoinsEarned:     number;
  promoExpiryDays:      number;
  maxRedemptionPercent: number;
  status:               'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionRef?:      string;
  paidAt?:              string;
  createdAt:            string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages:  number;
  totalItems:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────────

export async function getBillTypes(): Promise<ApiResponse<BillTypeInfo[]>> {
  return apiClient.get<BillTypeInfo[]>('/bill-payments/types');
}

export async function getProviders(
  type: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<{ providers: BillProviderInfo[]; pagination: PaginationInfo }>> {
  return apiClient.get<unknown>(`/bill-payments/providers?type=${type}&page=${page}&limit=${limit}`);
}

export async function fetchBill(
  providerId: string,
  customerNumber: string
): Promise<ApiResponse<FetchedBillInfo>> {
  // CONS-015: BILL_FETCH timeout — external BBPS/utility calls can be slow
  return apiClient.post<unknown>('/bill-payments/fetch-bill', { providerId, customerNumber }, { timeout: API_TIMEOUTS.BILL_FETCH });
}

export async function getPlans(
  providerId: string,
  circle: string = 'KA'
): Promise<ApiResponse<{ popular: BillPlanInfo[]; allPlans: BillPlanInfo[]; promoCoins: number; expiryDays: number }>> {
  return apiClient.get<unknown>(`/bill-payments/plans?providerId=${providerId}&circle=${circle}`);
}

export async function payBill(
  providerId:        string,
  customerNumber:    string,
  amount:            number,
  razorpayPaymentId: string,
  planId?:           string,
  // OG-001 FIX: idempotencyKey must be generated once per user payment intent
  // (e.g. in the bill-payment screen's useRef on mount) and passed here.
  // The backend billPaymentRoutes.ts already applies idempotencyMiddleware on POST /pay.
  idempotencyKey?:   string
): Promise<ApiResponse<{
  payment:          BillPaymentRecord;
  promoCoinsEarned: number;
  promoExpiryDays:  number;
  status:           string;
  message:          string;
}>> {
  const key =
    idempotencyKey ||
    `bill-${Date.now()}-${uuid.v4()}`;

  // CONS-015: PAYMENT timeout — give payment gateway and BBPS enough time
  const response = await apiClient.post<unknown>('/bill-payments/pay', {
    providerId,
    customerNumber,
    amount,
    razorpayPaymentId,
    planId,
  }, {
    timeout: API_TIMEOUTS.PAYMENT,
    headers: { 'Idempotency-Key': key },
  });

  // RTMN Commerce Memory: Capture bill payment completion intent (non-blocking)
  const userId = useAuthStore.getState()?.state?.user?.id;
  if (userId) {
    captureBillIntent({
      userId,
      eventType: 'BILL_PAYMENT_COMPLETE',
      billId: providerId,
      amount,
    }).catch(() => {});
  }

  return response;
}

export async function getPaymentHistory(
  page = 1,
  limit = 10,
  billType?: string
): Promise<ApiResponse<{ payments: BillPaymentRecord[]; pagination: PaginationInfo }>> {
  const q = `page=${page}&limit=${limit}${billType ? `&billType=${billType}` : ''}`;
  return apiClient.get<unknown>(`/bill-payments/history?${q}`);
}

export async function requestRefund(
  paymentId: string,
  reason?: string
): Promise<ApiResponse<{ refundId: string; status: string }>> {
  return apiClient.post<unknown>('/bill-payments/refund', { paymentId, reason });
}
