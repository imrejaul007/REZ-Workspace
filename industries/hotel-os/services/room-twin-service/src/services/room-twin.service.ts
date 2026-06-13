import { RoomTwin, IRoomTwin, IIoTState } from '../models/types';
import {
  CreateRoomTwinInput,
  UpdateRoomTwinInput
} from '../schemas';
import { logger } from '../utils/logger';
import { iotService } from './iot-integration.service';

export class RoomTwinService {
  /**
   * Create a new room twin
   */
  async createRoomTwin(input: CreateRoomTwinInput): Promise<IRoomTwin> {
    logger.info('Creating new room twin', { roomId: input.roomId });

    // Check if room already exists
    const existingRoom = await RoomTwin.findOne({ roomId: input.roomId });
    if (existingRoom) {
      throw new Error(`Room with ID ${input.roomId} already exists`);
    }

    // Create default IoT state
    const defaultIoTState: IIoTState = {
      temperature: 22,
      targetTemperature: 22,
      humidity: 50,
      lighting: {
        main: 0,
        ambient: 0,
        bathroom: 0
      },
      climate: {
        mode: 'auto',
        fanSpeed: 'auto'
      },
      blinds: {
        level: 0,
        mode: 'closed'
      },
      doorLock: true,
      minibar: {
        doorOpen: false,
        items: []
      },
      tv: {
        power: false,
        channel: 1,
        volume: 10,
        input: 'hdmi1'
      },
      occupancy: {
        detected: false,
        guestPresent: false
      },
      energy: {
        consumption: 0,
        unit: 'kWh'
      },
      timestamp: new Date()
    };

    // Create default devices from input
    const devices = input.devices?.map(device => ({
      ...device,
      status: device.status || 'offline',
      lastHeartbeat: device.lastHeartbeat || new Date()
    })) || [];

    const roomTwin = new RoomTwin({
      roomId: input.roomId,
      propertyId: input.propertyId,
      floor: input.floor,
      roomNumber: input.roomNumber,
      category: input.category || 'standard',
      status: 'available',
      occupancy: 'vacant',
      iot: {
        devices,
        state: defaultIoTState,
        lastSync: new Date()
      },
      features: {
        ...input.features,
        floor: input.floor // Ensure floor matches
      },
      maintenance: {
        issues: []
      }
    });

    await roomTwin.save();

    // Publish room creation event
    try {
      await iotService.publishRoomEvent(input.roomId, 'room_created', {
        propertyId: input.propertyId,
        category: input.category || 'standard'
      });
    } catch (error) {
      logger.warn('Failed to publish room creation event', { error });
    }

    logger.info('Room twin created successfully', { roomId: input.roomId });
    return roomTwin;
  }

  /**
   * Get room twin by ID
   */
  async getRoomTwin(roomId: string): Promise<IRoomTwin | null> {
    logger.debug('Fetching room twin', { roomId });
    return RoomTwin.findOne({ roomId });
  }

  /**
   * Get room twin by room number and property
   */
  async getRoomTwinByNumber(propertyId: string, roomNumber: string): Promise<IRoomTwin | null> {
    return RoomTwin.findOne({ propertyId, roomNumber });
  }

  /**
   * Get all room twins for a property
   */
  async getRoomsByProperty(propertyId: string): Promise<IRoomTwin[]> {
    return RoomTwin.find({ propertyId }).sort({ roomNumber: 1 });
  }

  /**
   * Get room status with IoT state
   */
  async getRoomStatus(roomId: string): Promise<{
    roomId: string;
    roomNumber: string;
    status: string;
    occupancy: string;
    iotState: IIoTState;
    currentGuestId: string | null;
    lastUpdated: Date;
  } | null> {
    const room = await RoomTwin.findOne({ roomId }).select(
      'roomId roomNumber status occupancy iot.state currentGuestId updatedAt'
    );

    if (!room) return null;

    return {
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      status: room.status,
      occupancy: room.occupancy,
      iotState: room.iot.state,
      currentGuestId: room.currentGuestId,
      lastUpdated: room.updatedAt
    };
  }

  /**
   * Update room twin
   */
  async updateRoomTwin(roomId: string, input: UpdateRoomTwinInput): Promise<IRoomTwin | null> {
    logger.info('Updating room twin', { roomId, updates: input });

    const updateData: Record<string, unknown> = {};

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.occupancy !== undefined) {
      updateData.occupancy = input.occupancy;
    }

    if (input.currentGuestId !== undefined) {
      updateData.currentGuestId = input.currentGuestId || null;
    }

    if (input.currentReservationId !== undefined) {
      updateData.currentReservationId = input.currentReservationId || null;
    }

    if (input.features !== undefined) {
      updateData.features = input.features;
    }

    if (input.iotState !== undefined) {
      updateData['iot.state'] = {
        ...input.iotState,
        timestamp: new Date()
      };
      updateData['iot.lastSync'] = new Date();
    }

    const room = await RoomTwin.findOneAndUpdate(
      { roomId },
      { $set: updateData },
      { new: true }
    );

    if (room) {
      // Publish status change if status was updated
      if (input.status !== undefined) {
        try {
          await iotService.publishRoomStatus(roomId, {
            status: input.status,
            occupancy: room.occupancy
          });
        } catch (error) {
          logger.warn('Failed to publish room status change', { error });
        }
      }

      // Publish occupancy change
      if (input.occupancy !== undefined) {
        try {
          await iotService.publishRoomEvent(roomId, 'occupancy_changed', {
            occupancy: input.occupancy,
            guestId: input.currentGuestId
          });
        } catch (error) {
          logger.warn('Failed to publish occupancy change', { error });
        }
      }
    }

    return room;
  }

  /**
   * Update IoT state directly from IoT events
   */
  async updateIoTState(roomId: string, stateUpdate: Partial<IIoTState>): Promise<IRoomTwin | null> {
    return RoomTwin.findOneAndUpdate(
      { roomId },
      {
        $set: {
          'iot.state': {
            ...stateUpdate,
            timestamp: new Date()
          },
          'iot.lastSync': new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Check-in guest to room
   */
  async checkInGuest(roomId: string, guestId: string, reservationId: string): Promise<IRoomTwin | null> {
    logger.info('Checking in guest to room', { roomId, guestId, reservationId });

    const room = await RoomTwin.findOneAndUpdate(
      { roomId },
      {
        $set: {
          status: 'occupied',
          occupancy: 'occupied',
          currentGuestId: guestId,
          currentReservationId: reservationId,
          'iot.state.occupancy.guestPresent': true
        }
      },
      { new: true }
    );

    if (room) {
      // Unlock door on check-in
      try {
        await iotService.sendCommand({
          deviceId: 'door-lock',
          roomId,
          command: 'unlock',
          parameters: { duration: 5000 }
        });
      } catch (error) {
        logger.warn('Failed to send unlock command', { error });
      }
    }

    return room;
  }

  /**
   * Check-out guest from room
   */
  async checkOutGuest(roomId: string): Promise<IRoomTwin | null> {
    logger.info('Checking out guest from room', { roomId });

    const room = await RoomTwin.findOneAndUpdate(
      { roomId },
      {
        $set: {
          status: 'cleaning',
          occupancy: 'checked-out',
          currentGuestId: null,
          currentReservationId: null,
          'iot.state.occupancy.guestPresent': false,
          'iot.state.lighting': { main: 0, ambient: 0, bathroom: 0 },
          'iot.state.tv.power': false
        }
      },
      { new: true }
    );

    return room;
  }

  /**
   * Get rooms by status
   */
  async getRoomsByStatus(propertyId: string, status: string): Promise<IRoomTwin[]> {
    return RoomTwin.find({ propertyId, status });
  }

  /**
   * Get available rooms
   */
  async getAvailableRooms(propertyId: string): Promise<IRoomTwin[]> {
    return RoomTwin.find({
      propertyId,
      status: 'available',
      occupancy: 'vacant'
    });
  }

  /**
   * Add maintenance issue
   */
  async addMaintenanceIssue(
    roomId: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<IRoomTwin | null> {
    const room = await RoomTwin.findOneAndUpdate(
      { roomId },
      {
        $push: {
          'maintenance.issues': {
            reportedAt: new Date(),
            description,
            severity,
            resolved: false
          }
        },
        $set: {
          status: severity === 'critical' ? 'out-of-order' : 'maintenance'
        }
      },
      { new: true }
    );

    return room;
  }

  /**
   * Resolve maintenance issue
   */
  async resolveMaintenanceIssue(roomId: string, issueIndex: number): Promise<IRoomTwin | null> {
    const room = await RoomTwin.findOne({ roomId });
    if (!room) return null;

    const issue = room.maintenance.issues[issueIndex];
    if (!issue) return null;

    issue.resolved = true;
    issue.resolvedAt = new Date();

    // Check if there are any unresolved issues
    const hasUnresolved = room.maintenance.issues.some((i, idx) => idx !== issueIndex && !i.resolved);

    if (!hasUnresolved) {
      room.status = 'available';
    }

    await room.save();
    return room;
  }

  /**
   * Get room statistics for a property
   */
  async getRoomStats(propertyId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    outOfOrder: number;
    cleaning: number;
    occupancyRate: number;
    avgTemperature: number;
  }> {
    const rooms = await RoomTwin.find({ propertyId });

    const stats = {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      outOfOrder: rooms.filter(r => r.status === 'out-of-order').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
      occupancyRate: rooms.length > 0 ? (rooms.filter(r => r.occupancy === 'occupied').length / rooms.length) * 100 : 0,
      avgTemperature: rooms.length > 0
        ? rooms.reduce((sum, r) => sum + r.iot.state.temperature, 0) / rooms.length
        : 0
    };

    return stats;
  }

  /**
   * Apply guest preferences to room
   */
  async applyGuestPreferences(
    roomId: string,
    preferences: {
      temperature?: number;
      lighting?: number;
    }
  ): Promise<IRoomTwin | null> {
    const updateData: Record<string, unknown> = {};

    if (preferences.temperature !== undefined) {
      updateData['iot.state.targetTemperature'] = preferences.temperature;
      // Send command to thermostat
      try {
        await iotService.sendCommand({
          deviceId: 'thermostat',
          roomId,
          command: 'setTemperature',
          parameters: { temperature: preferences.temperature }
        });
      } catch (error) {
        logger.warn('Failed to send temperature command', { error });
      }
    }

    if (preferences.lighting !== undefined) {
      updateData['iot.state.lighting.main'] = preferences.lighting;
      // Send command to lighting
      try {
        await iotService.sendCommand({
          deviceId: 'lighting',
          roomId,
          command: 'setBrightness',
          parameters: { brightness: preferences.lighting }
        });
      } catch (error) {
        logger.warn('Failed to send lighting command', { error });
      }
    }

    return RoomTwin.findOneAndUpdate(
      { roomId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Delete room twin
   */
  async deleteRoomTwin(roomId: string): Promise<boolean> {
    const result = await RoomTwin.deleteOne({ roomId });
    return result.deletedCount > 0;
  }
}

export const roomTwinService = new RoomTwinService();
