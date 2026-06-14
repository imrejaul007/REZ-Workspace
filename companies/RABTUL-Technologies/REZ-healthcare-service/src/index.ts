/**
 * REZ Healthcare Booking Service
 *
 * Dedicated scheduling service for healthcare appointments:
 * - Doctor consultations
 * - Lab appointments
 * - Health checkups
 * - Teleconsultations
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-healthcare-service',
    timestamp: new Date().toISOString(),
  });
});

// Healthcare service types
const HEALTHCARE_SERVICES = {
  'doctor-consultation': {
    name: 'Doctor Consultation',
    duration: 15,
    price: 500,
    locationType: 'VIDEO_CALL',
  },
  'specialist-consultation': {
    name: 'Specialist Consultation',
    duration: 30,
    price: 1000,
    locationType: 'VIDEO_CALL',
  },
  'lab-appointment': {
    name: 'Lab Test Appointment',
    duration: 30,
    price: 0,
    locationType: 'IN_PERSON',
  },
  'health-checkup': {
    name: 'Full Health Checkup',
    duration: 60,
    price: 2500,
    locationType: 'IN_PERSON',
  },
  'dental-checkup': {
    name: 'Dental Checkup',
    duration: 30,
    price: 300,
    locationType: 'IN_PERSON',
  },
  'eye-checkup': {
    name: 'Eye Examination',
    duration: 30,
    price: 400,
    locationType: 'IN_PERSON',
  },
  'physiotherapy': {
    name: 'Physiotherapy Session',
    duration: 45,
    price: 600,
    locationType: 'IN_PERSON',
  },
  'teleconsultation': {
    name: 'Teleconsultation',
    duration: 15,
    price: 299,
    locationType: 'VIDEO_CALL',
  },
};

// Get available services
app.get('/api/services', (_req: Request, res: Response) => {
  const services = Object.entries(HEALTHCARE_SERVICES).map(([id, service]) => ({
    id,
    ...service,
  }));

  res.json({ success: true, data: services });
});

// Get service by ID
app.get('/api/services/:serviceId', (req: Request, res: Response) => {
  const service = HEALTHCARE_SERVICES[req.params.serviceId as keyof typeof HEALTHCARE_SERVICES];

  if (!service) {
    return res.status(404).json({
      success: false,
      error: 'Service not found',
    });
  }

  res.json({
    success: true,
    data: { id: req.params.serviceId, ...service },
  });
});

// Get availability for a healthcare service
app.get('/api/availability/:serviceId', async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const { date } = req.query;

  const service = HEALTHCARE_SERVICES[serviceId as keyof typeof HEALTHCARE_SERVICES];

  if (!service) {
    return res.status(404).json({
      success: false,
      error: 'Service not found',
    });
  }

  try {
    // In real implementation, call REZ-schedule-service
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const response = await fetch(
      `${REZ_SCHEDULE_API}/api/availability/healthcare/${serviceId}?` +
      new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      {
        headers: {
          'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }

    // Fallback: Generate mock slots
    const slots = generateMockSlots(service.duration, date as string);
    res.json({ success: true, data: { serviceId, slots } });
  } catch {
    // Fallback: Generate mock slots
    const slots = generateMockSlots(service.duration, date as string);
    res.json({ success: true, data: { serviceId, slots } });
  }
});

// Create healthcare booking
app.post('/api/bookings', async (req: Request, res: Response) => {
  const {
    serviceId,
    doctorId,
    startTime,
    endTime,
    patientName,
    patientEmail,
    patientPhone,
    symptoms,
    isNewPatient,
  } = req.body;

  const service = HEALTHCARE_SERVICES[serviceId as keyof typeof HEALTHCARE_SERVICES];

  if (!service) {
    return res.status(400).json({
      success: false,
      error: 'Invalid service',
    });
  }

  try {
    // In real implementation, call REZ-schedule-service
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const response = await fetch(`${REZ_SCHEDULE_API}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
      },
      body: JSON.stringify({
        eventTypeId: `healthcare_${serviceId}`,
        startTime,
        endTime,
        attendeeName: patientName,
        attendeeEmail: patientEmail,
        attendeePhone: patientPhone,
        timezone: 'Asia/Kolkata',
        responses: {
          serviceType: serviceId,
          doctorId,
          symptoms,
          isNewPatient,
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      return res.status(201).json({
        success: true,
        data: {
          bookingUid: data.data.uid,
          confirmationId: `HC-${Date.now().toString(36).toUpperCase()}`,
          service: service.name,
          startTime,
          endTime,
          meetingLink: service.locationType === 'VIDEO_CALL'
            ? `https://meet.rez.money/${data.data.uid}`
            : null,
          location: service.locationType === 'IN_PERSON'
            ? 'Medical Center, Mumbai'
            : null,
        },
      });
    }

    throw new Error(data.error);
  } catch (error) {
    // Mock response for demo
    res.status(201).json({
      success: true,
      data: {
        bookingUid: `mock_${Date.now()}`,
        confirmationId: `HC-${Date.now().toString(36).toUpperCase()}`,
        service: service.name,
        startTime,
        endTime,
        meetingLink: service.locationType === 'VIDEO_CALL'
          ? `https://meet.rez.money/consultation`
          : null,
        location: service.locationType === 'IN_PERSON'
          ? 'Medical Center, Mumbai'
          : null,
      },
    });
  }
});

// Get booking details
app.get('/api/bookings/:bookingUid', async (req: Request, res: Response) => {
  const { bookingUid } = req.params;

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const response = await fetch(
      `${REZ_SCHEDULE_API}/api/bookings/${bookingUid}`,
      {
        headers: {
          'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch {
    // Continue to mock response
  }

  // Mock response
  res.json({
    success: true,
    data: {
      uid: bookingUid,
      status: 'CONFIRMED',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 60000).toISOString(),
      service: 'Doctor Consultation',
    },
  });
});

// Cancel booking
app.patch('/api/bookings/:bookingUid/cancel', async (req: Request, res: Response) => {
  const { bookingUid } = req.params;
  const { reason } = req.body;

  try {
    const REZ_SCHEDULE_API = process.env.REZ_SCHEDULE_API_URL || 'http://localhost:4090';

    const response = await fetch(
      `${REZ_SCHEDULE_API}/api/bookings/${bookingUid}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REZ_SCHEDULE_API_KEY || '',
        },
        body: JSON.stringify({ reason }),
      }
    );

    const data = await response.json();
    return res.json(data);
  } catch {
    res.json({ success: true, message: 'Booking cancelled' });
  }
});

// Get doctors/specialists
app.get('/api/doctors', (req: Request, res: Response) => {
  const { specialty } = req.query;

  const doctors = [
    { id: 'dr-001', name: 'Dr. Priya Sharma', specialty: 'General Physician', rating: 4.9, experience: 15 },
    { id: 'dr-002', name: 'Dr. Amit Kumar', specialty: 'Cardiologist', rating: 4.8, experience: 20 },
    { id: 'dr-003', name: 'Dr. Sneha Patel', specialty: 'Dermatologist', rating: 4.9, experience: 12 },
    { id: 'dr-004', name: 'Dr. Rajesh Gupta', specialty: 'Orthopedic', rating: 4.7, experience: 18 },
    { id: 'dr-005', name: 'Dr. Neha Singh', specialty: 'Pediatrician', rating: 4.9, experience: 10 },
  ];

  const filtered = specialty
    ? doctors.filter(d => d.specialty.toLowerCase().includes((specialty as string).toLowerCase()))
    : doctors;

  res.json({ success: true, data: filtered });
});

// Generate mock time slots
function generateMockSlots(duration: number, date: string): unknown[] {
  const slots = [];
  const baseDate = date ? new Date(date) : new Date();
  baseDate.setHours(9, 0, 0, 0);

  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      // Skip past slots
      if (startTime < new Date()) continue;

      // Random availability
      const available = Math.random() > 0.3;

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available,
        time: startTime.toTimeString().slice(0, 5),
      });
    }
  }

  return slots;
}

// Start server
const PORT = process.env.PORT || 4091;

app.listen(PORT, () => {
  console.log(`[Healthcare] REZ Healthcare Service running on port ${PORT}`);
  console.log('[Healthcare] Available services:', Object.keys(HEALTHCARE_SERVICES).length);
});

export default app;
