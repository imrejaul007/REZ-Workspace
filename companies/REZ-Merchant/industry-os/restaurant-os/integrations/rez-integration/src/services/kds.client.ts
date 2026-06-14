/**
 * KDS Service Adapter
 * Connects to rez-kds-service (Port 4006)
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const kdsClient = axios.create({
  baseURL: SERVICE_URLS.KDS_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const kdsService = {
  // Orders
  createOrder: async (data) => {
    const response = await kdsClient.post('/api/orders', data);
    return response.data;
  },

  getOrders: async () => {
    const response = await kdsClient.get('/api/orders');
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await kdsClient.get(`/api/orders/${orderId}`);
    return response.data;
  },

  bumpOrder: async (orderId: string) => {
    const response = await kdsClient.post(`/api/orders/${orderId}/bump`);
    return response.data;
  },

  completeOrder: async (orderId: string) => {
    const response = await kdsClient.post(`/api/orders/${orderId}/complete`);
    return response.data;
  },

  completeItem: async (orderId: string, itemId: string) => {
    const response = await kdsClient.post(`/api/orders/${orderId}/items/${itemId}/complete`);
    return response.data;
  },

  updatePriority: async (orderId: string, priority: string) => {
    const response = await kdsClient.patch(`/api/orders/${orderId}/priority`, { priority });
    return response.data;
  },

  recallOrder: async (orderId: string) => {
    const response = await kdsClient.post(`/api/orders/${orderId}/recall`);
    return response.data;
  },

  getOrderHistory: async () => {
    const response = await kdsClient.get('/api/orders/history/list');
    return response.data;
  },

  // Stations
  getStations: async () => {
    const response = await kdsClient.get('/api/stations');
    return response.data;
  },

  getStation: async (stationId: string) => {
    const response = await kdsClient.get(`/api/stations/${stationId}`);
    return response.data;
  },

  getStationLoad: async (stationType: string) => {
    const response = await kdsClient.get(`/api/stations/${stationType}/load`);
    return response.data;
  },

  updateStationConfig: async (stationId: string, config) => {
    const response = await kdsClient.patch(`/api/stations/${stationId}/config`, config);
    return response.data;
  },

  // Metrics
  getMetrics: async () => {
    const response = await kdsClient.get('/metrics');
    return response.data;
  },
};
