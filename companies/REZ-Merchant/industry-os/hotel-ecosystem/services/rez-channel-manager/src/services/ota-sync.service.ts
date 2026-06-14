import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface OTAChannel {
  channelId: string;
  name: 'booking_com' | 'mMT' | 'goibibo' | 'airbnb' | 'expedia';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  credentials: Record<string, string>;
  settings: {
    autoSync: boolean;
    syncInterval: number; // minutes
    markup: number; // percentage
    restrictions: {
      minStay: number;
      maxStay: number;
      closedToArrival: boolean;
      closedToDeparture: boolean;
    };
  };
  stats: {
    totalBookings: number;
    monthlyRevenue: number;
    successRate: number;
  };
}

export interface InventoryUpdate {
  roomTypeId: string;
  date: Date;
  available: number;
  price: number;
  restrictions: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export class OTASyncService {
  private channels: Map<string, OTAChannel> = new Map();

  constructor() {
    this.initializeChannels();
  }

  private initializeChannels() {
    // Booking.com
    this.channels.set('booking_com', {
      channelId: 'booking_com',
      name: 'booking_com',
      status: 'disconnected',
      credentials: {},
      settings: {
        autoSync: true,
        syncInterval: 15,
        markup: 0,
        restrictions: { minStay: 1, maxStay: 28, closedToArrival: false, closedToDeparture: false },
      },
      stats: { totalBookings: 0, monthlyRevenue: 0, successRate: 0 },
    });

    // MakeMyTrip
    this.channels.set('mMT', {
      channelId: 'mMT',
      name: 'mMT',
      status: 'disconnected',
      credentials: {},
      settings: {
        autoSync: true,
        syncInterval: 30,
        markup: 2,
        restrictions: { minStay: 1, maxStay: 14, closedToArrival: false, closedToDeparture: false },
      },
      stats: { totalBookings: 0, monthlyRevenue: 0, successRate: 0 },
    });

    // Goibibo
    this.channels.set('goibibo', {
      channelId: 'goibibo',
      name: 'goibibo',
      status: 'disconnected',
      credentials: {},
      settings: {
        autoSync: true,
        syncInterval: 30,
        markup: 2,
        restrictions: { minStay: 1, maxStay: 14, closedToArrival: false, closedToDeparture: false },
      },
      stats: { totalBookings: 0, monthlyRevenue: 0, successRate: 0 },
    });

    // Airbnb
    this.channels.set('airbnb', {
      channelId: 'airbnb',
      name: 'airbnb',
      status: 'disconnected',
      credentials: {},
      settings: {
        autoSync: true,
        syncInterval: 15,
        markup: 3,
        restrictions: { minStay: 1, maxStay: 30, closedToArrival: false, closedToDeparture: false },
      },
      stats: { totalBookings: 0, monthlyRevenue: 0, successRate: 0 },
    });

    // Expedia
    this.channels.set('expedia', {
      channelId: 'expedia',
      name: 'expedia',
      status: 'disconnected',
      credentials: {},
      settings: {
        autoSync: true,
        syncInterval: 20,
        markup: 1,
        restrictions: { minStay: 1, maxStay: 28, closedToArrival: false, closedToDeparture: false },
      },
      stats: { totalBookings: 0, monthlyRevenue: 0, successRate: 0 },
    });
  }

  async connectChannel(hotelId: string, channelId: string, credentials: Record<string, string>): Promise<OTAChannel> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Unknown channel: ${channelId}`);
    }

    // Simulate API validation
    const isValid = await this.validateCredentials(channelId, credentials);

    if (isValid) {
      channel.status = 'connected';
      channel.credentials = credentials;
      this.channels.set(channelId, channel);

      return channel;
    }

    throw new Error('Invalid channel credentials');
  }

  async disconnectChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = 'disconnected';
      channel.credentials = {};
      this.channels.set(channelId, channel);
    }
  }

  async pushInventory(hotelId: string, updates: InventoryUpdate[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [channelId, channel] of this.channels) {
      if (channel.status !== 'connected') continue;

      try {
        const appliedUpdates = updates.map(update => {
          const finalPrice = update.price * (1 + channel.settings.markup / 100);
          return {
            ...update,
            price: Math.round(finalPrice * 100) / 100,
          };
        });

        // Simulate API push
        await this.simulateOTAUpdate(channelId, appliedUpdates);

        results[channelId] = {
          success: true,
          updated: appliedUpdates.length,
          timestamp: new Date().toISOString(),
        };

        channel.lastSync = new Date();
        this.channels.set(channelId, channel);
      } catch (error: any) {
        results[channelId] = {
          success: false,
          error: error.message,
        };
        channel.stats.successRate = Math.max(0, channel.stats.successRate - 5);
        this.channels.set(channelId, channel);
      }
    }

    return results;
  }

  async pullReservations(hotelId: string, channelId: string): Promise<any[]> {
    const channel = this.channels.get(channelId);
    if (!channel || channel.status !== 'connected') {
      throw new Error(`Channel not connected: ${channelId}`);
    }

    // Simulate pulling reservations from OTA
    const reservations = this.simulateReservations(channelId, 3);
    return reservations;
  }

  async syncAllChannels(hotelId: string, inventory: InventoryUpdate[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const startTime = Date.now();

    // Push inventory to all connected channels
    const pushResults = await this.pushInventory(hotelId, inventory);

    // Pull reservations from all connected channels
    for (const [channelId, channel] of this.channels) {
      if (channel.status !== 'connected') continue;

      try {
        const reservations = await this.pullReservations(hotelId, channelId);
        results[channelId] = {
          push: pushResults[channelId] || { success: true },
          pulled: reservations.length,
          reservations,
        };
      } catch (error: any) {
        results[channelId] = {
          push: pushResults[channelId] || { success: false },
          pulled: 0,
          error: error.message,
        };
      }
    }

    return {
      hotelId,
      syncDuration: Date.now() - startTime,
      channels: results,
      completedAt: new Date().toISOString(),
    };
  }

  private async validateCredentials(channelId: string, credentials: Record<string, string>): Promise<boolean> {
    // Simulate API validation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check required fields
    const requiredFields: Record<string, string[]> = {
      booking_com: ['hotel_id', 'api_key'],
      mMT: ['property_id', 'api_key'],
      goibibo: ['hotel_code', 'api_key'],
      airbnb: ['listing_id', 'access_token'],
      expedia: ['hotel_id', 'expedia_id', 'api_key'],
    };

    const required = requiredFields[channelId] || [];
    return required.every(field => credentials[field]);
  }

  private async simulateOTAUpdate(channelId: string, updates: InventoryUpdate[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('OTA API temporarily unavailable');
    }
  }

  private simulateReservations(channelId: string, count: number): any[] {
    const statuses = ['confirmed', 'pending'];
    const sources: Record<string, string[]> = {
      booking_com: ['Booking.com', 'BOOKING'],
      mMT: ['MakeMyTrip', 'MMT'],
      goibibo: ['Goibibo', 'GDB'],
      airbnb: ['Airbnb', 'AIR'],
      expedia: ['Expedia', 'EXP'],
    };

    return Array.from({ length: count }, (_, i) => ({
      reservationId: `${channelId.toUpperCase()}-${Date.now()}-${i}`,
      source: sources[channelId]?.[0] || channelId,
      sourceCode: sources[channelId]?.[1] || channelId.toUpperCase(),
      guestName: `Guest ${i + 1}`,
      checkIn: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      checkOut: new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000),
      roomType: 'Standard',
      totalAmount: Math.round((2000 + Math.random() * 3000) * 100) / 100,
      currency: 'INR',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      bookedAt: new Date(),
    }));
  }

  getChannel(channelId: string): OTAChannel | undefined {
    return this.channels.get(channelId);
  }

  getAllChannels(): OTAChannel[] {
    return Array.from(this.channels.values());
  }

  getConnectedChannels(): OTAChannel[] {
    return Array.from(this.channels.values()).filter(c => c.status === 'connected');
  }

  getChannelStats(): Record<string, OTAChannel['stats']> {
    const stats: Record<string, OTAChannel['stats']> = {};
    for (const [channelId, channel] of this.channels) {
      stats[channelId] = channel.stats;
    }
    return stats;
  }
}
