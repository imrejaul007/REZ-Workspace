/**
 * RisaCare Teleconsult V2
 * Video consultations with WebRTC/Socket.IO
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4756', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_teleconsult';
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(helmet());
app.use(express.json());

// Schemas
const ConsultationSchema = new mongoose.Schema({
  consultationId: String,
  patientId: String,
  doctorId: String,
  scheduledAt: Date,
  status: { type: String, enum: ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  type: { type: String, enum: ['video', 'audio', 'chat'], default: 'video' },
  chiefComplaint: String,
  notes: String,
  prescription: [{
    medicine: String, dosage: String, frequency: String, duration: String
  }],
  followUp: { required: Boolean, date: Date },
  recordingUrl: String,
  duration: Number,
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  consultationId: String,
  senderId: String,
  senderType: { type: String, enum: ['patient', 'doctor', 'system'] },
  type: { type: String, enum: ['text', 'image', 'file', 'prescription'] },
  content: String,
  readAt: Date
});

const DoctorSchema = new mongoose.Schema({
  doctorId: String,
  name: String,
  specialty: String,
  consultationFee: Number,
  availableSlots: [{
    day: String, slots: [{ start: String, end: String }]
  }],
  isAvailable: Boolean
});

const Consultation = mongoose.model('Consultation', ConsultationSchema);
const Message = mongoose.model('Message', MessageSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);

// Health check
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'risa-care-teleconsult-v2',
    version: '1.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get doctors
app.get('/api/doctors', async (req, res) => {
  const { specialty, available } = req.query;
  const query: any = {};
  if (specialty) query.specialty = specialty;
  if (available === 'true') query.isAvailable = true;

  const doctors = await Doctor.find(query).lean();
  res.json({ success: true, doctors });
});

// Get doctor slots
app.get('/api/doctors/:id/slots', async (req, res) => {
  const { date } = req.query;
  const doctor = await Doctor.findOne({ doctorId: req.params.id });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  // Return slots for requested date
  const slots = generateTimeSlots(doctor.availableSlots, date as string);
  res.json({ success: true, doctorId: doctor.doctorId, date, slots });
});

// Book consultation
app.post('/api/consultations', async (req, res) => {
  try {
    const { patientId, doctorId, scheduledAt, type, chiefComplaint } = req.body;

    const consultation = await Consultation.create({
      consultationId: `CONSULT${Date.now()}`,
      patientId, doctorId, scheduledAt: new Date(scheduledAt), type, chiefComplaint, status: 'scheduled'
    });

    logger.info('Consultation booked', { consultationId: consultation.consultationId });

    res.status(201).json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get consultation
app.get('/api/consultations/:id', async (req, res) => {
  const consultation = await Consultation.findOne({ consultationId: req.params.id });
  if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
  res.json({ success: true, consultation });
});

// Get patient consultations
app.get('/api/consultations/patient/:patientId', async (req, res) => {
  const { status } = req.query;
  const query: any = { patientId: req.params.patientId };
  if (status) query.status = status;

  const consultations = await Consultation.find(query).sort({ scheduledAt: -1 }).lean();
  res.json({ success: true, consultations });
});

// Get messages
app.get('/api/consultations/:id/messages', async (req, res) => {
  const messages = await Message.find({ consultationId: req.params.id }).sort({ createdAt: 1 }).lean();
  res.json({ success: true, messages });
});

// Update consultation status
app.patch('/api/consultations/:id/status', async (req, res) => {
  const { status, notes, duration } = req.body;
  const update: any = { status };

  if (status === 'in_progress') update.startedAt = new Date();
  if (status === 'completed') {
    update.endedAt = new Date();
    update.duration = duration;
  }
  if (notes) update.notes = notes;

  const consultation = await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    update,
    { new: true }
  );

  if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

  // Emit via socket
  io.to(req.params.id).emit('statusUpdate', { status, consultationId: req.params.id });

  res.json({ success: true, consultation });
});

// Add prescription
app.post('/api/consultations/:id/prescription', async (req, res) => {
  const { prescription } = req.body;
  const consultation = await Consultation.findOneAndUpdate(
    { consultationId: req.params.id },
    { $push: { prescription } },
    { new: true }
  );

  if (!consultation) return res.status(404).json({ error: 'Consultation not found' });

  res.json({ success: true, prescription: consultation.prescription });
});

// Socket.IO handlers
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('joinConsultation', (consultationId: string) => {
    socket.join(consultationId);
    logger.info('Joined consultation', { consultationId, socketId: socket.id });
  });

  socket.on('leaveConsultation', (consultationId: string) => {
    socket.leave(consultationId);
  });

  socket.on('offer', (data: { consultationId: string, offer: any, from: string }) => {
    socket.to(data.consultationId).emit('offer', { offer: data.offer, from: data.from });
  });

  socket.on('answer', (data: { consultationId: string, answer: any, from: string }) => {
    socket.to(data.consultationId).emit('answer', { answer: data.answer, from: data.from });
  });

  socket.on('ice-candidate', (data: { consultationId: string, candidate: any, from: string }) => {
    socket.to(data.consultationId).emit('ice-candidate', { candidate: data.candidate, from: data.from });
  });

  socket.on('toggle-video', (data: { consultationId: string, enabled: boolean }) => {
    socket.to(data.consultationId).emit('videoToggle', { enabled: data.enabled });
  });

  socket.on('toggle-audio', (data: { consultationId: string, enabled: boolean }) => {
    socket.to(data.consultationId).emit('audioToggle', { enabled: data.enabled });
  });

  socket.on('endCall', (consultationId: string) => {
    io.to(consultationId).emit('callEnded');
    Consultation.findOneAndUpdate(
      { consultationId },
      { status: 'completed', endedAt: new Date() }
    );
  });

  socket.on('chat', (data: { consultationId: string, senderId: string, senderType: string, content: string }) => {
    const message = Message.create({
      consultationId: data.consultationId,
      senderId: data.senderId,
      senderType: data.senderType,
      type: 'text',
      content: data.content
    });

    io.to(data.consultationId).emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

function generateTimeSlots(availableSlots: any[], date: string): string[] {
  const slots: string[] = [];
  const baseDate = date ? new Date(date) : new Date();

  for (let hour = 9; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }

  return slots;
}

async function seedDoctors() {
  const count = await Doctor.countDocuments();
  if (count === 0) {
    await Doctor.insertMany([
      { doctorId: 'DR001', name: 'Dr. Priya Sharma', specialty: 'General Physician', consultationFee: 500, isAvailable: true, availableSlots: [{ day: 'all', slots: [{ start: '09:00', end: '18:00' }] }] },
      { doctorId: 'DR002', name: 'Dr. Rajesh Kumar', specialty: 'Cardiologist', consultationFee: 800, isAvailable: true, availableSlots: [{ day: 'all', slots: [{ start: '10:00', end: '17:00' }] }] },
      { doctorId: 'DR003', name: 'Dr. Ananya Gupta', specialty: 'Dermatologist', consultationFee: 600, isAvailable: true, availableSlots: [{ day: 'all', slots: [{ start: '09:00', end: '16:00' }] }] },
      { doctorId: 'DR004', name: 'Dr. Vikram Singh', specialty: 'Orthopedic', consultationFee: 700, isAvailable: true, availableSlots: [{ day: 'all', slots: [{ start: '10:00', end: '18:00' }] }] },
      { doctorId: 'DR005', name: 'Dr. Meera Patel', specialty: 'Pediatrician', consultationFee: 550, isAvailable: true, availableSlots: [{ day: 'all', slots: [{ start: '09:00', end: '17:00' }] }] }
    ]);
    logger.info('Seeded 5 doctors');
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await seedDoctors();

    httpServer.listen(PORT, () => {
      logger.info(`Teleconsult V2 started on port ${PORT}`);
      logger.info('Features: WebRTC signaling, Socket.IO, Video/Audio/Chat');
    });
  } catch (error) {
    logger.error('Server error', { error });
    process.exit(1);
  }
}

startServer();
export default app;
