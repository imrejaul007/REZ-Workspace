/**
 * WhatsApp AI - WhatsApp Voice Agent for Hotel
 * Part of STAYBOT - Hotel AI Operating System
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

export class WhatsAppAI {
  private readonly menu: string = `
🏨 *Hotel Services Menu*

*Room Service*
🌅 Breakfast: 6 AM - 10:30 AM
🍽️ Lunch: 12 PM - 3 PM
🌙 Dinner: 7 PM - 10:30 PM

*Popular Items*
• Masala Chai - ₹80
• Continental Breakfast - ₹450
• Biryani Special - ₹380
• Late Night Snack - ₹250

*Hotel Services*
• Wake-up Call
• Taxi Booking
• Room Cleaning
• Spa Appointment

Reply with:
1️⃣ - Room Service
2️⃣ - Book a Table
3️⃣ - Request Service
4️⃣ - Hotel Info
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
        message: '📝 I received your voice message! Let me help you with that. Type your request or use the menu below.',
        type: 'text',
        quickReplies: ['Room Service', 'Book Table', 'Request Service']
      };
    }

    // Intent detection
    if (this.containsAny(lowerContent, ['order', 'food', 'breakfast', 'lunch', 'dinner', 'biryani', 'chai'])) {
      return this.handleRoomService(from);
    }

    if (this.containsAny(lowerContent, ['book', 'table', 'reservation', 'reserve', 'restaurant'])) {
      return this.handleRestaurantBooking(from);
    }

    if (this.containsAny(lowerContent, ['room', 'cleaning', 'towel', 'pillow', 'housekeeping'])) {
      return this.handleHousekeepingRequest(from);
    }

    if (this.containsAny(lowerContent, ['taxi', 'cab', 'transport', 'airport', 'pickup'])) {
      return this.handleTransportRequest(from);
    }

    if (this.containsAny(lowerContent, ['hi', 'hello', 'hey', 'namaste', 'help', 'menu'])) {
      return this.handleGreeting(from);
    }

    if (this.containsAny(lowerContent, ['checkout', 'check out', 'bill', 'invoice'])) {
      return this.handleCheckout(from);
    }

    if (this.containsAny(lowerContent, ['spa', 'massage', 'wellness'])) {
      return this.handleSpaRequest(from);
    }

    // Default response
    return this.handleDefault(from);
  }

  /**
   * Handle room service request
   */
  private handleRoomService(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🍽️ *Room Service*

What would you like to order?

*Popular Items*
• Masala Chai + Samosa - ₹120
• Continental Breakfast - ₹450
• Biryani Special - ₹380

Reply with your order or type "menu" for full menu.`,
      type: 'text',
      quickReplies: ['Order Breakfast', 'Order Biryani', 'View Full Menu']
    };
  }

  /**
   * Handle restaurant booking
   */
  private handleRestaurantBooking(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🍽️ *Restaurant Booking*

I can help you book a table at our restaurant!

*Options*
• Rooftop Restaurant - Fine dining, city views
• Coffee Shop - Casual, all-day dining
• Poolside - Light snacks & drinks

Please tell me:
• Number of guests
• Preferred restaurant
• Date & time`,
      type: 'text',
      quickReplies: ['Book Rooftop', 'Book Coffee Shop', 'View Menus']
    };
  }

  /**
   * Handle housekeeping request
   */
  private handleHousekeepingRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🧹 *Housekeeping Services*

How can we help?

• Extra towels/pillows
• Room cleaning
• Laundry service
• Late check-out cleaning

What do you need?`,
      type: 'text',
      quickReplies: ['Extra Towels', 'Room Cleaning', 'Laundry']
    };
  }

  /**
   * Handle transport request
   */
  private handleTransportRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🚖 *Transport Services*

I can arrange:
• Airport pickup/drop
• City sightseeing taxi
• Local transport

Please provide:
• Destination
• Preferred time
• Number of passengers`,
      type: 'text',
      quickReplies: ['Airport Transfer', 'Book Taxi', 'Get Directions']
    };
  }

  /**
   * Handle greeting
   */
  private handleGreeting(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `👋 *Welcome to our Hotel!*

How can I help you today?

• 🍽️ Order room service
• 📅 Book restaurant table
• 🧹 Request housekeeping
• 🚖 Arrange transport
• 💆 Book spa treatment`,
      type: 'text',
      quickReplies: ['Room Service', 'Book Table', 'Request Service', 'Hotel Menu']
    };
  }

  /**
   * Handle checkout
   */
  private handleCheckout(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🏨 *Express Checkout*

Your bill summary will be sent shortly.

Options:
• View detailed bill
• Confirm payment method
• Schedule late checkout
• Request luggage assistance

What would you like to do?`,
      type: 'text',
      quickReplies: ['View Bill', 'Pay Now', 'Late Checkout']
    };
  }

  /**
   * Handle spa request
   */
  private handleSpaRequest(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `💆 *Hotel Spa - Serenity*

*Spa Services*
• Aromatherapy Massage - ₹2,500/60 min
• Deep Tissue - ₹3,500/90 min
• Signature Treatment - ₹4,500/120 min

*Packages*
• Morning Bliss (Yoga + Massage) - ₹3,000
• Full Day Retreat - ₹8,000

Open: 8 AM - 8 PM
Advance booking recommended.`,
      type: 'text',
      quickReplies: ['Book Massage', 'View All Treatments', 'Spa Timings']
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
• 🍽️ Room service orders
• 📅 Restaurant bookings
• 🧹 Housekeeping requests
• 🚖 Transport arrangements
• 💆 Spa appointments

What would you like to do?`,
      type: 'text',
      quickReplies: ['Room Service', 'Book Table', 'Request Service', 'Hotel Menu']
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

Estimated delivery: 30-45 minutes

Reply "track ${orderId}" to check status.`,
      type: 'text'
    };
  }

  /**
   * Generate booking confirmation
   */
  generateBookingConfirmation(bookingId: string, details: string): WhatsAppResponse {
    return {
      to: '',
      message: `✅ *Booking Confirmed!*

Booking ID: ${bookingId}

${details}

See you soon!

Reply "cancel ${bookingId}" to cancel.`,
      type: 'text'
    };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

export default WhatsAppAI;