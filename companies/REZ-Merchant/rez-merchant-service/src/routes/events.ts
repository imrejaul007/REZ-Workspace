
import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { EventBooking } from '../models/EventBooking';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

const EVENT_ALLOWED_FIELDS = [
  'title', 'description', 'category', 'date', 'startTime', 'endTime',
  'venue', 'address', 'location', 'images', 'coverImage', 'price',
  'capacity', 'maxTickets', 'ticketTypes', 'status', 'tags',
  'isActive', 'isPublic', 'storeId', 'registrationRequired',
  'terms', 'organizer', 'contactInfo', 'metadata',
];

function pickEventFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of EVENT_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

// POST /events — create event
router.post('/', async (req: Request, res: Response) => {
  try {
    const event = new Event({ ...pickEventFields(req.body), merchantId: new mongoose.Types.ObjectId(req.merchantId as string), analytics: { views: 0, bookings: 0, shares: 0, favorites: 0 } });
    await event.save();
    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /events — list merchant events
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: new mongoose.Types.ObjectId(req.merchantId as string) };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      const s = (req.query.search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ title: { $regex: s, $options: 'i' } }, { description: { $regex: s, $options: 'i' } }];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    let sort: unknown = { createdAt: -1 };
    if (req.query.sort === 'date_asc') sort = { date: 1 };
    if (req.query.sort === 'date_desc') sort = { date: -1 };

    const [events, total] = await Promise.all([
      Event.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Event.countDocuments(query),
    ]);

    res.json({ success: true, data: { events, pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /events/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string) }).lean();
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /events/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickEventFields(req.body);
    allowedFields.updatedAt = new Date();
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string) },
      { $set: allowedFields },
      { new: true },
    );
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, message: 'Event updated', data: event });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /events/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bookings = await EventBooking.countDocuments({ eventId: new mongoose.Types.ObjectId(req.params.id as string), status: { $in: ['confirmed', 'pending'] } });
    if (bookings > 0) { res.status(400).json({ success: false, message: `Cannot delete event with ${bookings} active booking(s)` }); return; }
    const event = await Event.findOneAndDelete({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string) });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }
    res.json({ success: true, message: 'Event deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /events/:id/publish
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string), status: { $ne: 'published' } },
      { $set: { status: 'published', publishedAt: new Date() } },
      { new: true },
    );
    if (!event) { res.status(400).json({ success: false, message: 'Event not found or already published' }); return; }
    res.json({ success: true, message: 'Event published', data: event });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /events/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string), status: { $nin: ['cancelled', 'completed'] } },
      { $set: { status: 'cancelled' } },
      { new: true },
    );
    if (!event) { res.status(400).json({ success: false, message: 'Event not found or cannot cancel' }); return; }

    const result = await EventBooking.updateMany(
      { eventId: new mongoose.Types.ObjectId(req.params.id as string), status: { $in: ['confirmed', 'pending'] } },
      { $set: { status: 'cancelled', refundReason: req.body.reason || 'Event cancelled', refundedAt: new Date() } },
    );

    res.json({ success: true, message: 'Event cancelled', data: { event, cancelledBookings: result.modifiedCount } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /events/:id/bookings
router.get('/:id/bookings', async (req: Request, res: Response) => {
  try {
    // Verify ownership
    const event = await Event.findOne({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string) });
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const query: unknown = { eventId: new mongoose.Types.ObjectId(req.params.id as string) };
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [bookings, total] = await Promise.all([
      EventBooking.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EventBooking.countDocuments(query),
    ]);

    res.json({ success: true, data: { bookings, pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /events/:id/analytics
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, merchantId: new mongoose.Types.ObjectId(req.merchantId as string) }).lean() as unknown;
    if (!event) { res.status(404).json({ success: false, message: 'Event not found' }); return; }

    const stats = await EventBooking.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(req.params.id as string) } },
      { $group: { _id: null, totalBookings: { $sum: 1 }, confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }, totalRevenue: { $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$amount', 0] } } } },
    ]);

    res.json({ success: true, data: { views: event.analytics?.views || 0, bookings: event.analytics?.bookings || 0, ...(stats[0] || { totalBookings: 0, confirmed: 0, totalRevenue: 0 }) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /events/:id/bookings/:bookingId/checkin
router.post('/:id/bookings/:bookingId/checkin', async (req: Request, res: Response) => {
  try {
    const booking = await EventBooking.findOneAndUpdate(
      { _id: req.params.bookingId, eventId: new mongoose.Types.ObjectId(req.params.id as string), status: 'confirmed' },
      { $set: { checkInTime: new Date() } },
      { new: true },
    );
    if (!booking) { res.status(400).json({ success: false, message: 'Booking not found or not confirmed' }); return; }
    res.json({ success: true, message: 'Checked in', data: booking });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
