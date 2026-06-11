import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4852;

app.use(express.json());

// Types
interface PatientIntake {
  id: string;
  name: string;
  phone: string;
  dateOfBirth: string;
  symptoms: string[];
  medicalHistory: string[];
  emergencyContact: string;
  preferredLanguage: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'checkup';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface MedicationReminder {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'weekly' | 'as_needed';
  time: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface HealthTip {
  id: string;
  category: 'nutrition' | 'exercise' | 'mental_health' | 'preventive' | 'lifestyle';
  title: string;
  content: string;
  targetAudience: string[];
}

interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  departments: string[];
  workingHours: Record<string, string>;
  availableServices: string[];
}

// In-memory storage
const patientIntakes: Map<string, PatientIntake> = new Map();
const appointments: Map<string, Appointment> = new Map();
const medicationReminders: Map<string, MedicationReminder> = new Map();

// Health tips database
const healthTips: HealthTip[] = [
  {
    id: 'tip-1',
    category: 'nutrition',
    title: 'Stay Hydrated',
    content: 'Drink at least 8 glasses of water daily. Water helps regulate body temperature, transport nutrients, and flush out toxins.',
    targetAudience: ['all', 'adults', 'seniors']
  },
  {
    id: 'tip-2',
    category: 'exercise',
    title: 'Daily Walking',
    content: 'Aim for 30 minutes of moderate walking daily. This can reduce the risk of heart disease, diabetes, and improve mental health.',
    targetAudience: ['all', 'adults', 'seniors']
  },
  {
    id: 'tip-3',
    category: 'mental_health',
    title: 'Practice Mindfulness',
    content: 'Take 10 minutes daily for meditation or deep breathing exercises to reduce stress and improve focus.',
    targetAudience: ['all', 'adults', 'professionals']
  },
  {
    id: 'tip-4',
    category: 'preventive',
    title: 'Regular Check-ups',
    content: 'Schedule annual health check-ups to detect potential issues early. Early detection leads to better treatment outcomes.',
    targetAudience: ['all', 'adults', 'seniors']
  },
  {
    id: 'tip-5',
    category: 'lifestyle',
    title: 'Sleep Well',
    content: 'Adults should aim for 7-9 hours of quality sleep each night. Maintain a consistent sleep schedule for better health.',
    targetAudience: ['all', 'adults', 'professionals']
  }
];

// Hospital info database
const hospitalInfo: HospitalInfo = {
  id: 'carecode-main',
  name: 'CARECODE Medical Center',
  address: '123 Healthcare Avenue, Medical District',
  phone: '+1-800-CARECODE',
  emergencyPhone: '+1-800-911-CARE',
  departments: [
    'Emergency Care',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Oncology',
    'Dermatology',
    'Psychiatry',
    'General Medicine',
    'Surgery'
  ],
  workingHours: {
    monday: '8:00 AM - 8:00 PM',
    tuesday: '8:00 AM - 8:00 PM',
    wednesday: '8:00 AM - 8:00 PM',
    thursday: '8:00 AM - 8:00 PM',
    friday: '8:00 AM - 8:00 PM',
    saturday: '9:00 AM - 5:00 PM',
    sunday: 'Emergency Only'
  },
  availableServices: [
    '24/7 Emergency Room',
    'Ambulance Service',
    'Pharmacy',
    'Laboratory',
    'Radiology',
    'ICU',
    'Blood Bank',
    'Rehabilitation Center'
  ]
};

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CARECODE WhatsApp AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// PATIENT INTAKE ENDPOINTS
// ============================================

// Submit patient intake form
app.post('/api/intake', (req: Request, res: Response) => {
  const { name, phone, dateOfBirth, symptoms, medicalHistory, emergencyContact, preferredLanguage } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const intake: PatientIntake = {
    id: uuidv4(),
    name,
    phone,
    dateOfBirth: dateOfBirth || '',
    symptoms: symptoms || [],
    medicalHistory: medicalHistory || [],
    emergencyContact: emergencyContact || '',
    preferredLanguage: preferredLanguage || 'en',
    createdAt: new Date().toISOString()
  };

  patientIntakes.set(intake.id, intake);

  res.status(201).json({
    message: 'Patient intake form submitted successfully',
    patientId: intake.id,
    intake
  });
});

// Get patient intake by ID
app.get('/api/intake/:id', (req: Request, res: Response) => {
  const intake = patientIntakes.get(req.params.id);

  if (!intake) {
    return res.status(404).json({ error: 'Patient intake not found' });
  }

  res.json(intake);
});

// Get all patient intakes
app.get('/api/intakes', (_req: Request, res: Response) => {
  const intakes = Array.from(patientIntakes.values());
  res.json({
    count: intakes.length,
    intakes
  });
});

// ============================================
// APPOINTMENT ENDPOINTS
// ============================================

// Book an appointment
app.post('/api/appointments', (req: Request, res: Response) => {
  const { patientId, patientName, doctorId, doctorName, department, date, time, type, notes } = req.body;

  if (!patientName || !department || !date || !time) {
    return res.status(400).json({ error: 'Patient name, department, date, and time are required' });
  }

  const appointment: Appointment = {
    id: uuidv4(),
    patientId: patientId || uuidv4(),
    patientName,
    doctorId: doctorId || 'unassigned',
    doctorName: doctorName || 'TBD',
    department,
    date,
    time,
    type: type || 'consultation',
    status: 'scheduled',
    notes
  };

  appointments.set(appointment.id, appointment);

  res.status(201).json({
    message: 'Appointment booked successfully',
    appointmentId: appointment.id,
    appointment
  });
});

// Get appointment by ID
app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const appointment = appointments.get(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  res.json(appointment);
});

// Get all appointments
app.get('/api/appointments', (req: Request, res: Response) => {
  const { patientId, doctorId, department, status, date } = req.query;

  let filteredAppointments = Array.from(appointments.values());

  if (patientId) {
    filteredAppointments = filteredAppointments.filter(a => a.patientId === patientId);
  }
  if (doctorId) {
    filteredAppointments = filteredAppointments.filter(a => a.doctorId === doctorId);
  }
  if (department) {
    filteredAppointments = filteredAppointments.filter(a => a.department === department);
  }
  if (status) {
    filteredAppointments = filteredAppointments.filter(a => a.status === status);
  }
  if (date) {
    filteredAppointments = filteredAppointments.filter(a => a.date === date);
  }

  res.json({
    count: filteredAppointments.length,
    appointments: filteredAppointments
  });
});

// Update appointment status
app.patch('/api/appointments/:id/status', (req: Request, res: Response) => {
  const appointment = appointments.get(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const { status } = req.body;
  const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  appointment.status = status;
  appointments.set(appointment.id, appointment);

  res.json({
    message: 'Appointment status updated',
    appointment
  });
});

// Cancel appointment
app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const appointment = appointments.get(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  appointment.status = 'cancelled';
  appointments.set(appointment.id, appointment);

  res.json({
    message: 'Appointment cancelled',
    appointment
  });
});

// ============================================
// MEDICATION REMINDER ENDPOINTS
// ============================================

// Create medication reminder
app.post('/api/reminders', (req: Request, res: Response) => {
  const { patientId, medicationName, dosage, frequency, time, startDate, endDate, notes } = req.body;

  if (!patientId || !medicationName || !dosage || !frequency || !time) {
    return res.status(400).json({ error: 'Patient ID, medication name, dosage, frequency, and time are required' });
  }

  const reminder: MedicationReminder = {
    id: uuidv4(),
    patientId,
    medicationName,
    dosage,
    frequency,
    time,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate,
    notes
  };

  medicationReminders.set(reminder.id, reminder);

  res.status(201).json({
    message: 'Medication reminder created',
    reminderId: reminder.id,
    reminder
  });
});

// Get reminders for a patient
app.get('/api/reminders', (req: Request, res: Response) => {
  const { patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  const patientReminders = Array.from(medicationReminders.values())
    .filter(r => r.patientId === patientId);

  res.json({
    count: patientReminders.length,
    reminders: patientReminders
  });
});

// Delete medication reminder
app.delete('/api/reminders/:id', (req: Request, res: Response) => {
  const reminder = medicationReminders.get(req.params.id);

  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  medicationReminders.delete(req.params.id);

  res.json({
    message: 'Medication reminder deleted',
    reminderId: req.params.id
  });
});

// ============================================
// HEALTH TIPS ENDPOINTS
// ============================================

// Get all health tips
app.get('/api/health-tips', (req: Request, res: Response) => {
  const { category, audience } = req.query;

  let tips = [...healthTips];

  if (category) {
    tips = tips.filter(t => t.category === category);
  }
  if (audience) {
    tips = tips.filter(t => t.targetAudience.includes(audience as string));
  }

  res.json({
    count: tips.length,
    tips
  });
});

// Get random health tip
app.get('/api/health-tips/random', (_req: Request, res: Response) => {
  const randomIndex = Math.floor(Math.random() * healthTips.length);
  res.json(healthTips[randomIndex]);
});

// ============================================
// HOSPITAL INFO ENDPOINTS
// ============================================

// Get hospital information
app.get('/api/hospital', (_req: Request, res: Response) => {
  res.json(hospitalInfo);
});

// Get hospital departments
app.get('/api/hospital/departments', (_req: Request, res: Response) => {
  res.json({
    count: hospitalInfo.departments.length,
    departments: hospitalInfo.departments
  });
});

// Get hospital services
app.get('/api/hospital/services', (_req: Request, res: Response) => {
  res.json({
    count: hospitalInfo.availableServices.length,
    services: hospitalInfo.availableServices
  });
});

// Get working hours
app.get('/api/hospital/hours', (_req: Request, res: Response) => {
  res.json(hospitalInfo.workingHours);
});

// ============================================
// WHATSAPP WEBHOOK ENDPOINT
// ============================================

// WhatsApp webhook for incoming messages
app.post('/api/webhook/whatsapp', (req: Request, res: Response) => {
  const { from, message, type } = req.body;

  console.log(`[WhatsApp] Received ${type} from ${from}: ${message}`);

  // Process incoming WhatsApp message and return appropriate response
  const response = processWhatsAppMessage(from, message || '', type);

  res.json({ success: true, response });
});

// Process WhatsApp messages with automated responses
function processWhatsAppMessage(phone: string, message: string, type: string): string {
  const lowerMessage = message.toLowerCase().trim();

  // Greeting responses
  if (['hi', 'hello', 'hey', 'namaste'].includes(lowerMessage)) {
    return `Welcome to CARECODE Medical Center! How can we assist you today?

1. Book Appointment
2. View Health Tips
3. Medication Reminders
4. Hospital Information
5. Patient Intake Form

Reply with a number or your query.`;
  }

  // Appointment booking
  if (lowerMessage.includes('book') && lowerMessage.includes('appointment')) {
    return `To book an appointment, please provide:
- Patient Name
- Department (e.g., Cardiology, Pediatrics)
- Preferred Date
- Preferred Time

Or visit: POST /api/appointments with your details.`;
  }

  // Health tips
  if (lowerMessage.includes('health tip') || lowerMessage === '2') {
    const tips = healthTips.slice(0, 3);
    return `Here are some health tips:\n\n${tips.map((t, i) => `${i + 1}. ${t.title}\n${t.content}`).join('\n\n')}`;
  }

  // Hospital info
  if (lowerMessage.includes('hospital') || lowerMessage === '4') {
    return `CARECODE Medical Center
📍 ${hospitalInfo.address}
📞 ${hospitalInfo.phone}
🚨 Emergency: ${hospitalInfo.emergencyPhone}

Departments: ${hospitalInfo.departments.length}
Services: ${hospitalInfo.availableServices.length}`;
  }

  // Emergency
  if (lowerMessage.includes('emergency')) {
    return `🚨 EMERGENCY HOTLINE: ${hospitalInfo.emergencyPhone}

If this is a life-threatening emergency, please call immediately or visit your nearest ER.`;
  }

  // Medication reminder
  if (lowerMessage.includes('medication') || lowerMessage === '3') {
    return `To set up medication reminders:
- Medication Name
- Dosage
- Frequency (daily, twice_daily, weekly)
- Time

Visit: POST /api/reminders with your details.`;
  }

  // Default response
  return `Thank you for contacting CARECODE. For assistance:
- Type "book appointment" to schedule
- Type "health tips" for wellness advice
- Type "hospital info" for our services
- Type "emergency" for urgent care

Or visit our website for more options.`;
}

// Start server
app.listen(PORT, () => {
  console.log(`CARECODE WhatsApp AI Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Hospital info: http://localhost:${PORT}/api/hospital`);
  console.log(`WhatsApp webhook: http://localhost:${PORT}/api/webhook/whatsapp`);
});
