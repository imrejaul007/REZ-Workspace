import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { returnsCore } from '../services/returnsCore.js';
import { ReturnRequestSchema, ReturnStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/returns', (req, res) => {
  try {
    const request = ReturnRequestSchema.parse(req.body);
    const result = returnsCore.createReturn(request);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create return' });
    }
  }
});

router.get('/returns', (req, res) => {
  const { status, orderId } = req.query;
  const results = returnsCore.getAllReturns({
    status: status as ReturnStatus | undefined,
    orderId: orderId as string | undefined
  });
  res.json({ success: true, data: results });
});

router.get('/returns/:id', (req, res) => {
  const returnRecord = returnsCore.getReturn(req.params.id) || returnsCore.getReturn(req.params.id, true);
  if (!returnRecord) {
    return res.status(404).json({ success: false, error: 'Return not found' });
  }
  res.json({ success: true, data: returnRecord });
});

router.patch('/returns/:id/approve', (req, res) => {
  const { refundAmount, refundMethod } = req.body;
  const result = returnsCore.approveReturn(req.params.id, refundAmount, refundMethod);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Return not found' });
  }
  res.json({ success: true, data: result });
});

router.patch('/returns/:id/reject', (req, res) => {
  const { reason } = req.body;
  const result = returnsCore.rejectReturn(req.params.id, reason);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Return not found' });
  }
  res.json({ success: true, data: result });
});

router.patch('/returns/:id/pickup', (req, res) => {
  const { pickupDate, address } = req.body;
  const result = returnsCore.schedulePickup(req.params.id, pickupDate, address);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Return not found' });
  }
  res.json({ success: true, data: result });
});

router.post('/returns/:id/refund', (req, res) => {
  const result = returnsCore.initiateRefund(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, error: 'Return not found' });
  }
  res.json({ success: true, data: result });
});

router.get('/stats', (req, res) => {
  res.json({ success: true, data: returnsCore.getReturnStats() });
});

export default router;
