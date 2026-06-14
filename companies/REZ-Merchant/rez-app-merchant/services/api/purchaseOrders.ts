/**
 * Purchase Orders API Service
 */

import { Linking } from 'react-native';
import { apiClient } from './client';
import { PaginatedResponse } from './client';

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax?: number;
  total: number;
  expectedDeliveryDate: string;
  notes?: string;
  whatsappMessage?: string;
  sentAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  items: PurchaseOrderItem[];
  expectedDeliveryDate: string;
  notes?: string;
}

export const purchaseOrdersService = {
  async listPurchaseOrders(
    storeId: string,
    params?: { status?: string; page?: number; limit?: number }
  ) {
    return apiClient.get<PaginatedResponse<PurchaseOrder>>('merchant/purchase-orders', {
      params: { storeId, ...params },
    });
  },

  async getPurchaseOrder(poId: string) {
    return apiClient.get<PurchaseOrder>(`merchant/purchase-orders/${poId}`);
  },

  async createPurchaseOrder(storeId: string, payload: CreatePurchaseOrderPayload) {
    return apiClient.post<PurchaseOrder>('merchant/purchase-orders', { storeId, ...payload });
  },

  async updatePurchaseOrder(poId: string, payload) {
    return apiClient.put<PurchaseOrder>(`merchant/purchase-orders/${poId}`, payload);
  },

  async sendToSupplier(poId: string) {
    return apiClient.post<{ success: boolean; message: string }>(
      `merchant/purchase-orders/${poId}/send`,
      {}
    );
  },

  async receiveItem(poId: string, itemId: string, receivedQuantity: number) {
    return apiClient.post<PurchaseOrder>(`merchant/purchase-orders/${poId}/receive-item`, {
      itemId,
      receivedQuantity,
    });
  },

  async receivePurchaseOrder(poId: string) {
    return apiClient.post<PurchaseOrder>(`merchant/purchase-orders/${poId}/receive`, {});
  },

  async deletePurchaseOrder(poId: string) {
    return apiClient.delete(`merchant/purchase-orders/${poId}`);
  },

  async generateWhatsAppMessage(poId: string) {
    return apiClient.get<{ message: string }>(`merchant/purchase-orders/${poId}/whatsapp-message`);
  },

  async openWhatsApp(poId: string): Promise<void> {
    try {
      // apiClient.get already unwraps axios — response is ApiResponse<T>.
      // The inner payload lives at response.data, NOT response.data.data.
      const response = await apiClient.get<{
        message?: string;
        supplierPhone?: string;
        phone?: string;
      }>(`merchant/purchase-orders/${poId}/whatsapp`);
      const payload = response.data || {};
      const message = payload.message;
      const phone = payload.supplierPhone || payload.phone;

      if (phone && message) {
        const url = `whatsapp://send?phone=${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback: web WhatsApp
          const webUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (error) {
      throw new Error('Failed to open WhatsApp');
    }
  },
};

export default purchaseOrdersService;
