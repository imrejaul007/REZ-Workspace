/**
 * Order Service - Order Management Backend
 * Part of WAITRON - Restaurant AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialRequests?: string;
}

export interface Order {
  id: string;
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet';
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface OrderFilters {
  status?: Order['status'];
  date?: string;
  customerId?: string;
}

export class OrderService {
  private orders: Map<string, Order> = new Map();

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'tax' | 'total'>): Promise<Order> {
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + tax;

    const order: Order = {
      ...orderData,
      id: uuidv4(),
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(order.id, order);
    return order;
  }

  async getById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAll(filters?: OrderFilters): Promise<Order[]> {
    let orders = Array.from(this.orders.values());

    if (filters) {
      if (filters.status) {
        orders = orders.filter(o => o.status === filters.status);
      }
      if (filters.date) {
        orders = orders.filter(o => o.createdAt.startsWith(filters.date!));
      }
      if (filters.customerId) {
        orders = orders.filter(o => o.customerId === filters.customerId);
      }
    }

    return orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateStatus(id: string, status: Order['status']): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'completed') {
      order.completedAt = new Date().toISOString();
    }

    this.orders.set(id, order);
    return order;
  }

  async updatePayment(id: string, paymentData: {
    status: Order['paymentStatus'];
    method?: Order['paymentMethod'];
  }): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.paymentStatus = paymentData.status;
    if (paymentData.method) {
      order.paymentMethod = paymentData.method;
    }
    order.updatedAt = new Date().toISOString();

    this.orders.set(id, order);
    return order;
  }

  async cancel(id: string): Promise<Order | undefined> {
    return this.updateStatus(id, 'cancelled');
  }

  // Analytics
  async getStats(date?: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    byStatus: Record<string, number>;
    byPaymentMethod: Record<string, number>;
  }> {
    const orders = date
      ? await this.getAll({ date })
      : Array.from(this.orders.values());

    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

    return {
      totalOrders: orders.length,
      totalRevenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
      avgOrderValue: paidOrders.length > 0
        ? Math.round(paidOrders.reduce((sum, o) => sum + o.total, 0) / paidOrders.length)
        : 0,
      byStatus: orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPaymentMethod: paidOrders.reduce((acc, o) => {
        const method = o.paymentMethod || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getTodayStats(): Promise<{
    orders: number;
    revenue: number;
    pending: number;
    completed: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const orders = await this.getAll({ date: today });

    return {
      orders: orders.length,
      revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
      pending: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  }
}

export default OrderService;
