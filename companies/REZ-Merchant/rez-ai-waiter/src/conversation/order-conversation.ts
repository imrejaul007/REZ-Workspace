/**
 * Order Conversation Manager
 */

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
  notes?: string;
}

export interface Order {
  orderId: string;
  tableId?: string;
  items: OrderItem[];
  status: 'cart' | 'confirmed' | 'preparing' | 'served' | 'completed';
  subtotal: number;
  tax: number;
  total: number;
  createdAt: number;
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  tableId?: string;
  order: Order;
  preferences: string[];
  dietaryRestrictions: string[];
  history: string[];
}

export class OrderConversation {
  private context: Map<string, ConversationContext> = new Map();

  /**
   * Start a new conversation
   */
  startConversation(sessionId: string, tableId?: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      tableId,
      order: {
        orderId: `order_${Date.now()}`,
        tableId,
        items: [],
        status: 'cart',
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: Date.now(),
      },
      preferences: [],
      dietaryRestrictions: [],
      history: [],
    };

    this.context.set(sessionId, context);
    return context;
  }

  /**
   * Get conversation context
   */
  getContext(sessionId: string): ConversationContext | undefined {
    return this.context.get(sessionId);
  }

  /**
   * Add item to order
   */
  addItem(sessionId: string, item: Omit<OrderItem, 'quantity'>): OrderItem | null {
    const context = this.context.get(sessionId);
    if (!context) return null;

    const orderItem: OrderItem = {
      ...item,
      quantity: 1,
    };

    context.order.items.push(orderItem);
    this.recalculateTotal(context);

    return orderItem;
  }

  /**
   * Update item quantity
   */
  updateQuantity(sessionId: string, itemId: string, quantity: number): boolean {
    const context = this.context.get(sessionId);
    if (!context) return false;

    const item = context.order.items.find(i => i.itemId === itemId);
    if (!item) return false;

    if (quantity <= 0) {
      context.order.items = context.order.items.filter(i => i.itemId !== itemId);
    } else {
      item.quantity = quantity;
    }

    this.recalculateTotal(context);
    return true;
  }

  /**
   * Remove item from order
   */
  removeItem(sessionId: string, itemId: string): boolean {
    return this.updateQuantity(sessionId, itemId, 0);
  }

  /**
   * Add customization to item
   */
  addCustomization(sessionId: string, itemId: string, customization: string): boolean {
    const context = this.context.get(sessionId);
    if (!context) return false;

    const item = context.order.items.find(i => i.itemId === itemId);
    if (!item) return false;

    if (!item.customizations) {
      item.customizations = [];
    }
    item.customizations.push(customization);

    return true;
  }

  /**
   * Add dietary restriction
   */
  addDietaryRestriction(sessionId: string, restriction: string): boolean {
    const context = this.context.get(sessionId);
    if (!context) return false;

    if (!context.dietaryRestrictions.includes(restriction)) {
      context.dietaryRestrictions.push(restriction);
    }

    return true;
  }

  /**
   * Confirm order
   */
  confirmOrder(sessionId: string): Order | null {
    const context = this.context.get(sessionId);
    if (!context) return null;

    if (context.order.items.length === 0) {
      return null;
    }

    context.order.status = 'confirmed';
    return context.order;
  }

  /**
   * Get order summary
   */
  getOrderSummary(sessionId: string): string | null {
    const context = this.context.get(sessionId);
    if (!context) return null;

    const { order } = context;

    if (order.items.length === 0) {
      return 'Your cart is empty.';
    }

    let summary = '**Your Order:**\n';

    for (const item of order.items) {
      summary += `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}`;
      if (item.customizations && item.customizations.length > 0) {
        summary += ` (${item.customizations.join(', ')})`;
      }
      summary += '\n';
    }

    summary += `\n**Subtotal:** ₹${order.subtotal}`;
    summary += `\n**Tax:** ₹${order.tax}`;
    summary += `\n**Total:** ₹${order.total}`;

    return summary;
  }

  /**
   * Clear order
   */
  clearOrder(sessionId: string): boolean {
    const context = this.context.get(sessionId);
    if (!context) return false;

    context.order.items = [];
    context.order.subtotal = 0;
    context.order.tax = 0;
    context.order.total = 0;
    context.order.status = 'cart';

    return true;
  }

  /**
   * Recalculate order total
   */
  private recalulateTotal(context: ConversationContext): void {
    const { order } = context;

    order.subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    order.tax = Math.round(order.subtotal * 0.18); // 18% GST
    order.total = order.subtotal + order.tax;
  }
}