/**
 * Procurement Service Adapter
 * Connects to rez-procurement-service (Port 4083)
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const procurementClient = axios.create({
  baseURL: SERVICE_URLS.PROCUREMENT_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const procurementService = {
  // Products
  searchProducts: async (params) => {
    const response = await procurementClient.get('/api/nextabizz/products', { params });
    return response.data;
  },

  getProduct: async (productId: string) => {
    const response = await procurementClient.get(`/api/nextabizz/products/${productId}`);
    return response.data;
  },

  // Orders
  createOrder: async (data) => {
    const response = await procurementClient.post('/api/nextabizz/orders', data);
    return response.data;
  },

  getOrders: async (params?) => {
    const response = await procurementClient.get('/api/nextabizz/orders', { params });
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await procurementClient.get(`/api/nextabizz/orders/${orderId}`);
    return response.data;
  },

  // Quotes
  requestQuote: async (data) => {
    const response = await procurementClient.post('/api/nextabizz/quotes', data);
    return response.data;
  },
};
