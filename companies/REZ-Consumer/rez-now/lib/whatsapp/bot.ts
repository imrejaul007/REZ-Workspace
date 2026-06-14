/**
 * WhatsApp Bot for Order Management
 *
 * Handles WhatsApp chatbot interactions for:
 * - Browse menu
 * - Place orders
 * - Track orders
 * - FAQs
 * - Get receipts
 */

import { logger } from '@/lib/utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WhatsAppBotMessage {
  from: string;
  messageId: string;
  text?: string;
  type: 'text' | 'image' | 'location' | 'document';
  timestamp: string;
}

export interface WhatsAppBotResponse {
  type: 'text' | 'image' | 'interactive' | 'template';
  content: string | WhatsAppInteractiveMessage | WhatsAppTemplateMessage;
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

export interface WhatsAppTemplateMessage {
  name: string;
  language: { code: string };
  components: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{ type: string; [key: string]: unknown }>;
  }>;
}

// ── Bot State ─────────────────────────────────────────────────────────────────

interface UserSession {
  phone: string;
  state: 'initial' | 'menu' | 'ordering' | 'tracking' | 'faq';
  currentOrderId?: string;
  selectedItems: string[];
  context: Record<string, unknown>;
}

const userSessions = new Map<string, UserSession>();

function getOrCreateSession(phone: string): UserSession {
  let session = userSessions.get(phone);
  if (!session) {
    session = {
      phone,
      state: 'initial',
      selectedItems: [],
      context: {},
    };
    userSessions.set(phone, session);
  }
  return session;
}

// ── Message Handlers ──────────────────────────────────────────────────────────

const messageHandlers: Record<string, (message: string, session: UserSession) => WhatsAppBotResponse> = {
  // Initial greetings and menu access
  'hi': handleGreeting,
  'hello': handleGreeting,
  'hey': handleGreeting,
  'start': handleMenu,
  'menu': handleMenu,
  'order': handleOrdering,
  'track': handleTracking,
  'help': handleHelp,
  'faq': handleFAQ,
  'receipt': handleReceipt,
};

// ── Handler Functions ─────────────────────────────────────────────────────────

function handleGreeting(_message: string, session: UserSession): WhatsAppBotResponse {
  session.state = 'menu';

  return {
    type: 'interactive',
    content: {
      type: 'list',
      header: 'Welcome to REZ! 👋',
      body: 'How can I help you today? Choose an option below:',
      footer: 'Powered by REZ',
      sections: [
        {
          title: 'Quick Actions',
          rows: [
            { id: 'browse_menu', title: '📋 Browse Menu', description: 'See our full menu' },
            { id: 'place_order', title: '🛒 Place Order', description: 'Order food for pickup/delivery' },
            { id: 'track_order', title: '🚚 Track Order', description: 'Check your order status' },
            { id: 'view_faqs', title: '❓ FAQs', description: 'Common questions' },
          ],
        },
      ],
    },
  };
}

function handleMenu(_message: string, session: UserSession): WhatsAppBotResponse {
  session.state = 'menu';

  return {
    type: 'interactive',
    content: {
      type: 'list',
      header: '📋 Our Menu',
      body: 'What would you like to see?',
      footer: 'Powered by REZ',
      sections: [
        {
          title: 'Categories',
          rows: [
            { id: 'cat_biryani', title: '🍚 Biryani', description: 'Flavorful rice dishes' },
            { id: 'cat_curry', title: '🍛 Curry', description: 'Rich and creamy curries' },
            { id: 'cat_bread', title: '🫓 Breads', description: 'Fresh naan and rotis' },
            { id: 'cat_drinks', title: '🥤 Drinks', description: 'Beverages and lassis' },
            { id: 'cat_desserts', title: '🍰 Desserts', description: 'Sweet treats' },
          ],
        },
      ],
    },
  };
}

function handleOrdering(_message: string, session: UserSession): WhatsAppBotResponse {
  session.state = 'ordering';
  session.selectedItems = [];

  return {
    type: 'text',
    content: `Great! Let's place an order. 🛒\n\nTell me what you'd like to order, or say 'menu' to see our full menu.\n\nExample: "I want 2 chicken biryani and 1 garlic naan"`,
  };
}

function handleTracking(_message: string, session: UserSession): WhatsAppBotResponse {
  session.state = 'tracking';

  if (session.currentOrderId) {
    return {
      type: 'text',
      content: `Your order #${session.currentOrderId} is being prepared! 🍳\n\nWe'll notify you when it's ready for pickup/delivery.\n\nNeed help with something else?`,
    };
  }

  return {
    type: 'text',
    content: `To track your order, please provide your order number.\n\nExample: "Track order #12345"\n\nOr visit: https://reznow.app/orders`,
  };
}

function handleHelp(_message: string, session: UserSession): WhatsAppBotResponse {
  return {
    type: 'text',
    content: `Here are things I can help you with:\n\n` +
      `• Browse our menu\n` +
      `• Place an order\n` +
      `• Track your order\n` +
      `• Get your receipt\n` +
      `• Answer FAQs\n\n` +
      `Just type what you need or use the menu options above! 😊`,
  };
}

function handleFAQ(_message: string, session: UserSession): WhatsAppBotResponse {
  session.state = 'faq';

  return {
    type: 'interactive',
    content: {
      type: 'list',
      header: '❓ FAQs',
      body: 'Select a topic to learn more:',
      footer: 'Powered by REZ',
      sections: [
        {
          title: 'Common Topics',
          rows: [
            { id: 'faq_delivery', title: '🚚 Delivery', description: 'Delivery time and areas' },
            { id: 'faq_payment', title: '💳 Payment', description: 'Accepted payment methods' },
            { id: 'faq_allergies', title: '🌿 Dietary', description: 'Allergen information' },
            { id: 'faq_refund', title: '💰 Refunds', description: 'Refund policy' },
            { id: 'faq_contact', title: '📞 Contact Us', description: 'Reach our support' },
          ],
        },
      ],
    },
  };
}

function handleReceipt(_message: string, session: UserSession): WhatsAppBotResponse {
  if (session.currentOrderId) {
    return {
      type: 'text',
      content: `Your latest receipt has been sent to your registered email. 📧\n\nOrder #${session.currentOrderId}\n\nVisit https://reznow.app/orders to view all your orders and download receipts.`,
    };
  }

  return {
    type: 'text',
    content: `I don't have unknown recent orders on file. 🧾\n\nPlace an order first and I'll send you the receipt automatically after payment!\n\nType 'order' to get started.`,
  };
}

// ── Main Bot Processor ────────────────────────────────────────────────────────

/**
 * Process an incoming WhatsApp message and return a response
 */
export function processWhatsAppMessage(message: WhatsAppBotMessage): WhatsAppBotResponse {
  const session = getOrCreateSession(message.from);
  const text = message.text?.toLowerCase().trim() || '';

  logger.info('[WhatsApp Bot] Processing message', {
    from: message.from.slice(-10),
    text: text.slice(0, 50),
    state: session.state,
  });

  // Handle list response callbacks (button/list selections)
  if (text.startsWith('cat_')) {
    return handleCategorySelection(text, session);
  }

  if (text.startsWith('faq_')) {
    return handleFAQSelection(text, session);
  }

  if (text.startsWith('browse_menu') || text.startsWith('place_order') ||
      text.startsWith('track_order') || text.startsWith('view_faqs')) {
    const actionMap: Record<string, (msg: string, sess: UserSession) => WhatsAppBotResponse> = {
      'browse_menu': handleMenu,
      'place_order': handleOrdering,
      'track_order': handleTracking,
      'view_faqs': handleFAQ,
    };
    const handler = actionMap[text] || handleHelp;
    return handler(text, session);
  }

  // Check for keyword handlers
  for (const [keyword, handler] of Object.entries(messageHandlers)) {
    if (text.includes(keyword)) {
      return handler(text, session);
    }
  }

  // Handle order items (simple natural language ordering)
  if (session.state === 'ordering' || text.match(/\d+\s+\w+/)) {
    return handleOrderItems(text, session);
  }

  // Handle order number tracking
  if (text.includes('track') && text.match(/\d/)) {
    const orderMatch = text.match(/(\d{4,})/);
    if (orderMatch) {
      session.currentOrderId = orderMatch[1];
      return handleTracking(text, session);
    }
  }

  // Default response
  return {
    type: 'text',
    content: `I'm not sure I understood that. 🤔\n\nTry saying:\n• "Hi" to get started\n• "Menu" to browse\n• "Order" to place an order\n• "Track" to track an order\n• "Help" for assistance`,
  };
}

/**
 * Handle category selection
 */
function handleCategorySelection(selection: string, session: UserSession): WhatsAppBotResponse {
  const categoryMap: Record<string, { name: string; items: string }> = {
    'cat_biryani': { name: 'Biryani', items: 'Chicken Biryani, Mutton Biryani, Veg Biryani, Prawn Biryani' },
    'cat_curry': { name: 'Curry', items: 'Butter Chicken, Paneer Tikka Masala, Kadhai Chicken, Dal Makhani' },
    'cat_bread': { name: 'Breads', items: 'Garlic Naan, Butter Naan, Tandoori Roti, Laccha Paratha' },
    'cat_drinks': { name: 'Drinks', items: 'Mango Lassi, Sweet Lassi, Masala Chai, Fresh Lime Soda' },
    'cat_desserts': { name: 'Desserts', items: 'Gulab Jamun, Rasmalai, Kheer, Ice Cream' },
  };

  const category = categoryMap[selection];
  if (!category) {
    return handleMenu('', session);
  }

  return {
    type: 'text',
    content: `📋 *${category.name} Menu*\n\n${category.items}\n\n💰 Prices vary by item\n\nTo order, say something like:\n"2 Chicken Biryani"\nor\n"Add Chicken Biryani to my order"\n\nType "menu" to see other categories.`,
  };
}

/**
 * Handle FAQ selection
 */
function handleFAQSelection(selection: string, session: UserSession): WhatsAppBotResponse {
  const faqMap: Record<string, string> = {
    'faq_delivery': `🚚 *Delivery Information*\n\n` +
      `• Delivery time: 30-45 minutes\n` +
      `• Free delivery on orders above ₹500\n` +
      `• Delivery radius: 8 km from store\n\n` +
      `Visit https://reznow.app for more details.`,

    'faq_payment': `💳 *Payment Methods*\n\n` +
      `We accept:\n` +
      `• Credit/Debit Cards\n` +
      `• UPI (Google Pay, PhonePe, Paytm)\n` +
      `• Net Banking\n` +
      `• Cash on Delivery\n` +
      `• REZ Coins`,

    'faq_allergies': `🌿 *Dietary Information*\n\n` +
      `• 🥬 Vegetarian options clearly marked\n` +
      `• 🌱 Vegan items available\n` +
      `• 🚫 Gluten-free options available\n` +
      `• 🐄 Halal certified items\n\n` +
      `Please inform staff of unknown allergies when ordering.`,

    'faq_refund': `💰 *Refund Policy*\n\n` +
      `• Full refund for cancelled orders before preparation\n` +
      `• Partial refund for issues with your order\n` +
      `• Refunds processed within 5-7 business days\n\n` +
      `Contact support@reznow.app for assistance.`,

    'faq_contact': `📞 *Contact Us*\n\n` +
      `• Email: support@reznow.app\n` +
      `• Phone: Available on your order receipt\n` +
      `• Hours: 9 AM - 10 PM daily\n\n` +
      `We typically respond within 2 hours.`,
  };

  const faq = faqMap[selection];
  if (!faq) {
    return handleFAQ('', session);
  }

  return {
    type: 'text',
    content: faq,
  };
}

/**
 * Handle order items from natural language
 */
function handleOrderItems(text: string, session: UserSession): WhatsAppBotResponse {
  // Simple pattern matching for order items
  const patterns = [
    /(\d+)\s+(chicken\s+biryani)/gi,
    /(\d+)\s+(mutton\s+biryani)/gi,
    /(\d+)\s+(veg\s+biryani)/gi,
    /(\d+)\s+(garlic\s+naan)/gi,
    /(\d+)\s+(butter\s+naan)/gi,
  ];

  const orderedItems: string[] = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const quantity = match[1];
      const item = match[2];
      orderedItems.push(`${quantity}x ${item}`);
    }
  }

  if (orderedItems.length > 0) {
    session.selectedItems.push(...orderedItems);

    return {
      type: 'interactive',
      content: {
        type: 'button',
        header: '🛒 Order Added!',
        body: `Added to your order:\n${orderedItems.join('\n')}\n\nTotal items: ${session.selectedItems.length}`,
        footer: 'Powered by REZ',
        buttons: [
          { id: 'confirm_order', title: '✅ Confirm Order' },
          { id: 'add_more', title: '➕ Add More' },
          { id: 'view_cart', title: '🛍️ View Cart' },
        ],
      },
    };
  }

  return {
    type: 'text',
    content: `I couldn't understand your order. 😅\n\nTry saying:\n"2 Chicken Biryani and 1 Garlic Naan"\nor\n"1 Butter Chicken"`,
  };
}

// ── Clear Session ─────────────────────────────────────────────────────────────

/**
 * Clear a user's session
 */
export function clearUserSession(phone: string): void {
  userSessions.delete(phone);
  logger.info('[WhatsApp Bot] Session cleared', { phone: phone.slice(-10) });
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default {
  processWhatsAppMessage,
  clearUserSession,
};
