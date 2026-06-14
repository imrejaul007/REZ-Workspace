import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import { successResponse, errorResponse, errors } from '../utils/response';

const router = Router();

// Create booking
router.post('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, propertyId, amount, currency, brokerId } = req.body;
    if (!userId || !propertyId || !amount) {
      return errorResponse(res, errors.badRequest('Missing required fields'), 400);
    }
    const booking = await paymentService.createBooking(userId, propertyId, amount, currency || 'INR', brokerId);
    successResponse(res, booking, 201);
  } catch (err) { next(err); }
});

// Verify payment
router.post('/bookings/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpayPaymentId } = req.body;
    const booking = await paymentService.verifyPayment(req.params.id, razorpayPaymentId);
    successResponse(res, booking);
  } catch (err) { next(err); }
});

// Cancel booking
router.post('/bookings/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await paymentService.cancelBooking(req.params.id);
    successResponse(res, booking);
  } catch (err) { next(err); }
});

// Get booking
router.get('/bookings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await paymentService.getBooking(req.params.id);
    if (!booking) return errorResponse(res, errors.notFound('Booking'), 404);
    successResponse(res, booking);
  } catch (err) { next(err); }
});

// Get user bookings
router.get('/bookings/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await paymentService.getUserBookings(req.params.userId);
    successResponse(res, bookings);
  } catch (err) { next(err); }
});

export default router;
