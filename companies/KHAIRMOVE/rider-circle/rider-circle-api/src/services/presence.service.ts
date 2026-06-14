import mongoose, { Document, Schema } from 'mongoose';
import { logger } from '../utils/logger';

// Presence model for persistent presence data
export interface IUserPresence extends Document {
  userId: string;
  socketId?: string;
  coordinates: [number, number]; // [lng, lat]
  altitude?: number;
  speed?: number;
  heading?: number;
  status: 'online' | 'riding' | 'idle' | 'offline';
  rideId?: string;
  groupId?: string;
  eventId?: string;
  lastUpdate: Date;
  city?: string;
  state?: string;
  country?: string;
}

// Schema
const UserPresenceSchema = new Schema<IUserPresence>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  socketId: { type: String },
  coordinates: {
    type: [Number],
    required: true,
    index: '2dsphere',
  },
  altitude: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  status: {
    type: String,
    enum: ['online', 'riding', 'idle', 'offline'],
    default: 'offline',
  },
  rideId: { type: String, index: true },
  groupId: { type: String, index: true },
  eventId: { type: String, index: true },
  lastUpdate: { type: Date, default: Date.now },
  city: { type: String, index: true },
  state: { type: String },
  country: { type: String, default: 'India' },
}, {
  timestamps: true,
});

// TTL index - auto-remove after 5 minutes of inactivity
UserPresenceSchema.index({ lastUpdate: 1 }, { expireAfterSeconds: 300 });

// Static methods
UserPresenceSchema.statics.findNearby = async function(
  coordinates: [number, number],
  radiusKm: number,
  status?: string
) {
  const query: any = {
    status: { $ne: 'offline' },
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  };

  if (status) {
    query.status = status;
  }

  return this.find(query).limit(50);
};

UserPresenceSchema.statics.findByCity = async function(city: string) {
  return this.find({ city, status: { $ne: 'offline' } });
};

UserPresenceSchema.statics.findRidingNearby = async function(
  coordinates: [number, number],
  radiusKm: number
) {
  return this.find({
    status: 'riding',
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

UserPresenceSchema.statics.findActiveRides = async function() {
  return this.find({ status: 'riding' })
    .populate('rideId', 'title startTime route')
    .sort({ lastUpdate: -1 });
};

UserPresenceSchema.statics.getLivePresenceStats = async function() {
  const stats = await this.aggregate([
    { $match: { status: { $ne: 'offline' } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: { $push: { status: '$_id', count: '$count' } },
      },
    },
  ]);

  const cityStats = await this.aggregate([
    { $match: { status: { $ne: 'offline' }, city: { $exists: true } } },
    {
      $group: {
        _id: '$city',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    total: stats[0]?.total || 0,
    byStatus: stats[0]?.byStatus || [],
    topCities: cityStats.map(c => ({ city: c._id, count: c.count })),
  };
};

export const UserPresence = mongoose.model<IUserPresence>('UserPresence', UserPresenceSchema);

// Presence Service
export class PresenceService {
  // Update user presence
  async updatePresence(
    userId: string,
    data: {
      coordinates: [number, number];
      altitude?: number;
      speed?: number;
      heading?: number;
      status?: 'online' | 'riding' | 'idle';
      rideId?: string;
      groupId?: string;
      eventId?: string;
    }
  ): Promise<IUserPresence> {
    const update: any = {
      coordinates: data.coordinates,
      lastUpdate: new Date(),
      status: data.status || 'online',
    };

    if (data.altitude !== undefined) update.altitude = data.altitude;
    if (data.speed !== undefined) update.speed = data.speed;
    if (data.heading !== undefined) update.heading = data.heading;
    if (data.rideId !== undefined) update.rideId = data.rideId;
    if (data.groupId !== undefined) update.groupId = data.groupId;
    if (data.eventId !== undefined) update.eventId = data.eventId;

    const presence = await UserPresence.findOneAndUpdate(
      { userId },
      update,
      { upsert: true, new: true }
    );

    logger.debug(`Presence updated: ${userId}`, { status: update.status });

    return presence;
  }

  // Go offline
  async goOffline(userId: string): Promise<void> {
    await UserPresence.findOneAndUpdate(
      { userId },
      { status: 'offline', lastUpdate: new Date() }
    );

    logger.info(`Presence offline: ${userId}`);
  }

  // Get nearby riders
  async getNearbyRiders(
    coordinates: [number, number],
    radiusKm: number = 10,
    status?: string
  ): Promise<IUserPresence[]> {
    return UserPresence.findNearby(coordinates, radiusKm, status);
  }

  // Get city presence
  async getCityPresence(city: string): Promise<IUserPresence[]> {
    return UserPresence.findByCity(city);
  }

  // Get active riders count
  async getActiveRidersCount(): Promise<number> {
    return UserPresence.countDocuments({ status: { $ne: 'offline' } });
  }

  // Get live stats
  async getLiveStats(): Promise<{
    total: number;
    riding: number;
    idle: number;
    online: number;
    topCities: { city: string; count: number }[];
  }> {
    const stats = await UserPresence.getLivePresenceStats();

    const byStatus: any = {};
    for (const item of stats.byStatus) {
      byStatus[item.status] = item.count;
    }

    return {
      total: stats.total,
      riding: byStatus.riding || 0,
      idle: byStatus.idle || 0,
      online: byStatus.online || 0,
      topCities: stats.topCities,
    };
  }

  // Check for SOS nearby
  async checkSOSNearby(
    coordinates: [number, number],
    radiusKm: number = 20
  ): Promise<IUserPresence[]> {
    // Get all online riders in radius
    return UserPresence.findNearby(coordinates, radiusKm, 'online');
  }
}

// Singleton instance
let presenceService: PresenceService | null = null;

export function getPresenceService(): PresenceService {
  if (!presenceService) {
    presenceService = new PresenceService();
  }
  return presenceService;
}
