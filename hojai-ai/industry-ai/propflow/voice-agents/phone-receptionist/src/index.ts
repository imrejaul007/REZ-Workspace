/**
 * HOJAI Real Estate Phone Receptionist Voice Agent
 * IVR for property inquiries, scheduling showings, lead capture
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4921;

app.use(express.json());

// Types
interface Call {
  id: string;
  callerNumber: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  ivrPath: string[];
  currentNode: string;
  status: 'active' | 'completed' | 'missed' | 'transferred';
  capturedData: Record<string, string>;
  transferredTo?: string;
  voicemailUrl?: string;
}

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  location: { city: string; locality: string };
  bedrooms?: number;
  available: boolean;
}

interface ShowingRequest {
  id: string;
  callerName: string;
  callerPhone: string;
  propertyId: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interest: string;
  budget?: string;
  source: 'phone';
  status: 'new' | 'contacted' | 'qualified';
  notes: string[];
  createdAt: string;
}

// Storage
const calls = new Map<string, Call>();
const properties = new Map<string, Property>();
const showingRequests = new Map<string, ShowingRequest>();
const leads = new Map<string, Lead>();

// Sample properties for inquiries
const sampleProperties: Property[] = [
  { id: 'prop-001', title: '3BHK Luxury Apartment', type: 'apartment', price: 15000000, location: { city: 'Mumbai', locality: 'Bandra' }, bedrooms: 3, available: true },
  { id: 'prop-002', title: '2BHK Modern Flat', type: 'apartment', price: 8500000, location: { city: 'Mumbai', locality: 'Andheri' }, bedrooms: 2, available: true },
  { id: 'prop-003', title: '4BHK Villa with Pool', type: 'villa', price: 35000000, location: { city: 'Mumbai', locality: 'Juhu' }, bedrooms: 4, available: true },
  { id: 'prop-004', title: 'Commercial Office Space', type: 'commercial', price: 25000000, location: { city: 'Delhi', locality: 'Connaught Place' }, available: true },
  { id: 'prop-005', title: 'Penthouse Suite', type: 'apartment', price: 50000000, location: { city: 'Bangalore', locality: 'MG Road' }, bedrooms: 4, available: true },
];
sampleProperties.forEach(p => properties.set(p.id, p));

// IVR Menu Structure
interface IVRNode {
  id: string;
  prompt: string;
  options?: { key: string; label: string; nextNode: string }[];
  action?: 'capture_lead' | 'list_properties' | 'schedule_showing' | 'transfer_agent' | 'leave_voicemail' | 'end';
  dataKey?: string;
}

const ivrTree: Record<string, IVRNode> = {
  welcome: {
    id: 'welcome',
    prompt: 'Welcome to PropFlow Real Estate. For property listings and inquiries, press 1. To schedule a showing, press 2. To speak with an agent, press 3. For general information, press 4.',
    options: [
      { key: '1', label: 'Property Listings', nextNode: 'property_listings' },
      { key: '2', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '3', label: 'Speak to Agent', nextNode: 'transfer_agent' },
      { key: '4', label: 'General Info', nextNode: 'general_info' },
    ],
  },
  property_listings: {
    id: 'property_listings',
    prompt: 'We have properties in Mumbai, Delhi, Bangalore, and Pune. Which city interests you? Press 1 for Mumbai, 2 for Delhi, 3 for Bangalore, 4 for Pune.',
    options: [
      { key: '1', label: 'Mumbai', nextNode: 'mumbai_properties' },
      { key: '2', label: 'Delhi', nextNode: 'delhi_properties' },
      { key: '3', label: 'Bangalore', nextNode: 'bangalore_properties' },
      { key: '4', label: 'Pune', nextNode: 'pune_properties' },
    ],
  },
  mumbai_properties: {
    id: 'mumbai_properties',
    prompt: 'Mumbai Properties: 1. 3BHK Luxury Apartment in Bandra - 1.5 Cr. 2. 2BHK Modern Flat in Andheri - 85 Lakhs. 3. 4BHK Villa in Juhu - 3.5 Cr. For details on any property, press the number. To schedule a showing, press 9.',
    options: [
      { key: '1', label: '3BHK Bandra Details', nextNode: 'property_detail_1' },
      { key: '2', label: '2BHK Andheri Details', nextNode: 'property_detail_2' },
      { key: '3', label: '4BHK Juhu Details', nextNode: 'property_detail_3' },
      { key: '9', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '0', label: 'Return to Main Menu', nextNode: 'welcome' },
    ],
  },
  delhi_properties: {
    id: 'delhi_properties',
    prompt: 'Delhi Properties: 1. Commercial Office Space in Connaught Place - 2.5 Cr. Press 1 for details, 9 to schedule a showing, or 0 for main menu.',
    options: [
      { key: '1', label: 'Commercial CP Details', nextNode: 'property_detail_4' },
      { key: '9', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '0', label: 'Return to Main Menu', nextNode: 'welcome' },
    ],
  },
  bangalore_properties: {
    id: 'bangalore_properties',
    prompt: 'Bangalore Properties: 1. Penthouse Suite on MG Road - 5 Cr. Press 1 for details, 9 to schedule a showing, or 0 for main menu.',
    options: [
      { key: '1', label: 'Penthouse MG Road Details', nextNode: 'property_detail_5' },
      { key: '9', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '0', label: 'Return to Main Menu', nextNode: 'welcome' },
    ],
  },
  pune_properties: {
    id: 'pune_properties',
    prompt: 'Pune Properties: We currently have residential apartments available. Press 1 to know more or 9 to schedule a showing. Press 0 for main menu.',
    options: [
      { key: '1', label: 'Pune Listings Info', nextNode: 'pune_info' },
      { key: '9', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '0', label: 'Return to Main Menu', nextNode: 'welcome' },
    ],
  },
  property_detail_1: {
    id: 'property_detail_1',
    prompt: '3BHK Luxury Apartment in Bandra, West Mumbai. 1500 sq ft, 3 bedrooms, 3 bathrooms, modern kitchen, sea view. Price: 1.5 Crore. Amenities include gym, pool, 24/7 security. Press 1 to schedule a showing, 2 to add to favorites, or 0 for main menu.',
    options: [
      { key: '1', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '2', label: 'Add to Favorites', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  property_detail_2: {
    id: 'property_detail_2',
    prompt: '2BHK Modern Flat in Andheri West. 1100 sq ft, 2 bedrooms, 2 bathrooms, modular kitchen. Price: 85 Lakhs. Close to metro station and shopping mall. Press 1 to schedule a showing, 2 to add to favorites, or 0 for main menu.',
    options: [
      { key: '1', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '2', label: 'Add to Favorites', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  property_detail_3: {
    id: 'property_detail_3',
    prompt: '4BHK Villa with Private Pool in Juhu. 3500 sq ft, 4 bedrooms, 4 bathrooms, garden, staff quarters. Price: 3.5 Crore. Premium beachside location. Press 1 to schedule a showing, 2 to add to favorites, or 0 for main menu.',
    options: [
      { key: '1', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '2', label: 'Add to Favorites', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  property_detail_4: {
    id: 'property_detail_4',
    prompt: 'Commercial Office Space in Connaught Place, Delhi. 2000 sq ft, fully furnished, prime location. Price: 2.5 Crore. Ideal for corporate offices. Press 1 to schedule a showing, 2 to add to favorites, or 0 for main menu.',
    options: [
      { key: '1', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '2', label: 'Add to Favorites', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  property_detail_5: {
    id: 'property_detail_5',
    prompt: 'Penthouse Suite on MG Road, Bangalore. 3000 sq ft, 4 bedrooms, private terrace, city view. Price: 5 Crore. Premium location with luxury amenities. Press 1 to schedule a showing, 2 to add to favorites, or 0 for main menu.',
    options: [
      { key: '1', label: 'Schedule Showing', nextNode: 'schedule_showing' },
      { key: '2', label: 'Add to Favorites', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  pune_info: {
    id: 'pune_info',
    prompt: 'Pune has excellent residential options from 50 Lakhs to 2 Crores. We have apartments and villas in popular areas like Hinjewadi, Kothrud, and Baner. Our team will send you detailed listings. To schedule a callback, press 1 or 0 for main menu.',
    options: [
      { key: '1', label: 'Request Callback', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  schedule_showing: {
    id: 'schedule_showing',
    prompt: 'I will help you schedule a property showing. Please spell your first name using the dial pad. For example, for John, press 5-6-4-6.',
    action: 'capture_lead',
    dataKey: 'name',
    options: [],
  },
  capture_lead: {
    id: 'capture_lead',
    prompt: 'Thank you! May I have your phone number please?',
    action: 'capture_lead',
    dataKey: 'phone',
    options: [],
  },
  general_info: {
    id: 'general_info',
    prompt: 'PropFlow Real Estate offers property listings, valuations, and showings across major Indian cities. Our services are free for buyers. We charge 2% commission from sellers. For more information, please leave your name and number and our team will call you back. Press 1 to leave your details, or 0 for main menu.',
    options: [
      { key: '1', label: 'Leave Details', nextNode: 'capture_lead' },
      { key: '0', label: 'Main Menu', nextNode: 'welcome' },
    ],
  },
  transfer_agent: {
    id: 'transfer_agent',
    prompt: 'Connecting you to one of our agents. Please hold.',
    action: 'transfer_agent',
    options: [],
  },
};

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'phone-receptionist', port: PORT });
});

// Initiate call (simulate incoming call)
app.post('/calls/start', (req: Request, res: Response) => {
  try {
    const { callerNumber } = req.body;

    const call: Call = {
      id: uuidv4(),
      callerNumber: callerNumber || '+919876543210',
      startTime: new Date().toISOString(),
      ivrPath: ['welcome'],
      currentNode: 'welcome',
      status: 'active',
      capturedData: {},
    };

    calls.set(call.id, call);

    res.json({
      success: true,
      call,
      ivrPrompt: ivrTree.welcome.prompt,
      options: ivrTree.welcome.options,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start call' });
  }
});

// Handle IVR input
app.post('/calls/:callId/input', (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const call = calls.get(req.params.callId);

    if (!call) return res.status(404).json({ error: 'Call not found' });
    if (call.status !== 'active') return res.status(400).json({ error: 'Call is not active' });

    const currentNode = ivrTree[call.currentNode];

    // Process input
    if (key === 'action' && value) {
      // Data capture mode
      if (currentNode.dataKey) {
        call.capturedData[currentNode.dataKey] = value;
      }
    } else if (key && currentNode.options) {
      const option = currentNode.options.find(o => o.key === key);
      if (option) {
        call.ivrPath.push(option.nextNode);
        call.currentNode = option.nextNode;
      }
    }

    // Process current node action
    const nextNode = ivrTree[call.currentNode];

    if (nextNode.action === 'transfer_agent') {
      call.status = 'transferred';
      call.transferredTo = 'agent-pool';
      calls.set(call.id, call);

      res.json({
        success: true,
        action: 'transfer',
        message: 'Transferring to agent...',
        call,
      });
    } else if (nextNode.action === 'capture_lead') {
      // Return prompt for data capture
      res.json({
        success: true,
        action: 'capture',
        prompt: nextNode.prompt,
        dataKey: nextNode.dataKey,
        call,
      });
    } else {
      // Return next IVR prompt
      calls.set(call.id, call);

      res.json({
        success: true,
        prompt: nextNode.prompt,
        options: nextNode.options || [],
        call,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process input' });
  }
});

// Complete call
app.post('/calls/:callId/end', (req: Request, res: Response) => {
  try {
    const call = calls.get(req.params.callId);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    call.endTime = new Date().toISOString();
    call.duration = Math.floor((new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000);
    call.status = 'completed';

    // Create lead if data captured
    if (call.capturedData.name || call.capturedData.phone) {
      const lead: Lead = {
        id: uuidv4(),
        name: call.capturedData.name || 'Unknown',
        phone: call.capturedData.phone || call.callerNumber,
        interest: call.capturedData.interest || 'General Inquiry',
        budget: call.capturedData.budget,
        source: 'phone',
        status: 'new',
        notes: [`IVR Path: ${call.ivrPath.join(' > ')}`],
        createdAt: new Date().toISOString(),
      };
      leads.set(lead.id, lead);
    }

    calls.set(call.id, call);

    res.json({ success: true, call, lead: leads.get(lead.id) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// Get call details
app.get('/calls/:id', (req: Request, res: Response) => {
  try {
    const call = calls.get(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    res.json({ call });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Get all calls
app.get('/calls', (req: Request, res: Response) => {
  try {
    const { status, date } = req.query;
    let result = Array.from(calls.values());

    if (status) result = result.filter(c => c.status === status);
    if (date) result = result.filter(c => c.startTime.startsWith(date as string));

    res.json({ calls: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Get showing requests
app.get('/showings', (req: Request, res: Response) => {
  try {
    const result = Array.from(showingRequests.values());
    res.json({ showings: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch showings' });
  }
});

// Create showing request
app.post('/showings', (req: Request, res: Response) => {
  try {
    const { callerName, callerPhone, propertyId, preferredDate, preferredTime, notes } = req.body;

    const showing: ShowingRequest = {
      id: uuidv4(),
      callerName,
      callerPhone,
      propertyId: propertyId || 'unknown',
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: preferredTime || '10:00',
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
    };

    showingRequests.set(showing.id, showing);

    // Also create lead
    const lead: Lead = {
      id: uuidv4(),
      name: callerName,
      phone: callerPhone,
      interest: `Showing requested for property ${propertyId}`,
      source: 'phone',
      status: 'new',
      notes: [`Showing scheduled for ${preferredDate} at ${preferredTime}`],
      createdAt: new Date().toISOString(),
    };
    leads.set(lead.id, lead);

    res.status(201).json({ success: true, showing, lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create showing request' });
  }
});

// Update showing status
app.patch('/showings/:id', (req: Request, res: Response) => {
  try {
    const showing = showingRequests.get(req.params.id);
    if (!showing) return res.status(404).json({ error: 'Showing not found' });

    const updated = { ...showing, ...req.body };
    showingRequests.set(showing.id, updated);

    res.json({ success: true, showing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update showing' });
  }
});

// Get leads
app.get('/leads', (req: Request, res: Response) => {
  try {
    const result = Array.from(leads.values());
    res.json({ leads: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get properties (for IVR reference)
app.get('/properties', (req: Request, res: Response) => {
  try {
    const { city, type, minPrice, maxPrice } = req.query;
    let result = Array.from(properties.values());

    if (city) result = result.filter(p => p.location.city.toLowerCase() === (city as string).toLowerCase());
    if (type) result = result.filter(p => p.type === type);
    if (minPrice) result = result.filter(p => p.price >= parseInt(minPrice as string));
    if (maxPrice) result = result.filter(p => p.price <= parseInt(maxPrice as string));

    res.json({ properties: result, count: result.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Voice agent stats
app.get('/stats', (_req: Request, res: Response) => {
  try {
    const callArray = Array.from(calls.values());
    const leadArray = Array.from(leads.values());
    const showingArray = Array.from(showingRequests.values());

    const completedCalls = callArray.filter(c => c.status === 'completed');
    const transferredCalls = callArray.filter(c => c.status === 'transferred');
    const missedCalls = callArray.filter(c => c.status === 'missed');

    const avgDuration = completedCalls.length > 0
      ? completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length
      : 0;

    res.json({
      calls: {
        total: callArray.length,
        completed: completedCalls.length,
        transferred: transferredCalls.length,
        missed: missedCalls.length,
        averageDuration: Math.round(avgDuration),
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
        completed: showingArray.filter(s => s.status === 'completed').length,
      },
      ivrNodes: Object.keys(ivrTree).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`📞 Phone Receptionist running on port ${PORT}`);
  console.log(`   - IVR for property inquiries`);
  console.log(`   - Call management & tracking`);
  console.log(`   - Lead capture from calls`);
  console.log(`   - Showing scheduling`);
  console.log(`   - Agent transfer routing`);
});

export { app, calls, properties, showingRequests, leads, ivrTree };