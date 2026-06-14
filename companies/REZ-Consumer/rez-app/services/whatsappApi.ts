/**
 * WHATSAPP COMMERCE API SERVICE
 * Integration with WhatsApp Commerce Service
 *
 * Service: reks-whatsapp-commerce
 * URL: https://reks-whatsapp-commerce.onrender.com
 *
 * Features:
 * - WhatsApp shopping
 * - Cart management via WhatsApp
 * - Order placement
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface WhatsAppCart {
  id: string;
  userId: string;
  phone: string;
  items: WhatsAppCartItem[];
  total: number;
}

export interface WhatsAppCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface WhatsAppOrder {
  id: string;
  userId: string;
  items: WhatsAppCartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
}

/**
 * Get WhatsApp cart
 */
export async function getWhatsAppCart(userId: string): Promise<ApiResponse<WhatsAppCart>> {
  try {
    return await apiClient.get(`/whatsapp/cart/${userId}`);
  } catch (error) {
    logger.error('whatsappApi.getCart', { userId, error });
    throw error;
  }
}

/**
 * Add item to WhatsApp cart
 */
export async function addToWhatsAppCart(userId: string, item: WhatsAppCartItem): Promise<ApiResponse<WhatsAppCart>> {
  try {
    return await apiClient.post(`/whatsapp/cart/${userId}/items`, item);
  } catch (error) {
    logger.error('whatsappApi.addToCart', { userId, item, error });
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateWhatsAppCartItem(userId: string, productId: string, quantity: number): Promise<ApiResponse<WhatsAppCart>> {
  try {
    return await apiClient.patch(`/whatsapp/cart/${userId}/items/${productId}`, { quantity });
  } catch (error) {
    logger.error('whatsappApi.updateCartItem', { userId, productId, quantity, error });
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromWhatsAppCart(userId: string, productId: string): Promise<ApiResponse<WhatsAppCart>> {
  try {
    return await apiClient.delete(`/whatsapp/cart/${userId}/items/${productId}`);
  } catch (error) {
    logger.error('whatsappApi.removeFromCart', { userId, productId, error });
    throw error;
  }
}

/**
 * Place order via WhatsApp
 */
export async function placeWhatsAppOrder(userId: string, addressId: string, paymentMethodId?: string): Promise<ApiResponse<WhatsAppOrder>> {
  try {
    return await apiClient.post(`/whatsapp/orders`, { userId, addressId, paymentMethodId });
  } catch (error) {
    logger.error('whatsappApi.placeOrder', { userId, error });
    throw error;
  }
}

/**
 * Get WhatsApp orders
 */
export async function getWhatsAppOrders(userId: string): Promise<ApiResponse<WhatsAppOrder[]>> {
  try {
    return await apiClient.get(`/whatsapp/orders/${userId}`);
  } catch (error) {
    logger.error('whatsappApi.getOrders', { userId, error });
    throw error;
  }
}

/**
 * Get order status
 */
export async function getWhatsAppOrderStatus(orderId: string): Promise<ApiResponse<WhatsAppOrder>> {
  try {
    return await apiClient.get(`/whatsapp/orders/status/${orderId}`);
  } catch (error) {
    logger.error('whatsappApi.getOrderStatus', { orderId, error });
    throw error;
  }
}

/**
 * Send message via WhatsApp
 */
export async function sendWhatsAppMessage(userId: string, message: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/whatsapp/messages`, { userId, message });
  } catch (error) {
    logger.error('whatsappApi.sendMessage', { userId, error });
    throw error;
  }
}

export default {
  getWhatsAppCart,
  addToWhatsAppCart,
  updateWhatsAppCartItem,
  removeFromWhatsAppCart,
  placeWhatsAppOrder,
  getWhatsAppOrders,
  getWhatsAppOrderStatus,
  sendWhatsAppMessage,
};
