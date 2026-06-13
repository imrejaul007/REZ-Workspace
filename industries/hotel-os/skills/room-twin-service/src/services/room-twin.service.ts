import { RoomTwin } from '../models/room-twin.model';
import {
  CreateRoomTwinRequest,
  CreateRoomTwinResponse,
  GetRoomStatusResponse,
  UpdateIoTStateRequest,
  UpdateRoomStatusRequest,
  RoomStatus,
  defaultRoomStatus,
  defaultIoTState,
  defaultHousekeeping,
  defaultRevenue
} from '../schemas/room-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { predictiveHKClient } from '../utils/predictive-hk-client';

export class RoomTwinService {
  /**
   * Create a new Room Twin
   */
  async createRoomTwin(request: CreateRoomTwinRequest): Promise<CreateRoomTwinResponse> {
    const twinId = `twin.hotel.room.${request.roomId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Room Twin', { roomId: request.roomId, twinId });

    // Check if twin already exists
    const existingTwin = await RoomTwin.findByRoomId(request.roomId);
    if (existingTwin) {
      throw new Error(`Room Twin already exists for roomId: ${request.roomId}`);
    }

    // Create the room twin document
    const roomTwin = new RoomTwin({
      twinId,
      roomId: request.roomId,
      propertyId: request.propertyId,
      roomNumber: request.roomNumber,
      roomType: request.roomType,
      floor: request.floor,
      view: request.view,
      capacity: request.capacity,
      bedConfiguration: request.bedConfiguration,
      amenities: request.amenities,
      status: defaultRoomStatus,
      iotState: defaultIoTState,
      housekeeping: defaultHousekeeping,
      revenue: defaultRevenue
    });

    await roomTwin.save();

    // Publish event to TwinOS
    await messageBroker.publish('hotel.room.created', {
      twinId,
      roomId: request.roomId,
      propertyId: request.propertyId,
      twinOsEntityId,
      roomType: request.roomType,
      timestamp: new Date().toISOString()
    });

    // Sync with Predictive Housekeeping
    await predictiveHKClient.syncRoom(request.roomId, {
      propertyId: request.propertyId,
      roomType: request.roomType,
      floor: request.floor
    });

    logger.info('Room Twin created successfully', { twinId, roomId: request.roomId });

    return {
      twinId,
      roomId: request.roomId,
      twinOsEntityId,
      createdAt: roomTwin.createdAt.toISOString()
    };
  }

  /**
   * Get Room Twin by ID
   */
  async getRoomTwin(roomId: string): Promise<RoomTwin> {
    logger.info('Fetching Room Twin', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    return roomTwin;
  }

  /**
   * Get Room Status
   */
  async getRoomStatus(roomId: string): Promise<GetRoomStatusResponse> {
    logger.info('Fetching Room Status', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    return {
      twinId: roomTwin.twinId,
      roomId: roomTwin.roomId,
      roomNumber: roomTwin.roomNumber,
      status: roomTwin.status,
      iotState: roomTwin.iotState,
      currentGuestId: roomTwin.currentGuestId,
      housekeeping: roomTwin.housekeeping,
      updatedAt: roomTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update IoT State
   */
  async updateIoTState(
    roomId: string,
    request: UpdateIoTStateRequest
  ): Promise<RoomTwin> {
    logger.info('Updating Room IoT State', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    // Merge IoT state updates
    const updatedIoTState = {
      ...roomTwin.iotState,
      ...request.iotState,
      thermostat: {
        ...roomTwin.iotState.thermostat,
        ...(request.iotState.thermostat || {})
      },
      lighting: {
        ...roomTwin.iotState.lighting,
        ...(request.iotState.lighting || {})
      }
    };

    roomTwin.iotState = updatedIoTState;
    await roomTwin.save();

    // Publish IoT event
    await messageBroker.publish('hotel.iot.event', {
      twinId: roomTwin.twinId,
      roomId,
      iotState: updatedIoTState,
      timestamp: new Date().toISOString()
    });

    logger.info('Room IoT State updated', { twinId: roomTwin.twinId, roomId });

    return roomTwin;
  }

  /**
   * Update Room Status
   */
  async updateRoomStatus(
    roomId: string,
    request: UpdateRoomStatusRequest
  ): Promise<RoomTwin> {
    logger.info('Updating Room Status', { roomId, status: request.status });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    roomTwin.status = {
      ...roomTwin.status,
      current: request.status,
      maintenanceAlerts: request.maintenanceAlerts || roomTwin.status.maintenanceAlerts
    };

    // Handle occupancy changes
    if (request.status === RoomStatus.OCCUPIED && !roomTwin.currentGuestId) {
      // Room just became occupied
    } else if (request.status !== RoomStatus.OCCUPIED && roomTwin.currentGuestId) {
      roomTwin.currentGuestId = undefined;
    }

    await roomTwin.save();

    // Publish status change event
    await messageBroker.publish('hotel.room.status.change', {
      twinId: roomTwin.twinId,
      roomId,
      previousStatus: roomTwin.status.current,
      newStatus: request.status,
      timestamp: new Date().toISOString()
    });

    // Sync with Predictive Housekeeping
    await predictiveHKClient.updateRoomStatus(roomId, request.status);

    logger.info('Room Status updated', { twinId: roomTwin.twinId, roomId, status: request.status });

    return roomTwin;
  }

  /**
   * Assign guest to room
   */
  async assignGuest(
    roomId: string,
    guestId: string,
    checkOutDate?: string
  ): Promise<void> {
    logger.info('Assigning guest to room', { roomId, guestId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    roomTwin.currentGuestId = guestId;
    roomTwin.status = {
      ...roomTwin.status,
      current: RoomStatus.OCCUPIED
    };

    if (checkOutDate) {
      roomTwin.status.nextAvailable = checkOutDate;
    }

    await roomTwin.save();

    // Publish guest assignment event
    await messageBroker.publish('hotel.room.guest.assigned', {
      twinId: roomTwin.twinId,
      roomId,
      guestId,
      checkOutDate,
      timestamp: new Date().toISOString()
    });

    logger.info('Guest assigned to room', { twinId: roomTwin.twinId, roomId, guestId });
  }

  /**
   * Vacate room (checkout)
   */
  async vacateRoom(roomId: string): Promise<void> {
    logger.info('Vacating room', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    const guestId = roomTwin.currentGuestId;
    roomTwin.currentGuestId = undefined;
    roomTwin.status = {
      ...roomTwin.status,
      current: RoomStatus.CLEANING,
      nextAvailable: new Date().toISOString()
    };

    await roomTwin.save();

    // Publish checkout event
    await messageBroker.publish('hotel.guest.checkout', {
      twinId: roomTwin.twinId,
      roomId,
      guestId,
      timestamp: new Date().toISOString()
    });

    logger.info('Room vacated', { twinId: roomTwin.twinId, roomId });
  }

  /**
   * Update housekeeping info
   */
  async updateHousekeeping(
    roomId: string,
    housekeeping: {
      lastCleaned?: string;
      nextScheduled?: string;
      frequency?: 'daily' | 'weekly' | 'on_departure';
      supplyStatus?: 'adequate' | 'low' | 'critical';
    }
  ): Promise<void> {
    logger.info('Updating housekeeping info', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    roomTwin.housekeeping = {
      ...roomTwin.housekeeping,
      ...housekeeping
    };

    await roomTwin.save();

    logger.info('Housekeeping info updated', { twinId: roomTwin.twinId, roomId });
  }

  /**
   * Update room revenue
   */
  async updateRevenue(
    roomId: string,
    revenue: {
      baseRate?: number;
      rackRate?: number;
      minibarBalance?: number;
    }
  ): Promise<void> {
    logger.info('Updating room revenue', { roomId });

    const roomTwin = await RoomTwin.findByRoomId(roomId);
    if (!roomTwin) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    roomTwin.revenue = {
      ...roomTwin.revenue,
      ...revenue,
      lastRateUpdate: new Date().toISOString()
    };

    await roomTwin.save();

    logger.info('Room revenue updated', { twinId: roomTwin.twinId, roomId });
  }

  /**
   * Get available rooms for upgrade
   */
  async getAvailableRoomsForUpgrade(
    propertyId: string,
    currentRoomType: string
  ): Promise<RoomTwin[]> {
    const upgradeMap: Record<string, RoomType[]> = {
      standard: [RoomType.DELUXE],
      deluxe: [RoomType.SUITE],
      suite: [RoomType.PENTHOUSE],
      penthouse: []
    };

    const upgradeTypes = upgradeMap[currentRoomType] || [];
    if (upgradeTypes.length === 0) return [];

    return RoomTwin.find({
      propertyId,
      roomType: { $in: upgradeTypes },
      'status.current': RoomStatus.AVAILABLE
    });
  }

  /**
   * Delete Room Twin
   */
  async deleteRoomTwin(roomId: string): Promise<void> {
    logger.info('Deleting Room Twin', { roomId });

    const result = await RoomTwin.deleteOne({ roomId });
    if (result.deletedCount === 0) {
      throw new Error(`Room Twin not found for roomId: ${roomId}`);
    }

    // Publish deletion event
    await messageBroker.publish('hotel.room.deleted', {
      roomId,
      timestamp: new Date().toISOString()
    });

    logger.info('Room Twin deleted', { roomId });
  }
}

// Export singleton instance
export const roomTwinService = new RoomTwinService();
