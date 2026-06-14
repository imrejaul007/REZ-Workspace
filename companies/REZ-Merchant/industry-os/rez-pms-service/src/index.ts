/**
 * REZ PMS Service
 * Property Management System for hotels
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const roomSchema = new mongoose.Schema({
  merchantId: String, number: String, type: String, floor: Number,
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'blocked'] },
  features: [String], price: Number, maxOccupancy: Number
});
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

const bookingSchema = new mongoose.Schema({
  merchantId: String, guestId: String, roomId: mongoose.Schema.Types.ObjectId,
  checkIn: Date, checkOut: Date, guests: Number,
  status: { type: String, enum: ['confirmed', 'checked-in', 'checked-out', 'cancelled'] },
  totalAmount: Number, paidAmount: Number,
  specialRequests: String, createdAt: Date
});
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const guestSchema = new mongoose.Schema({
  merchantId: String, name: String, email: String, phone: String,
  idType: String, idNumber: String,
  address: String, city: String, state: String, pincode: String,
  preferences: mongoose.Schema.Types.Mixed, createdAt: Date
});
const Guest = mongoose.models.Guest || mongoose.model('Guest', guestSchema);

// Routes - Rooms
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-pms-service' }));

app.post('/api/rooms', async (req, res) => {
  const room = new Room(req.body);
  await room.save();
  res.json({ success: true, data: room });
});

app.get('/api/rooms/:merchantId', async (req, res) => {
  const rooms = await Room.find({ merchantId: req.params.merchantId });
  res.json({ success: true, data: rooms });
});

app.get('/api/rooms/detail/:id', async (req, res) => {
  const room = await Room.findById(req.params.id);
  res.json({ success: true, data: room });
});

app.put('/api/rooms/:id', async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: room });
});

app.put('/api/rooms/:id/status', async (req, res) => {
  const { status } = req.body;
  const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ success: true, data: room });
});

// Routes - Bookings
app.post('/api/bookings', async (req, res) => {
  const booking = new Booking(req.body);
  await booking.save();
  res.json({ success: true, data: booking });
});

app.get('/api/bookings/:merchantId', async (req, res) => {
  const { status, startDate, endDate } = req.query;
  const query: any = { merchantId: req.params.merchantId };
  if (status) query.status = status;
  const bookings = await Booking.find(query).sort({ checkIn: -1 });
  res.json({ success: true, data: bookings });
});

app.get('/api/bookings/detail/:id', async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('roomId');
  res.json({ success: true, data: booking });
});

app.put('/api/bookings/:id/checkin', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'checked-in' }, { new: true });
  await Room.findByIdAndUpdate(booking.roomId, { status: 'occupied' });
  res.json({ success: true, data: booking });
});

app.put('/api/bookings/:id/checkout', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'checked-out' }, { new: true });
  await Room.findByIdAndUpdate(booking.roomId, { status: 'available' });
  res.json({ success: true, data: booking });
});

app.put('/api/bookings/:id', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: booking });
});

// Routes - Guests
app.post('/api/guests', async (req, res) => {
  const guest = new Guest({ ...req.body, createdAt: new Date() });
  await guest.save();
  res.json({ success: true, data: guest });
});

app.get('/api/guests/:merchantId', async (req, res) => {
  const guests = await Guest.find({ merchantId: req.params.merchantId });
  res.json({ success: true, data: guests });
});

app.get('/api/guests/detail/:id', async (req, res) => {
  const guest = await Guest.findById(req.params.id);
  res.json({ success: true, data: guest });
});

app.put('/api/guests/:id', async (req, res) => {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: guest });
});

// Availability
app.get('/api/availability/:merchantId', async (req, res) => {
  const { checkIn, checkOut } = req.query;
  const availableRooms = await Room.find({ merchantId: req.params.merchantId, status: 'available' });
  res.json({ success: true, data: { available: availableRooms.length, rooms: availableRooms } });
});

// Stats
app.get('/api/stats/:merchantId', async (req, res) => {
  const totalRooms = await Room.countDocuments({ merchantId: req.params.merchantId });
  const availableRooms = await Room.countDocuments({ merchantId: req.params.merchantId, status: 'available' });
  const occupiedRooms = await Room.countDocuments({ merchantId: req.params.merchantId, status: 'occupied' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const arrivals = await Booking.countDocuments({ merchantId: req.params.merchantId, checkIn: { $gte: today }, status: 'confirmed' });
  const departures = await Booking.countDocuments({ merchantId: req.params.merchantId, checkOut: { $gte: today }, status: 'checked-in' });
  res.json({ success: true, data: { totalRooms, availableRooms, occupiedRooms, arrivals, departures } });
});

const PORT = process.env.PORT || 4031;
app.listen(PORT, () => logger.info(`rez-pms-service on port ${PORT}`));

export default app;
