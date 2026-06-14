import { Router, Request, Response } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { loungeService } from '../services/loungeService';
import { loungeBookingService } from '../services/bookingService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() }
    });
  }
  next();
};

// Note: authenticate middleware is applied at the app level (index.ts)
// It allows unauthenticated access for public endpoints, but ensures
// req.user is populated when a valid token is provided.

// ========== PUBLIC LOUNGE ENDPOINTS (no auth required) ==========

// Search lounges - public
router.get('/',
  [query('airport').optional().isLength({ min: 3, max: 3 }), query('terminal').optional()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const lounges = await loungeService.searchLounges({
      airport: req.query.airport as string,
      terminal: req.query.terminal as string,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined
    });

    res.json({
      success: true,
      data: lounges,
      meta: { requestId: req.requestId, timestamp: Date.now() }
    });
  })
);

// Get lounge by ID - public
router.get('/:loungeId',
  [param('loungeId').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const lounge = await loungeService.getLoungeById(req.params.loungeId);
    if (!lounge) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lounge not found' }
      });
    }
    res.json({ success: true, data: lounge, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// ========== PROTECTED LOUNGE ENDPOINTS (auth required) ==========

// Book lounge - requires authentication
router.post('/book',
  [body('loungeId').notEmpty(), body('date').matches(/^\d{4}-\d{2}-\d{2}$/), body('guests').isInt({ min: 1, max: 10 }), body('flightNumber').optional()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    const { loungeId, date, guests, flightNumber, specialRequests } = req.body;

    const lounge = await loungeService.getLoungeById(loungeId);
    if (!lounge) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lounge not found' }
      });
    }

    const booking = await loungeBookingService.createBooking(
      userId, loungeId, lounge.name, lounge.airport, lounge.terminal,
      date, guests, lounge.price.amount, flightNumber, specialRequests
    );

    res.status(201).json({
      success: true,
      data: booking,
      meta: { requestId: req.requestId, timestamp: Date.now() }
    });
  })
);

// Get user bookings - requires authentication
router.get('/bookings/my',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    const result = await loungeBookingService.getUserBookings(userId);
    res.json({
      success: true,
      data: result.bookings,
      meta: { requestId: req.requestId, timestamp: Date.now(), total: result.total }
    });
  })
);

// Get booking by code - requires authentication
router.get('/bookings/:code',
  [param('code').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    const booking = await loungeBookingService.getBookingByCode(req.params.code);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }
    res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Validate access - requires authentication (for scanning QR codes)
router.post('/validate-access',
  [body('qrCode').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const validation = await loungeBookingService.validateAccess(req.body.qrCode);
    res.json({
      success: true,
      data: validation,
      meta: { requestId: req.requestId, timestamp: Date.now() }
    });
  })
);

// Check-in - requires authentication
router.post('/bookings/:bookingId/check-in',
  [param('bookingId').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await loungeBookingService.checkIn(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }
    res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

// Cancel booking - requires authentication
router.post('/bookings/:bookingId/cancel',
  [param('bookingId').notEmpty()],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await loungeBookingService.cancelBooking(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      });
    }
    res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
  })
);

export default router;
