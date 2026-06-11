/**
 * ShopFlow Phone Receptionist - Voice Agent
 * Handles incoming calls for retail store inquiries
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4831;

app.use(express.json());

// Types
interface CallLog {
  id: string;
  phoneNumber: string;
  startTime: string;
  endTime?: string;
  duration: number;
  intent?: string;
  resolution?: string;
  transferredTo?: string;
  status: 'active' | 'completed' | 'missed' | 'transferred';
}

interface IVRNode {
  id: string;
  prompt: string;
  options: { digit: string; action: string; nextNode?: string }[];
  action?: string;
}

interface CallState {
  callId: string;
  currentNode: string;
  customerId?: string;
  selections: string[];
}

// In-memory stores
const callLogs = new Map<string, CallLog>();
const callStates = new Map<string, CallState>();

// IVR Flow
const ivrFlow: Map<string, IVRNode> = new Map([
  ['main', {
    id: 'main',
    prompt: 'Welcome to ShopFlow Retail. Press 1 for store information, 2 for product availability, 3 to speak with an associate, or 4 for loyalty program.',
    options: [
      { digit: '1', action: 'store_info' },
      { digit: '2', action: 'product_availability' },
      { digit: '3', action: 'transfer_associate' },
      { digit: '4', action: 'loyalty' }
    ]
  }],
  ['store_info', {
    id: 'store_info',
    prompt: 'Our store is open from 10 AM to 9 PM, Monday to Saturday. We are located at Main Street Mall, Ground Floor. Press 1 to hear weekly deals, or 0 to return to main menu.',
    options: [
      { digit: '1', action: 'weekly_deals' },
      { digit: '0', action: 'main' }
    ]
  }],
  ['product_availability', {
    id: 'product_availability',
    prompt: 'Please enter the product SKU followed by the pound key, or say the product name.',
    options: []
  }],
  ['transfer_associate', {
    id: 'transfer_associate',
    prompt: 'Please hold while I connect you to an associate.',
    options: [],
    action: 'transfer'
  }],
  ['loyalty', {
    id: 'loyalty',
    prompt: 'Press 1 to check your loyalty points, 2 to learn about our loyalty program, or 0 to return to main menu.',
    options: [
      { digit: '1', action: 'check_points' },
      { digit: '2', action: 'loyalty_info' },
      { digit: '0', action: 'main' }
    ]
  }]
]);

// AI: Handle incoming call
app.post('/api/calls/incoming', async (req, res) => {
  try {
    const { phoneNumber, callerId } = req.body;

    const callId = uuidv4();
    const callLog: CallLog = {
      id: callId,
      phoneNumber: phoneNumber || callerId || 'unknown',
      startTime: new Date().toISOString(),
      duration: 0,
      status: 'active'
    };

    callLogs.set(callId, callLog);

    // Initialize call state
    callStates.set(callId, {
      callId,
      currentNode: 'main',
      selections: []
    });

    const mainNode = ivrFlow.get('main')!;

    res.json({
      success: true,
      callId,
      prompt: mainNode.prompt,
      options: mainNode.options.map(o => ({ digit: o.digit, label: o.action.replace('_', ' ') })),
      nextNode: 'main'
    });
  } catch (error) {
    res.status(500).json({ error: 'Call handling failed' });
  }
});

// AI: Handle IVR selection
app.post('/api/calls/:callId/select', async (req, res) => {
  try {
    const { callId } = req.params;
    const { digit } = req.body;

    const callState = callStates.get(callId);
    if (!callState) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const currentNode = ivrFlow.get(callState.currentNode);
    if (!currentNode) {
      return res.status(404).json({ error: 'IVR node not found' });
    }

    const selectedOption = currentNode.options.find(o => o.digit === digit);
    if (!selectedOption) {
      return res.json({
        success: false,
        prompt: 'Invalid selection. Please try again.',
        currentNode: callState.currentNode
      });
    }

    // Update call state
    callState.selections.push(digit);
    callState.currentNode = selectedOption.nextNode || selectedOption.action;

    const nextNode = ivrFlow.get(callState.currentNode);
    if (!nextNode) {
      return res.json({
        success: true,
        prompt: 'Thank you for calling ShopFlow. Goodbye!',
        options: [],
        action: selectedOption.action,
        endCall: true
      });
    }

    // Handle special actions
    if (nextNode.action === 'transfer') {
      const callLog = callLogs.get(callId);
      if (callLog) {
        callLog.transferredTo = 'sales_associate';
        callLog.status = 'transferred';
      }

      return res.json({
        success: true,
        prompt: nextNode.prompt,
        options: [],
        action: 'transfer',
        transferTo: 'sales_associate'
      });
    }

    res.json({
      success: true,
      callId,
      prompt: nextNode.prompt,
      options: nextNode.options.map(o => ({ digit: o.digit, label: o.action.replace('_', ' ') })),
      nextNode: callState.currentNode
    });
  } catch (error) {
    res.status(500).json({ error: 'IVR selection failed' });
  }
});

// AI: Process voice input (simulated)
app.post('/api/calls/:callId/voice', async (req, res) => {
  try {
    const { callId } = req.params;
    const { transcript } = req.body;

    const callState = callStates.get(callId);
    if (!callState) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // AI processes the voice transcript
    const intent = analyzeIntent(transcript);

    const response = generateResponse(intent);

    res.json({
      success: true,
      transcript,
      intent,
      response,
      nextNode: callState.currentNode
    });
  } catch (error) {
    res.status(500).json({ error: 'Voice processing failed' });
  }
});

function analyzeIntent(transcript: string): string {
  const lower = transcript.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return 'price_inquiry';
  }
  if (lower.includes('available') || lower.includes('stock') || lower.includes('have')) {
    return 'availability';
  }
  if (lower.includes('return') || lower.includes('exchange')) {
    return 'return_exchange';
  }
  if (lower.includes('location') || lower.includes('address') || lower.includes('where')) {
    return 'location';
  }
  if (lower.includes('hours') || lower.includes('open') || lower.includes('time')) {
    return 'store_hours';
  }
  if (lower.includes('loyalty') || lower.includes('points') || lower.includes('rewards')) {
    return 'loyalty';
  }

  return 'general';
}

function generateResponse(intent: string): string {
  const responses: Record<string, string> = {
    price_inquiry: 'I can help with pricing. Please provide the product name or SKU.',
    availability: 'Let me check our inventory for you. What product are you looking for?',
    return_exchange: 'Our return policy allows 7 days for returns and 15 days for exchanges with receipt.',
    location: 'We are located at Main Street Mall, Ground Floor. Free parking available.',
    store_hours: 'We are open 10 AM to 9 PM, Monday to Saturday. Closed on Sundays.',
    loyalty: 'Our loyalty program offers 1 point per ₹10 spent. Points never expire!'
  };

  return responses[intent] || 'Thank you for calling. How can I assist you today?';
}

// AI: End call
app.post('/api/calls/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;
    const { resolution } = req.body;

    const callLog = callLogs.get(callId);
    if (!callLog) {
      return res.status(404).json({ error: 'Call not found' });
    }

    callLog.endTime = new Date().toISOString();
    callLog.duration = Math.floor(
      (new Date(callLog.endTime).getTime() - new Date(callLog.startTime).getTime()) / 1000
    );
    callLog.resolution = resolution || 'completed';
    callLog.status = 'completed';

    // Clean up call state
    callStates.delete(callId);

    res.json({
      success: true,
      callId,
      duration: callLog.duration,
      resolution: callLog.resolution
    });
  } catch (error) {
    res.status(500).json({ error: 'Call end failed' });
  }
});

// Get call logs
app.get('/api/calls', (req, res) => {
  const { date, status } = req.query;
  let logs = Array.from(callLogs.values());

  if (date) {
    logs = logs.filter(l => l.startTime.startsWith(date as string));
  }
  if (status) {
    logs = logs.filter(l => l.status === status);
  }

  res.json({ calls: logs, total: logs.length });
});

// Get call details
app.get('/api/calls/:callId', (req, res) => {
  const callLog = callLogs.get(req.params.callId);
  if (!callLog) {
    return res.status(404).json({ error: 'Call not found' });
  }
  res.json({ call: callLog });
});

// Health Check
app.get('/health', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = Array.from(callLogs.values())
    .filter(l => l.startTime.startsWith(today));

  res.json({
    status: 'healthy',
    service: 'ShopFlow - Phone Receptionist',
    version: '1.0.0',
    port: PORT,
    stats: {
      totalCalls: callLogs.size,
      callsToday: todayCalls.length,
      missedCalls: todayCalls.filter(c => c.status === 'missed').length,
      transferredCalls: todayCalls.filter(c => c.status === 'transferred').length
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         ShopFlow Phone Receptionist v1.0.0              ║
║                                                         ║
║  Port: ${PORT}                                               ║
║  Features:                                              ║
║  • IVR Call Handling                                     ║
║  • Product Inquiries                                     ║
║  • Store Information                                     ║
║  • Loyalty Program                                       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;