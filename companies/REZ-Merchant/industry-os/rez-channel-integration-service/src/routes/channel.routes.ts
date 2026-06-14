/**
 * Channel Integration Service - API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createConnection,
  getConnectionByHotelAndChannel,
  getConnectionsByHotel,
  updateConnectionStatus,
  updateConnectionLastSync,
  deleteConnection,
  createRoomMapping,
  getRoomMappingsByHotel,
  getRoomMappingsByChannel,
  toggleRoomMapping,
  createRatePlan,
  getRatePlansByHotel,
  updateRatePlan,
  createSyncLog,
  getSyncLog,
  getSyncLogsByHotel,
  getSyncLogsByChannel,
  updateSyncLog,
  normalizeBooking,
  createBooking,
  getBooking,
  getBookingsByHotel,
  updateBookingStatus,
  formatInventoryForChannel,
  getChannelAnalytics,
  getRevenueByChannel,
  getTotalRevenue,
  getSupportedChannels,
  isChannelSupported,
  CHANNEL_CONFIGS,
} from '../services/channel.service.js';
import { ChannelId, SyncType, NormalizedBooking, RatePlan } from '../models/channel.model.js';

const router = Router();

// Validation schemas
const CreateConnectionSchema = z.object({
  hotelId: z.string().min(1),
  channelId: z.string(),
  credentials: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    propertyId: z.string().optional(),
    hotelId: z.string().optional(),
    partnerId: z.string().optional(),
    listingId: z.string().optional(),
  }),
});

const CreateRoomMappingSchema = z.object({
  hotelId: z.string().min(1),
  channelId: z.string(),
  internalRoomId: z.string().min(1),
  channelRoomId: z.string().min(1),
  channelRoomName: z.string().min(1),
});

const CreateRatePlanSchema = z.object({
  hotelId: z.string().min(1),
  roomId: z.string().min(1),
  channelId: z.string(),
  ratePlanId: z.string().min(1),
  rateName: z.string().min(1),
  baseRate: z.number().positive(),
  currency: z.string().default('INR'),
  restrictions: z.object({
    minStay: z.number().int().positive().optional(),
    maxStay: z.number().int().positive().optional(),
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
  }).optional(),
});

const NormalizeBookingSchema = z.object({
  channelId: z.string(),
  booking: z.record(z.unknown()),
});

const CreateBookingSchema = z.object({
  hotelId: z.string().min(1),
  channelBookingId: z.string().optional(),
  channel: z.string(),
  guestName: z.string().min(1),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  checkinDate: z.string().or(z.date()),
  checkoutDate: z.string().or(z.date()),
  totalAmount: z.number().nonnegative(),
  currency: z.string().default('INR'),
  roomId: z.string().min(1),
  guestCount: z.number().int().positive().optional(),
  specialRequests: z.string().optional(),
  status: z.enum(['confirmed', 'cancelled', 'modified', 'checked_in', 'checked_out']).optional(),
});

const UpdateRatePlanSchema = z.object({
  baseRate: z.number().positive().optional(),
  restrictions: z.object({
    minStay: z.number().int().positive().optional(),
    maxStay: z.number().int().positive().optional(),
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

// ============ Health & Info Routes ============

/**
 * GET /api/channels - Get supported channels
 */
router.get('/channels', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      channels: getSupportedChannels(),
      count: Object.keys(CHANNEL_CONFIGS).length,
    },
  });
});

// ============ Connection Routes ============

/**
 * POST /api/connections - Create connection
 */
router.post('/connections', (req: Request, res: Response) => {
  try {
    const data = CreateConnectionSchema.parse(req.body);

    if (!isChannelSupported(data.channelId)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_CHANNEL', message: `Channel ${data.channelId} is not supported` },
      });
      return;
    }

    // Check if connection already exists
    const existing = getConnectionByHotelAndChannel(data.hotelId, data.channelId as ChannelId);
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Connection already exists for this channel' },
      });
      return;
    }

    const connection = createConnection(data.hotelId, data.channelId as ChannelId, data.credentials);

    res.status(201).json({
      success: true,
      data: { connection },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create connection' },
    });
  }
});

/**
 * GET /api/connections/:hotelId - Get connections by hotel
 */
router.get('/connections/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const connections = getConnectionsByHotel(hotelId);

  res.json({
    success: true,
    data: { connections, count: connections.length },
  });
});

/**
 * GET /api/connections/:hotelId/:channelId - Get specific connection
 */
router.get('/connections/:hotelId/:channelId', (req: Request, res: Response) => {
  const { hotelId, channelId } = req.params;

  if (!isChannelSupported(channelId)) {
    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
    });
    return;
  }

  const connection = getConnectionByHotelAndChannel(hotelId, channelId as ChannelId);
  if (!connection) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Connection not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { connection },
  });
});

/**
 * PUT /api/connections/:id/status - Update connection status
 */
router.put('/connections/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, error } = req.body;

  if (!['pending', 'active', 'inactive', 'error'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid status value' },
    });
    return;
  }

  const connection = updateConnectionStatus(id, status, error);
  if (!connection) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Connection not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { connection },
  });
});

/**
 * DELETE /api/connections/:id - Delete connection
 */
router.delete('/connections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = deleteConnection(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Connection not found' },
    });
    return;
  }

  res.json({
    success: true,
    message: 'Connection deleted',
  });
});

// ============ Room Mapping Routes ============

/**
 * POST /api/mappings - Create room mapping
 */
router.post('/mappings', (req: Request, res: Response) => {
  try {
    const data = CreateRoomMappingSchema.parse(req.body);

    if (!isChannelSupported(data.channelId)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
      });
      return;
    }

    const mapping = createRoomMapping(
      data.hotelId,
      data.channelId as ChannelId,
      data.internalRoomId,
      data.channelRoomId,
      data.channelRoomName
    );

    res.status(201).json({
      success: true,
      data: { mapping },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create mapping' },
    });
  }
});

/**
 * GET /api/mappings/:hotelId - Get room mappings by hotel
 */
router.get('/mappings/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { channelId } = req.query;

  let mappings;
  if (channelId && isChannelSupported(channelId as string)) {
    mappings = getRoomMappingsByChannel(`${hotelId}-${channelId}`);
  } else {
    mappings = getRoomMappingsByHotel(hotelId);
  }

  res.json({
    success: true,
    data: { mappings, count: mappings.length },
  });
});

/**
 * PUT /api/mappings/:id/toggle - Toggle room mapping active status
 */
router.put('/mappings/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const mapping = toggleRoomMapping(id, isActive);
  if (!mapping) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Mapping not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { mapping },
  });
});

// ============ Rate Plan Routes ============

/**
 * POST /api/rate-plans - Create rate plan
 */
router.post('/rate-plans', (req: Request, res: Response) => {
  try {
    const data = CreateRatePlanSchema.parse(req.body);

    if (!isChannelSupported(data.channelId)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
      });
      return;
    }

    const ratePlan = createRatePlan(
      data.hotelId,
      data.roomId,
      data.channelId as ChannelId,
      data.ratePlanId,
      data.rateName,
      data.baseRate,
      data.currency,
      data.restrictions
    );

    res.status(201).json({
      success: true,
      data: { ratePlan },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create rate plan' },
    });
  }
});

/**
 * GET /api/rate-plans/:hotelId - Get rate plans by hotel
 */
router.get('/rate-plans/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { channelId } = req.query;

  let ratePlans;
  if (channelId && isChannelSupported(channelId as string)) {
    ratePlans = getRatePlansByHotel(hotelId).filter(rp => rp.channelId === channelId);
  } else {
    ratePlans = getRatePlansByHotel(hotelId);
  }

  res.json({
    success: true,
    data: { ratePlans, count: ratePlans.length },
  });
});

/**
 * PUT /api/rate-plans/:id - Update rate plan
 */
router.put('/rate-plans/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = UpdateRatePlanSchema.parse(req.body);

    // Transform the schema to match the service
    const serviceUpdates: Partial<Pick<RatePlan, 'baseRate' | 'isActive' | 'restrictions'>> = {};
    if (updates.baseRate !== undefined) {
      serviceUpdates.baseRate = updates.baseRate;
    }
    if (updates.isActive !== undefined) {
      serviceUpdates.isActive = updates.isActive;
    }
    if (updates.restrictions) {
      serviceUpdates.restrictions = {
        minStay: updates.restrictions.minStay ?? 1,
        maxStay: updates.restrictions.maxStay ?? 14,
        closedToArrival: updates.restrictions.closedToArrival ?? false,
        closedToDeparture: updates.restrictions.closedToDeparture ?? false,
      };
    }

    const ratePlan = updateRatePlan(id, serviceUpdates);
    if (!ratePlan) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Rate plan not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { ratePlan },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update rate plan' },
    });
  }
});

// ============ Sync Routes ============

/**
 * POST /api/sync/start - Start a sync operation
 */
router.post('/sync/start', (req: Request, res: Response) => {
  const { hotelId, channelId, syncType } = req.body;

  if (!hotelId || !channelId || !syncType) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'hotelId, channelId, and syncType are required' },
    });
    return;
  }

  if (!isChannelSupported(channelId)) {
    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
    });
    return;
  }

  const validSyncTypes: SyncType[] = ['inventory', 'rates', 'bookings', 'full'];
  if (!validSyncTypes.includes(syncType)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `syncType must be one of: ${validSyncTypes.join(', ')}` },
    });
    return;
  }

  const syncLog = createSyncLog(hotelId, channelId as ChannelId, syncType);

  // Simulate sync completion (in production, this would be async)
  setTimeout(() => {
    updateSyncLog(syncLog.id, {
      status: 'success',
      completedAt: new Date(),
      duration: 1000,
      totalRecords: 50,
      syncedRecords: 50,
      failedRecords: 0,
    });
    updateConnectionLastSync(getConnectionByHotelAndChannel(hotelId, channelId as ChannelId)?.id || '');
  }, 100);

  res.status(201).json({
    success: true,
    data: { syncLog },
  });
});

/**
 * GET /api/sync/:hotelId - Get sync logs by hotel
 */
router.get('/sync/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { channelId } = req.query;

  let logs;
  if (channelId && isChannelSupported(channelId as string)) {
    logs = getSyncLogsByChannel(hotelId, channelId as ChannelId);
  } else {
    logs = getSyncLogsByHotel(hotelId);
  }

  res.json({
    success: true,
    data: { logs, count: logs.length },
  });
});

/**
 * GET /api/sync/log/:logId - Get specific sync log
 */
router.get('/sync/log/:logId', (req: Request, res: Response) => {
  const { logId } = req.params;
  const log = getSyncLog(logId);

  if (!log) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Sync log not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { log },
  });
});

// ============ Booking Routes ============

/**
 * POST /api/bookings/normalize - Normalize booking data from channel
 */
router.post('/bookings/normalize', (req: Request, res: Response) => {
  try {
    const data = NormalizeBookingSchema.parse(req.body);

    if (!isChannelSupported(data.channelId)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
      });
      return;
    }

    const normalized = normalizeBooking(data.booking, data.channelId as ChannelId);

    res.json({
      success: true,
      data: { booking: normalized },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to normalize booking' },
    });
  }
});

/**
 * POST /api/bookings - Create/save booking
 */
router.post('/bookings', (req: Request, res: Response) => {
  try {
    const data = CreateBookingSchema.parse(req.body);

    if (!isChannelSupported(data.channel)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
      });
      return;
    }

    const booking: NormalizedBooking = {
      channelBookingId: data.channelBookingId || '',
      channel: data.channel as ChannelId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      checkinDate: new Date(data.checkinDate),
      checkoutDate: new Date(data.checkoutDate),
      totalAmount: data.totalAmount,
      currency: data.currency,
      roomId: data.roomId,
      guestCount: data.guestCount,
      specialRequests: data.specialRequests,
      status: data.status || 'confirmed',
    };

    const created = createBooking(booking);

    res.status(201).json({
      success: true,
      data: { booking: created },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create booking' },
    });
  }
});

/**
 * GET /api/bookings/:hotelId - Get bookings by hotel
 */
router.get('/bookings/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { channelId, status } = req.query;

  let bookings = getBookingsByHotel(hotelId);

  if (channelId && isChannelSupported(channelId as string)) {
    bookings = bookings.filter(b => b.channel === channelId);
  }

  if (status) {
    bookings = bookings.filter(b => b.status === status);
  }

  res.json({
    success: true,
    data: { bookings, count: bookings.length },
  });
});

/**
 * GET /api/bookings/:hotelId/:channelBookingId - Get specific booking
 */
router.get('/bookings/:hotelId/:channelBookingId', (req: Request, res: Response) => {
  const { channelBookingId } = req.params;
  const booking = getBooking(channelBookingId);

  if (!booking) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { booking },
  });
});

/**
 * PUT /api/bookings/:channelBookingId/status - Update booking status
 */
router.put('/bookings/:channelBookingId/status', (req: Request, res: Response) => {
  const { channelBookingId } = req.params;
  const { status } = req.body;

  if (!['confirmed', 'cancelled', 'modified', 'checked_in', 'checked_out'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid status value' },
    });
    return;
  }

  const booking = updateBookingStatus(channelBookingId, status as NormalizedBooking['status']);
  if (!booking) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { booking },
  });
});

// ============ Inventory Routes ============

/**
 * POST /api/inventory/format - Format inventory for specific channel
 */
router.post('/inventory/format', (req: Request, res: Response) => {
  const { inventory, channelId } = req.body;

  if (!inventory || !Array.isArray(inventory) || !channelId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'inventory array and channelId are required' },
    });
    return;
  }

  if (!isChannelSupported(channelId)) {
    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
    });
    return;
  }

  const formatted = formatInventoryForChannel(inventory, channelId as ChannelId);

  res.json({
    success: true,
    data: { formatted, channelId },
  });
});

// ============ Analytics Routes ============

/**
 * GET /api/analytics/:hotelId - Get revenue analytics
 */
router.get('/analytics/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { period } = req.query;

  const days = period ? parseInt(period as string, 10) : 30;
  const totalRevenue = getTotalRevenue(hotelId);
  const byChannel = getRevenueByChannel(hotelId);

  res.json({
    success: true,
    data: {
      total: totalRevenue.total,
      netAfterCommission: totalRevenue.netAfterCommission,
      totalCommission: totalRevenue.total - totalRevenue.netAfterCommission,
      byChannel,
      periodDays: days,
    },
  });
});

/**
 * GET /api/analytics/:hotelId/:channelId - Get channel-specific analytics
 */
router.get('/analytics/:hotelId/:channelId', (req: Request, res: Response) => {
  const { hotelId, channelId } = req.params;
  const { period } = req.query;

  if (!isChannelSupported(channelId)) {
    res.status(400).json({
      success: false,
      error: { code: 'UNKNOWN_CHANNEL', message: 'Unknown channel' },
    });
    return;
  }

  const days = period ? parseInt(period as string, 10) : 30;
  const analytics = getChannelAnalytics(hotelId, channelId as ChannelId, days);

  res.json({
    success: true,
    data: { analytics },
  });
});

/**
 * GET /api/analytics/:hotelId/revenue-summary - Get revenue summary by channel
 */
router.get('/analytics/:hotelId/revenue-summary', (req: Request, res: Response) => {
  const { hotelId } = req.params;

  const byChannel = getRevenueByChannel(hotelId);
  const total = byChannel.reduce((sum, r) => sum + r.revenue, 0);
  const topChannel = byChannel[0];

  res.json({
    success: true,
    data: {
      total,
      channelCount: byChannel.length,
      topChannel: topChannel ? {
        channelId: topChannel.channelId,
        revenue: topChannel.revenue,
        bookings: topChannel.bookings,
      } : null,
      channels: byChannel,
    },
  });
});

export default router;
