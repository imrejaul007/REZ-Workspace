
/**
 * Store Analytics routes - Track events and provide dashboard analytics.
 *
 * Endpoints:
 * POST   /store-analytics/:storeId/event     - Record an analytics event
 * GET    /store-analytics/:storeId/dashboard - Get analytics dashboard data
 * GET    /store-analytics/:storeId/timeline - Get timeline data
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { StoreAnalytics, StoreEvent } from '../models/StoreAnalytics';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const EVENT_TYPES = ['link_click', 'qr_scan', 'page_view', 'download'] as const;
type EventType = typeof EVENT_TYPES[number];
const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const;
type DeviceType = typeof DEVICE_TYPES[number];

/**
 * Verify merchant owns the store.
 */
async function verifyStoreOwnership(storeId: string, merchantId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(storeId)) return false;
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    $or: [{ merchantId: new mongoose.Types.ObjectId(merchantId) }, { merchant: new mongoose.Types.ObjectId(merchantId) }],
  });
  return !!store;
}

/**
 * Detect device type from user agent string.
 */
function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * POST /store-analytics/:storeId/event
 * Record an analytics event.
 */
router.post('/:storeId/event', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { eventType, eventData, timestamp } = req.body as {
      eventType: string;
      eventData?: Record<string, unknown>;
      timestamp?: string;
      linkId?: string;
    };

    if (!EVENT_TYPES.includes(eventType as EventType)) {
      res.status(400).json({ success: false, message: `Invalid eventType. Must be one of: ${EVENT_TYPES.join(', ')}` });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      deviceType: detectDeviceType(req.headers['user-agent'] || '') as DeviceType,
    };

    // Create the event record
    const event = await StoreEvent.create({
      storeId: new mongoose.Types.ObjectId(storeId),
      eventType: eventType as EventType,
      eventData: eventData || {},
      deviceInfo,
      linkId: req.body.linkId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Update aggregated analytics
    let analytics = await StoreAnalytics.findOne({ storeId: new mongoose.Types.ObjectId(storeId) });
    if (!analytics) {
      analytics = await StoreAnalytics.create({
        storeId: new mongoose.Types.ObjectId(storeId),
        totalViews: 0,
        totalClicks: 0,
        totalScans: 0,
        linkClicks: {},
        deviceBreakdown: {},
      });
    }

    // Update counters based on event type
    if (eventType === 'page_view') {
      analytics.totalViews += 1;
    } else if (eventType === 'link_click') {
      analytics.totalClicks += 1;
      if (req.body.linkId) {
        const linkId = req.body.linkId;
        const current = (analytics.linkClicks as Map<string, number>).get(linkId) || 0;
        (analytics.linkClicks as Map<string, number>).set(linkId, current + 1);
      }
    } else if (eventType === 'qr_scan') {
      analytics.totalScans += 1;
    }

    // Update device breakdown
    const deviceKey = deviceInfo.deviceType;
    const currentDeviceCount = (analytics.deviceBreakdown as Map<string, number>).get(deviceKey) || 0;
    (analytics.deviceBreakdown as Map<string, number>).set(deviceKey, currentDeviceCount + 1);

    await analytics.save();

    res.status(201).json({ success: true, data: { eventId: event._id } });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /store-analytics/:storeId/dashboard
 * Get analytics dashboard data.
 */
router.get('/:storeId/dashboard', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const analytics = await StoreAnalytics.findOne({ storeId: new mongoose.Types.ObjectId(storeId) }).lean();

    if (!analytics) {
      res.json({
        success: true,
        data: {
          totalViews: 0,
          totalClicks: 0,
          totalScans: 0,
          topLinks: [],
          deviceBreakdown: {},
        },
      });
      return;
    }

    // Get top links by click count
    const linkClicksMap = (analytics.linkClicks as unknown) || {};
    const topLinks = Object.entries(linkClicksMap)
      .map(([linkId, clicks]) => ({ linkId, clicks }))
      .sort((a, b) => (b.clicks as number) - (a.clicks as number))
      .slice(0, 10);

    // Get device breakdown as plain object
    const deviceBreakdownMap = (analytics.deviceBreakdown as unknown) || {};
    const deviceBreakdown = { ...deviceBreakdownMap };

    res.json({
      success: true,
      data: {
        totalViews: analytics.totalViews,
        totalClicks: analytics.totalClicks,
        totalScans: analytics.totalScans,
        topLinks,
        deviceBreakdown,
      },
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /store-analytics/:storeId/timeline
 * Get timeline data for analytics.
 * Query params:
 *   - days: number of days to fetch (default: 30, max: 365)
 *   - eventType: filter by event type
 */
router.get('/:storeId/timeline', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
    const eventType = req.query.eventType as string | undefined;

    if (!await verifyStoreOwnership(storeId, req.merchantId!)) {
      res.status(404).json({ success: false, message: 'Store not found or access denied' });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchStage: unknown = {
      storeId: new mongoose.Types.ObjectId(storeId),
      timestamp: { $gte: startDate },
    };
    if (eventType && EVENT_TYPES.includes(eventType as EventType)) {
      matchStage.eventType = eventType;
    }

    const timeline = await StoreEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          events: {
            $push: {
              eventType: '$_id.eventType',
              count: '$count',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Transform to timeline format
    const result = timeline.map((entry) => {
      const date = entry._id;
      let views = 0;
      let clicks = 0;
      let scans = 0;

      for (const event of entry.events) {
        if (event.eventType === 'page_view') views += event.count;
        else if (event.eventType === 'link_click') clicks += event.count;
        else if (event.eventType === 'qr_scan') scans += event.count;
      }

      return { date, views, clicks, scans };
    });

    res.json({ success: true, data: result });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
