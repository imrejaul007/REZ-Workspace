import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 4861;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory data store (replace with database in production)
interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  stylist: string;
  dateTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string;
}

interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  availability: string[];
}

// Sample data
const services: Service[] = [
  { id: '1', name: 'Haircut & Styling', duration: '45 min', price: '$45', category: 'hair', description: 'Professional haircut with styling and finish' },
  { id: '2', name: 'Hair Coloring', duration: '90 min', price: '$120', category: 'hair', description: 'Full color treatment with premium products' },
  { id: '3', name: 'Highlights', duration: '120 min', price: '$150', category: 'hair', description: 'Partial or full highlights with color' },
  { id: '4', name: 'Manicure', duration: '30 min', price: '$25', category: 'nails', description: 'Classic manicure with polish' },
  { id: '5', name: 'Pedicure', duration: '45 min', price: '$35', category: 'nails', description: 'Spa pedicure with massage' },
  { id: '6', name: 'Facial Treatment', duration: '60 min', price: '$80', category: 'skincare', description: 'Deep cleansing facial with hydration' },
  { id: '7', name: 'Makeup Application', duration: '45 min', price: '$60', category: 'makeup', description: 'Professional makeup for any occasion' },
  { id: '8', name: 'Blowout', duration: '30 min', price: '$30', category: 'hair', description: 'Wash and blow dry styling' },
];

const stylists: Stylist[] = [
  { id: '1', name: 'Sophia', specialties: ['coloring', 'highlights'], availability: ['Mon', 'Wed', 'Fri', 'Sat'] },
  { id: '2', name: 'Emma', specialties: ['cutting', 'styling'], availability: ['Tue', 'Thu', 'Sat', 'Sun'] },
  { id: '3', name: 'Olivia', specialties: ['nails', 'pedicure'], availability: ['Mon', 'Tue', 'Wed', 'Thu'] },
  { id: '4', name: 'Ava', specialties: ['facials', 'skincare'], availability: ['Wed', 'Thu', 'Fri', 'Sat'] },
  { id: '5', name: 'Isabella', specialties: ['makeup', 'bridal'], availability: ['Mon', 'Fri', 'Sat', 'Sun'] },
];

const appointments: Appointment[] = [];

// IVR Menu Options
const IVR_MENU = `
Welcome to GLAMAI Beauty Salon!

Press 1 for Appointments and Booking
Press 2 for Service Information
Press 3 for Stylist Availability
Press 4 to Speak with an Operator
Press 0 to Repeat Menu
`;

// Helper function to generate IVR response
function generateIVRResponse(message: string, action?: string) {
  return {
    response: {
      message,
      action: action || 'prompt',
      timestamp: new Date().toISOString()
    }
  };
}

// POST /api/ivr - Main IVR endpoint
app.post('/api/ivr', (req: Request, res: Response) => {
  const { digits, callSid } = req.body;

  // Initial call or repeat menu
  if (!digits || digits === '0') {
    return res.json(generateIVRResponse(IVR_MENU));
  }

  switch (digits) {
    case '1':
      return res.json(generateIVRResponse(
        'To book an appointment, please say your name, preferred service, and desired date and time. Our AI will find the best available slot for you.',
        'book_appointment'
      ));

    case '2':
      const serviceList = services.map(s => `${s.name} - ${s.duration} - ${s.price}`).join('. ');
      return res.json(generateIVRResponse(
        `Our services include: ${serviceList}. Would you like to book one of these services?`,
        'service_info'
      ));

    case '3':
      const stylistList = stylists.map(s => `${s.name}, specializing in ${s.specialties.join(' and ')}`).join('. ');
      return res.json(generateIVRResponse(
        `Our stylists: ${stylistList}. For availability, please specify which stylist and date you prefer.`,
        'stylist_availability'
      ));

    case '4':
      return res.json(generateIVRResponse(
        'Connecting you to our front desk. Please hold.',
        'transfer_operator'
      ));

    default:
      return res.json(generateIVRResponse(
        'Invalid selection. ' + IVR_MENU
      ));
  }
});

// POST /api/appointments - Book an appointment
app.post('/api/appointments', (req: Request, res: Response) => {
  const { customerName, phone, service, stylist, dateTime } = req.body;

  if (!customerName || !phone || !service) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customerName, phone, service'
    });
  }

  // Validate service exists
  const selectedService = services.find(s => s.name.toLowerCase() === service.toLowerCase());
  if (!selectedService) {
    return res.status(400).json({
      success: false,
      error: 'Service not found. Available services: ' + services.map(s => s.name).join(', ')
    });
  }

  // Validate stylist if provided
  const selectedStylist = stylist ? stylists.find(s => s.name.toLowerCase() === stylist.toLowerCase()) : null;

  const appointment: Appointment = {
    id: uuidv4(),
    customerName,
    phone,
    service: selectedService.name,
    stylist: selectedStylist?.name || 'Any Available',
    dateTime: dateTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed'
  };

  appointments.push(appointment);

  res.json({
    success: true,
    appointment,
    message: `Appointment confirmed for ${customerName} on ${selectedService.name} with ${appointment.stylist}`
  });
});

// GET /api/appointments - Get all appointments
app.get('/api/appointments', (req: Request, res: Response) => {
  const { phone, date } = req.query;

  let filtered = appointments;

  if (phone) {
    filtered = filtered.filter(a => a.phone === phone);
  }

  if (date) {
    filtered = filtered.filter(a => a.dateTime.startsWith(date as string));
  }

  res.json({ appointments: filtered });
});

// GET /api/appointments/:id - Get appointment by ID
app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const appointment = appointments.find(a => a.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  res.json({ appointment });
});

// PATCH /api/appointments/:id - Update appointment
app.patch('/api/appointments/:id', (req: Request, res: Response) => {
  const index = appointments.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const { service, stylist, dateTime, status } = req.body;

  if (service) appointments[index].service = service;
  if (stylist) appointments[index].stylist = stylist;
  if (dateTime) appointments[index].dateTime = dateTime;
  if (status) appointments[index].status = status;

  res.json({
    success: true,
    appointment: appointments[index]
  });
});

// DELETE /api/appointments/:id - Cancel appointment
app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const index = appointments.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  appointments[index].status = 'cancelled';
  res.json({
    success: true,
    message: 'Appointment cancelled',
    appointment: appointments[index]
  });
});

// GET /api/services - Get all services
app.get('/api/services', (req: Request, res: Response) => {
  const { category } = req.query;

  if (category) {
    const filtered = services.filter(s => s.category === category);
    return res.json({ services: filtered, count: filtered.length });
  }

  res.json({ services, count: services.length });
});

// GET /api/services/:id - Get service by ID
app.get('/api/services/:id', (req: Request, res: Response) => {
  const service = services.find(s => s.id === req.params.id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.json({ service });
});

// GET /api/stylists - Get all stylists
app.get('/api/stylists', (req: Request, res: Response) => {
  const { specialty } = req.query;

  if (specialty) {
    const filtered = stylists.filter(s =>
      s.specialties.some(sp => sp.toLowerCase().includes((specialty as string).toLowerCase()))
    );
    return res.json({ stylists: filtered, count: filtered.length });
  }

  res.json({ stylists, count: stylists.length });
});

// GET /api/stylists/:id - Get stylist by ID
app.get('/api/stylists/:id', (req: Request, res: Response) => {
  const stylist = stylists.find(s => s.id === req.params.id);

  if (!stylist) {
    return res.status(404).json({ error: 'Stylist not found' });
  }

  res.json({ stylist });
});

// GET /api/stylists/:id/availability - Check stylist availability
app.get('/api/stylists/:id/availability', (req: Request, res: Response) => {
  const stylist = stylists.find(s => s.id === req.params.id);

  if (!stylist) {
    return res.status(404).json({ error: 'Stylist not found' });
  }

  const stylistAppointments = appointments.filter(
    a => a.stylist === stylist.name && a.status === 'confirmed'
  );

  res.json({
    stylist: stylist.name,
    availableDays: stylist.availability,
    bookedSlots: stylistAppointments.map(a => ({
      date: a.dateTime.split('T')[0],
      time: a.dateTime.split('T')[1]
    }))
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'GLAMAI Phone Receptionist',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎀 GLAMAI Phone Receptionist running on port ${PORT}`);
  console.log(`📞 IVR System ready at http://localhost:${PORT}/api/ivr`);
  console.log(`📅 Appointments API ready at http://localhost:${PORT}/api/appointments`);
  console.log(`✨ Services API ready at http://localhost:${PORT}/api/services`);
});

export default app;