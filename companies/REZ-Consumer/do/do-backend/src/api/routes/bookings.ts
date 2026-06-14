import { Router } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { mockBookings, mockWallet, mockLoyalty } from '../../services/mockServices.js';

export const bookingsRouter = Router();

// GET /bookings - Get user's bookings
bookingsRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { status } = req.query;

    let bookings = await mockBookings.getBookings(userId);

    // Filter by status if specified
    if (status) {
      bookings = bookings.filter((b) => b.status === status);
    }

    res.json({
      success: true,
      bookings,
    });
  })
);

// GET /bookings/:id - Get booking details
bookingsRouter.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const bookings = await mockBookings.getBookings(userId);
    const booking = bookings.find((b) => b.id === id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    res.json({
      success: true,
      booking,
    });
  })
);

// POST /bookings - Create a booking
bookingsRouter.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { entityId, entityType, entityName, dateTime, partySize, useKarma } = req.body;

    // Create booking
    const booking = await mockBookings.createBooking({
      entityId,
      entityName,
      dateTime: new Date(dateTime),
      partySize,
      userId,
    });

    // Calculate and add rewards
    const rewards = await mockLoyalty.calculateRewards({
      type: 'booking',
      amount: booking.price,
      userId,
    });

    await mockWallet.addCoins(userId, rewards.coins, 'Booking reward');

    res.json({
      success: true,
      booking,
      rewards,
    });
  })
);

// DELETE /bookings/:id - Cancel booking
bookingsRouter.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const success = await mockBookings.cancelBooking(id, userId);

    if (!success) {
      throw new NotFoundError('Booking not found');
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  })
);

// POST /bookings/:id/qr - Generate booking QR code
bookingsRouter.post(
  '/:id/qr',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const bookings = await mockBookings.getBookings(userId);
    const booking = bookings.find((b) => b.id === id);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Generate mock QR code URL
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DO-${booking.confirmationCode}`;

    res.json({
      success: true,
      qrCode,
      confirmationCode: booking.confirmationCode,
    });
  })
);
