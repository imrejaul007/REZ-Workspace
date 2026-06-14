import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../models/booking.model';

const router = express.Router();

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      hotelId,
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      roomTypeId,
      rooms,
      checkIn,
      checkOut,
      adults = 1,
      children = 0,
      specialRequests,
      source = 'direct',
      roomPlan = 'room_only',
      discountCode,
    } = req.body;

    const bookingId = `BK-${uuidv4().substring(0, 8).toUpperCase()}`;
    const confirmationNumber = `REZ${Date.now().toString(36).toUpperCase()}`;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate pricing
    const roomPrices = rooms.map((r: any) => ({
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      pricePerNight: r.pricePerNight,
    }));

    const subtotal = roomPrices.reduce((sum: number, r: any) => sum + r.pricePerNight * nights, 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const totalTaxes = cgst + sgst;

    // Apply discount if valid
    let discountAmount = 0;
    let discountType: 'percentage' | 'fixed' = 'percentage';
    if (discountCode === 'FIRST10') {
      discountAmount = subtotal * 0.1;
      discountType = 'percentage';
    }

    const total = subtotal + totalTaxes - discountAmount;

    const booking = new Booking({
      bookingId,
      confirmationNumber,
      hotelId,
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      roomTypeId,
      rooms: roomPrices,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalRooms: rooms.length,
      adults,
      children,
      totalGuests: adults + children,
      subtotal,
      taxes: { cgst, sgst, total: totalTaxes },
      fees: {},
      discounts: discountCode ? [{ code: discountCode, type: discountType, amount: discountAmount }] : [],
      total,
      paid: 0,
      balance: total,
      status: 'pending',
      paymentStatus: 'pending',
      specialRequests,
      source,
      roomPlan,
      cancellationPolicy: {
        type: 'free',
        deadline: new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000),
      },
    });

    await booking.save();

    res.status(201).json({
      success: true,
      booking: {
        bookingId: booking.bookingId,
        confirmationNumber: booking.confirmationNumber,
        status: booking.status,
        total: booking.total,
        balance: booking.balance,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
      },
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Get booking by confirmation number
router.get('/confirmation/:confirmationNumber', async (req, res) => {
  try {
    const { confirmationNumber } = req.params;
    const booking = await Booking.findOne({ confirmationNumber });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Update booking
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;

    // Prevent certain updates
    delete updates.bookingId;
    delete updates.confirmationNumber;
    delete updates.total;

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: updates },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (['cancelled', 'checked_out'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    // Check cancellation policy
    const now = new Date();
    let refundAmount = booking.total;
    let cancellationFee = 0;

    if (booking.cancellationPolicy.type === 'non_refundable') {
      refundAmount = 0;
      cancellationFee = booking.total;
    } else if (booking.cancellationPolicy.type === 'partial') {
      if (booking.cancellationPolicy.deadline && now < booking.cancellationPolicy.deadline) {
        cancellationFee = booking.total * 0.5;
        refundAmount = booking.total - cancellationFee;
      }
    }

    booking.status = 'cancelled';
    booking.balance = 0;
    booking.paymentStatus = refundAmount > 0 ? 'refunded' : 'pending';

    await booking.save();

    res.json({
      success: true,
      booking,
      cancellation: {
        refundAmount,
        cancellationFee,
        reason,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Confirm booking (payment received)
router.post('/:bookingId/confirm', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOneAndUpdate(
      { bookingId, status: 'pending' },
      {
        $set: {
          status: 'confirmed',
          paymentStatus: 'paid',
          paid: '$total',
        },
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Get guest bookings
router.get('/guest/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { status } = req.query;

    const query: any = { guestId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query).sort({ checkIn: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get hotel bookings
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate, status } = req.query;

    const query: any = { hotelId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate as string);
      if (endDate) query.checkIn.$lte = new Date(endDate as string);
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Apply discount
router.post('/:bookingId/discount', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { code, type, value } = req.body;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Can only apply discounts to pending bookings' });
    }

    const discountAmount = type === 'percentage'
      ? booking.subtotal * (value / 100)
      : Math.min(value, booking.subtotal);

    booking.discounts.push({ code, type, amount: discountAmount });
    booking.total = booking.subtotal + booking.taxes.total - booking.discounts.reduce((sum, d) => sum + d.amount, 0);
    booking.balance = booking.total - booking.paid;

    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

// Record payment
router.post('/:bookingId/payment', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, method } = req.body;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.paid += amount;
    booking.balance = booking.total - booking.paid;
    booking.paymentStatus = booking.balance <= 0 ? 'paid' : 'partial';

    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
