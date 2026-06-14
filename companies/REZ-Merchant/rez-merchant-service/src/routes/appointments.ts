/**
 * Appointments Routes - Salon, Healthcare, Fitness bookings
 * Route: /api/v1/merchant/appointments
 */

import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  customerId: { type: String, required: true },
  customerName: String,
  customerPhone: String,
  staffId: String,
  serviceId: String,
  serviceName: String,
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: Number, // minutes
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  notes: String,
  price: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

// Time Slot Schema
const timeSlotSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  staffId: String,
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true }
});

const TimeSlot = mongoose.models.TimeSlot || mongoose.model('TimeSlot', timeSlotSchema);

// Walk-in Schema
const walkinSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  customerName: String,
  customerPhone: String,
  service: String,
  status: { type: String, enum: ['waiting', 'called', 'served', 'left'], default: 'waiting' },
  queuePosition: Number,
  estimatedWait: Number, // minutes
  createdAt: { type: Date, default: Date.now }
});

const Walkin = mongoose.models.Walkin || mongoose.model('Walkin', walkinSchema);

// ─── APPOINTMENTS ──────────────────────────────────────────────────────────────

// GET /appointments - Get all appointments
router.get('/', async (req, res) => {
  const { merchantId, date, status, staffId } = req.query;

  const query: unknown = {};
  if (merchantId) query.merchantId = merchantId;
  if (status) query.status = status;
  if (staffId) query.staffId = staffId;
  if (date) {
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const appointments = await Appointment.find(query).sort({ date: 1, startTime: 1 });
  res.json({ success: true, data: appointments });
});

// GET /appointments/:id - Get single appointment
router.get('/:id', async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }
  res.json({ success: true, data: appointment });
});

// POST /appointments - Create appointment
router.post('/', async (req, res) => {
  const {
    merchantId,
    customerId,
    customerName,
    customerPhone,
    staffId,
    serviceId,
    serviceName,
    date,
    startTime,
    endTime,
    duration,
    notes,
    price
  } = req.body;

  const appointment = new Appointment({
    merchantId,
    customerId,
    customerName,
    customerPhone,
    staffId,
    serviceId,
    serviceName,
    date: new Date(date),
    startTime,
    endTime,
    duration,
    notes,
    price,
    status: 'pending'
  });

  await appointment.save();
  res.status(201).json({ success: true, data: appointment });
});

// PATCH /appointments/:id - Update appointment
router.patch('/:id', async (req, res) => {
  const { status, date, startTime, endTime, notes, staffId } = req.body;

  const update: unknown = { updatedAt: new Date() };
  if (status) update.status = status;
  if (date) update.date = new Date(date);
  if (startTime) update.startTime = startTime;
  if (endTime) update.endTime = endTime;
  if (notes !== undefined) update.notes = notes;
  if (staffId) update.staffId = staffId;

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true }
  );

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  res.json({ success: true, data: appointment });
});

// DELETE /appointments/:id - Cancel appointment
router.delete('/:id', async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled', updatedAt: new Date() },
    { new: true }
  );

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  res.json({ success: true, data: appointment });
});

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────

// GET /appointments/slots - Get available slots
router.get('/slots/available', async (req, res) => {
  const { merchantId, date, staffId, serviceId } = req.query;

  const query: unknown = {
    merchantId,
    date: new Date(date as string),
    isAvailable: true
  };
  if (staffId) query.staffId = staffId;

  const slots = await TimeSlot.find(query).sort({ startTime: 1 });
  res.json({ success: true, data: slots });
});

// POST /appointments/slots - Create time slot
router.post('/slots', async (req, res) => {
  const { merchantId, staffId, date, startTime, endTime } = req.body;

  const slot = new TimeSlot({
    merchantId,
    staffId,
    date: new Date(date),
    startTime,
    endTime,
    isAvailable: true
  });

  await slot.save();
  res.status(201).json({ success: true, data: slot });
});

// ─── WALK-INS ───────────────────────────────────────────────────────────────

// GET /appointments/walkins - Get walk-in queue
router.get('/walkins/queue', async (req, res) => {
  const { merchantId } = req.query;

  const walkins = await Walkin.find({
    merchantId,
    status: { $in: ['waiting', 'called'] }
  }).sort({ queuePosition: 1 });

  res.json({ success: true, data: walkins });
});

// POST /appointments/walkins - Add to walk-in queue
router.post('/walkins', async (req, res) => {
  const { merchantId, customerName, customerPhone, service } = req.body;

  // Get current queue position
  const lastInQueue = await Walkin.findOne({ merchantId, status: 'waiting' })
    .sort({ queuePosition: -1 });
  const queuePosition = (lastInQueue?.queuePosition || 0) + 1;

  // Estimate wait time (15 min per person in queue)
  const estimatedWait = queuePosition * 15;

  const walkin = new Walkin({
    merchantId,
    customerName,
    customerPhone,
    service,
    queuePosition,
    estimatedWait,
    status: 'waiting'
  });

  await walkin.save();
  res.status(201).json({ success: true, data: walkin });
});

// PATCH /appointments/walkins/:id - Update walk-in status
router.patch('/walkins/:id', async (req, res) => {
  const { status } = req.body;

  const walkin = await Walkin.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!walkin) {
    return res.status(404).json({ success: false, message: 'Walk-in not found' });
  }

  res.json({ success: true, data: walkin });
});

export default router;
