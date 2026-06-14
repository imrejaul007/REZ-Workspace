/**
 * RisaCare Insurance Aggregator
 * Compare and buy health insurance
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4775', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_insurance';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

// Schemas
const PlanSchema = new mongoose.Schema({
  planId: String,
  provider: String,
  providerLogo: String,
  name: String,
  type: String,
  category: String,
  minAge: Number,
  maxAge: Number,
  sumAssured: Number,
  premium: Number,
  premiumFrequency: String,
  coverage: {
    hospitalization: Boolean,
    maternity: Boolean,
    preExistingDisease: Boolean,
    dayCare: Boolean,
    ambulance: Boolean,
    ayush: Boolean,
    mentalHealth: Boolean,
    dental: Boolean,
    optical: Boolean,
    roomRentLimit: Number,
    noClaimBonus: Number
  },
  features: [String],
  exclusions: [String],
  waitingPeriod: Number,
  networkHospitals: Number
});

const PolicySchema = new mongoose.Schema({
  policyId: String,
  userId: String,
  planId: String,
  provider: String,
  planName: String,
  policyNumber: String,
  sumAssured: Number,
  premium: Number,
  startDate: Date,
  endDate: Date,
  status: String,
  members: [{
    name: String,
    relationship: String,
    dateOfBirth: Date,
    gender: String
  }]
});

const ClaimSchema = new mongoose.Schema({
  claimId: String,
  policyId: String,
  userId: String,
  type: String,
  amount: Number,
  status: String,
  hospital: String,
  claimNumber: String,
  submittedAt: Date,
  resolvedAt: Date
});

const Plan = mongoose.model('Plan', PlanSchema);
const Policy = mongoose.model('Policy', PolicySchema);
const Claim = mongoose.model('Claim', ClaimSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'insurance-aggregator' }));

// Plans
app.get('/api/plans', async (req, res) => {
  const { type, category, minAge, maxAge, sort = 'premium_low' } = req.query;
  const query: any = {};
  if (type) query.type = type;
  if (category) query.category = category;
  if (minAge) query.minAge = { $lte: parseInt(minAge as string) };
  if (maxAge) query.maxAge = { $gte: parseInt(maxAge as string) };

  let plans = await Plan.find(query);
  if (sort === 'premium_low') plans.sort((a: any, b: any) => a.premium - b.premium);
  if (sort === 'premium_high') plans.sort((a: any, b: any) => b.premium - a.premium);
  if (sort === 'sum_assured') plans.sort((a: any, b: any) => b.sumAssured - a.sumAssured);

  res.json({ success: true, plans });
});

app.get('/api/plans/compare', async (req, res) => {
  const { planIds } = req.query;
  const ids = (planIds as string).split(',');
  const plans = await Plan.find({ planId: { $in: ids } });
  res.json({ success: true, plans });
});

app.get('/api/plans/:id', async (req, res) => {
  const plan = await Plan.findOne({ planId: req.params.id });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json({ success: true, plan });
});

// Quote
app.post('/api/quote', async (req, res) => {
  const { age, members, type, coverage } = req.body;
  const plans = await Plan.find({ type: type || 'individual' });
  const quotes = plans.map(p => ({
    planId: p.planId,
    provider: p.provider,
    name: p.name,
    sumAssured: p.sumAssured,
    premium: Math.round(p.premium * (1 + (age - 30) * 0.05)),
    coverage: p.coverage
  }));
  res.json({ success: true, quotes });
});

// Policies
app.post('/api/policies', async (req, res) => {
  const policy = await Policy.create({
    policyId: `pol_${uuidv4()}`,
    policyNumber: `POL${Date.now()}`,
    status: 'active',
    ...req.body
  });
  ecosystem.rabtul.sendPushNotification(req.body.userId, 'Policy Activated', `Your ${req.body.planName} policy is now active`).catch(() => {});
  res.status(201).json({ success: true, policy });
});

app.get('/api/policies/:userId', async (req, res) => {
  const policies = await Policy.find({ userId: req.params.userId });
  res.json({ success: true, policies });
});

// Claims
app.post('/api/claims', async (req, res) => {
  const claim = await Claim.create({
    claimId: `clm_${uuidv4()}`,
    claimNumber: `CLM${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date(),
    ...req.body
  });
  res.status(201).json({ success: true, claim });
});

app.get('/api/claims/:userId', async (req, res) => {
  const claims = await Claim.find({ userId: req.params.userId });
  res.json({ success: true, claims });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Insurance Aggregator started on port ${PORT}`));
}
start();
export default app;
