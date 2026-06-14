// ── ReZ Merchant Chat Service ──────────────────────────────────────────────────────
// Merchant-specific chat actions for store management

import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

// Platform types for merchant app
export type ReZPlatform = 'merchant' | 'store';

const MERCHANT_NAMESPACE = '/ai/merchant';

export interface MerchantChatContext {
  merchantId: string;
  storeId: string;
  staffId: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface MerchantAction {
  type:
    | 'view_orders'
    | 'view_inventory'
    | 'view_customers'
    | 'view_analytics'
    | 'chat_customer'
    | 'manage_staff'
    | 'view_reports';
  payload?: Record<string, unknown>;
}

// ── Merchant Chat Service ──────────────────────────────────────────────────────

class MerchantChatService {
  private socket: Socket | null = null;
  private context: MerchantChatContext | null = null;

  connect(serverUrl: string, context: MerchantChatContext): void {
    this.context = context;

    this.socket = io(`${serverUrl}${MERCHANT_NAMESPACE}`, {
      auth: {
        merchantId: context.merchantId,
        storeId: context.storeId,
        staffId: context.staffId,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      logger.info('Merchant chat connected', { merchantId: context.merchantId });
    });

    this.socket.on('customer_message', (message) => {
      this.handleCustomerMessage(message);
    });

    this.socket.on('new_order', (order) => {
      this.handleNewOrder(order);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ── Merchant Actions ──────────────────────────────────────────────────────

  async executeAction(
    action: MerchantAction
  ): Promise<{ success: boolean; data?: unknown; message: string }> {
    if (!this.socket?.connected) {
      return { success: false, message: 'Not connected to chat server' };
    }

    return new Promise((resolve) => {
      this.socket!.emit(
        'merchant_action',
        {
          action: action.type,
          payload: action.payload,
          context: this.context,
        },
        (response: { success: boolean; data?: unknown; message: string }) => {
          resolve(response);
        }
      );
    });
  }

  // ── Quick Actions ──────────────────────────────────────────────────────

  async viewOrders(filter?: {
    status?: string;
    date?: string;
  }): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'view_orders', payload: filter });
  }

  async viewInventory(
    category?: string
  ): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'view_inventory', payload: { category } });
  }

  async viewCustomers(filter?: {
    recent?: boolean;
    tier?: string;
  }): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'view_customers', payload: filter });
  }

  async viewAnalytics(
    period?: 'today' | 'week' | 'month'
  ): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'view_analytics', payload: { period } });
  }

  async chatWithCustomer(
    customerId: string
  ): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'chat_customer', payload: { customerId } });
  }

  async manageStaff(
    action: 'list' | 'add' | 'remove',
    staffData?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown; message: string }> {
    return this.executeAction({ type: 'manage_staff', payload: { action, ...staffData } });
  }

  // ── Event Handlers ──────────────────────────────────────────────────────

  private handleCustomerMessage(message: {
    customerId: string;
    content: string;
    timestamp: string;
  }): void {
    logger.info('Customer message received', { customerId: message.customerId });
    // Emit to UI for notification
  }

  private handleNewOrder(order: { orderId: string; items: unknown[]; total: number }): void {
    logger.info('New order received', { orderId: order.orderId });
    // Emit to UI for notification
  }

  // ── Send Message to Customer ──────────────────────────────────────────────

  sendMessageToCustomer(customerId: string, message: string): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot send message: not connected');
      return;
    }

    this.socket.emit('send_to_customer', {
      customerId,
      message,
      merchantId: this.context?.merchantId,
      timestamp: new Date().toISOString(),
    });
  }
}

export const merchantChatService = new MerchantChatService();
export default merchantChatService;
