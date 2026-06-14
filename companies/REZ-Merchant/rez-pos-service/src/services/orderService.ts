import {
  Order,
  OrderStatus,
  CreateOrderRequest,
  AddItemRequest,
  ApplyDiscountRequest,
  SplitBillRequest,
  ProcessPaymentRequest,
  VoidOrderRequest,
  RefundRequest,
  Discount,
  MenuItem,
  Receipt,
  BillCalculation
} from '../types';
import { orderModel } from '../models/Order';
import { billingService, BillCalculation as BilledCalculation } from './billingService';

export interface OrderCreationResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface OrderItemResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
  change?: number;
  order?: Order;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundAmount?: number;
  remainingBalance?: number;
  order?: Order;
  error?: string;
}

export interface ReceiptResult {
  success: boolean;
  receipt?: Receipt;
  error?: string;
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<OrderCreationResult> {
    try {
      const order = orderModel.createOrder(request);
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    return orderModel.getOrder(orderId) || null;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return orderModel.getOrderByNumber(orderNumber) || null;
  }

  /**
   * Get all active orders (not voided)
   */
  async getActiveOrders(): Promise<Order[]> {
    return orderModel.getAllOrders().filter(o => o.status !== 'voided');
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return orderModel.getOrdersByStatus(status);
  }

  /**
   * Add item to order
   */
  async addItem(orderId: string, request: AddItemRequest): Promise<OrderItemResult> {
    try {
      const order = orderModel.addItemToOrder(orderId, request);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(orderId: string, itemId: string, quantity: number): Promise<OrderItemResult> {
    try {
      const order = orderModel.updateItemQuantity(orderId, itemId, quantity);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Remove item from order
   */
  async removeItem(orderId: string, itemId: string): Promise<OrderItemResult> {
    try {
      const order = orderModel.removeItemFromOrder(orderId, itemId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderItemResult> {
    try {
      const order = orderModel.updateOrderStatus(orderId, status);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Apply discount to order
   */
  async applyDiscount(orderId: string, request: ApplyDiscountRequest): Promise<OrderItemResult> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const discount: Discount = {
        id: request.discountCode || `DISC-${Date.now()}`,
        code: request.discountCode,
        type: request.discountType,
        value: request.value,
        description: request.description,
        minOrderAmount: request.minOrderAmount,
        maxDiscount: request.maxDiscount,
        applicableItems: request.applicableItems,
        createdAt: new Date()
      };

      const result = orderModel.applyDiscount(orderId, discount);
      if (!result) {
        return { success: false, error: 'Failed to apply discount' };
      }

      return { success: true, order: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Remove discount from order
   */
  async removeDiscount(orderId: string): Promise<OrderItemResult> {
    try {
      const order = orderModel.removeDiscount(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Split bill for an order
   */
  async splitBill(orderId: string, request: SplitBillRequest): Promise<{ success: boolean; splits?: any[]; perPersonAmount?: number; error?: string }> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Validate split request
      billingService.validateSplitRequest(request, order);

      let result;
      switch (request.type) {
        case 'equal':
          result = billingService.splitBillEqual(order, request.splitCount!);
          break;
        case 'byItem':
          const itemAssignments = request.itemIds!.map((itemId, index) => ({
            splitIndex: index % (request.splitCount || request.itemIds!.length),
            itemId
          }));
          result = billingService.splitBillByItems(order, itemAssignments);
          break;
        case 'byAmount':
          result = billingService.splitBillByAmount(order, request.amounts!);
          break;
        default:
          return { success: false, error: 'Invalid split type' };
      }

      // Save splits to order
      orderModel.splitBill(orderId, result.splits);

      return {
        success: true,
        splits: result.splits,
        perPersonAmount: result.perPersonAmount
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Process payment for an order
   */
  async processPayment(orderId: string, request: ProcessPaymentRequest): Promise<PaymentResult> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status === 'voided') {
        return { success: false, error: 'Cannot process payment for voided order' };
      }

      // Calculate change for cash payments
      let change = 0;
      if (request.method === 'cash' && request.amount > 0) {
        const changeResult = billingService.calculateChange(order, request.amount, request.tip);
        change = changeResult.change;
      }

      // Process the payment
      const payment = billingService.processPayment(order, request);

      // Add payment to order
      const updatedOrder = orderModel.addPayment(orderId, payment);
      if (!updatedOrder) {
        return { success: false, error: 'Failed to add payment' };
      }

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status
        },
        change,
        order: updatedOrder
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Refund payment for an order
   */
  async refundPayment(orderId: string, request: RefundRequest): Promise<RefundResult> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const payment = order.payments.find(p => p.id === request.paymentId);
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status === 'refunded') {
        return { success: false, error: 'Payment has already been fully refunded' };
      }

      if (request.amount <= 0) {
        return { success: false, error: 'Refund amount must be greater than zero' };
      }

      if (request.amount > payment.amount) {
        return { success: false, error: 'Refund amount exceeds payment amount' };
      }

      const updatedOrder = orderModel.processRefund(orderId, request.paymentId, request.amount);
      if (!updatedOrder) {
        return { success: false, error: 'Failed to process refund' };
      }

      const bill = billingService.calculateBill(updatedOrder);

      return {
        success: true,
        refundAmount: request.amount,
        remainingBalance: bill.balanceDue,
        order: updatedOrder
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Void an order
   */
  async voidOrder(orderId: string, request: VoidOrderRequest): Promise<OrderItemResult> {
    try {
      const order = orderModel.voidOrder(orderId, request.reason, request.voidedBy);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Print receipt for an order
   */
  async printReceipt(orderId: string, tip: number = 0, splitId?: string): Promise<ReceiptResult> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      let receipt: Receipt;
      if (splitId) {
        receipt = billingService.generateSplitReceipt(order, splitId, tip);
      } else {
        receipt = billingService.generateReceipt(order, tip, order.splits.length > 0);
      }

      return { success: true, receipt };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get bill calculation for an order
   */
  async getBillCalculation(orderId: string, tip: number = 0): Promise<{ success: boolean; bill?: BilledCalculation; error?: string }> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const bill = billingService.calculateBill(order, tip);
      return { success: true, bill };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get tip suggestions for an order
   */
  async getTipSuggestions(orderId: string): Promise<{ success: boolean; suggestions?: any; error?: string }> {
    try {
      const order = orderModel.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const suggestions = billingService.calculateTipSuggestions(order.total);
      return { success: true, suggestions };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all available menu items
   */
  async getMenuItems(): Promise<MenuItem[]> {
    return orderModel.getAllMenuItems();
  }

  /**
   * Get available menu item by ID
   */
  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    return orderModel.getMenuItem(itemId) || null;
  }

  /**
   * Get order statistics
   */
  async getStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    return orderModel.getStatistics();
  }

  /**
   * Confirm order (move from pending to confirmed)
   */
  async confirmOrder(orderId: string): Promise<OrderItemResult> {
    return this.updateOrderStatus(orderId, 'confirmed');
  }

  /**
   * Start preparing order
   */
  async startPreparing(orderId: string): Promise<OrderItemResult> {
    return this.updateOrderStatus(orderId, 'preparing');
  }

  /**
   * Mark order as ready
   */
  async markReady(orderId: string): Promise<OrderItemResult> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  /**
   * Mark order as served
   */
  async markServed(orderId: string): Promise<OrderItemResult> {
    return this.updateOrderStatus(orderId, 'served');
  }

  /**
   * Get daily orders
   */
  async getDailyOrders(date?: Date): Promise<Order[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return orderModel.getAllOrders().filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });
  }

  /**
   * Get revenue summary for a date range
   */
  async getRevenueSummary(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalRefunds: number;
    netRevenue: number;
    revenueByDay: { date: string; revenue: number; orders: number }[];
  }> {
    const orders = orderModel.getAllOrders().filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate && order.status === 'paid';
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalRefunds = orders.reduce((sum, o) => {
      return sum + o.payments
        .filter(p => p.status === 'refunded')
        .reduce((s, p) => s + p.amount, 0);
    }, 0);

    // Group by day
    const revenueByDay: Map<string, { revenue: number; orders: number }> = new Map();
    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const existing = revenueByDay.get(dateKey) || { revenue: 0, orders: 0 };
      revenueByDay.set(dateKey, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      });
    });

    const revenueByDayArray = Array.from(revenueByDay.entries())
      .map(([date, data]) => ({ date, revenue: Math.round(data.revenue * 100) / 100, orders: data.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      netRevenue: Math.round((totalRevenue - totalRefunds) * 100) / 100,
      revenueByDay: revenueByDayArray
    };
  }
}

export const orderService = new OrderService();
