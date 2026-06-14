/**
 * Invoice Service — API calls for GST invoices and related documents
 */

import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from './client';

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  hsn?: string;
  sac?: string;
}

export interface InvoiceData {
  storePaymentId: string;
  invoiceNo: string;
  date: string;
  billNo: string;
  storeName: string;
  storeAddress: string;
  gstin?: string;
  customerPhone?: string;
  items?: InvoiceItem[];
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
  paymentMethod: string;
  upiId?: string;
}

export const invoiceService = {
  async getInvoice(storePaymentId: string) {
    return apiClient.get<InvoiceData>(`/store-payment/${storePaymentId}/invoice`);
  },

  async listInvoices(
    storeId: string,
    params?: { startDate?: string; endDate?: string; page?: number; limit?: number }
  ) {
    return apiClient.get<InvoiceData[]>('/store-payment/invoices', {
      params: { storeId, ...params },
    });
  },

  async downloadInvoicePdf(storePaymentId: string) {
    return apiClient.get(`/store-payment/${storePaymentId}/invoice/pdf`, {
      responseType: 'arraybuffer',
    });
  },

  async sendInvoiceEmail(storePaymentId: string, email: string) {
    return apiClient.post<{ success: boolean; message: string }>(
      `/store-payment/${storePaymentId}/invoice/send-email`,
      { email }
    );
  },

  async sendInvoiceWhatsApp(storePaymentId: string, phone: string) {
    return apiClient.post<{ success: boolean; message: string }>(
      `/store-payment/${storePaymentId}/invoice/send-whatsapp`,
      { phone }
    );
  },
};

export default invoiceService;
