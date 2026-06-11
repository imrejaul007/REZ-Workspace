/**
 * Kitchen Manager - Kitchen Coordination Agent
 * Part of WAITRON - Restaurant AI Operating System
 */

export interface KitchenOrder {
  id: string;
  tableNumber: number;
  items: string[];
  priority: 'normal' | 'rush' | 'vip';
  status: 'pending' | 'preparing' | 'ready' | 'served';
  prepTime: number;
  createdAt: string;
  specialRequests?: string;
}

export interface KitchenAlert {
  id: string;
  type: 'low_stock' | 'equipment' | 'staff' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface KitchenStats {
  pendingOrders: number;
  preparingOrders: number;
  avgPrepTime: number;
  completedToday: number;
  efficiency: number;
}

export class KitchenManager {
  private orders: Map<string, KitchenOrder> = new Map();
  private alerts: KitchenAlert[] = [];

  /**
   * Get kitchen dashboard data
   */
  async getDashboard(): Promise<{
    stats: KitchenStats;
    orders: KitchenOrder[];
    alerts: KitchenAlert[];
    insights: string[];
  }> {
    const pendingOrders = Array.from(this.orders.values()).filter(o => o.status === 'pending');
    const preparingOrders = Array.from(this.orders.values()).filter(o => o.status === 'preparing');
    const completedOrders = Array.from(this.orders.values()).filter(o => o.status === 'served');

    const stats: KitchenStats = {
      pendingOrders: pendingOrders.length,
      preparingOrders: preparingOrders.length,
      avgPrepTime: this.calculateAvgPrepTime([...pendingOrders, ...preparingOrders]),
      completedToday: completedOrders.length,
      efficiency: this.calculateEfficiency(completedOrders.length, pendingOrders.length)
    };

    const insights = this.generateInsights(stats);

    return {
      stats,
      orders: [...pendingOrders, ...preparingOrders].sort((a, b) => {
        const priorityOrder = { vip: 0, rush: 1, normal: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      alerts: this.alerts,
      insights
    };
  }

  /**
   * Set order priority
   */
  async setPriority(orderId: string, priority: 'normal' | 'rush' | 'vip'): Promise<{
    success: boolean;
    message: string;
  }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.priority = priority;
    this.orders.set(orderId, order);

    return {
      success: true,
      message: `Order ${orderId} priority set to ${priority}`
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: KitchenOrder['status']): Promise<{
    success: boolean;
    order?: KitchenOrder;
    message: string;
  }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.status = status;
    this.orders.set(orderId, order);

    return {
      success: true,
      order,
      message: `Order ${orderId} status updated to ${status}`
    };
  }

  /**
   * Add alert
   */
  async addAlert(alert: Omit<KitchenAlert, 'id' | 'timestamp'>): Promise<void> {
    this.alerts.push({
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get alerts
   */
  async getAlerts(severity?: KitchenAlert['severity']): Promise<KitchenAlert[]> {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Clear resolved alerts
   */
  async clearAlerts(alertIds: string[]): Promise<void> {
    this.alerts = this.alerts.filter(a => !alertIds.includes(a.id));
  }

  private calculateAvgPrepTime(orders: KitchenOrder[]): number {
    if (orders.length === 0) return 0;
    const total = orders.reduce((sum, o) => sum + o.prepTime, 0);
    return Math.round(total / orders.length);
  }

  private calculateEfficiency(completed: number, pending: number): number {
    const total = completed + pending;
    if (total === 0) return 100;
    return Math.round((completed / total) * 100);
  }

  private generateInsights(stats: KitchenStats): string[] {
    const insights: string[] = [];

    if (stats.pendingOrders > 10) {
      insights.push('High order volume! Consider activating backup staff.');
    }

    if (stats.pendingOrders > 5 && stats.avgPrepTime > 20) {
      insights.push('Prep times are high. Check for bottlenecks.');
    }

    if (stats.efficiency < 60) {
      insights.push('Kitchen efficiency below target. Review workflow.');
    }

    const vipOrders = Array.from(this.orders.values()).filter(o => o.priority === 'vip');
    if (vipOrders.length > 0) {
      insights.push(`${vipOrders.length} VIP orders pending. Prioritize these.`);
    }

    if (insights.length === 0) {
      insights.push('Kitchen running smoothly!');
    }

    return insights;
  }
}

export default KitchenManager;
