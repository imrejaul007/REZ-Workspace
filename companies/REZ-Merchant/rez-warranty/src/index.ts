/**
 * REZ Warranty Service
 * Warranty management and claims processing
 * 
 * @author REZ Team
 * @version 1.0.0
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { z } from 'zod';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============== SCHEMAS ==============

const warrantySchema = new mongoose.Schema({
  productId: { type: String, required: true },
  merchantId: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  serialNumber: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, required: true },
  warrantyEnd: { type: Date, required: true },
  warrantyPeriod: { type: Number, default: 12 }, // months
  productName: String,
  productCategory: String,
  productBrand: String,
  productPrice: Number,
  status: { type: String, enum: ['active', 'expired', 'claimed', 'transferred'], default: 'active' },
  claims: [{
    claimId: String,
    claimDate: Date,
    issue: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'] },
    resolution: String,
    claimAmount: Number,
    notes: String
  }],
  transferHistory: [{
    fromCustomerId: String,
    toCustomerId: String,
    transferDate: Date,
    verified: Boolean
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const claimSchema = new mongoose.Schema({
  warrantyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
  merchantId: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  serialNumber: String,
  productName: String,
  purchaseDate: Date,
  issue: { type: String, required: true },
  issueDescription: String,
  issueCategory: { type: String, enum: ['defective', 'malfunction', 'damaged', 'missing_parts', 'other'] },
  status: { type: String, enum: ['submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'resolved', 'closed'], default: 'submitted' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  claimAmount: Number,
  approvedAmount: Number,
  resolution: String,
  resolutionDate: Date,
  assignedTo: String,
  notes: [{ text: String, addedBy: String, addedAt: Date }],
  attachments: [{
    type: String,
    url: String,
    uploadedAt: Date
  }],
  timeline: [{
    status: String,
    timestamp: Date,
    updatedBy: String,
    comment: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Warranty = mongoose.models.Warranty || mongoose.model('Warranty', warrantySchema);
const Claim = mongoose.models.Claim || mongoose.model('Claim', claimSchema);

// ============== ROUTES ==============

/** Health check */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-warranty', timestamp: new Date().toISOString() });
});

/** Create warranty */
app.post('/api/warranties', async (req: Request, res: Response) => {
  try {
    const warranty = new Warranty({
      ...req.body,
      warrantyEnd: new Date(req.body.purchaseDate.getTime() + req.body.warrantyPeriod * 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await warranty.save();
    logger.info('Warranty created', { warrantyId: warranty._id, serialNumber: warranty.serialNumber });
    res.json({ success: true, data: warranty });
  } catch (error) {
    logger.error('Error creating warranty:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** List warranties by merchant */
app.get('/api/warranties/:merchantId', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (status) query.status = status;
    
    const warranties = await Warranty.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    
    const total = await Warranty.countDocuments(query);
    
    res.json({ success: true, data: warranties, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Get warranty by serial number */
app.get('/api/warranties/serial/:serialNumber', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findOne({ serialNumber: req.params.serialNumber });
    if (!warranty) return res.status(404).json({ success: false, error: 'Warranty not found' });
    res.json({ success: true, data: warranty });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Get single warranty */
app.get('/api/warranties/detail/:id', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ success: false, error: 'Warranty not found' });
    res.json({ success: true, data: warranty });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Validate warranty */
app.get('/api/warranties/validate/:id', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ success: false, error: 'Warranty not found' });
    
    const now = new Date();
    const isValid = warranty.warrantyEnd > now && warranty.status === 'active';
    const daysRemaining = Math.ceil((warranty.warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      data: {
        valid: isValid,
        serialNumber: warranty.serialNumber,
        productName: warranty.productName,
        purchaseDate: warranty.purchaseDate,
        warrantyEnd: warranty.warrantyEnd,
        daysRemaining: Math.max(0, daysRemaining),
        status: warranty.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Update warranty */
app.put('/api/warranties/:id', async (req: Request, res: Response) => {
  try {
    const warranty = await Warranty.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    if (!warranty) return res.status(404).json({ success: false, error: 'Warranty not found' });
    res.json({ success: true, data: warranty });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Transfer warranty */
app.post('/api/warranties/:id/transfer', async (req: Request, res: Response) => {
  try {
    const { toCustomerId, toCustomerName, toCustomerPhone, toCustomerEmail } = req.body;
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ success: false, error: 'Warranty not found' });
    
    warranty.transferHistory.push({
      fromCustomerId: warranty.customerId,
      toCustomerId,
      transferDate: new Date(),
      verified: false
    });
    warranty.customerId = toCustomerId;
    warranty.customerName = toCustomerName;
    warranty.customerPhone = toCustomerPhone;
    warranty.customerEmail = toCustomerEmail;
    warranty.updatedAt = new Date();
    await warranty.save();
    
    res.json({ success: true, data: warranty, message: 'Warranty transferred successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============== CLAIMS ==============

/** Submit claim */
app.post('/api/claims', async (req: Request, res: Response) => {
  try {
    const claim = new Claim({
      ...req.body,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [{ status: 'submitted', timestamp: new Date() }]
    });
    await claim.save();
    logger.info('Claim submitted', { claimId: claim._id, warrantyId: claim.warrantyId });
    res.json({ success: true, data: claim });
  } catch (error) {
    logger.error('Error submitting claim:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** List claims by merchant */
app.get('/api/claims/:merchantId', async (req: Request, res: Response) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const claims = await Claim.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    const total = await Claim.countDocuments(query);
    
    res.json({ success: true, data: claims, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Get single claim */
app.get('/api/claims/detail/:id', async (req: Request, res: Response) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Update claim status */
app.put('/api/claims/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes, updatedBy } = req.body;
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    
    claim.status = status;
    claim.updatedAt = new Date();
    claim.timeline.push({ status, timestamp: new Date(), updatedBy, comment: notes });
    
    if (status === 'resolved') claim.resolutionDate = new Date();
    
    await claim.save();
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Approve claim */
app.put('/api/claims/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedAmount, notes } = req.body;
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAmount, updatedAt: new Date() },
      { new: true }
    );
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Reject claim */
app.put('/api/claims/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', resolution: reason, updatedAt: new Date() },
      { new: true }
    );
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Resolve claim */
app.put('/api/claims/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { resolution, approvedAmount } = req.body;
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolution, approvedAmount, resolutionDate: new Date(), updatedAt: new Date() },
      { new: true }
    );
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
    
    // Update warranty claim history
    await Warranty.findByIdAndUpdate(claim.warrantyId, {
      $push: { claims: { claimId: claim._id, claimDate: new Date(), status: 'resolved', resolution } }
    });
    
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/** Add note to claim */
app.post('/api/claims/:id/notes', async (req: Request, res: Response) => {
  try {
    const { text, addedBy } = req.body;
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text, addedBy, addedAt: new Date() } } },
      { new: true }
    );
    res.json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============== STATS ==============

/** Get warranty stats */
app.get('/api/stats/:merchantId', async (req: Request, res: Response) => {
  try {
    const total = await Warranty.countDocuments({ merchantId: req.params.merchantId });
    const active = await Warranty.countDocuments({ merchantId: req.params.merchantId, status: 'active' });
    const expired = await Warranty.countDocuments({ merchantId: req.params.merchantId, status: 'expired' });
    const claimed = await Warranty.countDocuments({ merchantId: req.params.merchantId, status: 'claimed' });
    
    const claimsTotal = await Claim.countDocuments({ merchantId: req.params.merchantId });
    const claimsPending = await Claim.countDocuments({ merchantId: req.params.merchantId, status: 'submitted' });
    const claimsApproved = await Claim.countDocuments({ merchantId: req.params.merchantId, status: 'approved' });
    const claimsResolved = await Claim.countDocuments({ merchantId: req.params.merchantId, status: 'resolved' });
    
    res.json({
      success: true,
      data: {
        warranties: { total, active, expired, claimed },
        claims: { total: claimsTotal, pending: claimsPending, approved: claimsApproved, resolved: claimsResolved }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============== SERVER ==============

const PORT = process.env.PORT || 4620;
app.listen(PORT, () => logger.info(`rez-warranty service started on port ${PORT}`));

export default app;
