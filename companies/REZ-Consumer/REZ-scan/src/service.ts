/**
 * REZ Scan - Universal QR Scanner Service
 * Connects to: REZ-Intent-Graph, verify-qr, REZ-Agent
 */

import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3017', 10);

// Connections
const INTENT_API = process.env.INTENT_API || 'https://rez-intent-graph.onrender.com';
const VERIFY_API = process.env.VERIFY_API || 'https://rez-verify-qr.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';

// QR Types
const QR_TYPES = {
  PAYMENT: 'payment',
  RESTAURANT: 'restaurant',
  PRODUCT: 'product',
  EVENT: 'event',
  LOYALTY: 'loyalty',
  CREATOR: 'creator',
  VERIFY: 'verify',
  SMART_LINK: 'smart_link',
  GENERAL: 'general'
};

// Models
const ScanEvent = mongoose.model('ScanEvent', new mongoose.Schema({
  scan_id: String,
  user_id: String,
  qr_type: String,
  qr_content: String,
  merchant_id: String,
  location: { lat: Number, lng: Number, city: String },
  timestamp: { type: Date, default: Date.now },
  action_taken: String,
  intent: [String]
}));

// Parse QR type
function parseQR(qrContent: string): { type: string; data: unknown } {
  if (qrContent.startsWith('REZ:')) {
    const parts = qrContent.split(':');
    return { type: parts[1], data: parts[2] };
  }
  if (qrContent.includes('razorpay') || qrContent.includes('paytm') || qrContent.includes('upi')) {
    return { type: QR_TYPES.PAYMENT, data: qrContent };
  }
  if (qrContent.includes('menu') || qrContent.includes('restaurant')) {
    return { type: QR_TYPES.RESTAURANT, data: qrContent };
  }
  if (qrContent.startsWith('REZWARRANTY') || qrContent.includes('verify')) {
    return { type: QR_TYPES.VERIFY, data: qrContent };
  }
  return { type: QR_TYPES.GENERAL, data: qrContent };
}

// POST /api/scan
app.post('/api/scan', async (req, res) => {
  const { qr_content, user_id, location, device_id } = req.body;

  // Parse QR
  const { type, data } = parseQR(qr_content);

  // Save scan event
  const scan = new ScanEvent({
    scan_id: `SCAN-${Date.now()}`,
    user_id,
    qr_type: type,
    qr_content,
    location,
    action_taken: 'scanned',
    timestamp: new Date()
  });
  await scan.save();

  // Track to Intent Graph
  try {
    await axios.post(`${INTENT_API}/api/intent/track`, {
      user_id,
      intent_type: 'qr_scan',
      entities: { qr_type: type, merchant_id: data },
      action: 'scan',
      context: { location, device_id }
    });
  } catch (e) {
    console.error('REZ Scan error:', e instanceof Error ? e.message : String(e));
  }

  // Route to appropriate service
  let response: unknown = { type, data, scanned: true };

  if (type === QR_TYPES.VERIFY) {
    // Forward to verify-qr
    try {
      const verify = await axios.post(`${VERIFY_API}/api/verify`, {
        serial_number: data,
        user_id,
        location,
        device_id
      });
      response = { ...response, ...verify.data };
    } catch (e) {
    console.error('REZ Scan error:', e instanceof Error ? e.message : String(e));
  }
  }

  if (type === QR_TYPES.PRODUCT) {
    // Get product info
    response.action = 'view_product';
  }

  if (type === QR_TYPES.RESTAURANT) {
    // Get menu
    response.action = 'view_menu';
  }

  res.json(response);
});

// GET /api/scan/history
app.get('/api/scan/history/:userId', async (req, res) => {
  const scans = await ScanEvent.find({ user_id: req.params.userId })
    .sort({ timestamp: -1 })
    .limit(50);
  res.json({ scans });
});

// GET /api/scan/stats
app.get('/api/scan/stats/:userId', async (req, res) => {
  const stats = await ScanEvent.aggregate([
    { $match: { user_id: req.params.userId } },
    { $group: { _id: '$qr_type', count: { $sum: 1 } } }
  ]);
  res.json({ stats });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-scan',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-scan';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`REZ Scan connected to MongoDB`);
    app.listen(PORT, () => {
      console.log(`REZ Scan started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start anyway for development without MongoDB
    app.listen(PORT, () => {
      console.log(`REZ Scan started on port ${PORT} (without MongoDB)`);
    });
  });

export default app;
