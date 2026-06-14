/**
 * Billing Routes
 *
 * Endpoints for guest billing and invoicing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { billingService } from '../services/billing.service';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[billing-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const addItemSchema = z.object({
  description: z.string().min(1),
  category: z.enum(['room', 'food', 'minibar', 'laundry', 'spa', 'transport', 'other', 'discount', 'tax', 'fee']),
  amount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['card', 'cash', 'upi', 'wallet', 'bank_transfer']),
  transactionId: z.string().optional(),
});

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Generate invoice for booking
 * POST /api/billing/invoice
 */
router.post('/invoice', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { bookingId } = z.object({
      bookingId: z.string().min(1),
    }).parse(req.body);

    const invoice = await billingService.generateInvoice(bookingId);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    log('Generate invoice error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice' });
  }
});

/**
 * Add billing item to booking
 * POST /api/billing/:bookingId/items
 */
router.post('/:bookingId/items', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const item = addItemSchema.parse(req.body);
    const invoice = await billingService.addBillingItem(req.params.bookingId, item);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({
      success: true,
      data: invoice,
      message: 'Billing item added successfully',
    });
  } catch (error) {
    log('Add billing item error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to add billing item' });
  }
});

/**
 * Process payment
 * POST /api/billing/:bookingId/payment
 */
router.post('/:bookingId/payment', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const input = paymentSchema.parse(req.body);
    const result = await billingService.processPayment(
      req.params.bookingId,
      input.amount,
      input.method,
      input.transactionId
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.error || 'Payment failed' });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    log('Process payment error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

/**
 * Process refund
 * POST /api/billing/:bookingId/refund
 */
router.post('/:bookingId/refund', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const input = refundSchema.parse(req.body);
    const result = await billingService.processRefund(
      req.params.bookingId,
      input.amount,
      input.reason
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.error || 'Refund failed' });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    log('Process refund error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});

/**
 * Get guest billing summary
 * GET /api/billing/guest/:guestId
 */
router.get('/guest/:guestId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const summary = await billingService.getGuestBillingSummary(req.params.guestId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    log('Get guest billing summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get billing summary' });
  }
});

/**
 * Get daily billing report
 * GET /api/billing/report/:hotelId
 */
router.get('/report/:hotelId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date as string) : new Date();

    const report = await billingService.getDailyBillingReport(req.params.hotelId, reportDate);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    log('Get daily billing report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

export default router;
