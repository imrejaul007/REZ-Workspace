/**
 * REZ NOW - Customer Analytics API
 *
 * Provides customer data for the merchant CRM.
 *
 * Priority:
 * 1. Try Unified CRM Merchant API (Port 4101)
 * 2. Fall back to local mock data
 *
 * IMPORTANT: This file serves merchant-facing data only.
 * No internal intelligence data (AI predictions, engagement scores) should be exposed.
 */

import { authClient } from './client';
import { unifiedCrmApi } from './unifiedCrmApi';
import type {
  CustomerSegments,
  CustomerSummary,
  CustomerDetail,
  AtRiskCustomer,
  CustomerSegmentType,
} from '@/lib/types';

// ─── Mock data (fallback when unified API unavailable) ─────────────────────────

const MOCK_CUSTOMERS: CustomerSummary[] = [
  {
    customerId: 'cust_001',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    visitCount: 12,
    totalSpent: 45800,
    lastVisit: new Date(Date.now() - 1 * 86400000).toISOString(),
    avgOrderValue: 3817,
  },
  {
    customerId: 'cust_002',
    name: 'Priya Patel',
    phone: '+91 87654 32109',
    visitCount: 8,
    totalSpent: 31200,
    lastVisit: new Date(Date.now() - 3 * 86400000).toISOString(),
    avgOrderValue: 3900,
  },
  {
    customerId: 'cust_003',
    name: 'Amit Kumar',
    phone: '+91 76543 21098',
    visitCount: 5,
    totalSpent: 18500,
    lastVisit: new Date(Date.now() - 2 * 86400000).toISOString(),
    avgOrderValue: 3700,
  },
  {
    customerId: 'cust_004',
    name: 'Sneha Reddy',
    phone: '+91 65432 10987',
    visitCount: 18,
    totalSpent: 72000,
    lastVisit: new Date(Date.now() - 0 * 86400000).toISOString(),
    avgOrderValue: 4000,
  },
  {
    customerId: 'cust_005',
    name: 'Vikram Singh',
    phone: '+91 54321 09876',
    visitCount: 3,
    totalSpent: 9600,
    lastVisit: new Date(Date.now() - 4 * 86400000).toISOString(),
    avgOrderValue: 3200,
  },
  {
    customerId: 'cust_006',
    name: 'Ananya Gupta',
    phone: '+91 43210 98765',
    visitCount: 22,
    totalSpent: 98000,
    lastVisit: new Date(Date.now() - 1 * 86400000).toISOString(),
    avgOrderValue: 4455,
  },
  {
    customerId: 'cust_007',
    name: 'Ravi Verma',
    phone: '+91 32109 87654',
    visitCount: 15,
    totalSpent: 54000,
    lastVisit: new Date(Date.now() - 5 * 86400000).toISOString(),
    avgOrderValue: 3600,
  },
];

function assignSegment(customer: CustomerSummary, daysSince: number): CustomerSegmentType {
  if (customer.visitCount >= 10 && customer.totalSpent >= 50000) return 'vip';
  if (daysSince >= 14) return 'at_risk';
  if (customer.visitCount === 1) return 'new';
  return 'repeat';
}

const MOCK_AT_RISK: AtRiskCustomer[] = [
  {
    customerId: 'ar_001',
    name: 'Sunil Agarwal',
    phone: '+91 11223 34455',
    visitCount: 4,
    totalSpent: 14000,
    lastVisit: new Date(Date.now() - 18 * 86400000).toISOString(),
    avgOrderValue: 3500,
    daysSinceLastVisit: 18,
  },
  {
    customerId: 'ar_002',
    name: 'Pooja Desai',
    phone: '+91 22334 45566',
    visitCount: 6,
    totalSpent: 21000,
    lastVisit: new Date(Date.now() - 21 * 86400000).toISOString(),
    avgOrderValue: 3500,
    daysSinceLastVisit: 21,
  },
  {
    customerId: 'ar_003',
    name: 'Arun Bhat',
    phone: '+91 33445 56677',
    visitCount: 3,
    totalSpent: 9600,
    lastVisit: new Date(Date.now() - 15 * 86400000).toISOString(),
    avgOrderValue: 3200,
    daysSinceLastVisit: 15,
  },
  {
    customerId: 'ar_004',
    name: 'Lakshmi Menon',
    phone: '+91 44556 67788',
    visitCount: 2,
    totalSpent: 5600,
    lastVisit: new Date(Date.now() - 30 * 86400000).toISOString(),
    avgOrderValue: 2800,
    daysSinceLastVisit: 30,
  },
  {
    customerId: 'ar_005',
    name: 'Nikhil Rao',
    phone: '+91 55667 78899',
    visitCount: 5,
    totalSpent: 17500,
    lastVisit: new Date(Date.now() - 16 * 86400000).toISOString(),
    avgOrderValue: 3500,
    daysSinceLastVisit: 16,
  },
];

// ─── Real API calls ──────────────────────────────────────────────────────────────

async function fetchFromAPI<T>(path: string): Promise<T> {
  const { data } = await authClient.get(path);
  if (!data.success) throw new Error(data.message || 'Failed to fetch data');
  return data.data as T;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Get customer segment breakdown for a store.
 * Uses Unified CRM API when available, falls back to local data.
 */
export async function getCustomerSegments(storeSlug: string): Promise<CustomerSegments> {
  // Try Unified CRM first
  const unifiedSegments = await unifiedCrmApi.getCustomerSegments(storeSlug);
  if (unifiedSegments) {
    return unifiedSegments;
  }

  // Fall back to local data
  const byType: Record<CustomerSegmentType, CustomerSummary[]> = {
    new: [],
    repeat: [],
    at_risk: [],
    vip: [],
  };

  MOCK_CUSTOMERS.forEach((c) => {
    const daysSince = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
    const seg = assignSegment(c, daysSince);
    byType[seg].push(c);
  });

  const mkSeg = (type: CustomerSegmentType, customers: CustomerSummary[]) => ({
    type,
    count: customers.length,
    avgOrderValue:
      customers.length > 0
        ? Math.round(customers.reduce((s, c) => s + c.avgOrderValue, 0) / customers.length)
        : 0,
    totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  });

  return {
    segments: [
      mkSeg('new', byType.new),
      mkSeg('repeat', byType.repeat),
      mkSeg('at_risk', byType.at_risk),
      mkSeg('vip', byType.vip),
    ],
    totalCustomers: MOCK_CUSTOMERS.length,
  };
}

/**
 * Get recent customers for a store.
 * Uses Unified CRM API when available.
 */
export async function getRecentCustomers(
  storeSlug: string,
  pageSize = 10
): Promise<CustomerSummary[]> {
  // Try Unified CRM first
  const unifiedCustomers = await unifiedCrmApi.getCustomers(storeSlug, { limit: pageSize });
  if (unifiedCustomers) {
    return unifiedCustomers;
  }

  // Fall back to local data
  const sorted = [...MOCK_CUSTOMERS].sort(
    (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  );
  return sorted.slice(0, pageSize);
}

/**
 * Search customers by name or phone.
 * Uses Unified CRM API when available.
 */
export async function searchCustomers(
  storeSlug: string,
  query: string
): Promise<CustomerSummary[]> {
  // Try Unified CRM first
  const unifiedCustomers = await unifiedCrmApi.getCustomers(storeSlug, { search: query });
  if (unifiedCustomers) {
    return unifiedCustomers;
  }

  // Fall back to local data
  const q = query.toLowerCase();
  return MOCK_CUSTOMERS.filter(
    (c) =>
      c.name?.toLowerCase().includes(q) || c.phone.includes(query)
  );
}

/**
 * Get at-risk customers (haven't visited in 14+ days).
 * Uses Unified CRM API when available.
 */
export async function getAtRiskCustomers(storeSlug: string): Promise<AtRiskCustomer[]> {
  // Try Unified CRM first
  const unifiedAtRisk = await unifiedCrmApi.getAtRiskCustomers(storeSlug);
  if (unifiedAtRisk) {
    return unifiedAtRisk;
  }

  // Fall back to local data
  return MOCK_AT_RISK;
}

/**
 * Get customer detail by ID.
 * Uses Unified CRM API when available.
 */
export async function getCustomerById(
  storeSlug: string,
  customerId: string
): Promise<CustomerDetail | null> {
  // Try Unified CRM first
  const unifiedDetail = await unifiedCrmApi.getCustomerDetail(storeSlug, customerId);
  if (unifiedDetail) {
    return unifiedDetail;
  }

  // Fall back to local data
  const customer = MOCK_CUSTOMERS.find((c) => c.customerId === customerId);
  if (!customer) return null;

  const daysSince = Math.floor(
    (Date.now() - new Date(customer.lastVisit).getTime()) / 86400000
  );
  const segment = assignSegment(customer, daysSince);

  return {
    customerId: customer.customerId,
    name: customer.name,
    phone: customer.phone,
    segment,
    visitCount: customer.visitCount,
    totalSpent: customer.totalSpent,
    avgOrderValue: customer.avgOrderValue,
    lastVisit: customer.lastVisit,
    firstVisit: new Date(Date.now() - 180 * 86400000).toISOString(),
    orders: [],
  };
}

/**
 * Get all customers (paginated).
 * Uses Unified CRM API when available.
 */
export async function getAllCustomers(
  storeSlug: string,
  page = 1,
  limit = 20
): Promise<{ customers: CustomerSummary[]; total: number }> {
  // Try Unified CRM first
  const unifiedCustomers = await unifiedCrmApi.getCustomers(storeSlug, { page, limit });
  if (unifiedCustomers) {
    return { customers: unifiedCustomers, total: unifiedCustomers.length };
  }

  // Fall back to local data
  const start = (page - 1) * limit;
  const sorted = [...MOCK_CUSTOMERS].sort(
    (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  );

  return {
    customers: sorted.slice(start, start + limit),
    total: MOCK_CUSTOMERS.length,
  };
}

// ─── Export ────────────────────────────────────────────────────────────────

export {
  // Mock data exports for testing
  MOCK_CUSTOMERS,
  MOCK_AT_RISK,
};
