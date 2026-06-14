/**
 * REZ QR Admin Service
 * QR code verification and admin dashboard
 * 
 * @author REZ Team
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import { z } from 'zod';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const verificationSchema = new mongoose.Schema({
  qrCode: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['payment', 'menu', 'loyalty', 'warranty', 'product', 'feedback'], required: true },
  scannedAt: { type: Date, default: Date.now },
  location: { lat: Number, lng: Number },
  device: String,
  userId: String,
  userAgent: String,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['valid', 'invalid', 'expired', 'used'], default: 'valid' }
});
const Verification = mongoose.models.Verification || mongoose.model('Verification', verificationSchema);

const qrCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  merchantId: String,
  type: String,
  data: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  expiresAt: Date,
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const QRCode = mongoose.models.QRCode || mongoose.model('QRCode', qrCodeSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'verify-qr-admin' }));

// Verify QR code
app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { qrCode, merchantId, type, location, device, userId } = req.body;
    const qr = await QRCode.findOne({ code: qrCode, status: 'active' });
    if (!qr) return res.json({ success: true, valid: false, reason: 'QR code not found' });
    if (qr.expiresAt && qr.expiresAt < new Date()) return res.json({ success: true, valid: false, reason: 'QR code expired' });
    if (qr.usageLimit && qr.usageCount >= qr.usageLimit) return res.json({ success: true, valid: false, reason: 'QR code usage limit reached' });
    
    const verification = new Verification({ qrCode, merchantId, type: type || qr.type, scannedAt: new Date(), location, device, userId });
    await verification.save();
    await QRCode.findByIdAndUpdate(qr._id, { $inc: { usageCount: 1 } });
    
    res.json({ success: true, valid: true, data: qr });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get verifications
app.get('/api/verifications', async (req: Request, res: Response) => {
  try {
    const { merchantId, startDate, endDate, type, status } = req.query;
    const query: any = {};
    if (merchantId) query.merchantId = merchantId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate) query.scannedAt = { $gte: new Date(startDate as string) };
    if (endDate) query.scannedAt = { ...query.scannedAt, $lte: new Date(endDate as string) };
    const data = await Verification.find(query).sort({ scannedAt: -1 }).limit(500);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Stats
app.get('/api/stats/:merchantId', async (req: Request, res: Response) => {
  try {
    const total = await Verification.countDocuments({ merchantId: req.params.merchantId });
    const today = new Date(); today.setHours(0,0,0,0);
    const todayCount = await Verification.countDocuments({ merchantId: req.params.merchantId, scannedAt: { $gte: today } });
    const byType = await Verification.aggregate([{ $match: { merchantId: req.params.merchantId } }, { $group: { _id: '$type', count: { $sum: 1 } } }]);
    const byStatus = await Verification.aggregate([{ $match: { merchantId: req.params.merchantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, data: { total, today: todayCount, byType, byStatus } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create QR codes
app.post('/api/qr-codes', async (req: Request, res: Response) => {
  try {
    const qr = new QRCode(req.body);
    await qr.save();
    res.json({ success: true, data: qr });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// List QR codes
app.get('/api/qr-codes/:merchantId', async (req: Request, res: Response) => {
  try {
    const codes = await QRCode.find({ merchantId: req.params.merchantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4069;
app.listen(PORT, () => logger.info(`verify-qr-admin on port ${PORT}`));
export default app;
