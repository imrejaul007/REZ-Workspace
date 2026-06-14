import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { flightService } from '../services/flightService';
import { bookingService } from '../services/bookingService';
import { priceAlertService } from '../services/priceAlertService';
import { asyncHandler, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// Helper to require authentication
const requireAuthentication = (req: Request, res: Response, next: Function) => {
  if (!req.user?.sub) {
    return next(new UnauthorizedError('Authentication required'));
  }
  next();
};

// ========== PUBLIC FLIGHT SEARCH (no auth required) ==========

// Search flights
router.get(
  '/search',
  [
    query('origin').isLength({ min: 3, max: 3 }).withMessage('Origin must be 3-letter airport code'),
    query('destination').isLength({ min: 3, max: 3 }).withMessage('Destination must be 3-letter airport code'),
    query('departureDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Departure date must be YYYY-MM-DD'),
    query('returnDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Return date must be YYYY-MM-DD'),
    query('passengers').optional().isInt({ min: 1, max: 9 }),
    query('cabinClass').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
    query('directOnly').optional().isBoolean()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { origin, destination, departureDate, returnDate, passengers, cabinClass, directOnly } = req.query;

    const result = await flightService.searchFlights({
      origin: origin as string,
      destination: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      passengers: passengers ? { adults: parseInt(passengers as string) } : undefined,
      cabinClass: cabinClass as any,
      directOnly: directOnly === 'true'
    });

    res.json({
      success: true,
      data: result,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get flight by ID
router.get(
  '/:flightId',
  [param('flightId').notEmpty().withMessage('Flight ID is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const flight = await flightService.getFlightById(req.params.flightId);

    if (!flight) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Flight not found'
        }
      });
    }

    res.json({
      success: true,
      data: flight,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get flight status
router.get(
  '/status/:flightNumber',
  [param('flightNumber').notEmpty().withMessage('Flight number is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const status = await flightService.getFlightStatus(req.params.flightNumber);

    res.json({
      success: true,
      data: status,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get airports
router.get(
  '/airports',
  asyncHandler(async (req: Request, res: Response) => {
    const airports = await flightService.getAirports();

    res.json({
      success: true,
      data: airports,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get airport by code
router.get(
  '/airports/:code',
  [param('code').isLength({ min: 3, max: 3 }).withMessage('Airport code must be 3 letters')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const airport = await flightService.getAirport(req.params.code);

    if (!airport) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Airport not found'
        }
      });
    }

    res.json({
      success: true,
      data: airport,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get airlines
router.get(
  '/airlines',
  asyncHandler(async (req: Request, res: Response) => {
    const airlines = await flightService.getAirlines();

    res.json({
      success: true,
      data: airlines,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// ========== PROTECTED BOOKINGS (auth required) ==========

// Create booking - requires authentication
router.post(
  '/book',
  requireAuth,
  [
    body('flightId').notEmpty().withMessage('Flight ID is required'),
    body('passengerDetails').isArray({ min: 1 }).withMessage('At least one passenger required'),
    body('passengerDetails.*.firstName').notEmpty().withMessage('First name required'),
    body('passengerDetails.*.lastName').notEmpty().withMessage('Last name required'),
    body('passengerDetails.*.dateOfBirth').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('DOB must be YYYY-MM-DD'),
    body('passengerDetails.*.email').isEmail().withMessage('Valid email required'),
    body('passengerDetails.*.phone').isLength({ min: 10 }).withMessage('Phone number required'),
    body('contactDetails.email').isEmail().withMessage('Contact email required'),
    body('contactDetails.phone').isLength({ min: 10 }).withMessage('Contact phone required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const booking = await bookingService.createBooking(userId, req.body);

    res.status(201).json({
      success: true,
      data: booking,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get booking by ID - requires authentication
router.get(
  '/bookings/:bookingId',
  requireAuth,
  [param('bookingId').notEmpty().withMessage('Booking ID is required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const booking = await bookingService.getBookingById(req.params.bookingId, userId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    res.json({
      success: true,
      data: booking,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get booking by PNR - requires authentication
router.get(
  '/bookings/pnr/:pnr',
  requireAuth,
  [param('pnr').isLength({ min: 6, max: 6 }).withMessage('PNR must be 6 characters')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const booking = await bookingService.getBookingByPNR(req.params.pnr);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    res.json({
      success: true,
      data: booking,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get user bookings - requires authentication
router.get(
  '/bookings',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await bookingService.getUserBookings(userId, { page, limit, status });

    res.json({
      success: true,
      data: result.bookings,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now(),
        pagination: {
          page: result.page,
          pageSize: limit,
          total: result.total
        }
      }
    });
  })
);

// Cancel booking - requires authentication
router.post(
  '/bookings/:bookingId/cancel',
  requireAuth,
  [
    param('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('reason').notEmpty().withMessage('Cancellation reason required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const { reason } = req.body;

    const booking = await bookingService.cancelBooking(req.params.bookingId, userId, reason);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    res.json({
      success: true,
      data: booking,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Confirm payment - requires authentication
router.post(
  '/bookings/:bookingId/confirm-payment',
  requireAuth,
  [
    param('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.body;
    const booking = await bookingService.confirmPayment(req.params.bookingId, paymentId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    res.json({
      success: true,
      data: booking,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// ========== PRICE ALERTS (auth optional, but auth needed for user-specific) ==========

// Create price alert - requires authentication
router.post(
  '/price-alerts',
  requireAuth,
  [
    body('origin').isLength({ min: 3, max: 3 }).withMessage('Origin must be 3-letter airport code'),
    body('destination').isLength({ min: 3, max: 3 }).withMessage('Destination must be 3-letter airport code'),
    body('departureDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Departure date must be YYYY-MM-DD'),
    body('maxPrice').isFloat({ min: 0 }).withMessage('Max price must be positive'),
    body('email').isEmail().withMessage('Valid email required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const alert = await priceAlertService.createAlert(req.body, userId);

    res.status(201).json({
      success: true,
      data: alert,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Get user price alerts - requires authentication
router.get(
  '/price-alerts',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const alerts = await priceAlertService.getUserAlerts(userId);

    res.json({
      success: true,
      data: alerts,
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Delete price alert - requires authentication
router.delete(
  '/price-alerts/:alertId',
  requireAuth,
  [param('alertId').notEmpty().withMessage('Alert ID required')],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const alert = await priceAlertService.deactivateAlert(req.params.alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Price alert not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Price alert deactivated',
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

// Unsubscribe from price alerts
router.post(
  '/price-alerts/unsubscribe',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('alertId').notEmpty().withMessage('Alert ID required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, alertId } = req.body;
    const success = await priceAlertService.unsubscribe(email, alertId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Price alert not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Unsubscribed successfully',
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  })
);

export default router;
