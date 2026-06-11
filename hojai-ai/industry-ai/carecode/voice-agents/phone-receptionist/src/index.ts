/**
 * CARECODE - Phone Receptionist Voice Agent
 * AI-powered voice agent for call handling, appointment booking, and patient triage
 * "AI Receptionist That Never Misses a Call"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4851;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Call {
  id: string;
  callId: string;
  phoneNumber: string;
  patientId?: string;
  patientName?: string;
  status: 'incoming' | 'ringing' | 'answered' | 'transferred' | 'completed' | 'missed' | 'voicemail';
  startTime: string;
  endTime?: string;
  duration?: number;
  purpose: 'appointment' | 'inquiry' | 'prescription' | 'emergency' | 'general';
  symptoms?: string[];
  priority: 'low' | 'normal' | 'urgent' | 'emergency';
  sentiment?: 'positive' | 'neutral' | 'negative';
  notes: string[];
  appointments?: CreatedAppointment[];
  transferredTo?: string;
  voicemailUrl?: string;
}

interface CreatedAppointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  confirmed: boolean;
}

interface IVRMenu {
  id: string;
  prompt: string;
  options: { key: string; label: string; action: string }[];
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  available: boolean;
  nextSlot?: { date: string; time: string };
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const calls = new Map<string, Call>();
const ivrMenus = new Map<string, IVRMenu>();
const doctors = new Map<string, Doctor>();

// Sample IVR menus
const sampleIVR: IVRMenu = {
  id: 'main',
  prompt: 'Welcome to CareCode Healthcare. Press 1 to book or modify an appointment, Press 2 for general inquiries, Press 3 for prescription refills, Press 4 to speak with a nurse, Press 5 for emergencies.',
  options: [
    { key: '1', label: 'Book Appointment', action: 'appointment' },
    { key: '2', label: 'General Inquiry', action: 'inquiry' },
    { key: '3', label: 'Prescription Refill', action: 'prescription' },
    { key: '4', label: 'Speak to Nurse', action: 'nurse' },
    { key: '5', label: 'Emergency', action: 'emergency' }
  ]
};

ivrMenus.set('main', sampleIVR);

// Sample doctors
const sampleDoctors: Doctor[] = [
  { id: 'doc-001', name: 'Dr. Priya Sharma', department: 'General Medicine', available: true, nextSlot: { date: '2026-06-04', time: '10:00' } },
  { id: 'doc-002', name: 'Dr. Rahul Mehta', department: 'Cardiology', available: true, nextSlot: { date: '2026-06-04', time: '11:30' } },
  { id: 'doc-003', name: 'Dr. Anita Patel', department: 'Pediatrics', available: true, nextSlot: { date: '2026-06-05', time: '09:00' } },
  { id: 'doc-004', name: 'Dr. Vikram Singh', department: 'Orthopedics', available: false }
];

sampleDoctors.forEach(d => doctors.set(d.id, d));

// ============================================
// VOICE AI ENGINE
// ============================================

interface ConversationState {
  callId: string;
  stage: 'greeting' | 'menu' | 'collection' | 'booking' | 'confirmation' | 'transfer' | 'voicemail' | 'complete';
  selections: string[];
  patientData: {
    name?: string;
    phone?: string;
    patientId?: string;
    reason?: string;
    preferredDoctor?: string;
    preferredDate?: string;
    preferredTime?: string;
    symptoms?: string[];
  };
  currentMenu: string;
}

const activeConversations = new Map<string, ConversationState>();

function createWelcomeMessage(): string {
  return `Welcome to CareCode Healthcare. I'm your AI assistant. How can I help you today?
You can say "book appointment", "prescription refill", "check test results", or "speak to someone".`;
}

function analyzeIntent(message: string): { intent: string; confidence: number; entities: any } {
  const msgLower = message.toLowerCase();

  let intent = 'general';
  let confidence = 0.5;
  const entities: any = {};

  // Appointment intents
  if (msgLower.includes('appointment') || msgLower.includes('book') || msgLower.includes('schedule')) {
    intent = 'appointment';
    confidence = 0.9;
  }

  // Prescription intents
  if (msgLower.includes('prescription') || msgLower.includes('refill') || msgLower.includes('medicine') || msgLower.includes('medication')) {
    intent = 'prescription';
    confidence = 0.85;
  }

  // Emergency indicators
  if (msgLower.includes('emergency') || msgLower.includes('urgent') || msgLower.includes('pain') || msgLower.includes('severe')) {
    intent = 'emergency';
    confidence = 0.95;
    entities.priority = 'urgent';
  }

  // Test results
  if (msgLower.includes('test') || msgLower.includes('result') || msgLower.includes('report')) {
    intent = 'results';
    confidence = 0.8;
  }

  // Symptoms check
  const symptomKeywords = ['fever', 'cough', 'headache', 'stomach', 'pain', 'nausea', 'dizziness', 'fatigue', 'breathing'];
  symptomKeywords.forEach(symptom => {
    if (msgLower.includes(symptom)) {
      entities.symptoms = entities.symptoms || [];
      entities.symptoms.push(symptom);
    }
  });

  return { intent, confidence, entities };
}

function generateResponse(state: ConversationState, message?: string): { response: string; action?: string; data?: any } {
  const { stage, patientData } = state;

  switch (stage) {
    case 'greeting':
      return {
        response: createWelcomeMessage(),
        action: 'await_input'
      };

    case 'menu':
      return {
        response: 'Please select an option: Press 1 for Appointments, 2 for Prescriptions, 3 for Test Results, 4 for General Help, or 5 for Emergency.',
        action: 'await_selection'
      };

    case 'collection':
      if (!patientData.name) {
        return { response: "I'd be happy to help you. May I have your name please?", action: 'collect_name' };
      }
      if (!patientData.phone && message) {
        return { response: `Thank you, ${patientData.name}. May I have your phone number?`, action: 'collect_phone' };
      }
      if (!patientData.reason && message) {
        return { response: 'What is the reason for your call today?', action: 'collect_reason' };
      }
      return { response: 'Let me transfer you to the appropriate department.', action: 'transfer' };

    case 'booking':
      const availableDocs = Array.from(doctors.values()).filter(d => d.available);
      if (availableDocs.length > 0) {
        const docList = availableDocs.map(d => `${d.name} (${d.department})`).join(', ');
        return {
          response: `Available doctors are: ${docList}. Which doctor would you like to see?`,
          action: 'select_doctor'
        };
      }
      return { response: 'Unfortunately, no doctors are currently available. Would you like to leave a voicemail?', action: 'voicemail' };

    case 'confirmation':
      return {
        response: `Your appointment has been confirmed with ${patientData.preferredDoctor || 'the selected doctor'} on ${patientData.preferredDate} at ${patientData.preferredTime}. You will receive an SMS confirmation shortly. Is there anything else I can help you with?`,
        action: 'confirm'
      };

    default:
      return { response: 'Thank you for calling CareCode. Have a great day!', action: 'complete' };
  }
}

// ============================================
// API ROUTES
// ============================================

/**
 * Initiate incoming call (webhook from telephony)
 */
app.post('/api/calls/incoming', (req: Request, res: Response) => {
  try {
    const { phoneNumber, callerId, timestamp } = req.body;

    const callId = `CALL-${Date.now().toString(36).toUpperCase()}`;

    const call: Call = {
      id: uuidv4(),
      callId,
      phoneNumber: phoneNumber || callerId,
      status: 'incoming',
      startTime: timestamp || new Date().toISOString(),
      purpose: 'general',
      priority: 'normal',
      notes: []
    };

    calls.set(callId, call);

    // Create conversation state
    const state: ConversationState = {
      callId,
      stage: 'greeting',
      selections: [],
      patientData: { phone: phoneNumber },
      currentMenu: 'main'
    };

    activeConversations.set(callId, state);

    console.log(`[${new Date().toISOString()}] Incoming call: ${callId} from ${phoneNumber}`);

    res.status(201).json({
      success: true,
      callId,
      response: createWelcomeMessage(),
      action: 'speak'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle incoming call' });
  }
});

/**
 * Process voice input
 */
app.post('/api/calls/:callId/input', (req: Request, res: Response) => {
  try {
    const { message, dtmf, sentiment } = req.body;

    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    let state = activeConversations.get(call.callId);
    if (!state) {
      state = {
        callId: call.callId,
        stage: 'greeting',
        selections: [],
        patientData: {},
        currentMenu: 'main'
      };
      activeConversations.set(call.callId, state);
    }

    // Update call status
    if (call.status === 'incoming') {
      call.status = 'answered';
    }

    // Analyze input
    const input = message || dtmf;
    const analysis = analyzeIntent(input);

    console.log(`[${new Date().toISOString()}] Call ${call.callId} input: ${input}`);
    console.log(`  Intent: ${analysis.intent}, Confidence: ${analysis.confidence}`);

    // Process based on intent
    if (analysis.intent === 'emergency') {
      call.priority = 'emergency';
      state.stage = 'transfer';
      return res.json({
        success: true,
        response: 'I understand this is an emergency. Let me connect you immediately to our emergency line.',
        action: 'transfer',
        priority: 'emergency',
        destination: 'emergency-line'
      });
    }

    // Update sentiment if provided
    if (sentiment) {
      call.sentiment = sentiment;
    }

    // Handle appointment booking
    if (analysis.intent === 'appointment') {
      state.stage = 'collection';

      if (analysis.entities.symptoms) {
        state.patientData.symptoms = analysis.entities.symptoms;
        call.symptoms = analysis.entities.symptoms;
      }

      const response = generateResponse(state, input);
      return res.json({
        success: true,
        ...response,
        callId: call.callId
      });
    }

    // Handle prescription requests
    if (analysis.intent === 'prescription') {
      call.purpose = 'prescription';
      call.notes.push('Patient requested prescription refill');
      return res.json({
        success: true,
        response: 'I can help with prescription refills. Please hold while I connect you to our pharmacy department, or would you like me to transfer your request?',
        action: 'transfer',
        destination: 'pharmacy'
      });
    }

    // Continue conversation
    if (message && state.stage === 'collection') {
      if (!state.patientData.name && message) {
        state.patientData.name = message;
        return res.json({
          success: true,
          response: `Thank you, ${state.patientData.name}. What is the reason for your call today?`,
          action: 'collect_reason',
          callId: call.callId
        });
      }
      if (!state.patientData.reason && message) {
        state.patientData.reason = message;
        state.stage = 'booking';
      }
    }

    // Handle DTMF selections
    if (dtmf) {
      state.selections.push(dtmf);
      const menu = ivrMenus.get(state.currentMenu);
      const option = menu?.options.find(o => o.key === dtmf);

      if (option) {
        if (option.action === 'emergency') {
          call.priority = 'emergency';
          return res.json({
            success: true,
            response: 'Connecting you to emergency services...',
            action: 'transfer',
            destination: 'emergency'
          });
        }
        if (option.action === 'appointment') {
          state.stage = 'collection';
          return res.json({
            success: true,
            response: 'I can help you book an appointment. May I have your name?',
            action: 'collect_info',
            callId: call.callId
          });
        }
      }
    }

    const response = generateResponse(state, input);

    res.json({
      success: true,
      ...response,
      callId: call.callId,
      intent: analysis.intent
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process input' });
  }
});

/**
 * Book appointment through voice
 */
app.post('/api/calls/:callId/appointment', (req: Request, res: Response) => {
  try {
    const { doctorId, date, time, patientName } = req.body;

    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const doctor = doctors.get(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appointment: CreatedAppointment = {
      id: `APT-${Date.now().toString(36).toUpperCase()}`,
      doctorId,
      doctorName: doctor.name,
      date,
      time,
      confirmed: true
    };

    if (!call.appointments) {
      call.appointments = [];
    }
    call.appointments.push(appointment);

    call.purpose = 'appointment';
    call.status = 'completed';

    console.log(`[${new Date().toISOString()}] Appointment booked via call ${call.callId}: ${appointment.id}`);

    res.json({
      success: true,
      appointment,
      response: `Your appointment with ${doctor.name} has been confirmed for ${date} at ${time}. You will receive an SMS confirmation shortly.`,
      callId: call.callId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * Transfer call
 */
app.post('/api/calls/:callId/transfer', (req: Request, res: Response) => {
  try {
    const { destination, reason } = req.body;

    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'transferred';
    call.transferredTo = destination;
    call.notes.push(`Transferred to ${destination}: ${reason || 'No reason provided'}`);

    console.log(`[${new Date().toISOString()}] Call ${call.callId} transferred to ${destination}`);

    res.json({
      success: true,
      response: 'Please hold while I transfer you...',
      action: 'transferring',
      destination
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer call' });
  }
});

/**
 * Record voicemail
 */
app.post('/api/calls/:callId/voicemail', (req: Request, res: Response) => {
  try {
    const { audioUrl, transcript } = req.body;

    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'voicemail';
    call.voicemailUrl = audioUrl;
    call.notes.push(`Voicemail: ${transcript || 'No transcript available'}`);

    console.log(`[${new Date().toISOString()}] Voicemail recorded for call ${call.callId}`);

    res.json({
      success: true,
      response: 'Thank you for your message. Our staff will respond within 24 hours.',
      action: 'complete',
      callId: call.callId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record voicemail' });
  }
});

/**
 * End call
 */
app.post('/api/calls/:callId/end', (req: Request, res: Response) => {
  try {
    const { notes, sentiment, duration } = req.body;

    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'completed';
    call.endTime = new Date().toISOString();
    call.duration = duration || Math.floor((new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000);

    if (notes) {
      call.notes.push(notes);
    }
    if (sentiment) {
      call.sentiment = sentiment;
    }

    // Clean up conversation state
    activeConversations.delete(call.callId);

    console.log(`[${new Date().toISOString()}] Call ${call.callId} ended. Duration: ${call.duration}s`);

    res.json({
      success: true,
      call,
      summary: {
        duration: call.duration,
        purpose: call.purpose,
        appointmentsBooked: call.appointments?.length || 0,
        transferred: !!call.transferredTo,
        sentiment: call.sentiment
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end call' });
  }
});

/**
 * Get call details
 */
app.get('/api/calls/:callId', (req: Request, res: Response) => {
  try {
    const call = Array.from(calls.values()).find(c => c.callId === req.params.callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const state = activeConversations.get(call.callId);

    res.json({
      success: true,
      call,
      conversationState: state
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call' });
  }
});

/**
 * Get call logs
 */
app.get('/api/calls', (req: Request, res: Response) => {
  try {
    const { status, date, patientId } = req.query;
    let result = Array.from(calls.values());

    if (status) result = result.filter(c => c.status === status);
    if (date) result = result.filter(c => c.startTime.startsWith(String(date)));
    if (patientId) result = result.filter(c => c.patientId === patientId);

    result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const stats = {
      total: result.length,
      answered: result.filter(c => c.status === 'answered' || c.status === 'completed' || c.status === 'transferred').length,
      missed: result.filter(c => c.status === 'missed').length,
      emergencies: result.filter(c => c.priority === 'emergency').length
    };

    res.json({
      success: true,
      calls: result,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get calls' });
  }
});

/**
 * Get available doctors for scheduling
 */
app.get('/api/doctors/available', (req: Request, res: Response) => {
  try {
    const { department, date } = req.query;
    let result = Array.from(doctors.values()).filter(d => d.available);

    if (department) {
      result = result.filter(d => d.department.toLowerCase() === String(department).toLowerCase());
    }

    res.json({
      success: true,
      doctors: result,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get doctors' });
  }
});

/**
 * Get IVR menu
 */
app.get('/api/ivr/:menuId', (req: Request, res: Response) => {
  try {
    const menu = ivrMenus.get(req.params.menuId);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    res.json({
      success: true,
      menu
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = Array.from(calls.values()).filter(c => c.startTime.startsWith(today));

  res.json({
    status: 'healthy',
    service: 'carecode-phone-receptionist',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'IVR Navigation',
      'Appointment Booking',
      'Voice Input Processing',
      'Emergency Detection',
      'Call Transfer',
      'Voicemail Recording'
    ],
    stats: {
      totalCalls: calls.size,
      activeCalls: activeConversations.size,
      todayCalls: todayCalls.length,
      todayAnswered: todayCalls.filter(c => c.status === 'answered' || c.status === 'completed').length,
      todayMissed: todayCalls.filter(c => c.status === 'missed').length,
      emergenciesToday: todayCalls.filter(c => c.priority === 'emergency').length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Phone Receptionist',
    description: 'AI-powered voice agent for healthcare call handling',
    version: '1.0.0',
    endpoints: {
      incoming: 'POST /api/calls/incoming',
      input: 'POST /api/calls/:callId/input',
      book: 'POST /api/calls/:callId/appointment',
      transfer: 'POST /api/calls/:callId/transfer',
      voicemail: 'POST /api/calls/:callId/voicemail',
      end: 'POST /api/calls/:callId/end',
      get: 'GET /api/calls/:callId',
      list: 'GET /api/calls',
      doctors: 'GET /api/doctors/available',
      ivr: 'GET /api/ivr/:menuId'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║       CARECODE PHONE RECEPTIONIST v1.0.0                ║
║                                                         ║
║  Tagline: "AI Receptionist That Never Misses a Call"  ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • IVR Navigation                                      ║
║  • Voice Appointment Booking                           ║
║  • Emergency Detection                                 ║
║  • Smart Call Routing                                  ║
║  • Voicemail Management                                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, calls, doctors, activeConversations };