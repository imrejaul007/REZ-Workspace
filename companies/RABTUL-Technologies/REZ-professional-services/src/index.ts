/**
 * REZ Professional Services Booking Service
 *
 * Appointment booking for:
 * - Legal consultations
 * - Tax advisors
 * - Business consultants
 * - Career coaches
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-professional-services',
    timestamp: new Date().toISOString(),
  });
});

// Professional service types
const PROFESSIONAL_SERVICES: Record<string, {
  name: string;
  duration: number;
  price: number;
  description: string;
}> = {
  'legal-consultation': {
    name: 'Legal Consultation',
    duration: 30,
    price: 1500,
    description: 'Legal advice session',
  },
  'tax-consultation': {
    name: 'Tax Consultation',
    duration: 45,
    price: 2000,
    description: 'Tax planning and advice',
  },
  'business-consultation': {
    name: 'Business Strategy',
    duration: 60,
    price: 5000,
    description: 'Business growth consultation',
  },
  'career-coaching': {
    name: 'Career Coaching',
    duration: 45,
    price: 1500,
    description: 'Career guidance session',
  },
  'financial-planning': {
    name: 'Financial Planning',
    duration: 60,
    price: 2500,
    description: 'Personal finance planning',
  },
  'marketing-consultation': {
    name: 'Marketing Strategy',
    duration: 45,
    price: 3000,
    description: 'Digital marketing advice',
  },
  'hr-consultation': {
    name: 'HR Advisory',
    duration: 60,
    price: 4000,
    description: 'HR policies and compliance',
  },
  'it-consultation': {
    name: 'IT Consulting',
    duration: 30,
    price: 2000,
    description: 'Technology advice',
  },
};

// Get all services
app.get('/api/services', (req: Request, res: Response) => {
  const { category } = req.query;

  const services = Object.entries(PROFESSIONAL_SERVICES).map(([id, service]) => ({
    id,
    ...service,
  }));

  res.json({ success: true, data: services });
});

// Get service
app.get('/api/services/:serviceId', (req: Request, res: Response) => {
  const service = PROFESSIONAL_SERVICES[req.params.serviceId];

  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  res.json({ success: true, data: { id: req.params.serviceId, ...service } });
});

// Get availability
app.get('/api/availability/:serviceId', (req: Request, res: Response) => {
  const { date } = req.query;
  const service = PROFESSIONAL_SERVICES[req.params.serviceId];

  if (!service) {
    return res.status(404).json({ success: false, error: 'Service not found' });
  }

  const slots = generateSlots(date as string, service.duration);

  res.json({
    success: true,
    data: {
      serviceId: req.params.serviceId,
      slots,
    },
  });
});

// Create booking
app.post('/api/bookings', async (req: Request, res: Response) => {
  const {
    serviceId,
    date,
    time,
    clientName,
    clientEmail,
    clientPhone,
    company,
    notes,
  } = req.body;

  const service = PROFESSIONAL_SERVICES[serviceId];

  if (!service) {
    return res.status(400).json({ success: false, error: 'Invalid service' });
  }

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
      },
      body: JSON.stringify({
        eventTypeId: `professional_${serviceId}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: clientName,
        attendeeEmail: clientEmail,
        attendeePhone: clientPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          serviceType: serviceId,
          serviceName: service.name,
          company,
          notes,
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      return res.status(201).json({
        success: true,
        data: {
          bookingUid: data.data.uid,
          confirmationId: `PRO-${Date.now().toString(36).toUpperCase()}`,
          service: service.name,
          date,
          time,
          duration: service.duration,
          price: service.price,
          meetingLink: `https://meet.rez.money/${data.data.uid}`,
        },
      });
    }
  } catch {
    // Fall through to mock
  }

  res.status(201).json({
    success: true,
    data: {
      bookingUid: `mock_${Date.now()}`,
      confirmationId: `PRO-${Date.now().toString(36).toUpperCase()}`,
      service: service.name,
      date,
      time,
      duration: service.duration,
      price: service.price,
      meetingLink: 'https://meet.rez.money/consultation',
    },
  });
});

// Cancel booking
app.patch('/api/bookings/:bookingId/cancel', async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';
    await fetch(`${REZ_SCHEDULE_API}/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '' },
      body: JSON.stringify({ reason: 'Cancelled by client' }),
    });
  } catch {
    // Continue
  }

  res.json({ success: true, message: 'Booking cancelled' });
});

// Generate slots
function generateSlots(date: string, duration: number): unknown[] {
  const slots = [];
  const baseDate = date ? new Date(date) : new Date();

  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      if (startTime < new Date()) continue;

      const available = Math.random() > 0.4;

      slots.push({
        time: startTime.toTimeString().slice(0, 5),
        startTime: startTime.toISOString(),
        available,
      });
    }
  }

  return slots;
}

const PORT = process.env.PORT || 4094;

app.listen(PORT, () => {
  console.log(`[Professional Services] Running on port ${PORT}`);
});

export default app;
