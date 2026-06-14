/**
 * Fitness Routes - Gym, Fitness Center, Health Club management
 * Route: /api/v1/merchant/fitness
 */

import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// ─── FITNESS MEMBER SCHEMA ────────────────────────────────────────────────────

const fitnessMemberSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  memberId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  membershipId: String,
  membershipName: String,
  joinDate: { type: Date, default: Date.now },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'expired'],
    default: 'active'
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  healthInfo: {
    conditions: [String],
    allergies: [String],
    medications: [String],
    notes: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FitnessMember = mongoose.models.FitnessMember || mongoose.model('FitnessMember', fitnessMemberSchema);

// ─── FITNESS CLASS SCHEMA ─────────────────────────────────────────────────────

const fitnessClassSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  classId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['yoga', 'pilates', 'HIIT', 'cardio', 'strength', 'crossfit', 'zumba', 'spinning', 'boxing', 'other'],
    default: 'other'
  },
  trainerId: String,
  trainerName: String,
  duration: Number, // minutes
  capacity: { type: Number, default: 20 },
  enrolled: { type: Number, default: 0 },
  dayOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: String,
  equipment: [String],
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'all' },
  isActive: { type: Boolean, default: true },
  price: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FitnessClass = mongoose.models.FitnessClass || mongoose.model('FitnessClass', fitnessClassSchema);

// ─── TRAINER SCHEMA ───────────────────────────────────────────────────────────

const trainerSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  trainerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  specialization: [String],
  certifications: [String],
  experience: Number, // years
  bio: String,
  photoUrl: String,
  availability: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Trainer = mongoose.models.Trainer || mongoose.model('Trainer', trainerSchema);

// ─── MEMBERSHIP SCHEMA ───────────────────────────────────────────────────────

const membershipSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  membershipId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  duration: Number, // days
  price: { type: Number, required: true },
  features: [String],
  classAccess: [{ type: String }],
  trainerAccess: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Membership = mongoose.models.Membership || mongoose.model('Membership', membershipSchema);

// ─── ROUTES: MEMBERS ─────────────────────────────────────────────────────────

// GET /fitness/members - Get all fitness members
router.get('/members', async (req, res) => {
  const { merchantId, status, search } = req.query;

  const query: unknown = {};
  if (merchantId) query.merchantId = merchantId;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const members = await FitnessMember.find(query)
    .sort({ name: 1 });

  res.json({ success: true, data: members });
});

// GET /fitness/members/:id - Get single member
router.get('/members/:id', async (req, res) => {
  const member = await FitnessMember.findById(req.params.id);

  if (!member) {
    return res.status(404).json({ success: false, message: 'Fitness member not found' });
  }

  res.json({ success: true, data: member });
});

// ─── ROUTES: CLASSES ──────────────────────────────────────────────────────────

// GET /fitness/classes - Get all fitness classes
router.get('/classes', async (req, res) => {
  const { merchantId, category, trainerId, dayOfWeek, isActive } = req.query;

  const query: unknown = {};
  if (merchantId) query.merchantId = merchantId;
  if (category) query.category = category;
  if (trainerId) query.trainerId = trainerId;
  if (dayOfWeek) query.dayOfWeek = parseInt(dayOfWeek as string);
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const classes = await FitnessClass.find(query)
    .sort({ name: 1 });

  res.json({ success: true, data: classes });
});

// GET /fitness/classes/:id - Get single class
router.get('/classes/:id', async (req, res) => {
  const fitnessClass = await FitnessClass.findById(req.params.id);

  if (!fitnessClass) {
    return res.status(404).json({ success: false, message: 'Fitness class not found' });
  }

  res.json({ success: true, data: fitnessClass });
});

// POST /fitness/classes - Create fitness class
router.post('/classes', async (req, res) => {
  const {
    merchantId,
    classId,
    name,
    description,
    category,
    trainerId,
    trainerName,
    duration,
    capacity,
    dayOfWeek,
    startTime,
    endTime,
    room,
    equipment,
    level,
    price
  } = req.body;

  const fitnessClass = new FitnessClass({
    merchantId,
    classId,
    name,
    description,
    category,
    trainerId,
    trainerName,
    duration,
    capacity,
    dayOfWeek,
    startTime,
    endTime,
    room,
    equipment,
    level,
    price,
    isActive: true
  });

  await fitnessClass.save();
  res.status(201).json({ success: true, data: fitnessClass });
});

// PATCH /fitness/classes/:id - Update fitness class
router.patch('/classes/:id', async (req, res) => {
  const updateData = { ...req.body, updatedAt: new Date() };

  const fitnessClass = await FitnessClass.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!fitnessClass) {
    return res.status(404).json({ success: false, message: 'Fitness class not found' });
  }

  res.json({ success: true, data: fitnessClass });
});

// DELETE /fitness/classes/:id - Delete (deactivate) fitness class
router.delete('/classes/:id', async (req, res) => {
  const fitnessClass = await FitnessClass.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedAt: new Date() },
    { new: true }
  );

  if (!fitnessClass) {
    return res.status(404).json({ success: false, message: 'Fitness class not found' });
  }

  res.json({ success: true, data: fitnessClass });
});

// ─── ROUTES: TRAINERS ────────────────────────────────────────────────────────

// GET /fitness/trainers - Get all trainers
router.get('/trainers', async (req, res) => {
  const { merchantId, specialization, isActive } = req.query;

  const query: unknown = {};
  if (merchantId) query.merchantId = merchantId;
  if (specialization) query.specialization = { $in: [specialization] };
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const trainers = await Trainer.find(query)
    .sort({ name: 1 });

  res.json({ success: true, data: trainers });
});

// GET /fitness/trainers/:id - Get single trainer
router.get('/trainers/:id', async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }

  res.json({ success: true, data: trainer });
});

// POST /fitness/trainers - Create trainer
router.post('/trainers', async (req, res) => {
  const {
    merchantId,
    trainerId,
    name,
    email,
    phone,
    specialization,
    certifications,
    experience,
    bio,
    photoUrl,
    availability
  } = req.body;

  const trainer = new Trainer({
    merchantId,
    trainerId,
    name,
    email,
    phone,
    specialization,
    certifications,
    experience,
    bio,
    photoUrl,
    availability,
    isActive: true
  });

  await trainer.save();
  res.status(201).json({ success: true, data: trainer });
});

// PATCH /fitness/trainers/:id - Update trainer
router.patch('/trainers/:id', async (req, res) => {
  const updateData = { ...req.body, updatedAt: new Date() };

  const trainer = await Trainer.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!trainer) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }

  res.json({ success: true, data: trainer });
});

// ─── ROUTES: MEMBERSHIPS ─────────────────────────────────────────────────────

// GET /fitness/memberships - Get all memberships
router.get('/memberships', async (req, res) => {
  const { merchantId, isActive } = req.query;

  const query: unknown = {};
  if (merchantId) query.merchantId = merchantId;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const memberships = await Membership.find(query)
    .sort({ price: 1 });

  res.json({ success: true, data: memberships });
});

// GET /fitness/memberships/:id - Get single membership
router.get('/memberships/:id', async (req, res) => {
  const membership = await Membership.findById(req.params.id);

  if (!membership) {
    return res.status(404).json({ success: false, message: 'Membership not found' });
  }

  res.json({ success: true, data: membership });
});

// POST /fitness/memberships - Create membership
router.post('/memberships', async (req, res) => {
  const {
    merchantId,
    membershipId,
    name,
    description,
    duration,
    price,
    features,
    classAccess,
    trainerAccess
  } = req.body;

  const membership = new Membership({
    merchantId,
    membershipId,
    name,
    description,
    duration,
    price,
    features,
    classAccess,
    trainerAccess,
    isActive: true
  });

  await membership.save();
  res.status(201).json({ success: true, data: membership });
});

// PATCH /fitness/memberships/:id - Update membership
router.patch('/memberships/:id', async (req, res) => {
  const updateData = { ...req.body, updatedAt: new Date() };

  const membership = await Membership.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!membership) {
    return res.status(404).json({ success: false, message: 'Membership not found' });
  }

  res.json({ success: true, data: membership });
});

// DELETE /fitness/memberships/:id - Delete (deactivate) membership
router.delete('/memberships/:id', async (req, res) => {
  const membership = await Membership.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedAt: new Date() },
    { new: true }
  );

  if (!membership) {
    return res.status(404).json({ success: false, message: 'Membership not found' });
  }

  res.json({ success: true, data: membership });
});

export default router;
