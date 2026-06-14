/**
 * REZ Safe QR Service - Enhanced Features
 * Simplified version with core integrations
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

// Simple logger
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string, err?: Error) => console.error(`[ERROR] ${msg}`, err?.message),
};

// Constants
const CARE_API = process.env.CARE_SERVICE_URL || '';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Schemas
const CreateTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

const router = express.Router();

// Support ticket creation
router.post('/support/ticket', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
      return;
    }

    const { title, description, customer_id, customer_name, category, priority } = parsed.data;

    if (CARE_API) {
      try {
        const response = await fetch(`${CARE_API}/api/auto-tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN
          },
          body: JSON.stringify({
            title,
            description,
            customer_id,
            customer_name,
            category: category || 'safe_qr',
            priority: priority || 'medium',
            source: 'safe-qr'
          })
        });
        const data = await response.json() as { data?: { _id?: string }; ticket_id?: string };
        res.json({ success: true, ticket_id: data.data?._id || data.ticket_id });
        return;
      } catch {
        // Fall through to mock response
      }
    }

    res.json({
      success: true,
      ticket_id: `TICKET-${Date.now()}`,
      message: 'Support ticket created (mock mode)'
    });
  } catch (err) {
    logger.error('Support ticket error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// QR scan analytics
router.get('/analytics/scans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, mode } = req.query;
    const match: Record<string, unknown> = {};

    if (from && to) {
      match.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }
    if (mode) {
      match.mode = mode;
    }

    const [total, byMode] = await Promise.all([
      mongoose.model('SafeQR').countDocuments(match),
      mongoose.model('SafeQR').aggregate([
        { $match: match },
        { $group: { _id: '$mode', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      total_scans: total,
      by_mode: byMode,
      period: { from, to }
    });
  } catch (err) {
    logger.error('Analytics error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User engagement stats
router.get('/analytics/engagement/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const [totalScans, totalMessages, lastActivity] = await Promise.all([
      mongoose.model('SafeQR').countDocuments({ userId }),
      mongoose.model('SafeQRMessage').countDocuments({ userId }),
      mongoose.model('SafeQR').findOne({ userId }).sort({ createdAt: -1 }).select('createdAt')
    ]);

    res.json({
      user_id: userId,
      total_scans: totalScans,
      total_messages: totalMessages,
      last_activity: lastActivity?.get('createdAt'),
      engagement_score: Math.min(100, (totalScans * 5) + (totalMessages * 10))
    });
  } catch (err) {
    logger.error('Engagement error', err as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
