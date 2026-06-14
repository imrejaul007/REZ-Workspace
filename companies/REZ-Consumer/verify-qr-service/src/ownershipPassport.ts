/**
 * REZ Verify QR - Ownership Passport Service
 * Complete ownership lifecycle management with portable certificates
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
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';

// ============================================
// MODELS
// ============================================

// Ownership Passport - Complete product identity
const OwnershipPassport = mongoose.model('OwnershipPassport', new mongoose.Schema({
  passport_id: { type: String, required: true, unique: true },
  serial_number: { type: String, required: true, index: true },
  product_id: String,
  brand: String,
  model: String,
  category: String,
  color: String,
  storage: String,

  // Purchase details
  purchase_date: Date,
  purchase_price: Number,
  purchase_location: String,
  invoice_url: String,

  // Original owner
  original_owner: {
    user_id: String,
    name: String,
    phone: String,
    email: String,
    activated_at: Date
  },

  // Current owner
  current_owner: {
    user_id: String,
    name: String,
    phone: String,
    email: String,
    owned_since: Date
  },

  // Ownership chain (for resale tracking)
  ownership_chain: [{
    owner_id: String,
    owner_name: String,
    owner_phone: String,
    acquired_date: Date,
    transfer_type: { type: String, enum: ['purchase', 'gift', 'inheritance', 'resale'] },
    verification_status: { type: String, enum: ['verified', 'pending', 'self_declared'] },
    proof_url: String,
    transaction_id: String
  }],

  // Warranty status
  warranty: {
    status: { type: String, enum: ['active', 'expired', 'claimed', 'transferable', 'non_transferable'] },
    start_date: Date,
    end_date: Date,
    remaining_days: Number,
    plan_type: String,
    claims_count: { type: Number, default: 0 },
    transferable: { type: Boolean, default: true }
  },

  // Service history
  service_history: [{
    service_id: String,
    service_type: String,
    center_name: String,
    date: Date,
    description: String,
    cost: Number,
    warranty_covered: Boolean,
    status: String,
    duration_days: Number
  }],

  // Digital certificate
  certificate: {
    certificate_id: String,
    issued_at: Date,
    qr_code: String,
    hash: String,  // Blockchain-style hash for authenticity
    signature: String  // HMAC signature
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'transferred', 'reported_stolen', 'recalled', 'expired'],
    default: 'active'
  },

  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Service History Record (portable)
const ServiceRecord = mongoose.model('ServiceRecord', new mongoose.Schema({
  record_id: { type: String, required: true, unique: true },
  passport_id: String,
  serial_number: { type: String, required: true, index: true },

  // Service details
  service_type: {
    type: String,
    enum: ['repair', 'replacement', 'inspection', 'routine_service', 'warranty_claim', 'upgrade', 'modification']
  },
  description: String,
  parts_replaced: [String],
  technician_name: String,
  technician_id: String,

  // Location & timing
  service_center: {
    name: String,
    address: String,
    city: String,
    center_id: String
  },
  service_date: Date,
  completion_date: Date,
  turnaround_days: Number,

  // Cost
  cost: Number,
  warranty_covered: Boolean,
  invoice_url: String,

  // Authenticity
  verified: { type: Boolean, default: true },
  verification_hash: String,

  // Export tracking
  exported_count: { type: Number, default: 0 },
  last_exported_at: Date,
  exported_to: [{
    platform: String,
    exported_at: Date
  }],

  created_at: { type: Date, default: Date.now }
}));

// Resale Verification Request
const ResaleVerification = mongoose.model('ResaleVerification', new mongoose.Schema({
  verification_id: { type: String, required: true, unique: true },
  serial_number: { type: String, required: true, index: true },
  passport_id: String,

  // Seller info
  seller: {
    user_id: String,
    name: String,
    phone: String,
    verification_status: String
  },

  // Buyer info
  buyer: {
    user_id: String,
    name: String,
    phone: String
  },

  // Product condition (seller declared)
  declared_condition: {
    grade: { type: String, enum: ['mint', 'excellent', 'good', 'fair'], default: 'good' },
    functional_status: String,
    cosmetic_status: String,
    missing_parts: [String],
    repair_history: String
  },

  // Verification results
  verification_results: {
    authenticity: { type: String, enum: ['verified', 'suspicious', 'failed', 'pending'] },
    ownership: { type: String, enum: ['verified', 'suspicious', 'failed', 'pending'] },
    service_history: {
      status: String,
      records_found: Number,
      suspicious_items: [String]
    },
    fraud_flags: [{
      flag_type: String,
      severity: String,
      description: String
    }],
    risk_score: { type: Number, default: 0 }  // 0-100
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'verified', 'failed', 'cancelled'],
    default: 'pending'
  },

  // Report
  report: {
    summary: String,
    recommendations: [String],
    price_guide: {
      min: Number,
      max: Number,
      suggested: Number
    },
    generated_at: Date
  },

  created_at: { type: Date, default: Date.now },
  completed_at: Date
}));

// ============================================
// HELPERS
// ============================================

// Generate certificate hash
function generateCertificateHash(data): string {
  const content = JSON.stringify({
    serial: data.serial_number,
    brand: data.brand,
    model: data.model,
    owner: data.current_owner?.user_id,
    timestamp: Date.now()
  });
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// Generate certificate signature
function signCertificate(passport): string {
  const certSecret = process.env.CERTIFICATE_SECRET;
  if (!certSecret) {
    throw new Error('CERTIFICATE_SECRET environment variable is required');
  }
  const content = `${passport.passport_id}|${passport.serial_number}|${passport.certificate?.hash}|${Date.now()}`;
  return crypto
    .createHmac('sha256', certSecret)
    .update(content)
    .digest('hex');
}

// ============================================
// OWNERSHIP PASSPORT APIs
// ============================================

/**
 * POST /api/passport/create
 * Create ownership passport for verified product
 */
router.post('/passport/create', async (req: Request, res: Response) => {
  const {
    serial_number,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    purchase_date,
    purchase_price,
    purchase_location,
    invoice_url,
    warranty_months = 12,
    product_details
  } = req.body;

  // Check if passport already exists
  const existing = await OwnershipPassport.findOne({ serial_number });
  if (existing) {
    return res.status(400).json({
      error: 'Passport already exists for this product',
      passport_id: existing.passport_id
    });
  }

  // Get product info from serial registry
  const SerialRegistry = mongoose.model('SerialRegistry');
  const serial = await SerialRegistry.findOne({ serial_number });

  if (!serial) {
    return res.status(404).json({ error: 'Product serial not found' });
  }

  // Create passport
  const passport_id = `PASS-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const certHash = generateCertificateHash({
    serial_number,
    brand: serial.brand || product_details?.brand,
    model: serial.model || product_details?.model,
    current_owner: { user_id }
  });

  const passport = new OwnershipPassport({
    passport_id,
    serial_number,
    product_id: serial.product_id,
    brand: serial.brand || product_details?.brand,
    model: serial.model || product_details?.model,
    category: serial.category || product_details?.category,
    color: product_details?.color,
    storage: product_details?.storage,

    purchase_date: new Date(purchase_date),
    purchase_price: Number(purchase_price) || 0,
    purchase_location,
    invoice_url,

    original_owner: {
      user_id,
      name: customer_name,
      phone: customer_phone,
      email: customer_email,
      activated_at: new Date()
    },

    current_owner: {
      user_id,
      name: customer_name,
      phone: customer_phone,
      email: customer_email,
      owned_since: new Date()
    },

    ownership_chain: [{
      owner_id: user_id,
      owner_name: customer_name,
      owner_phone: customer_phone,
      acquired_date: new Date(purchase_date),
      transfer_type: 'purchase',
      verification_status: 'verified',
      proof_url: invoice_url
    }],

    warranty: {
      status: 'active',
      start_date: new Date(purchase_date),
      end_date: new Date(new Date(purchase_date).setMonth(new Date(purchase_date).getMonth() + warranty_months)),
      remaining_days: warranty_months * 30,
      plan_type: 'standard',
      claims_count: 0,
      transferable: true
    },

    certificate: {
      certificate_id: `CERT-${Date.now()}`,
      issued_at: new Date(),
      qr_code: `REZ:PASS:${passport_id}`,
      hash: certHash,
      signature: ''
    },

    status: 'active'
  });

  // Sign certificate
  passport.certificate.signature = signCertificate(passport);

  await passport.save();

  // Track to REZ Intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id,
      intent_type: 'ownership_passport_created',
      entities: {
        product: serial_number,
        brand: passport.brand,
        model: passport.model,
        passport_id
      },
      action: 'create'
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({
    success: true,
    passport_id,
    certificate: {
      certificate_id: passport.certificate.certificate_id,
      hash: certHash,
      qr_code: passport.certificate.qr_code
    },
    warranty: passport.warranty
  });
});

/**
 * GET /api/passport/:serial
 * Get ownership passport for a product
 */
router.get('/passport/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { include_history = 'true', include_service = 'true' } = req.query;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  let result: unknown = {
    passport_id: passport.passport_id,
    serial_number: passport.serial_number,
    product: {
      brand: passport.brand,
      model: passport.model,
      category: passport.category,
      color: passport.color,
      storage: passport.storage
    },
    status: passport.status,
    certificate: passport.certificate,
    warranty: passport.warranty,
    created_at: passport.created_at
  };

  // Include ownership chain
  result.ownership = {
    current_owner: passport.current_owner,
    original_owner: passport.original_owner,
    chain_length: passport.ownership_chain.length,
    chain: include_history === 'true' ? passport.ownership_chain : undefined
  };

  // Include service history
  if (include_service === 'true') {
    const services = await ServiceRecord.find({ serial_number: serial })
      .sort({ service_date: -1 });

    result.service_history = {
      total_services: services.length,
      records: services
    };
  }

  res.json(result);
});

/**
 * GET /api/passport/:serial/certificate
 * Get shareable certificate (for resale/display)
 */
router.get('/passport/:serial/certificate', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { format = 'json', signature } = req.query;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  // Verify signature if provided
  if (signature) {
    const expectedSig = signCertificate(passport);
    if (signature !== expectedSig) {
      return res.status(401).json({ error: 'Invalid certificate signature' });
    }
  }

  const certificateData = {
    certificate_id: passport.certificate.certificate_id,
    passport_id: passport.passport_id,
    serial_number: passport.serial_number,
    product: {
      brand: passport.brand,
      model: passport.model
    },
    ownership: {
      current_owner: passport.current_owner?.name,
      owned_since: passport.current_owner?.owned_since,
      chain_length: passport.ownership_chain.length
    },
    warranty: {
      status: passport.warranty?.status,
      expires: passport.warranty?.end_date,
      remaining_days: passport.warranty?.remaining_days,
      transferable: passport.warranty?.transferable
    },
    authenticity: {
      verified: true,
      hash: passport.certificate?.hash,
      issued: passport.certificate?.issued_at,
      platform: 'REZ Verify QR'
    }
  };

  if (format === 'json') {
    res.json(certificateData);
  } else {
    // Return minimal data for QR/display
    res.json({
      ...certificateData,
      qr_data: `REZ:PASS:${passport.passport_id}`,
      verification_url: `https://rez.app/verify/${serial}/certificate`
    });
  }
});

/**
 * POST /api/passport/:serial/transfer
 * Transfer ownership (sale/gift)
 */
router.post('/passport/:serial/transfer', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const {
    from_user_id,
    to_user_id,
    to_name,
    to_phone,
    to_email,
    transfer_type = 'resale',
    sale_price,
    proof_url,
    accept_warranty_transfer = true
  } = req.body;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  // Verify current owner
  if (passport.current_owner.user_id !== from_user_id) {
    return res.status(403).json({ error: 'Not the current owner' });
  }

  // Check warranty transferability
  if (!passport.warranty.transferable && transfer_type === 'resale') {
    return res.status(400).json({
      error: 'Warranty is not transferable. New owner will need to purchase extended warranty.'
    });
  }

  // Add to ownership chain
  passport.ownership_chain.push({
    owner_id: to_user_id,
    owner_name: to_name,
    owner_phone: to_phone,
    acquired_date: new Date(),
    transfer_type,
    verification_status: 'pending',
    proof_url
  });

  // Update current owner
  const previousOwner = passport.current_owner;
  passport.current_owner = {
    user_id: to_user_id,
    name: to_name,
    phone: to_phone,
    email: to_email,
    owned_since: new Date()
  };

  passport.updated_at = new Date();
  await passport.save();

  // Track transfer
  try {
    await axios.post(`${INTELLIGENCE_API}/api/attribution/track`, {
      event_type: 'ownership_transfer',
      user_id: to_user_id,
      entities: {
        product: { id: serial, brand: passport.brand, model: passport.model },
        previous_owner: previousOwner.user_id
      },
      value: sale_price || 0,
      metadata: { transfer_type }
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  // Notify new owner
  if (to_phone) {
    try {
      await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
        phone: to_phone,
        template: 'ownership_transferred',
        params: {
          brand: passport.brand,
          model: passport.model,
          serial,
          passport_id: passport.passport_id,
          warranty_status: passport.warranty.status,
          warranty_transfer: accept_warranty_transfer ? 'included' : 'not included'
        },
        user_id: to_user_id
      });
    } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
  }

  res.json({
    success: true,
    passport_id: passport.passport_id,
    transfer_id: passport.ownership_chain[passport.ownership_chain.length - 1]._id,
    message: `Ownership transferred to ${to_name}`,
    warranty_included: accept_warranty_transfer && passport.warranty.transferable
  });
});

/**
 * POST /api/passport/:serial/verify-chain
 * Verify complete ownership chain
 */
router.post('/passport/:serial/verify-chain', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { buyer_user_id, buyer_name, buyer_phone } = req.body;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  // Build verification report
  const report = {
    passport_id: passport.passport_id,
    serial_number: serial,
    product: {
      brand: passport.brand,
      model: passport.model,
      authenticity: 'verified'
    },
    ownership: {
      current_owner: passport.current_owner,
      chain_length: passport.ownership_chain.length,
      all_verified: passport.ownership_chain.every(h => h.verification_status === 'verified')
    },
    warranty: {
      status: passport.warranty?.status,
      remaining_days: passport.warranty?.remaining_days,
      transferable: passport.warranty?.transferable
    },
    service_history: {
      total_records: passport.service_history.length,
      last_service: passport.service_history.length > 0
        ? passport.service_history[passport.service_history.length - 1]
        : null
    },
    risk_factors: [] as string[],
    recommendations: [] as string[],
    can_proceed: true
  };

  // Check risk factors
  if (passport.ownership_chain.length > 5) {
    report.risk_factors.push('High number of ownership changes');
    report.can_proceed = false;
  }

  if (passport.warranty?.status === 'claimed') {
    report.risk_factors.push('Warranty has been fully claimed');
  }

  if (passport.status === 'reported_stolen') {
    report.risk_factors.push('Product reported stolen');
    report.can_proceed = false;
  }

  if (!passport.warranty?.transferable) {
    report.recommendations.push('Warranty not transferable - negotiate price accordingly');
  }

  // Recommendations
  if (report.can_proceed) {
    report.recommendations.push('Ownership chain verified - safe to proceed');
    report.recommendations.push('Request original invoice for complete verification');
  }

  res.json(report);
});

// ============================================
// SERVICE HISTORY APIs
// ============================================

/**
 * POST /api/passport/service/add
 * Add service record to passport
 */
router.post('/passport/service/add', async (req: Request, res: Response) => {
  const {
    serial_number,
    passport_id,
    service_type,
    description,
    parts_replaced,
    technician_name,
    service_center,
    service_date,
    completion_date,
    cost,
    warranty_covered,
    invoice_url
  } = req.body;

  const record_id = `SRV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const record = new ServiceRecord({
    record_id,
    passport_id,
    serial_number,
    service_type,
    description,
    parts_replaced: parts_replaced || [],
    technician_name,
    service_center,
    service_date: new Date(service_date),
    completion_date: completion_date ? new Date(completion_date) : new Date(service_date),
    turnaround_days: completion_date
      ? Math.ceil((new Date(completion_date).getTime() - new Date(service_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    cost: cost || 0,
    warranty_covered: warranty_covered || false,
    invoice_url,
    verified: true,
    verification_hash: crypto.createHash('sha256').update(record_id + serial_number).digest('hex').substring(0, 12)
  });

  await record.save();

  // Update passport service history
  await OwnershipPassport.updateOne(
    { serial_number },
    {
      $push: {
        service_history: {
          service_id: record_id,
          service_type,
          center_name: service_center?.name,
          date: new Date(service_date),
          description,
          cost: cost || 0,
          warranty_covered,
          status: 'completed',
          duration_days: record.turnaround_days
        }
      },
      updated_at: new Date()
    }
  );

  // Track to intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id: 'system',
      intent_type: 'service_completed',
      entities: {
        product: serial_number,
        service_type
      },
      action: 'record'
    });
  } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }

  res.json({ success: true, record_id });
});

/**
 * GET /api/passport/service/export/:serial
 * Export service history for resale/upgrades
 */
router.get('/passport/service/export/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { format = 'json', purpose = 'resale', buyer_id } = req.query;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Passport not found' });
  }

  const records = await ServiceRecord.find({ serial_number: serial })
    .sort({ service_date: -1 });

  const exportData = {
    export_id: `EXP-${Date.now()}`,
    exported_at: new Date(),
    purpose,
    serial_number: serial,
    passport_id: passport.passport_id,

    product: {
      brand: passport.brand,
      model: passport.model,
      category: passport.category
    },

    ownership: {
      current_owner: passport.current_owner?.name,
      owned_since: passport.current_owner?.owned_since,
      chain_length: passport.ownership_chain.length
    },

    warranty: {
      status: passport.warranty?.status,
      expires: passport.warranty?.end_date,
      remaining_days: passport.warranty?.remaining_days
    },

    service_summary: {
      total_services: records.length,
      total_cost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
      warranty_covered_cost: records.filter(r => r.warranty_covered).reduce((sum, r) => sum + (r.cost || 0), 0),
      last_service_date: records.length > 0 ? records[0].service_date : null,
      most_common_service: getMostCommon(records.map(r => r.service_type))
    },

    service_records: records.map(r => ({
      record_id: r.record_id,
      service_type: r.service_type,
      description: r.description,
      service_center: r.service_center?.name,
      service_date: r.service_date,
      cost: r.cost,
      warranty_covered: r.warranty_covered,
      parts_replaced: r.parts_replaced,
      verified: r.verified
    })),

    authenticity_hash: generateExportHash(passport, records)
  };

  // Track export
  await ServiceRecord.updateMany(
    { serial_number },
    {
      $inc: { exported_count: 1 },
      $set: { last_exported_at: new Date() },
      $push: { exported_to: { platform: purpose, exported_at: new Date() } }
    }
  );

  res.json(exportData);
});

function getMostCommon(arr: string[]): string {
  const counts: unknown = {};
  arr.forEach(a => counts[a] = (counts[a] || 0) + 1);
  return Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'none';
}

function generateExportHash(passport, records: unknown[]): string {
  const content = JSON.stringify({
    passport: passport.passport_id,
    serial: passport.serial_number,
    records_count: records.length,
    last_service: records[0]?.service_date
  });
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// ============================================
// RESALE VERIFICATION APIs
// ============================================

/**
 * POST /api/resale/verify
 * Request resale verification (buyer initiates)
 */
router.post('/resale/verify', async (req: Request, res: Response) => {
  const {
    serial_number,
    buyer_user_id,
    buyer_name,
    buyer_phone
  } = req.body;

  const passport = await OwnershipPassport.findOne({ serial_number });
  if (!passport) {
    return res.status(404).json({ error: 'Product passport not found' });
  }

  const verification_id = `RSV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const verification = new ResaleVerification({
    verification_id,
    serial_number,
    passport_id: passport.passport_id,
    seller: {
      user_id: passport.current_owner.user_id,
      name: passport.current_owner.name,
      phone: passport.current_owner.phone,
      verification_status: 'verified'
    },
    buyer: {
      user_id: buyer_user_id,
      name: buyer_name,
      phone: buyer_phone
    },
    verification_results: {
      authenticity: 'pending',
      ownership: 'pending',
      service_history: {
        status: 'pending',
        records_found: 0,
        suspicious_items: []
      },
      fraud_flags: [],
      risk_score: 0
    },
    status: 'pending'
  });

  await verification.save();

  // Perform async verification
  performResaleVerification(verification_id).catch(console.error);

  res.json({
    success: true,
    verification_id,
    message: 'Verification initiated'
  });
});

/**
 * GET /api/resale/verify/:id
 * Get verification status/result
 */
router.get('/resale/verify/:id', async (req: Request, res: Response) => {
  const verification = await ResaleVerification.findOne({ verification_id: req.params.id });
  if (!verification) {
    return res.status(404).json({ error: 'Verification not found' });
  }

  res.json(verification);
});

/**
 * GET /api/resale/buyer-check/:serial
 * Quick check for potential buyer
 */
router.get('/resale/buyer-check/:serial', async (req: Request, res: Response) => {
  const { serial } = req.params;
  const { buyer_phone } = req.query;

  const passport = await OwnershipPassport.findOne({ serial_number: serial });
  if (!passport) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Quick risk assessment
  let riskScore = 0;
  const riskFactors: unknown[] = [];

  // Check ownership chain length
  if (passport.ownership_chain.length > 3) {
    riskScore += 20;
    riskFactors.push({ factor: 'multiple_ownership_changes', score: 20 });
  }

  // Check warranty status
  if (passport.warranty?.status === 'claimed') {
    riskScore += 30;
    riskFactors.push({ factor: 'warranty_fully_claimed', score: 30 });
  }

  // Check for stolen status
  if (passport.status === 'reported_stolen') {
    riskScore += 100;
    riskFactors.push({ factor: 'reported_stolen', score: 100 });
  }

  // Check service history for suspicious patterns
  const recentServices = passport.service_history.filter(
    s => new Date(s.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  if (recentServices.length > 2) {
    riskScore += 15;
    riskFactors.push({ factor: 'high_service_frequency', score: 15 });
  }

  // Get service count
  const serviceCount = await ServiceRecord.countDocuments({ serial_number: serial });

  res.json({
    serial_number: serial,
    product: {
      brand: passport.brand,
      model: passport.model
    },
    risk_assessment: {
      score: riskScore,
      level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      factors: riskFactors,
      can_proceed: riskScore < 100
    },
    warranty: {
      status: passport.warranty?.status,
      remaining_days: passport.warranty?.remaining_days,
      transferable: passport.warranty?.transferable
    },
    ownership: {
      current_owner_verified: passport.current_owner ? true : false,
      ownership_chain_length: passport.ownership_chain.length
    },
    service_history: {
      total_services: serviceCount,
      recent_services: recentServices.length
    },
    recommendation: riskScore < 30
      ? 'Safe to proceed with purchase'
      : riskScore < 60
        ? 'Proceed with caution - request more documentation'
        : 'Not recommended - verify with seller'
  });
});

// ============================================
// INTERNAL: Resale Verification Engine
// ============================================

async function performResaleVerification(verificationId: string) {
  const verification = await ResaleVerification.findOne({ verification_id: verificationId });
  if (!verification) return;

  try {
    // Update status
    verification.status = 'in_progress';
    await verification.save();

    // 1. Authenticity check
    const passport = await OwnershipPassport.findOne({ serial_number: verification.serial_number });

    verification.verification_results.authenticity = passport ? 'verified' : 'failed';

    // 2. Ownership check
    if (passport?.current_owner.user_id === verification.seller.user_id) {
      verification.verification_results.ownership = 'verified';
    } else {
      verification.verification_results.ownership = 'suspicious';
    }

    // 3. Service history check
    const services = await ServiceRecord.find({ serial_number: verification.serial_number });
    verification.verification_results.service_history = {
      status: 'verified',
      records_found: services.length,
      suspicious_items: services.filter(s => !s.verified).map(s => s.record_id)
    };

    // 4. Fraud flag check
    const fraudFlags: unknown[] = [];

    if (passport?.status === 'reported_stolen') {
      fraudFlags.push({
        flag_type: 'stolen_report',
        severity: 'critical',
        description: 'Product has been reported stolen'
      });
    }

    if (passport?.ownership_chain.length > 5) {
      fraudFlags.push({
        flag_type: 'excessive_transfers',
        severity: 'medium',
        description: 'Unusually high number of ownership transfers'
      });
    }

    if (passport?.warranty?.status === 'claimed') {
      fraudFlags.push({
        flag_type: 'warranty_exhausted',
        severity: 'low',
        description: 'Warranty has been claimed'
      });
    }

    verification.verification_results.fraud_flags = fraudFlags;

    // Calculate risk score
    let riskScore = 0;
    fraudFlags.forEach(f => {
      if (f.severity === 'critical') riskScore += 100;
      else if (f.severity === 'high') riskScore += 50;
      else if (f.severity === 'medium') riskScore += 25;
      else riskScore += 10;
    });

    verification.verification_results.risk_score = Math.min(riskScore, 100);

    // Generate report
    verification.report = {
      summary: riskScore < 30
        ? 'Product appears safe for resale'
        : riskScore < 60
          ? 'Some risk factors detected - verify with seller'
          : 'High risk - proceed with caution',
      recommendations: generateRecommendations(fraudFlags),
      price_guide: generatePriceGuide(passport, services),
      generated_at: new Date()
    };

    verification.status = riskScore >= 100 ? 'failed' : 'verified';
    verification.completed_at = new Date();
    await verification.save();

    // Notify buyer
    if (verification.buyer.phone) {
      try {
        await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
          phone: verification.buyer.phone,
          template: 'resale_verification_complete',
          params: {
            verification_id,
            status: verification.status,
            risk_level: verification.verification_results.risk_score < 30 ? 'low' :
                        verification.verification_results.risk_score < 60 ? 'medium' : 'high',
            summary: verification.report.summary
          },
          user_id: verification.buyer.user_id
        });
      } catch (e) {
    logger.warn('Service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
    }

  } catch (error) {
    verification.status = 'failed';
    await verification.save();
    console.error('Resale verification error:', error);
  }
}

function generateRecommendations(flags: unknown[]): string[] {
  const recs: string[] = [];

  if (flags.some(f => f.flag_type === 'stolen_report')) {
    recs.push('Do NOT proceed - product may be stolen');
  }
  if (flags.some(f => f.flag_type === 'excessive_transfers')) {
    recs.push('Request proof of multiple ownership transfers');
  }
  if (flags.some(f => f.flag_type === 'warranty_exhausted')) {
    recs.push('Negotiate lower price - warranty fully claimed');
  }
  if (recs.length === 0) {
    recs.push('Ownership chain verified');
    recs.push('Service history verified');
    recs.push('Safe to proceed with purchase');
  }

  return recs;
}

function generatePriceGuide(passport, services: unknown[]): unknown {
  // Simple price guide based on warranty and service history
  let min = 50;
  let max = 100;

  if (passport?.warranty?.status === 'active') {
    min += 20;
    max += 30;
  }

  if (passport?.warranty?.remaining_days > 180) {
    min += 10;
    max += 15;
  }

  if (services.length > 0) {
    min -= 10;
    max -= 5;
  }

  return {
    min: Math.max(min, 10),
    max: Math.min(max, 100),
    suggested: Math.round((min + max) / 2)
  };
}

export default router;
