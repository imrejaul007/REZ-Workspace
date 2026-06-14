// @ts-nocheck
/**
 * Channel Manager Service
 * Manages OTA (Online Travel Agency) integrations for hotel/property management
 * Supports: Booking.com, Expedia, Airbnb, MakeMyTrip, Goibibo
 */

import mongoose, { Types, Schema } from 'mongoose';
import { Store } from '../models/Store';
import { Order } from '../models/Order';

// Channel types
export type ChannelType = 'booking_com' | 'expedia' | 'airbnb' | 'makemytrip' | 'goibibo';

export interface ChannelConfig {
  channelType: ChannelType;
  channelName: string;
  isConnected: boolean;
  credentials: {
    apiKey?: string;
    propertyId?: string;
    secretKey?: string;
    propertyCode?: string;
  };
  syncSettings: {
    autoSyncAvailability: boolean;
    autoSyncRates: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    lastSyncAt?: Date;
  };
  metadata: {
    connectedAt?: Date;
    connectionStatus: 'active' | 'inactive' | 'error' | 'pending';
    errorMessage?: string;
    apiCallsUsed?: number;
    apiCallsLimit?: number;
  };
}

export interface ChannelAvailability {
  date: string;
  availableRooms: number;
  price: number;
  currency: string;
  minStay: number;
  maxStay: number;
  closedToArrival: boolean;
  closedToDeparture: boolean;
}

export interface ChannelBooking {
  bookingId: string;
  channelType: ChannelType;
  channelBookingId: string;
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  roomsCount: number;
  guestCount: number;
  totalAmount: number;
  commission: number;
  netAmount: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'pending' | 'completed';
  specialRequests?: string;
  bookingDate: Date;
  source: string;
  channelReference?: string;
}

export interface ChannelSyncStatus {
  channelType: ChannelType;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  status: 'synced' | 'syncing' | 'pending' | 'error' | 'never';
  bookingsSynced: number;
  availabilitySynced: number;
  ratesSynced: number;
  errors: string[];
}

export interface ChannelRevenue {
  channelType: ChannelType;
  totalBookings: number;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

// Channel configuration storage (in production, use encrypted storage)
const CHANNEL_CREDENTIALS_COLLECTION = 'channel_credentials';

interface StoredChannelConfig extends mongoose.Document {
  merchantId: Types.ObjectId;
  storeId: Types.ObjectId;
  channels: ChannelConfig[];
  createdAt: Date;
  updatedAt: Date;
}

const ChannelCredentialsSchema = new mongoose.Schema<StoredChannelConfig>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    channels: {
      type: [
        {
          channelType: String,
          channelName: String,
          isConnected: Boolean,
          credentials: {
            apiKey: String,
            propertyId: String,
            secretKey: String,
            propertyCode: String,
          },
          syncSettings: {
            autoSyncAvailability: Boolean,
            autoSyncRates: Boolean,
            syncFrequency: String,
            lastSyncAt: Date,
          },
          metadata: {
            connectedAt: Date,
            connectionStatus: String,
            errorMessage: String,
            apiCallsUsed: Number,
            apiCallsLimit: Number,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, strict: true }
);

ChannelCredentialsSchema.index({ merchantId: 1, storeId: 1 }, { unique: true });

const ChannelCredentials =
  mongoose.models.ChannelCredentials ||
  mongoose.model<StoredChannelConfig>(CHANNEL_CREDENTIALS_COLLECTION, ChannelCredentialsSchema);

export class ChannelManagerService {
  /**
   * Get all channel configurations for a store
   */
  static async getChannels(merchantId: Types.ObjectId, storeId: Types.ObjectId): Promise<ChannelConfig[]> {
    const config = await ChannelCredentials.findOne({ merchantId, storeId }).lean();

    if (!config) {
      // Return default channel configs (not connected)
      return this.getDefaultChannels();
    }

    return (config as unknown).channels as ChannelConfig[];
  }

  /**
   * Get channels filtered by connection status
   */
  static async getConnectedChannels(merchantId: Types.ObjectId, storeId: Types.ObjectId): Promise<ChannelConfig[]> {
    const channels = await this.getChannels(merchantId, storeId);
    return channels.filter((ch) => ch.isConnected && ch.metadata.connectionStatus === 'active');
  }

  /**
   * Get default channel configurations
   */
  private static getDefaultChannels(): ChannelConfig[] {
    return [
      {
        channelType: 'booking_com',
        channelName: 'Booking.com',
        isConnected: false,
        credentials: {},
        syncSettings: {
          autoSyncAvailability: true,
          autoSyncRates: true,
          syncFrequency: 'realtime',
        },
        metadata: {
          connectionStatus: 'pending',
          apiCallsLimit: 10000,
        },
      },
      {
        channelType: 'expedia',
        channelName: 'Expedia Group',
        isConnected: false,
        credentials: {},
        syncSettings: {
          autoSyncAvailability: true,
          autoSyncRates: true,
          syncFrequency: 'hourly',
        },
        metadata: {
          connectionStatus: 'pending',
          apiCallsLimit: 5000,
        },
      },
      {
        channelType: 'airbnb',
        channelName: 'Airbnb',
        isConnected: false,
        credentials: {},
        syncSettings: {
          autoSyncAvailability: true,
          autoSyncRates: true,
          syncFrequency: 'realtime',
        },
        metadata: {
          connectionStatus: 'pending',
          apiCallsLimit: 8000,
        },
      },
      {
        channelType: 'makemytrip',
        channelName: 'MakeMyTrip',
        isConnected: false,
        credentials: {},
        syncSettings: {
          autoSyncAvailability: true,
          autoSyncRates: true,
          syncFrequency: 'daily',
        },
        metadata: {
          connectionStatus: 'pending',
          apiCallsLimit: 3000,
        },
      },
      {
        channelType: 'goibibo',
        channelName: 'Goibibo',
        isConnected: false,
        credentials: {},
        syncSettings: {
          autoSyncAvailability: true,
          autoSyncRates: true,
          syncFrequency: 'daily',
        },
        metadata: {
          connectionStatus: 'pending',
          apiCallsLimit: 3000,
        },
      },
    ];
  }

  /**
   * Connect a channel with credentials
   */
  static async connectChannel(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType,
    credentials: {
      apiKey?: string;
      propertyId?: string;
      secretKey?: string;
      propertyCode?: string;
    }
  ): Promise<ChannelConfig> {
    // Validate credentials based on channel
    this.validateChannelCredentials(channelType, credentials);

    // Test connection to channel API
    const connectionResult = await this.testChannelConnection(channelType, credentials);

    if (!connectionResult.success) {
      throw new Error(`Connection failed: ${connectionResult.message}`);
    }

    // Update or create channel configuration
    const channelConfig = await ChannelCredentials.findOneAndUpdate(
      { merchantId, storeId },
      {
        $set: {
          'channels.$[elem].isConnected': true,
          'channels.$[elem].credentials': credentials,
          'channels.$[elem].metadata.connectedAt': new Date(),
          'channels.$[elem].metadata.connectionStatus': 'active',
          'channels.$[elem].metadata.errorMessage': null,
        },
      },
      {
        arrayFilters: [{ 'elem.channelType': channelType }],
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    // If upserted or channel not found, add it
    if (!channelConfig) {
      const newChannel = this.getDefaultChannels().find((ch) => ch.channelType === channelType);
      if (!newChannel) {
        throw new Error('Invalid channel type');
      }

      await ChannelCredentials.findOneAndUpdate(
        { merchantId, storeId },
        {
          $push: {
            channels: {
              ...newChannel,
              isConnected: true,
              credentials,
              metadata: {
                ...newChannel.metadata,
                connectedAt: new Date(),
                connectionStatus: 'active',
              },
            },
          },
        },
        { upsert: true }
      );
    }

    // Get updated channels
    const channels = await this.getChannels(merchantId, storeId);
    const channel = channels.find((ch) => ch.channelType === channelType);
    if (!channel) {
      throw new Error('Failed to retrieve channel configuration');
    }

    return channel;
  }

  /**
   * Disconnect a channel
   */
  static async disconnectChannel(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType
  ): Promise<void> {
    await ChannelCredentials.updateOne(
      { merchantId, storeId },
      {
        $set: {
          'channels.$[elem].isConnected': false,
          'channels.$[elem].credentials': {},
          'channels.$[elem].metadata.connectionStatus': 'inactive',
        },
      },
      { arrayFilters: [{ 'elem.channelType': channelType }] }
    );
  }

  /**
   * Update channel sync settings
   */
  static async updateSyncSettings(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType,
    settings: Partial<ChannelConfig['syncSettings']>
  ): Promise<void> {
    const updateFields: Record<string, unknown> = {};
    if (settings.autoSyncAvailability !== undefined) {
      updateFields['channels.$[elem].syncSettings.autoSyncAvailability'] = settings.autoSyncAvailability;
    }
    if (settings.autoSyncRates !== undefined) {
      updateFields['channels.$[elem].syncSettings.autoSyncRates'] = settings.autoSyncRates;
    }
    if (settings.syncFrequency !== undefined) {
      updateFields['channels.$[elem].syncSettings.syncFrequency'] = settings.syncFrequency;
    }

    await ChannelCredentials.updateOne(
      { merchantId, storeId },
      { $set: updateFields },
      { arrayFilters: [{ 'elem.channelType': channelType }] }
    );
  }

  /**
   * Get sync status for all channels
   */
  static async getSyncStatus(merchantId: Types.ObjectId, storeId: Types.ObjectId): Promise<ChannelSyncStatus[]> {
    const channels = await this.getChannels(merchantId, storeId);
    const statuses: ChannelSyncStatus[] = [];

    for (const channel of channels) {
      if (!channel.isConnected) {
        statuses.push({
          channelType: channel.channelType,
          lastSyncAt: null,
          nextSyncAt: null,
          status: 'never',
          bookingsSynced: 0,
          availabilitySynced: 0,
          ratesSynced: 0,
          errors: [],
        });
        continue;
      }

      // Get sync stats from orders
      const stats = await this.getChannelSyncStats(merchantId, storeId, channel.channelType);

      const lastSync = channel.syncSettings.lastSyncAt;
      let nextSync: Date | null = null;

      if (lastSync) {
        const frequencyMinutes = this.getSyncFrequencyMinutes(channel.syncSettings.syncFrequency);
        nextSync = new Date(lastSync.getTime() + frequencyMinutes * 60 * 1000);
      }

      statuses.push({
        channelType: channel.channelType,
        lastSyncAt: lastSync || null,
        nextSyncAt: nextSync,
        status: this.calculateSyncStatus(lastSync, channel.syncSettings.syncFrequency),
        bookingsSynced: stats.bookings,
        availabilitySynced: stats.availability,
        ratesSynced: stats.rates,
        errors: channel.metadata.errorMessage ? [channel.metadata.errorMessage] : [],
      });
    }

    return statuses;
  }

  /**
   * Get bookings from all OTA channels
   */
  static async getChannelBookings(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    options?: {
      channelType?: ChannelType;
      status?: ChannelBooking['status'];
      checkInFrom?: Date;
      checkInTo?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ bookings: ChannelBooking[]; total: number }> {
    const query: unknown = {
      store: storeId,
      channel: options?.channelType ? this.getChannelSource(options.channelType) : { $exists: true },
    };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.checkInFrom || options?.checkInTo) {
      query.checkIn = {};
      if (options.checkInFrom) query.checkIn.$gte = options.checkInFrom;
      if (options.checkInTo) query.checkIn.$lte = options.checkInTo;
    }

    const limit = options?.limit || 50;
    const skip = options?.skip || 0;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const bookings: ChannelBooking[] = orders.map((order) => {
      const channelType = this.getChannelTypeFromSource(order.source || order.channel);
      return {
        bookingId: order._id.toString(),
        channelType: channelType,
        channelBookingId: order.channelBookingId || order.orderNumber,
        propertyId: order.store.toString(),
        guestName: order.user?.toString() || 'Guest',
        guestEmail: order.userEmail,
        guestPhone: order.userPhone || order.guestPhone,
        checkIn: order.checkIn || order.createdAt,
        checkOut: order.checkOut || order.estimatedDelivery,
        roomType: order.roomType || order.items?.[0]?.name || 'Standard Room',
        roomsCount: order.roomsCount || 1,
        guestCount: order.guestCount || order.items?.length || 1,
        totalAmount: order.totals?.total || 0,
        commission: order.totals?.platformFee || 0,
        netAmount: order.totals?.merchantPayout || order.totals?.total || 0,
        currency: 'INR',
        status: this.mapOrderStatusToBooking(order.status),
        specialRequests: order.notes,
        bookingDate: order.createdAt,
        source: order.source || order.channel || 'direct',
        channelReference: order.channelReference,
      };
    });

    return { bookings, total };
  }

  /**
   * Sync availability for a channel
   */
  static async syncAvailability(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType,
    availability: ChannelAvailability[]
  ): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const channel = await this.getChannelConfig(merchantId, storeId, channelType);
    if (!channel || !channel.isConnected) {
      throw new Error('Channel not connected');
    }

    // Simulate API call to channel
    const result = await this.pushAvailabilityToChannel(channelType, channel.credentials, availability);

    // Update last sync time
    await ChannelCredentials.updateOne(
      { merchantId, storeId, 'channels.channelType': channelType },
      {
        $set: {
          'channels.$.syncSettings.lastSyncAt': new Date(),
          'channels.$.metadata.apiCallsUsed': (channel.metadata.apiCallsUsed || 0) + 1,
        },
      }
    );

    return result;
  }

  /**
   * Get revenue statistics for channels
   */
  static async getChannelRevenue(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<ChannelRevenue[]> {
    const channels = await this.getConnectedChannels(merchantId, storeId);
    const revenues: ChannelRevenue[] = [];

    for (const channel of channels) {
      const source = this.getChannelSource(channel.channelType);

      const stats = await Order.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId.toString()),
            createdAt: { $gte: startDate, $lt: endDate },
            status: { $in: ['delivered', 'completed', 'paid'] },
            source: source,
          },
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            grossRevenue: { $sum: '$totals.total' },
            commission: { $sum: '$totals.platformFee' },
            netRevenue: { $sum: '$totals.merchantPayout' },
          },
        },
      ]);

      const stat = stats[0] || { totalBookings: 0, grossRevenue: 0, commission: 0, netRevenue: 0 };

      revenues.push({
        channelType: channel.channelType,
        totalBookings: stat.totalBookings,
        grossRevenue: stat.grossRevenue,
        commission: stat.commission,
        netRevenue: stat.netRevenue,
        averageBookingValue: stat.totalBookings > 0 ? stat.grossRevenue / stat.totalBookings : 0,
        occupancyRate: 0, // Would need total rooms data
        period: { start: startDate, end: endDate },
      });
    }

    return revenues;
  }

  /**
   * Validate channel credentials
   */
  private static validateChannelCredentials(
    channelType: ChannelType,
    credentials: unknown
  ): void {
    switch (channelType) {
      case 'booking_com':
        if (!credentials.apiKey || !credentials.propertyId) {
          throw new Error('Booking.com requires apiKey and propertyId');
        }
        break;
      case 'expedia':
        if (!credentials.apiKey || !credentials.propertyId) {
          throw new Error('Expedia requires apiKey and propertyId');
        }
        break;
      case 'airbnb':
        if (!credentials.propertyCode) {
          throw new Error('Airbnb requires propertyCode');
        }
        break;
      case 'makemytrip':
      case 'goibibo':
        if (!credentials.apiKey || !credentials.secretKey) {
          throw new Error(`${channelType} requires apiKey and secretKey`);
        }
        break;
    }
  }

  /**
   * Test connection to channel API
   */
  private static async testChannelConnection(
    channelType: ChannelType,
    credentials: unknown
  ): Promise<{ success: boolean; message: string }> {
    // Simulate API test - in production, make actual API calls
    // This would validate the credentials with the channel's API

    // Simulated validation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true, message: 'Connection successful' };
  }

  /**
   * Push availability to channel
   */
  private static async pushAvailabilityToChannel(
    channelType: ChannelType,
    credentials,
    availability: ChannelAvailability[]
  ): Promise<{ success: boolean; synced: number; errors: string[] }> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      synced: availability.length,
      errors: [],
    };
  }

  /**
   * Get channel configuration
   */
  private static async getChannelConfig(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType
  ): Promise<ChannelConfig | null> {
    const channels = await this.getChannels(merchantId, storeId);
    return channels.find((ch) => ch.channelType === channelType) || null;
  }

  /**
   * Get channel sync statistics
   */
  private static async getChannelSyncStats(
    merchantId: Types.ObjectId,
    storeId: Types.ObjectId,
    channelType: ChannelType
  ): Promise<{ bookings: number; availability: number; rates: number }> {
    const source = this.getChannelSource(channelType);

    const [orderCount, lastOrder] = await Promise.all([
      Order.countDocuments({
        store: storeId,
        source: source,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Order.findOne({ store: storeId, source: source }).sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);

    return {
      bookings: orderCount,
      availability: lastOrder ? 1 : 0,
      rates: lastOrder ? 1 : 0,
    };
  }

  /**
   * Get sync frequency in minutes
   */
  private static getSyncFrequencyMinutes(frequency: string): number {
    switch (frequency) {
      case 'realtime':
        return 5;
      case 'hourly':
        return 60;
      case 'daily':
        return 1440;
      default:
        return 60;
    }
  }

  /**
   * Calculate sync status
   */
  private static calculateSyncStatus(
    lastSyncAt: Date | undefined,
    frequency: string
  ): ChannelSyncStatus['status'] {
    if (!lastSyncAt) return 'never';

    const frequencyMinutes = this.getSyncFrequencyMinutes(frequency);
    const timeSinceSync = Date.now() - lastSyncAt.getTime();
    const frequencyMs = frequencyMinutes * 60 * 1000;

    if (timeSinceSync > frequencyMs * 2) return 'pending';
    if (timeSinceSync > frequencyMs) return 'pending';
    return 'synced';
  }

  /**
   * Get channel source string
   */
  private static getChannelSource(channelType: ChannelType): string {
    const sourceMap: Record<ChannelType, string> = {
      booking_com: 'booking_com',
      expedia: 'expedia',
      airbnb: 'airbnb',
      makemytrip: 'makemytrip',
      goibibo: 'goibibo',
    };
    return sourceMap[channelType];
  }

  /**
   * Get channel type from source
   */
  private static getChannelTypeFromSource(source: string | undefined): ChannelType {
    if (!source) return 'booking_com';

    const sourceMap: Record<string, ChannelType> = {
      booking_com: 'booking_com',
      expedia: 'expedia',
      airbnb: 'airbnb',
      makemytrip: 'makemytrip',
      goibibo: 'goibibo',
    };

    return sourceMap[source.toLowerCase()] || 'booking_com';
  }

  /**
   * Map order status to booking status
   */
  private static mapOrderStatusToBooking(status: string): ChannelBooking['status'] {
    const statusMap: Record<string, ChannelBooking['status']> = {
      placed: 'pending',
      confirmed: 'confirmed',
      preparing: 'confirmed',
      ready: 'confirmed',
      dispatched: 'confirmed',
      out_for_delivery: 'confirmed',
      delivered: 'completed',
      completed: 'completed',
      cancelled: 'cancelled',
      refund_requested: 'cancelled',
      refunded: 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}

export default ChannelManagerService;
