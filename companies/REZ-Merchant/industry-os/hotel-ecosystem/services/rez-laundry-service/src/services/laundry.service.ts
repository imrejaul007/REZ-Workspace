import { v4 as uuidv4 } from 'uuid';

export type ServiceType = 'self_service' | 'full_service' | 'express' | 'dry_clean';
export type OrderStatus = 'pending' | 'washing' | 'drying' | 'folding' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface LaundryItem {
  itemId: string;
  category: 'garment' | 'linen' | 'blanket' | 'shoe' | 'other';
  name: string;
  quantity: number;
  condition: 'good' | 'stained' | 'damaged';
  notes?: string;
}

export interface LaundryOrder {
  orderId: string;
  hotelId: string;
  roomNumber?: string;
  guestName: string;
  guestPhone: string;
  items: LaundryItem[];
  serviceType: ServiceType;
  status: OrderStatus;
  priority: 'normal' | 'rush' | 'same_day';
  subtotal: number;
  taxes: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'room_charge' | 'card' | 'cash' | ' complimentary';
  pickedUpAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  estimatedReady: Date;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaundryPricing {
  serviceType: ServiceType;
  basePrice: number;
  perKgPrice?: number;
  expressMultiplier: number;
  rushMultiplier: number;
  currency: string;
}

export interface MachineStatus {
  machineId: string;
  type: 'washer' | 'dryer';
  model: string;
  status: 'idle' | 'running' | 'maintenance' | 'error';
  currentLoad?: number;
  remainingTime?: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export class LaundryService {
  private orders: Map<string, LaundryOrder> = new Map();
  private machines: Map<string, MachineStatus> = new Map();

  private readonly pricing: Record<ServiceType, LaundryPricing> = {
    self_service: { serviceType: 'self_service', basePrice: 50, perKgPrice: 30, expressMultiplier: 1.5, rushMultiplier: 2, currency: 'INR' },
    full_service: { serviceType: 'full_service', basePrice: 100, perKgPrice: 80, expressMultiplier: 1.5, rushMultiplier: 2, currency: 'INR' },
    express: { serviceType: 'express', basePrice: 150, perKgPrice: 120, expressMultiplier: 1, rushMultiplier: 2, currency: 'INR' },
    dry_clean: { serviceType: 'dry_clean', basePrice: 200, perKgPrice: 150, expressMultiplier: 1.5, rushMultiplier: 2, currency: 'INR' },
  };

  constructor() {
    this.initializeMachines();
  }

  private initializeMachines() {
    // Initialize 5 washers and 4 dryers
    for (let i = 1; i <= 5; i++) {
      this.machines.set(`washer-${i}`, {
        machineId: `washer-${i}`,
        type: 'washer',
        model: `Industrial Washer ${i}`,
        status: 'idle',
      });
    }
    for (let i = 1; i <= 4; i++) {
      this.machines.set(`dryer-${i}`, {
        machineId: `dryer-${i}`,
        type: 'dryer',
        model: `Industrial Dryer ${i}`,
        status: 'idle',
      });
    }
  }

  async createOrder(
    hotelId: string,
    guestName: string,
    guestPhone: string,
    items: Omit<LaundryItem, 'itemId'>[],
    serviceType: ServiceType,
    roomNumber?: string,
    priority: 'normal' | 'rush' | 'same_day' = 'normal',
    notes?: string
  ): Promise<LaundryOrder> {
    const orderId = `LN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Assign item IDs
    const orderItems: LaundryItem[] = items.map(item => ({
      ...item,
      itemId: uuidv4(),
    }));

    // Calculate pricing
    const priceConfig = this.pricing[serviceType];
    let subtotal = priceConfig.basePrice;

    // Add per-item pricing based on category
    orderItems.forEach(item => {
      const categoryPrices: Record<string, number> = {
        garment: 30,
        linen: 25,
        blanket: 50,
        shoe: 80,
        other: 20,
      };
      subtotal += categoryPrices[item.category] * item.quantity;
    });

    // Apply priority multiplier
    if (priority === 'rush') {
      subtotal *= priceConfig.rushMultiplier;
    } else if (priority === 'same_day') {
      subtotal *= priceConfig.expressMultiplier;
    }

    const taxes = subtotal * 0.18; // GST
    const total = subtotal + taxes;

    // Calculate estimated ready time
    const baseHours = serviceType === 'express' ? 4 : serviceType === 'dry_clean' ? 24 : 8;
    const priorityHours = priority === 'rush' ? 0.5 : priority === 'same_day' ? 2 : 0;
    const estimatedReady = new Date(Date.now() + (baseHours - priorityHours) * 60 * 60 * 1000);

    const order: LaundryOrder = {
      orderId,
      hotelId,
      roomNumber,
      guestName,
      guestPhone,
      items: orderItems,
      serviceType,
      status: 'pending',
      priority,
      subtotal: Math.round(subtotal * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      total: Math.round(total * 100) / 100,
      paymentStatus: 'pending',
      estimatedReady,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(orderId, order);
    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<LaundryOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    order.updatedAt = new Date();

    if (status === 'washing') {
      // Allocate washing machine
      const machine = this.allocateMachine('washer');
      if (machine) order.assignedTo = machine.machineId;
    }

    if (status === 'ready') {
      order.completedAt = new Date();
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    this.orders.set(orderId, order);
    return order;
  }

  async markPickedUp(orderId: string): Promise<LaundryOrder> {
    return this.updateStatus(orderId, 'washing');
  }

  async markReady(orderId: string): Promise<LaundryOrder> {
    return this.updateStatus(orderId, 'ready');
  }

  async markDelivered(orderId: string): Promise<LaundryOrder> {
    return this.updateStatus(orderId, 'delivered');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<LaundryOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new Error('Cannot cancel this order');
    }

    order.status = 'cancelled';
    if (reason) order.notes = `${order.notes || ''} [Cancelled: ${reason}]`;
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async processPayment(orderId: string, method: LaundryOrder['paymentMethod']): Promise<LaundryOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.paymentStatus = 'paid';
    order.paymentMethod = method;
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async getOrder(orderId: string): Promise<LaundryOrder | null> {
    return this.orders.get(orderId) || null;
  }

  async getHotelOrders(hotelId: string, status?: OrderStatus): Promise<LaundryOrder[]> {
    let orders = Array.from(this.orders.values()).filter(o => o.hotelId === hotelId);
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRoomOrders(hotelId: string, roomNumber: string): Promise<LaundryOrder[]> {
    return Array.from(this.orders.values())
      .filter(o => o.hotelId === hotelId && o.roomNumber === roomNumber)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMachineStatus(): Promise<MachineStatus[]> {
    return Array.from(this.machines.values());
  }

  async allocateMachine(type: 'washer' | 'dryer'): Promise<MachineStatus | null> {
    const available = Array.from(this.machines.values())
      .filter(m => m.type === type && m.status === 'idle');

    if (available.length === 0) return null;
    return available[0];
  }

  async getActiveOrders(hotelId: string): Promise<{
    orders: LaundryOrder[];
    byStatus: Record<OrderStatus, number>;
    avgProcessingTime: number;
  }> {
    const orders = await this.getHotelOrders(hotelId);
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

    const byStatus: Record<OrderStatus, number> = {
      pending: 0, washing: 0, drying: 0, folding: 0, ready: 0, delivered: 0, cancelled: 0,
    };
    activeOrders.forEach(o => byStatus[o.status]++);

    // Calculate avg processing time
    const completedOrders = orders.filter(o => o.completedAt);
    const avgProcessingTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const time = (o.completedAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + time;
        }, 0) / completedOrders.length
      : 0;

    return { orders: activeOrders, byStatus, avgProcessingTime };
  }

  async getDailyStats(hotelId: string, date: Date = new Date()): Promise<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    revenue: number;
    byServiceType: Record<ServiceType, number>;
    avgItemsPerOrder: number;
    popularItems: { category: string; count: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayOrders = Array.from(this.orders.values())
      .filter(o => o.hotelId === hotelId && o.createdAt >= startOfDay && o.createdAt <= endOfDay);

    const completedOrders = dayOrders.filter(o => o.status === 'delivered');
    const cancelledOrders = dayOrders.filter(o => o.status === 'cancelled');
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    const byServiceType: Record<ServiceType, number> = {
      self_service: 0, full_service: 0, express: 0, dry_clean: 0,
    };
    dayOrders.forEach(o => byServiceType[o.serviceType]++);

    const totalItems = dayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const avgItemsPerOrder = dayOrders.length > 0 ? totalItems / dayOrders.length : 0;

    // Count popular items
    const itemCounts = new Map<string, number>();
    dayOrders.forEach(o => o.items.forEach(i => {
      itemCounts.set(i.category, (itemCounts.get(i.category) || 0) + i.quantity);
    }));
    const popularItems = Array.from(itemCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalOrders: dayOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      revenue,
      byServiceType,
      avgItemsPerOrder: Math.round(avgItemsPerOrder * 10) / 10,
      popularItems,
    };
  }
}
