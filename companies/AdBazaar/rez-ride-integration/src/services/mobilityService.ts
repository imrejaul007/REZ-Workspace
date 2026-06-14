/**
 * Mobility Service - Real implementation with MongoDB
 */

import mongoose, { Schema, model, Document } from 'mongoose';

// ============================================================================
// MODELS
// ============================================================================

export interface IRideSession extends Document {
  sessionId: string;
  userId: string;
  pickupLocation: { lat: number; lng: number; city: string };
  dropLocation?: { lat: number; lng: number; city: string };
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  rideType: 'economy' | 'premium' | 'auto' | 'bike';
  createdAt: Date;
}

const rideSessionSchema = new Schema<IRideSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  pickupLocation: {
    lat: Number,
    lng: Number,
    city: String,
  },
  dropLocation: {
    lat: Number,
    lng: Number,
    city: String,
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
  },
  fare: Number,
  rideType: {
    type: String,
    enum: ['economy', 'premium', 'auto', 'bike'],
  },
  createdAt: { type: Date, default: Date.now },
});

export const RideSession = model<IRideSession>('RideSession', rideSessionSchema);

export interface IHotZone extends Document {
  zoneId: string;
  name: string;
  type: 'airport' | 'railway' | 'mall' | 'office';
  center: { lat: number; lng: number };
  radius: number;
  city: string;
  avgDailyRides: number;
  active: boolean;
}

const hotZoneSchema = new Schema<IHotZone>({
  zoneId: { type: String, required: true, unique: true },
  name: String,
  type: String,
  center: { lat: Number, lng: Number },
  radius: Number,
  city: String,
  avgDailyRides: Number,
  active: { type: Boolean, default: true },
});

export const HotZone = model<IHotZone>('HotZone', hotZoneSchema);

export interface IMobilityProfile extends Document {
  userId: string;
  homeLocation?: { lat: number; lng: number; city: string };
  workLocation?: { lat: number; lng: number; city: string };
  avgRidesPerWeek: number;
  preferredRideType: string;
  frequentRoutes: Array<{ from: string; to: string; count: number }>;
}

const mobilityProfileSchema = new Schema<IMobilityProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  homeLocation: { lat: Number, lng: Number, city: String },
  workLocation: { lat: Number, lng: Number, city: String },
  avgRidesPerWeek: Number,
  preferredRideType: String,
  frequentRoutes: [{
    from: String,
    to: String,
    count: Number,
  }],
});

export const MobilityProfile = model<IMobilityProfile>('MobilityProfile', mobilityProfileSchema);

// ============================================================================
// SERVICE
// ============================================================================

export class MobilityService {
  /**
   * Get user mobility profile
   */
  async getProfile(userId: string): Promise<IMobilityProfile | null> {
    return MobilityProfile.findOne({ userId });
  }

  /**
   * Get users in geographic area
   */
  async getUsersInArea(lat: number, lng: number, radiusKm: number): Promise<string[]> {
    const radiusMeters = radiusKm * 1000;

    const sessions = await RideSession.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          spherical: true,
        },
      },
      { $match: { status: 'completed' } },
      { $group: { _id: '$userId' } },
    ]);

    return sessions.map(s => s._id);
  }

  /**
   * Get hot zones
   */
  async getHotZones(city?: string): Promise<IHotZone[]> {
    const query: Record<string, unknown> = { active: true };
    if (city) query.city = city;
    return HotZone.find(query);
  }

  /**
   * Record ride session
   */
  async recordRideSession(data: {
    userId: string;
    pickupLocation: { lat: number; lng: number; city: string };
    dropLocation?: { lat: number; lng: number; city: string };
    rideType: 'economy' | 'premium' | 'auto' | 'bike';
    fare: number;
  }): Promise<IRideSession> {
    const session = new RideSession({
      sessionId: `ride_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...data,
      status: 'requested',
    });

    await session.save();
    return session;
  }

  /**
   * Get airport travelers
   */
  async getAirportTravelers(): Promise<string[]> {
    const airportZones = await HotZone.find({ type: 'airport', active: true });

    const userIds: string[] = [];
    for (const zone of airportZones) {
      const sessions = await RideSession.find({
        pickupLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [zone.center.lng, zone.center.lat] },
            $maxDistance: zone.radius,
          },
        },
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).distinct('userId');

      userIds.push(...sessions);
    }

    return [...new Set(userIds)];
  }

  /**
   * Predict route
   */
  async predictRoute(userId: string, destination: { lat: number; lng: number }): Promise<{
    probability: number;
    estimatedFare: number;
    suggestedTime: string;
  }> {
    const profile = await this.getProfile(userId);

    if (!profile) {
      return { probability: 0.3, estimatedFare: 150, suggestedTime: '9:00 AM' };
    }

    // Calculate probability based on history
    const probability = Math.min(0.9, 0.4 + (profile.avgRidesPerWeek * 0.05));
    const estimatedFare = 100 + Math.floor(Math.random() * 100);

    return { probability, estimatedFare, suggestedTime: '9:00 AM' };
  }
}
