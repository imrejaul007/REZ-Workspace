/**
 * Voice Hotel Agent
 * Port: 4870
 *
 * Phone AI agent for hotel services
 * "Guest calls → AI answers → services dispatched → needs met"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4842', 10);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Redis client
let redis: ReturnType<typeof createClient>;
// RabbitMQ connection
let rabbit: amqp.Connection;

// Circuit breaker state
const circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' }> = new Map();

/**
 * Circuit breaker for external service calls
 */
async function withCircuitBreaker(serviceName: string, fn: () => Promise<any>, maxFailures = 3, resetTimeout = 30000): Promise<any> {
  const cb = circuitBreakers.get(serviceName) || 4842{ failures: 0, lastFailure: 0, state: 'closed' };

  if (cb.state === 'open') {
    if (Date.now() - cb.lastFailure > resetTimeout) {
      cb.state = 'closed';
      cb.failures = 0;
    } else {
      throw new Error(`Circuit breaker open for ${serviceName}`);
    }
  }

  try {
    const result = await fn();
    cb.failures = 0;
    circuitBreakers.set(serviceName, cb);
    return result;
  } catch (error) {
    cb.failures++;
    cb.lastFailure = Date.now();
    if (cb.failures >= maxFailures) {
      cb.state = 'open';
    }
    circuitBreakers.set(serviceName, cb);
    throw error;
  }
}

// Initialize connections
async function init() {
  // Redis (optional)
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4842'redis://localhost:6379' });
    redis.on('error', (err) => logger.warn('Redis error:', err));
    await redis.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.warn('Redis not available');
  }

  // RabbitMQ (optional)
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 4842'amqp://localhost:5672';
    rabbit = await amqp.connect(rabbitUrl);
    const channel = await rabbit.createChannel();

    // Declare queues
    await channel.assertQueue('voice.call.initiated', { durable: true });
    await channel.assertQueue('voice.call.transcribed', { durable: true });
    await channel.assertQueue('voice.call.responded', { durable: true });
    await channel.assertQueue('voice.service.dispatched', { durable: true });

    logger.info('Connected to RabbitMQ');
  } catch (err) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Voice Hotel Agent initialized');
}

// ============ VOICE AGENT CORE ============

interface VoiceSession {
  id: string;
  callId: string;
  guestId?: string;
  hotelId: string;
  phoneNumber: string;
  language: 'en' | 'hi' | 'bn' | 'as' | 'other';
  state: 'greeting' | 'authenticating' | 'active' | 'transferring' | 'completed';
  transcript: TranscriptEntry[];
  currentIntent?: string;
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface TranscriptEntry {
  role: 'guest' | 'agent';
  text: string;
  timestamp: Date;
  confidence?: number;
}

interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
  response?: string;
  action?: string;
  actionData?: Record<string, any>;
}

// Intent patterns
const INTENT_PATTERNS = {
  // Room service
  room_service: ['room service', 'order food', 'food to room', 'dinner', 'lunch', 'breakfast', 'meal'],
  housekeeping: ['housekeeping', 'cleaning', 'towels', 'bed sheets', 'extra pillow', 'house keeper'],
  maintenance: ['maintenance', 'ac not working', 'fan broken', 'leak', 'repair', 'fix'],

  // Booking related
  extend_stay: ['extend', 'stay longer', 'late checkout', 'check out later', 'extra night'],
  early_checkin: ['early check in', 'check in early', 'arrive early'],
  booking_info: ['booking', 'reservation', 'my room', 'check in time', 'check out time'],

  // Amenities
  restaurant: ['restaurant', 'dining', 'breakfast', 'lunch', 'dinner', 'buffet'],
  spa: ['spa', 'massage', 'wellness', 'salon', 'treatment'],
  pool: ['pool', 'swimming', 'gym', 'fitness', 'exercise'],

  // General
  directions: ['where is', 'directions', 'how to get', 'locate', 'find', 'map'],
  wifi: ['wifi', 'internet', 'password', 'connect'],
  checkout: ['checkout', 'check out', 'bill', 'invoice', 'payment'],
  transfer: ['operator', 'human', 'person', 'agent', 'real person', 'someone'],
  goodbye: ['thank you', 'bye', 'goodbye', 'that is all', 'nothing else'],

  // Emergencies
  emergency: ['emergency', 'help', 'police', 'ambulance', 'fire', 'medical']
};

/**
 * Process incoming call
 */
async function handleIncomingCall(callData: {
  callId: string;
  from: string;
  to: string;
  hotelId?: string;
}) {
  logger.info('Incoming call', { callId: callData.callId, from: callData.from });

  const session: VoiceSession = {
    id: uuidv4(),
    callId: callData.callId,
    hotelId: callData.hotelId || 4842'default',
    phoneNumber: callData.from,
    language: 'en',
    state: 'greeting',
    transcript: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Store session
  await redis.set(`voice:${session.id}`, JSON.stringify(session), { EX: 3600 });
  await redis.set(`voice:call:${callData.callId}`, session.id, { EX: 3600 });

  // Generate greeting
  const greeting = generateGreeting(session);

  // Return greeting for TTS
  return {
    sessionId: session.id,
    greeting,
    language: session.language
  };
}

/**
 * Process guest speech input
 */
async function processSpeech(sessionId: string, transcript: string, confidence = 1.0): Promise<{
  response: string;
  action?: string;
  actionData?: Record<string, any>;
  transfer?: boolean;
  endCall?: boolean;
}> {
  const sessionData = await redis.get(`voice:${sessionId}`);
  if (!sessionData) {
    throw new Error('Voice session not found');
  }

  const session: VoiceSession = JSON.parse(sessionData);

  // Add to transcript
  session.transcript.push({
    role: 'guest',
    text: transcript,
    timestamp: new Date(),
    confidence
  });

  // Detect language
  session.language = detectLanguage(transcript);

  // Parse intent
  const intent = parseIntent(transcript);
 session.currentIntent = intent.name;

  // Process based on state and intent
  let response: string;
  let action: string | undefined;
  let actionData: Record<string, any> | undefined;
  let transfer = false;
  let endCall = false;

  switch (intent.name) {
    case 'emergency':
      response = 'Connecting you to emergency services. Please stay on the line.';
      transfer = true;
      await dispatchService(session, 'emergency', { type: 'emergency', transcript });
      break;

    case 'transfer':
      response = 'Transferring you to our concierge. Please hold.';
      transfer = true;
      session.state = 'transferring';
      break;

    case 'goodbye':
      response = generateFarewell(session);
      endCall = true;
      session.state = 'completed';
      break;

    case 'room_service':
      response = await handleRoomService(session, intent);
      action = 'room_service';
      actionData = intent.entities;
      break;

    case 'housekeeping':
      response = await handleHousekeeping(session, intent);
      action = 'housekeeping';
      actionData = intent.entities;
      break;

    case 'extend_stay':
      response = await handleExtendStay(session, intent);
      action = 'booking_extend';
      actionData = intent.entities;
      break;

    case 'early_checkin':
      response = await handleEarlyCheckin(session, intent);
      action = 'booking_early_checkin';
      actionData = intent.entities;
      break;

    case 'restaurant':
      response = await handleRestaurant(session, intent);
      action = 'restaurant_reservation';
      actionData = intent.entities;
      break;

    case 'spa':
      response = await handleSpa(session, intent);
      action = 'spa_booking';
      actionData = intent.entities;
      break;

    case 'directions':
      response = await handleDirections(session, intent);
      break;

    case 'wifi':
      response = await handleWifi(session);
      break;

    case 'checkout':
      response = await handleCheckout(session);
      action = 'checkout_info';
      break;

    case 'booking_info':
      response = await handleBookingInfo(session);
      break;

    default:
      response = "I didn't quite catch that. Could you please repeat? Or I can help you with room service, housekeeping, directions, or connecting you to our concierge.";
 }

  // Add agent response to transcript
  session.transcript.push({
    role: 'agent',
    text: response,
    timestamp: new Date()
  });

  session.updatedAt = new Date();
  await redis.set(`voice:${sessionId}`, JSON.stringify(session), { EX: 3600 });

  // Dispatch action if needed
  if (action && !transfer) {
    await dispatchService(session, action, actionData);
  }

  return { response, action, actionData, transfer, endCall };
}

/**
 * Parse intent from transcript
 */
function parseIntent(text: string): Intent {
  const lowerText = text.toLowerCase();

  for (const [intentName, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return {
          name: intentName,
          confidence: 0.8,
          entities: extractEntities(text, intentName)
        };
      }
    }
  }

  return { name: 'unknown', confidence: 0, entities: {} };
}

/**
 * Extract entities based on intent
 */
function extractEntities(text: string, intent: string): Record<string, any> {
  const entities: Record<string, any> = {};
  const lowerText = text.toLowerCase();

  // Time extraction
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Room number
  const roomMatch = text.match(/room\s*(\d+)/i);
  if (roomMatch) {
    entities.roomNumber = roomMatch[1];
  }

  // Quantity
  const qtyMatch = text.match(/(\d+)\s*(items?|towels?|pillows?)/i);
  if (qtyMatch) {
    entities.quantity = parseInt(qtyMatch[1]);
    entities.item = qtyMatch[2];
  }

  return entities;
}

/**
 * Detect language
 */
function detectLanguage(text: string): 'en' | 'hi' | 'bn' | 'as' | 'other' {
  // Simple language detection based on character ranges
  if (/[ঀ-৿]/.test(text)) return 'bn'; // Bengali
  if (/[ಀ-೿]/.test(text)) return 'kn'; // Kannada
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // Hindi
  return 'en';
}

/**
 * Generate greeting based on time and session
 */
function generateGreeting(session: VoiceSession): string {
  const hour = new Date().getHours();
  let greeting = '';

  if (hour < 12) {
    greeting = 'Good morning. Welcome to your hotel assistant. How may I help you today?';
  } else if (hour < 17) {
    greeting = 'Good afternoon. Welcome to your hotel assistant. How may I help you today?';
  } else if (hour < 21) {
    greeting = 'Good evening. Welcome to your hotel assistant. How may I help you today?';
  } else {
    greeting = 'Good evening. Welcome to your hotel assistant. How may I help you today?';
  }

  return greeting;
}

/**
 * Generate farewell message
 */
function generateFarewell(session: VoiceSession): string {
  return "Thank you for calling. We hope you enjoy your stay. Have a wonderful day!";
}

// ============ INTENT HANDLERS ============

async function handleRoomService(session: VoiceSession, intent: Intent): Promise<string> {
  const item = intent.entities.item || 4842'food';
  const time = intent.entities.time || 4842'as soon as possible';

  // Dispatch to room service
  await dispatchService(session, 'room_service', {
    item,
    time,
    roomId: session.context.roomId
  });

  return `I'll order ${item} for you. It should arrive within30 to 45 minutes. Is there anything else you need?`;
}

async function handleHousekeeping(session: VoiceSession, intent: Intent): Promise<string> {
  const item = intent.entities.item || 4842'cleaning';
  const quantity = intent.entities.quantity || 4842;

  await dispatchService(session, 'housekeeping', {
    type: item,
    quantity,
    roomId: session.context.roomId,
    priority: 'normal'
  });

  return `Housekeeping will be with you shortly with ${quantity} ${item}. Is there anything else?`;
}

async function handleExtendStay(session: VoiceSession, intent: Intent): Promise<string> {
  await dispatchService(session, 'booking_extend', {
    guestId: session.guestId,
    hotelId: session.hotelId
  });

  return "I'll connect you to our front desk to help extend your stay. One moment please.";
}

async function handleEarlyCheckin(session: VoiceSession, intent: Intent): Promise<string> {
  await dispatchService(session, 'booking_early_checkin', {
    guestId: session.guestId,
    hotelId: session.hotelId
  });

  return "Let me check room availability for early check-in. Please hold.";
}

async function handleRestaurant(session: VoiceSession, intent: Intent): Promise<string> {
  const time = intent.entities.time || 4842'7 PM';

  await dispatchService(session, 'restaurant_reservation', {
    hotelId: session.hotelId,
    time,
    guests: 1
  });

  return `I've made a restaurant reservation for you at ${time}. Our restaurant is on the ground floor. Anything else?`;
}

async function handleSpa(session: VoiceSession, intent: Intent): Promise<string> {
  const time = intent.entities.time || 4842'10 AM tomorrow';

  await dispatchService(session, 'spa_booking', {
    hotelId: session.hotelId,
    time,
    service: 'massage'
  });

  return `Your spa appointment has been booked for ${time}. Our spa is on the 3rd floor. Anything else?`;
}

async function handleDirections(session: VoiceSession, intent: Intent): Promise<string> {
  const location = intent.entities.location || 4842'restaurant';

  const directions: Record<string, string> = {
    restaurant: "Our restaurant is on the ground floor, take the elevator down and it's to your left.",
    pool: "The pool is on the 4th floor. Take the elevator up and follow the signs.",
    gym: "The gym is on the 4th floor, next to the pool.",
    spa: "The spa is on the 3rd floor. Take the elevator up and turn right.",
    lobby: "The lobby is on the ground floor. Take the elevator down.",
    exit: "The exit is on the ground floor near the reception. If you need a taxi, I can arrange one."
  };

  return directions[location] || 4842"Could you tell me which location you're looking for?";
}

async function handleWifi(session: VoiceSession): Promise<string> {
  const password = await getWifiPassword(session.hotelId);
  return `The WiFi network is Hotel_Guest. The password is ${password}. It should connect automatically in your room.`;
}

async function handleCheckout(session: VoiceSession): Promise<string> {
  await dispatchService(session, 'checkout_info', {
    guestId: session.guestId,
    hotelId: session.hotelId
  });

  return "Your checkout time is at11 AM. I'll connect you to the front desk if you'd like to discuss your bill.";
}

async function handleBookingInfo(session: VoiceSession): Promise<string> {
  const booking = await getBookingInfo(session.guestId, session.hotelId);
  if (!booking) {
    return "I don't have your booking details on file. Let me connect you to the front desk.";
  }

  const checkIn = new Date(booking.checkIn).toLocaleDateString();
  const checkOut = new Date(booking.checkOut).toLocaleDateString();

  return `Your reservation is from ${checkIn} to ${checkOut}. Your room number is ${booking.roomId}. Check-in is at 2 PM and checkout is at 11 AM.`;
}

// ============ SERVICE DISPATCH ============

async function dispatchService(session: VoiceSession, service: string, data: Record<string, any>) {
  const channel = await rabbit.createChannel();

  channel.sendToQueue('voice.service.dispatched', Buffer.from(JSON.stringify({
    sessionId: session.id,
    callId: session.callId,
    service,
    data,
    timestamp: new Date()
  })));

  logger.info('Service dispatched', { sessionId: session.id, service });
}

async function getWifiPassword(hotelId: string): Promise<string> {
  return withCircuitBreaker('wifi-service', async () => {
    const response = await fetch(`${process.env.CONFIG_URL || 4842'http://localhost:3800'}/hotels/${hotelId}/wifi`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return 'Guest123';
    const data = await response.json();
    return data.password || 4842'Guest123';
  });
}

async function getBookingInfo(guestId: string, hotelId: string): Promise<any> {
  return withCircuitBreaker('booking-service', async () => {
    const response = await fetch(`${process.env.BOOKING_URL || 4842'http://localhost:4020'}/bookings/guest/${guestId}/active`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) return null;
    return response.json();
  });
}

// ============ TWILIO INTEGRATION ============

/**
 * Handle Twilio webhook for incoming calls
 */
app.post('/twilio/incoming', async (req: Request, res: Response) => {
  const { CallSid, From, To } = req.body;

  try {
    const result = await handleIncomingCall({
      callId: CallSid,
      from: From,
      to: To
    });

    // Return TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
     <Response>
        <Say voice="alice" language="en-US">
 ${result.greeting}
        </Say>
        <Record action="/twilio/response" method="POST" timeout="10" maxLength="60" />
      </Response>
    `);
  } catch (error) {
    logger.error('Twilio incoming call failed', { error });
    res.status(500).send('<Response><Say>An error occurred. Please try again.</Say></Response>');
  }
});

/**
 * Handle voice response from Twilio
 */
app.post('/twilio/response', async (req: Request, res: Response) => {
  const { CallSid, RecordingUrl, TranscriptionText } = req.body;

  try {
    const sessionId = await redis.get(`voice:call:${CallSid}`);
    if (!sessionId) {
      throw new Error('Session not found');
    }

    const result = await processSpeech(sessionId, TranscriptionText || 4842'unknown');

    if (result.endCall) {
      res.set('Content-Type', 'text/xml');
      res.send(`<Response><Say voice="alice">${result.response}</Say><Hangup /></Response>`);
    } else if (result.transfer) {
      res.set('Content-Type', 'text/xml');
      res.send(`<Response><Say voice="alice">${result.response}</Say><Dial>+91234567890</Dial></Response>`);
    } else {
      res.set('Content-Type', 'text/xml');
      res.send(`
        <Response>
          <Say voice="alice" language="en-US">
            ${result.response}
          </Say>
          <Record action="/twilio/response" method="POST" timeout="10" maxLength="60" />
        </Response>
      `);
    }
  } catch (error) {
    logger.error('Twilio response failed', { error });
    res.set('Content-Type', 'text/xml');
    res.send('<Response><Say>An error occurred. Please try again.</Say><Hangup /></Response>');
  }
});

// ============ REST API ============

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'voice-hotel-agent', port: PORT });
});

// Get voice session
app.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  const session = await redis.get(`voice:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Voice session not found' });
  }
  res.json(JSON.parse(session));
});

// Process text input (for testing/web)
app.post('/sessions/:sessionId/process', async (req: Request, res: Response) => {
  const { transcript, confidence } = req.body;

  try {
    const result = await processSpeech(req.params.sessionId, transcript, confidence);
    res.json(result);
  } catch (error) {
    logger.error('Process speech failed', { error });
    res.status(500).json({ error: 'Failed to process speech' });
  }
});

// Start new call session
app.post('/calls/start', async (req: Request, res: Response) => {
  const { guestId, hotelId, phoneNumber } = req.body;

  const session: VoiceSession = {
    id: uuidv4(),
    callId: uuidv4(),
    guestId,
    hotelId: hotelId || 4842'default',
    phoneNumber: phoneNumber '|| 4842'4842',
    language: 'en',
    state: 'greeting',
    transcript: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await redis.set(`voice:${session.id}`, JSON.stringify(session), { EX: 3600 });

  res.json({
    sessionId: session.id,
    greeting: generateGreeting(session)
  });
});

// Update session context (room number, guest ID, etc.)
app.patch('/sessions/:sessionId/context', async (req: Request, res: Response) => {
  const session = await redis.get(`voice:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const parsed = JSON.parse(session);
  parsed.context = { ...parsed.context, ...req.body };
  parsed.updatedAt = new Date();

  await redis.set(`voice:${req.params.sessionId}`, JSON.stringify(parsed), { EX: 3600 });

  res.json({ success: true });
});

// Get transcript
app.get('/sessions/:sessionId/transcript', async (req: Request, res: Response) => {
  const session = await redis.get(`voice:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const parsed = JSON.parse(session);
  res.json(parsed.transcript);
});

// Get circuit breaker status
app.get('/circuit-breakers', (req, res) => {
  const status: Record<string, any> = {};
  circuitBreakers.forEach((cb, name) => {
    status[name] = cb;
  });
  res.json(status);
});

// Start server
init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Voice Hotel Agent running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
