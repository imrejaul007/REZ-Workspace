/**
 * POS Service Adapter
 * Connects to rez-pos-service (Port 4081)
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const posClient = axios.create({
  baseURL: SERVICE_URLS.POS_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const posService = {
  // Orders
  createOrder: async (data) => {
    const response = await posClient.post('/api/pos/orders', data);
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await posClient.get(`/api/pos/orders/${orderId}`);
    return response.data;
  },

  getActiveOrders: async () => {
    const response = await posClient.get('/api/pos/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await posClient.put(`/api/pos/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Items
  addItem: async (orderId: string, item) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/items`, item);
    return response.data;
  },

  updateItem: async (orderId: string, itemId: string, data) => {
    const response = await posClient.put(`/api/pos/orders/${orderId}/items/${itemId}`, data);
    return response.data;
  },

  removeItem: async (orderId: string, itemId: string) => {
    const response = await posClient.delete(`/api/pos/orders/${orderId}/items/${itemId}`);
    return response.data;
  },

  // Billing
  getBill: async (orderId: string) => {
    const response = await posClient.get(`/api/pos/orders/${orderId}/bill`);
    return response.data;
  },

  splitBill: async (orderId: string, splitType: string) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/split`, { splitType });
    return response.data;
  },

  // Payments
  processPayment: async (orderId: string, paymentData) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/payment`, paymentData);
    return response.data;
  },

  refundPayment: async (orderId: string, refundData) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/refund`, refundData);
    return response.data;
  },

  // Tips
  getTipSuggestions: async (orderId: string) => {
    const response = await posClient.get(`/api/pos/orders/${orderId}/tips`);
    return response.data;
  },

  // Discounts
  applyDiscount: async (orderId: string, discount) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/discount`, discount);
    return response.data;
  },

  removeDiscount: async (orderId: string) => {
    const response = await posClient.delete(`/api/pos/orders/${orderId}/discount`);
    return response.data;
  },

  // Receipt
  printReceipt: async (orderId: string) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/receipt`);
    return response.data;
  },

  // Void
  voidOrder: async (orderId: string, reason: string) => {
    const response = await posClient.post(`/api/pos/orders/${orderId}/void`, { reason });
    return response.data;
  },

  // Menu
  getMenu: async () => {
    const response = await posClient.get('/api/pos/menu');
    return response.data;
  },

  getMenuItem: async (itemId: string) => {
    const response = await posClient.get(`/api/pos/menu/${itemId}`);
    return response.data;
  },

  // Statistics
  getStats: async () => {
    const response = await posClient.get('/api/pos/stats');
    return response.data;
  },

  getRevenue: async (period?: string) => {
    const response = await posClient.get('/api/pos/revenue', { params: { period } });
    return response.data;
  },
};
