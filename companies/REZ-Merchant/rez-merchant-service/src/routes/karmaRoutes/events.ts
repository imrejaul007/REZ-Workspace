
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { KarmaEvent } from '../../models/KarmaEvent';
import { Event } from '../../models/Event';
import { EventBooking } from '../../models/EventBooking';
import { generateEventQRCodes } from '../../utils/qrGenerator';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

const EVENT_ALLOWED_FIELDS = ['name', 'description', 'coinsReward', 'maxParticipants', 'registrationStart', 'registrationEnd', 'eventDate', 'isActive', 'venue'];

function pickEventFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of EVENT_ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

function errorResponse(res: Response, err) {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const msg = process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
  res.status(500).json({ success: false, message: msg });
}

async function getMerchantEvent(req: Request, res: Response) {
  const event = await Event.findOne({
    _id: req.params.id,
    merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
  }).lean();
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found or access denied' });
    return null;
  }
  return event;
}

router.post('/event', async (req: Request, res: Response) => {
  try {
    const { merchantEventId, ...karmaFields } = req.body;

    if (!merchantEventId) {
      res.status(400).json({ success: false, message: 'merchantEventId is required' });
      return;
    }

    const event = await Event.findOne({
      _id: merchantEventId,
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Merchant event not found' });
      return;
    }

    const qrCodes = generateEventQRCodes(merchantEventId as string);

    const karmaEvent = new KarmaEvent({
      merchantEventId: new mongoose.Types.ObjectId(merchantEventId as string),
      ...karmaFields,
      qrCodes,
      status: karmaFields.status || 'draft',
    });
    await karmaEvent.save();

    res.status(201).json({ success: true, message: 'Karma event created', data: karmaEvent });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/event', async (req: Request, res: Response) => {
  try {
    const merchantEvents = await Event.find({ merchantId: new mongoose.Types.ObjectId(req.merchantId as string) }).select('_id').lean();
    const merchantEventIds = merchantEvents.map((e) => e._id);

    const query: Record<string, unknown> = { merchantEventId: { $in: merchantEventIds } };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.ngoId) query.ngoId = new mongoose.Types.ObjectId(req.query.ngoId as string);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [events, total] = await Promise.all([
      KarmaEvent.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      KarmaEvent.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/event/:id', async (req: Request, res: Response) => {
  try {
    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOne({ merchantEventId: req.params.id }).lean() as unknown;
    if (!karmaEvent) {
      res.status(404).json({ success: false, message: 'Karma event not found' });
      return;
    }
    res.json({ success: true, data: karmaEvent });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.put('/event/:id', async (req: Request, res: Response) => {
  try {
    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOneAndUpdate(
      { merchantEventId: req.params.id },
      { $set: { ...pickEventFields(req.body), updatedAt: new Date() } },
      { new: true },
    );
    if (!karmaEvent) {
      res.status(404).json({ success: false, message: 'Karma event not found' });
      return;
    }
    res.json({ success: true, message: 'Karma event updated', data: karmaEvent });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/event/:id/volunteers', async (req: Request, res: Response) => {
  try {
    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOne({ merchantEventId: req.params.id }).lean() as unknown;

    const query: Record<string, unknown> = {
      eventId: karmaEvent.merchantEventId,
    };
    if (req.query.status) query.status = req.query.status;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [bookings, total] = await Promise.all([
      EventBooking.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EventBooking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.post('/event/:id/volunteers/:bookingId/approve', async (req: Request, res: Response) => {
  try {
    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOne({ merchantEventId: req.params.id }).lean() as unknown;

    const booking = await EventBooking.findOneAndUpdate(
      {
        _id: req.params.bookingId,
        eventId: karmaEvent.merchantEventId,
        lastVerificationSource: { $ne: 'karma' },
      },
      {
        $set: {
          ngoApproved: true,
          ngoApprovedAt: new Date(),
          ngoApprovalStatus: 'verified',
          lastVerificationSource: 'ngo',
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Volunteer booking not found' });
      return;
    }

    res.json({ success: true, message: 'Volunteer approved by NGO', data: booking });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.post('/event/:id/volunteers/bulk-approve', async (req: Request, res: Response) => {
  try {
    const { bookingIds } = req.body as { bookingIds: string[] };
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      res.status(400).json({ success: false, message: 'bookingIds array is required' });
      return;
    }

    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOne({ merchantEventId: req.params.id }).lean() as unknown;
    if (!karmaEvent) {
      res.status(404).json({ success: false, message: 'Karma event not found' });
      return;
    }

    const result = await EventBooking.updateMany(
      {
        _id: { $in: bookingIds.map((id) => new mongoose.Types.ObjectId(id)) },
        eventId: karmaEvent.merchantEventId,
        lastVerificationSource: { $ne: 'karma' },
      },
      {
        $set: {
          ngoApproved: true,
          ngoApprovedAt: new Date(),
          ngoApprovalStatus: 'verified',
          lastVerificationSource: 'ngo',
          updatedAt: new Date(),
        },
      },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} volunteer(s) approved`,
      data: { approvedCount: result.modifiedCount },
    });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/event/:id/analytics', async (req: Request, res: Response) => {
  try {
    const event = await getMerchantEvent(req, res);
    if (!event) return;

    const karmaEvent = await KarmaEvent.findOne({ merchantEventId: req.params.id }).lean() as unknown;
    if (!karmaEvent) {
      res.status(404).json({ success: false, message: 'Karma event not found' });
      return;
    }

    const stats = await EventBooking.aggregate([
      {
        $match: { eventId: karmaEvent.merchantEventId as mongoose.Types.ObjectId },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          ngoApproved: {
            $sum: { $cond: [{ $eq: ['$ngoApproved', true] }, 1, 0] },
          },
          checkedIn: {
            $sum: { $cond: [{ $eq: ['$qrCheckedIn', true] }, 1, 0] },
          },
          checkedOut: {
            $sum: { $cond: [{ $eq: ['$qrCheckedOut', true] }, 1, 0] },
          },
          verified: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$verificationStatus', 'verified'] },
                    { $eq: ['$ngoApprovalStatus', 'verified'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalKarmaEarned: { $sum: { $cond: [{ $ne: ['$karmaEarned', null] }, '$karmaEarned', 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        eventId: req.params.id,
        status: karmaEvent.status,
        maxVolunteers: karmaEvent.maxVolunteers,
        confirmedVolunteers: karmaEvent.confirmedVolunteers,
        ...(stats[0] || {
          totalBookings: 0,
          confirmed: 0,
          ngoApproved: 0,
          checkedIn: 0,
          checkedOut: 0,
          verified: 0,
          totalKarmaEarned: 0,
        }),
      },
    });
  } catch (err) {
    errorResponse(res, err);
  }
});

export default router;
