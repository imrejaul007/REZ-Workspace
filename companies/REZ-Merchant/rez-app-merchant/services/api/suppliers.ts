/**
 * Suppliers API Service
 */

import { apiClient } from './client';

export interface Supplier {
  id: string;
  businessName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  gstin?: string;
  paymentTerms?: 'immediate' | 'net_7' | 'net_15' | 'net_30';
  notes?: string;
  productsCount: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  businessName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  gstin?: string;
  paymentTerms?: 'immediate' | 'net_7' | 'net_15' | 'net_30';
  notes?: string;
}

export const suppliersService = {
  // AC2-M5 FIX: Uses getPaginated<T>() helper instead of get<PaginatedResponse<T>>()
  // so the shared helper is exercised and dead-code lint is eliminated.
  async listSuppliers(
    storeId: string,
    params?: { search?: string; page?: number; limit?: number }
  ) {
    const qs = new URLSearchParams({
      storeId,
      ...(params?.search !== undefined && { search: params.search }),
      ...(params?.page !== undefined && { page: String(params.page) }),
      ...(params?.limit !== undefined && { limit: String(params.limit) }),
    } as Record<string, string>).toString();
    return apiClient.getPaginated<Supplier>(`merchant/suppliers?${qs}`);
  },

  async getSupplier(supplierId: string) {
    return apiClient.get<Supplier>(`merchant/suppliers/${supplierId}`);
  },

  async createSupplier(payload: CreateSupplierPayload) {
    return apiClient.post<Supplier>('merchant/suppliers', payload);
  },

  async updateSupplier(supplierId: string, payload: Partial<CreateSupplierPayload>) {
    return apiClient.put<Supplier>(`merchant/suppliers/${supplierId}`, payload);
  },

  async deleteSupplier(supplierId: string) {
    return apiClient.delete(`merchant/suppliers/${supplierId}`);
  },

  // AC2-M5 FIX: Uses getPaginated<T>() helper for supplier products pagination.
  async getSupplierProducts(supplierId: string, params?: { page?: number; limit?: number }) {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiClient.getPaginated<unknown>(
      `merchant/suppliers/${supplierId}/products${qs ? `?${qs}` : ''}`
    );
  },

  async searchSuppliers(storeId: string, query: string) {
    return apiClient.get<Supplier[]>('/suppliers/search', { params: { storeId, q: query } });
  },
};

export default suppliersService;
