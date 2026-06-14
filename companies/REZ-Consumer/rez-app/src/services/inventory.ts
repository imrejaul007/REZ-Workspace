// @ts-nocheck
// Connect to inventory service
// Handles product availability and stock management

import axios from 'axios';
import merchantApi from './api';

const INVENTORY_URL = process.env.EXPO_PUBLIC_INVENTORY_URL || 'http://localhost:4021/api';

export const inventoryService = {
  baseUrl: INVENTORY_URL,

  // Get product availability by SKU
  async getProduct(productId: string) {
    const res = await axios.get(`${this.baseUrl}/inventory/sku/${productId}`);
    return res.data;
  },

  // Check stock for a SKU
  async checkStock(sku: string) {
    const res = await axios.get(`${this.baseUrl}/inventory/stock/${sku}`);
    return res.data;
  },

  // Track product view for analytics
  async trackView(productId: string) {
    try {
      await axios.post(`${merchantApi.products}/view`, { productId });
    } catch {
      // Non-blocking analytics
    }
  },

  // Reserve stock for checkout
  async reserveStock(sku: string, quantity: number, sessionId: string) {
    const res = await axios.post(`${this.baseUrl}/inventory/reserve`, {
      sku,
      quantity,
      sessionId,
    });
    return res.data;
  },

  // Release reserved stock
  async releaseStock(reservationId: string) {
    try {
      await axios.delete(`${this.baseUrl}/inventory/reserve/${reservationId}`);
    } catch {
      // Non-blocking
    }
  },

  // Get low stock alerts
  async getLowStockAlerts(merchantId: string) {
    const res = await axios.get(`${this.baseUrl}/inventory/alerts/${merchantId}`);
    return res.data;
  },
};

export default inventoryService;
