/**
 * REZ Inventory Sync Service
 * Port: 4027
 *
 * Real-time Inventory Sync for Multi-OTA Channel Manager
 * - Real-time availability updates
 * - Channel-specific inventory management
 * - Price parity enforcement
 * - Booking ingestion from OTAs
 * - Conflict resolution
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Webhook endpoints have higher rate limits
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
});
app.use('/api/', limiter);

const config = {
  port: parseInt(process.env.PORT || '4027'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_inventory_sync',
  // OTA Provider API endpoints (mock)
  bookingDotCom: process.env.BOOKING_COM_URL || 'https://supply-api.booking.com',
  makemytrip: process.env.MMT_URL || 'https://api.makemytrip.com',
  goibibo: process.env.GOIBIBO_URL || 'https://api.goibibo.com',
  expedia: process.env.EXPEDIA_URL || 'https://api.expedia.com',
  airbnb: process.env.AIRBNB_URL || 'https://api.airbnb.com',
};

// OTA Channel Types
const ChannelType = {
  BOOKING_COM: 'booking_com',
  MAKEMYTRIP: 'makemytrip',
  GOIBIBO: 'goibibo',
  EXPEDIA: 'expedia',
  AIRBNB: 'airbnb',
  GOOGLE_HOTELS: 'google_hotels',
  HOTELS_COM: 'hotels_com',
  DIRECT: 'direct',
} as const;

// Sync Status
const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  FAILED: 'failed',
  CONFLICT: 'conflict',
} as const;

// ENUMS
type ChannelType = typeof ChannelType[keyof typeof ChannelType];
type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];

// SCHEMAS
const HotelChannelSchema = z.object({
  hotelId: z.string(),
  channelType: z.enum(Object.values(ChannelType)),
  channelHotelId: z.string(), // Hotel's ID on the channel
  channelName: z.string(),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    propertyId: z.string().optional(),
    userId: z.string().optional(),
    password: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
  settings: z.object({
    autoSync: z.boolean().default(true),
    syncInterval: z.number().default(15), // minutes
    priceParity: z.boolean().default(true),
    minRateFactor: z.number().min(0.5).max(1.5).default(1.0), // min rate as % of base
    maxRateFactor: z.number().min(1.0).max(2.0).default(1.2),
    restrictionSettings: z.object({
      minStay: z.number().default(1),
      maxStay: z.number().default(30),
      closedToArrival: z.boolean().default(false),
      closedToDeparture: z.boolean().default(false),
      closed: z.boolean().default(false),
    }).optional(),
  }).optional(),
  lastSync: z.date().optional(),
  syncStatus: z.enum(Object.values(SyncStatus)).default('synced'),
});

const InventoryUpdateSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  availableRooms: z.number().min(0),
  rate: z.number().min(0).optional(),
  minStay: z.number().min(1).optional(),
  restrictions: z.object({
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
    closed: z.boolean().optional(),
  }).optional(),
  stopSold: z.boolean().optional(),
  stopSoldAll: z.boolean().optional(),
});

const BulkInventorySchema = z.object({
  hotelId: z.string(),
  updates: z.array(InventoryUpdateSchema),
  channels: z.array(z.enum(Object.values(ChannelType))).optional(), // specific channels, or all if omitted
  updateType: z.enum(['availability', 'rate', 'restrictions', 'stop_sold', 'full']),
});

// MODELS
const HotelChannel = mongoose.model('HotelChannel', new mongoose.Schema({
  hotelId: { type: String, index: true },
  channelType: { type: String, enum: Object.values(ChannelType) },
  channelHotelId: String,
  channelName: String,
  credentials: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  settings: {
    autoSync: { type: Boolean, default: true },
    syncInterval: { type: Number, default: 15 },
    priceParity: { type: Boolean, default: true },
    minRateFactor: { type: Number, default: 1.0 },
    maxRateFactor: { type: Number, default: 1.2 },
    restrictionSettings: {
      minStay: { type: Number, default: 1 },
      maxStay: { type: Number, default: 30 },
      closedToArrival: { type: Boolean, default: false },
      closedToDeparture: { type: Boolean, default: false },
      closed: { type: Boolean, default: false },
    },
  },
  lastSync: Date,
  syncStatus: { type: String, enum: Object.values(SyncStatus), default: 'synced' },
  syncError: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true }));

const InventorySnapshot = mongoose.model('InventorySnapshot', new mongoose.Schema({
  hotelId: { type: String, index: true },
  roomTypeId: { type: String, index: true },
  date: { type: Date, index: true },
  baseAvailability: Number,
  baseRate: Number,
  otaAvailability: Map, // channel -> availability
  otaRates: Map, // channel -> rate
  restrictions: {
    minStay: Number,
    maxStay: Number,
    closedToArrival: Boolean,
    closedToDeparture: Boolean,
    closed: Boolean,
  },
  stopSold: Boolean,
  stopSoldAll: Boolean,
  lastUpdate: Date,
}, { timestamps: true }));

const BookingIngestion = mongoose.model('BookingIngestion', new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  hotelId: { type: String, index: true },
  channelType: { type: String, enum: Object.values(ChannelType) },
  channelBookingId: String,
  channelConfirmationId: String,
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  roomTypeId: String,
  checkIn: Date,
  checkOut: Date,
  rooms: Number,
  adults: Number,
  children: Number,
  totalAmount: Number,
  commission: Number,
  netAmount: Number,
  currency: { type: String, default: 'INR' },
  specialRequests: String,
  status: { type: String, enum: ['pending', 'confirmed', 'failed', 'cancelled', 'modified'], default: 'pending' },
  processedAt: Date,
  errorMessage: String,
  rawPayload: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
}));

const SyncLog = mongoose.model('SyncLog', new mongoose.Schema({
  hotelId: { type: String, index: true },
  channelType: { type: String, enum: Object.values(ChannelType) },
  syncType: { type: String, enum: ['full', 'incremental', 'booking_ingestion', 'rate_update', 'availability_update'] },
  status: { type: String, enum: ['success', 'partial', 'failed'] },
  requestPayload: mongoose.Schema.Types.Mixed,
  responsePayload: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  duration: Number, // ms
  itemsProcessed: Number,
  createdAt: { type: Date, default: Date.now },
}));

const RatePlan = mongoose.model('RatePlan', new mongoose.Schema({
  hotelId: { type: String, index: true },
  roomTypeId: String,
  ratePlanCode: String,
  ratePlanName: String,
  channel: { type: String, enum: Object.values(ChannelType) },
  baseRate: Number,
  rateFactors: {
    weekday: { type: Number, default: 1.0 },
    weekend: { type: Number, default: 1.15 },
    peak: { type: Number, default: 1.3 },
    offPeak: { type: Number, default: 0.85 },
  },
  channelMarkup: { type: Number, default: 0 }, // % markup for channel
  channelCommission: { type: Number, default: 0 }, // % commission from channel
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}));

const InventoryLock = mongoose.model('InventoryLock', new mongoose.Schema({
  hotelId: String,
  roomTypeId: String,
  date: Date,
  lockType: { type: String, enum: ['booking', 'hold', 'system'] },
  referenceId: String, // booking ID or hold ID
  lockedRooms: Number,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true }));

// HELPER FUNCTIONS

// Get channel-specific rate with markup/markup
function calculateChannelRate(baseRate: number, channelType: ChannelType, settings: any): number {
  let rate = baseRate;

  // Apply channel markup
  if (settings.priceParity && settings.channelMarkup) {
    rate = rate * (1 + settings.channelMarkup / 100);
  }

  // Apply channel-specific commission (this is what channel takes)
  // Net rate = rate - commission

  // Clamp to min/max factors
  rate = Math.max(rate * settings.minRateFactor, rate);
  rate = Math.min(rate * settings.maxRateFactor, rate);

  return Math.round(rate * 100) / 100;
}

// Push inventory to specific channel
async function pushToChannel(channel: any, inventory: any): Promise<any> {
  const startTime = Date.now();

  try {
    switch (channel.channelType) {
      case 'booking_com':
        return await pushToBookingCom(channel, inventory);
      case 'makemytrip':
        return await pushToMMT(channel, inventory);
      case 'goibibo':
        return await pushToGoibibo(channel, inventory);
      case 'expedia':
        return await pushToExpedia(channel, inventory);
      case 'airbnb':
        return await pushToAirbnb(channel, inventory);
      default:
        return { success: false, error: 'Unknown channel' };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

// Channel-specific integrations (mock implementations)
async function pushToBookingCom(channel: any, inventory: any): Promise<any> {
  // Booking.com uses OTA XML or REST API
  // POST https://supply-xml.booking.com/hotels/xml
  console.log(`[Booking.com] Pushing inventory for room ${inventory.roomTypeId} on ${inventory.date}`);

  // Simulate API call
  return {
    success: true,
    channelBookingId: `BC${Date.now()}`,
    updatedRooms: inventory.availableRooms,
  };
}

async function pushToMMT(channel: any, inventory: any): Promise<any> {
  // MakeMyTrip API integration
  console.log(`[MakeMyTrip] Pushing inventory for room ${inventory.roomTypeId}`);

  return {
    success: true,
    channelBookingId: `MMT${Date.now()}`,
  };
}

async function pushToGoibibo(channel: any, inventory: any): Promise<any> {
  // Goibibo API integration
  console.log(`[Goibibo] Pushing inventory for room ${inventory.roomTypeId}`);

  return {
    success: true,
    channelBookingId: `GB${Date.now()}`,
  };
}

async function pushToExpedia(channel: any, inventory: any): Promise<any> {
  // Expedia PartnerCentral API
  console.log(`[Expedia] Pushing inventory for room ${inventory.roomTypeId}`);

  return {
    success: true,
    channelBookingId: `EXP${Date.now()}`,
  };
}

async function pushToAirbnb(channel: any, inventory: any): Promise<any> {
  // Airbnb API integration
  console.log(`[Airbnb] Pushing inventory for room ${inventory.roomTypeId}`);

  return {
    success: true,
    channelBookingId: `AIRBNB${Date.now()}`,
  };
}

// ENDPOINTS
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'inventory-sync-service', port: config.port });
});

/** GET /api/channels/:hotelId - Get hotel channels */
app.get('/api/channels/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activeOnly } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (activeOnly === 'true') query.isActive = true;

    const channels = await HotelChannel.find(query).sort({ channelType: 1 });

    res.json({ success: true, data: { channels, count: channels.length } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/channels - Register hotel channel */
app.post('/api/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = HotelChannelSchema.parse(req.body);

    const existing = await HotelChannel.findOne({
      hotelId: data.hotelId,
      channelType: data.channelType,
    });

    if (existing) {
      // Update existing
      existing.channelHotelId = data.channelHotelId;
      existing.channelName = data.channelName;
      existing.credentials = data.credentials;
      existing.settings = data.settings;
      await existing.save();

      return res.json({ success: true, data: { channel: existing }, updated: true });
    }

    const channel = await HotelChannel.create(data);
    res.json({ success: true, data: { channel } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    next(error);
  }
});

/** PUT /api/channels/:channelId - Update channel settings */
app.put('/api/channels/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await HotelChannel.findByIdAndUpdate(
      req.params.channelId,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!channel) {
      return res.status(404).json({ success: false, error: { code: 'CHANNEL_NOT_FOUND' } });
    }

    res.json({ success: true, data: { channel } });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/channels/:channelId - Remove channel */
app.delete('/api/channels/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await HotelChannel.findByIdAndDelete(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ success: false, error: { code: 'CHANNEL_NOT_FOUND' } });
    }

    res.json({ success: true, message: 'Channel removed' });
  } catch (error) {
    next(error);
  }
});

/** POST /api/sync/inventory - Push inventory update to channels */
app.post('/api/sync/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = BulkInventorySchema.parse(req.body);
    const startTime = Date.now();

    // Get channels to update
    const channelQuery: any = { hotelId: data.hotelId, isActive: true, 'settings.autoSync': true };
    if (data.channels && data.channels.length > 0) {
      channelQuery.channelType = { $in: data.channels };
    }

    const channels = await HotelChannel.find(channelQuery);

    if (channels.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NO_ACTIVE_CHANNELS' } });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Update local snapshot
    for (const update of data.updates) {
      const snapshot = await InventorySnapshot.findOneAndUpdate(
        {
          hotelId: data.hotelId,
          roomTypeId: update.roomTypeId,
          date: new Date(update.date),
        },
        {
          $set: {
            baseAvailability: update.availableRooms,
            baseRate: update.rate,
            lastUpdate: new Date(),
            ...(update.restrictions && { restrictions: update.restrictions }),
            ...(update.stopSold !== undefined && { stopSold: update.stopSold }),
            ...(update.stopSoldAll !== undefined && { stopSoldAll: update.stopSoldAll }),
          },
        },
        { upsert: true, new: true }
      );

      // Push to each channel
      for (const channel of channels) {
        const channelRate = update.rate
          ? calculateChannelRate(update.rate, channel.channelType, channel.settings)
          : undefined;

        const result = await pushToChannel(channel, {
          ...update,
          rate: channelRate,
        });

        results.push({
          channel: channel.channelType,
          roomTypeId: update.roomTypeId,
          date: update.date,
          ...result,
        });

        if (result.success) {
          successCount++;
          channel.syncStatus = 'synced';
          channel.lastSync = new Date();
        } else {
          failCount++;
          channel.syncStatus = 'failed';
          channel.syncError = result.error;
        }

        await channel.save();
      }
    }

    const duration = Date.now() - startTime;

    // Log sync
    await SyncLog.create({
      hotelId: data.hotelId,
      channelType: channels.map(c => c.channelType).join(','),
      syncType: 'availability_update',
      status: failCount === 0 ? 'success' : failCount === successCount ? 'failed' : 'partial',
      requestPayload: data,
      responsePayload: results,
      duration,
      itemsProcessed: data.updates.length * channels.length,
    });

    res.json({
      success: true,
      data: {
        channelsUpdated: channels.length,
        updatesAttempted: data.updates.length * channels.length,
        successCount,
        failCount,
        results,
        duration,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    next(error);
  }
});

/** POST /api/sync/rates - Push rate updates */
app.post('/api/sync/rates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, roomTypeId, rates, channels } = req.body;
    const startTime = Date.now();

    // Get channels
    const channelQuery: any = { hotelId, isActive: true, 'settings.autoSync': true };
    if (channels && channels.length > 0) {
      channelQuery.channelType = { $in: channels };
    }

    const activeChannels = await HotelChannel.find(channelQuery);

    const results = [];
    for (const rate of rates) {
      for (const channel of activeChannels) {
        const channelRate = calculateChannelRate(rate.baseRate, channel.channelType, channel.settings);

        const result = await pushToChannel(channel, {
          roomTypeId,
          date: rate.date,
          rate: channelRate,
          availableRooms: rate.availableRooms,
        });

        results.push({
          channel: channel.channelType,
          date: rate.date,
          baseRate: rate.baseRate,
          channelRate,
          ...result,
        });

        if (result.success) {
          channel.lastSync = new Date();
          channel.syncStatus = 'synced';
        } else {
          channel.syncStatus = 'failed';
          channel.syncError = result.error;
        }

        await channel.save();
      }
    }

    res.json({
      success: true,
      data: {
        ratesUpdated: rates.length,
        channelUpdates: results.length,
        results,
        duration: Date.now() - startTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/sync/full - Full sync for hotel */
app.post('/api/sync/full', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, channels } = req.body;
    const startTime = Date.now();

    const channelQuery: any = { hotelId, isActive: true };
    if (channels && channels.length > 0) {
      channelQuery.channelType = { $in: channels };
    }

    const activeChannels = await HotelChannel.find(channelQuery);

    // In production, fetch all inventory from inventory service
    const inventory = await InventorySnapshot.find({ hotelId });

    const results = [];
    for (const channel of activeChannels) {
      const channelResults = [];

      for (const inv of inventory) {
        const channelRate = calculateChannelRate(inv.baseRate || 0, channel.channelType, channel.settings);

        const result = await pushToChannel(channel, {
          roomTypeId: inv.roomTypeId,
          date: inv.date,
          rate: channelRate,
          availableRooms: inv.baseAvailability,
          restrictions: inv.restrictions,
          stopSold: inv.stopSold,
        });

        channelResults.push({
          roomTypeId: inv.roomTypeId,
          date: inv.date,
          ...result,
        });
      }

      if (channelResults.every(r => r.success)) {
        channel.syncStatus = 'synced';
        channel.lastSync = new Date();
        channel.syncError = undefined;
      } else {
        channel.syncStatus = 'failed';
        channel.syncError = 'Partial sync failure';
      }

      await channel.save();
      results.push({ channel: channel.channelType, results: channelResults });
    }

    await SyncLog.create({
      hotelId,
      syncType: 'full',
      status: 'success',
      duration: Date.now() - startTime,
      itemsProcessed: inventory.length * activeChannels.length,
    });

    res.json({
      success: true,
      data: {
        channelsSynced: activeChannels.length,
        inventoryItems: inventory.length,
        results,
        duration: Date.now() - startTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/inventory/:hotelId - Get inventory snapshot */
app.get('/api/inventory/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomTypeId, startDate, endDate } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const inventory = await InventorySnapshot.find(query)
      .sort({ date: 1 })
      .limit(365);

    res.json({ success: true, data: { inventory, count: inventory.length } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/bookings/ingest - Receive booking from OTA (webhook) */
app.post('/api/bookings/ingest', webhookLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelType, hotelId, booking } = req.body;

    // Verify webhook signature based on channel
    // const isValid = verifyWebhookSignature(req, channelType);

    const bookingId = uuidv4();

    const ingestion = await BookingIngestion.create({
      id: bookingId,
      hotelId,
      channelType,
      channelBookingId: booking.channelBookingId,
      channelConfirmationId: booking.confirmationId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      roomTypeId: booking.roomTypeId,
      checkIn: new Date(booking.checkIn),
      checkOut: new Date(booking.checkOut),
      rooms: booking.rooms || 1,
      adults: booking.adults || 1,
      children: booking.children || 0,
      totalAmount: booking.totalAmount,
      commission: booking.commission || 0,
      netAmount: booking.netAmount || booking.totalAmount,
      currency: booking.currency || 'INR',
      specialRequests: booking.specialRequests,
      status: 'pending',
      rawPayload: booking,
    });

    // Process the booking (in production, this would call booking service)
    // For now, just mark as confirmed
    ingestion.status = 'confirmed';
    ingestion.processedAt = new Date();
    await ingestion.save();

    // Deduct from inventory
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    let currentDate = new Date(checkIn);

    while (currentDate < checkOut) {
      await InventorySnapshot.findOneAndUpdate(
        {
          hotelId,
          roomTypeId: booking.roomTypeId,
          date: currentDate,
        },
        { $inc: { baseAvailability: -(booking.rooms || 1) } }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        bookingId,
        status: 'confirmed',
        confirmationId: booking.confirmationId || `INT${bookingId.slice(0, 8).toUpperCase()}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/bookings/modify - Handle booking modification from OTA */
app.post('/api/bookings/modify', webhookLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelBookingId, modification } = req.body;

    const booking = await BookingIngestion.findOne({ channelBookingId });
    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND' } });
    }

    // Restore old inventory
    let currentDate = new Date(booking.checkIn);
    while (currentDate < booking.checkOut) {
      await InventorySnapshot.findOneAndUpdate(
        {
          hotelId: booking.hotelId,
          roomTypeId: booking.roomTypeId,
          date: currentDate,
        },
        { $inc: { baseAvailability: booking.rooms } }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Apply new dates
    booking.checkIn = new Date(modification.checkIn);
    booking.checkOut = new Date(modification.checkOut);
    booking.status = 'modified';
    await booking.save();

    // Deduct new inventory
    currentDate = new Date(booking.checkIn);
    while (currentDate < booking.checkOut) {
      await InventorySnapshot.findOneAndUpdate(
        {
          hotelId: booking.hotelId,
          roomTypeId: booking.roomTypeId,
          date: currentDate,
        },
        { $inc: { baseAvailability: -booking.rooms } }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        status: 'modified',
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/bookings/cancel - Handle booking cancellation from OTA */
app.post('/api/bookings/cancel', webhookLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelBookingId, reason } = req.body;

    const booking = await BookingIngestion.findOne({ channelBookingId });
    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'BOOKING_NOT_FOUND' } });
    }

    // Restore inventory
    let currentDate = new Date(booking.checkIn);
    while (currentDate < booking.checkOut) {
      await InventorySnapshot.findOneAndUpdate(
        {
          hotelId: booking.hotelId,
          roomTypeId: booking.roomTypeId,
          date: currentDate,
        },
        { $inc: { baseAvailability: booking.rooms } }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    booking.status = 'cancelled';
    booking.processedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        status: 'cancelled',
        inventoryRestored: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/bookings/:hotelId - Get ingested bookings */
app.get('/api/bookings/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelType, status, startDate, endDate, limit = 100 } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (channelType) query.channelType = channelType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate as string);
      if (endDate) query.checkIn.$lte = new Date(endDate as string);
    }

    const bookings = await BookingIngestion.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: { bookings, count: bookings.length } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/sync-logs/:hotelId - Get sync logs */
app.get('/api/sync-logs/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelType, status, startDate, endDate, limit = 50 } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (channelType) query.channelType = channelType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await SyncLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: { logs, count: logs.length } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/rate-plans/:hotelId - Get rate plans */
app.get('/api/rate-plans/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomTypeId, channel } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (channel) query.channel = channel;

    const ratePlans = await RatePlan.find(query);

    res.json({ success: true, data: { ratePlans, count: ratePlans.length } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/rate-plans - Create rate plan */
app.post('/api/rate-plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ratePlan = await RatePlan.create(req.body);

    res.json({ success: true, data: { ratePlan } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/stats/:hotelId - Get inventory sync stats */
app.get('/api/stats/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    if (period === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);

    const syncStats = await SyncLog.aggregate([
      { $match: { hotelId: req.params.hotelId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { status: '$status', type: '$syncType' },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalItems: { $sum: '$itemsProcessed' },
        },
      },
    ]);

    const channelStats = await HotelChannel.aggregate([
      { $match: { hotelId: req.params.hotelId } },
      {
        $group: {
          _id: '$channelType',
          activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalSyncs: { $sum: 1 },
        },
      },
    ]);

    const bookingStats = await BookingIngestion.aggregate([
      { $match: { hotelId: req.params.hotelId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$netAmount' },
          totalCommission: { $sum: '$commission' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        period,
        syncStats,
        channelStats,
        bookingStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/locks - Create inventory lock (for temp holds) */
app.post('/api/locks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, roomTypeId, date, lockedRooms, lockType, referenceId } = req.body;

    // Check availability
    const snapshot = await InventorySnapshot.findOne({
      hotelId,
      roomTypeId,
      date: new Date(date),
    });

    const currentAvailable = snapshot?.baseAvailability || 0;

    if (currentAvailable < lockedRooms) {
      return res.status(409).json({
        success: false,
        error: { code: 'INSUFFICIENT_INVENTORY' },
        data: { available: currentAvailable, requested: lockedRooms },
      });
    }

    const lock = await InventoryLock.create({
      hotelId,
      roomTypeId,
      date: new Date(date),
      lockType: lockType || 'booking',
      referenceId,
      lockedRooms,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min default
    });

    res.json({ success: true, data: { lock } });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/locks/:lockId - Release inventory lock */
app.delete('/api/locks/:lockId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lock = await InventoryLock.findByIdAndDelete(req.params.lockId);
    if (!lock) {
      return res.status(404).json({ success: false, error: { code: 'LOCK_NOT_FOUND' } });
    }

    res.json({ success: true, message: 'Lock released' });
  } catch (error) {
    next(error);
  }
});

// CRON JOBS
// Sync all active channels every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    const channels = await HotelChannel.find({
      isActive: true,
      'settings.autoSync': true,
      lastSync: { $lt: new Date(Date.now() - 15 * 60 * 1000) },
    });

    console.log(`[Cron] Running inventory sync for ${channels.length} channels`);

    for (const channel of channels) {
      try {
        // Get inventory for this hotel
        const inventory = await InventorySnapshot.find({
          hotelId: channel.hotelId,
          date: { $gte: new Date() },
        }).limit(90);

        for (const inv of inventory) {
          await pushToChannel(channel, {
            roomTypeId: inv.roomTypeId,
            date: inv.date,
            rate: calculateChannelRate(inv.baseRate || 0, channel.channelType, channel.settings),
            availableRooms: inv.baseAvailability,
          });
        }

        channel.lastSync = new Date();
        channel.syncStatus = 'synced';
        await channel.save();
      } catch (error: any) {
        channel.syncStatus = 'failed';
        channel.syncError = error.message;
        await channel.save();
      }
    }
  } catch (error) {
    console.error('[Cron] Inventory sync error:', error);
  }
});

// Clean up expired locks
cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await InventoryLock.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      console.log(`[Cron] Cleaned up ${result.deletedCount} expired locks`);
    }
  } catch (error) {
    console.error('[Cron] Lock cleanup error:', error);
  }
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[InventorySync Error]', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: err.errors },
    });
  }

  res.status(500).json({
    success: false,
    error: { code: 'ERROR', message: err.message },
  });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log(`\n🏨 REZ Inventory Sync Service - Port ${config.port}`);
    console.log(`   MongoDB: ${config.mongoUrl}`);
    console.log(`   Channels: Booking.com, MakeMyTrip, Goibibo, Expedia, Airbnb\n`);

    app.listen(config.port, () => {
      console.log(`✅ Inventory Sync Service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start().catch(console.error);
