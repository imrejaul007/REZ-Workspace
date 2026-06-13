/**
 * AI Concierge Agent - Room Twin Service
 * Manages room digital twin operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  RoomTwin,
  RoomStatus,
  IoTState,
  ApiResponse,
} from '../types';
import {
  CreateRoomTwinSchema,
  UpdateRoomStatusSchema,
  UpdateIoTStateSchema,
  CreateRoomTwinInput,
  UpdateRoomStatusInput,
  UpdateIoTStateInput,
} from '../schemas';
import { TwinNotFoundError, TwinAlreadyExistsError } from '../utils/errors';
import { logger } from '../utils/logger';

export class RoomTwinService {
  private twins: Map<string, RoomTwin> = new Map();

  constructor() {
    // Initialize with some sample rooms for demo
    this.initializeSampleRooms();
  }

  /**
   * Create a new Room Twin
   */
  async createRoomTwin(input: CreateRoomTwinInput): Promise<ApiResponse<RoomTwin>> {
    const twinId = `twin.hotel.room.${input.room_id}`;

    // Check if twin already exists
    if (this.twins.has(twinId)) {
      throw new TwinAlreadyExistsError('Room', twinId);
    }

    // Validate input
    const validatedInput = CreateRoomTwinSchema.parse(input);

    const now = new Date().toISOString();
    const roomTwin: RoomTwin = {
      twin_id: twinId,
      room_id: validatedInput.room_id,
      property_id: validatedInput.property_id,
      room_number: validatedInput.room_number,
      room_type: validatedInput.room_type,
      floor: validatedInput.floor,
      view: validatedInput.view,
      capacity: validatedInput.capacity,
      bed_configuration: validatedInput.bed_configuration,
      amenities: validatedInput.amenities || this.getDefaultAmenities(),
      status: validatedInput.status || {
        current: 'available',
        next_available: undefined,
        maintenance_alerts: [],
      },
      iot_state: validatedInput.iot_state || this.getDefaultIoTState(),
      housekeeping: validatedInput.housekeeping || {
        last_cleaned: now,
        next_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'daily',
        supply_status: 'adequate',
      },
      revenue: validatedInput.revenue || {
        base_rate: 150,
        rack_rate: 200,
        minibar_balance: 0,
        last_rate_update: now,
      },
      created_at: now,
      updated_at: now,
      version: 1,
    };

    this.twins.set(twinId, roomTwin);

    logger.info('Room Twin created', { twinId, roomId: input.room_id });

    return {
      success: true,
      data: roomTwin,
      meta: {
        timestamp: now,
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get a Room Twin by ID
   */
  async getRoomTwin(roomId: string): Promise<ApiResponse<RoomTwin>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get room status only
   */
  async getRoomStatus(roomId: string): Promise<ApiResponse<{ status: RoomStatus; iot_state: IoTState }>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    return {
      success: true,
      data: {
        status: twin.status.current,
        iot_state: twin.iot_state,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    roomId: string,
    input: UpdateRoomStatusInput
  ): Promise<ApiResponse<RoomTwin>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    // Validate input
    const validatedInput = UpdateRoomStatusSchema.parse(input);

    twin.status = {
      current: validatedInput.current,
      next_available: validatedInput.next_available,
      maintenance_alerts: validatedInput.maintenance_alerts || twin.status.maintenance_alerts,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Room status updated', { twinId, status: validatedInput.current });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update IoT state
   */
  async updateIoTState(
    roomId: string,
    input: UpdateIoTStateInput
  ): Promise<ApiResponse<RoomTwin>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    // Validate input
    const validatedInput = UpdateIoTStateSchema.parse(input);

    // Merge IoT state
    if (validatedInput.thermostat) {
      twin.iot_state.thermostat = {
        ...twin.iot_state.thermostat,
        ...validatedInput.thermostat,
      };
    }

    if (validatedInput.lighting) {
      twin.iot_state.lighting = {
        ...twin.iot_state.lighting,
        ...validatedInput.lighting,
      };
    }

    if (validatedInput.blinds) {
      twin.iot_state.blinds = validatedInput.blinds;
    }

    if (validatedInput.door_lock) {
      twin.iot_state.door_lock = validatedInput.door_lock;
    }

    if (validatedInput.minibar_door) {
      twin.iot_state.minibar_door = validatedInput.minibar_door;
    }

    if (validatedInput.occupancy_sensor !== undefined) {
      twin.iot_state.occupancy_sensor = validatedInput.occupancy_sensor;
    }

    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Room IoT state updated', { twinId });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Update housekeeping status
   */
  async updateHousekeeping(
    roomId: string,
    status: {
      last_cleaned?: string;
      next_scheduled?: string;
      frequency?: 'daily' | 'weekly' | 'on_departure';
      supply_status?: 'adequate' | 'low' | 'critical';
    }
  ): Promise<ApiResponse<RoomTwin>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    twin.housekeeping = {
      ...twin.housekeeping,
      ...status,
    };
    twin.updated_at = new Date().toISOString();
    twin.version += 1;

    logger.info('Room housekeeping updated', { twinId });

    return {
      success: true,
      data: twin,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get all rooms by property
   */
  async getRoomsByProperty(propertyId: string): Promise<ApiResponse<RoomTwin[]>> {
    const rooms = Array.from(this.twins.values()).filter(
      (room) => room.property_id === propertyId
    );

    return {
      success: true,
      data: rooms,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get available rooms
   */
  async getAvailableRooms(propertyId: string): Promise<ApiResponse<RoomTwin[]>> {
    const rooms = Array.from(this.twins.values()).filter(
      (room) => room.property_id === propertyId && room.status.current === 'available'
    );

    return {
      success: true,
      data: rooms,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Delete a Room Twin
   */
  async deleteRoomTwin(roomId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const twinId = `twin.hotel.room.${roomId}`;
    const twin = this.twins.get(twinId);

    if (!twin) {
      throw new TwinNotFoundError('Room', twinId);
    }

    this.twins.delete(twinId);

    logger.info('Room Twin deleted', { twinId });

    return {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: uuidv4(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Get default amenities
   */
  private getDefaultAmenities() {
    return {
      smart_tv: true,
      smart_speaker: true,
      minibar: true,
      coffee_machine: true,
      safe: true,
      balcony: false,
      jacuzzi: false,
    };
  }

  /**
   * Get default IoT state
   */
  private getDefaultIoTState(): IoTState {
    return {
      thermostat: { current: 72, target: 72, mode: 'auto' },
      lighting: { scene: 'standard', brightness: 80 },
      blinds: 'closed',
      door_lock: 'locked',
      minibar_door: 'closed',
      occupancy_sensor: false,
    };
  }

  /**
   * Initialize sample rooms for demo
   */
  private initializeSampleRooms() {
    const sampleRooms = [
      {
        room_id: '101',
        property_id: 'PROP-001',
        room_number: '101',
        room_type: 'standard' as const,
        floor: 1,
        view: 'city' as const,
        capacity: { max_adults: 2, max_children: 1, max_occupancy: 3 },
        bed_configuration: { bed_count: 1, bed_type: 'queen' as const, rollaway_available: true },
      },
      {
        room_id: '201',
        property_id: 'PROP-001',
        room_number: '201',
        room_type: 'deluxe' as const,
        floor: 2,
        view: 'pool' as const,
        capacity: { max_adults: 2, max_children: 2, max_occupancy: 4 },
        bed_configuration: { bed_count: 1, bed_type: 'king' as const, rollaway_available: true },
      },
      {
        room_id: '301',
        property_id: 'PROP-001',
        room_number: '301',
        room_type: 'suite' as const,
        floor: 3,
        view: 'ocean' as const,
        capacity: { max_adults: 4, max_children: 2, max_occupancy: 6 },
        bed_configuration: { bed_count: 2, bed_type: 'king' as const, rollaway_available: false },
      },
    ];

    sampleRooms.forEach((room) => {
      const now = new Date().toISOString();
      const twinId = `twin.hotel.room.${room.room_id}`;
      this.twins.set(twinId, {
        twin_id: twinId,
        room_id: room.room_id,
        property_id: room.property_id,
        room_number: room.room_number,
        room_type: room.room_type,
        floor: room.floor,
        view: room.view,
        capacity: room.capacity,
        bed_configuration: room.bed_configuration,
        amenities: this.getDefaultAmenities(),
        status: {
          current: 'available',
          next_available: undefined,
          maintenance_alerts: [],
        },
        iot_state: this.getDefaultIoTState(),
        housekeeping: {
          last_cleaned: now,
          next_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          frequency: 'daily',
          supply_status: 'adequate',
        },
        revenue: {
          base_rate: room.room_type === 'standard' ? 150 : room.room_type === 'deluxe' ? 250 : 450,
          rack_rate: room.room_type === 'standard' ? 200 : room.room_type === 'deluxe' ? 350 : 600,
          minibar_balance: 0,
          last_rate_update: now,
        },
        created_at: now,
        updated_at: now,
        version: 1,
      });
    });
  }
}
