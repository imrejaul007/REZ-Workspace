import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { CheckInOutService } from '../services/checkInOutService';
import { checkInScheduleSchema, checkInReminderSchema, validateBody } from '../utils/validation';

const router = Router();
const service = new CheckInOutService();

// Apply authentication to all routes
router.use(merchantAuth);

/**
 * POST /:bookingId/checkin
 * Perform check-in for a booking
 */
router.post('/:bookingId/checkin', async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const record = await service.checkIn(bookingId, merchantId);
  res.json({ success: true, data: record });
});

/**
 * POST /:bookingId/checkout
 * Perform check-out for a booking
 */
router.post('/:bookingId/checkout', async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const record = await service.checkOut(bookingId, merchantId);
  res.json({ success: true, data: record });
});

/**
 * POST /schedule
 * Schedule check-in/out for a booking
 */
router.post('/schedule', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const validation = validateBody(checkInScheduleSchema)(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.errors });
  }

  const { bookingId, checkInDate, checkOutDate, storeId, roomId, guestName, guestPhone } = validation.data;

  const record = await service.scheduleCheckIn(
    bookingId,
    new Date(checkInDate),
    new Date(checkOutDate),
  );

  // Update additional fields if provided
  if (storeId) (record as unknown).storeId = storeId;
  if (roomId) record.roomId = roomId;
  if (guestName) record.guestName = guestName;
  if (guestPhone) record.guestPhone = guestPhone;
  await record.save();

  res.json({ success: true, data: record });
});

/**
 * GET /upcoming/:storeId
 * Get upcoming check-ins for a store on a specific date
 */
router.get('/upcoming/:storeId', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { storeId } = req.params;
  const { date } = req.query;

  const queryDate = date ? new Date(date as string) : new Date();
  const data = await service.getUpcomingCheckIns(storeId, queryDate);
  res.json({ success: true, data });
});

/**
 * GET /checkout-today/:storeId
 * Get today's check-outs for a store
 */
router.get('/checkout-today/:storeId', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { storeId } = req.params;
  const data = await service.getTodayCheckOuts(storeId);
  res.json({ success: true, data });
});

/**
 * POST /:bookingId/reminder
 * Send a check-in or check-out reminder
 */
router.post('/:bookingId/reminder', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId } = req.params;
  const { type } = req.body;

  if (!type || !['checkin', 'checkout'].includes(type)) {
    res.status(400).json({ success: false, message: 'type must be "checkin" or "checkout"' });
    return;
  }

  await service.sendReminder(bookingId, type);
  res.json({ success: true, message: `Reminder sent for ${type}` });
});

/**
 * POST /:bookingId/auto-checkin
 * Auto check-in a guest (kiosk/app triggered) - requires internal API key
 */
router.post('/:bookingId/auto-checkin', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId } = req.params;
  const record = await service.autoCheckIn(bookingId);
  res.json({ success: true, data: record });
});

/**
 * POST /:bookingId/auto-checkout
 * Auto check-out a guest (scheduled job/app triggered) - requires internal API key
 */
router.post('/:bookingId/auto-checkout', async (req: Request, res: Response) => {
  const merchantId = req.merchantId;

  if (!merchantId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { bookingId } = req.params;
  const record = await service.autoCheckOut(bookingId);
  res.json({ success: true, data: record });
});

export default router;
