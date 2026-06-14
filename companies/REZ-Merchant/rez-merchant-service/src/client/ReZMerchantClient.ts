/**
 * ReZ Merchant API Client (TypeScript SDK)
 *
 * Type-safe client for the ReZ Merchant B2B API.
 *
 * Usage:
 * ```typescript
 * import { ReZMerchantClient } from './client';
 *
 * const client = new ReZMerchantClient({
 *   baseUrl: 'https://api.rezapp.com',
 *   apiKey: 'your-api-key',
 * });
 *
 * const suppliers = await client.suppliers.list();
 * ```
 */

import { z } from 'zod';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
  merchantId: string;
  timeout?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

// ── Error Classes ─────────────────────────────────────────────────────────────

export class ApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// ── HTTP Client ──────────────────────────────────────────────────────────────

class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string>;
      merchantId?: string;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.apiKey,
    };

    if (options.merchantId) {
      headers['X-Merchant-Id'] = options.merchantId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json() as T | ApiError;

      if (!response.ok || (data && 'success' in data && !data.success)) {
        const error = data as ApiError;
        throw new ApiException(
          error.error?.code || 'UNKNOWN',
          error.error?.message || 'Request failed',
          response.status,
          error.error?.details
        );
      }

      return data as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof ApiException) throw err;
      throw new ApiException('NETWORK', (err as Error).message, 0);
    }
  }

  get<T>(path: string, params?: Record<string, string>, merchantId?: string): Promise<T> {
    return this.request<T>('GET', path, { params, merchantId });
  }

  post<T>(path: string, body?: unknown, merchantId?: string): Promise<T> {
    return this.request<T>('POST', path, { body, merchantId });
  }

  put<T>(path: string, body?: unknown, merchantId?: string): Promise<T> {
    return this.request<T>('PUT', path, { body, merchantId });
  }

  delete<T>(path: string, merchantId?: string): Promise<T> {
    return this.request<T>('DELETE', path, { merchantId });
  }
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const SupplierSchema = z.object({
  _id: z.string(),
  merchantId: z.string(),
  name: z.string(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  creditLimit: z.number(),
  creditUsed: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
  isActive: z.boolean(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

export const PurchaseOrderSchema = z.object({
  _id: z.string(),
  merchantId: z.string(),
  poNumber: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  status: z.enum(['draft', 'pending', 'approved', 'confirmed', 'delivered', 'cancelled']),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'overdue']),
  items: z.array(z.object({
    productName: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    taxRate: z.number().optional(),
    total: z.number(),
  })),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  orderDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const RFQSchema = z.object({
  _id: z.string(),
  merchantId: z.string(),
  rfqNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['raw_materials', 'equipment', 'services', 'packaging', 'logistics', 'other']),
  items: z.array(z.object({
    itemName: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })),
  status: z.enum(['draft', 'open', 'closed', 'cancelled']),
  requiredByDate: z.string().optional(),
  quotesReceived: z.number(),
  createdAt: z.string(),
});

export type RFQ = z.infer<typeof RFQSchema>;

export const WebhookSchema = z.object({
  _id: z.string(),
  merchantId: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// ── API Client ────────────────────────────────────────────────────────────────

export class ReZMerchantClient {
  private http: HttpClient;
  private merchantId: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.merchantId = config.merchantId;
  }

  // ── Suppliers ──────────────────────────────────────────────────────────────

  async suppliers = {
    list: async (params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<Supplier[]>> => {
      return this.http.get('/api/v1/merchant/suppliers', params as Record<string, string>, this.merchantId);
    },

    get: async (id: string): Promise<ApiResponse<Supplier>> => {
      return this.http.get(`/api/v1/merchant/suppliers/${id}`, undefined, this.merchantId);
    },

    create: async (data: Omit<Supplier, '_id' | 'merchantId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> => {
      return this.http.post('/api/v1/merchant/suppliers', data, this.merchantId);
    },

    update: async (id: string, data: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
      return this.http.put(`/api/v1/merchant/suppliers/${id}`, data, this.merchantId);
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.http.delete(`/api/v1/merchant/suppliers/${id}`, this.merchantId);
    },
  };

  // ── Purchase Orders ────────────────────────────────────────────────────────

  async purchaseOrders = {
    list: async (params?: { page?: number; limit?: number; status?: string; supplierId?: string }): Promise<ApiResponse<PurchaseOrder[]>> => {
      return this.http.get('/api/v1/merchant/purchase-orders', params as Record<string, string>, this.merchantId);
    },

    get: async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
      return this.http.get(`/api/v1/merchant/purchase-orders/${id}`, undefined, this.merchantId);
    },

    create: async (data: {
      supplierId: string;
      items: Array<{ name: string; quantity: number; unitPrice: number; taxRate?: number }>;
      dueDate: string;
      notes?: string;
    }): Promise<ApiResponse<PurchaseOrder>> => {
      return this.http.post('/api/v1/merchant/purchase-orders', data, this.merchantId);
    },

    approve: async (id: string, approverId: string): Promise<ApiResponse<PurchaseOrder>> => {
      return this.http.post(`/api/v1/merchant/purchase-orders/${id}/approve`, { approverId }, this.merchantId);
    },

    reject: async (id: string, reason: string): Promise<ApiResponse<PurchaseOrder>> => {
      return this.http.post(`/api/v1/merchant/purchase-orders/${id}/reject`, { reason }, this.merchantId);
    },
  };

  // ── RFQs ──────────────────────────────────────────────────────────────────

  async rfqs = {
    list: async (params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<RFQ[]>> => {
      return this.http.get('/api/v1/merchant/rfqs', params as Record<string, string>, this.merchantId);
    },

    get: async (id: string): Promise<ApiResponse<RFQ>> => {
      return this.http.get(`/api/v1/merchant/rfqs/${id}`, undefined, this.merchantId);
    },

    create: async (data: {
      title: string;
      category: string;
      items: Array<{ itemName: string; quantity: number; unit: string }>;
      requiredByDate?: string;
    }): Promise<ApiResponse<RFQ>> => {
      return this.http.post('/api/v1/merchant/rfqs', data, this.merchantId);
    },

    open: async (id: string): Promise<ApiResponse<RFQ>> => {
      return this.http.post(`/api/v1/merchant/rfqs/${id}/open`, undefined, this.merchantId);
    },

    close: async (id: string): Promise<ApiResponse<RFQ>> => {
      return this.http.post(`/api/v1/merchant/rfqs/${id}/close`, undefined, this.merchantId);
    },
  };

  // ── Webhooks ───────────────────────────────────────────────────────────────

  async webhooks = {
    list: async (): Promise<ApiResponse<Webhook[]>> => {
      return this.http.get('/api/v1/merchant/webhooks', undefined, this.merchantId);
    },

    create: async (data: { url: string; events: string[]; description?: string }): Promise<ApiResponse<Webhook & { secret: string }>> => {
      return this.http.post('/api/v1/merchant/webhooks', data, this.merchantId);
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.http.delete(`/api/v1/merchant/webhooks/${id}`, this.merchantId);
    },

    test: async (id: string): Promise<ApiResponse<{ delivered: boolean; statusCode: number }>> => {
      return this.http.post('/api/v1/merchant/webhooks/test', { webhookId: id }, this.merchantId);
    },
  };

  // ── Forecasting ───────────────────────────────────────────────────────────

  async forecasting = {
    cashFlow: async (days?: number): Promise<ApiResponse<unknown>> => {
      const params = days ? { days: String(days) } : undefined;
      return this.http.get('/api/v1/merchant/forecasting/cash-flow', params, this.merchantId);
    },

    aging: async (supplierId?: string): Promise<ApiResponse<unknown>> => {
      const params = supplierId ? { supplierId } : undefined;
      return this.http.get('/api/v1/merchant/forecasting/aging', params, this.merchantId);
    },

    dashboard: async (): Promise<ApiResponse<unknown>> => {
      return this.http.get('/api/v1/merchant/forecasting/dashboard', undefined, this.merchantId);
    },
  };

  // ── Exports ───────────────────────────────────────────────────────────────

  async exports = {
    suppliers: async (format: 'csv' | 'json' = 'csv'): Promise<Response> => {
      return fetch(`${this.http['baseUrl']}/api/v1/merchant/exports/suppliers?format=${format}`, {
        headers: { 'X-Internal-Token': this.http['apiKey'], 'X-Merchant-Id': this.merchantId },
      });
    },

    purchaseOrders: async (format: 'csv' | 'json' = 'csv', params?: Record<string, string>): Promise<Response> => {
      const query = new URLSearchParams({ format, ...params });
      return fetch(`${this.http['baseUrl']}/api/v1/merchant/exports/purchase-orders?${query}`, {
        headers: { 'X-Internal-Token': this.http['apiKey'], 'X-Merchant-Id': this.merchantId },
      });
    },

    agingReport: async (format: 'csv' | 'json' = 'csv'): Promise<Response> => {
      return fetch(`${this.http['baseUrl']}/api/v1/merchant/exports/aging-report?format=${format}`, {
        headers: { 'X-Internal-Token': this.http['apiKey'], 'X-Merchant-Id': this.merchantId },
      });
    },
  };
}

// ── Export Types ──────────────────────────────────────────────────────────────

export type { Supplier, PurchaseOrder, RFQ, Webhook };
