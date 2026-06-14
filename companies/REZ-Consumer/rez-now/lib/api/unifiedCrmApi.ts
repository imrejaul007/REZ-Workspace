/**
 * REZ NOW - Unified CRM Merchant API Client
 *
 * Connects to the REZ Unified CRM Hub Merchant API (Port 4101).
 *
 * This API returns ONLY merchant-safe data:
 * - Customer names, orders, basic segments
 * - NO AI predictions, engagement scores, intent signals
 *
 * If the unified CRM API is unavailable, falls back to local data.
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';
import type {
  CustomerSegments,
  CustomerSummary,
  CustomerDetail,
  AtRiskCustomer,
  CustomerSegmentType,
  CustomerSegment,
} from '@/lib/types';

// ─── Configuration ────────────────────────────────────────────────────────────────

const UNIFIED_CRM_MERCHANT_API = process.env.NEXT_PUBLIC_UNIFIED_CRM_MERCHANT_URL || 'http://localhost:4101';

// ─── Types (aligned with Merchant API) ─────────────────────────────────────────

interface MerchantApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

interface MerchantCustomer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  segments: string[];
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  lastVisit?: string;
  joinedDate: string;
}

interface MerchantSegment {
  id: string;
  name: string;
  description?: string;
  customerCount: number;
  totalRevenue: number;
}

interface MerchantOrder {
  id: string;
  orderNumber: string;
  storeName: string;
  items: string[];
  total: number;
  status: string;
  createdAt: string;
}

// ─── API Client ────────────────────────────────────────────────────────────────

async function fetchMerchantApi<T>(path: string, timeout: number = 5000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await authClient.get<MerchantApiResponse<T>>(
      `${UNIFIED_CRM_MERCHANT_API}/api/v1${path}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.data?.success) {
      return response.data.data as T;
    }

    logger.warn('Unified CRM API returned error', { error: response.data?.error });
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Unified CRM API request timed out', { path });
    } else {
      logger.warn('Unified CRM API unavailable', { error });
    }
    return null;
  }
}

// ─── API Functions ──────────────────────────────────────────────────────────────

/**
 * Get customer segments from Unified CRM Merchant API
 * Note: Segments endpoint returns aggregate data, not individual customers
 */
export async function getUnifiedCustomerSegments(storeSlug: string): Promise<CustomerSegments | null> {
  const segments = await fetchMerchantApi<MerchantSegment[]>('/merchant/segments');

  if (!segments) return null;

  // Transform raw segments to CustomerSegment format
  const customerSegments = segments.map(seg => ({
    type: mapSegmentNameToType(seg.name),
    count: seg.customerCount,
    avgOrderValue: 0,
    totalRevenue: seg.totalRevenue,
  }));

  return {
    segments: customerSegments,
    totalCustomers: customerSegments.reduce((sum, s) => sum + s.count, 0),
  };
}

/**
 * Get customers from Unified CRM Merchant API
 */
export async function getUnifiedCustomers(
  storeSlug: string,
  options?: { search?: string; segment?: string; page?: number; limit?: number }
): Promise<CustomerSummary[] | null> {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.segment) params.append('segment', options.segment);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const queryString = params.toString();
  const path = `/merchant/customers${queryString ? `?${queryString}` : ''}`;

  const customers = await fetchMerchantApi<MerchantCustomer[]>(path);

  if (!customers) return null;

  // Transform to existing format
  return customers.map(transformMerchantCustomerToSummary);
}

/**
 * Get customer detail from Unified CRM Merchant API
 */
export async function getUnifiedCustomerDetail(
  storeSlug: string,
  customerId: string
): Promise<CustomerDetail | null> {
  const [customer, orders] = await Promise.all([
    fetchMerchantApi<MerchantCustomer>(`/merchant/customers/${customerId}`),
    fetchMerchantApi<MerchantOrder[]>(`/merchant/customers/${customerId}/orders`),
  ]);

  if (!customer) return null;

  return {
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone || '',
    segment: (customer.segments?.[0] as CustomerSegmentType) || 'new',
    visitCount: customer.totalOrders,
    totalSpent: customer.totalSpend,
    avgOrderValue: customer.averageOrderValue,
    lastVisit: customer.lastVisit || '',
    firstVisit: customer.joinedDate || '',
    orders: (orders || []).map(order => ({
      orderNumber: order.orderNumber,
      total: order.total,
      createdAt: order.createdAt,
      status: order.status,
    })),
  };
}

/**
 * Get at-risk customers from Unified CRM Merchant API
 */
export async function getUnifiedAtRiskCustomers(storeSlug: string): Promise<AtRiskCustomer[] | null> {
  // Filter for at-risk segment
  const customers = await getUnifiedCustomers(storeSlug, { segment: 'at_risk' });

  if (!customers) return null;

  // Calculate days since last visit
  return customers.map(c => ({
    customerId: c.customerId,
    name: c.name,
    phone: c.phone,
    visitCount: c.visitCount,
    totalSpent: c.totalSpent,
    lastVisit: c.lastVisit,
    avgOrderValue: c.avgOrderValue,
    daysSinceLastVisit: Math.floor(
      (Date.now() - new Date(c.lastVisit).getTime()) / 86400000
    ),
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSegmentNameToType(name: string): CustomerSegmentType {
  const lower = name.toLowerCase();
  if (lower.includes('vip') || lower.includes('high')) return 'vip';
  if (lower.includes('risk') || lower.includes('churn') || lower.includes('dormant')) return 'at_risk';
  if (lower.includes('new')) return 'new';
  return 'repeat';
}

function transformMerchantCustomerToSummary(customer: MerchantCustomer): CustomerSummary {
  const daysSince = customer.lastVisit
    ? Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / 86400000)
    : 999;

  return {
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone || '',
    visitCount: customer.totalOrders,
    totalSpent: customer.totalSpend,
    avgOrderValue: customer.averageOrderValue,
    lastVisit: customer.lastVisit || new Date().toISOString(),
  };
}

// ─── Export all unified functions ─────────────────────────────────────────────

export const unifiedCrmApi = {
  getCustomerSegments: getUnifiedCustomerSegments,
  getCustomers: getUnifiedCustomers,
  getCustomerDetail: getUnifiedCustomerDetail,
  getAtRiskCustomers: getUnifiedAtRiskCustomers,
};

export default unifiedCrmApi;
