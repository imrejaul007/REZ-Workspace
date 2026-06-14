/**
 * RisaCare Mobile Backend Service
 * Backend for Patient App and Doctor App
 *
 * Features:
 * - User authentication (patients, doctors)
 * - Profile management
 * - Appointment booking
 * - Health records access
 * - Notifications
 * - Chat with doctors
 * - Video consultations
 * - Prescription management
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import winston from 'winston';

import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();

const PORT = parseInt(process.env.PORT || '4770', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'risacare-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_mobile';

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
// MONGOOSE SCHEMAS
// ============================================

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: String,
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    dateOfBirth: Date,
    gender: String
  },
  doctorProfile: {
    specialization: String,
    qualifications: [String],
    experience: Number,
    consultationFee: Number,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    available: { type: Boolean, default: true }
  },
  patientProfile: {
    bloodGroup: String,
    allergies: [String],
    conditions: [String],
    emergencyContact: {
      name: String, phone: String, relationship: String
    }
  },
  devices: [{
    token: String,
    platform: String,
    lastActive: Date
  }],
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLogin: Date
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  doctorId: String,
  type: { type: String, enum: ['video', 'audio', 'clinic'], default: 'clinic' },
  status: { type: String, enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'], default: 'pending' },
  scheduledAt: Date,
  duration: Number,
  reason: String,
  notes: String,
  prescription: [{
    medicine: String, dosage: String, frequency: String, duration: String
  }],
  followUpRequired: Boolean,
  followUpDate: Date,
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  conversationId: String,
  senderId: String,
  receiverId: String,
  type: { type: String, enum: ['text', 'image', 'file', 'prescription'] },
  content: String,
  readAt: Date
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  participants: [String],
  lastMessage: {
    content: String,
    senderId: String,
    sentAt: Date
  },
  unreadCount: { type: Map, of: Number, default: {} }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: String,
  title: String,
  body: String,
  data: mongoose.Schema.Types.Mixed,
  type: { type: String, enum: ['appointment', 'message', 'reminder', 'alert', 'system'] },
  read: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

const HealthRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  userId: String,
  type: { type: String, enum: ['lab_report', 'prescription', 'imaging', 'discharge_summary', 'other'] },
  title: String,
  date: Date,
  doctorName: String,
  hospitalName: String,
  fileUrl: String,
  summary: String
}, { timestamps: true });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  userId: String,
  doctorId: String,
  doctorName: String,
  date: Date,
  diagnosis: String,
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  notes: String,
  validUntil: Date
}, { timestamps: true });

// Models
const User = mongoose.model('User', UserSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const HealthRecord = mongoose.model('HealthRecord', HealthRecordSchema);
const Prescription = mongoose.model('Prescription', PrescriptionSchema);

// ============================================
// AUTH MIDDLEWARE
// ============================================

function authMiddleware(req: any, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// ROUTES
// ============================================

app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'mobile-backend',
    version: '1.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== AUTH =====

app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, email, password, role, firstName, lastName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: `user_${uuidv4()}`,
      phone,
      email,
      password: hashedPassword,
      role: role || 'patient',
      profile: { firstName, lastName }
    });

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      user: {
        userId: user.userId,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    const user = await User.findOne({ $or: [{ phone }, { email }] });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      user: {
        userId: user.userId,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== PROFILE =====

app.get('/api/profile', authMiddleware, async (req: any, res) => {
  const user = await User.findOne({ userId: req.userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    success: true,
    user: {
      userId: user.userId,
      phone: user.phone,
      email: user.email,
      role: user.role,
      profile: user.profile,
      doctorProfile: user.doctorProfile,
      patientProfile: user.patientProfile
    }
  });
});

app.patch('/api/profile', authMiddleware, async (req: any, res) => {
  const { profile, doctorProfile, patientProfile } = req.body;
  const update: any = {};

  if (profile) update.profile = profile;
  if (doctorProfile) update.doctorProfile = doctorProfile;
  if (patientProfile) update.patientProfile = patientProfile;

  const user = await User.findOneAndUpdate(
    { userId: req.userId },
    update,
    { new: true }
  );

  res.json({ success: true, user });
});

// ===== DOCTORS =====

app.get('/api/doctors', async (req, res) => {
  const { specialization, search, limit = '20' } = req.query;
  const query: any = { role: 'doctor', status: 'active' };

  if (specialization) query['doctorProfile.specialization'] = specialization;
  if (search) {
    query.$or = [
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } },
      { 'doctorProfile.specialization': { $regex: search, $options: 'i' } }
    ];
  }

  const doctors = await User.find(query)
    .select('userId profile doctorProfile')
    .limit(parseInt(limit as string));

  res.json({ success: true, doctors });
});

app.get('/api/doctors/:id', async (req, res) => {
  const doctor = await User.findOne({ userId: req.params.id, role: 'doctor' });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  res.json({
    success: true,
    doctor: {
      userId: doctor.userId,
      profile: doctor.profile,
      doctorProfile: doctor.doctorProfile
    }
  });
});

// ===== APPOINTMENTS =====

app.post('/api/appointments', authMiddleware, async (req: any, res) => {
  const { doctorId, type, scheduledAt, duration, reason } = req.body;

  const appointment = await Appointment.create({
    appointmentId: `apt_${uuidv4()}`,
    patientId: req.userId,
    doctorId,
    type: type || 'clinic',
    scheduledAt: new Date(scheduledAt),
    duration: duration || 30,
    reason,
    status: 'pending'
  });

  // Notify doctor
  ecosystem.rabtul.sendPushNotification(
    doctorId,
    'New Appointment',
    `New appointment request from patient`
  ).catch(() => {});

  res.status(201).json({ success: true, appointment });
});

app.get('/api/appointments', authMiddleware, async (req: any, res) => {
  const { status, role } = req.query;
  const query: any = role === 'doctor' ? { doctorId: req.userId } : { patientId: req.userId };

  if (status) query.status = status;

  const appointments = await Appointment.find(query)
    .populate('patientId', 'profile')
    .populate('doctorId', 'profile')
    .sort({ scheduledAt: -1 });

  res.json({ success: true, appointments });
});

app.patch('/api/appointments/:id', authMiddleware, async (req: any, res) => {
  const { status, notes, prescription } = req.body;
  const update: any = {};

  if (status) {
    update.status = status;
    if (status === 'cancelled') update.cancelledAt = new Date();
  }
  if (notes) update.notes = notes;
  if (prescription) update.prescription = prescription;

  const appointment = await Appointment.findOneAndUpdate(
    { appointmentId: req.params.id },
    update,
    { new: true }
  );

  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  // Notify patient
  ecosystem.rabtul.sendPushNotification(
    appointment.patientId,
    'Appointment Update',
    `Your appointment has been ${status}`
  ).catch(() => {});

  res.json({ success: true, appointment });
});

// ===== CHAT =====

app.get('/api/conversations', authMiddleware, async (req: any, res) => {
  const conversations = await Conversation.find({ participants: req.userId })
    .sort({ 'lastMessage.sentAt': -1 });

  res.json({ success: true, conversations });
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req: any, res) => {
  const messages = await Message.find({ conversationId: req.params.id })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json({ success: true, messages });
});

app.post('/api/conversations/start', authMiddleware, async (req: any, res) => {
  const { doctorId } = req.body;

  let conversation = await Conversation.findOne({
    participants: { $all: [req.userId, doctorId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      conversationId: `conv_${uuidv4()}`,
      participants: [req.userId, doctorId]
    });
  }

  res.json({ success: true, conversation });
});

// ===== NOTIFICATIONS =====

app.get('/api/notifications', authMiddleware, async (req: any, res) => {
  const notifications = await Notification.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, notifications });
});

app.patch('/api/notifications/:id/read', authMiddleware, async (req: any, res) => {
  await Notification.findOneAndUpdate(
    { notificationId: req.params.id, userId: req.userId },
    { read: true, readAt: new Date() }
  );

  res.json({ success: true });
});

// ===== HEALTH RECORDS =====

app.get('/api/records', authMiddleware, async (req: any, res) => {
  const records = await HealthRecord.find({ userId: req.userId })
    .sort({ date: -1 });

  res.json({ success: true, records });
});

app.post('/api/records', authMiddleware, async (req: any, res) => {
  const record = await HealthRecord.create({
    recordId: `rec_${uuidv4()}`,
    userId: req.userId,
    ...req.body
  });

  res.status(201).json({ success: true, record });
});

// ===== PRESCRIPTIONS =====

app.get('/api/prescriptions', authMiddleware, async (req: any, res) => {
  const prescriptions = await Prescription.find({ userId: req.userId })
    .sort({ date: -1 });

  res.json({ success: true, prescriptions });
});

// ===== SOCKET.IO =====

io.on('connection', (socket) => {
  logger.info('Mobile client connected', { socketId: socket.id });

  socket.on('authenticate', (userId: string) => {
    socket.join(`user_${userId}`);
    logger.info('User authenticated', { userId });
  });

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(`conv_${conversationId}`);
  });

  socket.on('send_message', async (data: any) => {
    const message = await Message.create({
      messageId: `msg_${uuidv4()}`,
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      type: data.type || 'text',
      content: data.content
    });

    await Conversation.findOneAndUpdate(
      { conversationId: data.conversationId },
      { lastMessage: { content: data.content, senderId: data.senderId, sentAt: new Date() } }
    );

    io.to(`conv_${data.conversationId}`).emit('new_message', message);
    io.to(`user_${data.receiverId}`).emit('new_message', message);
  });

  socket.on('typing', (data: any) => {
    io.to(`conv_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('disconnect', () => {
    logger.info('Mobile client disconnected', { socketId: socket.id });
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Mobile Backend connected to MongoDB');
    httpServer.listen(PORT, () => {
      logger.info(`RisaCare Mobile Backend started on port ${PORT}`);
      logger.info('Features: Auth, Profile, Appointments, Chat, Notifications, Records');
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

start();
export default app;
