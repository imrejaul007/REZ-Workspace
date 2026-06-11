/**
 * HOJAI Real Estate WhatsApp AI Agent
 * WhatsApp chatbot for listings, inquiries, and scheduling
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4922;

app.use(express.json());

// Types
interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'location' | 'button_response';
  timestamp: string;
  sessionId: string;
}

interface ConversationSession {
  id: string;
  phone: string;
  state: 'welcome' | 'browsing' | 'property_detail' | 'scheduling' | 'lead_capture' | 'complete';
  context: {
    selectedCity?: string;
    selectedPropertyId?: string;
    preferredTimes?: string[];
    userData?: Record<string, string>;
  };
  history: WhatsAppMessage[];
  createdAt: string;
  lastActivity: string;
}

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  priceFormatted: string;
  location: { city: string; locality: string };
  bedrooms?: number;
  bathrooms?: number;
  area: { value: number; unit: string };
  features: string[];
  images: string[];
  available: boolean;
}

interface Lead {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  interest: string;
  budget?: { min: number; max: number };
  source: 'whatsapp';
  status: 'new' | 'contacted' | 'qualified';
  preferredContact: 'call' | 'whatsapp';
  notes: string[];
  createdAt: string;
}

interface ShowingRequest {
  id: string;
  leadId: string;
  propertyId: string;
  propertyTitle: string;
  leadName: string;
  leadPhone: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

// Storage
const sessions = new Map<string, ConversationSession>();
const messages = new Map<string, WhatsAppMessage[]>();
const leads = new Map<string, Lead>();
const showings = new Map<string, ShowingRequest>();

// Sample properties
const properties: Map<string, Property> = new Map([
  ['prop-001', {
    id: 'prop-001',
    title: '3BHK Luxury Apartment in Bandra',
    type: 'apartment',
    price: 15000000,
    priceFormatted: '₹1.5 Cr',
    location: { city: 'Mumbai', locality: 'Bandra West' },
    bedrooms: 3,
    bathrooms: 3,
    area: { value: 1500, unit: 'sqft' },
    features: ['Sea View', 'Gym', 'Pool', '24/7 Security', 'Parking', 'Modular Kitchen'],
    images: ['https://propflow.com/images/prop001-1.jpg'],
    available: true,
  }],
  ['prop-002', {
    id: 'prop-002',
    title: '2BHK Modern Flat in Andheri',
    type: 'apartment',
    price: 8500000,
    priceFormatted: '₹85 Lakhs',
    location: { city: 'Mumbai', locality: 'Andheri West' },
    bedrooms: 2,
    bathrooms: 2,
    area: { value: 1100, unit: 'sqft' },
    features: ['Metro Access', 'Shopping Mall', 'School Nearby', 'Parking'],
    images: ['https://propflow.com/images/prop002-1.jpg'],
    available: true,
  }],
  ['prop-003', {
    id: 'prop-003',
    title: '4BHK Villa with Private Pool',
    type: 'villa',
    price: 35000000,
    priceFormatted: '₹3.5 Cr',
    location: { city: 'Mumbai', locality: 'Juhu' },
    bedrooms: 4,
    bathrooms: 4,
    area: { value: 3500, unit: 'sqft' },
    features: ['Private Pool', 'Garden', 'Staff Quarters', 'Beach Access', 'Home Theater'],
    images: ['https://propflow.com/images/prop003-1.jpg'],
    available: true,
  }],
  ['prop-004', {
    id: 'prop-004',
    title: 'Commercial Office in CP',
    type: 'commercial',
    price: 25000000,
    priceFormatted: '₹2.5 Cr',
    location: { city: 'Delhi', locality: 'Connaught Place' },
    bedrooms: undefined,
    bathrooms: 2,
    area: { value: 2000, unit: 'sqft' },
    features: ['Fully Furnished', 'Central AC', 'Power Backup', 'Security', 'Lift'],
    images: ['https://propflow.com/images/prop004-1.jpg'],
    available: true,
  }],
  ['prop-005', {
    id: 'prop-005',
    title: 'Penthouse Suite on MG Road',
    type: 'penthouse',
    price: 50000000,
    priceFormatted: '₹5 Cr',
    location: { city: 'Bangalore', locality: 'MG Road' },
    bedrooms: 4,
    bathrooms: 4,
    area: { value: 3000, unit: 'sqft' },
    features: ['Private Terrace', 'City View', 'Premium Amenities', 'Concierge'],
    images: ['https://propflow.com/images/prop005-1.jpg'],
    available: true,
  }],
  ['prop-006', {
    id: 'prop-006',
    title: '3BHK Apartment in Koregaon Park',
    type: 'apartment',
    price: 9500000,
    priceFormatted: '₹95 Lakhs',
    location: { city: 'Pune', locality: 'Koregaon Park' },
    bedrooms: 3,
    bathrooms: 3,
    area: { value: 1350, unit: 'sqft' },
    features: ['Garden View', 'Club House', 'Swimming Pool', 'Gym'],
    images: ['https://propflow.com/images/prop006-1.jpg'],
    available: true,
  }],
]);

// City property mapping
const cityProperties: Record<string, string[]> = {
  'mumbai': ['prop-001', 'prop-002', 'prop-003'],
  'delhi': ['prop-004'],
  'bangalore': ['prop-005'],
  'pune': ['prop-006'],
};

// Command handlers
const commands = {
  'start': { description: 'Start conversation', aliases: ['hi', 'hello', 'help'] },
  'list': { description: 'Browse properties', aliases: ['listings', 'properties', 'search'] },
  'detail': { description: 'Property details', aliases: ['info', 'details'] },
  'schedule': { description: 'Schedule a showing', aliases: ['visit', 'book', 'appointment'] },
  'contact': { description: 'Contact an agent', aliases: ['agent', 'call', 'phone'] },
  'budget': { description: 'Set budget range', aliases: ['price', 'cost'] },
  'calc': { description: 'EMI calculator', aliases: ['emi', 'loan'] },
  'exit': { description: 'End conversation', aliases: ['bye', 'thanks', 'thank you'] },
};

// Response templates
function formatPropertyCard(prop: Property): string {
  let card = `🏠 *${prop.title}*\n`;
  card += `💰 Price: *${prop.priceFormatted}*\n`;
  card += `📍 ${prop.location.locality}, ${prop.location.city}\n`;
  if (prop.bedrooms) card += `🛏️ ${prop.bedrooms} BHK | `;
  card += `📐 ${prop.area.value} ${prop.area.unit}\n`;
  card += `━━━━━━━━━━━━━━━`;
  return card;
}

function formatPropertyDetail(prop: Property): string {
  let detail = `🏡 *${prop.title}*\n\n`;
  detail += `💰 *Price:* ${prop.priceFormatted}\n`;
  detail += `📍 *Location:* ${prop.location.locality}, ${prop.location.city}\n\n`;
  detail += `*Property Details:*\n`;
  if (prop.bedrooms) detail += `🛏️ Bedrooms: ${prop.bedrooms}\n`;
  if (prop.bathrooms) detail += `🚿 Bathrooms: ${prop.bathrooms}\n`;
  detail += `📐 Area: ${prop.area.value} ${prop.area.unit}\n`;
  detail += `🏠 Type: ${prop.type.charAt(0).toUpperCase() + prop.type.slice(1)}\n\n`;
  detail += `*Amenities:*\n`;
  prop.features.forEach(f => detail += `✓ ${f}\n`);
  detail += `\nType *schedule* to book a showing!`;
  return detail;
}

function getWelcomeMessage(): string {
  return `🏠 *Welcome to PropFlow Real Estate!*

I'm your WhatsApp assistant. I can help you find your dream property!

Here's what I can do:

🔍 *Search Properties* - Browse listings by city
📋 *Property Details* - Get complete info
📅 *Schedule Showing* - Book a property visit
💬 *Ask Questions* - Get answers about properties

*Available in:* Mumbai, Delhi, Bangalore, Pune

What would you like to do?`;
}

function getHelpMessage(): string {
  let help = `📋 *Available Commands:*\n\n`;
  help += `🔍 *list* - Browse properties\n`;
  help += `   Example: "list Mumbai" or "list 3BHK"\n\n`;
  help += `📝 *detail <id>* - Get property details\n`;
  help += `   Example: "detail prop-001"\n\n`;
  help += `📅 *schedule* - Book a showing\n`;
  help += `   Example: "schedule prop-001"\n\n`;
  help += `📞 *contact* - Talk to an agent\n\n`;
  help += `💰 *budget* - Set your budget\n\n`;
  help += `🔢 *calc* - Calculate EMI\n\n`;
  help += `Type *list* to start browsing!`;
  return help;
}

// Parse user message and determine intent
function parseIntent(message: string): { command: string; args: string[] } {
  const lower = message.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Check for exact command match
  for (const [cmd, info] of Object.entries(commands)) {
    if (words[0] === cmd || info.aliases.includes(words[0])) {
      return { command: cmd, args: words.slice(1) };
    }
  }

  // Intent-based routing
  if (lower.includes('search') || lower.includes('find') || lower.includes('show me')) {
    return { command: 'list', args: words.slice(1) };
  }
  if (lower.includes('detail') || lower.includes('information')) {
    return { command: 'detail', args: words.slice(1) };
  }
  if (lower.includes('schedule') || lower.includes('visit') || lower.includes('book')) {
    return { command: 'schedule', args: words.slice(1) };
  }
  if (lower.includes('contact') || lower.includes('agent') || lower.includes('call')) {
    return { command: 'contact', args: [] };
  }
  if (lower.includes('budget') || lower.includes('price range')) {
    return { command: 'budget', args: words.slice(1) };
  }
  if (lower.includes('emi') || lower.includes('loan') || lower.includes('calculate')) {
    return { command: 'calc', args: words.slice(1) };
  }

  return { command: 'unknown', args: [lower] };
}

// Process message and generate response
function processMessage(session: ConversationSession, userMessage: string): string {
  const { command, args } = parseIntent(userMessage);

  switch (command) {
    case 'start':
      session.state = 'welcome';
      return getWelcomeMessage();

    case 'list':
      return handleListProperties(session, args);

    case 'detail':
      return handlePropertyDetail(session, args);

    case 'schedule':
      return handleSchedule(session, args);

    case 'contact':
      return handleContactAgent(session);

    case 'budget':
      return handleBudget(session, args);

    case 'calc':
      return handleEMICalculator(session, args);

    case 'exit':
      session.state = 'complete';
      return `🙏 Thank you for chatting with PropFlow!\n\nYour dream property is just a conversation away. Feel free to message us anytime.\n\nType *start* to browse again.`;

    default:
      if (session.state === 'lead_capture') {
        return handleLeadCapture(session, userMessage);
      }
      return `I didn't understand that. Type *list* to browse properties or *help* for all commands.`;
  }
}

function handleListProperties(session: ConversationSession, args: string[]): string {
  session.state = 'browsing';
  let filteredProps = Array.from(properties.values()).filter(p => p.available);

  // Filter by city if provided
  const cityArg = args.find(a => ['mumbai', 'delhi', 'bangalore', 'pune'].includes(a.toLowerCase()));
  if (cityArg) {
    const propIds = cityProperties[cityArg.toLowerCase()];
    if (propIds) {
      filteredProps = filteredProps.filter(p => propIds.includes(p.id));
      session.context.selectedCity = cityArg;
    }
  }

  // Filter by type/bedrooms
  const typeMatch = args.find(a => a.endsWith('bhk'));
  if (typeMatch) {
    const beds = parseInt(typeMatch);
    filteredProps = filteredProps.filter(p => p.bedrooms === beds);
  }

  if (filteredProps.length === 0) {
    return `No properties found matching your criteria. Try:\n• *list Mumbai* - Properties in Mumbai\n• *list 2BHK* - 2 bedroom properties\n\nType *list* to see all.`;
  }

  let response = `🏠 *Available Properties (${filteredProps.length}):*\n\n`;
  filteredProps.slice(0, 5).forEach((p, i) => {
    response += `${i + 1}. ${formatPropertyCard(p)}\n\n`;
    response += `📲 *detail ${p.id}* - More info\n\n`;
  });

  if (filteredProps.length > 5) {
    response += `Showing 1-5 of ${filteredProps.length}. Type a city name to filter.`;
  }

  return response;
}

function handlePropertyDetail(session: ConversationSession, args: string[]): string {
  // Find property by ID or last selected
  let prop: Property | undefined;
  const idArg = args.find(a => a.startsWith('prop-'));

  if (idArg) {
    prop = properties.get(idArg);
  } else if (session.context.selectedPropertyId) {
    prop = properties.get(session.context.selectedPropertyId);
  }

  if (!prop) {
    return `Please specify a property ID.\nExample: *detail prop-001*\n\nType *list* to see available properties.`;
  }

  session.state = 'property_detail';
  session.context.selectedPropertyId = prop.id;
  return formatPropertyDetail(prop);
}

function handleSchedule(session: ConversationSession, args: string[]): string {
  let prop: Property | undefined;

  // Get property from args or last viewed
  const idArg = args.find(a => a.startsWith('prop-'));
  if (idArg) {
    prop = properties.get(idArg);
    session.context.selectedPropertyId = idArg;
  } else if (session.context.selectedPropertyId) {
    prop = properties.get(session.context.selectedPropertyId);
  }

  if (!prop) {
    return `Which property would you like to schedule a showing for?\n\nType *list* to browse properties, then use *schedule <property-id>*`;
  }

  session.state = 'scheduling';
  return `📅 *Schedule Showing for ${prop.title}*

Great choice! I'll help you book a visit.

Please provide:
1. Your *name*
2. Your *phone number*
3. Preferred *date* (DD/MM/YYYY)
4. Preferred *time* (e.g., 10:00 AM or 14:00)

Example: "Rajesh, 9876543210, 15/06/2024, 11:00 AM"`;
}

function handleLeadCapture(session: ConversationSession, message: string): string {
  const { userData } = session.context;

  if (!userData?.name) {
    session.context.userData = { name: message };
    return `Thanks ${message}! What's your phone number?`;
  }

  if (!userData?.phone) {
    session.context.userData.phone = message;
    return `Great! When would you like to visit? (Date and time)`;
  }

  if (!userData?.schedule) {
    session.context.userData.schedule = message;
    return `Perfect! I'll confirm your visit shortly. What's your email? (Optional)`;
  }

  if (message !== 'skip' && !userData?.email) {
    session.context.userData.email = message;
  }

  // Create lead and showing
  const lead: Lead = {
    id: uuidv4(),
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    interest: session.context.selectedPropertyId || 'General',
    source: 'whatsapp',
    status: 'new',
    preferredContact: 'whatsapp',
    notes: [`Showing requested via WhatsApp`, `Property: ${session.context.selectedPropertyId}`],
    createdAt: new Date().toISOString(),
  };
  leads.set(lead.id, lead);

  if (session.context.selectedPropertyId) {
    const prop = properties.get(session.context.selectedPropertyId);
    const showing: ShowingRequest = {
      id: uuidv4(),
      leadId: lead.id,
      propertyId: session.context.selectedPropertyId,
      propertyTitle: prop?.title || 'Unknown',
      leadName: userData.name,
      leadPhone: userData.phone,
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    showings.set(showing.id, showing);
  }

  session.state = 'complete';

  return `✅ *Showing Request Confirmed!*

👤 Name: ${userData.name}
📱 Phone: ${userData.phone}
🏠 Property: ${properties.get(session.context.selectedPropertyId || '')?.title || 'TBD'}
📅 Schedule: ${userData.schedule}

Our team will contact you shortly to confirm the visit.

Type *start* to browse more properties!`;
}

function handleContactAgent(session: ConversationSession): string {
  return `📞 *Connect with an Agent*

Our property experts are ready to help!

🏢 *Mumbai Office:* +91 98765 43210
🏢 *Delhi Office:* +91 11 2345 6789
🏢 *Bangalore Office:* +91 80 4567 8901

Or share your details and we'll have someone call you:
• Name
• Phone
• City of interest

We're available Mon-Sat, 9AM-7PM.`;
}

function handleBudget(session: ConversationSession, args: string[]): string {
  const budgetRanges = [
    { label: 'Under 50L', min: 0, max: 5000000 },
    { label: '50L - 1Cr', min: 5000000, max: 10000000 },
    { label: '1Cr - 2Cr', min: 10000000, max: 20000000 },
    { label: '2Cr - 5Cr', min: 20000000, max: 50000000 },
    { label: 'Above 5Cr', min: 50000000, max: Infinity },
  ];

  let response = `💰 *Budget Ranges:*\n\n`;
  budgetRanges.forEach((b, i) => {
    response += `${i + 1}. ${b.label}\n`;
  });

  response += `\nExample: "budget 1Cr - 2Cr"`;

  // Parse budget from args
  if (args.length > 0) {
    const budgetStr = args.join(' ').toLowerCase();
    let matched = budgetRanges.find(b =>
      budgetStr.includes(b.label.toLowerCase()) ||
      (b.min === 0 && budgetStr.includes('under')) ||
      (b.max === Infinity && budgetStr.includes('above'))
    );

    if (matched) {
      const props = Array.from(properties.values())
        .filter(p => p.price >= matched.min && p.price < matched.max);

      if (props.length > 0) {
        response += `\n\n🏠 *Properties in ${matched.label}:*\n\n`;
        props.forEach(p => {
          response += `• ${p.title} - ${p.priceFormatted}\n`;
        });
      } else {
        response += `\n\nNo properties in this range currently, but we may have new listings soon!`;
      }
    }
  }

  return response;
}

function handleEMICalculator(session: ConversationSession, args: string[]): string {
  let amount = 10000000; // Default 1 Cr
  let rate = 8.5; // Default 8.5%
  let tenure = 20; // Default 20 years

  if (args.length >= 1) {
    const num = parseInt(args[0].replace(/[^\d]/g, ''));
    if (!isNaN(num)) amount = num * 100000; // Assume lakhs
  }

  const monthlyRate = rate / (12 * 100);
  const numPayments = tenure * 12;
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPayment = emi * numPayments;
  const totalInterest = totalPayment - amount;

  return `🏦 *EMI Calculator*

💵 Loan Amount: ₹${(amount / 10000000).toFixed(1)} Cr
📊 Interest Rate: ${rate}% p.a.
⏱️ Tenure: ${tenure} years

*Monthly EMI:* ₹${Math.round(emi).toLocaleString('en-IN')}
*Total Interest:* ₹${Math.round(totalInterest).toLocaleString('en-IN')}
*Total Payment:* ₹${Math.round(totalPayment).toLocaleString('en-IN')}

Want to calculate for different values? Reply with: *calc <amount in lakhs>*`;
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'whatsapp-ai', port: PORT });
});

// Webhook for incoming WhatsApp messages
app.post('/webhook', (req: Request, res: Response) => {
  try {
    const { from, message, type = 'text' } = req.body;

    // Get or create session
    let session = Array.from(sessions.values()).find(s => s.phone === from);
    if (!session) {
      session = {
        id: uuidv4(),
        phone: from,
        state: 'welcome',
        context: {},
        history: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      sessions.set(session.id, session);
    }

    // Create message record
    const msg: WhatsAppMessage = {
      id: uuidv4(),
      from,
      to: 'propflow',
      content: message,
      type,
      timestamp: new Date().toISOString(),
      sessionId: session.id,
    };
    messages.set(session.id, [...(messages.get(session.id) || []), msg]);

    // Process message
    const response = processMessage(session, message);

    // Update session
    session.lastActivity = new Date().toISOString();
    sessions.set(session.id, session);

    res.json({
      success: true,
      response,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get conversation session
app.get('/sessions/:id', (req: Request, res: Response) => {
  try {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get all sessions
app.get('/sessions', (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    let result = Array.from(sessions.values());

    if (active === 'true') {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      result = result.filter(s => s.lastActivity > cutoff);
    }

    res.json({ sessions: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get messages for a session
app.get('/sessions/:id/messages', (req: Request, res: Response) => {
  try {
    const msgs = messages.get(req.params.id) || [];
    res.json({ messages: msgs, count: msgs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all leads
app.get('/leads', (req: Request, res: Response) => {
  try {
    const result = Array.from(leads.values());
    res.json({ leads: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get showing requests
app.get('/showings', (req: Request, res: Response) => {
  try {
    const result = Array.from(showings.values());
    res.json({ showings: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch showings' });
  }
});

// Update showing status
app.patch('/showings/:id', (req: Request, res: Response) => {
  try {
    const showing = showings.get(req.params.id);
    if (!showing) return res.status(404).json({ error: 'Showing not found' });

    const updated = { ...showing, ...req.body };
    showings.set(showing.id, updated);
    res.json({ success: true, showing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update showing' });
  }
});

// Get all properties
app.get('/properties', (req: Request, res: Response) => {
  try {
    const result = Array.from(properties.values());
    res.json({ properties: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// WhatsApp agent stats
app.get('/stats', (_req: Request, res: Response) => {
  try {
    const sessionArray = Array.from(sessions.values());
    const leadArray = Array.from(leads.values());
    const showingArray = Array.from(showings.values());

    const today = new Date().toISOString().split('T')[0];
    const activeSessions = sessionArray.filter(s =>
      new Date(s.lastActivity).toISOString().startsWith(today)
    );

    res.json({
      sessions: {
        total: sessionArray.length,
        active: activeSessions.length,
        completed: sessionArray.filter(s => s.state === 'complete').length,
      },
      leads: {
        total: leadArray.length,
        new: leadArray.filter(l => l.status === 'new').length,
        contacted: leadArray.filter(l => l.status === 'contacted').length,
      },
      showings: {
        total: showingArray.length,
        pending: showingArray.filter(s => s.status === 'pending').length,
        confirmed: showingArray.filter(s => s.status === 'confirmed').length,
      },
      properties: {
        total: properties.size,
        available: Array.from(properties.values()).filter(p => p.available).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`💬 WhatsApp AI running on port ${PORT}`);
  console.log(`   - Property search & listings`);
  console.log(`   - Interactive conversations`);
  console.log(`   - Showing scheduling`);
  console.log(`   - Lead capture`);
  console.log(`   - EMI calculator`);
  console.log(`   - WhatsApp webhook integration`);
});

export { app, sessions, leads, showings, properties };