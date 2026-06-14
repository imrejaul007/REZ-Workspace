/**
 * REZ Verify QR - Merchant APIs
 * Serial Generation + Service Centers + Ownership Transfer + Service Booking Management
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import logger from './utils/logger';

const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';
const CARE_API = process.env.CARE_API || 'https://REZ-care.onrender.com';

const router = express.Router();

// ============================================
// MODELS
// ============================================

// Serial Batch (bulk generation)
const SerialBatch = mongoose.model('SerialBatch', new mongoose.Schema({
  batch_id: { type: String, required: true },
  merchant_id: String,
  product_id: String,
  brand: String,
  model: String,
  category: String,
  quantity: Number,
  serials: [{
    serial_number: String,
    qr_code: String,
    status: String,
    generated_at: Date
  }],
  status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
  created_by: String,
  created_at: { type: Date, default: Date.now }
}));

// Ownership Transfer
const OwnershipTransfer = mongoose.model('OwnershipTransfer', new mongoose.Schema({
  serial_number: String,
  from_user_id: String,
  to_user_id: String,
  to_name: String,
  to_phone: String,
  to_email: String,
  transfer_type: { type: String, enum: ['resale', 'gift', 'return'], default: 'resale' },
  proof_of_sale: String,
  verification_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verified_by: String,
  verified_at: Date,
  completed_at: Date,
  created_at: { type: Date, default: Date.now }
}));

// Service Center
const ServiceCenter = mongoose.model('ServiceCenter', new mongoose.Schema({
  center_id: { type: String, required: true, unique: true },
  name: String,
  merchant_id: String,
  merchant_name: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  email: String,
  lat: Number,
  lng: Number,
  services: [String],  // repair, replace, refund
  brands: [String],
  working_hours: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now }
}));

// Service Slot (availability)
const ServiceSlot = mongoose.model('ServiceSlot', new mongoose.Schema({
  center_id: String,
  date: Date,
  slots: [{
    time: String,
    available: { type: Boolean, default: true },
    booked_by: String,
    booking_id: String
  }],
  max_daily_bookings: { type: Number, default: 20 },
  created_at: { type: Date, default: Date.now }
}));

// Service Booking
const ServiceBooking = mongoose.model('ServiceBooking', new mongoose.Schema({
  booking_id: String,
  serial_number: String,
  product_id: String,
  user_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,
  service_center_id: String,
  service_center_name: String,
  service_type: String,
  issue_description: String,
  preferred_date: Date,
  preferred_time: String,
  scheduled_date: Date,
  scheduled_time: String,
  status: String,
  estimated_cost: Number,
  actual_cost: Number,
  warranty_covered: { type: Boolean, default: false },
  photos: [String],
  notes: String,
  rating: Number,
  feedback: String,
  timeline: [{ status: String, note: String, updated_by: String, updated_at: Date }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// ============================================
// SERIAL GENERATION APIs
// ============================================

/**
 * POST /api/serial/generate
 * Generate bulk serials for a product
 */
router.post('/serial/generate', async (req: Request, res: Response) => {
  const {
    merchant_id,
    product_id,
    brand,
    model,
    category,
    quantity,
    warranty_months = 12,
    created_by
  } = req.body;

  if (!merchant_id || !quantity || quantity > 10000) {
    return res.status(400).json({ error: 'Invalid merchant_id or quantity (max 10000)' });
  }

  // Generate batch ID
  const batch_id = `BATCH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Create batch
  const batch = new SerialBatch({
    batch_id,
    merchant_id,
    product_id,
    brand,
    model,
    category,
    quantity,
    status: 'generating',
    created_by
  });

  // Generate serials
  const serials = [];
  for (let i = 0; i < quantity; i++) {
    const serial = `${brand?.substring(0, 3).toUpperCase() || 'PRD'}${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}${String(i).padStart(4, '0')}`;
    const qr_code = `REZ:${serial}`;

    serials.push({
      serial_number: serial,
      qr_code,
      status: 'active',
      generated_at: new Date()
    });
  }

  batch.serials = serials;
  batch.status = 'completed';
  await batch.save();

  // Also register all serials in SerialRegistry
  for (const s of serials) {
    await mongoose.model('SerialRegistry').create({
      serial_number: s.serial_number,
      merchant_id,
      brand,
      model,
      category,
      warranty_months,
      status: 'active',
      verification_count: 0,
      ownership_status: 'unowned'
    });
  }

  // Notify REZ-Merchant
  try {
    await axios.post(`${MERCHANT_API}/api/products/register-serials`, {
      batch_id,
      merchant_id,
      product_id,
      serials: serials.map(s => s.serial_number)
    }, { headers: { 'x-api-key': process.env.INTERNAL_KEY } });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    batch_id,
    quantity,
    serials: serials.map(s => ({
      serial: s.serial_number,
      qr: s.qr_code
    }))
  });
});

/**
 * GET /api/serial/:serial
 * Get single serial details
 */
router.get('/serial/:serial', async (req, res) => {
  const { serial } = req.params;

  const serialData = await mongoose.model('SerialRegistry').findOne({ serial_number: serial });
  if (!serialData) {
    return res.status(404).json({ error: 'Serial not found' });
  }

  const warranty = await mongoose.model('Warranty').findOne({ serial_number: serial });
  const transfers = await OwnershipTransfer.find({ serial_number: serial }).sort({ created_at: -1 });

  res.json({
    serial: serialData,
    warranty: warranty || null,
    ownership_history: transfers
  });
});

/**
 * GET /api/serial/batch/:batch_id
 * Get batch details
 */
router.get('/serial/batch/:batch_id', async (req, res) => {
  const batch = await SerialBatch.findOne({ batch_id: req.params.batch_id });
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  res.json({
    batch_id: batch.batch_id,
    status: batch.status,
    quantity: batch.quantity,
    generated: batch.serials.length,
    serials: batch.serials.map(s => ({
      serial: s.serial_number,
      status: s.status
    }))
  });
});

// ============================================
// SERVICE CENTER APIs
// ============================================

/**
 * POST /api/service-centers
 * Register a service center
 */
router.post('/service-centers', async (req: Request, res: Response) => {
  const {
    name, merchant_id, merchant_name,
    address, city, state, pincode,
    phone, email, lat, lng,
    services, brands, working_hours
  } = req.body;

  const center_id = `SC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const center = new ServiceCenter({
    center_id, name, merchant_id, merchant_name,
    address, city, state, pincode,
    phone, email, lat, lng,
    services: services || ['repair', 'replace', 'refund'],
    brands: brands || [],
    working_hours,
    status: 'active'
  });

  await center.save();

  res.json({ success: true, center_id });
});

/**
 * GET /api/service-centers
 * Find nearest service center
 */
router.get('/service-centers', async (req, res) => {
  const { lat, lng, city, brand, service } = req.query;

  let query: unknown = { status: 'active' };

  if (city) query.city = city;
  if (brand) query.brands = { $in: [brand] };
  if (service) query.services = { $in: [service as string] };

  let centers = await ServiceCenter.find(query);

  // Sort by distance if lat/lng provided
  if (lat && lng) {
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    centers = centers.map(c => ({
      ...c.toObject(),
      distance: c.lat && c.lng ?
        Math.sqrt(Math.pow(c.lat - userLat, 2) + Math.pow(c.lng - userLng, 2)) : 9999
    })).sort((a, b) => a.distance - b.distance);
  }

  res.json({
    count: centers.length,
    centers: centers.slice(0, 10)
  });
});

/**
 * GET /api/service-centers/:id
 * Get service center details
 */
router.get('/service-centers/:id', async (req, res) => {
  const center = await ServiceCenter.findOne({ center_id: req.params.id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  res.json(center);
});

// ============================================
// OWNERSHIP TRANSFER APIs
// ============================================

/**
 * POST /api/transfer
 * Transfer ownership (resale/gift)
 */
router.post('/transfer', async (req: Response, res) => {
  const {
    serial_number,
    from_user_id,
    to_user_id,
    to_name,
    to_phone,
    to_email,
    transfer_type,
    proof_of_sale
  } = req.body;

  // Verify serial exists
  const serial = await mongoose.model('SerialRegistry').findOne({ serial_number });
  if (!serial) {
    return res.status(404).json({ error: 'Serial not found' });
  }

  // Verify current owner
  if (serial.ownership_status !== 'owned') {
    return res.status(400).json({ error: 'Product not currently owned' });
  }

  // Create transfer record
  const transfer = new OwnershipTransfer({
    serial_number,
    from_user_id,
    to_user_id,
    to_name,
    to_phone,
    to_email,
    transfer_type: transfer_type || 'resale',
    proof_of_sale,
    verification_status: 'pending'
  });

  await transfer.save();

  // Update serial ownership
  serial.ownership_status = 'transferred';
  await serial.save();

  res.json({
    success: true,
    transfer_id: transfer._id,
    status: 'pending_verification',
    message: 'Transfer submitted for verification'
  });
});

/**
 * POST /api/transfer/:id/verify
 * Verify transfer (admin)
 */
router.post('/transfer/:id/verify', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, verified_by } = req.body; // action: approve/reject

  const transfer = await OwnershipTransfer.findById(id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  if (action === 'approve') {
    transfer.verification_status = 'verified';
    transfer.verified_by = verified_by;
    transfer.verified_at = new Date();
    transfer.completed_at = new Date();
    await transfer.save();

    // Update warranty to new owner
    await mongoose.model('Warranty').updateOne(
      { serial_number: transfer.serial_number },
      { user_id: transfer.to_user_id }
    );

    // Update serial
    await mongoose.model('SerialRegistry').updateOne(
      { serial_number: transfer.serial_number },
      { ownership_status: 'owned' }
    );
  } else {
    transfer.verification_status = 'rejected';
    await transfer.save();

    // Revert serial status
    await mongoose.model('SerialRegistry').updateOne(
      { serial_number: transfer.serial_number },
      { ownership_status: 'owned' }
    );
  }

  res.json({ success: true, status: transfer.verification_status });
});

/**
 * GET /api/ownership/:serial
 * Get ownership history
 */
router.get('/ownership/:serial', async (req: Response, res) => {
  const { serial } = req.params;

  const serialData = await mongoose.model('SerialRegistry').findOne({ serial_number: serial });
  const transfers = await OwnershipTransfer.find({ serial_number: serial })
    .sort({ created_at: -1 });
  const warranty = await mongoose.model('Warranty').findOne({ serial_number: serial });

  res.json({
    serial_number: serial,
    current_owner: warranty ? {
      user_id: warranty.user_id,
      name: warranty.customer_name,
      activated_at: warranty.activated_at
    } : null,
    ownership_status: serialData?.ownership_status,
    transfers: transfers
  });
});

// ============================================
// CLAIM UPDATE APIs
// ============================================

/**
 * POST /api/claim/:id/update
 * Update claim status (Service Center)
 */
router.post('/claim/:id/update', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, resolved_by, resolution_type } = req.body;

  const claim = await mongoose.model('Claim').findById(id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  // Update claim
  claim.status = status;
  claim.timeline.push({
    status,
    note,
    updated_by: resolved_by,
    updated_at: new Date()
  });

  if (resolution_type) {
    claim.resolution_type = resolution_type;
  }

  if (status === 'resolved') {
    claim.status = 'closed';
  }

  await claim.save();

  // Notify customer via Agent
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: claim.customer_phone,
      template: 'claim_updates',
      params: {
        status,
        claim_id: claim._id.toString(),
        update_message: note || `Your claim status has been updated to ${status}`
      },
      user_id: claim.user_id
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, claim });
});

/**
 * POST /api/claim/:id/assign-center
 * Assign claim to service center
 */
router.post('/claim/:id/assign-center', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { center_id } = req.body;

  const center = await ServiceCenter.findOne({ center_id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  const claim = await mongoose.model('Claim').findById(id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  claim.service_center_id = center._id;
  claim.service_center_name = center.name;
  claim.status = 'inspection_scheduled';
  claim.timeline.push({
    status: 'inspection_scheduled',
    note: `Assigned to ${center.name}`,
    updated_at: new Date()
  });

  await claim.save();

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: claim.customer_phone,
      template: 'claim_updates',
      params: {
        status: 'inspection_scheduled',
        claim_id: claim._id.toString(),
        update_message: `Your claim has been assigned to ${center.name}. Address: ${center.address}`
      },
      user_id: claim.user_id
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, claim });
});

// ============================================
// SERVICE SLOT MANAGEMENT (Admin APIs)
// ============================================

/**
 * POST /admin/service-slots/generate
 * Generate slots for a service center for specific dates
 */
router.post('/service-slots/generate', async (req: Request, res: Response) => {
  const { center_id, start_date, end_date, working_hours = { start: '09:00', end: '17:00' }, interval_minutes = 30 } = req.body;

  if (!center_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'center_id, start_date, and end_date are required' });
  }

  const center = await ServiceCenter.findOne({ center_id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  const slotsCreated = [];
  const start = new Date(start_date);
  const end = new Date(end_date);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const slots = [];
    const [startHour, startMin] = working_hours.start.split(':').map(Number);
    const [endHour, endMin] = working_hours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push({ time: timeStr, available: true });

      currentMin += interval_minutes;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    const slotDoc = await ServiceSlot.findOneAndUpdate(
      {
        center_id,
        date: { $gte: new Date(d.setHours(0, 0, 0, 0)), $lt: new Date(d.setHours(23, 59, 59, 999)) }
      },
      {
        center_id,
        date: new Date(d),
        slots,
        max_daily_bookings: slots.length
      },
      { upsert: true, new: true }
    );

    slotsCreated.push({ date: slotDoc.date, slots_count: slots.length });
  }

  res.json({
    success: true,
    center_id,
    slots_generated: slotsCreated.length,
    details: slotsCreated
  });
});

/**
 * GET /admin/service-slots/:center_id
 * Get all slots for a service center
 */
router.get('/service-slots/:center_id', async (req: Request, res: Response) => {
  const { center_id } = req.params;
  const { from, to, status } = req.query;

  const query: unknown = { center_id };
  if (from && to) {
    query.date = { $gte: new Date(from), $lte: new Date(to) };
  }

  const slots = await ServiceSlot.find(query).sort({ date: 1 });

  // Filter by status if requested
  let result = slots;
  if (status === 'available') {
    result = slots.map(s => ({
      ...s.toObject(),
      slots: s.slots.filter((slot) => slot.available)
    }));
  } else if (status === 'booked') {
    result = slots.map(s => ({
      ...s.toObject(),
      slots: s.slots.filter((slot) => !slot.available)
    }));
  }

  res.json({ center_id, slots: result });
});

/**
 * PATCH /admin/service-slots/:center_id/block
 * Block specific slots
 */
router.patch('/service-slots/:center_id/block', async (req: Request, res: Response) => {
  const { center_id } = req.params;
  const { date, times, reason } = req.body;

  const slotDoc = await ServiceSlot.findOne({
    center_id,
    date: { $gte: new Date(new Date(date).setHours(0, 0, 0, 0)), $lt: new Date(new Date(date).setHours(23, 59, 59, 999)) }
  });

  if (!slotDoc) {
    return res.status(404).json({ error: 'No slots found for this date' });
  }

  // Block specified times
  for (const time of times) {
    const slotIndex = slotDoc.slots.findIndex((s) => s.time === time);
    if (slotIndex !== -1) {
      slotDoc.slots[slotIndex].available = false;
      slotDoc.slots[slotIndex]['blocked_reason'] = reason;
    }
  }

  await slotDoc.save();

  res.json({ success: true, message: `Blocked ${times.length} slots` });
});

// ============================================
// SERVICE BOOKING MANAGEMENT (Admin APIs)
// ============================================

/**
 * GET /admin/bookings
 * Get all bookings (with filters)
 */
router.get('/bookings', async (req: Request, res: Response) => {
  const { center_id, status, service_type, from, to, page = 1, limit = 50 } = req.query;

  const query: unknown = {};
  if (center_id) query.service_center_id = center_id;
  if (status) query.status = status;
  if (service_type) query.service_type = service_type;
  if (from && to) {
    query.scheduled_date = { $gte: new Date(from), $lte: new Date(to) };
  }

  const bookings = await ServiceBooking.find(query)
    .sort({ scheduled_date: 1, scheduled_time: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await ServiceBooking.countDocuments(query);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
});

/**
 * POST /admin/bookings/:id/confirm
 * Confirm a pending booking
 */
router.post('/bookings/:id/confirm', async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status !== 'pending') {
    return res.status(400).json({ error: 'Can only confirm pending bookings' });
  }

  booking.status = 'confirmed';
  booking.timeline.push({
    status: 'confirmed',
    note: 'Booking confirmed by service center',
    updated_at: new Date()
  });
  await booking.save();

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: booking.customer_phone,
      template: 'booking_confirmed',
      params: {
        booking_id: booking.booking_id,
        date: booking.scheduled_date,
        time: booking.scheduled_time,
        center: booking.service_center_name
      },
      user_id: booking.user_id
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, booking });
});

/**
 * POST /admin/bookings/:id/start
 * Mark booking as in_progress
 */
router.post('/bookings/:id/start', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'in_progress';
  booking.timeline.push({
    status: 'in_progress',
    note: notes || 'Service started',
    updated_at: new Date()
  });
  await booking.save();

  res.json({ success: true, booking });
});

/**
 * POST /admin/bookings/:id/complete
 * Mark booking as completed
 */
router.post('/bookings/:id/complete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actual_cost, notes, resolution } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'completed';
  booking.actual_cost = actual_cost || booking.estimated_cost;
  booking.notes = notes || booking.notes;
  booking.timeline.push({
    status: 'completed',
    note: resolution || 'Service completed',
    updated_at: new Date()
  });
  await booking.save();

  // If not warranty covered, trigger payment request
  if (!booking.warranty_covered && actual_cost > 0) {
    try {
      await axios.post(`${WALLET_API}/api/request-payment`, {
        user_id: booking.user_id,
        amount: actual_cost,
        reason: `Service charge for ${booking.service_type}`,
        booking_id: booking.booking_id
      });
    } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  // Trigger CSAT survey
  try {
    await axios.post(`${CARE_API}/api/csat/send`, {
      customer_id: booking.user_id,
      interaction_type: 'service_booking',
      interaction_id: booking.booking_id,
      template: 'service_completed'
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: booking.customer_phone,
      template: 'service_completed',
      params: {
        booking_id: booking.booking_id,
        cost: booking.warranty_covered ? 'Covered by warranty' : `₹${actual_cost}`,
        message: 'Your product is ready for pickup!'
      },
      user_id: booking.user_id
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, booking });
});

/**
 * POST /admin/bookings/:id/no-show
 * Mark customer as no-show
 */
router.post('/bookings/:id/no-show', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'no_show';
  booking.timeline.push({
    status: 'no_show',
    note: reason || 'Customer did not show up',
    updated_at: new Date()
  });
  await booking.save();

  // Free the slot
  const slotDate = new Date(booking.scheduled_date);
  await ServiceSlot.updateOne(
    {
      center_id: booking.service_center_id,
      date: { $gte: new Date(slotDate.setHours(0, 0, 0, 0)), $lt: new Date(slotDate.setHours(23, 59, 59, 999)) }
    },
    { $set: { 'slots.$[elem].available': true } },
    { arrayFilters: [{ 'elem.time': booking.scheduled_time }] }
  );

  res.json({ success: true, message: 'Marked as no-show' });
});

/**
 * GET /admin/bookings/stats
 * Get booking statistics
 */
router.get('/bookings/stats', async (req: Request, res: Response) => {
  const { center_id, from, to } = req.query;

  const match: unknown = {};
  if (center_id) match.service_center_id = center_id;
  if (from && to) {
    match.scheduled_date = { $gte: new Date(from), $lte: new Date(to) };
  }

  const [statusStats, typeStats, revenueStats] = await Promise.all([
    ServiceBooking.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    ServiceBooking.aggregate([
      { $match: match },
      { $group: { _id: '$service_type', count: { $sum: 1 } } }
    ]),
    ServiceBooking.aggregate([
      { $match: { ...match, status: 'completed', warranty_covered: false } },
      { $group: { _id: null, total: { $sum: '$actual_cost' }, count: { $sum: 1 }, avg: { $avg: '$actual_cost' } } }
    ])
  ]);

  // Peak hours
  const hourStats = await ServiceBooking.aggregate([
    { $match: match },
    { $group: { _id: '$scheduled_time', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    by_status: statusStats,
    by_service_type: typeStats,
    revenue: {
      total: revenueStats[0]?.total || 0,
      bookings: revenueStats[0]?.count || 0,
      average: revenueStats[0]?.avg || 0
    },
    peak_hours: hourStats
  });
});

// ============================================
// SERVICE CENTER ANALYTICS (Merchant Dashboard)
// ============================================

/**
 * GET /admin/center/:center_id/analytics
 * Get analytics for a service center
 */
router.get('/center/:center_id/analytics', async (req: Request, res: Response) => {
  const { center_id } = req.params;
  const { period = '30days' } = req.query;

  let fromDate = new Date();
  if (period === '7days') fromDate.setDate(fromDate.getDate() - 7);
  else if (period === '30days') fromDate.setDate(fromDate.getDate() - 30);
  else if (period === '90days') fromDate.setDate(fromDate.getDate() - 90);

  const center = await ServiceCenter.findOne({ center_id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  const bookings = await ServiceBooking.find({
    service_center_id: center_id,
    scheduled_date: { $gte: fromDate }
  });

  const stats = {
    total_bookings: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    no_show: bookings.filter(b => b.status === 'no_show').length,
    pending: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
    avg_rating: 0,
    revenue: 0
  };

  const completedBookings = bookings.filter(b => b.status === 'completed');
  if (completedBookings.length > 0) {
    const ratings = completedBookings.map(b => b.rating).filter(r => r);
    stats.avg_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    stats.revenue = completedBookings.reduce((sum, b) => sum + (b.actual_cost || 0), 0);
  }

  // Service type breakdown
  const byType: unknown = {};
  for (const booking of bookings) {
    byType[booking.service_type] = (byType[booking.service_type] || 0) + 1;
  }

  // Daily trend
  const daily: unknown = {};
  for (const booking of bookings) {
    const date = new Date(booking.scheduled_date).toISOString().split('T')[0];
    daily[date] = (daily[date] || 0) + 1;
  }

  res.json({
    center_id,
    center_name: center.name,
    period,
    stats,
    by_service_type: byType,
    daily_trend: daily
  });
});

export default router;
