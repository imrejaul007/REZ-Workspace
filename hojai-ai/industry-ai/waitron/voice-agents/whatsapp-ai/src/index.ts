/**
 * WhatsApp AI - WhatsApp Voice Agent for Restaurant
 * Part of WAITRON - Restaurant AI Operating System
 */

export interface WhatsAppMessage {
  from: string;
  type: 'text' | 'voice' | 'image' | 'document';
  content: string;
  messageId: string;
  timestamp: string;
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  quickReplies?: string[];
  mediaUrl?: string;
}

export interface QuickReply {
  title: string;
  payload: string;
}

export class WhatsAppAI {
  private readonly menu: string = `
🍽️ *Our Menu*

*Starters*
• Paneer Tikka - ₹220
• Chicken Tikka - ₹260
• Samosa - ₹60

*Main Course*
• Butter Chicken - ₹350
• Paneer Butter Masala - ₹280
• Dal Makhani - ₹220
• Biryani - ₹320

*Breads*
• Garlic Naan - ₹60
• Butter Naan - ₹50

*Beverages*
• Masala Chai - ₹40
• Lassi - ₹80

Reply with:
1️⃣ - Place order
2️⃣ - Book table
3️⃣ - View full menu
  `.trim();

  /**
   * Handle incoming WhatsApp message
   */
  async handleMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const { from, content, type } = message;
    const lowerContent = content.toLowerCase();

    // Voice message - transcribe and process
    if (type === 'voice') {
      return {
        to: from,
        message: '📝 I received your voice message. Let me help you with that!',
        type: 'text',
        quickReplies: ['Order Food', 'Book Table', 'View Menu']
      };
    }

    // Intent detection
    if (this.containsAny(lowerContent, ['order', 'parcel', 'biryani', 'chicken', 'paneer'])) {
      return this.handleOrderRequest(from);
    }

    if (this.containsAny(lowerContent, ['book', 'table', 'reservation', 'reserve'])) {
      return this.handleReservationRequest(from);
    }

    if (this.containsAny(lowerContent, ['menu', 'card', 'list', 'items'])) {
      return this.handleMenuRequest(from);
    }

    if (this.containsAny(lowerContent, ['hi', 'hello', 'hey', 'namaste'])) {
      return this.handleGreeting(from);
    }

    if (this.containsAny(lowerContent, ['track', 'status', 'where', 'delivery'])) {
      return this.handleOrderTracking(from);
    }

    // Default response
    return this.handleDefault(from);
  }

  /**
   * Handle order request
   */
  private handleOrderRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🍔 *Order Food*

What would you like to order?

*Popular Items:*
• Butter Chicken + Naan - ₹410
• Paneer Tikka + Rice - ₹350
• Full Thali - ₹450

Reply with your order or type "menu" for full menu.`,
      type: 'text',
      quickReplies: ['Order Popular Combo', 'View Full Menu', 'Book Table First']
    };
  }

  /**
   * Handle reservation request
   */
  private handleReservationRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `📅 *Book a Table*

I can help you reserve a table!

Please tell me:
• Number of guests
• Date & time
• Any preferences (outdoor, private)

Or use our quick options:`,
      type: 'text',
      quickReplies: ['Book for Tonight', 'Book for Tomorrow', 'Weekend Booking']
    };
  }

  /**
   * Handle menu request
   */
  private handleMenuRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: this.menu,
      type: 'text',
      quickReplies: ['Order Now', 'Book Table', 'Call Us']
    };
  }

  /**
   * Handle greeting
   */
  private handleGreeting(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `👋 *Namaste!* Welcome to our restaurant!

How can I help you today?

• 🍔 Place a food order
• 📅 Book a table
• 📋 View our menu
• 🔍 Track your order`,
      type: 'text',
      quickReplies: ['Place Order', 'Book Table', 'View Menu']
    };
  }

  /**
   * Handle order tracking
   */
  private handleOrderTracking(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🔍 *Order Tracking*

Please share your order ID to track your order.

Or reply:
• "Last order" - Track your most recent order
• "My orders" - View order history`,
      type: 'text'
    };
  }

  /**
   * Handle default/unknown input
   */
  private handleDefault(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🤔 I didn't quite catch that.

I can help you with:
• 🍔 Ordering food
• 📅 Booking a table
• 📋 Viewing our menu
• 🔍 Tracking your order

What would you like to do?`,
      type: 'text',
      quickReplies: ['Order Food', 'Book Table', 'View Menu', 'Track Order']
    };
  }

  /**
   * Generate order confirmation
   */
  generateOrderConfirmation(orderId: string, items: string[], total: number): WhatsAppResponse {
    return {
      to: '',
      message: `✅ *Order Confirmed!*

Order ID: ${orderId}

Items:
${items.map(item => `• ${item}`).join('\n')}

Total: ₹${total}

We'll notify you when your order is ready!

Reply "track ${orderId}" to check status.`,
      type: 'text'
    };
  }

  /**
   * Generate reservation confirmation
   */
  generateReservationConfirmation(
    reservationId: string,
    date: string,
    time: string,
    guests: number,
    tableNumber: number
  ): WhatsAppResponse {
    return {
      to: '',
      message: `✅ *Reservation Confirmed!*

Reservation ID: ${reservationId}
Date: ${date}
Time: ${time}
Guests: ${guests}
Table: ${tableNumber}

See you soon!

Reply "cancel ${reservationId}" to cancel.`,
      type: 'text'
    };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

export default WhatsAppAI;
