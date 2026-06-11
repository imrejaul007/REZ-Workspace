/**
 * ShopFlow WhatsApp AI - Conversational Commerce
 * Handles WhatsApp messaging for retail store
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4832;

app.use(express.json());

// Types
interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  type: 'text' | 'image' | 'location' | 'button';
  sessionId: string;
}

interface Conversation {
  id: string;
  customerId?: string;
  phone: string;
  state: 'active' | 'shopping' | 'checkout' | 'resolved';
  cart: CartItem[];
  context: string[];
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
}

// Sample products
const products: Product[] = [
  { id: '1', name: 'Cotton T-Shirt', sku: 'TSH-001', price: 599, stock: 45, category: 'Clothing' },
  { id: '2', name: 'Denim Jeans', sku: 'JN-001', price: 1299, stock: 30, category: 'Clothing' },
  { id: '3', name: 'Running Shoes', sku: 'SH-001', price: 2499, stock: 20, category: 'Footwear' },
  { id: '4', name: 'Formal Shirt', sku: 'FSH-001', price: 999, stock: 35, category: 'Clothing' },
  { id: '5', name: 'Leather Wallet', sku: 'WL-001', price: 799, stock: 25, category: 'Accessories' },
  { id: '6', name: 'Sunglasses', sku: 'SG-001', price: 1499, stock: 15, category: 'Accessories' },
  { id: '7', name: 'Backpack', sku: 'BP-001', price: 899, stock: 40, category: 'Bags' },
  { id: '8', name: 'Watch', sku: 'WT-001', price: 2999, stock: 12, category: 'Accessories' },
];

// In-memory stores
const conversations = new Map<string, Conversation>();
const messages = new Map<string, WhatsAppMessage[]>();

// Helper: Get or create conversation
function getConversation(phone: string): Conversation {
  const existing = Array.from(conversations.values()).find(c => c.phone === phone);
  if (existing) {
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const conversation: Conversation = {
    id: uuidv4(),
    phone,
    state: 'active',
    cart: [],
    context: [],
    lastMessage: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  conversations.set(conversation.id, conversation);
  messages.set(conversation.id, []);
  return conversation;
}

// Helper: Parse intent from message
function parseIntent(message: string): { intent: string; entities: string[] } {
  const lower = message.toLowerCase();
  const entities: string[] = [];

  // Extract product names
  for (const p of products) {
    if (lower.includes(p.name.toLowerCase()) || lower.includes(p.sku.toLowerCase())) {
      entities.push(p.name);
    }
  }

  // Intent detection
  if (lower.includes('buy') || lower.includes('order') || lower.includes('add')) {
    return { intent: 'add_to_cart', entities };
  }
  if (lower.includes('cart') || lower.includes('basket') || lower.includes('view')) {
    return { intent: 'view_cart', entities };
  }
  if (lower.includes('checkout') || lower.includes('pay') || lower.includes('place order')) {
    return { intent: 'checkout', entities };
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return { intent: 'price_inquiry', entities };
  }
  if (lower.includes('available') || lower.includes('stock') || lower.includes('have')) {
    return { intent: 'availability', entities };
  }
  if (lower.includes('return') || lower.includes('exchange')) {
    return { intent: 'return_policy', entities };
  }
  if (lower.includes('location') || lower.includes('address') || lower.includes('where')) {
    return { intent: 'store_info', entities };
  }
  if (lower.includes('hours') || lower.includes('open') || lower.includes('time')) {
    return { intent: 'store_hours', entities };
  }
  if (lower.includes('search') || lower.includes('looking for') || lower.includes('find')) {
    return { intent: 'product_search', entities };
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return { intent: 'greeting', entities };
  }
  if (lower.includes('thanks') || lower.includes('thank you')) {
    return { intent: 'thanks', entities };
  }

  return { intent: 'general', entities };
}

// Helper: Generate AI response
function generateResponse(intent: string, entities: string[], conversation: Conversation): string {
  switch (intent) {
    case 'greeting':
      return '👋 Hi! Welcome to ShopFlow! I can help you:\n• Browse products\n• Check prices\n• Place orders\n• Track deliveries\n\nWhat would you like to do today?';

    case 'product_search':
      if (entities.length > 0) {
        return `I found ${entities.length} product(s) matching your search:\n\n${entities.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nWould you like to add any to your cart?`;
      }
      return 'What are you looking for? I can help you find products by name, category, or price range.';

    case 'price_inquiry':
      if (entities.length > 0) {
        const product = products.find(p => entities.includes(p.name));
        if (product) {
          return `💰 ${product.name}: ₹${product.price}\nSKU: ${product.sku}\nStock: ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}`;
        }
      }
      return 'Which product would you like to know the price of?';

    case 'availability':
      if (entities.length > 0) {
        const product = products.find(p => entities.includes(p.name));
        if (product) {
          return product.stock > 0
            ? `✅ ${product.name} is available! (${product.stock} in stock)`
            : `❌ Sorry, ${product.name} is currently out of stock.`;
        }
      }
      return 'Which product would you like to check availability for?';

    case 'add_to_cart':
      if (entities.length > 0) {
        const product = products.find(p => entities.includes(p.name));
        if (product) {
          if (product.stock <= 0) {
            return `❌ Sorry, ${product.name} is out of stock.`;
          }
          const existing = conversation.cart.find(i => i.productId === product.id);
          if (existing) {
            existing.quantity += 1;
          } else {
            conversation.cart.push({
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1
            });
          }
          conversation.state = 'shopping';
          return `✅ Added ${product.name} to your cart!\n\nYour cart has ${conversation.cart.length} item(s).\n\nReply "checkout" when ready to order.`;
        }
      }
      return 'Which product would you like to add to your cart?';

    case 'view_cart':
      if (conversation.cart.length === 0) {
        return '🛒 Your cart is empty.\n\nBrowse our products and let me know what you\'d like!';
      }
      const total = conversation.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const cartList = conversation.cart.map((item, i) =>
        `${i + 1}. ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`
      ).join('\n');
      return `🛒 Your Cart:\n${cartList}\n\n**Total: ₹${total}**\n\nReply "checkout" to place your order or "clear" to empty your cart.`;

    case 'checkout':
      if (conversation.cart.length === 0) {
        return '🛒 Your cart is empty. Add items before checkout!';
      }
      const checkoutTotal = conversation.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      conversation.state = 'checkout';
      return `🛒 Order Summary:\n${conversation.cart.map((item, i) => `${i + 1}. ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}\n\n**Total: ₹${checkoutTotal}**\n\nDelivery address: ${conversation.phone}\n\nReply "confirm" to place your order or "cancel" to continue shopping.`;

    case 'return_policy':
      return '📋 Our Return Policy:\n• 7 days for returns\n• 15 days for exchanges\n• Items must be unused with tags\n• Keep your receipt\n\nNeed help with a return? Reply with the product name.';

    case 'store_info':
      return '📍 Our Store:\nMain Street Mall, Ground Floor\n\n🕐 Hours: 10 AM - 9 PM (Mon-Sat)\n\nFree parking available!';

    case 'store_hours':
      return '🕐 Store Hours:\nMonday - Saturday: 10 AM - 9 PM\nSunday: 11 AM - 8 PM\n\nWe look forward to seeing you!';

    case 'thanks':
      return '🙏 Thank you for shopping with us!\nReply "browse" to continue shopping or "cart" to view your cart.';

    default:
      return 'I\'m here to help you shop! Try:\n• "Show me t-shirts"\n• "Price of jeans"\n• "Add to cart"\n• "View cart"\n\nOr just tell me what you\'re looking for!';
  }
}

// AI: Receive WhatsApp message
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const { from, body, type = 'text' } = req.body;

    // Acknowledge immediately
    res.status(200).send('OK');

    // Get or create conversation
    const conversation = getConversation(from);

    // Store message
    const message: WhatsAppMessage = {
      id: uuidv4(),
      from,
      to: process.env.WHATSAPP_NUMBER || '+1234567890',
      body,
      timestamp: new Date().toISOString(),
      type,
      sessionId: conversation.id
    };

    const msgs = messages.get(conversation.id) || [];
    msgs.push(message);
    messages.set(conversation.id, msgs);

    // Update context
    conversation.lastMessage = body;
    conversation.context.push(body);

    // Parse intent and generate response
    const { intent, entities } = parseIntent(body);
    const responseText = generateResponse(intent, entities, conversation);

    // Handle special commands
    if (body.toLowerCase() === 'clear' && conversation.cart.length > 0) {
      conversation.cart = [];
      conversation.state = 'active';
    }

    // Log outgoing message
    const responseMsg: WhatsAppMessage = {
      id: uuidv4(),
      from: process.env.WHATSAPP_NUMBER || '+1234567890',
      to: from,
      body: responseText,
      timestamp: new Date().toISOString(),
      type: 'text',
      sessionId: conversation.id
    };
    msgs.push(responseMsg);

    console.log(`WhatsApp [${from}]: ${body}`);
    console.log(`WhatsApp [Bot]: ${responseText.substring(0, 100)}...`);
  } catch (error) {
    console.error('Webhook error:', error);
  }
});

// AI: Send proactive message
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;

    const msg: WhatsAppMessage = {
      id: uuidv4(),
      from: process.env.WHATSAPP_NUMBER || '+1234567890',
      to,
      body: message,
      timestamp: new Date().toISOString(),
      type,
      sessionId: ''
    };

    res.json({
      success: true,
      messageId: msg.id,
      message: `Message sent to ${to}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Send failed' });
  }
});

// AI: Get conversation
app.get('/api/whatsapp/conversations/:phone', (req, res) => {
  const conversation = Array.from(conversations.values()).find(c => c.phone === req.params.phone);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const msgs = messages.get(conversation.id) || [];
  res.json({ conversation, messages: msgs });
});

// AI: Product catalog
app.get('/api/whatsapp/products', (req, res) => {
  const { category, search } = req.query;
  let result = products;

  if (category) {
    result = result.filter(p => p.category === category);
  }
  if (search) {
    result = result.filter(p =>
      p.name.toLowerCase().includes((search as string).toLowerCase())
    );
  }

  res.json({ products: result });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ShopFlow - WhatsApp AI',
    version: '1.0.0',
    port: PORT,
    stats: {
      activeConversations: Array.from(conversations.values()).filter(c => c.state === 'active').length,
      totalConversations: conversations.size,
      messagesToday: Array.from(messages.values()).flat().filter(m =>
        m.timestamp.startsWith(new Date().toISOString().split('T')[0])
      ).length
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ShopFlow WhatsApp AI v1.0.0                 ║
║                                                         ║
║  Port: ${PORT}                                               ║
║  Features:                                              ║
║  • Conversational Commerce                                ║
║  • Product Search                                        ║
║  • Cart & Checkout                                       ║
║  • Order Tracking                                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;