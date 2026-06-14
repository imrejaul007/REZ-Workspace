/**
 * BIZORA Database Service
 * MongoDB schemas and connection management
 */

import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// ============================================================================
// MONGOOSE CONNECTION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('✅ MongoDB connected'))
  .catch(err => logger.error('❌ MongoDB error:', err));

// ============================================================================
// SCHEMAS
// ============================================================================

// 1. Business Schema
const businessSchema = new mongoose.Schema({
  bizoraId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['mainland', 'freezone'], required: true },
  activity: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },
  gst: String,
  pan: String,
  stage: { type: String, enum: ['idea', 'startup', 'early', 'growth', 'established', 'scaling'] },
  industry: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  subscriptions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Business = mongoose.model('Business', businessSchema);

// 2. User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  name: String,
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  role: { type: String, enum: ['owner', 'admin', 'manager', 'staff'], default: 'owner' },
  authProvider: { type: String, enum: ['rabtul', 'google', 'email'], default: 'rabtul' },
  rabtulUserId: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

// 3. Vendor Schema
const vendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true },
  businessName: { type: String, required: true },
  ownerName: String,
  email: String,
  phone: String,
  location: {
    city: String,
    state: String,
    country: String
  },
  services: [String],
  rating: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  responseTime: String,
  priceRange: {
    min: Number,
    max: Number
  },
  type: { type: String, enum: ['automated', 'manual', 'hybrid'], default: 'hybrid' },
  verified: { type: Boolean, default: false },
  trustScore: { type: Number, default: 0 },
  commission: { type: Number, default: 20 },
  status: { type: String, enum: ['active', 'busy', 'offline'], default: 'active' },
  currentJobs: { type: Number, default: 0 },
  maxJobs: { type: Number, default: 5 },
  earnings: {
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

// 4. Lead Schema
const leadSchema = new mongoose.Schema({
  leadId: { type: String, required: true, unique: true },
  businessName: String,
  contactName: String,
  email: String,
  phone: String,
  location: {
    city: String,
    state: String
  },
  category: String,
  requirements: String,
  budget: Number,
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  assignedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  commission: { type: Number, default: 20 },
  completionDetails: {
    completedAt: Date,
    actualPrice: Number,
    workDone: String,
    deliverables: [String],
    rating: Number,
    review: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

// 5. Task Schema
const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  category: String,
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'awaiting_approval', 'completed', 'disputed'],
    default: 'assigned'
  },
  progress: { type: Number, default: 0 },
  steps: [{
    step: Number,
    name: String,
    automated: Boolean,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'] },
    completedAt: Date,
    notes: String
  }],
  timeline: [{
    step: String,
    status: String,
    time: Date
  }],
  estimatedCompletion: Date,
  actualCompletion: Date,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// 6. Trust Score Schema
const trustScoreSchema = new mongoose.Schema({
  businessId: { type: String, required: true, unique: true },
  overall: { type: Number, default: 0 },
  letterGrade: { type: String, enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'] },
  breakdown: {
    paymentBehavior: { type: Number, default: 0 },
    complianceHistory: { type: Number, default: 0 },
    deliveryQuality: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 },
    operationalStability: { type: Number, default: 0 }
  },
  history: [{
    date: Date,
    overall: Number,
    paymentBehavior: Number
  }],
  updatedAt: { type: Date, default: Date.now }
});

const TrustScore = mongoose.model('TrustScore', trustScoreSchema);

// 7. Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  businessId: String,
  type: { type: String, enum: ['payment', 'refund', 'commission', 'withdrawal', 'deposit'] },
  amount: Number,
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'failed'] },
  paymentMethod: String,
  razorpayId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// 8. Contract Schema
const contractSchema = new mongoose.Schema({
  contractId: { type: String, required: true, unique: true },
  title: String,
  type: { type: String, enum: ['vendor', 'employee', 'lease', 'service', 'nda', 'partnership'] },
  parties: [{
    name: String,
    email: String,
    role: String
  }],
  status: { type: String, enum: ['draft', 'pending_signature', 'active', 'expired', 'terminated'] },
  value: Number,
  startDate: Date,
  endDate: Date,
  terms: String,
  signatures: [{
    partyId: String,
    signedAt: Date,
    method: String
  }],
  businessId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Contract = mongoose.model('Contract', contractSchema);

// ============================================================================
// API ROUTES - BUSINESS
// ============================================================================

app.get('/health', async (_req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: 'ok',
    mongodb: state === 1 ? 'connected' : 'disconnected',
    models: ['Business', 'User', 'Vendor', 'Lead', 'Task', 'TrustScore', 'Transaction', 'Contract']
  });
});

// Create business
app.post('/api/businesses', async (req, res) => {
  try {
    const bizoraId = `biz_${Date.now()}`;
    const business = new Business({ ...req.body, bizoraId });
    await business.save();
    res.status(201).json(business);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all businesses
app.get('/api/businesses', async (req, res) => {
  const { industry, city, status } = req.query;
  const filter: any = {};
  if (industry) filter.industry = industry;
  if (city) filter['location.city'] = city;
  if (status) filter.status = status;

  const businesses = await Business.find(filter).populate('owner');
  res.json({ businesses, total: businesses.length });
});

// Get single business
app.get('/api/businesses/:id', async (req, res) => {
  const business = await Business.findOne({ bizoraId: req.params.id }).populate('owner');
  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
});

// Update business
app.put('/api/businesses/:id', async (req, res) => {
  const business = await Business.findOneAndUpdate(
    { bizoraId: req.params.id },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
});

// ============================================================================
// API ROUTES - VENDORS
// ============================================================================

// Create vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const vendorId = `vendor_${Date.now()}`;
    const vendor = new Vendor({ ...req.body, vendorId });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get vendors
app.get('/api/vendors', async (req, res) => {
  const { category, city, type, minRating } = req.query;
  const filter: any = {};
  if (category) filter.services = category;
  if (city) filter['location.city'] = city;
  if (type) filter.type = type;
  if (minRating) filter.rating = { $gte: parseFloat(minRating as string) };

  const vendors = await Vendor.find(filter);
  res.json({ vendors, total: vendors.length });
});

// Update vendor
app.put('/api/vendors/:id', async (req, res) => {
  const vendor = await Vendor.findOneAndUpdate(
    { vendorId: req.params.id },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  res.json(vendor);
});

// ============================================================================
// API ROUTES - LEADS
// ============================================================================

// Create lead
app.post('/api/leads', async (req, res) => {
  try {
    const leadId = `lead_${Date.now()}`;
    const lead = new Lead({ ...req.body, leadId });
    await lead.save();
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get leads
app.get('/api/leads', async (req, res) => {
  const { status, vendorId, category } = req.query;
  const filter: any = {};
  if (status) filter.status = status;
  if (vendorId) filter.assignedVendor = vendorId;
  if (category) filter.category = category;

  const leads = await Lead.find(filter).populate('assignedVendor');
  res.json({ leads, total: leads.length });
});

// Update lead
app.put('/api/leads/:id', async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { leadId: req.params.id },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// ============================================================================
// API ROUTES - TASKS
// ============================================================================

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskId = `task_${Date.now()}`;
    const task = new Task({ ...req.body, taskId });
    await task.save();
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get tasks
app.get('/api/tasks', async (req, res) => {
  const { vendorId, status } = req.query;
  const filter: any = {};
  if (vendorId) filter.vendorId = vendorId;
  if (status) filter.status = status;

  const tasks = await Task.find(filter).populate('leadId vendorId');
  res.json({ tasks, total: tasks.length });
});

// Update task step
app.put('/api/tasks/:id/steps/:step', async (req, res) => {
  const { status, notes } = req.body;
  const stepNum = parseInt(req.params.step);

  const task: any = await Task.findOne({ taskId: req.params.id });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const step = task.steps.find((s: any) => s.step === stepNum);
  if (!step) return res.status(404).json({ error: 'Step not found' });

  step.status = status;
  if (notes) step.notes = notes;
  if (status === 'completed') step.completedAt = new Date();

  task.progress = Math.round(
    task.steps.filter((s: any) => s.status === 'completed').length / task.steps.length * 100
  );

  if (task.progress === 100) task.status = 'awaiting_approval';

  await task.save();
  res.json(task);
});

// ============================================================================
// API ROUTES - TRUST SCORES
// ============================================================================

// Get or create trust score
app.get('/api/trust-scores/:businessId', async (req, res) => {
  let score = await TrustScore.findOne({ businessId: req.params.businessId });

  if (!score) {
    score = new TrustScore({
      businessId: req.params.businessId,
      overall: 50,
      breakdown: {
        paymentBehavior: 50,
        complianceHistory: 50,
        deliveryQuality: 50,
        responseTime: 50,
        customerSatisfaction: 50,
        operationalStability: 50
      }
    });
    await score.save();
  }

  res.json(score);
});

// Update trust score
app.put('/api/trust-scores/:businessId', async (req, res) => {
  const score = await TrustScore.findOneAndUpdate(
    { businessId: req.params.businessId },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );
  if (!score) return res.status(404).json({ error: 'Score not found' });
  res.json(score);
});

// ============================================================================
// API ROUTES - TRANSACTIONS
// ============================================================================

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = new Transaction({ ...req.body, transactionId });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
  const { businessId, type, status } = req.query;
  const filter: any = {};
  if (businessId) filter.businessId = businessId;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
  res.json({ transactions, total: transactions.length });
});

// ============================================================================
// API ROUTES - CONTRACTS
// ============================================================================

// Create contract
app.post('/api/contracts', async (req, res) => {
  try {
    const contractId = `contract_${Date.now()}`;
    const contract = new Contract({ ...req.body, contractId });
    await contract.save();
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get contracts
app.get('/api/contracts', async (req, res) => {
  const { businessId, status, type } = req.query;
  const filter: any = {};
  if (businessId) filter.businessId = businessId;
  if (status) filter.status = status;
  if (type) filter.type = type;

  const contracts = await Contract.find(filter);
  res.json({ contracts, total: contracts.length });
});

// ============================================================================
// AGGREGATIONS
// ============================================================================

// Dashboard stats
app.get('/api/stats/dashboard', async (req, res) => {
  const [businessCount, vendorCount, leadCount, transactionSum] = await Promise.all([
    Business.countDocuments(),
    Vendor.countDocuments(),
    Lead.countDocuments(),
    Transaction.aggregate([
      { $match: { type: 'payment', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  res.json({
    businesses: businessCount,
    vendors: vendorCount,
    leads: leadCount,
    totalRevenue: transactionSum[0]?.total || 0,
    activeBusinesses: await Business.countDocuments({ status: 'active' }),
    verifiedVendors: await Vendor.countDocuments({ verified: true }),
    pendingLeads: await Lead.countDocuments({ status: 'new' }),
    completedTasks: await Task.countDocuments({ status: 'completed' })
  });
});

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 4096;
app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════════════════╗
║  🗄️  BIZORA Database Service                   ║
║  MongoDB + Mongoose Schemas                    ║
║  Port: ${PORT}                                    ║
║  Models: 8                                      ║
╚════════════════════════════════════════════════════╝
  `);
});
