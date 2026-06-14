import { v4 as uuidv4 } from 'uuid';
import {
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  BillSplit,
  Discount,
  MenuItem,
  CreateOrderRequest,
  AddItemRequest,
  ItemModifier
} from '../types';

export class OrderModel {
  private static TAX_RATE = 0.08; // 8% tax rate
  private orders: Map<string, Order> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private orderCounter = 1000;

  constructor() {
    this.initializeMenuItems();
  }

  private initializeMenuItems(): void {
    // Sample menu items for the POS
    const sampleMenu: MenuItem[] = [
      { id: 'burger', name: 'Classic Burger', price: 12.99, category: 'Main', available: true },
      { id: 'cheeseburger', name: 'Cheese Burger', price: 14.99, category: 'Main', available: true },
      { id: 'fries', name: 'French Fries', price: 4.99, category: 'Side', available: true },
      { id: 'onion-rings', name: 'Onion Rings', price: 5.99, category: 'Side', available: true },
      { id: 'salad', name: 'Caesar Salad', price: 9.99, category: 'Appetizer', available: true },
      { id: 'soup', name: 'Soup of the Day', price: 6.99, category: 'Appetizer', available: true },
      { id: 'pasta', name: 'Spaghetti Bolognese', price: 15.99, category: 'Main', available: true },
      { id: 'pizza', name: 'Margherita Pizza', price: 16.99, category: 'Main', available: true },
      { id: 'chicken', name: 'Grilled Chicken', price: 17.99, category: 'Main', available: true },
      { id: 'steak', name: 'Ribeye Steak', price: 28.99, category: 'Main', available: true },
      { id: 'salmon', name: 'Grilled Salmon', price: 24.99, category: 'Main', available: true },
      { id: 'soda', name: 'Soft Drink', price: 2.99, category: 'Beverage', available: true },
      { id: 'coffee', name: 'Coffee', price: 3.99, category: 'Beverage', available: true },
      { id: 'tea', name: 'Iced Tea', price: 2.99, category: 'Beverage', available: true },
      { id: 'beer', name: 'Local Beer', price: 6.99, category: 'Beverage', available: true },
      { id: 'wine', name: 'House Wine', price: 8.99, category: 'Beverage', available: true },
      { id: 'cake', name: 'Chocolate Cake', price: 7.99, category: 'Dessert', available: true },
      { id: 'ice-cream', name: 'Ice Cream Sundae', price: 5.99, category: 'Dessert', available: true },
    ];

    sampleMenu.forEach(item => this.menuItems.set(item.id, item));
  }

  generateOrderNumber(): string {
    this.orderCounter++;
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `ORD-${dateStr}-${this.orderCounter}`;
  }

  generateItemId(): string {
    return uuidv4();
  }

  generatePaymentId(): string {
    return uuidv4();
  }

  generateSplitId(): string {
    return uuidv4();
  }

  generateReceiptNumber(): string {
    const date = new Date();
    return `RCP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }

  getMenuItem(itemId: string): MenuItem | undefined {
    return this.menuItems.get(itemId);
  }

  getAllMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values());
  }

  calculateItemPrice(menuItem: MenuItem, modifiers: ItemModifier[]): { unitPrice: number; modifierPrice: number } {
    const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0);
    return {
      unitPrice: menuItem.price,
      modifierPrice
    };
  }

  createOrder(request: CreateOrderRequest): Order {
    const orderId = uuidv4();
    const orderNumber = this.generateOrderNumber();
    const now = new Date();

    const items: OrderItem[] = [];

    if (request.items && request.items.length > 0) {
      for (const itemRequest of request.items) {
        const menuItem = this.menuItems.get(itemRequest.menuItemId);
        if (menuItem && menuItem.available) {
          const { unitPrice, modifierPrice } = this.calculateItemPrice(menuItem, itemRequest.modifiers || []);
          const item: OrderItem = {
            id: this.generateItemId(),
            menuItemId: menuItem.id,
            name: menuItem.name,
            quantity: itemRequest.quantity,
            unitPrice,
            modifiers: itemRequest.modifiers || [],
            modifierPrice,
            notes: itemRequest.notes,
            status: 'pending',
            createdAt: now,
            updatedAt: now
          };
          items.push(item);
        }
      }
    }

    const subtotal = this.calculateSubtotal(items);
    const taxAmount = this.calculateTax(subtotal);
    const total = subtotal + taxAmount;

    const order: Order = {
      id: orderId,
      orderNumber,
      items,
      status: 'pending',
      tableNumber: request.tableNumber,
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      subtotal,
      taxRate: OrderModel.TAX_RATE,
      taxAmount,
      discountAmount: 0,
      total,
      payments: [],
      splits: [],
      notes: request.notes,
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(orderId, order);
    return order;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    for (const order of this.orders.values()) {
      if (order.orderNumber === orderNumber) {
        return order;
      }
    }
    return undefined;
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOrdersByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values()).filter(order => order.status === status);
  }

  addItemToOrder(orderId: string, request: AddItemRequest): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided') {
      throw new Error('Cannot add items to a voided order');
    }

    if (order.status === 'paid') {
      throw new Error('Cannot add items to a paid order');
    }

    const menuItem = this.menuItems.get(request.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item ${request.menuItemId} not found`);
    }

    if (!menuItem.available) {
      throw new Error(`Menu item ${menuItem.name} is not available`);
    }

    const now = new Date();
    const { unitPrice, modifierPrice } = this.calculateItemPrice(menuItem, request.modifiers || []);

    const item: OrderItem = {
      id: this.generateItemId(),
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: request.quantity,
      unitPrice,
      modifiers: request.modifiers || [],
      modifierPrice,
      notes: request.notes,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    order.items.push(item);
    this.recalculateOrderTotals(order);

    return order;
  }

  updateItemQuantity(orderId: string, itemId: string, quantity: number): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided' || order.status === 'paid') {
      throw new Error(`Cannot update item in ${order.status} order`);
    }

    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in order`);
    }

    if (quantity <= 0) {
      return this.removeItemFromOrder(orderId, itemId);
    }

    item.quantity = quantity;
    item.updatedAt = new Date();
    this.recalculateOrderTotals(order);

    return order;
  }

  removeItemFromOrder(orderId: string, itemId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided' || order.status === 'paid') {
      throw new Error(`Cannot remove item from ${order.status} order`);
    }

    const itemIndex = order.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item ${itemId} not found in order`);
    }

    order.items.splice(itemIndex, 1);
    this.recalculateOrderTotals(order);

    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided' && status !== 'voided') {
      throw new Error('Cannot change status of a voided order');
    }

    order.status = status;
    order.updatedAt = new Date();

    if (status === 'paid') {
      order.completedAt = new Date();
    }

    return order;
  }

  applyDiscount(orderId: string, discount: Discount): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided') {
      throw new Error('Cannot apply discount to a voided order');
    }

    if (order.status === 'paid') {
      throw new Error('Cannot apply discount to a paid order');
    }

    // Check minimum order amount
    if (discount.minOrderAmount && order.subtotal < discount.minOrderAmount) {
      throw new Error(`Minimum order amount of $${discount.minOrderAmount} required for this discount`);
    }

    let discountAmount = 0;
    const applicableSubtotal = this.calculateApplicableSubtotal(order, discount.applicableItems);

    if (discount.type === 'percentage') {
      discountAmount = applicableSubtotal * (discount.value / 100);
      if (discount.maxDiscount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }
    } else {
      discountAmount = discount.value;
    }

    // Ensure discount doesn't exceed the applicable subtotal
    discountAmount = Math.min(discountAmount, applicableSubtotal);

    order.discountAmount = discountAmount;
    order.discountId = discount.id;
    this.recalculateOrderTotals(order);

    return order;
  }

  removeDiscount(orderId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'paid') {
      throw new Error('Cannot remove discount from a paid order');
    }

    order.discountAmount = 0;
    order.discountId = undefined;
    this.recalculateOrderTotals(order);

    return order;
  }

  splitBill(orderId: string, splits: BillSplit[]): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided') {
      throw new Error('Cannot split bill for a voided order');
    }

    order.splits = splits;
    return order;
  }

  addPayment(orderId: string, payment: Payment): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided') {
      throw new Error('Cannot add payment to a voided order');
    }

    if (payment.splitId) {
      const split = order.splits.find(s => s.id === payment.splitId);
      if (split) {
        split.paid = true;
        split.paidAt = new Date();
        if (payment.method) {
          split.paymentMethod = payment.method;
        }
      }
    }

    order.payments.push(payment);
    order.updatedAt = new Date();

    // Check if order is fully paid
    const totalPaid = this.calculateTotalPaid(order);
    if (totalPaid >= order.total) {
      order.status = 'paid';
      order.completedAt = new Date();
    }

    return order;
  }

  processRefund(orderId: string, paymentId: string, amount: number): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const payment = order.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'refunded') {
      throw new Error('Payment has already been refunded');
    }

    const refundAmount = Math.min(amount, payment.amount);
    payment.amount -= refundAmount;
    payment.status = payment.amount === 0 ? 'refunded' : 'partial';

    // Update order status if needed
    const totalPaid = this.calculateTotalPaid(order);
    if (totalPaid < order.total && order.status === 'paid') {
      order.status = 'served';
    }

    order.updatedAt = new Date();
    return order;
  }

  voidOrder(orderId: string, reason: string, voidedBy: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'voided') {
      throw new Error('Order is already voided');
    }

    order.status = 'voided';
    order.voidedAt = new Date();
    order.voidReason = reason;
    order.voidedBy = voidedBy;
    order.updatedAt = new Date();

    // Mark all items as voided
    order.items.forEach(item => {
      item.status = 'pending';
    });

    return order;
  }

  private calculateSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice + item.modifierPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);
  }

  private calculateTax(subtotal: number): number {
    return Math.round(subtotal * OrderModel.TAX_RATE * 100) / 100;
  }

  private calculateApplicableSubtotal(order: Order, applicableItems?: string[]): number {
    if (!applicableItems || applicableItems.length === 0) {
      return order.subtotal;
    }

    return order.items
      .filter(item => applicableItems.includes(item.menuItemId))
      .reduce((sum, item) => sum + (item.unitPrice + item.modifierPrice) * item.quantity, 0);
  }

  private recalculateOrderTotals(order: Order): void {
    order.subtotal = this.calculateSubtotal(order.items);
    order.taxAmount = this.calculateTax(order.subtotal - order.discountAmount);
    order.total = order.subtotal - order.discountAmount + order.taxAmount;
    order.updatedAt = new Date();
  }

  private calculateTotalPaid(order: Order): number {
    return order.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getStatistics(): {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  } {
    const orders = Array.from(this.orders.values());
    const completedOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      paid: 0,
      voided: 0
    };

    orders.forEach(order => {
      ordersByStatus[order.status]++;
    });

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      ordersByStatus
    };
  }
}

export const orderModel = new OrderModel();
