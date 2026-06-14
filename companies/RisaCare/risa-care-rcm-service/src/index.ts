/**
 * RisaCare RCM Service v2.0 - Revenue Cycle Management
 * With MongoDB and Ecosystem Integration
 *
 * Features:
 * - ICD-10 Diagnosis Coding
 * - CPT/HCPCS Procedure Coding
 * - Prior Authorization Management
 * - Claims Processing
 * - Denial Management
 * - Eligibility Verification
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';

// Ecosystem Integration
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient({
  hojaiLlmUrl: process.env.LLM_SERVICE_URL || 'http://localhost:4730'
});

const PORT = parseInt(process.env.PORT || '4750', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_rcm';
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

const ClaimSchema = new mongoose.Schema({
  claimId: { type: String, required: true, unique: true, index: true },
  claimNumber: String,
  patientId: { type: String, required: true, index: true },
  encounterId: String,
  provider: { npi: String, name: String },
  payer: { id: String, name: String },
  diagnosis: [{
    code: String, description: String, type: String
  }],
  procedures: [{
    cptCode: String, description: String, units: Number, charge: Number, date: Date
  }],
  totalCharge: Number,
  allowedAmount: Number,
  paidAmount: Number,
  patientResponsibility: Number,
  status: { type: String, enum: ['draft', 'submitted', 'pending', 'paid', 'denied', 'appealed', 'closed'], default: 'draft', index: true },
  submittedAt: Date,
  payerResponse: {
    status: String, reason: String, paidAt: Date, referenceNumber: String
  },
  denial: {
    reason: String, code: String, appealDeadline: Date
  },
  appeal: {
    filedAt: Date, status: String, decision: String, decidedAt: Date
  }
}, { timestamps: true });

const PriorAuthSchema = new mongoose.Schema({
  authId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  providerId: String,
  payerId: String,
  serviceType: String,
  cptCodes: [String],
  icdCodes: [String],
  status: { type: String, enum: ['pending', 'approved', 'denied', 'partial', 'expired'], default: 'pending', index: true },
  approvedUnits: Number,
  effectiveDate: Date,
  expirationDate: Date,
  notes: String,
  payerResponse: String,
  reviewedBy: String,
  reviewedAt: Date
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  claimId: String,
  patientId: String,
  amount: Number,
  type: { type: String, enum: ['insurance', 'patient', 'adjustment', 'refund'] },
  method: { type: String, enum: ['eft', 'check', 'card', 'cash', 'online'] },
  status: { type: String, enum: ['pending', 'posted', 'reversed'], default: 'pending' },
  postedAt: Date,
  reference: String,
  description: String
}, { timestamps: true });

const Claim = mongoose.model('Claim', ClaimSchema);
const PriorAuth = mongoose.model('PriorAuth', PriorAuthSchema);
const Payment = mongoose.model('Payment', PaymentSchema);

// ============================================
// ICD-10 DATABASE
// ============================================

const icd10Database: Record<string, string> = {
  'J06.9': 'Acute upper respiratory infection, unspecified',
  'J20.9': 'Acute bronchitis, unspecified',
  'M54.5': 'Low back pain',
  'I10': 'Essential (primary) hypertension',
  'E11.9': 'Type 2 diabetes mellitus without complications',
  'E11.65': 'Type 2 diabetes with hyperglycemia',
  'F32.9': 'Major depressive disorder, single episode, unspecified',
  'J45.909': 'Unspecified asthma, uncomplicated',
  'K21.0': 'Gastro-esophageal reflux disease with esophagitis',
  'N39.0': 'Urinary tract infection, site not specified',
  'R05': 'Cough',
  'R51': 'Headache',
  'R10.9': 'Unspecified abdominal pain',
  'E78.5': 'Hyperlipidemia, unspecified',
  'E03.9': 'Hypothyroidism, unspecified',
  'J44.9': 'Chronic obstructive pulmonary disease, unspecified',
  'I25.10': 'Atherosclerotic heart disease',
  'M79.3': 'Panniculitis, unspecified',
  'G43.909': 'Migraine, unspecified',
  'L30.9': 'Dermatitis, unspecified'
};

const cptDatabase: Record<string, string> = {
  '99213': 'Office visit, established patient, low complexity',
  '99214': 'Office visit, established patient, moderate complexity',
  '99215': 'Office visit, established patient, high complexity',
  '99203': 'Office visit, new patient, low complexity',
  '99204': 'Office visit, new patient, moderate complexity',
  '99205': 'Office visit, new patient, high complexity',
  '99395': 'Preventive visit, 18-39 years',
  '99396': 'Preventive visit, 40-64 years',
  '99397': 'Preventive visit, 65+ years',
  '90471': 'Immunization administration',
  '36415': 'Venipuncture',
  '85025': 'Complete blood count',
  '80053': 'Comprehensive metabolic panel',
  '80048': 'Basic metabolic panel',
  '80061': 'Lipid panel',
  '84443': 'Thyroid stimulating hormone',
  '82947': 'Glucose, quantitative',
  '83036': 'Hemoglobin A1c'
};

// ============================================
// ROUTES
// ============================================

app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'risa-care-rcm-service',
    version: '2.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ===== CLAIMS =====

app.post('/api/claims', async (req: Request, res: Response) => {
  try {
    const { patientId, provider, payer, diagnosis, procedures } = req.body;

    const totalCharge = procedures.reduce((s: number, p: any) => s + (p.charge * p.units), 0);
    const claimNumber = `CLM${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const claim = await Claim.create({
      claimId: `clm_${uuidv4()}`,
      claimNumber,
      patientId,
      provider,
      payer,
      diagnosis,
      procedures,
      totalCharge,
      status: 'draft'
    });

    // Emit intent
    ecosystem.rez.emitIntent({
      intent: 'claim_created',
      entities: { claimId: claim.claimId, amount: totalCharge },
      confidence: 0.95,
      userId: patientId,
      timestamp: new Date()
    }).catch(() => {});

    logger.info('Claim created', { claimId: claim.claimId, claimNumber });

    res.status(201).json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

app.get('/api/claims/:id', async (req: Request, res: Response) => {
  const claim = await Claim.findOne({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  res.json({ success: true, claim });
});

app.get('/api/claims', async (req: Request, res: Response) => {
  const { patientId, status, startDate, endDate } = req.query;
  const query: any = {};
  if (patientId) query.patientId = patientId;
  if (status) query.status = status;

  const claims = await Claim.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, claims, total: claims.length });
});

app.patch('/api/claims/:id/status', async (req: Request, res: Response) => {
  const { status, payerResponse } = req.body;
  const update: any = { status };
  if (payerResponse) update.payerResponse = payerResponse;
  if (status === 'submitted') update.submittedAt = new Date();

  const claim = await Claim.findOneAndUpdate(
    { claimId: req.params.id },
    update,
    { new: true }
  );

  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  // Notify on status change
  if (status === 'paid') {
    ecosystem.rabtul.sendPushNotification(
      claim.patientId,
      'Claim Paid',
      `Your claim #${claim.claimNumber} has been processed. Paid: ₹${claim.paidAmount}`
    ).catch(() => {});
  }

  if (status === 'denied') {
    ecosystem.rabtul.sendPushNotification(
      claim.patientId,
      'Claim Denied',
      `Your claim #${claim.claimNumber} has been denied. Reason: ${payerResponse?.reason || 'See details'}`
    ).catch(() => {});
  }

  res.json({ success: true, claim });
});

// ===== ICD-10 CODING =====

app.get('/api/icd/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.json({ codes: [] });

  const search = (q as string).toLowerCase();
  const results = Object.entries(icd10Database)
    .filter(([code, desc]) => code.includes(search) || desc.toLowerCase().includes(search))
    .map(([code, description]) => ({ code, description }))
    .slice(0, 20);

  res.json({ success: true, codes: results });
});

app.get('/api/icd/:code', async (req: Request, res: Response) => {
  const description = icd10Database[req.params.code.toUpperCase()];
  if (!description) return res.status(404).json({ error: 'ICD-10 code not found' });
  res.json({ success: true, code: req.params.code.toUpperCase(), description });
});

// ===== CPT CODING =====

app.get('/api/cpt/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.json({ codes: [] });

  const search = (q as string).toLowerCase();
  const results = Object.entries(cptDatabase)
    .filter(([code, desc]) => code.includes(search) || desc.toLowerCase().includes(search))
    .map(([code, description]) => ({ code, description }))
    .slice(0, 20);

  res.json({ success: true, codes: results });
});

app.get('/api/cpt/:code', async (req: Request, res: Response) => {
  const description = cptDatabase[req.params.code];
  if (!description) return res.status(404).json({ error: 'CPT code not found' });
  res.json({ success: true, code: req.params.code, description });
});

// ===== AI CODING ASSISTANT =====

app.post('/api/ai/suggest-codes', async (req: Request, res: Response) => {
  const { diagnosis, procedures } = req.body;

  // Use LLM to suggest codes
  const result = await ecosystem.hojai.chat([
    {
      role: 'system',
      content: `You are a medical coding assistant. Based on the diagnosis and procedures, suggest appropriate ICD-10 and CPT codes. Return JSON format: {"icdCodes": [{"code": "...", "description": "..."}], "cptCodes": [{"code": "...", "description": "..."}]}`
    },
    {
      role: 'user',
      content: `Diagnosis: ${diagnosis}\nProcedures: ${procedures}`
    }
  ], { temperature: 0.3 });

  if (result.success && result.content) {
    try {
      const suggestions = JSON.parse(result.content);
      res.json({ success: true, suggestions });
    } catch {
      res.json({ success: true, suggestions: { icdCodes: [], cptCodes: [] } });
    }
  } else {
    res.status(500).json({ error: 'AI coding failed' });
  }
});

// ===== PRIOR AUTHORIZATION =====

app.post('/api/prior-auth', async (req: Request, res: Response) => {
  const { patientId, providerId, payerId, serviceType, cptCodes, icdCodes } = req.body;

  const auth = await PriorAuth.create({
    authId: `auth_${uuidv4()}`,
    patientId, providerId, payerId, serviceType, cptCodes, icdCodes, status: 'pending'
  });

  logger.info('Prior auth created', { authId: auth.authId });

  res.status(201).json({ success: true, priorAuth: auth });
});

app.get('/api/prior-auth/:id', async (req: Request, res: Response) => {
  const auth = await PriorAuth.findOne({ authId: req.params.id });
  if (!auth) return res.status(404).json({ error: 'Prior auth not found' });
  res.json({ success: true, priorAuth: auth });
});

app.patch('/api/prior-auth/:id', async (req: Request, res: Response) => {
  const { status, approvedUnits, notes, payerResponse } = req.body;
  const update: any = { status };
  if (approvedUnits) update.approvedUnits = approvedUnits;
  if (notes) update.notes = notes;
  if (payerResponse) update.payerResponse = payerResponse;
  if (status === 'approved' || status === 'denied') {
    update.reviewedAt = new Date();
  }

  const auth = await PriorAuth.findOneAndUpdate({ authId: req.params.id }, update, { new: true });
  if (!auth) return res.status(404).json({ error: 'Prior auth not found' });

  res.json({ success: true, priorAuth: auth });
});

// ===== PAYMENTS =====

app.post('/api/payments', async (req: Request, res: Response) => {
  const { claimId, patientId, amount, type, method } = req.body;

  const payment = await Payment.create({
    paymentId: `pmt_${uuidv4()}`,
    claimId, patientId, amount, type, method, status: 'posted', postedAt: new Date()
  });

  // Update claim if linked
  if (claimId) {
    await Claim.findOneAndUpdate(
      { claimId },
      { $inc: { paidAmount: amount } }
    );
  }

  res.status(201).json({ success: true, payment });
});

app.get('/api/claims/:id/payments', async (req: Request, res: Response) => {
  const payments = await Payment.find({ claimId: req.params.id }).sort({ postedAt: -1 });
  res.json({ success: true, payments });
});

// ===== ANALYTICS =====

app.get('/api/analytics/summary', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const claims = await Claim.find({
    ...(startDate && { createdAt: { $gte: new Date(startDate as string) } }),
    ...(endDate && { createdAt: { $lte: new Date(endDate as string) } })
  });

  const summary = {
    totalClaims: claims.length,
    totalCharges: claims.reduce((s, c) => s + (c.totalCharge || 0), 0),
    totalPaid: claims.reduce((s, c) => s + (c.paidAmount || 0), 0),
    totalDenied: claims.filter(c => c.status === 'denied').length,
    totalPending: claims.filter(c => ['draft', 'submitted', 'pending'].includes(c.status)).length,
    byStatus: {
      draft: claims.filter(c => c.status === 'draft').length,
      submitted: claims.filter(c => c.status === 'submitted').length,
      paid: claims.filter(c => c.status === 'paid').length,
      denied: claims.filter(c => c.status === 'denied').length,
      appealed: claims.filter(c => c.status === 'appealed').length
    }
  };

  res.json({ success: true, summary });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('RCM Service connected to MongoDB');
    logger.info('Features: Claims, ICD-10, CPT, Prior Auth, Payments, Analytics');

    app.listen(PORT, () => {
      logger.info(`RisaCare RCM Service v2.0 started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;
