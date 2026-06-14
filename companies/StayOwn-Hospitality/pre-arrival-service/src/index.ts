/**
 * Pre-Arrival Service
 * Port: 3828
 *
 * Collect guest preferences before arrival
 * "Guest books → preferences collected → room prepared → welcome personalized"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3828;

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

// In-memory session store (fallback when Redis is unavailable)
const preArrivalSessions: Map<string, PreArrivalSession> = new Map();

/**
 * Circuit breaker for external service calls
 */
async function withCircuitBreaker(serviceName: string, fn: () => Promise<any>, maxFailures = 3, resetTimeout = 30000): Promise<any> {
  const cb = circuitBreakers.get(serviceName) || { failures: 0, lastFailure: 0, state: 'closed' };

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
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', (err) => logger.warn('Redis error:', err));
    await redis.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.warn('Redis not available, using in-memory storage');
  }

  // RabbitMQ (optional)
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    rabbit = await amqp.connect(rabbitUrl);
    const channel = await rabbit.createChannel();

    // Declare queues
    await channel.assertQueue('prearrival.booking.created', { durable: true });
    await channel.assertQueue('prearrival.preferences.collected', { durable: true });
    await channel.assertQueue('prearrival.reminder.sent', { durable: true });
    await channel.assertQueue('prearrival.ready', { durable: true });

    // Consume events
    channel.consume('prearrival.booking.created', handleBookingCreated);

    logger.info('Connected to RabbitMQ');
  } catch (err) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Pre-Arrival Service initialized');
}

// ============ PRE-ARRIVAL FLOW ============

interface PreArrivalSession {
  id: string;
  guestId: string;
  hotelId: string;
  roomId: string;
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  status: 'created' | 'preferences_pending' | 'preferences_collected' | 'room_prepared' | 'ready';
  preferences: GuestPreferences;
  roomSetup: RoomSetup;
  welcomeMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GuestPreferences {
  // Room preferences
  pillowType?: 'firm' | 'soft' | 'memory_foam' | 'down';
  bedConfiguration?: 'single' | 'double' | 'twin' | 'king';
  roomTemperature?: number;
  roomView?: 'city' | 'garden' | 'pool' | 'sea' | 'no_preference';
  floorPreference?: number;
  quietRoom?: boolean;

  // Amenities
  toiletries?: string[];
  minibarPreferences?: string[];
  teaCoffeePreferences?: string[];

  // Dining
  breakfast?: 'included' | 'not_included' | 'preference_pending';
  breakfastPreferences?: string[];
  dietaryRestrictions?: string[];

  // Services
  airportPickup?: boolean;
  airportPickupDetails?: { flightNumber: string; arrivalTime: Date };
  earlyCheckin?: boolean;
  lateCheckout?: boolean;
  specialRequests?: string;

  // Personal
  celebrationType?: 'birthday' | 'anniversary' | 'honeymoon' | 'other' | 'none';
  accessibilityNeeds?: string[];
  languagePreference?: string;

  // Meta
  collectedAt?: Date;
  collectionMethod?: 'link' | 'app' | 'phone' | 'email' | 'concierge';
}

interface RoomSetup {
  roomId?: string;
  roomType?: string;
  amenities?: string[];
  welcomeAmenity?: string;
  preparedBy?: string;
  preparedAt?: Date;
}

/**
 * Handle new booking created
 */
async function handleBookingCreated(msg: amqp.ConsumeMessage) {
  const data = JSON.parse(msg.content.toString());
  logger.info('New booking received', { bookingId: data.bookingId, guestId: data.guestId });

  const session: PreArrivalSession = {
    id: uuidv4(),
    guestId: data.guestId,
    hotelId: data.hotelId,
    roomId: data.roomId,
    bookingId: data.bookingId,
    checkIn: new Date(data.checkIn),
    checkOut: new Date(data.checkOut),
    status: 'created',
    preferences: {},
    roomSetup: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Store session
  await redis.set(`prearrival:${session.id}`, JSON.stringify(session), { EX: 86400 * 30 });
  await redis.set(`prearrival:guest:${data.guestId}:${data.bookingId}`, session.id, { EX: 86400 * 30 });

  // Calculate time until check-in
  const hoursUntilCheckIn = (new Date(data.checkIn).getTime() - Date.now()) / (1000 * 60 * 60);

  // If more than 24 hours, send preference collection link
  if (hoursUntilCheckIn > 24) {
    await sendPreferenceCollectionLink(session);
  } else {
    // Short notice - quick preference collection
    await sendPreferenceCollectionLink(session, true);
  }
}

/**
 * Send preference collection link via multiple channels
 */
async function sendPreferenceCollectionLink(session: PreArrivalSession, isUrgent = false) {
  const collectionLink = `${process.env.FRONTEND_URL || 'https://rez.app'}/pre-arrival/${session.id}`;

  // Get guest contact info
  const guest = await getGuestProfile(session.guestId);

  // Send via multiple channels
  await Promise.allSettled([
    // Email
    sendEmail(guest.email, 'pre_arrival_survey', {
      guestName: guest.name,
      link: collectionLink,
      checkIn: session.checkIn,
      hotelName: session.hotelId
    }),
    // SMS (if urgent)
    isUrgent ? sendSMS(guest.phone, `Your stay at ${session.hotelId} is coming up! Please share your preferences: ${collectionLink}`) : Promise.resolve(),
    // Push notification (if has app)
    guest.pushToken ? sendPush(guest.pushToken, 'Share Your Preferences', collectionLink) : Promise.resolve()
  ]);

  session.status = 'preferences_pending';
  session.updatedAt = new Date();
  await redis.set(`prearrival:${session.id}`, JSON.stringify(session));

  // Schedule reminder if not collected within 12 hours
  const reminderTime = new Date(session.checkIn.getTime() - 12 * 60 * 60 * 1000);
  if (reminderTime > new Date()) {
    await scheduleReminder(session, reminderTime);
  }

  logger.info('Preference collection link sent', { sessionId: session.id, channels: ['email', isUrgent ? 'sms' : null, guest.pushToken ? 'push' : null].filter(Boolean) });
}

async function getGuestProfile(guestId: string): Promise<any> {
  return withCircuitBreaker('guest-service', async () => {
    const response = await fetch(`${process.env.GUEST_SERVICE_URL || 'http://localhost:3800'}/guests/${guestId}`, {
      headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
    if (!response.ok) throw new Error('Failed to fetch guest');
    return response.json();
  });
}

async function sendEmail(email: string, template: string, data: any): Promise<boolean> {
  return withCircuitBreaker('email-service', async () => {
    const response = await fetch(`${process.env.EMAIL_URL || 'http://localhost:4510'}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, template, data })
    });
    return response.ok;
  });
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  return withCircuitBreaker('sms-service', async () => {
    const response = await fetch(`${process.env.SMS_URL || 'http://localhost:4510'}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message })
    });
    return response.ok;
  });
}

async function sendPush(pushToken: string, title: string, body: string): Promise<boolean> {
  return withCircuitBreaker('push-service', async () => {
    const response = await fetch(`${process.env.PUSH_URL || 'http://localhost:4510'}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken, title, body })
    });
    return response.ok;
  });
}

async function scheduleReminder(session: PreArrivalSession, at: Date) {
  const delay = at.getTime() - Date.now();
  setTimeout(async () => {
    const currentSession = await redis.get(`prearrival:${session.id}`);
    if (currentSession && JSON.parse(currentSession).status === 'preferences_pending') {
      await sendReminder(session);
 }
  }, Math.max(0, delay));
}

async function sendReminder(session: PreArrivalSession) {
  const guest = await getGuestProfile(session.guestId);
  const collectionLink = `${process.env.FRONTEND_URL || 'https://rez.app'}/pre-arrival/${session.id}`;

  await sendEmail(guest.email, 'pre_arrival_reminder', {
    guestName: guest.name,
    link: collectionLink,
    checkIn: session.checkIn
  });

  // Publish reminder sent event
  const channel = await rabbit.createChannel();
  channel.sendToQueue('prearrival.reminder.sent', Buffer.from(JSON.stringify({
    sessionId: session.id,
    guestId: session.guestId
  })));

  logger.info('Reminder sent', { sessionId: session.id });
}

/**
 * Process collected preferences
 */
async function processPreferences(sessionId: string, preferences: GuestPreferences) {
  const sessionData = await redis.get(`prearrival:${sessionId}`);
  if (!sessionData) {
    throw new Error('Pre-arrival session not found');
  }

  const session: PreArrivalSession = JSON.parse(sessionData);
  session.preferences = { ...session.preferences, ...preferences, collectedAt: new Date() };
  session.status = 'preferences_collected';
  session.updatedAt = new Date();

  await redis.set(`prearrival:${sessionId}`, JSON.stringify(session));

  // Publish preferences collected event
  const channel = await rabbit.createChannel();
  channel.sendToQueue('prearrival.preferences.collected', Buffer.from(JSON.stringify({
    sessionId,
    guestId: session.guestId,
    preferences
  })));

  // Trigger room preparation
  await prepareRoom(session);

  logger.info('Preferences collected', { sessionId });
}

/**
 * Prepare room based on preferences
 */
async function prepareRoom(session: PreArrivalSession) {
  const setup: RoomSetup = {};

  // Room assignment
  const roomAssignment = await assignRoom(session);
  setup.roomId = roomAssignment.roomId;
  setup.roomType = roomAssignment.roomType;

  // Amenities based on preferences
  setup.amenities = [];
  if (session.preferences.toiletries) {
    setup.amenities.push(...session.preferences.toiletries);
  }
  if (session.preferences.minibarPreferences) {
    // Signal minibar service
    await configureMinibar(session);
  }

  // Welcome amenity based on celebration
  if (session.preferences.celebrationType && session.preferences.celebrationType !== 'none') {
    setup.welcomeAmenity = getWelcomeAmenity(session.preferences.celebrationType);
  }

  // Notify housekeeping
  await notifyHousekeeping(session, setup);

  session.roomSetup = setup;
  session.status = 'room_prepared';
  session.updatedAt = new Date();

  await redis.set(`prearrival:${session.id}`, JSON.stringify(session));

  // Generate personalized welcome message
  session.welcomeMessage = generateWelcomeMessage(session);
  await redis.set(`prearrival:${session.id}`, JSON.stringify(session));

  // Publish ready event
  const channel = await rabbit.createChannel();
  channel.sendToQueue('prearrival.ready', Buffer.from(JSON.stringify({
    sessionId: session.id,
    guestId: session.guestId,
    roomId: setup.roomId,
    preferences: session.preferences,
    welcomeMessage: session.welcomeMessage
  })));

  logger.info('Room prepared', { sessionId, roomId: setup.roomId });
}

async function assignRoom(session: PreArrivalSession): Promise<{ roomId: string; roomType: string }> {
  return withCircuitBreaker('room-service', async () => {
    const response = await fetch(`${process.env.ROOM_SERVICE_URL || 'http://localhost:3800'}/rooms/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        hotelId: session.hotelId,
        checkIn: session.checkIn,
        checkOut: session.checkOut,
        preferences: {
          floor: session.preferences.floorPreference,
          view: session.preferences.roomView,
          quiet: session.preferences.quietRoom,
          roomType: session.preferences.bedConfiguration
        }
      })
    });
    if (!response.ok) throw new Error('Room assignment failed');
    return response.json();
  });
}

async function configureMinibar(session: PreArrivalSession) {
  return withCircuitBreaker('minibar-service', async () => {
    const response = await fetch(`${process.env.MINIBAR_URL || 'http://localhost:3810'}/guests/${session.guestId}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: session.preferences.minibarPreferences
      })
    });
    return response.ok;
  });
}

async function notifyHousekeeping(session: PreArrivalSession, setup: RoomSetup) {
  return withCircuitBreaker('housekeeping-service', async () => {
    const response = await fetch(`${process.env.HOUSEKEEPING_URL || 'http://localhost:3826'}/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: session.hotelId,
        roomId: setup.roomId,
        type: 'pre_arrival_setup',
        priority: 'high',
        instructions: {
          preferences: session.preferences,
          welcomeAmenity: setup.welcomeAmenity,
          checkIn: session.checkIn
        }
      })
    });
    return response.ok;
  });
}

function getWelcomeAmenity(celebrationType: string): string {
  const amenities: Record<string, string> = {
    birthday: 'Birthday cake + champagne',
    anniversary: 'Romantic dinner setup + roses',
    honeymoon: 'Champagne + rose petals + late checkout',
    other: 'Welcome fruit basket + wine'
  };
  return amenities[celebrationType] || 'Welcome fruit basket';
}

function generateWelcomeMessage(session: PreArrivalSession): string {
  const guest = session.guestId; // Would fetch actual name
  const hotel = session.hotelId;
  const checkIn = new Date(session.checkIn).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  let message = `Namaste! We're delighted to welcome you to ${hotel}. `;

  if (session.preferences.celebrationType && session.preferences.celebrationType !== 'none') {
    message += `Congratulations on your ${session.preferences.celebrationType}! `;
  }

  message += `Your room is ready and prepared just for you. `;

  if (session.preferences.airportPickup) {
    message += `Your airport transfer will be waiting for you. `;
  }

  message += `Should you need anything, your AI concierge Genie is available 24/7.`;

  return message;
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pre-arrival-service', port: PORT });
});

// Create pre-arrival session (triggered by booking)
app.post('/prearrival', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, bookingId, checkIn, checkOut } = req.body;

  const session: PreArrivalSession = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    bookingId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    status: 'created',
    preferences: {},
    roomSetup: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Store session in memory (Redis not available)
  preArrivalSessions.set(session.id, session);

  // Notify housekeeping for room preparation
  await notifyHousekeeping(session, {});

  logger.info('Pre-arrival session created', { sessionId: session.id, guestId, bookingId });
  res.status(201).json(session);
});

// Get pre-arrival session
app.get('/prearrival/:sessionId', async (req: Request, res: Response) => {
  // Try memory store first
  const session = preArrivalSessions.get(req.params.sessionId);
  if (session) {
    return res.json(session);
  }
  // Fallback to Redis
  try {
    const redisSession = await redis.get(`prearrival:${req.params.sessionId}`);
    if (!redisSession) {
      return res.status(404).json({ error: 'Pre-arrival session not found' });
    }
    res.json(JSON.parse(redisSession));
  } catch {
    return res.status(404).json({ error: 'Pre-arrival session not found' });
  }
});

// Get session by guest + booking
app.get('/prearrival/guest/:guestId/booking/:bookingId', async (req: Request, res: Response) => {
  const sessionId = await redis.get(`prearrival:guest:${req.params.guestId}:${req.params.bookingId}`);
  if (!sessionId) {
    return res.status(404).json({ error: 'Pre-arrival session not found' });
  }
  const session = await redis.get(`prearrival:${sessionId}`);
  res.json(session ? JSON.parse(session) : { error: 'Session not found' });
});

// Submit preferences
app.post('/prearrival/:sessionId/preferences', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const preferences = req.body as GuestPreferences;

  // Find session in memory or Redis
  let session = preArrivalSessions.get(sessionId);
  if (!session) {
    try {
      const redisSession = await redis.get(`prearrival:${sessionId}`);
      if (redisSession) session = JSON.parse(redisSession);
    } catch { /* Redis unavailable */ }
  }

  if (!session) {
    return res.status(404).json({ error: 'Pre-arrival session not found' });
  }

  // Update session with preferences
  session.preferences = { ...session.preferences, ...preferences, collectedAt: new Date() };
  session.status = 'preferences_collected';
  session.updatedAt = new Date();

  // Store back
  preArrivalSessions.set(sessionId, session);
  try {
    await redis.set(`prearrival:${sessionId}`, JSON.stringify(session));
  } catch { /* Redis unavailable */ }

  logger.info('Preferences saved', { sessionId });
  res.json({ success: true, message: 'Preferences saved', preferences: session.preferences });
});

// Get preference form data
app.get('/prearrival/:sessionId/form', async (req: Request, res: Response) => {
  const session = await redis.get(`prearrival:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const parsed = JSON.parse(session);

  // Return form structure with current values
  res.json({
    sessionId: parsed.id,
    checkIn: parsed.checkIn,
    hotelId: parsed.hotelId,
    currentPreferences: parsed.preferences,
    formOptions: {
      pillowTypes: ['firm', 'soft', 'memory_foam', 'down'],
      bedConfigurations: ['single', 'double', 'twin', 'king'],
      roomViews: ['city', 'garden', 'pool', 'sea', 'no_preference'],
      celebrationTypes: ['birthday', 'anniversary', 'honeymoon', 'other', 'none'],
      dietaryRestrictions: ['vegetarian', 'vegan', 'gluten_free', 'nut_allergy', 'halal', 'kosher', 'none']
    }
  });
});

// Manual trigger (for concierge)
app.post('/prearrival/:sessionId/trigger', async (req: Request, res: Response) => {
  const session = await redis.get(`prearrival:${req.params.sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const parsed = JSON.parse(session);
  await sendPreferenceCollectionLink(parsed);

  res.json({ success: true, message: 'Collection link sent' });
});

// Get pending sessions for hotel
app.get('/prearrival/hotel/:hotelId/pending', async (req: Request, res: Response) => {
  // This would typically query from DB, simplified here
  res.json({ pending: [] });
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
    logger.info(`Pre-Arrival Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
