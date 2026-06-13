import { RoomTwinModel, IRoomTwin } from '../models/index.js';
import { getEventEmitter, TwinEventType, type RoomStatusChangedEvent, type IoTStateChangedEvent } from '../events/index.js';
import {
  CreateRoomTwinRequest,
  UpdateRoomStatusRequest,
  UpdateIoTStateRequest,
  RoomTwin,
} from '../schemas/index.js';

// ============================================================================
// ROOM TWIN SERVICE
// ============================================================================

export interface RoomTwinQuery {
  property_id?: string;
  room_type?: string;
  status?: string;
  floor?: number;
  page?: number;
  limit?: number;
}

export interface RoomTwinStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  occupancy_rate: number;
  avg_rate: number;
}

export class RoomTwinService {
  private eventEmitter = getEventEmitter();

  /**
   * Create a new room twin
   */
  async create(data: CreateRoomTwinRequest): Promise<RoomTwin> {
    // Check if room already exists
    const existing = await RoomTwinModel.findOne({ room_id: data.room_id });
    if (existing) {
      throw new Error(`Room twin already exists for room_id: ${data.room_id}`);
    }

    const twin_id = `twin.hotel.room.${data.room_id}`;
    const now = new Date();

    const roomTwin = new RoomTwinModel({
      ...data,
      twin_id,
      status: {
        current: 'available',
        maintenance_alerts: [],
        ...data.status,
      },
      iot_state: {},
      housekeeping: {
        frequency: 'daily',
        supply_status: 'adequate',
        ...data.housekeeping,
      },
      revenue: {
        base_rate: 0,
        rack_rate: 0,
        minibar_balance: 0,
        ...data.revenue,
      },
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await roomTwin.save();

    // Emit event
    await this.eventEmitter.emit(TwinEventType.ROOM_TWIN_CREATED, twin_id, 'room', {
      room_id: data.room_id,
      property_id: data.property_id,
      room_type: data.room_type,
    });

    return this.toRoomTwin(roomTwin);
  }

  /**
   * Get room twin by ID
   */
  async getById(room_id: string): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOne({ room_id });
    if (!twin) return null;
    return this.toRoomTwin(twin);
  }

  /**
   * Get room twin by twin_id
   */
  async getByTwinId(twin_id: string): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOne({ twin_id });
    if (!twin) return null;
    return this.toRoomTwin(twin);
  }

  /**
   * Get room status (simplified endpoint)
   */
  async getStatus(room_id: string): Promise<{ room_id: string; status: string; current_guest_id?: string } | null> {
    const twin = await RoomTwinModel.findOne({ room_id }).select('room_id status.current current_guest_id');
    if (!twin) return null;

    return {
      room_id: twin.room_id,
      status: twin.status.current,
      current_guest_id: twin.current_guest_id || undefined,
    };
  }

  /**
   * List room twins with pagination and filters
   */
  async list(query: RoomTwinQuery = {}): Promise<{ twins: RoomTwin[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.property_id) filter.property_id = query.property_id;
    if (query.room_type) filter.room_type = query.room_type;
    if (query.status) filter['status.current'] = query.status;
    if (query.floor !== undefined) filter.floor = query.floor;

    const [twins, total] = await Promise.all([
      RoomTwinModel.find(filter).skip(skip).limit(limit).sort({ room_number: 1 }),
      RoomTwinModel.countDocuments(filter),
    ]);

    return {
      twins: twins.map(t => this.toRoomTwin(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update room twin
   */
  async update(room_id: string, data: Partial<RoomTwin>): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOneAndUpdate(
      { room_id },
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

    await this.eventEmitter.emit(TwinEventType.ROOM_TWIN_UPDATED, twin.twin_id, 'room', {
      room_id,
      ...data,
    });

    return this.toRoomTwin(twin);
  }

  /**
   * Update room status
   */
  async updateStatus(room_id: string, data: UpdateRoomStatusRequest): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOne({ room_id });
    if (!twin) return null;

    const previousStatus = twin.status.current;

    const updated = await RoomTwinModel.findOneAndUpdate(
      { room_id },
      {
        $set: {
          'status.current': data.status,
          'status.next_available': data.next_available ? new Date(data.next_available) : twin.status.next_available,
          'status.maintenance_alerts': data.maintenance_alerts || twin.status.maintenance_alerts,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    // Emit status change event
    const event: RoomStatusChangedEvent = await this.eventEmitter.emit(
      TwinEventType.ROOM_STATUS_CHANGED,
      twin.twin_id,
      'room',
      {
        room_id,
        property_id: twin.property_id || '',
        previous_status: previousStatus,
        new_status: data.status,
      }
    ) as RoomStatusChangedEvent;

    // Emit occupied/vacated events
    if (previousStatus !== 'occupied' && data.status === 'occupied') {
      await this.eventEmitter.emit(TwinEventType.ROOM_OCCUPIED, twin.twin_id, 'room', {
        room_id,
        property_id: twin.property_id || '',
      });
    } else if (previousStatus === 'occupied' && data.status !== 'occupied') {
      await this.eventEmitter.emit(TwinEventType.ROOM_VACATED, twin.twin_id, 'room', {
        room_id,
        property_id: twin.property_id || '',
      });
    }

    return this.toRoomTwin(updated);
  }

  /**
   * Update IoT state
   */
  async updateIoTState(room_id: string, data: UpdateIoTStateRequest): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOne({ room_id });
    if (!twin) return null;

    const updateData: Record<string, any> = {};
    const changedFields: string[] = [];

    // Build update object for IoT state fields
    if (data.thermostat) {
      if (data.thermostat.current !== undefined) {
        updateData['iot_state.thermostat.current'] = data.thermostat.current;
        changedFields.push('thermostat.current');
      }
      if (data.thermostat.target !== undefined) {
        updateData['iot_state.thermostat.target'] = data.thermostat.target;
        changedFields.push('thermostat.target');
      }
      if (data.thermostat.mode !== undefined) {
        updateData['iot_state.thermostat.mode'] = data.thermostat.mode;
        changedFields.push('thermostat.mode');
      }
    }

    if (data.lighting) {
      if (data.lighting.scene !== undefined) {
        updateData['iot_state.lighting.scene'] = data.lighting.scene;
        changedFields.push('lighting.scene');
      }
      if (data.lighting.brightness !== undefined) {
        updateData['iot_state.lighting.brightness'] = data.lighting.brightness;
        changedFields.push('lighting.brightness');
      }
    }

    if (data.blinds !== undefined) {
      updateData['iot_state.blinds'] = data.blinds;
      changedFields.push('blinds');
    }

    if (data.door_lock !== undefined) {
      updateData['iot_state.door_lock'] = data.door_lock;
      changedFields.push('door_lock');
    }

    if (data.minibar_door !== undefined) {
      updateData['iot_state.minibar_door'] = data.minibar_door;
      changedFields.push('minibar_door');
    }

    if (data.occupancy_sensor !== undefined) {
      updateData['iot_state.occupancy_sensor'] = data.occupancy_sensor;
      changedFields.push('occupancy_sensor');
    }

    const updated = await RoomTwinModel.findOneAndUpdate(
      { room_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    if (changedFields.length > 0) {
      const event: IoTStateChangedEvent = await this.eventEmitter.emit(
        TwinEventType.ROOM_IOT_STATE_CHANGED,
        twin.twin_id,
        'room',
        {
          room_id,
          changed_fields: changedFields,
          state: data,
        }
      ) as IoTStateChangedEvent;
    }

    return this.toRoomTwin(updated);
  }

  /**
   * Assign guest to room
   */
  async assignGuest(room_id: string, guest_id: string): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOneAndUpdate(
      { room_id },
      {
        $set: {
          current_guest_id: guest_id,
          'status.current': 'occupied',
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.ROOM_OCCUPIED, twin.twin_id, 'room', {
      room_id,
      property_id: twin.property_id || '',
    });

    return this.toRoomTwin(twin);
  }

  /**
   * Clear guest from room
   */
  async clearGuest(room_id: string): Promise<RoomTwin | null> {
    const twin = await RoomTwinModel.findOneAndUpdate(
      { room_id },
      {
        $set: {
          current_guest_id: null,
          'status.current': 'cleaning',
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!twin) return null;

    await this.eventEmitter.emit(TwinEventType.ROOM_VACATED, twin.twin_id, 'room', {
      room_id,
      property_id: twin.property_id || '',
    });

    return this.toRoomTwin(twin);
  }

  /**
   * Update housekeeping info
   */
  async updateHousekeeping(room_id: string, data: { last_cleaned?: string; next_scheduled?: string; frequency?: string; supply_status?: string }): Promise<RoomTwin | null> {
    const updateData: Record<string, any> = {};

    if (data.last_cleaned) updateData['housekeeping.last_cleaned'] = new Date(data.last_cleaned);
    if (data.next_scheduled) updateData['housekeeping.next_scheduled'] = new Date(data.next_scheduled);
    if (data.frequency) updateData['housekeeping.frequency'] = data.frequency;
    if (data.supply_status) updateData['housekeeping.supply_status'] = data.supply_status;

    const updated = await RoomTwinModel.findOneAndUpdate(
      { room_id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) return null;

    return this.toRoomTwin(updated);
  }

  /**
   * Get room twin statistics
   */
  async getStats(property_id?: string): Promise<RoomTwinStats> {
    const filter: Record<string, any> = {};
    if (property_id) filter.property_id = property_id;

    const [statusAgg, typeAgg, rateAgg] = await Promise.all([
      RoomTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status.current', count: { $sum: 1 } } },
      ]),
      RoomTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: '$room_type', count: { $sum: 1 } } },
      ]),
      RoomTwinModel.aggregate([
        { $match: filter },
        { $group: { _id: null, avg_rate: { $avg: '$revenue.base_rate' } } },
      ]),
    ]);

    const by_status: Record<string, number> = {};
    let totalRooms = 0;
    let occupiedRooms = 0;

    statusAgg.forEach((s: any) => {
      by_status[s._id] = s.count;
      totalRooms += s.count;
      if (s._id === 'occupied') occupiedRooms = s.count;
    });

    const by_type: Record<string, number> = {};
    typeAgg.forEach((t: any) => {
      by_type[t._id] = t.count;
    });

    return {
      total: totalRooms,
      by_status,
      by_type,
      occupancy_rate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      avg_rate: rateAgg[0]?.avg_rate || 0,
    };
  }

  /**
   * Delete room twin
   */
  async delete(room_id: string): Promise<boolean> {
    const result = await RoomTwinModel.deleteOne({ room_id });
    return result.deletedCount > 0;
  }

  /**
   * Convert Mongoose document to plain RoomTwin object
   */
  private toRoomTwin(doc: IRoomTwin): RoomTwin {
    return {
      room_id: doc.room_id,
      twin_id: doc.twin_id,
      property_id: doc.property_id,
      room_number: doc.room_number,
      room_type: doc.room_type,
      floor: doc.floor,
      view: doc.view,
      capacity: doc.capacity,
      bed_configuration: doc.bed_configuration,
      amenities: doc.amenities,
      status: {
        current: doc.status.current,
        next_available: doc.status.next_available?.toISOString(),
        maintenance_alerts: doc.status.maintenance_alerts,
      },
      iot_state: doc.iot_state,
      housekeeping: {
        last_cleaned: doc.housekeeping.last_cleaned?.toISOString(),
        next_scheduled: doc.housekeeping.next_scheduled?.toISOString(),
        frequency: doc.housekeeping.frequency,
        supply_status: doc.housekeeping.supply_status,
      },
      revenue: {
        base_rate: doc.revenue.base_rate,
        rack_rate: doc.revenue.rack_rate,
        minibar_balance: doc.revenue.minibar_balance,
        last_rate_update: doc.revenue.last_rate_update?.toISOString(),
      },
      current_guest_id: doc.current_guest_id,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      version: doc.version,
    };
  }
}

export const roomTwinService = new RoomTwinService();