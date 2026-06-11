import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 4862;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Types and Interfaces
interface Booking {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  stylist: string;
  dateTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  messageId?: string;
}

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  category: string;
  description: string;
}

interface ConversationState {
  userPhone: string;
  step: 'initial' | 'name' | 'service' | 'stylist' | 'datetime' | 'confirm' | 'style_quiz' | 'quiz_result';
  data: {
    customerName?: string;
    service?: string;
    stylist?: string;
    dateTime?: string;
    preferences?: string[];
  };
  language: 'en' | 'zh' | 'es';
}

interface StylePreference {
  faceShape?: string;
  skinTone?: string;
  hairType?: string;
  lifestyle?: string;
  occasion?: string;
}

// In-memory data store
const bookings: Booking[] = [];
const conversations: Map<string, ConversationState> = new Map();

// Sample data
const services: Service[] = [
  { id: '1', name: 'Haircut & Styling', duration: '45 min', price: '$45', category: 'hair', description: 'Professional haircut with styling and finish' },
  { id: '2', name: 'Hair Coloring', duration: '90 min', price: '$120', category: 'hair', description: 'Full color treatment with premium products' },
  { id: '3', name: 'Balayage', duration: '150 min', price: '$200', category: 'hair', description: 'Hand-painted highlights for natural look' },
  { id: '4', name: 'Keratin Treatment', duration: '120 min', price: '$180', category: 'hair', description: 'Smoothing treatment for frizz-free hair' },
  { id: '5', name: 'Gel Manicure', duration: '45 min', price: '$35', category: 'nails', description: 'Long-lasting gel polish application' },
  { id: '6', name: 'Nail Art', duration: '60 min', price: '$50', category: 'nails', description: 'Custom nail designs and decorations' },
  { id: '7', name: 'Classic Facial', duration: '60 min', price: '$80', category: 'skincare', description: 'Deep cleansing and hydration treatment' },
  { id: '8', name: 'Anti-Aging Facial', duration: '90 min', price: '$150', category: 'skincare', description: 'Advanced treatment for youthful skin' },
  { id: '9', name: 'Bridal Makeup', duration: '90 min', price: '$200', category: 'makeup', description: 'Professional bridal makeup service' },
  { id: '10', name: 'Natural Makeup', duration: '45 min', price: '$70', category: 'makeup', description: 'Everyday natural makeup look' },
  { id: '11', name: 'Lash Extension', duration: '60 min', price: '$100', category: 'beauty', description: 'Semi-permanent lash extensions' },
  { id: '12', name: 'Brow Sculpting', duration: '30 min', price: '$30', category: 'beauty', description: 'Professional brow shaping and tinting' },
];

const products: Product[] = [
  { id: '1', name: 'Moroccanoil Treatment', brand: 'Moroccanoil', price: '$42', category: 'hair', description: 'Argan oil treatment for all hair types' },
  { id: '2', name: 'Olaplex No.3', brand: 'Olaplex', price: '$30', category: 'hair', description: 'Hair perfector treatment' },
  { id: '3', name: 'OPI Nail Envy', brand: 'OPI', price: '$22', category: 'nails', description: 'Strengthening nail treatment' },
  { id: '4', name: 'Dermalogica Cleanser', brand: 'Dermalogica', price: '$38', category: 'skincare', description: 'Daily skin cleanser' },
  { id: '5', name: 'Charlotte Tilbury Lipstick', brand: 'Charlotte Tilbury', price: '$34', category: 'makeup', description: 'Pillow Talk lipstick' },
  { id: '6', name: 'Shiseido Sunscreen', brand: 'Shiseido', price: '$35', category: 'skincare', description: 'Advanced sunscreen SPF 50' },
  { id: '7', name: 'Olaplex No.8', brand: 'Olaplex', price: '$38', category: 'hair', description: 'Bond intense moisture mask' },
  { id: '8', name: 'Tatcha Water Cream', brand: 'Tatcha', price: '$69', category: 'skincare', description: 'Japanese rice cream moisturizer' },
];

const styleRecommendations: Record<string, string[]> = {
  'oval': ['Layered cuts', 'Side-swept bangs', 'Long bobs', 'Curtain fringes'],
  'round': ['Long layers', 'V-shape cuts', 'Side part', 'Angular bobs'],
  'square': ['Soft layers', 'Waves', 'Side-swept fringe', 'Textured crops'],
  'heart': ['Curtain bangs', 'Long layers', 'Wave curls', 'Chin-length cuts'],
  'long': ['Side-swept bangs', 'Wide curls', 'Lob cuts', 'Bouncy layers'],
};

// Helper functions
function initConversation(phone: string): ConversationState {
  const state: ConversationState = {
    userPhone: phone,
    step: 'initial',
    data: {},
    language: 'en'
  };
  conversations.set(phone, state);
  return state;
}

function getConversation(phone: string): ConversationState {
  return conversations.get(phone) || initConversation(phone);
}

function updateConversation(phone: string, updates: Partial<ConversationState>): ConversationState {
  const current = getConversation(phone);
  const updated = { ...current, ...updates };
  conversations.set(phone, updated);
  return updated;
}

function clearConversation(phone: string): void {
  conversations.delete(phone);
}

// Message templates
function getWelcomeMessage(): string {
  return `✨ *Welcome to GLAMAI Beauty Salon!* ✨

I'm your beauty assistant. How can I help you today?

1️⃣ *Book an Appointment* 💅
2️⃣ *Service Information* 💇‍♀️
3️⃣ *Style Recommendations* 🎨
4️⃣ *Product Inquiries* 🛍️
5️⃣ *Talk to Human* 👤

Reply with a number or describe what you need!`;
}

function getServiceList(): string {
  const categories: Record<string, string[]> = {};
  services.forEach(s => {
    if (!categories[s.category]) categories[s.category] = [];
    categories[s.category].push(`▫️ ${s.name} - ${s.duration} - ${s.price}`);
  });

  let message = `💇 *Our Beauty Services*\n\n`;

  if (categories.hair) message += `*Hair*\n${categories.hair.join('\n')}\n\n`;
  if (categories.nails) message += `*Nails*\n${categories.nails.join('\n')}\n\n`;
  if (categories.skincare) message += `*Skincare*\n${categories.skincare.join('\n')}\n\n`;
  if (categories.makeup) message += `*Makeup*\n${categories.makeup.join('\n')}\n\n`;
  if (categories.beauty) message += `*Beauty*\n${categories.beauty.join('\n')}\n\n`;

  message += `Reply with the service name to book!`;
  return message;
}

function getStyleQuiz(): string {
  return `🎨 *Let's find your perfect style!*

Answer a few questions for personalized recommendations:

*Question 1: Your face shape?*
A) Oval ⭕
B) Round 🔵
C) Square ▢
D) Heart ❤️
E) Long ⬭

Reply with A, B, C, D, or E`;
}

function getProductRecommendations(service?: string): string {
  let relevantProducts = products;

  if (service) {
    const serviceObj = services.find(s => s.name.toLowerCase().includes(service.toLowerCase()));
    if (serviceObj) {
      relevantProducts = products.filter(p => p.category === serviceObj.category);
    }
  }

  if (relevantProducts.length === 0) relevantProducts = products;

  return `🛍️ *Recommended Products*

${relevantProducts.map(p => `*${p.name}* by ${p.brand}\n💰 ${p.price}\n📝 ${p.description}`).join('\n\n')}

Visit us to purchase or ask about our product bundles!`;
}

// Conversation flow handlers
function handleBookingFlow(phone: string, message: string): string {
  const state = getConversation(phone);

  switch (state.step) {
    case 'initial':
      updateConversation(phone, { step: 'name' });
      return `📅 *Booking an Appointment*

Great choice! Let's get you scheduled.

Please tell me your *full name*:`;

    case 'name':
      updateConversation(phone, { step: 'service', data: { ...state.data, customerName: message } });
      return `Nice to meet you, *${message}*! 😊

What service would you like? Here are our popular services:

1️⃣ Haircut & Styling - $45
2️⃣ Hair Coloring - $120
3️⃣ Gel Manicure - $35
4️⃣ Classic Facial - $80
5️⃣ Bridal Makeup - $200

Reply with the service name or number:`;

    case 'service':
      const serviceInput = message.toLowerCase();
      const matchedService = services.find(s =>
        s.name.toLowerCase().includes(serviceInput) ||
        s.id === serviceInput
      );

      if (!matchedService) {
        return `Sorry, I couldn't find that service. Please choose from our list or describe what you're looking for.`;
      }

      updateConversation(phone, { step: 'stylist', data: { ...state.data, service: matchedService.name } });
      return `*${matchedService.name}* - ${matchedService.duration} for ${matchedService.price}

Would you like a specific stylist? Or any available?

Available stylists:
👩‍🎨 Sophia - Hair coloring & highlights
👩‍🎨 Emma - Cutting & styling
👩‍🎨 Olivia - Nails & pedicure
👩‍🎨 Ava - Facials & skincare
👩‍🎨 Isabella - Makeup & bridal

Reply with a name or "any"`;

    case 'stylist':
      const stylistInput = message.toLowerCase();
      const selectedStylist = stylistInput === 'any' ? 'Any Available' :
        ['sophia', 'emma', 'olivia', 'ava', 'isabella'].find(n => stylistInput.includes(n)) || 'Any Available';

      const stylistName = selectedStylist === 'Any Available' ? selectedStylist :
        selectedStylist.charAt(0).toUpperCase() + selectedStylist.slice(1);

      updateConversation(phone, { step: 'datetime', data: { ...state.data, stylist: stylistName } });
      return `Perfect! *${stylistName}* it is!

When would you like your appointment?

Please provide date and time (e.g., "June 15, 2pm" or "Friday at 4pm")`;

    case 'datetime':
      updateConversation(phone, { step: 'confirm', data: { ...state.data, dateTime: message } });

      return `📋 *Booking Summary*

👤 Customer: ${state.data.customerName}
💇 Service: ${state.data.service}
👩‍🎨 Stylist: ${state.data.stylist}
📅 Date/Time: ${message}

*Reply CONFIRM to complete your booking*
or *CHANGE* to modify your booking`;

    case 'confirm':
      if (message.toLowerCase() === 'confirm') {
        const booking: Booking = {
          id: uuidv4(),
          customerName: state.data.customerName!,
          phone,
          service: state.data.service!,
          stylist: state.data.stylist!,
          dateTime: state.data.dateTime!,
          status: 'confirmed'
        };

        bookings.push(booking);
        clearConversation(phone);

        return `✅ *Booking Confirmed!*

🎀 GLAMAI Beauty Salon

📅 ${booking.dateTime}
💇 ${booking.service}
👩‍🎨 ${booking.stylist}

We'll see you soon! Reply *MENU* to return to main menu.`;
      } else if (message.toLowerCase() === 'change') {
        updateConversation(phone, { step: 'initial', data: {} });
        return `No problem! Let's start over. Please tell me your *full name*:`;
      }
      return `Please reply *CONFIRM* to complete or *CHANGE* to start over.`;

    default:
      return getWelcomeMessage();
  }
}

function handleStyleRecommendations(phone: string, message: string): string {
  const state = getConversation(phone);

  if (state.step !== 'style_quiz') {
    updateConversation(phone, { step: 'style_quiz' });
    return getStyleQuiz();
  }

  // Process face shape answer
  const faceShapes: Record<string, string> = {
    'a': 'oval', '1': 'oval',
    'b': 'round', '2': 'round',
    'c': 'square', '3': 'square',
    'd': 'heart', '4': 'heart',
    'e': 'long', '5': 'long'
  };

  const input = message.toLowerCase().trim();
  const faceShape = Object.entries(faceShapes).find(([k]) => k === input || faceShapes[input] === faceShapes[k])?.[1];

  if (!faceShape) {
    return `I didn't understand your answer. Please reply with A, B, C, D, or E.`;
  }

  const recommendations = styleRecommendations[faceShape] || styleRecommendations['oval'];

  updateConversation(phone, { step: 'quiz_result' });

  return `🌟 *Your Perfect Styles*

Based on your ${faceShape} face shape, we recommend:

${recommendations.map(r => `✨ ${r}`).join('\n')}

*Book a consultation* with our stylists to find your perfect look!

💇 Reply *BOOK* to schedule an appointment
🔄 Reply *MENU* to return to main menu`;
}

// POST /api/webhook - WhatsApp webhook endpoint
app.post('/api/webhook', (req: Request, res: Response) => {
  const { from, message, messageId } = req.body;

  if (!from || !message) {
    return res.status(400).json({ error: 'Missing required fields: from, message' });
  }

  const phone = from;
  const state = getConversation(phone);
  let response: string;

  const normalizedMessage = message.trim().toLowerCase();

  // Menu command
  if (normalizedMessage === 'menu' || normalizedMessage === 'start' || normalizedMessage === 'help') {
    clearConversation(phone);
    response = getWelcomeMessage();
  }

  // Handle ongoing conversation flows
  else if (state.step !== 'initial' && !['1', '2', '3', '4', '5'].includes(normalizedMessage)) {
    if (state.step.startsWith('style')) {
      response = handleStyleRecommendations(phone, message);
    } else {
      response = handleBookingFlow(phone, message);
    }
  }

  // Main menu selection
  else {
    switch (normalizedMessage) {
      case '1':
        response = handleBookingFlow(phone, '');
        break;

      case '2':
        response = getServiceList();
        break;

      case '3':
        response = handleStyleRecommendations(phone, '');
        break;

      case '4':
        response = getProductRecommendations();
        break;

      case '5':
        response = `👤 Connecting you with our beauty consultant...

In the meantime, you can:
💇 Browse our services: Reply *2*
📅 Book an appointment: Reply *1*

We'll be with you shortly! 🌸`;
        break;

      default:
        response = getWelcomeMessage();
    }
  }

  res.json({
    to: phone,
    message: response,
    messageId: messageId || uuidv4()
  });
});

// GET /api/webhook - WhatsApp webhook verification
app.get('/api/webhook', (req: Request, res: Response) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  // Verify token (set your own in production)
  if (mode === 'subscribe' && token === 'glamai_webhook_token') {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST /api/bookings - Create booking via API
app.post('/api/bookings', (req: Request, res: Response) => {
  const { customerName, phone, service, stylist, dateTime } = req.body;

  if (!customerName || !phone || !service) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customerName, phone, service'
    });
  }

  const matchedService = services.find(s => s.name.toLowerCase() === service.toLowerCase());
  if (!matchedService) {
    return res.status(400).json({
      success: false,
      error: 'Service not found'
    });
  }

  const booking: Booking = {
    id: uuidv4(),
    customerName,
    phone,
    service: matchedService.name,
    stylist: stylist || 'Any Available',
    dateTime: dateTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed'
  };

  bookings.push(booking);

  res.json({
    success: true,
    booking,
    message: `Booking confirmed for ${customerName}`
  });
});

// GET /api/bookings - Get all bookings
app.get('/api/bookings', (req: Request, res: Response) => {
  const { phone, date, status } = req.query;

  let filtered = bookings;

  if (phone) filtered = filtered.filter(b => b.phone === phone);
  if (date) filtered = filtered.filter(b => b.dateTime.startsWith(date as string));
  if (status) filtered = filtered.filter(b => b.status === status);

  res.json({ bookings: filtered, count: filtered.length });
});

// GET /api/services - Get all services
app.get('/api/services', (req: Request, res: Response) => {
  const { category } = req.query;

  if (category) {
    return res.json({
      services: services.filter(s => s.category === category),
      count: services.filter(s => s.category === category).length
    });
  }

  res.json({ services, count: services.length });
});

// GET /api/products - Get all products
app.get('/api/products', (req: Request, res: Response) => {
  const { category } = req.query;

  if (category) {
    return res.json({
      products: products.filter(p => p.category === category),
      count: products.filter(p => p.category === category).length
    });
  }

  res.json({ products, count: products.length });
});

// GET /api/recommendations - Get style recommendations
app.get('/api/recommendations', (req: Request, res: Response) => {
  const { faceShape } = req.query;

  if (faceShape) {
    const recs = styleRecommendations[faceShape as string];
    return res.json({
      faceShape,
      recommendations: recs || []
    });
  }

  res.json({
    recommendations: styleRecommendations
  });
});

// POST /api/conversations - Get conversation state
app.get('/api/conversations/:phone', (req: Request, res: Response) => {
  const state = getConversation(req.params.phone);
  res.json({ conversation: state });
});

// DELETE /api/conversations/:phone - Clear conversation
app.delete('/api/conversations/:phone', (req: Request, res: Response) => {
  clearConversation(req.params.phone);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'GLAMAI WhatsApp AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    activeConversations: conversations.size,
    totalBookings: bookings.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ GLAMAI WhatsApp AI running on port ${PORT}`);
  console.log(`💬 WhatsApp webhook at http://localhost:${PORT}/api/webhook`);
  console.log(`📅 Bookings API at http://localhost:${PORT}/api/bookings`);
  console.log(`🎨 Recommendations API at http://localhost:${PORT}/api/recommendations`);
});

export default app;