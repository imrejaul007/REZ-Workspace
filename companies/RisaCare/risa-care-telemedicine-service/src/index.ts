/**
 * RisaCare Telemedicine Service
 * Full Video Consultation Platform
 *
 * Features:
 * - Video/Audio consultations
 * - Screen sharing
 * - Appointment scheduling
 * - E-prescription
 * - Medical notes
 * - Payment integration
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient({
  hojaiLlmUrl: process.env.LLM_SERVICE_URL || 'http://localhost:4730'
});

const PORT = parseInt(process.env.PORT || '4773', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_telemedicine';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================
// SCHEMAS
// ============================================

const ConsultationSchema = new mongoose.Schema({
  consultationId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  doctorId: String,
  patientName: String,
  doctorName: String,
  type: { type: String, enum: ['video', 'audio', 'chat'], default: 'video' },
  status: { type: String, enum: ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  reason: String,
  notes: String,
  prescription: {
    diagnosis: String,
    medicines: [{
      name: String, dosage: String, frequency: String, duration: String, instructions: String
    }],
    advice: String,
    followUp: String
  },
  vitals: mongoose.Schema.Types.Mixed,
  amount: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  recordingUrl: String,
  summary: String
}, { timestamps: true });

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctorId: String,
  dayOfWeek: Number,
  slots: [{
    start: String,
    end: String,
    isBooked: Boolean
  }]
});

const WaitingRoomSchema = new mongoose.Schema({
  consultationId: String,
  patientId: String,
  patientName: String,
  doctorId: String,
  joinedAt: Date,
  status: String,
  position: Number
});

const MessageSchema = new mongoose.Schema({
  messageId: String,
  consultationId: String,
  senderId: String,
  senderName: String,
  senderRole: String,
  type: { type: String, enum: ['text', 'image', 'file', 'prescription'] },
  content: String,
  readAt: Date
});

const Consultation = mongoose.model('Consultation', ConsultationSchema);
const DoctorAvailability = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
const WaitingRoom = mongoose.model('WaitingRoom', WaitingRoomSchema);
const Message = mongoose.model('Message', MessageSchema);

// ============================================
// ROUTES
// ============================================

app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'telemedicine',
    version: '1.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== CONSULTATIONS =====

app.post('/api/consultations', async (req, res) => {
  const { patientId, doctorId, patientName, doctorName, type, scheduledAt, reason } = req.body;

  const consultation = await Consultation.create({
    consultationId: `tele_${uuidv4()}`,
    patientId, doctorId, patientName, doctorName,
    type: type || 'video',
    scheduledAt: new Date(scheduledAt),
    reason,
    status: 'scheduled'
  });

  // Notify doctor
  ecosystem.rabtul.sendPushNotification(
    doctorId,
    'New Consultation',
    `${patientName} has scheduled a ${type} consultation`
  ).catch(() => {});

  res.status(201).json({ success: true, consultation });
});

app.get('/api/consultations/:id', async (req, res) => {
  const consultation = await Consultation.findOne({ consultationId: req.params.id });
  if (!consultation) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, consultation });
});

app.get('/api/consultations/doctor/:doctorId', async (req: res) => {
  const { status, date } = req.query;
  const query: any = { doctorId: req.params.doctorId };

  if (status) query.status = status;
  if (date) {
    const startOfDay = new Date(date as string);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    query.scheduledAt = { $gte: startOfDay, $lt: endOfDay };
  }

  const consultations = await Consultation.find(query).sort({ scheduledAt: 1 });
  res.json({ success: true, consultations });
});

app.get('/api/consultations/patient/:patientId', async (req: res) => {
  const consultations = await Consultation.find({ patientId: req.params.patientId })
    .sort({ scheduledAt: -1 });
  res.json({ success: true, consultations });
});

app.patch('/api/consultations/:id/status', async (req: res) => {
  const { status, notes, prescription, duration } = req.body;
  const update: any = { status };

  if (status === 'waiting') update.startedAt = new Date();
  if (status === 'in_progress') update.startedAt = new Date();
  if (status === 'completed') {
    update.endedAt = new Date();
    update.duration = duration;
  }
  if (notes) update.notes = notes;
  if (prescription) update.prescription = prescription;

  const consultation = await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    update,
    { new: true }
  );

  if (!consultation) return res.status(404).json({ error: 'Not found' });

  // Notify patient
  if (status === 'in_progress') {
    ecosystem.rabtul.sendPushNotification(
      consultation.patientId,
      'Consultation Started',
      'Your doctor has joined the consultation'
    ).catch(() => {});
  }

  if (status === 'completed') {
    ecosystem.rabtul.sendPushNotification(
      consultation.patientId,
      'Consultation Complete',
      'Your consultation has ended. View your prescription.'
    ).catch(() => {});
  }

  res.json({ success: true, consultation });
});

// ===== WAITING ROOM =====

app.post('/api/waiting-room/join', async (req: res) => {
  const { consultationId, patientId, patientName, doctorId } = req.body;

  const waitingPatient = await WaitingRoom.create({
    consultationId,
    patientId,
    patientName,
    doctorId,
    joinedAt: new Date(),
    status: 'waiting',
    position: 1
  });

  // Notify doctor
  ecosystem.rabtul.sendPushNotification(
    doctorId,
    'Patient Waiting',
    `${patientName} is waiting in your consultation room`
  ).catch(() => {});

  // Emit to doctor
  io.to(`doctor_${doctorId}`).emit('patient_waiting', {
    consultationId,
    patientName,
    position: 1
  });

  res.status(201).json({ success: true, waitingPatient });
});

app.get('/api/waiting-room/doctor/:doctorId', async (req: res) => {
  const waiting = await WaitingRoom.find({ doctorId: req.params.doctorId, status: 'waiting' })
    .sort({ joinedAt: 1 });
  res.json({ success: true, waiting });
});

app.post('/api/waiting-room/:id/start', async (req: res) => {
  const waiting = await WaitingRoom.findOneAndUpdate(
    { consultationId: req.params.id },
    { status: 'in_progress' },
    { new: true }
  );

  await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    { status: 'in_progress', startedAt: new Date() }
  );

  // Notify patient
  if (waiting) {
    io.to(`patient_${waiting.patientId}`).emit('consultation_started', {
      consultationId: req.params.id
    });
  }

  res.json({ success: true, waiting });
});

// ===== PRESCRIPTION =====

app.post('/api/consultations/:id/prescription', async (req: res) => {
  const consultation = await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    { prescription: req.body },
    { new: true }
  );

  if (!consultation) return res.status(404).json({ error: 'Not found' });

  // Notify patient with prescription
  ecosystem.rabtul.sendPushNotification(
    consultation.patientId,
    'Prescription Ready',
    'Your prescription is ready. View it in the app.'
  ).catch(() => {});

  res.json({ success: true, prescription: consultation.prescription });
});

// ===== AI ASSIST =====

app.post('/api/consultations/:id/ai-summary', async (req: res) => {
  const { notes } = req.body;

  // Generate AI summary
  const result = await ecosystem.hojai.chat([
    { role: 'system', content: 'You are a medical AI assistant. Summarize the consultation notes concisely.' },
    { role: 'user', content: notes || 'Consultation notes' }
  ], { temperature: 0.3 });

  const summary = result.success && result.content ? result.content : 'Summary not available';

  await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    { summary }
  );

  res.json({ success: true, summary });
});

app.post('/api/consultations/:id/ai-soap', async (req: res) => {
  const consultation = await Consultation.findOne({ consultationId: req.params.id });
  if (!consultation) return res.status(404).json({ error: 'Not found' });

  // Generate SOAP note
  const result = await ecosystem.hojai.generateSOAPNote(
    consultation.notes || 'Consultation completed',
    { patientId: consultation.patientId }
  );

  if (result.success && result.soapNote) {
    await Consultation.findOneAndUpdate(
      { consultationId: req.params.id },
      { notes: JSON.stringify(result.soapNote) }
    );
  }

  res.json({ success: true, soapNote: result.soapNote || {} });
});

// ===== MESSAGES =====

app.get('/api/consultations/:id/messages', async (req: res) => {
  const messages = await Message.find({ consultationId: req.params.id })
    .sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

// ===== AVAILABILITY =====

app.get('/api/doctors/:id/availability', async (req: res) => {
  const { date } = req.query;
  const dayOfWeek = date ? new Date(date as string).getDay() : new Date().getDay();

  const availability = await DoctorAvailability.findOne({
    doctorId: req.params.id,
    dayOfWeek
  });

  if (!availability) {
    // Default availability
    const slots = [];
    for (let h = 9; h < 18; h++) {
      slots.push({
        start: `${h.toString().padStart(2, '0')}:00`,
        end: `${h.toString().padStart(2, '0')}:30`,
        isBooked: false
      });
      slots.push({
        start: `${h.toString().padStart(2, '0')}:30`,
        end: `${(h+1).toString().padStart(2, '0')}:00`,
        isBooked: false
      });
    }
    return res.json({ success: true, slots, available: true });
  }

  // Check booked slots
  const booked = await Consultation.find({
    doctorId: req.params.id,
    status: { $ne: 'cancelled' },
    scheduledAt: {
      $gte: new Date(date as string),
      $lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
    }
  });

  const bookedTimes = booked.map(c =>
    `${new Date(c.scheduledAt).getHours().toString().padStart(2, '0')}:${new Date(c.scheduledAt).getMinutes().toString().padStart(2, '0')}`
  );

  const slots = availability.slots.map(s => ({
    ...s,
    isBooked: bookedTimes.includes(s.start)
  }));

  res.json({ success: true, slots, available: slots.some(s => !s.isBooked) });
});

// ===== PAYMENTS =====

app.post('/api/consultations/:id/payment', async (req: res) => {
  const { amount, paymentMethod } = req.body;

  // Process payment via ecosystem
  const consultation = await Consultation.findOne({ consultationId: req.params.id });
  if (!consultation) return res.status(404).json({ error: 'Not found' });

  const result = await ecosystem.rabtul.createPaymentIntent
    ? await ecosystem.rabtul.createPaymentIntent(amount, 'INR', { consultationId: req.params.id })
    : { success: false };

  if (result && 'success' in result && result.success) {
    await Consultation.findOneAndUpdate(
      { consultationId: req.params.id },
      { paymentStatus: 'paid', amount }
    );

    res.json({ success: true, paymentId: result.id, status: 'paid' });
  } else {
    res.status(400).json({ error: 'Payment failed' });
  }
});

// ============================================
// SOCKET.IO
// ============================================

io.on('connection', (socket) => {
  logger.info('Telemedicine client connected', { socketId: socket.id });

  socket.on('join_consultation', (data: { consultationId: string; userId: string; role: string }) => {
    socket.join(`consultation_${data.consultationId}`);
    socket.join(`${data.role}_${data.userId}`);

    socket.to(`consultation_${data.consultationId}`).emit('participant_joined', {
      userId: data.userId,
      role: data.role
    });

    logger.info('Participant joined consultation', data);
  });

  socket.on('leave_consultation', (data: { consultationId: string; userId: string }) => {
    socket.leave(`consultation_${data.consultationId}`);
    socket.to(`consultation_${data.consultationId}`).emit('participant_left', data);
  });

  // WebRTC signaling
  socket.on('offer', (data: { consultationId: string; offer: any; from: string }) => {
    socket.to(`consultation_${data.consultationId}`).emit('offer', {
      offer: data.offer,
      from: data.from
    });
  });

  socket.on('answer', (data: { consultationId: string; answer: any; from: string }) => {
    socket.to(`consultation_${data.consultationId}`).emit('answer', {
      answer: data.answer,
      from: data.from
    });
  });

  socket.on('ice-candidate', (data: { consultationId: string; candidate: any; from: string }) => {
    socket.to(`consultation_${data.consultationId}`).emit('ice-candidate', {
      candidate: data.candidate,
      from: data.from
    });
  });

  // Media controls
  socket.on('toggle_video', (data: { consultationId: string; enabled: boolean }) => {
    socket.to(`consultation_${data.consultationId}`).emit('video_toggled', {
      enabled: data.enabled,
      userId: socket.id
    });
  });

  socket.on('toggle_audio', (data: { consultationId: string; enabled: boolean }) => {
    socket.to(`consultation_${data.consultationId}`).emit('audio_toggled', {
      enabled: data.enabled,
      userId: socket.id
    });
  });

  // Screen share
  socket.on('screen_share_start', (data: { consultationId: string }) => {
    socket.to(`consultation_${data.consultationId}`).emit('screen_share_started');
  });

  socket.on('screen_share_stop', (data: { consultationId: string }) => {
    socket.to(`consultation_${data.consultationId}`).emit('screen_share_stopped');
  });

  // Chat
  socket.on('chat_message', async (data: any) => {
    const message = await Message.create({
      messageId: `msg_${uuidv4()}`,
      consultationId: data.consultationId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      type: 'text',
      content: data.content
    });

    io.to(`consultation_${data.consultationId}`).emit('new_message', message);
  });

  // End call
  socket.on('end_call', async (data: { consultationId: string; userId: string }) => {
    io.to(`consultation_${data.consultationId}`).emit('call_ended', {
      endedBy: data.userId
    });

    await Consultation.findOneAndUpdate(
      { consultationId: data.consultationId },
      { status: 'completed', endedAt: new Date() }
    );
  });

  socket.on('disconnect', () => {
    logger.info('Telemedicine client disconnected', { socketId: socket.id });
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Telemedicine connected to MongoDB');
    httpServer.listen(PORT, () => {
      logger.info(`RisaCare Telemedicine started on port ${PORT}`);
      logger.info('Features: Video/Audio, WebRTC, E-Prescription, AI Summary');
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

start();
export default app;
