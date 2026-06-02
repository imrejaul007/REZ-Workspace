/**
 * AI Waiter - Restaurant Employee
 * Handles orders, reservations, and customer support via WhatsApp
 */

import { Agent } from '../../core/agent';
import { MemoryService } from '../../services/memory-service';
import { MenuService } from '../../services/menu-service';
import { OrderService } from '../../services/order-service';
import { ReservationService } from '../../services/reservation-service';

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  customizations: string[];
  price: number;
}

interface Order {
  customerId: string;
  tableId?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
}

interface Reservation {
  customerId: string;
  customerName: string;
  guestCount: number;
  dateTime: Date;
  occasion?: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export class AIWaiter extends Agent {
  private menuService: MenuService;
  private orderService: OrderService;
  private reservationService: ReservationService;
  private activeOrders: Map<string, Order> = new Map();
  private cartSessions: Map<string, OrderItem[]> = new Map();

  constructor(config: any) {
    super({
      name: 'AI Waiter',
      role: 'restaurant_order_taker',
      industry: 'restaurant',
      channels: ['whatsapp', 'voice', 'chat'],
      languages: ['en', 'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'gu', 'mr', 'pa'],
      ...config
    });

    this.menuService = new MenuService();
    this.orderService = new OrderService();
    this.reservationService = new ReservationService();
  }

  /**
   * Main intent handler
   */
  async handleIntent(customerId: string, message: string, context: any): Promise<string> {
    // Detect intent
    const intent = await this.detectIntent(message);

    switch (intent) {
      case 'order':
        return await this.handleOrder(customerId, message, context);
      case 'reservation':
        return await this.handleReservation(customerId, message, context);
      case 'menu_query':
        return await this.handleMenuQuery(message);
      case 'dietary':
        return await this.handleDietaryQuery(message);
      case 'hours':
        return this.getOperatingHours();
      case 'location':
        return this.getLocation();
      case 'cancel':
        return await this.handleCancellation(customerId);
      case 'modify':
        return await this.handleModification(customerId, message);
      default:
        return this.getDefaultResponse();
    }
  }

  /**
   * Intent detection using LLM
   */
  private async detectIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Order intents
    if (lowerMessage.match(/\b(order|buy|want|need|get|have)\b/) &&
        !lowerMessage.match(/\bcancel\b|\bchange\b|\bmodify\b/)) {
      return 'order';
    }

    // Reservation intents
    if (lowerMessage.match(/\b(book|reserve|reservation|table|tonight| tomorrow|date|dinner|lunch)\b/)) {
      return 'reservation';
    }

    // Menu queries
    if (lowerMessage.match(/\b(menu|what.*have|what.*serve|items|dishes|options)\b/)) {
      return 'menu_query';
    }

    // Dietary queries
    if (lowerMessage.match(/\b(veg|vegan|vegetarian|jain|allergy|allergen|gluten|nut)\b/)) {
      return 'dietary';
    }

    // Hours
    if (lowerMessage.match(/\b(open|close|hour|time)\b/)) {
      return 'hours';
    }

    // Location
    if (lowerMessage.match(/\b(address|where|location|directions|map|parking)\b/)) {
      return 'location';
    }

    // Cancel
    if (lowerMessage.match(/\bcancel\b/)) {
      return 'cancel';
    }

    // Modify
    if (lowerMessage.match(/\bchange|modify|update|edit\b/)) {
      return 'modify';
    }

    return 'unknown';
  }

  /**
   * Handle order flow
   */
  private async handleOrder(customerId: string, message: string, context: any): Promise<string> {
    // Check for table ID in context (from QR scan)
    const tableId = context?.tableId;

    // Initialize cart if not exists
    if (!this.cartSessions.has(customerId)) {
      this.cartSessions.set(customerId, []);
    }

    // Parse items from message
    const items = await this.parseOrderItems(message);

    if (items.length === 0) {
      // Ask for item
      return this.askForItem();
    }

    // Add to cart
    const cart = this.cartSessions.get(customerId)!;
    cart.push(...items);
    this.cartSessions.set(customerId, cart);

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Format cart
    const cartText = this.formatCart(cart, total);

    // Check if ready to confirm
    if (this.isConfirmation(message)) {
      return await this.confirmOrder(customerId, tableId);
    }

    // Show cart and ask for more
    return `${cartText}\n\nWould you like to add anything else?`;
  }

  /**
   * Parse order items from message
   */
  private async parseOrderItems(message: string): Promise<OrderItem[]> {
    const items: OrderItem[] = [];
    const menu = await this.menuService.getFullMenu();

    // Simple keyword matching (can be enhanced with NLP)
    const lowerMessage = message.toLowerCase();

    for (const category of menu.categories) {
      for (const item of category.items) {
        const itemName = item.name.toLowerCase();
        if (lowerMessage.includes(itemName)) {
          const quantity = this.extractQuantity(lowerMessage, itemName);
          const customizations = this.extractCustomizations(lowerMessage);

          items.push({
            itemId: item.id,
            name: item.name,
            quantity,
            customizations,
            price: item.price
          });
        }
      }
    }

    return items;
  }

  /**
   * Extract quantity from message
   */
  private extractQuantity(message: string, itemName: string): number {
    const match = message.match(new RegExp(`(\\d+)\\s*${itemName}`));
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Extract customizations
   */
  private extractCustomizations(message: string): string[] {
    const customizations: string[] = [];

    const customizationKeywords = [
      'extra cheese', 'no onion', 'less oil', 'well done',
      'mild', 'spicy', 'jain', 'gluten free'
    ];

    for (const keyword of customizationKeywords) {
      if (message.includes(keyword)) {
        customizations.push(keyword);
      }
    }

    return customizations;
  }

  /**
   * Format cart for display
   */
  private formatCart(items: OrderItem[], total: number): string {
    let text = '🛒 *Your Order:*\n\n';

    items.forEach((item, index) => {
      const customText = item.customizations.length > 0
        ? ` (${item.customizations.join(', ')})`
        : '';
      text += `${index + 1}. ${item.name}${customText}\n`;
      text += `   Qty: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━\n`;
    text += `*Total: ₹${total}*\n`;
    text += `━━━━━━━━━━━━━━━`;

    return text;
  }

  /**
   * Check if message is a confirmation
   */
  private isConfirmation(message: string): boolean {
    const confirmWords = ['yes', 'yeah', 'yup', 'confirm', 'order', 'done', 'place order', "that's all", 'nothing else'];
    return confirmWords.some(word => message.toLowerCase().includes(word));
  }

  /**
   * Confirm and place order
   */
  private async confirmOrder(customerId: string, tableId?: string): Promise<string> {
    const cart = this.cartSessions.get(customerId) || [];

    if (cart.length === 0) {
      return "Your cart is empty. What would you like to order?";
    }

    // Create order in POS
    const order = await this.orderService.createOrder({
      customerId,
      tableId,
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'confirmed'
    });

    // Store order
    this.activeOrders.set(customerId, order);

    // Clear cart
    this.cartSessions.delete(customerId);

    // Notify kitchen
    await this.notifyKitchen(order);

    // Generate payment link
    const paymentLink = await this.orderService.generatePaymentLink(order.id);

    return `✅ *Order Confirmed!*\n\n` +
           `Order #${order.id}\n` +
           `Items: ${cart.map(i => i.name).join(', ')}\n` +
           `Total: ₹${order.total}\n\n` +
           `Payment: ${paymentLink}\n` +
           `Kitchen has been notified.\n` +
           `Estimated time: 20-25 minutes\n\n` +
           `Enjoy your meal! 🍽️`;
  }

  /**
   * Notify kitchen display
   */
  private async notifyKitchen(order: Order): Promise<void> {
    // Send to KDS
    await this.orderService.sendToKDS({
      orderId: order.id,
      tableId: order.tableId,
      items: order.items,
      priority: 'normal',
      notes: order.items.flatMap(i => i.customizations).join(', ')
    });
  }

  /**
   * Handle reservation
   */
  private async handleReservation(customerId: string, message: string, context: any): Promise<string> {
    // Parse reservation details
    const guestCount = this.extractGuestCount(message);
    const dateTime = this.extractDateTime(message);
    const occasion = this.extractOccasion(message);

    if (!guestCount) {
      return "How many guests will be joining?";
    }

    if (!dateTime) {
      return "What date and time would you like?";
    }

    // Ask for name
    const session = await MemoryService.getSession(customerId);
    if (!session?.customerName) {
      return "May I have your name for the reservation?";
    }

    // Create reservation
    const reservation = await this.reservationService.create({
      customerId,
      customerName: session.customerName,
      guestCount,
      dateTime,
      occasion,
      phone: session.phone,
      status: 'confirmed'
    });

    return `✅ *Reservation Confirmed!*\n\n` +
           `📅 ${dateTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
           `🕐 ${dateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n` +
           `👥 ${guestCount} guests\n` +
           `📛 ${session.customerName}\n` +
           (occasion ? `🎂 ${occasion}\n` : '') +
           `\nSee you soon! 🌟`;
  }

  /**
   * Extract guest count
   */
  private extractGuestCount(message: string): number | null {
    const match = message.match(/(\d+)\s*(?:people|person|guests?|table)/i);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extract date/time
   */
  private extractDateTime(message: string): Date | null {
    const now = new Date();

    // Check for "tonight"
    if (message.toLowerCase().includes('tonight')) {
      now.setHours(20, 0, 0, 0); // 8 PM
      return now;
    }

    // Check for "tomorrow"
    if (message.toLowerCase().includes('tomorrow')) {
      now.setDate(now.getDate() + 1);
      now.setHours(20, 0, 0, 0);
      return now;
    }

    // Check for time patterns
    const timeMatch = message.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      now.setHours(hours, minutes, 0, 0);
      return now;
    }

    return null;
  }

  /**
   * Extract occasion
   */
  private extractOccasion(message: string): string | null {
    const occasions = ['birthday', 'anniversary', 'engagement', 'wedding', 'promotion', 'graduation'];
    const lowerMessage = message.toLowerCase();

    for (const occasion of occasions) {
      if (lowerMessage.includes(occasion)) {
        return occasion.charAt(0).toUpperCase() + occasion.slice(1);
      }
    }

    return null;
  }

  /**
   * Handle menu query
   */
  private async handleMenuQuery(message: string): Promise<string> {
    const menu = await this.menuService.getFullMenu();

    let response = "🍽️ *Our Menu:*\n\n";

    for (const category of menu.categories) {
      response += `*${category.name}:*\n`;
      for (const item of category.items.slice(0, 5)) { // Limit to 5 items per category
        response += `• ${item.name} - ₹${item.price}\n`;
      }
      response += "\n";
    }

    response += "What would you like to order?";

    return response;
  }

  /**
   * Handle dietary query
   */
  private async handleDietaryQuery(message: string): Promise<string> {
    const menu = await this.menuService.getMenuByDietary(message);

    if (menu.length === 0) {
      return "I couldn't find any items matching your dietary requirement. Would you like me to suggest alternatives?";
    }

    let response = "🌿 *Vegetarian Options:*\n\n";
    for (const item of menu.slice(0, 10)) {
      response += `• ${item.name} - ₹${item.price}\n`;
    }

    return response;
  }

  /**
   * Get operating hours
   */
  private getOperatingHours(): string {
    return `🕐 *Operating Hours:*\n\n` +
           `Monday - Thursday: 11 AM - 10 PM\n` +
           `Friday - Saturday: 11 AM - 11 PM\n` +
           `Sunday: 12 PM - 10 PM\n\n` +
           `Kitchen closes 30 mins before.`;
  }

  /**
   * Get location
   */
  private getLocation(): string {
    return `📍 *Location:*\n\n` +
           `[Restaurant Address]\n\n` +
           `📱 [Google Maps Link]\n\n` +
           `🚗 Parking available at the back.\n` +
           `Nearest metro: [Station Name]`;
  }

  /**
   * Handle cancellation
   */
  private async handleCancellation(customerId: string): Promise<string> {
    const order = this.activeOrders.get(customerId);

    if (!order) {
      return "I don't see any active orders to cancel.";
    }

    if (order.status === 'preparing' || order.status === 'ready') {
      return "Sorry, your order is already being prepared and cannot be cancelled.";
    }

    await this.orderService.cancelOrder(order.id);
    this.activeOrders.delete(customerId);

    return "Your order has been cancelled. No charges will be made.";
  }

  /**
   * Handle modification
   */
  private async handleModification(customerId: string, message: string): Promise<string> {
    const order = this.activeOrders.get(customerId);

    if (!order) {
      return "I don't see any active orders to modify.";
    }

    if (order.status !== 'pending') {
      return "Your order cannot be modified as it's already being prepared.";
    }

    // Parse modifications
    const modifications = await this.parseOrderItems(message);

    if (modifications.length > 0) {
      // Update order
      order.items = modifications;
      order.total = modifications.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return this.formatCart(order.items, order.total) +
             "\n\nSay *yes* to confirm the changes.";
    }

    return "What would you like to change about your order?";
  }

  /**
   * Ask for item
   */
  private askForItem(): string {
    return "🍽️ What would you like to order?\n\n" +
           "You can say things like:\n" +
           "• \"One margherita pizza\"\n" +
           "• \"2 butter chicken with naan\"\n" +
           "• \"Veg biryani for delivery\"";
  }

  /**
   * Default response
   */
  private getDefaultResponse(): string {
    return "I'm your AI waiter! 🍽️\n\n" +
           "I can help you with:\n" +
           "• Placing orders\n" +
           "• Making reservations\n" +
           "• Questions about our menu\n" +
           "• Dietary requirements\n\n" +
           "What would you like to do?";
  }
}

export default AIWaiter;
