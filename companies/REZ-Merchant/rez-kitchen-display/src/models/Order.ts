import { v4 as uuidv4 } from 'uuid';
import {
  KitchenOrder,
  OrderItem,
  OrderStatus,
  Priority,
  CreateOrderRequest,
} from '../types';

/**
 * Priority queue weight mapping
 * Higher weight = higher priority
 */
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * Delay threshold in milliseconds (default 15 minutes)
 */
const DEFAULT_DELAY_THRESHOLD_MS = 15 * 60 * 1000;

export class OrderModel {
  /**
   * Create a new kitchen order from request data
   */
  static create(request: CreateOrderRequest): KitchenOrder {
    const now = new Date();
    const items: OrderItem[] = request.items.map((item) => ({
      id: uuidv4(),
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      completed: false,
    }));

    return {
      id: uuidv4(),
      orderNumber: request.orderNumber,
      tableNumber: request.tableNumber,
      customerName: request.customerName,
      items,
      status: 'pending',
      priority: request.priority || 'normal',
      createdAt: now,
      updatedAt: now,
      estimatedTime: request.estimatedTime,
      isDelayed: false,
      notes: request.notes,
      totalItems: items.length,
      completedItems: 0,
    };
  }

  /**
   * Calculate order priority score for queue sorting
   * Higher score = higher priority
   */
  static calculatePriorityScore(order: KitchenOrder): number {
    const priorityWeight = PRIORITY_WEIGHTS[order.priority];
    const ageWeight = this.getAgeWeight(order.createdAt);
    const itemCountWeight = Math.min(order.totalItems / 10, 1); // Normalize to max 1

    return priorityWeight * 100 + ageWeight * 50 + itemCountWeight * 20;
  }

  /**
   * Get age-based weight (newer orders get slight priority boost)
   */
  private static getAgeWeight(createdAt: Date): number {
    const ageMs = Date.now() - createdAt.getTime();
    const ageMinutes = ageMs / (60 * 1000);

    // Older orders get higher age weight
    if (ageMinutes < 2) return 0;
    if (ageMinutes < 5) return 1;
    if (ageMinutes < 10) return 2;
    if (ageMinutes < 20) return 3;
    return 4;
  }

  /**
   * Calculate elapsed time in milliseconds
   */
  static getElapsedTime(order: KitchenOrder): number {
    const startTime = order.startedAt || order.createdAt;
    return Date.now() - startTime.getTime();
  }

  /**
   * Check if order is delayed
   */
  static checkDelayed(
    order: KitchenOrder,
    thresholdMs: number = DEFAULT_DELAY_THRESHOLD_MS
  ): boolean {
    if (order.status === 'completed' || order.status === 'cancelled') {
      return false;
    }

    const elapsed = this.getElapsedTime(order);
    return elapsed > thresholdMs;
  }

  /**
   * Update order status with validation
   */
  static updateStatus(
    order: KitchenOrder,
    newStatus: OrderStatus
  ): KitchenOrder {
    const now = new Date();
    const updatedOrder: KitchenOrder = {
      ...order,
      status: newStatus,
      updatedAt: now,
    };

    switch (newStatus) {
      case 'preparing':
        updatedOrder.startedAt = order.startedAt || now;
        break;
      case 'completed':
        updatedOrder.completedAt = now;
        if (updatedOrder.startedAt) {
          updatedOrder.actualTime =
            updatedOrder.startedAt.getTime() - now.getTime();
        }
        break;
      case 'cancelled':
        updatedOrder.completedAt = now;
        break;
    }

    // Check if order is delayed after status update
    updatedOrder.isDelayed = this.checkDelayed(updatedOrder);

    return updatedOrder;
  }

  /**
   * Toggle item completion status
   */
  static toggleItemCompletion(order: KitchenOrder, itemId: string): KitchenOrder {
    const items = order.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const completedItems = items.filter((item) => item.completed).length;

    // Auto-complete order if all items are done
    let status = order.status;
    if (completedItems === items.length && order.status === 'preparing') {
      status = 'ready';
    }

    return {
      ...order,
      items,
      completedItems,
      status,
      updatedAt: new Date(),
    };
  }

  /**
   * Get priority display info
   */
  static getPriorityInfo(priority: Priority): { label: string; color: string; badge: string } {
    switch (priority) {
      case 'urgent':
        return { label: 'URGENT', color: '#dc2626', badge: '🔥' };
      case 'high':
        return { label: 'HIGH', color: '#ea580c', badge: '⚡' };
      case 'normal':
        return { label: 'NORMAL', color: '#2563eb', badge: '📋' };
      case 'low':
        return { label: 'LOW', color: '#6b7280', badge: '📝' };
    }
  }

  /**
   * Get status display info
   */
  static getStatusInfo(status: OrderStatus): { label: string; color: string; icon: string } {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: '#f59e0b', icon: '⏳' };
      case 'preparing':
        return { label: 'Preparing', color: '#3b82f6', icon: '🔥' };
      case 'ready':
        return { label: 'Ready', color: '#10b981', icon: '✅' };
      case 'completed':
        return { label: 'Completed', color: '#6b7280', icon: '✔️' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#ef4444', icon: '❌' };
    }
  }

  /**
   * Sort orders by priority (for display queue)
   */
  static sortByPriority(orders: KitchenOrder[]): KitchenOrder[] {
    return [...orders].sort((a, b) => {
      // First by priority score
      const scoreDiff = this.calculatePriorityScore(b) - this.calculatePriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;

      // Then by created time (earlier first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Filter orders by status
   */
  static filterByStatus(orders: KitchenOrder[], statuses: OrderStatus[]): KitchenOrder[] {
    return orders.filter((order) => statuses.includes(order.status));
  }

  /**
   * Get order statistics
   */
  static getStats(orders: KitchenOrder[]): {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    delayed: number;
    avgPrepTime: number;
  } {
    const stats = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      delayed: 0,
      avgPrepTime: 0,
    };

    let totalPrepTime = 0;
    let completedCount = 0;

    for (const order of orders) {
      switch (order.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'preparing':
          stats.preparing++;
          break;
        case 'ready':
          stats.ready++;
          break;
        case 'completed':
          stats.completed++;
          if (order.actualTime) {
            totalPrepTime += order.actualTime;
            completedCount++;
          }
          break;
      }

      if (order.isDelayed) {
        stats.delayed++;
      }
    }

    stats.avgPrepTime = completedCount > 0 ? totalPrepTime / completedCount : 0;

    return stats;
  }
}
