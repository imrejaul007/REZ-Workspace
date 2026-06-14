/**
 * RisaCare Clearinghouse Service
 * Claims processing, EDI 837/270/271
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';
import axios from 'axios';

const PORT = parseInt(process.env.PORT || '4759', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_clearinghouse';

const PROVIDERS = {
  waystar: { baseUrl: process.env.WAYSTAR_URL || 'https://api.waystar.com', apiKey: process.env.WAYSTAR_KEY || '' },
  availity: { baseUrl: process.env.AVAILITY_URL || 'https://api.availity.com', apiKey: process.env.AVAILITY_KEY || '' },
  change: { baseUrl: process.env.CHANGE_URL || 'https://api.changehealthcare.com', apiKey: process.env.CHANGE_KEY || '' }
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Schemas
const ClaimSchema = new mongoose.Schema({
  claimId: String,
  submissionId: String,
  status: { type: String, enum: ['draft', 'submitted', 'accepted', 'rejected', 'paid'], default: 'draft' },
  patient: { memberId: String, name: String, dob: String },
  provider: { npi: String, name: String },
  diagnosis: [String],
  procedures: [{
    cpt: String, units: Number, charge: Number, date: Date
  }],
  totalCharge: Number,
  submittedAt: Date,
  payerResponse: mongoose.Schema.Types.Mixed
});

const Claim = mongoose.model('Claim', ClaimSchema);

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy', service: 'clearinghouse', version: '1.0.0' });
});

// Submit 837 claim
app.post('/api/claims/submit', async (req, res, next) => {
  try {
    const { patient, provider, diagnosis, procedures, payerId } = req.body;
    const totalCharge = procedures.reduce((s, p) => s + (p.charge * p.units), 0);

    const claim = await Claim.create({
      claimId: `CLM${Date.now()}`,
      status: 'submitted',
      patient, provider, diagnosis, procedures, totalCharge,
      submittedAt: new Date()
    });

    // In production: Generate 837 EDI and send to clearinghouse
    logger.info('Claim submitted', { claimId: claim.claimId, payerId });

    res.json({ success: true, claimId: claim.claimId, status: 'submitted' });
  } catch (error) { next(error); }
});

// Check claim status
app.get('/api/claims/:id/status', async (req, res) => {
  const claim = await Claim.findOne({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  res.json({ success: true, claim });
});

// Get pending claims
app.get('/api/claims/pending', async (req, res) => {
  const claims = await Claim.find({ status: { $in: ['submitted', 'accepted'] } }).sort({ submittedAt: -1 });
  res.json({ success: true, claims });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Clearinghouse started on port ${PORT}`));
}

start().catch(e => { logger.error(e); process.exit(1); });
export default app;
