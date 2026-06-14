import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { transferService } from '../services/transferService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { pickup, dropoff, passengers } = req.query;
  const transfers = await transferService.searchTransfers(pickup as string, dropoff as string, passengers ? parseInt(passengers as string) : undefined);
  res.json({ success: true, data: transfers, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/book', [body('transferType').isIn(['sedan', 'suv', 'minivan', 'luxury']), body('pickup.location').notEmpty(), body('pickup.time').notEmpty(), body('dropoff.location').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const { transferType, pickup, dropoff } = req.body;
  const booking = await transferService.bookTransfer(userId, transferType, pickup, dropoff);
  res.status(201).json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/bookings/my', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  const bookings = await transferService.getUserBookings(userId);
  res.json({ success: true, data: bookings, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/bookings/:bookingId', [param('bookingId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const booking = await transferService.getBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/bookings/:bookingId/cancel', [param('bookingId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const booking = await transferService.cancelBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;