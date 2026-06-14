// RisaCare Booking Service v2.0 - With MongoDB

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, Doctor, AppointmentStatus } from '@risa-care/shared/types';
import { logger, now, generateId } from '@risa-care/shared/utils';
import { rabtulClient } from '../../integrations/rabtul';
import { rezIntelligenceClient } from '../../integrations/rez-intelligence';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// ============================================
// MONGOOSE SCHEMAS
// ============================================

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  profileId: String,
  providerType: { type: String, enum: ['doctor', 'lab', 'pharmacy', 'hospital'] },
  providerId: String,
  providerDetails: {
    name: String,
    specialization: String,
    photo: String,
    phone: String
  },
  type: { type: String, enum: ['consultation', 'follow_up', 'procedure', 'emergency', 'teleconsult'] },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'confirmed',
    index: true
  },
  mode: { type: String, enum: ['in_clinic', 'teleconsult', 'home_visit', 'emergency_visit'] },
  schedule: {
    date: { type: String, required: true },
    startTime: String,
    endTime: String,
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  payment: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    method: String,
    transactionId: String
  },
  notes: String,
  cancellationReason: String,
  cancelledAt: String,
  reminders: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() },
  createdBy: String
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  photo: String,
  gender: String,
  credentials: {
    specializations: [String],
    qualifications: [String],
    yearsOfExperience: Number,
    languages: [String],
    registrationNumber: String
  },
  practice: {
    hospitalAffiliations: [String],
    clinicName: String,
    consultationFees: {
      inClinic: Number,
      teleconsult: Number,
      homeVisit: Number
    },
    consultationModes: [String]
  },
  availability: {
    workingDays: [Number],
    hours: {
      start: String,
      end: String
    },
    nextAvailable: String
  },
  ratings: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() }
}, { timestamps: true });

const SlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true, index: true },
  doctorId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  mode: { type: String, enum: ['in_clinic', 'teleconsult', 'home_visit'] },
  isAvailable: { type: Boolean, default: true },
  appointmentId: String,
  bookedAt: String,
  bookedBy: String
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);
const DoctorModel = mongoose.model('Doctor', DoctorSchema);
const Slot = mongoose.model('Slot', SlotSchema);

// ============================================
// SEED DATA
// ============================================

async function seedDoctors() {
  const count = await DoctorModel.countDocuments();
  if (count > 0) return;

  const doctors = [
    {
      doctorId: 'doc_001',
      name: 'Dr. Priya Sharma',
      photo: 'https://example.com/photos/priya.jpg',
      gender: 'female',
      credentials: {
        specializations: ['General Physician', 'Internal Medicine'],
        qualifications: ['MBBS', 'MD - Internal Medicine'],
        yearsOfExperience: 12,
        languages: ['English', 'Hindi', 'Tamil'],
        registrationNumber: 'MCI-12345'
      },
      practice: {
        hospitalAffiliations: ['Apollo Hospital', 'Fortis'],
        clinicName: 'HealthFirst Clinic',
        consultationFees: { inClinic: 800, teleconsult: 600, homeVisit: 1200 },
        consultationModes: ['in_clinic', 'teleconsult']
      },
      availability: {
        workingDays: [1, 2, 3, 4, 5],
        hours: { start: '09:00', end: '18:00' },
        nextAvailable: new Date().toISOString()
      },
      ratings: { average: 4.7, totalReviews: 234 },
      isVerified: true,
      isActive: true
    },
    {
      doctorId: 'doc_002',
      name: 'Dr. Rajesh Kumar',
      photo: 'https://example.com/photos/rajesh.jpg',
      gender: 'male',
      credentials: {
        specializations: ['Cardiologist'],
        qualifications: ['MBBS', 'MD - Cardiology', 'DM - Cardiology'],
        yearsOfExperience: 15,
        languages: ['English', 'Hindi', 'Bengali'],
        registrationNumber: 'MCI-67890'
      },
      practice: {
        hospitalAffiliations: ['Max Hospital', 'Medanta'],
        consultationFees: { inClinic: 1500, teleconsult: 1200, homeVisit: 2000 },
        consultationModes: ['in_clinic', 'teleconsult', 'home_visit']
      },
      availability: {
        workingDays: [1, 2, 4, 5],
        hours: { start: '10:00', end: '17:00' },
        nextAvailable: new Date().toISOString()
      },
      ratings: { average: 4.9, totalReviews: 456 },
      isVerified: true,
      isActive: true
    },
    {
      doctorId: 'doc_003',
      name: 'Dr. Ananya Patel',
      gender: 'female',
      credentials: {
        specializations: ['Dermatologist'],
        qualifications: ['MBBS', 'DVD', 'DDVL'],
        yearsOfExperience: 8,
        languages: ['English', 'Hindi', 'Gujarati']
      },
      practice: {
        hospitalAffiliations: ['Narayana Health'],
        consultationFees: { inClinic: 700, teleconsult: 500, homeVisit: 1000 },
        consultationModes: ['in_clinic', 'teleconsult']
      },
      availability: {
        workingDays: [1, 2, 3, 4, 5, 6],
        hours: { start: '09:00', end: '19:00' },
        nextAvailable: new Date().toISOString()
      },
      ratings: { average: 4.6, totalReviews: 189 },
      isVerified: true,
      isActive: true
    }
  ];

  await DoctorModel.insertMany(doctors);
  logger.info('Seeded 3 doctors');
}

// ============================================
// APP SETUP
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '4705', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_booking';

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-booking-service',
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// ============================================
// DOCTOR ROUTES
// ============================================

app.get('/doctors', async (req: Request, res: Response) => {
  const { specialty, city, language, mode, minFee, maxFee, sortBy, page, limit } = req.query;

  const query: any = { isActive: true };

  if (specialty) {
    query['credentials.specializations'] = { $regex: specialty, $options: 'i' };
  }
  if (language) {
    query['credentials.languages'] = { $regex: language, $options: 'i' };
  }
  if (mode) {
    query['practice.consultationModes'] = mode;
  }
  if (minFee) {
    query['practice.consultationFees.inClinic'] = { $gte: Number(minFee) };
  }
  if (maxFee) {
    query['practice.consultationFees.inClinic'] = { ...query['practice.consultationFees.inClinic'] || {}, $lte: Number(maxFee) };
  }

  let sort: any = { 'ratings.totalReviews': -1 };
  if (sortBy === 'fee') sort = { 'practice.consultationFees.inClinic': 1 };
  if (sortBy === 'rating') sort = { 'ratings.average': -1 };

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [doctors, total] = await Promise.all([
    DoctorModel.find(query).sort(sort).skip(skip).limit(limitNum),
    DoctorModel.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: doctors,
    meta: {
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      requestId: req.requestId,
      timestamp: now()
    }
  });
});

app.get('/doctors/:id', async (req: Request, res: Response) => {
  const doctor = await DoctorModel.findOne({ doctorId: req.params.id });
  if (!doctor) {
    return res.status(404).json({ success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' } });
  }
  res.json({ success: true, data: doctor, meta: { requestId: req.requestId, timestamp: now() } });
});

app.get('/doctors/:id/slots', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, mode } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];
  const consultationMode = (mode as string) || 'in_clinic';

  // Get existing slots from DB
  let slots = await Slot.find({ doctorId: id, date: targetDate, mode: consultationMode });

  // If no slots exist, generate them
  if (slots.length === 0) {
    const slotTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const newSlots = slotTimes.map(time => ({
      slotId: `slot_${id}_${targetDate}_${time.replace(':', '')}`,
      doctorId: id,
      date: targetDate,
      time,
      mode: consultationMode,
      isAvailable: Math.random() > 0.3
    }));
    await Slot.insertMany(newSlots);
    slots = await Slot.find({ doctorId: id, date: targetDate, mode: consultationMode });
  }

  res.json({
    success: true,
    data: { doctorId: id, date: targetDate, mode: consultationMode, slots },
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

// ============================================
// APPOINTMENT ROUTES
// ============================================

app.post('/appointments', async (req: Request, res: Response) => {
  const { profileId, providerType, providerId, type, schedule, payment, notes } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const appointmentId = generateId('apt');
  const doctor = await DoctorModel.findOne({ doctorId: providerId });

  const appointment = await Appointment.create({
    appointmentId,
    userId,
    profileId,
    providerType,
    providerId,
    providerDetails: {
      name: doctor?.name || 'Unknown',
      specialization: doctor?.credentials.specializations?.[0],
      photo: doctor?.photo,
      phone: doctor?.practice.clinicName
    },
    type,
    status: 'confirmed',
    mode: schedule.mode,
    schedule: {
      date: schedule.date,
      startTime: schedule.startTime,
      timezone: 'Asia/Kolkata'
    },
    payment: {
      amount: payment?.amount || doctor?.practice.consultationFees?.inClinic || 500,
      currency: 'INR',
      status: payment?.method === 'wallet' ? 'paid' : 'pending',
      method: payment?.method
    },
    notes,
    reminders: {},
    createdAt: now(),
    updatedAt: now(),
    createdBy: userId
  });

  // Mark slot as booked
  if (schedule.date && schedule.startTime) {
    await Slot.updateOne(
      { doctorId: providerId, date: schedule.date, time: schedule.startTime },
      { isAvailable: false, appointmentId, bookedAt: now(), bookedBy: userId }
    );
  }

  logger.info(`Created appointment ${appointmentId} for user ${userId}`);

  // Send notification
  try {
    await rabtulClient.notification.send({
      userId,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${doctor?.name || 'the doctor'} is confirmed for ${schedule.date}`,
      channel: 'push',
      data: { appointmentId, type: 'appointment_confirmation' }
    });
    await rezIntelligenceClient.signals.track(userId, 'appointment_booked', { appointmentId, doctorId: providerId });
  } catch (error) {
    logger.warn('Failed to send notification', { appointmentId, error });
  }

  res.status(201).json({ success: true, data: appointment, meta: { requestId: req.requestId, timestamp: now() } });
});

app.get('/appointments', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'default_user';
  const { status, type, startDate, endDate, page, limit } = req.query;

  const query: any = { userId };
  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query['schedule.date'] = {};
    if (startDate) query['schedule.date'].$gte = startDate;
    if (endDate) query['schedule.date'].$lte = endDate;
  }

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [appointments, total] = await Promise.all([
    Appointment.find(query).sort({ 'schedule.date': -1 }).skip(skip).limit(limitNum),
    Appointment.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: appointments,
    meta: {
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      requestId: req.requestId,
      timestamp: now()
    }
  });
});

app.get('/appointments/:id', async (req: Request, res: Response) => {
  const appointment = await Appointment.findOne({ appointmentId: req.params.id });
  if (!appointment) {
    return res.status(404).json({ success: false, error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' } });
  }
  res.json({ success: true, data: appointment, meta: { requestId: req.requestId, timestamp: now() } });
});

app.put('/appointments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body, updatedAt: now() };
  delete updates.appointmentId;
  delete updates.userId;

  const appointment = await Appointment.findOneAndUpdate({ appointmentId: id }, updates, { new: true });
  if (!appointment) {
    return res.status(404).json({ success: false, error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' } });
  }
  res.json({ success: true, data: appointment, meta: { requestId: req.requestId, timestamp: now() } });
});

app.delete('/appointments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findOneAndUpdate(
    { appointmentId: id },
    { status: 'cancelled', cancellationReason: reason, cancelledAt: now(), updatedAt: now() },
    { new: true }
  );
  if (!appointment) {
    return res.status(404).json({ success: false, error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' } });
  }

  // Free up the slot
  await Slot.updateOne(
    { appointmentId: id },
    { isAvailable: true, appointmentId: null, bookedAt: null, bookedBy: null }
  );

  logger.info(`Cancelled appointment ${id}`);
  res.json({ success: true, data: { cancelled: true, appointmentId: id, reason }, meta: { requestId: req.requestId, timestamp: now() } });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ============================================
// START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Booking Service connected to MongoDB');
    await seedDoctors();
    app.listen(PORT, () => {
      logger.info(`RisaCare Booking Service v2.0 started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;