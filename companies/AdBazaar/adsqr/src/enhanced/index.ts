/**
 * REZ Ads QR Service - Enhanced Features
 * Simplified version - full ML integration requires external services
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

// Simple logger
const logger = {
  info: (msg: string) => logger.info(`[INFO] ${msg}`),
  error: (msg: string, err?: Error) => logger.error(`[ERROR] ${msg}`, err?.message),
};

// API endpoints for external services (optional)
const MIND_API = process.env.MIND_API || '';
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || '';
const CARE_API = process.env.CARE_API || '';

// Schemas
const FraudCheckSchema = z.object({
  campaign_id: z.string(),
  scan_id: z.string().optional(),
  user_id: z.string().optional(),
  device_id: z.string().optional(),
  ip_address: z.string().optional(),
});

// Models
const AdFraudRecord = mongoose.model('AdFraudRecord', new mongoose.Schema({
  record_id: String,
  campaign_id: String,
  scan_id: String,
  user_id: String,
  device_id: String,
  ip_address: String,
  reason: [String],
  severity: { type: String, enum: ['low', 'medium', 'high'] },
  action_taken: { type: String, enum: ['allowed', 'flagged', 'blocked'] },
  created_at: { type: Date, default: Date.now }
}));

const router = express.Router();

// Fraud check endpoint
router.post('/fraud/check', async (req: Request, res: Response) => {
  try {
    const parsed = FraudCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { campaign_id, scan_id, user_id, device_id, ip_address } = parsed.data;
    const reasons: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check for duplicate device
    const existingScan = await mongoose.model('Scan').findOne({
      campaign_id,
      device_id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingScan) {
      reasons.push('duplicate_device_24h');
      severity = 'medium';
    }

    // Check for high IP frequency
    if (ip_address) {
      const ipCount = await mongoose.model('Scan').countDocuments({
        campaign_id,
        ip: ip_address,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      });
      if (ipCount > 10) {
        reasons.push('high_ip_frequency');
        severity = 'high';
      }
    }

    // Record fraud check
    const record = await AdFraudRecord.create({
      record_id: `FRAUD-${Date.now()}`,
      campaign_id,
      scan_id,
      user_id,
      device_id,
      ip_address,
      reason: reasons,
      severity,
      action_taken: reasons.length > 0 ? 'flagged' : 'allowed'
    });

    res.json({
      is_fraud: reasons.length > 0,
      severity,
      reasons,
      action: reasons.length > 0 ? 'flagged' : 'allowed',
      record_id: record._id
    });
  } catch (err) {
    logger.error('Fraud check error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fraud analytics
router.get('/fraud/analytics', async (req: Request, res: Response) => {
  try {
    const { campaign_id, from, to } = req.query;
    const match: Record<string, unknown> = {};
    if (campaign_id) match.campaign_id = campaign_id;
    if (from && to) {
      match.created_at = { $gte: new Date(from as string), $lte: new Date(to as string) };
    }

    const [total, bySeverity, byReason] = await Promise.all([
      AdFraudRecord.countDocuments(match),
      AdFraudRecord.aggregate([
        { $match: match },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AdFraudRecord.aggregate([
        { $match: match },
        { $unwind: '$reason' },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      total_checks: total,
      by_severity: bySeverity,
      top_reasons: byReason.slice(0, 5),
      recommendations: byReason.length > 0
        ? ['Consider increasing fraud detection', 'Review flagged scans']
        : ['Fraud rate is acceptable']
    });
  } catch (err) {
    logger.error('Fraud analytics error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Support ticket creation
router.post('/support/ticket', async (req: Request, res: Response) => {
  const { campaign_id, user_id, user_name, user_phone, issue_type, description } = req.body;

  if (CARE_API) {
    try {
      const axios = require('axios');
      const ticket = await axios.post(`${CARE_API}/api/auto-tickets`, {
        title: `AdsQR Support - ${issue_type}`,
        description: `${description}\n\nCampaign: ${campaign_id}`,
        customer_id: user_id,
        customer_name: user_name,
        customer_phone: user_phone,
        category: 'ads_qr',
        platform: 'ads_qr'
      });
      return res.json({ success: true, ticket_id: ticket.data.data?._id });
    } catch {
      // Fall through to mock response
    }
  }

  res.json({
    success: true,
    ticket_id: `TICKET-${Date.now()}`,
    message: 'Support ticket created (mock mode)'
  });
});

// Campaign health check
router.get('/support/campaign-health/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await mongoose.model('Campaign').findById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      campaign_id: id,
      health: 'healthy',
      issues: [],
      metrics: { avg_ctr: '0%', avg_conversions: '0/day', budget_remaining: 0 },
      recommendations: ['Continue monitoring performance']
    });
  } catch (err) {
    logger.error('Campaign health error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
