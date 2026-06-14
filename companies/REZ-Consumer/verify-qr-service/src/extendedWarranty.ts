/**
 * REZ Verify QR - Extended Warranty & Subscription Service
 * Premium warranty plans, subscriptions, and insurance layer
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import logger from './utils/logger';

const router = express.Router();

// External APIs
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';
const NOTIF_API = process.env.NOTIF_API || 'https://rez-notifications.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';

// ============================================
// MODELS
// ============================================

// Extended Warranty Plan
const WarrantyPlan = mongoose.model('WarrantyPlan', new mongoose.Schema({
  plan_id: { type: String, required: true, unique: true },
  brand_id: String,

  // Plan details
  name: String,
  description: String,
  tier: { type: String, enum: ['basic', 'standard', 'premium', 'comprehensive'] },

  // Duration & pricing
  duration_months: Number,
  price: Number,
  currency: { type: String, default: 'INR' },

  // Coverage
  coverage: {
    manufacturing_defects: { type: Boolean, default: true },
    accidental_damage: { type: Boolean, default: false },
    liquid_damage: { type: Boolean, default: false },
    theft_protection: { type: Boolean, default: false },
    power_surge: { type: Boolean, default: false },
    screen_protection: { type: Boolean, default: false },
    unlimited_claims: { type: Boolean, default: false },
    pickup_delivery: { type: Boolean, default: false },
    express_service: { type: Boolean, default: false },
    dedicated_support: { type: Boolean, default: false }
  },

  // Limits
  max_claim_amount: Number,  // Per claim
  max_total_claims: Number,  // Total claims allowed
  max_claims_per_year: Number,
  deductible: Number,  // Amount customer pays per claim

  // Benefits
  cashback_percentage: { type: Number, default: 0 },
  loyalty_points_multiplier: { type: Number, default: 1 },
  priority_support: { type: Boolean, default: false },
  exclusive_access: { type: Boolean, default: false },

  // Eligibility
  eligible_categories: [String],
  min_product_price: Number,
  max_product_price: Number,
  requires_existing_warranty: { type: Boolean, default: false },

  // Validity
  valid_from: Date,
  valid_until: Date,
  auto_renew: { type: Boolean, default: false },

  // Status
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },

  created_at: { type: Date, default: Date.now }
}));

// Extended Warranty Subscription
const WarrantySubscription = mongoose.model('WarrantySubscription', new mongoose.Schema({
  subscription_id: { type: String, required: true, unique: true },
  plan_id: String,
  plan_name: String,
  plan_tier: String,

  // Product
  serial_number: String,
  product_id: String,
  brand: String,
  model: String,
  category: String,
  product_price: Number,

  // Customer
  user_id: String,
  customer_name: String,
  customer_phone: String,
  customer_email: String,

  // Original warranty (if upgrading)
  original_warranty_id: String,
  original_warranty_expiry: Date,

  // Subscription details
  start_date: Date,
  end_date: Date,
  duration_months: Number,
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended', 'upgraded'],
    default: 'active'
  },

  // Payment
  price_paid: Number,
  payment_method: String,
  payment_id: String,
  auto_renew: { type: Boolean, default: false },
  next_renewal_date: Date,

  // Claims
  claims: [{
    claim_id: String,
    claim_type: String,
    description: String,
    claim_amount: Number,
    approved_amount: Number,
    deductible_applied: Number,
    status: String,
    filed_at: Date,
    resolved_at: Date
  }],
  claims_count: { type: Number, default: 0 },
  total_claims_amount: { type: Number, default: 0 },
  remaining_claim_amount: Number,

  // Benefits used
  pickup_used: { type: Boolean, default: false },
  express_service_used: { type: Boolean, default: false },

  // Loyalty
  loyalty_points_earned: { type: Number, default: 0 },
  cashback_earned: { type: Number, default: 0 },

  // Audit
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Insurance Policy (Phase 2)
const InsurancePolicy = mongoose.model('InsurancePolicy', new mongoose.Schema({
  policy_id: { type: String, required: true, unique: true },
  subscription_id: String,

  // Insurance type
  insurance_type: {
    type: String,
    enum: ['theft', 'accidental_damage', 'device_protection', 'extended_protection']
  },

  // Product
  serial_number: String,
  product_id: String,
  product_value: Number,

  // Customer
  user_id: String,
  customer_name: String,
  customer_phone: String,

  // Coverage
  coverage_amount: Number,
  premium: Number,
  premium_frequency: { type: String, enum: ['monthly', 'yearly'] },
  deductible: Number,

  // Terms
  start_date: Date,
  end_date: Date,
  waiting_period_days: { type: Number, default: 0 },

  // Claims
  claims: [{
    claim_id: String,
    incident_date: Date,
    description: String,
    claim_amount: Number,
    approved: Boolean,
    paid_date: Date,
    reason: String
  }],
  claims_count: { type: Number, default: 0 },
  total_paid: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'claim_pending', 'claim_paid'],
    default: 'active'
  },

  created_at: { type: Date, default: Date.now }
}));

// ============================================
// WARRANTY PLANS APIs
// ============================================

/**
 * POST /api/warranty-plans
 * Create a new warranty plan (admin)
 */
router.post('/warranty-plans', async (req: Request, res: Response) => {
  const planData = req.body;

  const plan_id = `PLAN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const plan = new WarrantyPlan({
    plan_id,
    ...planData
  });

  await plan.save();

  res.json({ success: true, plan_id });
});

/**
 * GET /api/warranty-plans
 * Get available warranty plans
 */
router.get('/warranty-plans', async (req: Request, res: Response) => {
  const { brand_id, category, product_price } = req.query;

  let query: unknown = { status: 'active' };

  if (brand_id) query.brand_id = brand_id;
  if (category) query.eligible_categories = { $in: [category] };

  const plans = await WarrantyPlan.find(query);

  // Filter by price range
  let filteredPlans = plans;
  if (product_price) {
    const price = Number(product_price);
    filteredPlans = plans.filter(p => {
      if (p.min_product_price && price < p.min_product_price) return false;
      if (p.max_product_price && price > p.max_product_price) return false;
      return true;
    });
  }

  // Format for display
  const formattedPlans = filteredPlans.map(p => ({
    plan_id: p.plan_id,
    name: p.name,
    description: p.description,
    tier: p.tier,
    duration_months: p.duration_months,
    price: p.price,
    coverage: p.coverage,
    benefits: {
      cashback_percentage: p.cashback_percentage,
      loyalty_points_multiplier: p.loyalty_points_multiplier,
      priority_support: p.priority_support,
      pickup_delivery: p.coverage?.pickup_delivery || false,
      express_service: p.coverage?.express_service || false
    },
    limits: {
      max_claim_amount: p.max_claim_amount,
      max_total_claims: p.max_total_claims,
      deductible: p.deductible
    }
  }));

  res.json({ plans: formattedPlans });
});

/**
 * GET /api/warranty-plans/:plan_id
 * Get plan details
 */
router.get('/warranty-plans/:plan_id', async (req: Request, res: Response) => {
  const plan = await WarrantyPlan.findOne({ plan_id: req.params.plan_id });
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  res.json(plan);
});

// ============================================
// SUBSCRIPTION APIs
// ============================================

/**
 * POST /api/subscribe
 * Subscribe to extended warranty plan
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  const {
    plan_id,
    serial_number,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    product_price,
    payment_method,
    auto_renew = false
  } = req.body;

  // Get plan
  const plan = await WarrantyPlan.findOne({ plan_id });
  if (!plan || plan.status !== 'active') {
    return res.status(400).json({ error: 'Invalid or inactive plan' });
  }

  // Check eligibility
  if (product_price) {
    if (plan.min_product_price && product_price < plan.min_product_price) {
      return res.status(400).json({ error: 'Product price below minimum for this plan' });
    }
    if (plan.max_product_price && product_price > plan.max_product_price) {
      return res.status(400).json({ error: 'Product price above maximum for this plan' });
    }
  }

  // Check if subscription already exists
  const existing = await WarrantySubscription.findOne({
    serial_number,
    status: 'active'
  });
  if (existing) {
    return res.status(400).json({
      error: 'Active subscription already exists',
      subscription_id: existing.subscription_id
    });
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.duration_months);

  // Create subscription
  const subscription_id = `SUB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const subscription = new WarrantySubscription({
    subscription_id,
    plan_id: plan.plan_id,
    plan_name: plan.name,
    plan_tier: plan.tier,

    serial_number,
    product_id: '',  // Will be filled from serial registry
    brand: '',
    model: '',
    category: '',
    product_price: Number(product_price),

    user_id,
    customer_name,
    customer_phone,
    customer_email,

    start_date: startDate,
    end_date: endDate,
    duration_months: plan.duration_months,
    status: 'active',

    price_paid: plan.price,
    payment_method,
    auto_renew,

    remaining_claim_amount: plan.max_claim_amount || 0,

    loyalty_points_earned: Math.floor(plan.price * plan.loyalty_points_multiplier)
  });

  await subscription.save();

  // Process payment
  if (payment_method === 'wallet' || payment_method === 'razorpay') {
    try {
      await axios.post(`${WALLET_API}/api/deduct`, {
        user_id,
        amount: plan.price,
        reason: `Extended warranty: ${plan.name}`,
        reference_id: subscription_id
      });
    } catch (e) {
      subscription.status = 'suspended';
      await subscription.save();
      return res.status(400).json({ error: 'Payment failed' });
    }
  }

  // Award loyalty points
  if (subscription.loyalty_points_earned > 0) {
    try {
      await axios.post(`${WALLET_API}/api/earn`, {
        user_id,
        amount: subscription.loyalty_points_earned,
        source: 'warranty_subscription',
        reason: `Subscribed to ${plan.name}`
      });
    } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  // Track to intelligence
  try {
    await axios.post(`${process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com'}/api/intent/track`, {
      user_id,
      intent_type: 'warranty_subscription',
      entities: {
        plan_id,
        plan_tier: plan.tier,
        serial_number
      },
      action: 'subscribe'
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  // Notify via WhatsApp
  try {
    await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: customer_phone,
      template: 'subscription_confirmed',
      params: {
        plan_name: plan.name,
        duration_months: plan.duration_months,
        expires: endDate.toDateString(),
        subscription_id
      },
      user_id
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    subscription_id,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    benefits: plan.coverage
  });
});

/**
 * GET /api/subscriptions/:user_id
 * Get user's subscriptions
 */
router.get('/subscriptions/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { status } = req.query;

  let query: unknown = { user_id };
  if (status) query.status = status;

  const subscriptions = await WarrantySubscription.find(query)
    .sort({ created_at: -1 });

  // Get plan details for each
  const result = await Promise.all(
    subscriptions.map(async (sub) => {
      const plan = await WarrantyPlan.findOne({ plan_id: sub.plan_id });

      return {
        subscription_id: sub.subscription_id,
        plan: {
          name: sub.plan_name,
          tier: sub.plan_tier,
          coverage: plan?.coverage,
          benefits: {
            cashback_percentage: plan?.cashback_percentage,
            loyalty_points_multiplier: plan?.loyalty_points_multiplier
          }
        },
        product: {
          serial_number: sub.serial_number,
          brand: sub.brand,
          model: sub.model
        },
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        remaining_days: Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        claims: {
          count: sub.claims_count,
          total_amount: sub.total_claims_amount,
          remaining: sub.remaining_claim_amount
        },
        loyalty: {
          points_earned: sub.loyalty_points_earned,
          cashback_earned: sub.cashback_earned
        }
      };
    })
  );

  res.json({ subscriptions: result });
});

/**
 * GET /api/subscription/:id
 * Get subscription details
 */
router.get('/subscription/:id', async (req: Request, res: Response) => {
  const subscription = await WarrantySubscription.findOne({ subscription_id: req.params.id });
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  const plan = await WarrantyPlan.findOne({ plan_id: subscription.plan_id });

  res.json({
    ...subscription.toObject(),
    plan_details: plan
  });
});

/**
 * POST /api/subscription/:id/claim
 * File a claim on subscription
 */
router.post('/subscription/:id/claim', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    claim_type,
    description,
    claim_amount,
    photos,
    service_center_id
  } = req.body;

  const subscription = await WarrantySubscription.findOne({ subscription_id: id });
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  if (subscription.status !== 'active') {
    return res.status(400).json({ error: 'Subscription is not active' });
  }

  // Get plan for deductible
  const plan = await WarrantyPlan.findOne({ plan_id: subscription.plan_id });
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Check claim limits
  if (plan.max_total_claims && subscription.claims_count >= plan.max_total_claims) {
    return res.status(400).json({ error: 'Maximum claims reached' });
  }

  // Calculate approved amount
  let approved_amount = claim_amount || 0;
  let deductible_applied = 0;

  if (plan.deductible && claim_amount) {
    deductible_applied = Math.min(plan.deductible, claim_amount);
    approved_amount = claim_amount - deductible_applied;
  }

  // Check remaining claim amount
  if (plan.max_claim_amount && approved_amount > plan.max_claim_amount) {
    approved_amount = plan.max_claim_amount;
  }

  if (subscription.remaining_claim_amount && approved_amount > subscription.remaining_claim_amount) {
    approved_amount = subscription.remaining_claim_amount;
  }

  const claim_id = `CLM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Add claim
  subscription.claims.push({
    claim_id,
    claim_type,
    description,
    claim_amount,
    approved_amount,
    deductible_applied,
    status: 'pending',
    filed_at: new Date()
  });

  subscription.claims_count++;
  subscription.total_claims_amount += approved_amount;

  if (subscription.remaining_claim_amount) {
    subscription.remaining_claim_amount -= approved_amount;
  }

  await subscription.save();

  // Track to intelligence
  try {
    await axios.post(`${process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com'}/api/intent/track`, {
      user_id: subscription.user_id,
      intent_type: 'warranty_claim',
      entities: {
        subscription_id: id,
        claim_type,
        claim_amount: approved_amount
      },
      action: 'file'
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    claim_id,
    claim_amount,
    approved_amount,
    deductible_applied,
    status: 'pending'
  });
});

/**
 * POST /api/subscription/:id/cancel
 * Cancel subscription
 */
router.post('/subscription/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const subscription = await WarrantySubscription.findOne({ subscription_id: id });
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Calculate refund (pro-rata)
  const daysUsed = Math.ceil((Date.now() - new Date(subscription.start_date).getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((new Date(subscription.end_date).getTime() - new Date(subscription.start_date).getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = totalDays - daysUsed;
  const refundAmount = Math.max(0, Math.floor((subscription.price_paid / totalDays) * remainingDays));

  subscription.status = 'cancelled';
  subscription.updated_at = new Date();
  await subscription.save();

  // Process refund if applicable
  if (refundAmount > 0) {
    try {
      await axios.post(`${WALLET_API}/api/refund`, {
        user_id: subscription.user_id,
        amount: refundAmount,
        reason: 'Subscription cancellation',
        reference_id: id
      });
    } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  res.json({
    success: true,
    refund_amount: refundAmount,
    message: `Subscription cancelled. Refund: ₹${refundAmount}`
  });
});

// ============================================
// INSURANCE APIs (Phase 2)
// ============================================

/**
 * POST /api/insurance/policy
 * Create insurance policy
 */
router.post('/insurance/policy', async (req: Request, res: Response) => {
  const {
    user_id,
    customer_name,
    customer_phone,
    serial_number,
    product_value,
    insurance_type,
    coverage_amount,
    premium,
    premium_frequency,
    deductible,
    duration_months
  } = req.body;

  const policy_id = `POL-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + duration_months);

  const policy = new InsurancePolicy({
    policy_id,
    insurance_type,
    serial_number,
    product_value,
    user_id,
    customer_name,
    customer_phone,
    coverage_amount: coverage_amount || product_value,
    premium,
    premium_frequency,
    deductible,
    start_date: startDate,
    end_date: endDate,
    waiting_period_days: 15  // Standard waiting period
  });

  await policy.save();

  res.json({
    success: true,
    policy_id,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    message: `Insurance policy activated. Waiting period: 15 days`
  });
});

/**
 * POST /api/insurance/:policy_id/claim
 * File insurance claim
 */
router.post('/insurance/:policy_id/claim', async (req: Request, res: Response) => {
  const { policy_id } = req.params;
  const {
    incident_date,
    description,
    claim_amount,
    proof_url
  } = req.body;

  const policy = await InsurancePolicy.findOne({ policy_id });
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  // Check waiting period
  const daysSinceStart = Math.ceil((Date.now() - new Date(policy.start_date).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < policy.waiting_period_days) {
    return res.status(400).json({
      error: `Waiting period active. Claims can be filed after ${policy.waiting_period_days - daysSinceStart} days`
    });
  }

  // Check if claim is within coverage
  if (claim_amount > policy.coverage_amount - policy.total_paid) {
    return res.status(400).json({ error: 'Claim exceeds remaining coverage' });
  }

  const claim_id = `INS-CLM-${Date.now()}`;

  policy.claims.push({
    claim_id,
    incident_date: new Date(incident_date),
    description,
    claim_amount,
    approved: false,
    reason: 'Under review'
  });

  policy.status = 'claim_pending';
  await policy.save();

  res.json({
    success: true,
    claim_id,
    status: 'Under review'
  });
});

/**
 * GET /api/insurance/:policy_id
 * Get policy details
 */
router.get('/insurance/:policy_id', async (req: Request, res: Response) => {
  const policy = await InsurancePolicy.findOne({ policy_id: req.params.policy_id });
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  res.json(policy);
});

export default router;
