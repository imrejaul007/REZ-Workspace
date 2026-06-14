import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { practiceService } from '../services/practiceService.js';
import { appointmentService } from '../services/appointmentService.js';
import { patientService } from '../services/patientService.js';
import { prescriptionService } from '../services/prescriptionService.js';
import { billingService } from '../services/billingService.js';
import { scheduleService } from '../services/scheduleService.js';
import type {
  CreatePracticeInput,
  CreateDoctorInput,
  CreatePatientInput,
  BookAppointmentInput,
  CreatePrescriptionInput,
  CreateBillingInput,
  SetAvailabilityInput,
  Medicine,
  BillingItem,
} from '../types/schemas.js';

const router = Router();

// Validation schemas for request bodies
const CreatePracticeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['solo', 'group', 'clinic']),
  specialty: z.string().min(1),
  address: z.object({
    street: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('India'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  staff: z.array(z.object({
    name: z.string(),
    role: z.string(),
    phone: z.string().optional(),
  })).optional(),
  operatingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    open: z.string(),
    close: z.string(),
    isOpen: z.boolean().default(true),
  })).optional(),
  services: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    duration: z.number(),
    fee: z.number(),
  })).optional(),
});

const CreateDoctorSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  qualifications: z.array(z.string()),
  registrationNumber: z.string().min(1),
  experience: z.number().min(0),
  consultationFee: z.number().min(0),
  languages: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  availability: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    slotDuration: z.number().default(30),
  })).optional(),
});

const CreatePatientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relation: z.string().optional(),
  }).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('India'),
  }).optional(),
});

const BookAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().optional(),
  type: z.enum(['new', 'follow_up', 'procedure']),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
});

const CreatePrescriptionSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  medicines: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })),
  diagnosis: z.string().min(1),
  instructions: z.string().optional(),
  validUntil: z.string().datetime(),
});

const CreateBillingSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1).default(1),
    unitPrice: z.number().min(0),
  })),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'insurance', 'wallet']).optional(),
});

const ProcessPaymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'upi', 'insurance', 'wallet']),
  amount: z.number().optional(),
});

const SetAvailabilitySchema = z.object({
  doctorId: z.string().min(1),
  slots: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    slotDuration: z.number().default(30),
  })),
});

const RescheduleSchema = z.object({
  newScheduledAt: z.string().datetime(),
  newDuration: z.number().optional(),
});

const CancelSchema = z.object({
  reason: z.string().optional(),
});

const MedicalHistorySchema = z.object({
  diagnosis: z.string().min(1),
  treatment: z.string().optional(),
  doctorId: z.string().min(1),
  notes: z.string().optional(),
});

// Error handler wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================
// PRACTICE ROUTES
// ============================================

// GET /practice - Get practice info
router.get('/practice', asyncHandler(async (req, res) => {
  const practices = await practiceService.getAllPractices();
  res.json({ success: true, data: practices });
}));

// POST /practice - Create practice
router.post('/practice', asyncHandler(async (req, res) => {
  const validated = CreatePracticeSchema.parse(req.body);
  const practice = await practiceService.setupPractice(validated);
  res.status(201).json({ success: true, data: practice });
}));

// PUT /practice - Update practice
router.put('/practice/:practiceId', asyncHandler(async (req, res) => {
  const { practiceId } = req.params;
  const practice = await practiceService.updatePractice(practiceId, req.body);
  if (!practice) {
    return res.status(404).json({ success: false, error: 'Practice not found' });
  }
  res.json({ success: true, data: practice });
}));

// GET /practice/:practiceId - Get practice by ID
router.get('/practice/:practiceId', asyncHandler(async (req, res) => {
  const { practiceId } = req.params;
  const practice = await practiceService.getPractice(practiceId);
  if (!practice) {
    return res.status(404).json({ success: false, error: 'Practice not found' });
  }
  res.json({ success: true, data: practice });
}));

// GET /practice/:practiceId/stats - Get practice statistics
router.get('/practice/:practiceId/stats', asyncHandler(async (req, res) => {
  const { practiceId } = req.params;
  const stats = await practiceService.getPracticeStats(practiceId);
  if (!stats) {
    return res.status(404).json({ success: false, error: 'Practice not found' });
  }
  res.json({ success: true, data: stats });
}));

// ============================================
// DOCTOR ROUTES
// ============================================

// GET /doctors - List all doctors
router.get('/doctors', asyncHandler(async (req, res) => {
  const practiceId = req.query.practiceId as string | undefined;
  let doctors;
  if (practiceId) {
    doctors = await practiceService.getDoctors(practiceId);
  } else {
    doctors = await practiceService.getAllDoctors();
  }
  res.json({ success: true, data: doctors });
}));

// POST /doctors - Add doctor to practice
router.post('/doctors', asyncHandler(async (req, res) => {
  const validated = CreateDoctorSchema.parse(req.body);

  // If practiceId is provided, add doctor to practice
  if (req.body.practiceId) {
    const doctor = await practiceService.addDoctor(req.body.practiceId, validated);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Practice not found' });
    }
    return res.status(201).json({ success: true, data: doctor });
  }

  // Otherwise, create doctor standalone
  const { v4: uuidv4 } = await import('uuid');
  const now = new Date().toISOString();
  const doctor = {
    doctorId: uuidv4(),
    ...validated,
    languages: validated.languages || ['English'],
    availability: validated.availability || [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const { createDoctor } = await import('../models/store.js');
  createDoctor(doctor);

  res.status(201).json({ success: true, data: doctor });
}));

// GET /doctors/:doctorId - Get doctor
router.get('/doctors/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const doctor = await practiceService.getDoctor(doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }
  res.json({ success: true, data: doctor });
}));

// PUT /doctors/:doctorId - Update doctor
router.put('/doctors/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const doctor = await practiceService.updateDoctor(doctorId, req.body);
  if (!doctor) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }
  res.json({ success: true, data: doctor });
}));

// ============================================
// APPOINTMENT ROUTES
// ============================================

// POST /appointments - Book appointment
router.post('/appointments', asyncHandler(async (req, res) => {
  const validated = BookAppointmentSchema.parse(req.body);
  const appointment = await appointmentService.bookAppointment(validated);
  res.status(201).json({ success: true, data: appointment });
}));

// GET /appointments/:doctorId - Doctor appointments
router.get('/appointments/doctor/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date, startDate, endDate } = req.query;

  let appointments;
  if (startDate && endDate) {
    appointments = await appointmentService.getAppointmentsByDateRange(
      doctorId,
      startDate as string,
      endDate as string
    );
  } else if (date) {
    const dayStart = new Date(date as string);
    const dayEnd = new Date(date as string);
    dayEnd.setDate(dayEnd.getDate() + 1);
    appointments = await appointmentService.getAppointmentsByDateRange(
      doctorId,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );
  } else {
    appointments = await appointmentService.getAppointmentsByDoctorId(doctorId);
  }

  res.json({ success: true, data: appointments });
}));

// GET /appointments/patient/:patientId - Patient appointments
router.get('/appointments/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const appointments = await appointmentService.getAppointmentsByPatientId(patientId);
  res.json({ success: true, data: appointments });
}));

// GET /appointments/:appointmentId - Get appointment
router.get('/appointments/:appointmentId', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await appointmentService.getAppointment(appointmentId);
  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  res.json({ success: true, data: appointment });
}));

// PUT /appointments/:appointmentId/cancel - Cancel appointment
router.put('/appointments/:appointmentId/cancel', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const validated = CancelSchema.parse(req.body);
  const appointment = await appointmentService.cancelAppointment(appointmentId, validated.reason);
  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  res.json({ success: true, data: appointment });
}));

// PUT /appointments/:appointmentId/reschedule - Reschedule appointment
router.put('/appointments/:appointmentId/reschedule', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const validated = RescheduleSchema.parse(req.body);
  const appointment = await appointmentService.rescheduleAppointment(
    appointmentId,
    validated.newScheduledAt,
    validated.newDuration
  );
  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  res.json({ success: true, data: appointment });
}));

// PUT /appointments/:appointmentId/status - Update appointment status
router.put('/appointments/:appointmentId/status', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  const appointment = await appointmentService.updateAppointmentStatus(appointmentId, status);
  if (!appointment) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }
  res.json({ success: true, data: appointment });
}));

// GET /appointments/slots/:doctorId - Get available slots
router.get('/appointments/slots/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required' });
  }

  const slots = await appointmentService.getAvailableSlots(doctorId, date as string);
  res.json({ success: true, data: slots });
}));

// ============================================
// PATIENT ROUTES
// ============================================

// GET /patients - List patients
router.get('/patients', asyncHandler(async (req, res) => {
  const { search, minAge, maxAge } = req.query;

  let patients;
  if (search) {
    patients = await patientService.searchPatients(search as string);
  } else if (minAge && maxAge) {
    patients = await patientService.getPatientsByAgeRange(
      parseInt(minAge as string),
      parseInt(maxAge as string)
    );
  } else {
    patients = await patientService.getAllPatients();
  }

  res.json({ success: true, data: patients });
}));

// POST /patients - Register patient
router.post('/patients', asyncHandler(async (req, res) => {
  const validated = CreatePatientSchema.parse(req.body);
  const patient = await patientService.registerPatient(validated);
  res.status(201).json({ success: true, data: patient });
}));

// GET /patients/:patientId - Get patient
router.get('/patients/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const patient = await patientService.getPatient(patientId);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: patient });
}));

// PUT /patients/:patientId - Update patient
router.put('/patients/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const patient = await patientService.updatePatient(patientId, req.body);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: patient });
}));

// GET /patients/:patientId/records - Get patient records
router.get('/patients/:patientId/records', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const records = await patientService.getPatientRecords(patientId);
  if (!records) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: records });
}));

// POST /patients/:patientId/medical-history - Add to medical history
router.post('/patients/:patientId/medical-history', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const validated = MedicalHistorySchema.parse(req.body);
  const patient = await patientService.addToMedicalHistory(patientId, validated);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.status(201).json({ success: true, data: patient });
}));

// GET /patients/:patientId/history - Get patient appointment history
router.get('/patients/:patientId/history', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const history = await patientService.getPatientHistory(patientId);
  if (!history) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: history });
}));

// ============================================
// PRESCRIPTION ROUTES
// ============================================

// POST /prescriptions - Create prescription
router.post('/prescriptions', asyncHandler(async (req, res) => {
  const validated = CreatePrescriptionSchema.parse(req.body);
  const prescription = await prescriptionService.createPrescription(validated);
  res.status(201).json({ success: true, data: prescription });
}));

// GET /prescriptions/:patientId - Get prescriptions for patient
router.get('/prescriptions/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { active, expired } = req.query;

  let prescriptions;
  if (active === 'true') {
    prescriptions = await prescriptionService.getActivePrescriptions(patientId);
  } else if (expired === 'true') {
    prescriptions = await prescriptionService.getExpiredPrescriptions(patientId);
  } else {
    prescriptions = await prescriptionService.getPrescriptionsByPatientId(patientId);
  }

  res.json({ success: true, data: prescriptions });
}));

// GET /prescriptions/detail/:prescriptionId - Get prescription
router.get('/prescriptions/detail/:prescriptionId', asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const prescription = await prescriptionService.getPrescription(prescriptionId);
  if (!prescription) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  res.json({ success: true, data: prescription });
}));

// POST /prescriptions/:prescriptionId/renew - Renew prescription
router.post('/prescriptions/:prescriptionId/renew', asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const { validUntil } = req.body;

  if (!validUntil) {
    return res.status(400).json({ success: false, error: 'validUntil is required' });
  }

  const prescription = await prescriptionService.renewPrescription(prescriptionId, validUntil);
  if (!prescription) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  res.status(201).json({ success: true, data: prescription });
}));

// GET /prescriptions/:prescriptionId/print - Generate prescription text
router.get('/prescriptions/:prescriptionId/print', asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const text = await prescriptionService.generatePrescriptionText(prescriptionId);
  if (!text) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  res.json({ success: true, data: { text } });
}));

// ============================================
// BILLING ROUTES
// ============================================

// POST /bills - Create bill
router.post('/bills', asyncHandler(async (req, res) => {
  const validated = CreateBillingSchema.parse(req.body);

  // Calculate item totals
  const items: BillingItem[] = validated.items.map(item => ({
    itemId: uuidv4(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice,
  }));

  const billing = await billingService.createBill({
    ...validated,
    items,
    subtotal: items.reduce((sum, i) => sum + i.total, 0),
    tax: validated.tax || 0,
    discount: validated.discount || 0,
  });

  res.status(201).json({ success: true, data: billing });
}));

// GET /bills/patient/:patientId - Get bills for patient
router.get('/bills/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status } = req.query;

  let billings = await billingService.getBillingsByPatientId(patientId);

  if (status) {
    billings = billings.filter(b => b.status === status);
  }

  res.json({ success: true, data: billings });
}));

// GET /bills/:billingId - Get bill
router.get('/bills/:billingId', asyncHandler(async (req, res) => {
  const { billingId } = req.params;
  const billing = await billingService.getBilling(billingId);
  if (!billing) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.json({ success: true, data: billing });
}));

// PUT /bills/:billingId/pay - Process payment
router.put('/bills/:billingId/pay', asyncHandler(async (req, res) => {
  const { billingId } = req.params;
  const validated = ProcessPaymentSchema.parse(req.body);

  try {
    const billing = await billingService.processPayment(
      billingId,
      validated.paymentMethod,
      validated.amount
    );
    if (!billing) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}));

// GET /bills/:billingId/invoice - Generate invoice
router.get('/bills/:billingId/invoice', asyncHandler(async (req, res) => {
  const { billingId } = req.params;
  const invoice = await billingService.generateInvoice(billingId);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  res.json({ success: true, data: { invoice } });
}));

// GET /revenue - Get revenue statistics
router.get('/revenue', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const revenue = await billingService.getRevenue(
    startDate as string | undefined,
    endDate as string | undefined
  );
  res.json({ success: true, data: revenue });
}));

// ============================================
// SCHEDULE ROUTES
// ============================================

// GET /schedule/:doctorId - Get availability
router.get('/schedule/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const schedule = await scheduleService.getScheduleForDateRange(
      doctorId,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data: schedule });
  } else {
    const availability = await scheduleService.getAvailability(doctorId);
    res.json({ success: true, data: availability });
  }
}));

// POST /schedule - Set availability
router.post('/schedule', asyncHandler(async (req, res) => {
  const validated = SetAvailabilitySchema.parse(req.body);

  try {
    const availability = await scheduleService.setAvailability(validated);
    res.json({ success: true, data: availability });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}));

// POST /schedule/block - Block time
router.post('/schedule/block', asyncHandler(async (req, res) => {
  const { doctorId, date, startTime, endTime, reason } = req.body;

  try {
    const result = await scheduleService.blockTime(doctorId, date, startTime, endTime, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}));

// POST /schedule/default - Set default schedule
router.post('/schedule/default', asyncHandler(async (req, res) => {
  const { doctorId, weekdaysOnly } = req.body;

  try {
    const availability = await scheduleService.setDefaultSchedule(doctorId, weekdaysOnly);
    res.json({ success: true, data: availability });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}));

// GET /schedule/next/:doctorId - Get next available slot
router.get('/schedule/next/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { fromDate } = req.query;

  const nextSlot = await scheduleService.getNextAvailableSlot(
    doctorId,
    fromDate as string | undefined
  );

  res.json({ success: true, data: nextSlot });
}));

export default router;
