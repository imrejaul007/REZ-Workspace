import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { hotelService } from '../services/hotelService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { city, checkIn, checkOut, guests } = req.query;
  const hotels = await hotelService.searchHotels(city as string, checkIn as string, checkOut as string, guests ? parseInt(guests as string) : undefined);
  res.json({ success: true, data: hotels, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/:hotelId', [param('hotelId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const hotel = await hotelService.getHotelById(req.params.hotelId);
  if (!hotel) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: hotel, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/book', [body('hotelId').notEmpty(), body('roomId').notEmpty(), body('checkIn').matches(/^\d{4}-\d{2}-\d{2}$/), body('checkOut').matches(/^\d{4}-\d{2}-\d{2}$/), body('guests').isInt({ min: 1 })], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const { hotelId, roomId, checkIn, checkOut, guests } = req.body;
  const booking = await hotelService.bookHotel(userId, hotelId, roomId, checkIn, checkOut, guests);
  res.status(201).json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/bookings/my', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  const bookings = await hotelService.getUserBookings(userId);
  res.json({ success: true, data: bookings, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/bookings/:bookingId', [param('bookingId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const booking = await hotelService.getBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/bookings/:bookingId/room-service', [param('bookingId').notEmpty(), body('items').isArray()], validate, asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const order = await hotelService.orderRoomService(req.params.bookingId, items);
  res.status(201).json({ success: true, data: order, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/bookings/:bookingId/cancel', [param('bookingId').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const booking = await hotelService.cancelBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: booking, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;