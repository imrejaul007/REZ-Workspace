import { logger } from '../config/logger';
import { Order, Restaurant, MenuItem, Customer } from '../models/Restaurant';
import mongoose from 'mongoose';

interface WhatsAppMessage {
  from: string;
  message: string;
  timestamp?: number;
}

interface WhatsAppResponse {
  message: string;
  action?: {
    type: 'order_created' | 'menu_shared' | 'order_status';
    data?: any;
  };
}

export class WhatsAppService {
  private static instance: WhatsAppService;

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async processMessage(phone: string, message: string): Promise<WhatsAppResponse> {
    const normalizedPhone = this.normalizePhone(phone);
    const lowerMessage = message.toLowerCase().trim();

    logger.info('Processing WhatsApp message', { phone: normalizedPhone, message: lowerMessage });

    // Route based on message content
    if (this.isMenuRequest(lowerMessage)) {
      return this.handleMenuRequest(normalizedPhone);
    }

    if (this.isOrderRequest(lowerMessage)) {
      return this.handleOrderRequest(normalizedPhone, lowerMessage);
    }

    if (this.isStatusRequest(lowerMessage)) {
      return this.handleStatusRequest(normalizedPhone);
    }

    if (this.isHelpRequest(lowerMessage)) {
      return this.handleHelpRequest();
    }

    if (this.isSpecialsRequest(lowerMessage)) {
      return this.handleSpecialsRequest();
    }

    if (this.isCartRequest(lowerMessage)) {
      return this.handleCartRequest(normalizedPhone);
    }

    return this.handleDefault();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  }

  private isMenuRequest(message: string): boolean {
    return message.includes('menu') ||
           message.includes('food') ||
           message.includes('items') ||
           message.includes('dish') ||
           message.includes('biryani') ||
           message.includes('pizza') ||
           message.includes('burger');
  }

  private isOrderRequest(message: string): boolean {
    return message.includes('order') ||
           message.includes('want') ||
           message.includes('need') ||
           message.includes('buy') ||
           message.includes('hungry');
  }

  private isStatusRequest(message: string): boolean {
    return message.includes('status') ||
           message.includes('track') ||
           message.includes('where') ||
           message.includes('delivery') ||
           message.includes('ready');
  }

  private isHelpRequest(message: string): boolean {
    return message.includes('help') ||
           message.includes('support') ||
           message.includes('contact') ||
           message.includes('options');
  }

  private isSpecialsRequest(message: string): boolean {
    return message.includes('special') ||
           message.includes('recommend') ||
           message.includes('best') ||
           message.includes('popular') ||
           message.includes('suggest');
  }

  private isCartRequest(message: string): boolean {
    return message.includes('cart') ||
           message.includes('basket') ||
           message.includes('view order');
  }

  private async handleMenuRequest(phone: string): Promise<WhatsAppResponse> {
    // Get or create customer
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({ phone });
    }

    // Get restaurant menu
    const restaurant = await Restaurant.findOne({ isActive: true })
      .sort({ totalOrders: -1 });

    if (!restaurant) {
      return {
        message: 'No restaurants are currently available. Please try again later.',
      };
    }

    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
      available: true,
    }).sort({ category: 1, name: 1 });

    if (menuItems.length === 0) {
      return {
        message: `Welcome to ${restaurant.name}!\n\nOur menu is being updated. Please check back soon!`,
      };
    }

    // Group by category
    const categorizedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);

    let response = `🍽️ *${restaurant.name}*\n`;
    response += `📍 ${restaurant.address.city}\n\n`;
    response += `*MENU*\n\n`;

    for (const [category, items] of Object.entries(categorizedMenu)) {
      response += `*${category.toUpperCase()}*\n`;
      for (const item of items) {
        const vegIcon = item.isVeg !== false ? '🟢' : '🔴';
        response += `${vegIcon} ${item.name} - ₹${item.price}\n`;
      }
      response += '\n';
    }

    response += '\n*Reply with item names to order*\n';
    response += 'Example: "1 Margherita Pizza, 2 Chicken Burger"';

    return {
      message: response,
      action: { type: 'menu_shared', data: { restaurantId: restaurant._id } },
    };
  }

  private async handleOrderRequest(phone: string, message: string): Promise<WhatsAppResponse> {
    // Parse order items from message
    const items = this.parseOrderItems(message);

    if (items.length === 0) {
      return {
        message: 'I couldn\'t understand your order. Please try again with item names.\n\nExample: "1 Margherita Pizza, 2 Chicken Burger"',
      };
    }

    const restaurant = await Restaurant.findOne({ isActive: true })
      .sort({ totalOrders: -1 });

    if (!restaurant) {
      return {
        message: 'No restaurants are currently available.',
      };
    }

    // Find matching menu items
    const orderItems = [];
    let subtotal = 0;

    for (const itemName of items) {
      const menuItem = await MenuItem.findOne({
        restaurantId: restaurant._id,
        available: true,
        name: { $regex: new RegExp(itemName, 'i') },
      });

      if (menuItem) {
        orderItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
        });
        subtotal += menuItem.price;
      }
    }

    if (orderItems.length === 0) {
      return {
        message: 'None of the items you requested are available. Please check our menu.',
      };
    }

    // Calculate tax (5% GST)
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    // Create order
    const order = await Order.create({
      restaurantId: restaurant._id,
      customerPhone: phone,
      items: orderItems,
      subtotal,
      tax,
      total,
      status: 'pending',
      orderType: 'delivery',
      source: 'whatsapp',
      paymentStatus: 'pending',
      estimatedReadyTime: new Date(Date.now() + restaurant.avgPreparationTime * 60000),
    });

    // Update restaurant order count
    await Restaurant.updateOne(
      { _id: restaurant._id },
      { $inc: { totalOrders: 1 } }
    );

    // Update customer
    await Customer.updateOne(
      { phone },
      {
        $inc: { orderCount: 1, totalSpent: total },
        $set: { lastOrderAt: new Date() },
      },
      { upsert: true }
    );

    let response = `✅ *Order Confirmed!*\n\n`;
    response += `📋 *Order #${order._id.toString().slice(-6).toUpperCase()}*\n\n`;
    response += `*Items:*\n`;
    for (const item of orderItems) {
      response += `• ${item.quantity}x ${item.name} - ₹${item.price * item.quantity}\n`;
    }
    response += `\n`;
    response += `*Total: ₹${total}*\n\n`;
    response += `⏱️ Estimated time: ${restaurant.avgPreparationTime} minutes\n\n`;
    response += `Track your order by sending "status"`;

    return {
      message: response,
      action: {
        type: 'order_created',
        data: { orderId: order._id },
      },
    };
  }

  private async handleStatusRequest(phone: string): Promise<WhatsAppResponse> {
    const latestOrder = await Order.findOne({ customerPhone: phone })
      .sort({ createdAt: -1 });

    if (!latestOrder) {
      return {
        message: 'You don\'t have any active orders.\n\nPlace an order by typing "order" or "menu"!',
      };
    }

    const statusEmoji = this.getStatusEmoji(latestOrder.status);
    const statusMessage = this.getStatusMessage(latestOrder.status);

    let response = `📦 *Order Status*\n\n`;
    response += `Order #${latestOrder._id.toString().slice(-6).toUpperCase()}\n`;
    response += `${statusEmoji} ${statusMessage}\n\n`;

    if (latestOrder.status === 'pending') {
      response += `Your order is being confirmed by the restaurant.`;
    } else if (latestOrder.status === 'confirmed') {
      response += `Great! Your order has been confirmed and will be prepared soon.`;
    } else if (latestOrder.status === 'preparing') {
      response += `Our chef is preparing your delicious food! 🍳`;
    } else if (latestOrder.status === 'ready') {
      response += `Your order is ready for ${latestOrder.orderType}!`;
    } else if (latestOrder.status === 'delivered') {
      response += `Thank you for ordering! Enjoy your meal! 🍽️`;
    }

    if (latestOrder.estimatedReadyTime) {
      const remaining = Math.max(0, Math.round((latestOrder.estimatedReadyTime.getTime() - Date.now()) / 60000));
      response += `\n\n⏱️ Ready in: ~${remaining} minutes`;
    }

    return {
      message: response,
      action: { type: 'order_status', data: { orderId: latestOrder._id } },
    };
  }

  private handleHelpRequest(): WhatsAppResponse {
    return {
      message: `📋 *Available Commands*\n\n` +
        `• *menu* - View our full menu\n` +
        `• *order [items]* - Place an order\n` +
        `• *status* - Check your order status\n` +
        `• *specials* - View today's specials\n` +
        `• *cart* - View your current cart\n\n` +
        `Need help? Type your question and we'll assist!`,
    };
  }

  private async handleSpecialsRequest(): Promise<WhatsAppResponse> {
    const restaurant = await Restaurant.findOne({ isActive: true })
      .sort({ totalOrders: -1 });

    if (!restaurant) {
      return { message: 'No restaurants available.' };
    }

    const specials = await MenuItem.find({
      restaurantId: restaurant._id,
      available: true,
    })
      .sort({ name: 1 })
      .limit(5);

    if (specials.length === 0) {
      return { message: 'No specials available today.' };
    }

    let response = `🌟 *Today's Specials*\n\n`;
    for (let i = 0; i < specials.length; i++) {
      const item = specials[i];
      response += `${i + 1}. ${item.name} - ₹${item.price}\n`;
      if (item.description) {
        response += `   ${item.description}\n`;
      }
    }
    response += `\n*Reply with the number or name to order!*`;

    return { message: response };
  }

  private async handleCartRequest(phone: string): Promise<WhatsAppResponse> {
    const latestOrder = await Order.findOne({
      customerPhone: phone,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (!latestOrder || latestOrder.items.length === 0) {
      return {
        message: 'Your cart is empty!\n\nBrowse our menu by typing "menu" and place an order!',
      };
    }

    let response = `🛒 *Your Cart*\n\n`;
    for (const item of latestOrder.items) {
      response += `• ${item.quantity}x ${item.name} - ₹${item.price * item.quantity}\n`;
    }
    response += `\n*Subtotal: ₹${latestOrder.subtotal}*\n`;
    response += `*Total: ₹${latestOrder.total}*\n\n`;
    response += `Reply "confirm order" to place this order.`;

    return { message: response };
  }

  private handleDefault(): WhatsAppResponse {
    return {
      message: `👋 Hi! I'm your AI waiter assistant!\n\n` +
        `I can help you:\n` +
        `• View our menu - just type *menu*\n` +
        `• Place an order - type *order*\n` +
        `• Check order status - type *status*\n` +
        `• View today's specials - type *specials*\n\n` +
        `What would you like to do?`,
    };
  }

  private parseOrderItems(message: string): string[] {
    const items: string[] = [];
    const patterns = [
      /(\d+)\s*(.+?)(?:,|$|\band\b)/gi,
      /(?:order|want|need|get)\s+(.+?)(?:\.|$)/gi,
      /(.+?)(?:\s+plz|\s+please|$)/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        const item = (match[2] || match[1] || '').trim();
        if (item && item.length > 2) {
          items.push(item.replace(/^\d+\s*/, ''));
        }
      }
    }

    return items;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '🍳',
      ready: '🎉',
      delivered: '📦',
      cancelled: '❌',
    };
    return emojis[status] || '❓';
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: 'Pending Confirmation',
      confirmed: 'Order Confirmed',
      preparing: 'Being Prepared',
      ready: 'Ready for Pickup/Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return messages[status] || status;
  }

  async sendWhatsAppNotification(phone: string, orderId: string, status: string): Promise<boolean> {
    try {
      const statusMessage = this.getStatusEmoji(status) + ' ' + this.getStatusMessage(status);

      const message = `📋 *Order Update*\n\n` +
        `Order #${orderId.toString().slice(-6).toUpperCase()}\n` +
        `Status: ${statusMessage}\n\n` +
        `Track your order anytime by sending "status"`;

      logger.info('WhatsApp notification sent', { phone, orderId, status });

      // In production, integrate with WhatsApp Business API
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp notification', { error, phone, orderId });
      return false;
    }
  }
}

export const whatsAppService = WhatsAppService.getInstance();
