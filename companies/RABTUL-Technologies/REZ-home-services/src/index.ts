/**
 * REZ Home Services Booking Service
 *
 * Appointment booking for:
 * - Home cleaning
 * - Plumbing
 * - Electrical
 * - AC repair
 * - Pest control
 * - Painting
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Logger
const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(`[HomeServices] ${msg}`, meta || ''),
  warn: (msg: string, meta?: Record<string, unknown>) => console.warn(`[HomeServices] ${msg}`, meta || ''),
  error: (msg: string, error?: unknown) => console.error(`[HomeServices] ${msg}`, error || ''),
};

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(express.json());

// Internal service authentication middleware
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
function requireInternalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  if (!token || (INTERNAL_TOKEN && token !== INTERNAL_TOKEN)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Service configuration
const HOME_SERVICES: Record<string, {
  name: string;
  duration: number;
  price: number;
  description: string;
  category: string;
}> = {
  'deep-cleaning': { name: 'Deep Cleaning', duration: 180, price: 2500, description: 'Complete home deep cleaning', category: 'cleaning' },
  'basic-cleaning': { name: 'Basic Cleaning', duration: 120, price: 1000, description: 'Standard home cleaning', category: 'cleaning' },
  'bathroom-cleaning': { name: 'Bathroom Cleaning', duration: 60, price: 500, description: 'Deep bathroom sanitization', category: 'cleaning' },
  'kitchen-cleaning': { name: 'Kitchen Cleaning', duration: 90, price: 800, description: 'Complete kitchen cleaning', category: 'cleaning' },
  'plumbing-repair': { name: 'Plumbing Repair', duration: 60, price: 400, description: 'General plumbing repairs', category: 'plumbing' },
  'plumbing-installation': { name: 'Plumbing Installation', duration: 120, price: 800, description: 'New fixture installation', category: 'plumbing' },
  'electrical-repair': { name: 'Electrical Repair', duration: 60, price: 400, description: 'Switch, socket, fan repair', category: 'electrical' },
  'electrical-installation': { name: 'Electrical Installation', duration: 90, price: 600, description: 'New wiring, fixtures', category: 'electrical' },
  'ac-service': { name: 'AC Service', duration: 60, price: 500, description: 'AC servicing and maintenance', category: 'ac' },
  'ac-repair': { name: 'AC Repair', duration: 90, price: 800, description: 'AC repair and gas top-up', category: 'ac' },
  'pest-control': { name: 'Pest Control', duration: 90, price: 1200, description: 'Full home pest treatment', category: 'pest' },
  'painting': { name: 'Home Painting', duration: 480, price: 5000, description: 'Full room painting', category: 'painting' },
  'carpenter': { name: 'Carpenter Service', duration: 120, price: 600, description: 'Furniture repair and assembly', category: 'carpenter' },
};

const CATEGORIES = ['cleaning', 'plumbing', 'electrical', 'ac', 'pest', 'painting', 'carpenter'];

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-home-services', timestamp: new Date().toISOString() });
});

// Get all services
app.get('/api/services', (req: Request, res: Response) => {
  const { category } = req.query;
  let services = Object.entries(HOME_SERVICES).map(([id, service]) => ({ id, ...service }));
  if (category && typeof category === 'string') {
    services = services.filter(s => s.category === category);
  }
  logger.info(`Fetched ${services.length} services`, { category });
  res.json({ success: true, data: services });
});

// Get service by ID
app.get('/api/services/:serviceId', (req: Request, res: Response) => {
  const service = HOME_SERVICES[req.params.serviceId];
  if (!service) {
    logger.warn(`Service not found: ${req.params.serviceId}`);
    return res.status(404).json({ success: false, error: 'Service not found' });
  }
  res.json({ success: true, data: { id: req.params.serviceId, ...service } });
});

// Get categories
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: CATEGORIES.map(cat => ({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1), icon: getCategoryIcon(cat) })),
  });
});

// Get available slots
app.get('/api/availability/:serviceId', (req: Request, res: Response) => {
  const service = HOME_SERVICES[req.params.serviceId];
  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }
  const slots = generateServiceSlots(req.query.date as string, service.duration);
  logger.info(`Generated ${slots.length} slots for ${req.params.serviceId}`, { date: req.query.date });
  res.json({ success: true, data: { serviceId: req.params.serviceId, service: service.name, slots } });
});

// Create booking (requires authentication)
app.post('/api/bookings', requireInternalAuth, async (req: Request, res: Response, next: NextFunction) => {
  const { serviceId, date, time, address, customerName, customerEmail, customerPhone, notes } = req.body;

  // Validate required fields
  if (!serviceId || !date || !time || !address || !customerPhone) {
    return res.status(400).json({ success: false, error: 'Missing required fields: serviceId, date, time, address, customerPhone' });
  }

  const service = HOME_SERVICES[serviceId];
  if (!service) {
    return res.status(400).json({ success: false, error: 'Invalid service' });
  }

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);
    const idempotencyKey = `home_${serviceId}_${date}_${time}_${customerPhone}_${Date.now()}`;

    logger.info('Creating booking', { serviceId, customerPhone, date, time });

    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        eventTypeId: `homeservices_${serviceId}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: customerName,
        attendeeEmail: customerEmail,
        attendeePhone: customerPhone,
        timezone: 'Asia/Kolkata',
        responses: { serviceType: serviceId, serviceName: service.name, address, notes },
      }),
    });

    if (!response.ok) {
      throw new Error(`Schedule API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      logger.info('Booking created via schedule service', { bookingUid: data.data?.uid });
      return res.status(201).json({
        success: true,
        data: {
          bookingUid: data.data.uid,
          confirmationId: `HS-${Date.now().toString(36).toUpperCase()}`,
          service: service.name, date, time,
          duration: service.duration,
          price: service.price,
          address,
          status: 'CONFIRMED',
        },
      });
    }

    throw new Error(data.error || 'Booking failed');
  } catch (error) {
    logger.error('Booking creation failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get booking
app.get('/api/bookings/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings/${bookingId}`, {
      headers: { 'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '' },
    });

    if (!response.ok) {
      if (response.status === 404) return res.status(404).json({ success: false, error: 'Booking not found' });
      throw new Error(`Schedule API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, data: data.data });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    next(error);
  }
});

// Cancel booking
app.patch('/api/bookings/:bookingId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) throw new Error(`Schedule API error: ${response.status}`);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    next(error);
  }
});

// Reschedule booking
app.patch('/api/bookings/:bookingId/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ success: false, error: 'Missing required fields: date, time' });

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '' },
      body: JSON.stringify({ date, time }),
    });

    if (!response.ok) throw new Error(`Schedule API error: ${response.status}`);
    const data = await response.json();
    res.json({ success: true, data: { uid: bookingId, date, time, status: 'RESCHEDULED', ...data.data } });
  } catch (error) {
    logger.error('Error rescheduling booking:', error);
    next(error);
  }
});

// Get user bookings
app.get('/api/bookings/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { status, limit = '20', offset = '0' } = req.query;
  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const params = new URLSearchParams({ userId, limit: limit as string, offset: offset as string });
    if (status) params.append('status', status as string);

    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings?${params}`, {
      headers: { 'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '' },
    });

    if (!response.ok) throw new Error(`Schedule API error: ${response.status}`);
    const data = await response.json();
    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    next(error);
  }
});

// Helper: Generate time slots
function generateServiceSlots(date: string | undefined, duration: number): unknown[] {
  const slots: unknown[] = [];
  const baseDate = date ? new Date(date) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (baseDate < today) return slots;

  const businessHours = { start: 8, end: 18 };
  for (let hour = businessHours.start; hour < businessHours.end; hour++) {
    const slotTime = new Date(baseDate);
    slotTime.setHours(hour, 0, 0, 0);
    if (slotTime <= new Date()) continue;
    if (new Date(slotTime.getTime() + duration * 60000).getHours() > businessHours.end) continue;

    const dayOfWeek = slotTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let baseAvailability = 0.7;
    if (isWeekend) baseAvailability = 0.5;
    if (slotTime.getHours() >= 10 && slotTime.getHours() <= 14) baseAvailability -= 0.2;

    const timeHash = hour + baseDate.getDate() + baseDate.getMonth();
    const available = (timeHash % 10) / 10 < baseAvailability;

    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      startTime: slotTime.toISOString(),
      endTime: new Date(slotTime.getTime() + duration * 60000).toISOString(),
      available,
    });
  }
  return slots;
}

// Helper: Get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = { cleaning: '🧹', plumbing: '🔧', electrical: '⚡', ac: '❄️', pest: '🐜', painting: '🎨', carpenter: '🪚' };
  return icons[category] || '🔧';
}

// Start server
const PORT = parseInt(process.env.PORT || '4093', 10);
app.listen(PORT, () => {
  logger.info(`Running on port ${PORT}`);
  logger.info(`Available services: ${Object.keys(HOME_SERVICES).length}`);
});

export default app;
