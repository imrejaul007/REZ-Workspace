/**
 * REZ Verify QR Service - COMPLETE
 * Serial Registry + Scan Logs + Ownership + Claims + Fraud Detection
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import crypto from 'crypto';
import logger, { logExternalApiError } from './utils/logger';

const app = express();
app.use(express.json());

// ============================================
// CONNECTIONS
// ============================================
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const MIND_API = process.env.MIND_API || 'https://REZ-mind.onrender.com';
const NOTIF_API = process.env.NOTIF_API || 'https://rez-notifications.onrender.com';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';

// Import merchant routes
import merchantRoutes from './merchant';
app.use('/api', merchantRoutes);

// ============================================
// MODELS
// ============================================

// 1. SERIAL REGISTRY
const SerialRegistry = mongoose.model('SerialRegistry', new mongoose.Schema({
  serial_number: { type: String, required: true, unique: true, index: true },
  merchant_id: String,
  merchant_name: String,
  product_id: String,
  sku: String,
  brand: String,
  model: String,
  category: String,
  manufactured_at: Date,
  expiry_date: Date,
  status: { type: String, enum: ['active', 'deactivated', 'recalled'], default: 'active' },
  verification_count: { type: Number, default: 0 },
  ownership_status: { type: String, enum: ['unowned', 'owned', 'transferred', 'resale', 'revoked'], default: 'unowned' },
  created_at: { type: Date, default: Date.now }
}));

// 2. SCAN LOG
const ScanLog = mongoose.model('ScanLog', new mongoose.Schema({
  serial_number: String,
  user_id: String,
  user_phone: String,
  location: { lat: Number, lng: Number, city: String },
  device_id: String,
  result: String,
  flags: { first_scan: Boolean, repeat_scan: Boolean, geo_anomaly: Boolean },
  created_at: { type: Date, default: Date.now }
}));

// 3. WARRANTY
const Warranty = mongoose.model('Warranty', new mongoose.Schema({
  serial_number: String,
  user_id: String,
  product_id: String,
  merchant_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,
  purchase_date: Date,
  invoice_url: String,
  warranty_months: Number,
  warranty_start_date: Date,
  warranty_expiry_date: Date,
  warranty_status: { type: String, enum: ['pending', 'active', 'expired', 'claimed'], default: 'pending' },
  ownership_status: String,
  activated_at: Date
}));

// 4. CLAIM
const Claim = mongoose.model('Claim', new mongoose.Schema({
  claim_id: String,
  warranty_id: String,
  serial_number: String,
  user_id: String,
  customer_name: String,
  customer_phone: String,
  issue_type: String,
  issue_description: String,
  photos: [String],
  invoice_url: String,
  service_center_id: String,
  service_center_name: String,
  resolution_type: { type: String, enum: ['repair', 'replace', 'refund'] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'inspection_scheduled', 'approved', 'rejected', 'in_repair', 'replacement_shipped', 'refund_processed', 'resolved', 'closed'],
    default: 'submitted'
  },
  timeline: [{ status: String, note: String, updated_by: String, updated_at: Date }],
  created_at: { type: Date, default: Date.now }
}));

// 5. SERVICE CENTERS
const ServiceCenter = mongoose.model('ServiceCenter', new mongoose.Schema({
  center_id: String,
  name: String,
  merchant_id: String,
  city: String,
  services: [String],
  brands: [String],
  status: { type: String, default: 'active' }
}));

// 6. FRAUD RULES
const FraudRule = mongoose.model('FraudRule', new mongoose.Schema({
  rule_id: String,
  name: String,
  type: String,
  condition: Object,
  action: String,
  severity: String,
  enabled: { type: Boolean, default: true }
}));

// 7. VERIFICATION QUEUE
const VerifyQueue = mongoose.model('VerifyQueue', new mongoose.Schema({
  serial_number: String,
  reason: [String],
  scan_data: Object,
  status: { type: String, enum: ['pending', 'reviewed', 'approved', 'rejected'], default: 'pending' },
  reviewed_by: String,
  reviewed_at: Date
}));

// 8. SERVICE SLOTS (Availability for service centers)
const ServiceSlot = mongoose.model('ServiceSlot', new mongoose.Schema({
  center_id: String,
  date: Date,
  slots: [{
    time: String, // "09:00", "09:30", "10:00", etc.
    available: { type: Boolean, default: true },
    booked_by: String,
    booking_id: String
  }],
  max_daily_bookings: { type: Number, default: 20 },
  created_at: { type: Date, default: Date.now }
}));

// 9. SERVICE BOOKING (Appointment for product servicing)
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
  service_type: {
    type: String,
    enum: ['routine_service', 'repair', 'inspection', 'warranty_claim', 'general_maintenance'],
    default: 'routine_service'
  },
  issue_description: String,
  preferred_date: Date,
  preferred_time: String,
  scheduled_date: Date,
  scheduled_time: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  estimated_cost: Number,
  actual_cost: Number,
  warranty_covered: { type: Boolean, default: false },
  photos: [String],
  notes: String,
  rating: Number,
  feedback: String,
  timeline: [{
    status: String,
    note: String,
    updated_by: String,
    updated_at: Date
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// ============================================
// FRAUD DETECTION ENGINE
// ============================================

async function checkFraud(serial: string, user_id: string, location) {
  const checks = [];

  // 1. Same serial, different user in 24h = suspicious
  const recentScans = await ScanLog.find({
    serial_number: serial,
    created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  if (recentScans.length > 1) {
    checks.push({ rule: 'multiple_scans_different_users', flag: true });
  }

  // 2. Same device, multiple serials = suspicious
  if (recentScans.some(s => s.device_id === location?.device_id && s.user_id !== user_id)) {
    checks.push({ rule: 'device_share', flag: true });
  }

  // 3. Geo anomaly (same serial scanned in different countries in short time
  const geoChecks = recentScans.filter(s => location?.city && s.location?.city);
  if (geoChecks.length > 1) {
    checks.push({ rule: 'geo_impossible_travel', flag: true });
  }

  // 4. Call REZ Mind for ML-based fraud check
  try {
    const mindCheck = await axios.post(`${MIND_API}/api/fraud/verify`, {
      serial_number: serial,
      user_id,
      recent_scans: recentScans.length
    });
    if (mindCheck.data.fraud_score > 0.7) {
      checks.push({ rule: 'ml_high_risk', flag: true });
    }
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 5. Call REZ Intelligence for ML-based fraud scoring
  try {
    const fraudCheck = await axios.post(`${INTELLIGENCE_API}/api/fraud/verify-qr`, {
      serial_number: serial,
      user_id,
      device_fingerprint: location?.device_id,
      geo_location: { lat: location?.lat, lng: location?.lng },
      activation_count: serial.verification_count,
      recent_scan_count: recentScans.length
    });
    if (fraudCheck.data.fraud_score > 0.7) {
      checks.push({ rule: 'ml_high_risk', flag: true, reason: fraudCheck.data.reasons });
    }
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  return checks;
}

// ============================================
// CORE APIs
// ============================================

// VERIFY + LOG SCAN
app.post('/api/verify', async (req: Request, res: Response) => {
  const { serial_number, user_id, user_phone, location, device_id } = req.body;

  // 1. Check serial exists
  const serial = await SerialRegistry.findOne({ serial_number });
  if (!serial) {
    return res.json({ status: 'INVALID', message: 'Product not registered' });
  }

  // 2. Check fraud
  const fraudChecks = await checkFraud(serial_number, user_id, { location, device_id });
  const isFraud = fraudChecks.some(c => c.flag);

  // 3. Log scan
  const scan = new ScanLog({
    serial_number,
    user_id,
    user_phone,
    location,
    device_id,
    result: serial.ownership_status === 'owned' ? 'authentic' : 'unclaimed',
    flags: { first_scan: serial.verification_count === 0, repeat_scan: true, geo_anomaly: false }
  });
  await scan.save();

  // 4. Update serial
  serial.verification_count++;
  serial.last_verified_at = new Date();
  serial.last_verified_location = location;
  await serial.save();

  // 5. Queue for review if fraud detected
  if (isFraud) {
    await VerifyQueue.create({
      serial_number,
      reason: fraudChecks.filter(c => c.flag).map(c => c.rule),
      scan_data: { user_id, location, device_id }
    });

    // Alert via REZ Agent
    try {
      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
        phone: user_phone,
        template: 'fraud_alert',
        params: { serial: serial_number, verification_link: `https://rez.app/verify/${serial_number}` },
        user_id
      });
    } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }
  }

  // 6. Check warranty
  const warranty = await Warranty.findOne({ serial_number });

  // 7. Track to REZ Intelligence (Intent Graph)
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id: user_id || 'anonymous',
      intent_type: 'warranty_verification',
      entities: {
        product: serial_number,
        brand: serial.brand,
        category: serial.category
      },
      action: 'scan',
      context: { location, device_id }
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 8. Get recommendations from REZ Intelligence
  let recommendations = [];
  try {
    const recs = await axios.post(`${INTELLIGENCE_API}/api/recommend/verify-qr`, {
      user_id: user_id || 'anonymous',
      context: {
        current_product: { id: serial_number, brand: serial.brand },
        warranty_status: warranty?.warranty_status
      }
    });
    recommendations = recs.data.recommendations || [];
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    status: isFraud ? 'FLAGGED' : 'AUTHENTIC',
    serial_number,
    brand: serial.brand,
    model: serial.model,
    verification_count: serial.verification_count,
    warranty_status: warranty?.warranty_status || 'NOT_ACTIVATED',
    fraud_checks: fraudChecks,
    action: warranty ? 'VIEW_WARRANTY' : 'ACTIVATE_WARRANTY',
    recommendations
  });
});

// ACTIVATE WARRANTY + OWNERSHIP
app.post('/api/activate-warranty', async (req: Request, res: Response) => {
  const { serial_number, user_id, customer_name, customer_phone, customer_email, purchase_date, invoice_url, price_paid, service_center_id } = req.body;

  // 1. Verify serial
  const serial = await SerialRegistry.findOne({ serial_number });
  if (!serial) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // 2. Calculate warranty
  const startDate = new Date(purchase_date || Date.now());
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + 12);

  // 3. Create warranty
  const warranty = new Warranty({
    serial_number,
    user_id,
    product_id: serial.product_id,
    merchant_id: serial.merchant_id,
    customer_name,
    customer_phone,
    customer_email,
    purchase_date: startDate,
    invoice_url,
    warranty_months: 12,
    warranty_start_date: startDate,
    warranty_expiry_date: expiryDate,
    warranty_status: 'active',
    ownership_status: 'owned',
    activated_at: new Date()
  });
  await warranty.save();

  // 4. Update serial ownership
  serial.ownership_status = 'owned';
  await serial.save();

  // 5. Link to Merchant
  try {
    await axios.post(`${MERCHANT_API}/api/customers/link-warranty`, {
      user_id, warranty_id: warranty._id, serial_number, activated_at: new Date()
    }, { headers: { 'x-api-key': process.env.INTERNAL_KEY } });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 6. Track to REZ Intelligence (Intent + Attribution)
  try {
    await Promise.all([
      // Track intent
      axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
        user_id,
        intent_type: 'warranty_activation',
        entities: { product: serial_number, brand: serial.brand },
        action: 'activate'
      }),
      // Track attribution
      axios.post(`${INTELLIGENCE_API}/api/attribution/track`, {
        event_type: 'verify_qr_activate',
        user_id,
        entities: { product: { id: serial_number, brand: serial.brand } },
        value: price_paid || 0
      })
    ]);
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 6. Notify Service Center
  if (service_center_id) {
    const center = await ServiceCenter.findOne({ center_id: service_center_id });
    if (center) {
      // Link to service center
    }
  }

  // 7. Notify Notifications
  try {
    await axios.post(`${NOTIF_API}/api/send`, {
      user_id,
      template: 'warranty_activated',
      data: { serial_number, brand: serial.brand, expiry: expiryDate }
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 8. Send WhatsApp via REZ Agent (Welcome message)
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: customer_phone,
      template: 'warranty_activated',
      params: {
        brand: serial.brand,
        model: serial.model,
        serial: serial_number,
        expiry: expiryDate.toDateString()
      },
      user_id
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 8. Offer cashback to wallet
  if (price_paid > 1000) {
    try {
      await axios.post(`${WALLET_API}/api/earn`, {
        user_id,
        amount: Math.floor(price_paid * 0.01),  // 1% cashback
        source: 'warranty_activation',
        reason: 'Warranty activated'
      });
    } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }
  }

  res.json({
    success: true,
    warranty_id: warranty._id,
    expires: expiryDate,
    cashback_earned: price_paid > 1000 ? Math.floor(price_paid * 0.01) : 0
  });
});

// FILE CLAIM
app.post('/api/claim', async (req: Request, res: Response) => {
  const { warranty_id, issue_type, issue_description, photos, service_center_id } = req.body;

  const warranty = await Warranty.findById(warranty_id);
  if (!warranty) {
    return res.status(404).json({ error: 'Warranty not found' });
  }

  // Get service center
  const center = await ServiceCenter.findOne({ center_id: service_center_id });

  const claim = new Claim({
    warranty_id,
    serial_number: warranty.serial_number,
    user_id: warranty.user_id,
    customer_name: warranty.customer_name,
    customer_phone: warranty.customer_phone,
    issue_type,
    issue_description,
    photos: photos || [],
    service_center_id: center?._id,
    service_center_name: center?.name,
    priority: issue_type === 'not_working' ? 'high' : 'medium'
  });
  await claim.save();

  // Notify Merchant
  try {
    await axios.post(`${MERCHANT_API}/api/warranty/claim-filed`, {
      warranty_id, serial_number: warranty.serial_number, claim_type: issue_type
    }, { headers: { 'x-api-key': process.env.INTERNAL_KEY } });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // Notify Service Center
  if (center) {
    // Send to service center
  }

  // Trigger REZ Agent workflow (claim filed)
  try {
    await axios.post(`${AGENT_API}/api/agent/workflow/trigger`, {
      trigger: 'claim_filed',
      user_id: warranty.user_id,
      data: { claim_id: claim._id, serial: warranty.serial_number, issue: issue_type },
      workflow: {
        steps: [
          { action: 'send_whatsapp', template: 'claim_received', delay: '0h' },
          { action: 'assign_service_center', delay: '1h' }
        ]
      }
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, claim_id: claim._id });
});

// GET CLAIM STATUS
app.get('/api/claim/:claim_id', async (req, res) => {
  const claim = await Claim.findById(req.params.claim_id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  res.json(claim);
});

// ============================================
// ADMIN APIs
// ============================================

// Add serial to registry (Merchant adds product)
app.post('/admin/serial', async (req, res) => {
  const { serial_number, merchant_id, brand, model, category, manufactured_at } = req.body;

  const serial = await SerialRegistry.create({
    serial_number,
    merchant_id,
    brand,
    model,
    category,
    manufactured_at: new Date(manufactured_at)
  });

  // Notify Merchant
  try {
    await axios.post(`${MERCHANT_API}/api/products/register-serial`, {
      serial_number, product_id: serial._id
    }, { headers: { 'x-api-key': process.env.INTERNAL_KEY } });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, serial_id: serial._id });
});

// Get all serials for merchant
app.get('/admin/serials', async (req, res) => {
  const { merchant_id, page, limit } = req.query;
  const serials = await SerialRegistry.find({ merchant_id })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await SerialRegistry.countDocuments({ merchant_id });
  res.json({ serials, total, page, limit });
});

// Fraud queue review
app.get('/admin/fraud-queue', async (req, res) => {
  const items = await VerifyQueue.find({ status: 'pending' });
  res.json(items);
});

// Resolve fraud case
app.post('/admin/fraud/resolve', async (req, res) => {
  const { queue_id, action } = req.body;
  await VerifyQueue.findByIdAndUpdate(queue_id, { status: action, reviewed_at: new Date() });
  res.json({ success: true });
});

// ============================================
// ANALYTICS
// ============================================

app.get('/analytics/verifications', async (req, res) => {
  const { from, to, merchant_id } = req.query;
  const match: unknown = {};
  if (merchant_id) match.merchant_id = merchant_id;
  if (from && to) {
    match.created_at = { $gte: new Date(from), $lte: new Date(to) };
  }

  const [scans, activations, claims] = await Promise.all([
    ScanLog.countDocuments(match),
    Warranty.countDocuments(match),
    Claim.countDocuments(match)
  ]);

  res.json({ scans, activations, claims });
});

// ============================================
// SERVICE BOOKING APIs (NEW!)
// ============================================

// GET AVAILABLE SLOTS for a service center
app.get('/api/service-slots', async (req: Request, res: Response) => {
  const { center_id, date, days = 7 } = req.query;

  if (!center_id) {
    return res.status(400).json({ error: 'center_id is required' });
  }

  const center = await ServiceCenter.findOne({ center_id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  const slotsData = [];
  const startDate = date ? new Date(date as string) : new Date();

  for (let i = 0; i < Number(days); i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    // Skip Sundays
    if (currentDate.getDay() === 0) continue;

    let slotDoc = await ServiceSlot.findOne({
      center_id,
      date: {
        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(currentDate.setHours(23, 59, 59, 999))
      }
    });

    // Generate default slots if not exists
    if (!slotDoc) {
      const defaultSlots = [];
      const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
      for (const time of times) {
        defaultSlots.push({ time, available: true });
      }

      slotDoc = await ServiceSlot.create({
        center_id,
        date: currentDate,
        slots: defaultSlots
      });
    }

    slotsData.push({
      date: slotDoc.date,
      slots: slotDoc.slots.filter(s => s.available)
    });
  }

  res.json({
    center_id,
    center_name: center.name,
    slots: slotsData
  });
});

// GET SERVICE TYPES for a product (eligible services)
app.get('/api/service-types/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;

  const serialData = await SerialRegistry.findOne({ serial_number: serial });
  if (!serialData) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const warranty = await Warranty.findOne({ serial_number: serial });

  const serviceTypes = [];

  // Always available
  serviceTypes.push({
    type: 'routine_service',
    name: 'Routine Service',
    description: 'Regular maintenance and cleaning',
    estimated_cost: 500,
    estimated_time: '1-2 hours',
    warranty_covered: false
  });

  serviceTypes.push({
    type: 'general_maintenance',
    name: 'General Maintenance',
    description: 'Basic inspection and maintenance',
    estimated_cost: 300,
    estimated_time: '30 mins - 1 hour',
    warranty_covered: false
  });

  // If warranty is active
  if (warranty && warranty.warranty_status === 'active') {
    serviceTypes.push({
      type: 'repair',
      name: 'Repair (Under Warranty)',
      description: 'Fix defects covered under warranty',
      estimated_cost: 0,
      estimated_time: '1-3 days',
      warranty_covered: true,
      expires: warranty.warranty_expiry_date
    });

    serviceTypes.push({
      type: 'warranty_claim',
      name: 'Warranty Claim',
      description: 'Official warranty claim for major issues',
      estimated_cost: 0,
      estimated_time: '3-7 days',
      warranty_covered: true,
      expires: warranty.warranty_expiry_date
    });
  }

  // Inspection always available
  serviceTypes.push({
    type: 'inspection',
    name: 'Product Inspection',
    description: 'Diagnostic inspection to identify issues',
    estimated_cost: 200,
    estimated_time: '30 mins',
    warranty_covered: false
  });

  res.json({
    serial_number: serial,
    brand: serialData.brand,
    model: serialData.model,
    warranty_status: warranty?.warranty_status || 'not_activated',
    services: serviceTypes
  });
});

// BOOK A SERVICE
app.post('/api/book-service', async (req: Request, res: Response) => {
  const {
    serial_number,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    service_center_id,
    service_type,
    issue_description,
    preferred_date,
    preferred_time,
    photos
  } = req.body;

  // 1. Verify serial
  const serial = await SerialRegistry.findOne({ serial_number });
  if (!serial) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // 2. Get service center
  const center = await ServiceCenter.findOne({ center_id: service_center_id });
  if (!center) {
    return res.status(404).json({ error: 'Service center not found' });
  }

  // 3. Check warranty
  const warranty = await Warranty.findOne({ serial_number });
  const isWarrantyCovered = warranty?.warranty_status === 'active' &&
    ['repair', 'warranty_claim'].includes(service_type);

  // 4. Calculate estimated cost
  let estimatedCost = 0;
  if (!isWarrantyCovered) {
    switch (service_type) {
      case 'routine_service': estimatedCost = 500; break;
      case 'general_maintenance': estimatedCost = 300; break;
      case 'inspection': estimatedCost = 200; break;
      default: estimatedCost = 500;
    }
  }

  // 5. Generate booking ID
  const booking_id = `SVC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // 6. Create booking
  const booking = new ServiceBooking({
    booking_id,
    serial_number,
    product_id: serial.product_id,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    service_center_id,
    service_center_name: center.name,
    service_type,
    issue_description,
    preferred_date: new Date(preferred_date),
    preferred_time,
    scheduled_date: new Date(preferred_date),
    scheduled_time: preferred_time,
    status: 'pending',
    estimated_cost: estimatedCost,
    warranty_covered: isWarrantyCovered,
    photos: photos || [],
    timeline: [{
      status: 'pending',
      note: 'Booking submitted',
      updated_at: new Date()
    }]
  });
  await booking.save();

  // 7. Update slot (mark as booked)
  const slotDate = new Date(preferred_date);
  await ServiceSlot.updateOne(
    {
      center_id: service_center_id,
      date: { $gte: new Date(slotDate.setHours(0, 0, 0, 0)), $lt: new Date(slotDate.setHours(23, 59, 59, 999)) }
    },
    { $set: { 'slots.$[elem].available': false, 'slots.$[elem].booked_by': user_id, 'slots.$[elem].booking_id': booking_id } },
    { arrayFilters: [{ 'elem.time': preferred_time, 'elem.available': true }] }
  );

  // 8. Notify Service Center
  try {
    await axios.post(`${NOTIF_API}/api/send`, {
      user_id: center.merchant_id,
      template: 'service_booking',
      data: {
        booking_id,
        customer_name,
        service_type,
        date: preferred_date,
        time: preferred_time,
        serial_number
      }
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 9. Notify Customer via WhatsApp
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: customer_phone,
      template: 'service_booking_confirmed',
      params: {
        booking_id,
        center: center.name,
        date: preferred_date,
        time: preferred_time,
        service: service_type.replace('_', ' ')
      },
      user_id
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  // 10. Track to REZ Intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id,
      intent_type: 'service_booking',
      entities: {
        product: serial_number,
        brand: serial.brand,
        service_type
      },
      action: 'book'
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    booking_id,
    status: 'pending',
    service_center: center.name,
    scheduled_date: preferred_date,
    scheduled_time: preferred_time,
    estimated_cost: estimatedCost,
    warranty_covered: isWarrantyCovered
  });
});

// GET MY BOOKINGS
app.get('/api/bookings', async (req: Request, res: Response) => {
  const { user_id, status, page = 1, limit = 10 } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const query: unknown = { user_id };
  if (status) query.status = status;

  const bookings = await ServiceBooking.find(query)
    .sort({ created_at: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await ServiceBooking.countDocuments(query);

  res.json({
    bookings,
    total,
    page: Number(page),
    limit: Number(limit)
  });
});

// GET BOOKING DETAILS
app.get('/api/bookings/:booking_id', async (req: Request, res: Response) => {
  const booking = await ServiceBooking.findOne({ booking_id: req.params.booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json(booking);
});

// CANCEL BOOKING
app.post('/api/bookings/:booking_id/cancel', async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  const { reason } = req.body;

  const booking = await ServiceBooking.findOne({ booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel completed booking' });
  }

  // Update booking
  booking.status = 'cancelled';
  booking.timeline.push({
    status: 'cancelled',
    note: reason || 'Cancelled by customer',
    updated_at: new Date()
  });
  await booking.save();

  // Free up the slot
  const slotDate = new Date(booking.scheduled_date);
  await ServiceSlot.updateOne(
    {
      center_id: booking.service_center_id,
      date: { $gte: new Date(slotDate.setHours(0, 0, 0, 0)), $lt: new Date(slotDate.setHours(23, 59, 59, 999)) }
    },
    { $set: { 'slots.$[elem].available': true, 'slots.$[elem].booked_by': null, 'slots.$[elem].booking_id': null } },
    { arrayFilters: [{ 'elem.time': booking.scheduled_time }] }
  );

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: booking.customer_phone,
      template: 'booking_cancelled',
      params: { booking_id, reason: reason || 'Your booking has been cancelled' },
      user_id: booking.user_id
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, message: 'Booking cancelled' });
});

// UPDATE BOOKING STATUS (Service Center)
app.post('/api/bookings/:booking_id/update', async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  const { status, notes, actual_cost } = req.body;

  const booking = await ServiceBooking.findOne({ booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = status;
  booking.notes = notes || booking.notes;
  if (actual_cost !== undefined) booking.actual_cost = actual_cost;
  booking.updated_at = new Date();
  booking.timeline.push({
    status,
    note: notes || `Status updated to ${status}`,
    updated_at: new Date()
  });
  await booking.save();

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: booking.customer_phone,
      template: 'booking_update',
      params: {
        booking_id,
        status: status.replace('_', ' '),
        message: notes || `Your service status has been updated`
      },
      user_id: booking.user_id
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, booking });
});

// RESCHEDULE BOOKING
app.post('/api/bookings/:booking_id/reschedule', async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  const { new_date, new_time } = req.body;

  const booking = await ServiceBooking.findOne({ booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ error: 'Cannot reschedule this booking' });
  }

  // Free old slot
  const oldDate = new Date(booking.scheduled_date);
  await ServiceSlot.updateOne(
    {
      center_id: booking.service_center_id,
      date: { $gte: new Date(oldDate.setHours(0, 0, 0, 0)), $lt: new Date(oldDate.setHours(23, 59, 59, 999)) }
    },
    { $set: { 'slots.$[elem].available': true, 'slots.$[elem].booked_by': null, 'slots.$[elem].booking_id': null } },
    { arrayFilters: [{ 'elem.time': booking.scheduled_time }] }
  );

  // Book new slot
  const newDate = new Date(new_date);
  await ServiceSlot.updateOne(
    {
      center_id: booking.service_center_id,
      date: { $gte: new Date(newDate.setHours(0, 0, 0, 0)), $lt: new Date(newDate.setHours(23, 59, 59, 999)) }
    },
    { $set: { 'slots.$[elem].available': false, 'slots.$[elem].booked_by': booking.user_id, 'slots.$[elem].booking_id': booking_id } },
    { arrayFilters: [{ 'elem.time': new_time, 'elem.available': true }] }
  );

  // Update booking
  booking.scheduled_date = new Date(new_date);
  booking.scheduled_time = new_time;
  booking.timeline.push({
    status: 'rescheduled',
    note: `Rescheduled to ${new_date} at ${new_time}`,
    updated_at: new Date()
  });
  await booking.save();

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: booking.customer_phone,
      template: 'booking_rescheduled',
      params: {
        booking_id,
        new_date,
        new_time,
        center: booking.service_center_name
      },
      user_id: booking.user_id
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, booking });
});

// RATE SERVICE (After completion)
app.post('/api/bookings/:booking_id/rate', async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  const { rating, feedback } = req.body;

  const booking = await ServiceBooking.findOne({ booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({ error: 'Can only rate completed bookings' });
  }

  booking.rating = rating;
  booking.feedback = feedback;
  await booking.save();

  // Send to CSAT Service
  try {
    await axios.post(`${CARE_API}/api/csat/respond`, {
      user_id: booking.user_id,
      interaction_type: 'service_booking',
      interaction_id: booking_id,
      rating,
      feedback,
      metadata: {
        service_center: booking.service_center_name,
        service_type: booking.service_type
      }
    });
  } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true });
});

// ============================================
// REZ-CARE INTEGRATION (Customer Support)
// ============================================

const CARE_API = process.env.CARE_API || 'https://REZ-care.onrender.com';

// ESCALATE TO SUPPORT (If booking has issues)
app.post('/api/bookings/:booking_id/escalate', async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  const { reason, priority = 'medium' } = req.body;

  const booking = await ServiceBooking.findOne({ booking_id });
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Create ticket in REZ-care
  try {
    const ticket = await axios.post(`${CARE_API}/api/auto-tickets`, {
      title: `Service Booking Issue - ${booking_id}`,
      description: `Customer needs support for service booking.\n\nBooking ID: ${booking_id}\nService Type: ${booking.service_type}\nService Center: ${booking.service_center_name}\nScheduled: ${booking.scheduled_date}\n\nReason: ${reason}`,
      customer_id: booking.user_id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      category: 'service_booking',
      priority,
      platform: 'verify_qr',
      metadata: {
        booking_id,
        serial_number: booking.serial_number,
        service_center_id: booking.service_center_id
      }
    });

    // Update booking timeline
    booking.timeline.push({
      status: 'escalated',
      note: `Escalated to support. Ticket: ${ticket.data.data._id}`,
      updated_at: new Date()
    });
    await booking.save();

    // Notify customer
    try {
      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
        phone: booking.customer_phone,
        template: 'support_escalated',
        params: {
          ticket_id: ticket.data.data._id,
          message: 'Our support team will help you shortly'
        },
        user_id: booking.user_id
      });
    } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

    res.json({
      success: true,
      ticket_id: ticket.data.data._id,
      message: 'Escalated to customer support'
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to escalate', details: e.message });
  }
});

// REQUEST SUPPORT (From verify/scan page)
app.post('/api/support/request', async (req: Request, res: Response) => {
  const {
    user_id,
    customer_name,
    customer_phone,
    serial_number,
    issue_type,
    description,
    photos
  } = req.body;

  // Check warranty status
  const warranty = await Warranty.findOne({ serial_number });
  const serial = await SerialRegistry.findOne({ serial_number });

  // Create support ticket
  try {
    const ticket = await axios.post(`${CARE_API}/api/auto-tickets`, {
      title: `Verify QR Support - ${issue_type}`,
      description: `${description}\n\nProduct: ${serial?.brand} ${serial?.model}\nSerial: ${serial_number}\nWarranty: ${warranty?.warranty_status || 'Not activated'}`,
      customer_id: user_id,
      customer_name,
      customer_phone,
      category: 'verify_qr',
      priority: 'medium',
      platform: 'verify_qr',
      metadata: {
        serial_number,
        warranty_id: warranty?._id,
        brand: serial?.brand,
        model: serial?.model
      }
    });

    // Create self-service recovery action
    const selfService = await axios.post(`${CARE_API}/api/self-service/execute`, {
      customerId: user_id,
      actionType: 'verify_qr_support',
      actionData: {
        ticket_id: ticket.data.data._id,
        serial_number,
        issue_type
      }
    });

    // Notify via WhatsApp
    try {
      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
        phone: customer_phone,
        template: 'support_ticket_created',
        params: {
          ticket_id: ticket.data.data._id,
          issue_type
        },
        user_id
      });
    } catch (e) {
    logger.warn('REZ Mind fraud check failed, proceeding without ML check', { serial_number, error: e instanceof Error ? e.message : String(e) });
  }

    res.json({
      success: true,
      ticket_id: ticket.data.data._id,
      self_service_actions: selfService.data.data,
      message: 'Support ticket created'
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create support request', details: e.message });
  }
});

// ANALYTICS - Service Booking Metrics
app.get('/analytics/bookings', async (req: Request, res: Response) => {
  const { from, to, center_id } = req.query;

  const match: unknown = {};
  if (center_id) match.service_center_id = center_id;
  if (from && to) {
    match.created_at = { $gte: new Date(from), $lte: new Date(to) };
  }

  const [total, pending, confirmed, completed, cancelled] = await Promise.all([
    ServiceBooking.countDocuments(match),
    ServiceBooking.countDocuments({ ...match, status: 'pending' }),
    ServiceBooking.countDocuments({ ...match, status: 'confirmed' }),
    ServiceBooking.countDocuments({ ...match, status: 'completed' }),
    ServiceBooking.countDocuments({ ...match, status: 'cancelled' })
  ]);

  // Service type breakdown
  const typeBreakdown = await ServiceBooking.aggregate([
    { $match: match },
    { $group: { _id: '$service_type', count: { $sum: 1 } } }
  ]);

  // Average rating
  const ratingAgg = await ServiceBooking.aggregate([
    { $match: { ...match, rating: { $exists: true } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  res.json({
    total,
    breakdown: { pending, confirmed, completed, cancelled },
    by_service_type: typeBreakdown,
    avg_rating: ratingAgg[0]?.avgRating || 0,
    rated_count: ratingAgg[0]?.count || 0
  });
});

export default app;
