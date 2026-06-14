/**
 * QR Ordering Service Client
 * Connects to rez-web-menu for table-side ordering
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

// QR Ordering uses the catalog/menu service and order service
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';

const catalogClient = axios.create({
  baseURL: CATALOG_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

const orderClient = axios.create({
  baseURL: ORDER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const qrOrderingService = {
  /**
   * Get menu for QR table ordering
   */
  async getMenuForTable(restaurantId: string) {
    const response = await catalogClient.get('/api/catalog/menu', {
      params: { restaurantId, active: true },
    });
    return response.data;
  },

  /**
   * Get menu items with dietary filters
   */
  async getMenuItems(restaurantId: string, filters?: {
    category?: string;
    dietary?: string[];
    available?: boolean;
  }) {
    const response = await catalogClient.get('/api/catalog/items', {
      params: { restaurantId, ...filters },
    });
    return response.data;
  },

  /**
   * Search menu items
   */
  async searchItems(restaurantId: string, query: string) {
    const response = await catalogClient.get('/api/catalog/search', {
      params: { restaurantId, q: query },
    });
    return response.data;
  },

  /**
   * Get item details
   */
  async getItemDetails(itemId: string) {
    const response = await catalogClient.get(`/api/catalog/items/${itemId}`);
    return response.data;
  },

  /**
   * Create QR order
   */
  async createOrder(data: {
    restaurantId: string;
    tableId: string;
    customerId?: string;
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
      notes?: string;
      customizations?: unknown[];
    }>;
    source: 'qr-code';
  }) {
    const response = await orderClient.post('/api/orders', {
      ...data,
      type: 'qr-order',
      channel: 'web-menu',
    });
    return response.data;
  },

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string) {
    const response = await orderClient.get(`/api/orders/${orderId}`);
    return response.data;
  },

  /**
   * Get order history for customer
   */
  async getCustomerOrders(customerId: string) {
    const response = await orderClient.get('/api/orders', {
      params: { customerId },
    });
    return response.data;
  },

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string) {
    const response = await orderClient.post(`/api/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};

/**
 * QR Session Management
 * Handles table QR code sessions
 */
export const qrSessionService = {
  /**
   * Create QR session for table
   */
  createSession(data: {
    restaurantId: string;
    tableId: string;
    customerId?: string;
  }) {
    return {
      sessionId: `QR-${data.tableId}-${Date.now()}`,
      restaurantId: data.restaurantId,
      tableId: data.tableId,
      customerId: data.customerId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
  },

  /**
   * Add item to cart (session-based)
   */
  addToCart(cart: unknown[], item) {
    const existingIndex = cart.findIndex(
      (i) => i.itemId === item.itemId &&
        JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity || 1;
    } else {
      cart.push({
        ...item,
        quantity: item.quantity || 1,
      });
    }
    return cart;
  },

  /**
   * Update item quantity
   */
  updateQuantity(cart: unknown[], itemId: string, quantity: number) {
    if (quantity <= 0) {
      return cart.filter((i) => i.itemId !== itemId);
    }
    return cart.map((i) =>
      i.itemId === itemId ? { ...i, quantity } : i
    );
  },

  /**
   * Calculate cart total
   */
  calculateTotal(cart: unknown[]) {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    return {
      items: cart,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      total,
    };
  },
};
