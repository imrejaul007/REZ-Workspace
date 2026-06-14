/**
 * Invoice Service Adapter
 * Connects to rez-invoice-service (Port 4028)
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const invoiceClient = axios.create({
  baseURL: SERVICE_URLS.INVOICE_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const invoiceService = {
  createInvoice: async (data) => {
    const response = await invoiceClient.post('/api/invoices', data);
    return response.data;
  },

  getInvoices: async (params?) => {
    const response = await invoiceClient.get('/api/invoices', { params });
    return response.data;
  },

  getInvoice: async (invoiceId: string) => {
    const response = await invoiceClient.get(`/api/invoices/${invoiceId}`);
    return response.data;
  },

  updateInvoice: async (invoiceId: string, data) => {
    const response = await invoiceClient.put(`/api/invoices/${invoiceId}`, data);
    return response.data;
  },

  deleteInvoice: async (invoiceId: string) => {
    const response = await invoiceClient.delete(`/api/invoices/${invoiceId}`);
    return response.data;
  },

  sendInvoice: async (invoiceId: string, data: { email: string }) => {
    const response = await invoiceClient.post(`/api/invoices/${invoiceId}/send`, data);
    return response.data;
  },

  recordPayment: async (invoiceId: string, data) => {
    const response = await invoiceClient.post(`/api/invoices/${invoiceId}/payments`, data);
    return response.data;
  },

  voidInvoice: async (invoiceId: string, reason: string) => {
    const response = await invoiceClient.post(`/api/invoices/${invoiceId}/void`, { reason });
    return response.data;
  },

  downloadPDF: async (invoiceId: string) => {
    const response = await invoiceClient.get(`/api/invoices/${invoiceId}/pdf`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  },
};
