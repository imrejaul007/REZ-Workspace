/**
 * QBR Routes - API endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { qbrService } from '../services/qbrService';
import { reportService } from '../services/reportService';
import { logger } from 'utils/logger.js';

const router = Router();

const createQBRSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  year: z.number().min(2020).max(2030),
  scheduledDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  meetingLink: z.string().optional(),
});

// POST /api/qbr - Create QBR
router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = createQBRSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Validation error', details: parseResult.error.errors });
      return;
    }

    const qbr = await qbrService.createQBR({
      ...parseResult.data,
      scheduledDate: parseResult.data.scheduledDate ? new Date(parseResult.data.scheduledDate) : undefined,
    });

    res.status(201).json({ success: true, data: qbr });
  } catch (error) {
    logger.error('Error creating QBR', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/qbr/:id - Get QBR
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const qbr = await qbrService.getQBR(req.params.id);
    if (!qbr) {
      res.status(404).json({ success: false, error: 'QBR not found' });
      return;
    }
    res.json({ success: true, data: qbr });
  } catch (error) {
    logger.error('Error getting QBR', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/qbr/:id - Update QBR
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const qbr = await qbrService.updateQBR(req.params.id, req.body);
    if (!qbr) {
      res.status(404).json({ success: false, error: 'QBR not found' });
      return;
    }
    res.json({ success: true, data: qbr });
  } catch (error) {
    logger.error('Error updating QBR', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/qbr/:id/generate - Generate QBR content
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const qbr = await qbrService.generateQBR(req.params.id);
    res.json({ success: true, data: qbr });
  } catch (error) {
    logger.error('Error generating QBR', { error });
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// GET /api/qbr/:id/report - Get QBR report
router.get('/:id/report', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as any) || 'pdf';
    const report = await reportService.generateReport(req.params.id, format);
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error generating report', { error });
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// GET /api/qbr/schedule - Get scheduled QBRs
router.get('/schedule', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const qbrs = await qbrService.getUpcomingQBRs(days);
    res.json({ success: true, data: { count: qbrs.length, qbrs } });
  } catch (error) {
    logger.error('Error getting scheduled QBRs', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/qbr/customer/:customerId - Get QBRs by customer
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const qbrs = await qbrService.getQBRsByCustomer(req.params.customerId);
    res.json({ success: true, data: { count: qbrs.length, qbrs } });
  } catch (error) {
    logger.error('Error getting customer QBRs', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/qbr/quarter/:quarter/:year - Get QBRs by quarter
router.get('/quarter/:quarter/:year', async (req: Request, res: Response) => {
  try {
    const quarter = req.params.quarter as any;
    const year = parseInt(req.params.year);
    const qbrs = await qbrService.getQBRsByQuarter(quarter, year);
    res.json({ success: true, data: { count: qbrs.length, qbrs } });
  } catch (error) {
    logger.error('Error getting quarter QBRs', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;