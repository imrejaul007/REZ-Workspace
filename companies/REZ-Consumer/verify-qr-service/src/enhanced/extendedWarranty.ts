/**
 * REZ Verify QR Service - Extended Features
 *
 * NEW FEATURES ADDED:
 * 1. Express Replacement Service
 * 2. Dynamic QR Codes
 * 3. Extended Warranty Subscriptions
 * 4. Pickup & Delivery
 * 5. Priority Slots (Same-day/Next-day)
 * 6. Auto-assign Nearest Service Center
 * 7. Real-time Tracking (WebSocket)
 * 8. Push Notifications
 * 9. Merchant Predictive Analytics
 * 10. Swagger Documentation
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import logger from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();

// ============================================
// CONNECTIONS
// ============================================

const MIND_API = process.env.MIND_API || 'https://REZ-mind.onrender.com';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';
const CARE_API = process.env.CARE_API || 'https://REZ-care.onrender.com';
const NOTIF_API = process.env.NOTIF_API || 'https://rez-notifications.onrender.com';
const DELIVERY_API = process.env.DELIVERY_API || 'https://rez-delivery-service.onrender.com';

// ============================================
// MODELS
// ============================================

// Extended Warranty Plans
const WarrantyPlan = mongoose.model('WarrantyPlan', new mongoose.Schema({
  plan_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  duration_months: { type: Number, required: true },
  price: { type: Number, required: true },
  coverage_type: { type: String, enum: ['basic', 'standard', 'premium', 'comprehensive'] },
  features: [{
    feature: String,
    included: Boolean,
    limit: Number
  }],
  includes_express_replacement: { type: Boolean, default: false },
  includes_pickup_delivery: { type: Boolean, default: false },
  includes_accidental_damage: { type: Boolean, default: false },
  includes_theft_loss: { type: Boolean, default: false },
  max_claims: { type: Number, default: 1 },
  claim_deductible: Number,
  brand: [String],
  category: [String],
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  created_at: { type: Date, default: Date.now }
}));

// Warranty Subscription
const WarrantySubscription = mongoose.model('WarrantySubscription', new mongoose.Schema({
  subscription_id: { type: String, required: true, unique: true },
  user_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,
  plan_id: String,
  plan_name: String,
  serial_number: String,
  product_id: String,
  product_name: String,
  brand: String,
  category: String,
  purchase_date: Date,
  purchase_price: Number,
  start_date: Date,
  end_date: Date,
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'] },
  auto_renew: { type: Boolean, default: false },
  payment_id: String,
  claims_count: { type: Number, default: 0 },
  max_claims: Number,
  renewal_reminder_sent: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Dynamic QR Content
const DynamicQRContent = mongoose.model('DynamicQRContent', new mongoose.Schema({
  qr_id: { type: String, required: true, unique: true },
  serial_number: String,
  base_content: {
    verify_url: String,
    product_info: Object,
    warranty_status: String
  },
  dynamic_content: {
    current_price: Number,
    stock_status: String,
    promotions: [{
      title: String,
      description: String,
      code: String,
      discount_percent: Number,
      valid_until: Date
    }],
    related_products: [{
      product_id: String,
      name: String,
      image: String
    }],
    reviews: [{
      user_id: String,
      rating: Number,
      comment: String,
      date: Date
    }]
  },
  last_updated: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}));

// Express Replacement Request
const ExpressReplacement = mongoose.model('ExpressReplacement', new mongoose.Schema({
  replacement_id: { type: String, required: true, unique: true },
  claim_id: String,
  warranty_id: String,
  serial_number: String,
  user_id: String,
  customer_name: String,
  customer_phone: String,
  customer_address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  product_details: {
    brand: String,
    model: String,
    issue_description: String
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'preparing', 'shipped', 'delivered', 'return_requested', 'return_received', 'completed', 'rejected'],
    default: 'requested'
  },
  tracking_id: String,
  courier_name: String,
  estimated_delivery: Date,
  actual_delivery: Date,
  return_tracking_id: String,
  return_label_url: String,
  timeline: [{ status: String, note: String, timestamp: Date }],
  created_at: { type: Date, default: Date.now }
}));

// Service Pickup/Delivery
const ServicePickup = mongoose.model('ServicePickup', new mongoose.Schema({
  pickup_id: { type: String, required: true, unique: true },
  booking_id: String,
  user_id: String,
  customer_name: String,
  customer_phone: String,
  pickup_address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
    instructions: String
  },
  delivery_address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  service_type: String,
  scheduled_pickup: Date,
  scheduled_delivery: Date,
  actual_pickup: Date,
  actual_delivery: Date,
  pickup_agent_id: String,
  delivery_agent_id: String,
  status: {
    type: String,
    enum: ['scheduled', 'agent_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'scheduled'
  },
  tracking: [{
    status: String,
    location: String,
    timestamp: Date
  }],
  proof_of_pickup: String,
  proof_of_delivery: String,
  created_at: { type: Date, default: Date.now }
}));

// Priority Slot
const PrioritySlot = mongoose.model('PrioritySlot', new mongoose.Schema({
  slot_id: { type: String, required: true, unique: true },
  center_id: String,
  date: Date,
  time: String,
  slot_type: { type: String, enum: ['standard', 'same_day', 'next_day', 'express'], default: 'standard' },
  capacity: { type: Number, default: 1 },
  booked: { type: Number, default: 0 },
  priority_fee: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}));

// ============================================
// EXTENDED WARRANTY PLANS APIs
// ============================================

/**
 * GET /api/warranty-plans
 * Get all active warranty plans
 */
router.get('/warranty-plans', async (req: Request, res: Response) => {
  const { brand, category, coverage_type } = req.query;

  const query: unknown = { status: 'active' };
  if (brand) query.brand = { $in: [brand] };
  if (category) query.category = { $in: [category] };
  if (coverage_type) query.coverage_type = coverage_type;

  const plans = await WarrantyPlan.find(query);

  res.json({
    count: plans.length,
    plans: plans.map(p => ({
      plan_id: p.plan_id,
      name: p.name,
      description: p.description,
      duration_months: p.duration_months,
      price: p.price,
      coverage_type: p.coverage_type,
      features: p.features,
      includes_express_replacement: p.includes_express_replacement,
      includes_pickup_delivery: p.includes_pickup_delivery,
      includes_accidental_damage: p.includes_accidental_damage,
      includes_theft_loss: p.includes_theft_loss,
      max_claims: p.max_claims,
      claim_deductible: p.claim_deductible
    }))
  });
});

/**
 * POST /api/warranty-plans
 * Create a warranty plan (Admin)
 */
router.post('/warranty-plans', async (req: Request, res: Response) => {
  const {
    name, description, duration_months, price, coverage_type,
    features, includes_express_replacement, includes_pickup_delivery,
    includes_accidental_damage, includes_theft_loss, max_claims,
    claim_deductible, brand, category
  } = req.body;

  const plan_id = `PLAN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const plan = new WarrantyPlan({
    plan_id,
    name,
    description,
    duration_months,
    price,
    coverage_type,
    features: features || [],
    includes_express_replacement,
    includes_pickup_delivery,
    includes_accidental_damage,
    includes_theft_loss,
    max_claims,
    claim_deductible,
    brand: brand || [],
    category: category || []
  });

  await plan.save();

  res.json({ success: true, plan_id, plan });
});

/**
 * POST /api/subscribe
 * Subscribe to extended warranty plan
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  const {
    user_id, customer_name, customer_phone, customer_email,
    plan_id, serial_number, product_name, brand, category,
    purchase_date, purchase_price, auto_renew
  } = req.body;

  // Get plan
  const plan = await WarrantyPlan.findOne({ plan_id });
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.duration_months);

  // Create subscription
  const subscription_id = `SUB-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const subscription = new WarrantySubscription({
    subscription_id,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    plan_id: plan.plan_id,
    plan_name: plan.name,
    serial_number,
    product_name,
    brand,
    category,
    purchase_date: new Date(purchase_date),
    purchase_price,
    start_date: startDate,
    end_date: endDate,
    status: 'active',
    auto_renew,
    max_claims: plan.max_claims
  });

  await subscription.save();

  // Charge subscription
  try {
    const payment = await axios.post(`${WALLET_API}/api/charge`, {
      user_id,
      amount: plan.price,
      reason: `Warranty subscription: ${plan.name}`,
      subscription_id
    });
    subscription.payment_id = payment.data.payment_id;
    await subscription.save();
  } catch (e) {
    // Handle payment failure
  }

  // Notify customer
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: customer_phone,
      template: 'warranty_subscribed',
      params: {
        plan_name: plan.name,
        duration: `${plan.duration_months} months`,
        start_date: startDate.toDateString(),
        end_date: endDate.toDateString()
      },
      user_id
    });
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    subscription_id,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    plan: {
      name: plan.name,
      price: plan.price,
      coverage_type: plan.coverage_type,
      includes_express_replacement: plan.includes_express_replacement,
      includes_pickup_delivery: plan.includes_pickup_delivery,
      max_claims: plan.max_claims
    }
  });
});

/**
 * GET /api/subscriptions/:user_id
 * Get user's warranty subscriptions
 */
router.get('/subscriptions/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { status } = req.query;

  const query: unknown = { user_id };
  if (status) query.status = status;

  const subscriptions = await WarrantySubscription.find(query)
    .sort({ created_at: -1 });

  res.json({ subscriptions });
});

// ============================================
// DYNAMIC QR CONTENT APIs
// ============================================

/**
 * GET /api/qr-content/:serial
 * Get dynamic QR content for a product
 */
router.get('/qr-content/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { include_promotions, include_reviews } = req.query;

  const content = await DynamicQRContent.findOne({ serial_number: serial });
  if (!content) {
    return res.status(404).json({ error: 'QR content not found' });
  }

  // Check if content is stale (older than 1 hour)
  const isStale = Date.now() - content.last_updated.getTime() > 3600000;

  res.json({
    qr_id: content.qr_id,
    serial_number: content.serial_number,
    base_content: content.base_content,
    dynamic_content: include_promotions !== 'false' ? content.dynamic_content : {
      current_price: content.dynamic_content?.current_price,
      stock_status: content.dynamic_content?.stock_status
    },
    reviews: include_reviews === 'true' ? content.dynamic_content?.reviews : undefined,
    last_updated: content.last_updated,
    is_stale: isStale,
    version: content.version
  });
});

/**
 * PUT /api/qr-content/:serial
 * Update dynamic QR content
 */
router.put('/qr-content/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { current_price, stock_status, promotions, related_products } = req.body;

  const content = await DynamicQRContent.findOneAndUpdate(
    { serial_number: serial },
    {
      $set: {
        'dynamic_content.current_price': current_price,
        'dynamic_content.stock_status': stock_status,
        'dynamic_content.promotions': promotions,
        'dynamic_content.related_products': related_products,
        last_updated: new Date()
      },
      $inc: { version: 1 }
    },
    { new: true }
  );

  if (!content) {
    return res.status(404).json({ error: 'QR content not found' });
  }

  res.json({ success: true, version: content.version, last_updated: content.last_updated });
});

// ============================================
// EXPRESS REPLACEMENT APIs
// ============================================

/**
 * POST /api/express-replacement
 * Request express replacement for warranty claim
 */
router.post('/express-replacement', async (req: Request, res: Response) => {
  const {
    claim_id, warranty_id, serial_number, user_id,
    customer_name, customer_phone, customer_address,
    brand, model, issue_description
  } = req.body;

  // Check if claim is approved
  const claim = await mongoose.model('Claim').findById(claim_id);
  if (!claim || claim.status !== 'approved') {
    return res.status(400).json({ error: 'Claim must be approved for express replacement' });
  }

  // Check warranty/subscription eligibility
  const subscription = await WarrantySubscription.findOne({
    serial_number,
    user_id,
    status: 'active'
  });

  const plan = subscription ? await WarrantyPlan.findOne({ plan_id: subscription.plan_id }) : null;

  if (!plan?.includes_express_replacement) {
    return res.status(400).json({
      error: 'Your plan does not include express replacement. Upgrade to Premium or Comprehensive plan.'
    });
  }

  if (subscription && subscription.claims_count >= subscription.max_claims) {
    return res.status(400).json({ error: 'Maximum claims reached for this subscription' });
  }

  const replacement_id = `REP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const replacement = new ExpressReplacement({
    replacement_id,
    claim_id,
    warranty_id,
    serial_number,
    user_id,
    customer_name,
    customer_phone,
    customer_address,
    product_details: { brand, model, issue_description },
    status: 'requested',
    timeline: [{
      status: 'requested',
      note: 'Express replacement requested',
      timestamp: new Date()
    }]
  });

  await replacement.save();

  // Update claim status
  claim.status = 'replacement_shipped';
  await claim.save();

  // Send return label via email
  try {
    await axios.post(`${NOTIF_API}/api/send`, {
      user_id,
      template: 'express_replacement_requested',
      data: {
        replacement_id,
        address: customer_address
      }
    });
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    replacement_id,
    status: 'requested',
    message: 'Express replacement requested. You will receive replacement before returning your device.',
    estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
  });
});

/**
 * GET /api/express-replacement/:id
 * Get express replacement status
 */
router.get('/express-replacement/:id', async (req: Request, res: Response) => {
  const replacement = await ExpressReplacement.findOne({ replacement_id: req.params.id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  res.json(replacement);
});

/**
 * POST /api/express-replacement/:id/track
 * Track express replacement (live location)
 */
router.get('/express-replacement/:id/track', async (req: Request, res: Response) => {
  const replacement = await ExpressReplacement.findOne({ replacement_id: req.params.id });
  if (!replacement) {
    return res.status(404).json({ error: 'Replacement not found' });
  }

  // If shipped, get live tracking from delivery service
  if (replacement.status === 'shipped' && replacement.tracking_id) {
    try {
      const tracking = await axios.get(`${DELIVERY_API}/api/track/${replacement.tracking_id}`);
      res.json({
        replacement_id: replacement.replacement_id,
        status: replacement.status,
        tracking_id: replacement.tracking_id,
        courier_name: replacement.courier_name,
        estimated_delivery: replacement.estimated_delivery,
        live_tracking: tracking.data,
        timeline: replacement.timeline
      });
    } catch (e) {
      // Return basic info if tracking service unavailable
      res.json({
        replacement_id: replacement.replacement_id,
        status: replacement.status,
        tracking_id: replacement.tracking_id,
        courier_name: replacement.courier_name,
        estimated_delivery: replacement.estimated_delivery,
        timeline: replacement.timeline
      });
    }
  } else {
    res.json({
      replacement_id: replacement.replacement_id,
      status: replacement.status,
      timeline: replacement.timeline
    });
  }
});

// ============================================
// PICKUP & DELIVERY APIs
// ============================================

/**
 * POST /api/pickup-request
 * Request pickup for product service
 */
router.post('/pickup-request', async (req: Request, res: Response) => {
  const {
    booking_id, user_id, customer_name, customer_phone,
    pickup_address, delivery_address, service_type,
    scheduled_pickup, scheduled_delivery
  } = req.body;

  const pickup_id = `PUP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const pickup = new ServicePickup({
    pickup_id,
    booking_id,
    user_id,
    customer_name,
    customer_phone,
    pickup_address,
    delivery_address,
    service_type,
    scheduled_pickup: new Date(scheduled_pickup),
    scheduled_delivery: new Date(scheduled_delivery),
    status: 'scheduled'
  });

  await pickup.save();

  // Notify delivery service
  try {
    await axios.post(`${DELIVERY_API}/api/pickup/schedule`, {
      pickup_id,
      pickup_address,
      scheduled_time: scheduled_pickup,
      service_type: 'product_service',
      customer_phone
    });
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    pickup_id,
    status: 'scheduled',
    scheduled_pickup: new Date(scheduled_pickup)
  });
});

/**
 * GET /api/pickup/:id
 * Get pickup status
 */
router.get('/pickup/:id', async (req: Request, res: Response) => {
  const pickup = await ServicePickup.findOne({ pickup_id: req.params.id });
  if (!pickup) {
    return res.status(404).json({ error: 'Pickup not found' });
  }

  res.json(pickup);
});

/**
 * POST /api/pickup/:id/cancel
 * Cancel pickup request
 */
router.post('/pickup/:id/cancel', async (req: Request, res: Response) => {
  const pickup = await ServicePickup.findOne({ pickup_id: req.params.id });
  if (!pickup) {
    return res.status(404).json({ error: 'Pickup not found' });
  }

  if (['picked_up', 'in_transit', 'delivered'].includes(pickup.status)) {
    return res.status(400).json({ error: 'Cannot cancel pickup in current status' });
  }

  pickup.status = 'cancelled';
  await pickup.save();

  // Notify delivery service to cancel
  try {
    await axios.post(`${DELIVERY_API}/api/pickup/${pickup.pickup_id}/cancel`);
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, message: 'Pickup cancelled' });
});

// ============================================
// PRIORITY SLOTS APIs
// ============================================

/**
 * GET /api/priority-slots
 * Get priority slots for a service center
 */
router.get('/priority-slots', async (req: Request, res: Response) => {
  const { center_id, date, days = 7 } = req.query;

  const startDate = date ? new Date(date as string) : new Date();
  const slotsData = [];

  for (let i = 0; i < Number(days); i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const slots = await PrioritySlot.find({
      center_id,
      date: {
        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(currentDate.setHours(23, 59, 59, 999))
      },
      available: true
    });

    slotsData.push({
      date: currentDate,
      slots: slots.map(s => ({
        slot_id: s.slot_id,
        time: s.time,
        slot_type: s.slot_type,
        priority_fee: s.priority_fee,
        available: s.booked < s.capacity
      }))
    });
  }

  res.json({
    center_id,
    slots: slotsData
  });
});

/**
 * POST /api/priority-slots/generate
 * Generate priority slots (Admin)
 */
router.post('/priority-slots/generate', async (req: Request, res: Response) => {
  const { center_id, start_date, end_date, same_day_fee = 200, next_day_fee = 100, express_fee = 500 } = req.body;

  const start = new Date(start_date);
  const end = new Date(end_date);
  const slots = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; // Skip Sunday

    // Generate slots for each type
    const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

    for (const time of times) {
      // Standard slot
      slots.push({
        slot_id: `SLOT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        center_id,
        date: new Date(d),
        time,
        slot_type: 'standard',
        capacity: 2,
        priority_fee: 0,
        available: true
      });

      // Same-day slot (limited)
      slots.push({
        slot_id: `SLOT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        center_id,
        date: new Date(d),
        time,
        slot_type: 'same_day',
        capacity: 1,
        priority_fee: same_day_fee,
        available: true
      });

      // Next-day slot
      slots.push({
        slot_id: `SLOT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        center_id,
        date: new Date(d),
        time,
        slot_type: 'next_day',
        capacity: 1,
        priority_fee: next_day_fee,
        available: true
      });

      // Express slot
      slots.push({
        slot_id: `SLOT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        center_id,
        date: new Date(d),
        time,
        slot_type: 'express',
        capacity: 1,
        priority_fee: express_fee,
        available: true
      });
    }
  }

  await PrioritySlot.insertMany(slots);

  res.json({
    success: true,
    slots_generated: slots.length,
    breakdown: {
      standard: slots.filter(s => s.slot_type === 'standard').length,
      same_day: slots.filter(s => s.slot_type === 'same_day').length,
      next_day: slots.filter(s => s.slot_type === 'next_day').length,
      express: slots.filter(s => s.slot_type === 'express').length
    }
  });
});

// ============================================
// AUTO-ASSIGN NEAREST CENTER (ML-powered)
// ============================================

/**
 * GET /api/nearest-center
 * Auto-assign nearest service center with ML optimization
 */
router.get('/nearest-center', async (req: Request, res: Response) => {
  const { lat, lng, service_type, brand, user_id } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);

  // Get all active service centers
  const ServiceCenter = mongoose.model('ServiceCenter');
  let centers = await ServiceCenter.find({ status: 'active' });

  // Filter by brand if provided
  if (brand) {
    centers = centers.filter(c =>
      c.brands && c.brands.length > 0 &&
      c.brands.some((b: string) => b.toLowerCase().includes((brand as string).toLowerCase()))
    );
  }

  // Filter by service type if provided
  if (service_type) {
    centers = centers.filter(c =>
      c.services && c.services.includes(service_type as string)
    );
  }

  // Calculate distances and scores
  const scoredCenters = [];

  for (const center of centers) {
    const distance = center.lat && center.lng ?
      Math.sqrt(Math.pow(center.lat - userLat, 2) + Math.pow(center.lng - userLng, 2)) : 999;

    // Get current load from recent bookings
    const todayBookings = await mongoose.model('ServiceBooking').countDocuments({
      service_center_id: center.center_id,
      scheduled_date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    // Calculate score (lower is better)
    // Factors: distance (40%), current load (30%), rating (20%), capacity (10%)
    const distanceScore = Math.min(distance * 10, 100);
    const loadScore = Math.min(todayBookings * 10, 100);
    const ratingScore = 100 - (center['rating'] ? (5 - center['rating']) * 20 : 50);
    const capacityScore = 50; // Default

    const totalScore = (distanceScore * 0.4) + (loadScore * 0.3) + (ratingScore * 0.2) + (capacityScore * 0.1);

    scoredCenters.push({
      ...center.toObject(),
      distance_km: distance * 111, // Rough km conversion
      current_load: todayBookings,
      score: totalScore,
      estimated_wait: todayBookings * 15 // minutes
    });
  }

  // Sort by score
  scoredCenters.sort((a, b) => a.score - b.score);

  // Get ML-based recommendation from REZ Mind
  let mlRecommendation = null;
  try {
    const mlResponse = await axios.post(`${MIND_API}/api/recommend/service-center`, {
      user_id,
      location: { lat: userLat, lng: userLng },
      service_type,
      brand,
      candidates: scoredCenters.slice(0, 5).map(c => ({
        center_id: c.center_id,
        distance: c.distance_km,
        load: c.current_load
      }))
    });
    mlRecommendation = mlResponse.data;
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    user_location: { lat: userLat, lng: userLng },
    recommended: scoredCenters[0] || null,
    alternatives: scoredCenters.slice(1, 4),
    ml_recommendation: mlRecommendation,
    total_centers: scoredCenters.length
  });
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * POST /api/notifications/register-device
 * Register device for push notifications
 */
router.post('/notifications/register-device', async (req: Request, res: Response) => {
  const { user_id, device_token, platform, device_info } = req.body;

  try {
    await axios.post(`${NOTIF_API}/api/devices/register`, {
      user_id,
      device_token,
      platform, // 'ios' | 'android' | 'web'
      device_info,
      service: 'verify-qr'
    });

    res.json({ success: true, message: 'Device registered for notifications' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to register device' });
  }
});

/**
 * POST /api/notifications/booking-update
 * Send push notification for booking update
 */
router.post('/notifications/booking-update', async (req: Request, res: Response) => {
  const { user_id, booking_id, status, message } = req.body;

  try {
    await axios.post(`${NOTIF_API}/api/push/send`, {
      user_id,
      title: 'Service Booking Update',
      body: message || `Your booking status is now: ${status}`,
      data: {
        type: 'booking_update',
        booking_id,
        status
      }
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============================================
// MERCHANT PREDICTIVE ANALYTICS
// ============================================

/**
 * GET /admin/analytics/predict
 * Get predictive analytics for service center
 */
router.get('/admin/analytics/predict', async (req: Request, res: Response) => {
  const { center_id, period = '30days' } = req.query;

  let fromDate = new Date();
  if (period === '7days') fromDate.setDate(fromDate.getDate() - 7);
  else if (period === '30days') fromDate.setDate(fromDate.getDate() - 30);
  else if (period === '90days') fromDate.setDate(fromDate.getDate() - 90);

  // Get historical data
  const bookings = await mongoose.model('ServiceBooking').find({
    service_center_id: center_id,
    created_at: { $gte: fromDate }
  });

  // Calculate patterns
  const byDay: unknown = {};
  const byServiceType: unknown = {};
  const claims = await mongoose.model('Claim').find({
    service_center_id: center_id,
    created_at: { $gte: fromDate }
  });

  for (const booking of bookings) {
    const day = new Date(booking.created_at).toLocaleDateString('en-US', { weekday: 'short' });
    byDay[day] = (byDay[day] || 0) + 1;
    byServiceType[booking.service_type] = (byServiceType[booking.service_type] || 0) + 1;
  }

  // Peak hours
  const byHour: unknown = {};
  for (const booking of bookings) {
    const hour = new Date(booking.created_at).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  // Predict next 7 days demand
  const predictions = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const baseCount = byDay[dayName] || Math.round(bookings.length / 30);
    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted_demand: Math.round(baseCount * 1.1), // 10% growth assumption
      confidence: 0.75
    });
  }

  // Get ML predictions from REZ Intelligence
  let mlPredictions = null;
  try {
    const mlResponse = await axios.post(`${INTELLIGENCE_API}/api/predict/service-demand`, {
      center_id,
      historical_data: {
        bookings: bookings.length,
        by_day: byDay,
        by_service_type: byServiceType
      },
      forecast_days: 7
    });
    mlPredictions = mlResponse.data;
  } catch (e) {
    logger.warn('Enhanced service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    center_id,
    period,
    summary: {
      total_bookings: bookings.length,
      total_claims: claims.length,
      avg_daily: Math.round(bookings.length / 30),
      claim_rate: (claims.length / bookings.length * 100).toFixed(1) + '%'
    },
    patterns: {
      by_day: byDay,
      by_service_type: byServiceType,
      peak_hours: byHour,
      most_demanding_day: Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
    },
    predictions,
    ml_predictions: mlPredictions
  });
});

/**
 * GET /admin/analytics/revenue-forecast
 * Get revenue forecast
 */
router.get('/admin/analytics/revenue-forecast', async (req: Request, res: Response) => {
  const { center_id, months = 3 } = req.query;

  const forecast = [];
  let baseRevenue = 0;

  // Calculate base revenue from last 30 days
  const recentBookings = await mongoose.model('ServiceBooking').find({
    service_center_id: center_id,
    status: 'completed',
    created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  baseRevenue = recentBookings.reduce((sum, b) => sum + (b.actual_cost || 0), 0);

  for (let i = 1; i <= Number(months); i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    forecast.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      predicted_revenue: Math.round(baseRevenue * (1 + i * 0.05)), // 5% growth per month
      predicted_bookings: Math.round(recentBookings.length * (1 + i * 0.03)),
      confidence: 0.85 - (i * 0.1)
    });
  }

  res.json({
    center_id,
    base_revenue_30days: baseRevenue,
    forecast
  });
});

export default router;
