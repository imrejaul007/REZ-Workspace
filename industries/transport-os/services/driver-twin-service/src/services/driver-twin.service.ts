import { DriverTwinModel, IDriverTwin } from '../models/index.js';
import { getEventEmitter, TwinEventType } from '../events/index.js';
import {
  CreateDriverTwinRequest,
  UpdateDriverTwinRequest,
  UpdateStatusRequest,
  UpdateLocationRequest,
  UpdatePerformanceRequest,
  UpdateEarningsRequest,
  UpdateScheduleRequest,
  StartShiftRequest,
  EndShiftRequest,
  RatingRequest,
  DriverTwin,
} from '../schemas/index.js';

// ============================================================================
// DRIVER TWIN SERVICE
// ============================================================================

export interface DriverTwinQuery {
  fleet_id?: string;
  vehicle_id?: string;
  status?: string;
  'performance.avg_rating'?: { $gte?: number };
  page?: number;
  limit?: number;
}

export interface DriverStats {
  total: number;
  by_status: Record<string, number>;
  avg_rating: number;
  avg_acceptance_rate: number;
  total_trips: number;
  total_earnings: number;
}

export interface NearbyDriver {
  driver_id: string;
  twin_id: string;
  name: string;
  distance_km: number;
  avg_rating: number;
  vehicle_id?: string;
}

export class DriverTwinService {
  private eventEmitter = getEventEmitter();

  /**
   * Create a new driver twin
   */
  async create(data: CreateDriverTwinRequest): Promise<DriverTwin> {
    // Check if driver already exists
    const existing = await DriverTwinModel.findOne({ driver_id: data.driver_id });
    if (existing) {
      throw new Error(`Driver twin already exists for driver_id: ${data.driver_id}`);
    }

    const twin_id = `twin.transport.driver.${data.driver_id}`;
    const now = new Date();

    const driverTwin = new DriverTwinModel({
      ...data,
      twin_id,
      status: {
        current: 'offline',
      },
      performance: {
        total_trips: 0,
        total_distance_km: 0,
        total_earnings: 0,
        avg_rating: 5,
        rating_count: 0,
        acceptance_rate: 100,
        cancellation_rate: 0,
        on_time_rate: 100,
      },
      earnings: {
        today_earnings: 0,
        week_earnings: 0,
        month_earnings: 0,
        pending_payout: 0,
      },
      schedule: {
        today_hours: 0,
        week_hours: 0,
        regulatory_hours_remaining: 12,
      },
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await driverTwin.save();

    await this.eventEmitter.emit(TwinEventType.DRIVER_TWIN_CREATED, twin_id, 'driver', {
      driver_id: data.driver_id,
      profile: data.profile,
      fleet_id: data.fleet_id,
    });

    return this.toDriverTwin(driverTwin);
  }

  /**
   * Get driver twin by ID
   */
  async getById(driver_id: string): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;
    return this.toDriverTwin(twin);
  }

  /**
   * Get driver twin by twin_id
   */
  async getByTwinId(twin_id: string): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ twin_id });
    if (!twin) return null;
    return this.toDriverTwin(twin);
  }

  /**
   * List driver twins with pagination and filters
   */
  async list(query: DriverTwinQuery = {}): Promise<{ twins: DriverTwin[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.fleet_id) filter.fleet_id = query.fleet_id;
    if (query.vehicle_id) filter.vehicle_id = query.vehicle_id;
    if (query.status) filter['status.current'] = query.status;
    if (query['performance.avg_rating']) filter['performance.avg_rating'] = query['performance.avg_rating'];

    const [twins, total] = await Promise.all([
      DriverTwinModel.find(filter).skip(skip).limit(limit).sort({ updated_at: -1 }),
      DriverTwinModel.countDocuments(filter),
    ]);

    return {
      twins: twins.map(t => this.toDriverTwin(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update driver twin
   */
  async update(driver_id: string, data: UpdateDriverTwinRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          ...data,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_TWIN_UPDATED, twin.twin_id, 'driver', {
      driver_id,
      ...data,
    });

    return this.toDriverTwin(twin);
  }

  /**
   * Update driver status
   */
  async updateStatus(driver_id: string, data: UpdateStatusRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;

    const previousStatus = twin.status.current;

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.current': data.current,
          'status.vehicle_id': data.vehicle_id ?? twin.status.vehicle_id,
          'status.current_order_id': data.current_order_id ?? twin.status.current_order_id,
          ...(data.location && {
            'status.location': {
              lat: data.location.lat,
              lng: data.location.lng,
              updated_at: new Date(data.location.updated_at),
            },
          }),
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    // Event emitted for status change tracking
    await this.eventEmitter.emit(
      TwinEventType.DRIVER_STATUS_CHANGED,
      twin.twin_id,
      'driver',
      {
        driver_id,
        previous_status: previousStatus,
        new_status: data.current,
        location: data.location,
      }
    );

    return this.toDriverTwin(updated);
  }

  /**
   * Update driver location
   */
  async updateLocation(driver_id: string, data: UpdateLocationRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.location': {
            lat: data.lat,
            lng: data.lng,
            updated_at: new Date(),
          },
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    // Event emitted for location tracking
    await this.eventEmitter.emit(
      TwinEventType.DRIVER_LOCATION_UPDATED,
      twin.twin_id,
      'driver',
      {
        driver_id,
        location: { lat: data.lat, lng: data.lng },
      }
    );

    return this.toDriverTwin(updated);
  }

  /**
   * Update driver performance
   */
  async updatePerformance(driver_id: string, data: UpdatePerformanceRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;

    const updateFields: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[`performance.${key}`] = value;
      }
    });

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          ...updateFields,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_PERFORMANCE_UPDATED, twin.twin_id, 'driver', {
      driver_id,
      performance: data,
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Update driver earnings
   */
  async updateEarnings(driver_id: string, data: UpdateEarningsRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;

    const updateFields: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'last_payout' && value !== undefined) {
          updateFields['earnings.last_payout'] = {
            amount: (value as any).amount,
            date: (value as any).date,
          };
        } else {
          updateFields[`earnings.${key}`] = value;
        }
      }
    });

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          ...updateFields,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_EARNINGS_UPDATED, twin.twin_id, 'driver', {
      driver_id,
      earnings: data,
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Update driver schedule
   */
  async updateSchedule(driver_id: string, data: UpdateScheduleRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) return null;

    const updateFields: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[`schedule.${key}`] = value;
      }
    });

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          ...updateFields,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_SCHEDULE_UPDATED, twin.twin_id, 'driver', {
      driver_id,
      schedule: data,
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Start driver shift
   */
  async startShift(driver_id: string, data: StartShiftRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) {
      throw new Error(`Driver twin not found: ${driver_id}`);
    }

    if (twin.status.current !== 'offline') {
      throw new Error(`Driver ${driver_id} is already online or on a shift`);
    }

    const now = new Date();

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.current': 'online',
          'status.vehicle_id': data.vehicle_id,
          vehicle_id: data.vehicle_id,
          'schedule.shift_start': now,
          updated_at: now,
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_SHIFT_STARTED, twin.twin_id, 'driver', {
      driver_id,
      vehicle_id: data.vehicle_id,
      shift_start: now.toISOString(),
    });

    return this.toDriverTwin(updated);
  }

  /**
   * End driver shift
   */
  async endShift(driver_id: string, _data: EndShiftRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) {
      throw new Error(`Driver twin not found: ${driver_id}`);
    }

    if (twin.status.current === 'offline') {
      throw new Error(`Driver ${driver_id} is not on a shift`);
    }

    const now = new Date();
    const shiftStart = twin.schedule.shift_start;
    const shiftDurationHours = shiftStart ? (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60) : 0;

    // Reset today's hours
    const todayHours = twin.schedule.today_hours + shiftDurationHours;
    const newRegulatoryHours = Math.max(0, 12 - todayHours);

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.current': 'offline',
          'status.vehicle_id': null,
          'status.current_order_id': null,
          'schedule.shift_end': now,
          'schedule.today_hours': todayHours,
          'schedule.regulatory_hours_remaining': newRegulatoryHours,
          updated_at: now,
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_SHIFT_ENDED, twin.twin_id, 'driver', {
      driver_id,
      shift_end: now.toISOString(),
      shift_duration_hours: shiftDurationHours,
      earnings: {
        today: updated.earnings.today_earnings,
        week: updated.earnings.week_earnings,
      },
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Record driver rating
   */
  async recordRating(driver_id: string, data: RatingRequest): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) {
      throw new Error(`Driver twin not found: ${driver_id}`);
    }

    // Calculate new average rating
    const currentCount = twin.performance.rating_count;
    const currentAvg = twin.performance.avg_rating;
    const newRating = data.rating;
    const newCount = currentCount + 1;
    const newAvg = ((currentAvg * currentCount) + newRating) / newCount;

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'performance.avg_rating': newAvg,
          'performance.rating_count': newCount,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_RATING_RECEIVED, twin.twin_id, 'driver', {
      driver_id,
      rating: newRating,
      trip_id: data.trip_id,
      order_id: data.order_id,
      feedback: data.feedback,
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Accept order
   */
  async acceptOrder(driver_id: string, order_id: string): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) {
      throw new Error(`Driver twin not found: ${driver_id}`);
    }

    if (twin.status.current !== 'online') {
      throw new Error(`Driver ${driver_id} is not available to accept orders`);
    }

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.current': 'busy',
          'status.current_order_id': order_id,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_ORDER_ACCEPTED, twin.twin_id, 'driver', {
      driver_id,
      order_id,
      pickup_location: twin.status.location || { lat: 0, lng: 0 },
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Cancel order
   */
  async cancelOrder(driver_id: string, order_id: string, reason?: string): Promise<DriverTwin | null> {
    const twin = await DriverTwinModel.findOne({ driver_id });
    if (!twin) {
      throw new Error(`Driver twin not found: ${driver_id}`);
    }

    const updated = await DriverTwinModel.findOneAndUpdate(
      { driver_id },
      {
        $set: {
          'status.current': 'online',
          'status.current_order_id': null,
          updated_at: new Date(),
        },
        $inc: {
          'performance.cancellation_rate': 1,
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.DRIVER_ORDER_CANCELLED, twin.twin_id, 'driver', {
      driver_id,
      order_id,
      reason,
    });

    return this.toDriverTwin(updated);
  }

  /**
   * Get nearby drivers
   */
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    availableOnly: boolean = true
  ): Promise<NearbyDriver[]> {
    const filter: Record<string, any> = {
      'status.location': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    };

    if (availableOnly) {
      filter['status.current'] = 'online';
    }

    const drivers = await DriverTwinModel.find(filter).limit(50);

    return drivers.map(d => ({
      driver_id: d.driver_id,
      twin_id: d.twin_id,
      name: `${d.profile.name.first} ${d.profile.name.last}`,
      distance_km: this.calculateDistance(lat, lng, d.status.location?.lat || 0, d.status.location?.lng || 0),
      avg_rating: d.performance.avg_rating,
      vehicle_id: d.vehicle_id,
    })).sort((a, b) => a.distance_km - b.distance_km);
  }

  /**
   * Get driver statistics
   */
  async getStats(fleet_id?: string): Promise<DriverStats> {
    const filter: Record<string, any> = {};
    if (fleet_id) filter.fleet_id = fleet_id;

    const [drivers, statusAgg, perfAgg] = await Promise.all([
      DriverTwinModel.find(filter),
      DriverTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status.current', count: { $sum: 1 } } },
      ]),
      DriverTwinModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avg_rating: { $avg: '$performance.avg_rating' },
            avg_acceptance: { $avg: '$performance.acceptance_rate' },
            total_trips: { $sum: '$performance.total_trips' },
            total_earnings: { $sum: '$performance.total_earnings' },
          },
        },
      ]),
    ]);

    const by_status: Record<string, number> = {};
    statusAgg.forEach((s: any) => {
      by_status[s._id] = s.count;
    });

    return {
      total: drivers.length,
      by_status,
      avg_rating: perfAgg[0]?.avg_rating || 0,
      avg_acceptance_rate: perfAgg[0]?.avg_acceptance || 0,
      total_trips: perfAgg[0]?.total_trips || 0,
      total_earnings: perfAgg[0]?.total_earnings || 0,
    };
  }

  /**
   * Delete driver twin
   */
  async delete(driver_id: string): Promise<boolean> {
    const result = await DriverTwinModel.deleteOne({ driver_id });
    return result.deletedCount > 0;
  }

  /**
   * Convert Mongoose document to plain DriverTwin object
   */
  private toDriverTwin(doc: IDriverTwin): DriverTwin {
    return {
      driver_id: doc.driver_id,
      twin_id: doc.twin_id,
      fleet_id: doc.fleet_id,
      profile: {
        name: {
          first: doc.profile.name.first,
          last: doc.profile.name.last,
        },
        email: doc.profile.email,
        phone: doc.profile.phone,
        photo_url: doc.profile.photo_url,
        date_of_birth: doc.profile.date_of_birth,
        language: doc.profile.language,
      },
      licensing: {
        license_number: doc.licensing.license_number,
        license_type: doc.licensing.license_type,
        license_expiry: doc.licensing.license_expiry,
        license_images: doc.licensing.license_images,
        background_check: {
          status: doc.licensing.background_check.status,
          completed_at: doc.licensing.background_check.completed_at?.toISOString(),
        },
      },
      status: {
        current: doc.status.current,
        location: doc.status.location ? {
          lat: doc.status.location.lat,
          lng: doc.status.location.lng,
          updated_at: doc.status.location.updated_at.toISOString(),
        } : undefined,
        vehicle_id: doc.status.vehicle_id,
        current_order_id: doc.status.current_order_id,
      },
      performance: {
        total_trips: doc.performance.total_trips,
        total_distance_km: doc.performance.total_distance_km,
        total_earnings: doc.performance.total_earnings,
        avg_rating: doc.performance.avg_rating,
        rating_count: doc.performance.rating_count,
        acceptance_rate: doc.performance.acceptance_rate,
        cancellation_rate: doc.performance.cancellation_rate,
        on_time_rate: doc.performance.on_time_rate,
      },
      earnings: {
        today_earnings: doc.earnings.today_earnings,
        week_earnings: doc.earnings.week_earnings,
        month_earnings: doc.earnings.month_earnings,
        pending_payout: doc.earnings.pending_payout,
        last_payout: doc.earnings.last_payout,
      },
      schedule: {
        today_hours: doc.schedule.today_hours,
        week_hours: doc.schedule.week_hours,
        regulatory_hours_remaining: doc.schedule.regulatory_hours_remaining,
        shift_start: doc.schedule.shift_start?.toISOString(),
        shift_end: doc.schedule.shift_end?.toISOString(),
      },
      vehicle_id: doc.vehicle_id,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      version: doc.version,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const driverTwinService = new DriverTwinService();
