/**
 * CARECODE - IVR System
 * Interactive Voice Response for Healthcare
 * Handles incoming calls, menus, DTMF, transfers, and voicemail
 *
 * Features:
 * - Multi-level IVR menus
 * - DTMF tone detection
 * - Call routing and transfers
 * - Voicemail recording
 * - Appointment booking integration
 * - Emergency escalation
 * - Multi-language support
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4857;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============================================
// TYPES
// ============================================

interface IVRMenu {
  id: string;
  name: string;
  prompt: string;
  language: 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';
  options: IVROption[];
  timeoutSeconds: number;
  maxRetries: number;
}

interface IVROption {
  key: string;
  label: string;
  action: IVRAction;
  submenuId?: string;
}

type IVRAction =
  | 'transfer_reception'
  | 'transfer_nurse'
  | 'transfer_emergency'
  | 'transfer_doctor'
  | 'transfer_billing'
  | 'appointment_book'
  | 'appointment_reschedule'
  | 'appointment_cancel'
  | 'prescription_refill'
  | 'lab_results'
  | 'location_info'
  | 'operating_hours'
  | 'directions'
  | 'voicemail'
  | 'repeat_menu'
  | 'callback_request'
  | 'health_info'
  | 'emergency_info'
  | 'exit';

interface IVRSession {
  id: string;
  callId: string;
  phoneNumber: string;
  currentMenu: string;
  language: string;
  collectedDigits: string;
  actionHistory: string[];
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'completed' | 'transferred' | 'voicemail' | 'abandoned';
  transferTarget?: string;
  appointmentData?: Record<string, any>;
  voicemailUrl?: string;
  metadata: Record<string, any>;
}

interface Call {
  id: string;
  callId: string;
  phoneNumber: string;
  status: 'incoming' | 'ringing' | 'answered' | 'transferred' | 'completed' | 'missed' | 'voicemail';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  direction: 'inbound' | 'outbound';
  ivrSessionId?: string;
  disposition?: string;
  recordingUrl?: string;
  metadata: Record<string, any>;
}

interface Voicemail {
  id: string;
  callId: string;
  phoneNumber: string;
  patientId?: string;
  duration: number;
  recordingUrl: string;
  transcription?: string;
  createdAt: Date;
  reviewed: boolean;
  reviewedBy?: string;
  notes?: string;
}

interface CallTransfer {
  id: string;
  callId: string;
  from: string;
  to: string;
  reason: string;
  transferredAt: Date;
  completed: boolean;
}

interface CallbackRequest {
  id: string;
  phoneNumber: string;
  patientId?: string;
  reason: string;
  preferredTime?: string;
  requestedAt: Date;
  status: 'pending' | 'called' | 'completed' | 'cancelled';
  assignedTo?: string;
  notes?: string;
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

const sessions = new Map<string, IVRSession>();
const calls = new Map<string, Call>();
const voicemails = new Map<string, Voicemail>();
const transfers = new Map<string, CallTransfer>();
const callbackRequests = new Map<string, CallbackRequest>();

// ============================================
// IVR MENUS
// ============================================

const menus: Map<string, IVRMenu> = new Map();

// Main Menu (English)
menus.set('main_en', {
  id: 'main_en',
  name: 'Main Menu',
  language: 'en',
  prompt: 'Welcome to CareCode Healthcare. For English, press 1. For Hindi, press 2. For Tamil, press 3.',
  timeoutSeconds: 10,
  maxRetries: 3,
  options: [
    { key: '1', label: 'English', action: 'repeat_menu', submenuId: 'main_en_healthcare' },
    { key: '2', label: 'Hindi', action: 'repeat_menu', submenuId: 'main_hi' },
    { key: '3', label: 'Tamil', action: 'repeat_menu', submenuId: 'main_ta' }
  ]
});

// Healthcare Main Menu (English)
menus.set('main_en_healthcare', {
  id: 'main_en_healthcare',
  name: 'Healthcare Main Menu',
  language: 'en',
  prompt: 'Press 1 to book or modify an appointment. Press 2 for prescription refills. Press 3 for lab results. Press 4 to speak with a nurse. Press 5 for billing inquiries. Press 6 for location and directions. Press 7 for health information. Press 0 to speak with an operator.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Appointments', action: 'repeat_menu', submenuId: 'appointment_en' },
    { key: '2', label: 'Prescription Refills', action: 'prescription_refill' },
    { key: '3', label: 'Lab Results', action: 'lab_results' },
    { key: '4', label: 'Nurse Line', action: 'transfer_nurse' },
    { key: '5', label: 'Billing', action: 'transfer_billing' },
    { key: '6', label: 'Location', action: 'repeat_menu', submenuId: 'location_en' },
    { key: '7', label: 'Health Info', action: 'health_info' },
    { key: '0', label: 'Operator', action: 'transfer_reception' }
  ]
});

// Appointment Menu (English)
menus.set('appointment_en', {
  id: 'appointment_en',
  name: 'Appointment Menu',
  language: 'en',
  prompt: 'Press 1 to book a new appointment. Press 2 to reschedule an existing appointment. Press 3 to cancel an appointment. Press 9 to return to the main menu.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Book Appointment', action: 'appointment_book' },
    { key: '2', label: 'Reschedule', action: 'appointment_reschedule' },
    { key: '3', label: 'Cancel', action: 'appointment_cancel' },
    { key: '9', label: 'Return', action: 'repeat_menu', submenuId: 'main_en_healthcare' }
  ]
});

// Location Menu (English)
menus.set('location_en', {
  id: 'location_en',
  name: 'Location Menu',
  language: 'en',
  prompt: 'Press 1 for main hospital address and directions. Press 2 for clinic locations. Press 3 for emergency room location. Press 9 to return to the main menu.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Hospital', action: 'directions' },
    { key: '2', label: 'Clinics', action: 'directions' },
    { key: '3', label: 'Emergency', action: 'emergency_info' },
    { key: '9', label: 'Return', action: 'repeat_menu', submenuId: 'main_en_healthcare' }
  ]
});

// Health Information Menu
menus.set('health_info_en', {
  id: 'health_info_en',
  name: 'Health Information Menu',
  language: 'en',
  prompt: 'Press 1 for flu and cold information. Press 2 for diabetes management. Press 3 for heart health. Press 4 for nutrition tips. Press 5 to hear about our wellness programs. Press 9 to return to the main menu.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Flu Info', action: 'health_info' },
    { key: '2', label: 'Diabetes', action: 'health_info' },
    { key: '3', label: 'Heart Health', action: 'health_info' },
    { key: '4', label: 'Nutrition', action: 'health_info' },
    { key: '5', label: 'Wellness', action: 'health_info' },
    { key: '9', label: 'Return', action: 'repeat_menu', submenuId: 'main_en_healthcare' }
  ]
});

// Emergency Menu
menus.set('emergency_en', {
  id: 'emergency_en',
  name: 'Emergency Menu',
  language: 'en',
  prompt: 'If you are experiencing a medical emergency, please hang up and dial 108 or go to your nearest emergency room. For non-emergency health questions, please stay on the line. Press 1 to request a callback from a nurse. Press 2 to return to the main menu.',
  timeoutSeconds: 10,
  maxRetries: 1,
  options: [
    { key: '1', label: 'Callback', action: 'callback_request' },
    { key: '2', label: 'Main Menu', action: 'repeat_menu', submenuId: 'main_en_healthcare' }
  ]
});

// Voicemail Menu
menus.set('voicemail_en', {
  id: 'voicemail_en',
  name: 'Voicemail Menu',
  language: 'en',
  prompt: 'Please leave your message after the tone. Press the pound key when you are finished recording.',
  timeoutSeconds: 120,
  maxRetries: 1,
  options: []
});

// Voicemail confirmation
menus.set('voicemail_confirm_en', {
  id: 'voicemail_confirm_en',
  name: 'Voicemail Confirmation',
  language: 'en',
  prompt: 'To save this message, press 1. To record again, press 2. To cancel, press 3.',
  timeoutSeconds: 10,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Save', action: 'voicemail' },
    { key: '2', label: 'Re-record', action: 'voicemail' },
    { key: '3', label: 'Cancel', action: 'repeat_menu', submenuId: 'main_en_healthcare' }
  ]
});

// Hindi Main Menu
menus.set('main_hi', {
  id: 'main_hi',
  name: 'Hindi Main Menu',
  language: 'hi',
  prompt: 'CareCode Healthcare me aapka swagat hai. Appointment ke liye 1 dabayein. Prescription ke liye 2 dabayein. Nurse se baat karne ke liye 3 dabayein. Billing ke liye 4 dabayein. Operator se baat karne ke liye 0 dabayein.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Appointment', action: 'appointment_book' },
    { key: '2', label: 'Prescription', action: 'prescription_refill' },
    { key: '3', label: 'Nurse', action: 'transfer_nurse' },
    { key: '4', label: 'Billing', action: 'transfer_billing' },
    { key: '0', label: 'Operator', action: 'transfer_reception' }
  ]
});

// Tamil Main Menu
menus.set('main_ta', {
  id: 'main_ta',
  name: 'Tamil Main Menu',
  language: 'ta',
  prompt: 'CareCode Healthcare-க்கு வரவேற்கிறோம். அポointment-க்கு 1 அழுத்தவும். Prescription-க்கு 2 அழுத்தவும். Nurse-ஐ அணுக 3 அழுத்தவும். Billing-க்கு 4 அழுத்தவும். Operator-ஐ அணுக 0 அழுத்தவும்.',
  timeoutSeconds: 15,
  maxRetries: 2,
  options: [
    { key: '1', label: 'Appointment', action: 'appointment_book' },
    { key: '2', label: 'Prescription', action: 'prescription_refill' },
    { key: '3', label: 'Nurse', action: 'transfer_nurse' },
    { key: '4', label: 'Billing', action: 'transfer_billing' },
    { key: '0', label: 'Operator', action: 'transfer_reception' }
  ]
});

// ============================================
// ZOD SCHEMAS
// ============================================

const createCallSchema = z.object({
  phoneNumber: z.string().min(10),
  direction: z.enum(['inbound', 'outbound']).default('inbound'),
  metadata: z.record(z.any()).optional()
});

const updateSessionSchema = z.object({
  digits: z.string().optional(),
  action: z.string().optional()
});

// ============================================
// IVR ENGINE FUNCTIONS
// ============================================

function getMenu(menuId: string): IVRMenu | undefined {
  return menus.get(menuId);
}

function createSession(callId: string, phoneNumber: string): IVRSession {
  const session: IVRSession = {
    id: uuidv4(),
    callId,
    phoneNumber,
    currentMenu: 'main_en',
    language: 'en',
    collectedDigits: '',
    actionHistory: [],
    startTime: new Date(),
    lastActivity: new Date(),
    status: 'active',
    metadata: {}
  };
  sessions.set(session.id, session);
  logger.info('IVR session created', { sessionId: session.id, callId, phoneNumber });
  return session;
}

function updateSession(sessionId: string, updates: Partial<IVRSession>): IVRSession | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    Object.assign(session, updates);
    session.lastActivity = new Date();
    sessions.set(sessionId, session);
  }
  return session;
}

function processAction(session: IVRSession, action: IVRAction, submenuId?: string): {
  shouldTransfer: boolean;
  target?: string;
  nextMenuId?: string;
  prompt?: string;
} {
  session.actionHistory.push(action);
  updateSession(session.id, session);

  switch (action) {
    case 'repeat_menu':
      return { shouldTransfer: false, nextMenuId: submenuId || session.currentMenu };

    case 'transfer_reception':
      return { shouldTransfer: true, target: 'reception' };

    case 'transfer_nurse':
      return { shouldTransfer: true, target: 'nurse_line' };

    case 'transfer_emergency':
      return { shouldTransfer: true, target: 'emergency' };

    case 'transfer_doctor':
      return { shouldTransfer: true, target: 'doctor_on_call' };

    case 'transfer_billing':
      return { shouldTransfer: true, target: 'billing_department' };

    case 'appointment_book':
      return {
        shouldTransfer: false,
        nextMenuId: 'appointment_en',
        prompt: 'Connecting you to our appointment booking system. Please stay on the line.'
      };

    case 'appointment_reschedule':
      return {
        shouldTransfer: false,
        nextMenuId: 'appointment_en',
        prompt: 'Our appointment team will help you reschedule. Please stay on the line.'
      };

    case 'appointment_cancel':
      return {
        shouldTransfer: false,
        nextMenuId: 'appointment_en',
        prompt: 'To cancel your appointment, please provide your patient ID when connected.'
      };

    case 'prescription_refill':
      return {
        shouldTransfer: false,
        nextMenuId: 'voicemail_en',
        prompt: 'For prescription refills, please leave your full name, medication name, and pharmacy details after the tone.'
      };

    case 'lab_results':
      return {
        shouldTransfer: true,
        target: 'lab_results',
        prompt: 'Connecting you to our lab results line.'
      };

    case 'location_info':
      return {
        shouldTransfer: false,
        nextMenuId: 'location_en',
        prompt: 'Our main hospital is located at 123 Healthcare Boulevard. For detailed directions, please stay on the line.'
      };

    case 'operating_hours':
      return {
        shouldTransfer: false,
        prompt: 'Our hospital is open 24 hours, 7 days a week. Clinic hours are Monday to Saturday, 9 AM to 6 PM.'
      };

    case 'directions':
      return {
        shouldTransfer: false,
        prompt: 'From the main highway, take exit 15 and follow the signs to Healthcare Boulevard. The hospital is on your left.'
      };

    case 'voicemail':
      return {
        shouldTransfer: false,
        nextMenuId: 'voicemail_confirm_en'
      };

    case 'callback_request':
      return {
        shouldTransfer: false,
        prompt: 'A nurse will call you back within 30 minutes. Please stay on the line to confirm your callback number.'
      };

    case 'health_info':
      return {
        shouldTransfer: false,
        prompt: 'For detailed health information, please visit our website or speak with a nurse.'
      };

    case 'emergency_info':
      return {
        shouldTransfer: false,
        prompt: 'Our emergency room is located at the west entrance of the hospital, open 24 hours.'
      };

    case 'exit':
      return {
        shouldTransfer: false,
        prompt: 'Thank you for calling CareCode Healthcare. Goodbye and take care.'
      };

    default:
      return { shouldTransfer: false, nextMenuId: session.currentMenu };
  }
}

function createCall(phoneNumber: string, direction: 'inbound' | 'outbound' = 'inbound', metadata: Record<string, any> = {}): Call {
  const call: Call = {
    id: uuidv4(),
    callId: uuidv4(),
    phoneNumber,
    status: 'incoming',
    startTime: new Date(),
    direction,
    metadata
  };
  calls.set(call.id, call);
  logger.info('Call created', { callId: call.id, phoneNumber, direction });
  return call;
}

function createTransfer(callId: string, from: string, to: string, reason: string): CallTransfer {
  const transfer: CallTransfer = {
    id: uuidv4(),
    callId,
    from,
    to,
    reason,
    transferredAt: new Date(),
    completed: false
  };
  transfers.set(transfer.id, transfer);
  logger.info('Call transfer initiated', { transferId: transfer.id, callId, from, to });
  return transfer;
}

function createVoicemail(callId: string, phoneNumber: string, duration: number, recordingUrl: string, patientId?: string): Voicemail {
  const voicemail: Voicemail = {
    id: uuidv4(),
    callId,
    phoneNumber,
    patientId,
    duration,
    recordingUrl,
    createdAt: new Date(),
    reviewed: false
  };
  voicemails.set(voicemail.id, voicemail);
  logger.info('Voicemail created', { voicemailId: voicemail.id, callId });
  return voicemail;
}

function createCallbackRequest(phoneNumber: string, reason: string, patientId?: string, preferredTime?: string): CallbackRequest {
  const request: CallbackRequest = {
    id: uuidv4(),
    phoneNumber,
    patientId,
    reason,
    preferredTime,
    requestedAt: new Date(),
    status: 'pending'
  };
  callbackRequests.set(request.id, request);
  logger.info('Callback request created', { requestId: request.id, phoneNumber });
  return request;
}

// ============================================
// TWILIO WEBHOK HANDLERS
// ============================================

/**
 * Twilio Voice Webhook - Entry point for incoming calls
 * This endpoint is called by Twilio when a call comes in
 */
app.post('/webhook/twilio/voice', (req: Request, res: Response) => {
  const { From, To, CallSid } = req.body;

  logger.info('Incoming Twilio call', { CallSid, From, To });

  const call = createCall(From, 'inbound', { twilioCallSid: CallSid, calledNumber: To });
  const session = createSession(call.callId, From);

  const twiml = generateTwiML(session);
  res.type('text/xml').send(twiml);
});

/**
 * Generate TwiML response based on session state
 */
function generateTwiML(session: IVRSession): string {
  const menu = getMenu(session.currentMenu);

  if (!menu) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We apologize for the inconvenience. Please hold while we connect you to an operator.</Say>
  <Dial timeout="30" action="/webhook/twilio/status">
    <Number>${process.env.RECEPTION_NUMBER || '+919876543210'}</Number>
  </Dial>
</Response>`;
  }

  let gatherElement = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="${getLanguageCode(menu.language)}">${menu.prompt}</Say>
  <Gather numDigits="1" timeout="${menu.timeoutSeconds}" action="/webhook/twilio/gather" method="POST">
    <Say voice="alice" language="${getLanguageCode(menu.language)}">${menu.prompt}</Say>
  </Gather>`;

  // If no input received, handle timeout
  if (session.metadata.noInputCount >= menu.maxRetries) {
    if (session.currentMenu === 'emergency_en') {
      gatherElement += `
  <Say voice="alice">We will call you back shortly. Goodbye.</Say>
  <Hangup/>`;
    } else {
      gatherElement += `
  <Say voice="alice">We did not receive your input. Connecting you to an operator.</Say>
  <Dial timeout="30" action="/webhook/twilio/status">
    <Number>${process.env.RECEPTION_NUMBER || '+919876543210'}</Number>
  </Dial>`;
    }
  }

  gatherElement += '</Response>';
  return gatherElement;
}

function getLanguageCode(language: string): string {
  const codes: Record<string, string> = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'bn': 'bn-IN',
    'mr': 'mr-IN'
  };
  return codes[language] || 'en-US';
}

/**
 * Handle DTMF input from Twilio Gather
 */
app.post('/webhook/twilio/gather', (req: Request, res: Response) => {
  const { Digits, CallSid, From } = req.body;

  logger.info('DTMF received', { CallSid, Digits });

  // Find session by call ID
  const session = Array.from(sessions.values()).find(s => s.callId === CallSid || s.id === CallSid);

  if (!session) {
    logger.error('Session not found', { CallSid });
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Session expired. Please call again.</Say>
  <Hangup/>
</Response>`;
    return res.type('text/xml').send(twiml);
  }

  if (!Digits) {
    // No digits received
    session.metadata.noInputCount = (session.metadata.noInputCount || 0) + 1;
    updateSession(session.id, session);
    const twiml = generateTwiML(session);
    return res.type('text/xml').send(twiml);
  }

  session.collectedDigits += Digits;
  session.metadata.noInputCount = 0;

  const menu = getMenu(session.currentMenu);
  if (!menu) {
    return res.status(500).send('Menu not found');
  }

  // Find matching option
  const option = menu.options.find(o => o.key === Digits);

  if (!option) {
    // Invalid option
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Invalid option. Please try again.</Say>
  <Redirect method="POST">/webhook/twilio/gather</Redirect>
</Response>`;
    return res.type('text/xml').send(twiml);
  }

  // Process the action
  const result = processAction(session, option.action, option.submenuId);

  if (result.shouldTransfer) {
    // Generate transfer TwiML
    const targetNumber = getTransferNumber(result.target!);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you now.</Say>
  <Dial timeout="30" action="/webhook/twilio/transfer-status" onSuccess="/webhook/twilio/status" onFailure="/webhook/twilio/status">
    <Number>${targetNumber}</Number>
  </Dial>
</Response>`;

    // Log transfer
    createTransfer(session.callId, 'ivr', result.target!, option.action);
    updateSession(session.id, { status: 'transferred', transferTarget: result.target });

    return res.type('text/xml').send(twiml);
  }

  if (result.prompt) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${result.prompt}</Say>
  ${result.nextMenuId ? `<Redirect method="POST">/webhook/twilio/redirect?menuId=${result.nextMenuId}</Redirect>` : '<Hangup/>'}
</Response>`;
    return res.type('text/xml').send(twiml);
  }

  if (result.nextMenuId) {
    updateSession(session.id, { currentMenu: result.nextMenuId });
    const twiml = generateTwiML(session);
    return res.type('text/xml').send(twiml);
  }

  // Default: return to current menu
  const twiml = generateTwiML(session);
  return res.type('text/xml').send(twiml);
});

/**
 * Redirect to a specific menu
 */
app.post('/webhook/twilio/redirect', (req: Request, res: Response) => {
  const { menuId, CallSid } = req.body;

  const session = Array.from(sessions.values()).find(s => s.callId === CallSid);
  if (session) {
    updateSession(session.id, { currentMenu: menuId });
    const twiml = generateTwiML(session);
    return res.type('text/xml').send(twiml);
  }

  res.status(404).send('Session not found');
});

/**
 * Handle call status callbacks
 */
app.post('/webhook/twilio/status', (req: Request, res: Response) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  logger.info('Call status update', { CallSid, CallStatus, CallDuration });

  // Find and update call
  const call = Array.from(calls.values()).find(c => c.callId === CallSid);
  if (call) {
    call.status = mapTwilioStatus(CallStatus);
    if (CallDuration) {
      call.duration = parseInt(CallDuration);
      call.endTime = new Date();
    }
    calls.set(call.id, call);
  }

  res.status(200).send('OK');
});

/**
 * Handle transfer status
 */
app.post('/webhook/twilio/transfer-status', (req: Request, res: Response) => {
  const { CallStatus, DialCallStatus, DialCallDuration } = req.body;

  logger.info('Transfer status', { CallStatus, DialCallStatus, DialCallDuration });

  res.status(200).send('OK');
});

/**
 * Record voicemail
 */
app.post('/webhook/twilio/voicemail', (req: Request, res: Response) => {
  const { CallSid, RecordingUrl, RecordingDuration, From } = req.body;

  logger.info('Voicemail recording', { CallSid, RecordingUrl, RecordingDuration });

  const voicemail = createVoicemail(
    CallSid,
    From,
    parseInt(RecordingDuration || '0'),
    RecordingUrl
  );

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your message has been recorded. A representative will return your call within 24 hours. Goodbye.</Say>
  <Hangup/>
</Response>`;

  res.type('text/xml').send(twiml);
});

function mapTwilioStatus(status: string): Call['status'] {
  const mapping: Record<string, Call['status']> = {
    'queued': 'incoming',
    'ringing': 'ringing',
    'in-progress': 'answered',
    'completed': 'completed',
    'busy': 'missed',
    'failed': 'missed',
    'no-answer': 'missed',
    'canceled': 'missed'
  };
  return mapping[status] || 'completed';
}

function getTransferNumber(target: string): string {
  const numbers: Record<string, string> = {
    'reception': process.env.RECEPTION_NUMBER || '+919876543210',
    'nurse_line': process.env.NURSE_LINE_NUMBER || '+919876543211',
    'emergency': process.env.EMERGENCY_NUMBER || '108',
    'doctor_on_call': process.env.DOCTOR_ON_CALL_NUMBER || '+919876543212',
    'billing_department': process.env.BILLING_NUMBER || '+919876543213',
    'lab_results': process.env.LAB_RESULTS_NUMBER || '+919876543214'
  };
  return numbers[target] || process.env.RECEPTION_NUMBER || '+919876543210';
}

// ============================================
// REST API ENDPOINTS
// ============================================

/**
 * Create a new IVR call
 */
app.post('/api/calls', async (req: Request, res: Response) => {
  try {
    const validated = createCallSchema.parse(req.body);
    const call = createCall(validated.phoneNumber, validated.direction, validated.metadata);
    const session = createSession(call.callId, validated.phoneNumber);

    res.status(201).json({ success: true, call, session });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create call' });
    }
  }
});

/**
 * Get call by ID
 */
app.get('/api/calls/:id', (req: Request, res: Response) => {
  const call = calls.get(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  res.json({ success: true, call });
});

/**
 * List all calls
 */
app.get('/api/calls', (req: Request, res: Response) => {
  const { status, limit = '100' } = req.query;
  let result = Array.from(calls.values());

  if (status) {
    result = result.filter(c => c.status === status);
  }

  result.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  result = result.slice(0, parseInt(limit as string));

  res.json({ success: true, calls: result, total: result.length });
});

/**
 * Get session by ID
 */
app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true, session });
});

/**
 * Get active sessions
 */
app.get('/api/sessions', (req: Request, res: Response) => {
  const activeSessions = Array.from(sessions.values()).filter(s => s.status === 'active');
  res.json({ success: true, sessions: activeSessions, total: activeSessions.length });
});

/**
 * Update session (process DTMF)
 */
app.post('/api/sessions/:id/update', (req: Request, res: Response) => {
  try {
    const validated = updateSessionSchema.parse(req.body);
    const session = sessions.get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (validated.digits) {
      session.collectedDigits += validated.digits;
      const menu = getMenu(session.currentMenu);
      const option = menu?.options.find(o => o.key === validated.digits);

      if (option) {
        const result = processAction(session, option.action, option.submenuId);
        if (result.nextMenuId) {
          session.currentMenu = result.nextMenuId;
        }
      }
    }

    updateSession(session.id, session);
    res.json({ success: true, session });
  } catch (error) {
    res.status(400).json({ error: 'Validation failed' });
  }
});

/**
 * Get voicemails
 */
app.get('/api/voicemails', (req: Request, res: Response) => {
  const { reviewed, limit = '50' } = req.query;
  let result = Array.from(voicemails.values());

  if (reviewed !== undefined) {
    result = result.filter(v => v.reviewed === (reviewed === 'true'));
  }

  result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  result = result.slice(0, parseInt(limit as string));

  res.json({ success: true, voicemails: result, total: result.length });
});

/**
 * Mark voicemail as reviewed
 */
app.put('/api/voicemails/:id/review', (req: Request, res: Response) => {
  const voicemail = voicemails.get(req.params.id);
  if (!voicemail) {
    return res.status(404).json({ error: 'Voicemail not found' });
  }

  voicemail.reviewed = true;
  voicemail.reviewedBy = req.body.reviewedBy;
  voicemail.notes = req.body.notes;
  voicemails.set(voicemail.id, voicemail);

  res.json({ success: true, voicemail });
});

/**
 * Get callback requests
 */
app.get('/api/callbacks', (req: Request, res: Response) => {
  const { status, limit = '50' } = req.query;
  let result = Array.from(callbackRequests.values());

  if (status) {
    result = result.filter(c => c.status === status);
  }

  result.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  result = result.slice(0, parseInt(limit as string));

  res.json({ success: true, callbacks: result, total: result.length });
});

/**
 * Create callback request
 */
app.post('/api/callbacks', (req: Request, res: Response) => {
  const { phoneNumber, reason, patientId, preferredTime } = req.body;

  if (!phoneNumber || !reason) {
    return res.status(400).json({ error: 'phoneNumber and reason are required' });
  }

  const callback = createCallbackRequest(phoneNumber, reason, patientId, preferredTime);
  res.status(201).json({ success: true, callback });
});

/**
 * Update callback request
 */
app.put('/api/callbacks/:id', (req: Request, res: Response) => {
  const callback = callbackRequests.get(req.params.id);
  if (!callback) {
    return res.status(404).json({ error: 'Callback request not found' });
  }

  const { status, assignedTo, notes } = req.body;
  if (status) callback.status = status;
  if (assignedTo) callback.assignedTo = assignedTo;
  if (notes) callback.notes = notes;

  callbackRequests.set(callback.id, callback);
  res.json({ success: true, callback });
});

/**
 * Get transfers
 */
app.get('/api/transfers', (req: Request, res: Response) => {
  const { completed, limit = '100' } = req.query;
  let result = Array.from(transfers.values());

  if (completed !== undefined) {
    result = result.filter(t => t.completed === (completed === 'true'));
  }

  result.sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime());
  result = result.slice(0, parseInt(limit as string));

  res.json({ success: true, transfers: result, total: result.length });
});

/**
 * Get IVR statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const allCalls = Array.from(calls.values());
  const allSessions = Array.from(sessions.values());
  const allVoicemails = Array.from(voicemails.values());
  const allCallbacks = Array.from(callbackRequests.values());

  const stats = {
    calls: {
      total: allCalls.length,
      completed: allCalls.filter(c => c.status === 'completed').length,
      missed: allCalls.filter(c => c.status === 'missed').length,
      transferred: allCalls.filter(c => c.status === 'transferred').length,
      voicemail: allCalls.filter(c => c.status === 'voicemail').length
    },
    sessions: {
      total: allSessions.length,
      active: allSessions.filter(s => s.status === 'active').length,
      completed: allSessions.filter(s => s.status === 'completed').length,
      abandoned: allSessions.filter(s => s.status === 'abandoned').length
    },
    voicemails: {
      total: allVoicemails.length,
      reviewed: allVoicemails.filter(v => v.reviewed).length,
      pending: allVoicemails.filter(v => !v.reviewed).length
    },
    callbacks: {
      total: allCallbacks.length,
      pending: allCallbacks.filter(c => c.status === 'pending').length,
      completed: allCallbacks.filter(c => c.status === 'completed').length
    },
    ivrMenus: {
      total: menus.size,
      languages: [...new Set(Array.from(menus.values()).map(m => m.language))]
    }
  };

  res.json({ success: true, stats });
});

/**
 * Get available IVR menus
 */
app.get('/api/menus', (req: Request, res: Response) => {
  const { language } = req.query;
  let result = Array.from(menus.values());

  if (language) {
    result = result.filter(m => m.language === language);
  }

  res.json({ success: true, menus: result, total: result.length });
});

/**
 * Create or update IVR menu
 */
app.post('/api/menus', (req: Request, res: Response) => {
  const menu = req.body as IVRMenu;
  if (!menu.id) {
    menu.id = uuidv4();
  }
  menus.set(menu.id, menu);
  logger.info('IVR menu created/updated', { menuId: menu.id });
  res.status(201).json({ success: true, menu });
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'carecode-ivr-system',
    version: '1.0.0',
    uptime: process.uptime(),
    stats: {
      activeSessions: Array.from(sessions.values()).filter(s => s.status === 'active').length,
      totalCalls: calls.size,
      pendingCallbacks: Array.from(callbackRequests.values()).filter(c => c.status === 'pending').length
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`CARECODE IVR System started on port ${PORT}`);
  logger.info(`Available menus: ${menus.size}`);
  logger.info(`Languages: ${[...new Set(Array.from(menus.values()).map(m => m.language))].join(', ')}`);
});

export default app;
