import { PropertyTwinModel, IPropertyTwin } from '../models/index.js';
import { getEventEmitter, TwinEventType } from '../events/index.js';
import {
  CreatePropertyTwinRequest,
  UpdatePropertyRequest,
  UpdateRevenueRequest,
  PropertyTwin,
} from '../schemas/index.js';

// ============================================================================
// PROPERTY TWIN SERVICE
// ============================================================================

export interface PropertyTwinQuery {
  brand?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface PropertyTwinStats {
  total: number;
  by_brand: Record<string, number>;
  total_rooms: number;
  avg_occupancy: number;
  total_revenue: number;
}

export class PropertyTwinService {
  private eventEmitter = getEventEmitter();

  /**
   * Create a new property twin
   */
  async create(data: CreatePropertyTwinRequest): Promise<PropertyTwin> {
    // Check if property already exists
    const existing = await PropertyTwinModel.findOne({ property_id: data.property_id });
    if (existing) {
      throw new Error(`Property twin already exists for property_id: ${data.property_id}`);
    }

    const twin_id = `twin.hotel.property.${data.property_id}`;
    const now = new Date();

    const propertyTwin = new PropertyTwinModel({
      ...data,
      twin_id,
      staff: {
        total_count: 0,
        by_department: {
          front_desk: 0,
          housekeeping: 0,
          f_and_b: 0,
          maintenance: 0,
          management: 0,
          spa: 0,
          concierge: 0,
        },
        on_duty_now: 0,
        ...data.staff,
      },
      services: {
        check_in_24h: false,
        concierge_available: false,
        ...data.services,
      },
      revenue: {
        today_revenue: 0,
        mtd_revenue: 0,
        ytd_revenue: 0,
        revpar: 0,
        adr: 0,
        occupancy_rate: 0,
        ...data.revenue,
      },
      settings: {},
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await propertyTwin.save();

    // Emit event
    await this.eventEmitter.emit(TwinEventType.PROPERTY_TWIN_CREATED, twin_id, 'property', {
      property_id: data.property_id,
      brand: data.brand,
      name: data.name,
    });

    return this.toPropertyTwin(propertyTwin);
  }

  /**
   * Get property twin by ID
   */
  async getById(property_id: string): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOne({ property_id });
    if (!twin) return null;
    return this.toPropertyTwin(twin);
  }

  /**
   * Get property twin by twin_id
   */
  async getByTwinId(twin_id: string): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOne({ twin_id });
    if (!twin) return null;
    return this.toPropertyTwin(twin);
  }

  /**
   * List property twins with pagination and filters
   */
  async list(query: PropertyTwinQuery = {}): Promise<{ twins: PropertyTwin[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.brand) filter.brand = query.brand;
    if (query.city) filter['location.city'] = query.city;

    const [twins, total] = await Promise.all([
      PropertyTwinModel.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      PropertyTwinModel.countDocuments(filter),
    ]);

    return {
      twins: twins.map(t => this.toPropertyTwin(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update property twin
   */
  async update(property_id: string, data: UpdatePropertyRequest): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOneAndUpdate(
      { property_id },
      {
        $set: {
          ...data,
          version: data.version ? data.version + 1 : undefined,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.PROPERTY_TWIN_UPDATED, twin.twin_id, 'property', {
      property_id,
      ...data,
    });

    return this.toPropertyTwin(twin);
  }

  /**
   * Update inventory
   */
  async updateInventory(property_id: string, data: { available_today?: number; available_tomorrow?: number; by_type?: Record<string, number> }): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOne({ property_id });
    if (!twin) return null;

    const updateData: Record<string, any> = {};
    if (data.available_today !== undefined) updateData['inventory.available_today'] = data.available_today;
    if (data.available_tomorrow !== undefined) updateData['inventory.available_tomorrow'] = data.available_tomorrow;
    if (data.by_type) {
      Object.entries(data.by_type).forEach(([key, value]) => {
        updateData[`inventory.by_type.${key}`] = value;
      });
    }

    const updated = await PropertyTwinModel.findOneAndUpdate(
      { property_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.PROPERTY_INVENTORY_CHANGED, twin.twin_id, 'property', {
      property_id,
      inventory: data,
    });

    return this.toPropertyTwin(updated);
  }

  /**
   * Update revenue metrics
   */
  async updateRevenue(property_id: string, data: UpdateRevenueRequest): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOne({ property_id });
    if (!twin) return null;

    const updateData: Record<string, any> = {};
    if (data.today_revenue !== undefined) updateData['revenue.today_revenue'] = data.today_revenue;
    if (data.mtd_revenue !== undefined) updateData['revenue.mtd_revenue'] = data.mtd_revenue;
    if (data.ytd_revenue !== undefined) updateData['revenue.ytd_revenue'] = data.ytd_revenue;
    if (data.revpar !== undefined) updateData['revenue.revpar'] = data.revpar;
    if (data.adr !== undefined) updateData['revenue.adr'] = data.adr;
    if (data.occupancy_rate !== undefined) updateData['revenue.occupancy_rate'] = data.occupancy_rate;

    const updated = await PropertyTwinModel.findOneAndUpdate(
      { property_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    await this.eventEmitter.emit(TwinEventType.PROPERTY_REVENUE_UPDATED, twin.twin_id, 'property', {
      property_id,
      revenue: data,
    });

    return this.toPropertyTwin(updated);
  }

  /**
   * Add or update venue
   */
  async upsertVenue(property_id: string, venue: { venue_id: string; name: string; type: string; capacity: number; hours?: any; pos_revenue_center_id?: string }): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOne({ property_id });
    if (!twin) return null;

    // Find existing venue index
    const venueIndex = twin.venues.findIndex(v => v.venue_id === venue.venue_id);

    if (venueIndex >= 0) {
      // Update existing venue
      twin.venues[venueIndex] = venue as any;
    } else {
      // Add new venue
      twin.venues.push(venue as any);
    }

    twin.updated_at = new Date();
    await twin.save();

    await this.eventEmitter.emit(TwinEventType.PROPERTY_TWIN_UPDATED, twin.twin_id, 'property', {
      property_id,
      venue_added: venue.venue_id,
    });

    return this.toPropertyTwin(twin);
  }

  /**
   * Remove venue
   */
  async removeVenue(property_id: string, venue_id: string): Promise<PropertyTwin | null> {
    const twin = await PropertyTwinModel.findOneAndUpdate(
      { property_id },
      {
        $pull: {
          venues: { venue_id },
        },
        $set: {
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.PROPERTY_TWIN_UPDATED, twin.twin_id, 'property', {
      property_id,
      venue_removed: venue_id,
    });

    return this.toPropertyTwin(twin);
  }

  /**
   * Update staff counts
   */
  async updateStaff(property_id: string, data: { total_count?: number; by_department?: Record<string, number>; on_duty_now?: number }): Promise<PropertyTwin | null> {
    const updateData: Record<string, any> = {};

    if (data.total_count !== undefined) updateData['staff.total_count'] = data.total_count;
    if (data.on_duty_now !== undefined) updateData['staff.on_duty_now'] = data.on_duty_now;
    if (data.by_department) {
      Object.entries(data.by_department).forEach(([key, value]) => {
        updateData[`staff.by_department.${key}`] = value;
      });
    }

    const updated = await PropertyTwinModel.findOneAndUpdate(
      { property_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    return this.toPropertyTwin(updated);
  }

  /**
   * Get property twin statistics
   */
  async getStats(): Promise<PropertyTwinStats> {
    const [brandAgg, inventoryAgg, revenueAgg] = await Promise.all([
      PropertyTwinModel.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
      ]),
      PropertyTwinModel.aggregate([
        { $group: { _id: null, total_rooms: { $sum: '$inventory.total_rooms' }, avg_occupancy: { $avg: '$revenue.occupancy_rate' } } },
      ]),
      PropertyTwinModel.aggregate([
        { $group: { _id: null, total_revenue: { $sum: '$revenue.ytd_revenue' } } },
      ]),
    ]);

    const by_brand: Record<string, number> = {};
    brandAgg.forEach((b: any) => {
      by_brand[b._id] = b.count;
    });

    return {
      total: brandAgg.reduce((sum: number, b: any) => sum + b.count, 0),
      by_brand,
      total_rooms: inventoryAgg[0]?.total_rooms || 0,
      avg_occupancy: inventoryAgg[0]?.avg_occupancy || 0,
      total_revenue: revenueAgg[0]?.total_revenue || 0,
    };
  }

  /**
   * Delete property twin
   */
  async delete(property_id: string): Promise<boolean> {
    const result = await PropertyTwinModel.deleteOne({ property_id });
    return result.deletedCount > 0;
  }

  /**
   * Convert Mongoose document to plain PropertyTwin object
   */
  private toPropertyTwin(doc: IPropertyTwin): PropertyTwin {
    return {
      property_id: doc.property_id,
      twin_id: doc.twin_id,
      brand: doc.brand,
      name: doc.name,
      location: doc.location,
      inventory: doc.inventory,
      venues: doc.venues.map(v => ({
        venue_id: v.venue_id,
        name: v.name,
        type: v.type,
        capacity: v.capacity,
        hours: v.hours ? Object.fromEntries(v.hours) : undefined,
        pos_revenue_center_id: v.pos_revenue_center_id,
      })),
      staff: doc.staff,
      services: doc.services,
      revenue: doc.revenue,
      settings: doc.settings,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      version: doc.version,
    };
  }
}

export const propertyTwinService = new PropertyTwinService();