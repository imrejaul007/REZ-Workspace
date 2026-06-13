import { RoomTwin, IRoomTwin, IIoTDeviceState, IRoomOccupancy } from '../models';
import { logger } from '../utils/logger';

export interface CreateRoomTwinDTO {
  roomId: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'out-of-order' | 'cleaning' | 'inspected';
  occupancy?: Partial<IRoomOccupancy>;
  iotState?: IIoTDeviceState[];
  features: {
    bedType: 'king' | 'queen' | 'twin' | 'double' | 'suite';
    bedCount: number;
    maxOccupancy: number;
    roomSize: number;
    floor: number;
    view?: 'city' | 'ocean' | 'garden' | 'pool' | 'mountain' | 'courtyard' | 'none';
    balcony?: boolean;
    bathtub?: boolean;
    showerType?: 'standup' | 'walkin' | 'both';
    amenities?: string[];
    accessibility?: boolean;
    smoking?: boolean;
  };
  currentCondition?: {
    cleanlinessScore?: number;
    maintenanceIssues?: string[];
    lastInspected?: Date;
    nextScheduledMaintenance?: Date;
  };
  pricing: {
    baseRate: number;
    currency?: string;
    weekendRate?: number;
    seasonalRates?: {
      name: string;
      startDate: Date;
      endDate: Date;
      multiplier: number;
    }[];
  };
  tags?: string[];
}

export interface RoomTwinFilters {
  propertyId?: string;
  status?: string;
  bedType?: string;
  floor?: number;
  view?: string;
  minPrice?: number;
  maxPrice?: number;
  accessibility?: boolean;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface RoomAvailabilityQuery {
  propertyId: string;
  checkIn?: Date;
  checkOut?: Date;
  guestCount?: number;
  bedType?: string;
  floor?: number;
  view?: string;
  accessibility?: boolean;
  limit?: number;
}

export class RoomTwinService {
  /**
   * Create a new room twin
   */
  async create(dto: CreateRoomTwinDTO): Promise<IRoomTwin> {
    logger.info(`Creating room twin for roomId: ${dto.roomId}`);

    const existingTwin = await RoomTwin.findOne({ roomId: dto.roomId });
    if (existingTwin) {
      throw new Error(`Room twin with roomId ${dto.roomId} already exists`);
    }

    const roomTwin = new RoomTwin({
      roomId: dto.roomId,
      propertyId: dto.propertyId,
      roomNumber: dto.roomNumber,
      floor: dto.floor,
      roomType: dto.roomType,
      status: dto.status || 'available',
      occupancy: {
        isOccupied: dto.occupancy?.isOccupied || false,
        currentGuestId: dto.occupancy?.currentGuestId,
        checkIn: dto.occupancy?.checkIn,
        checkOut: dto.occupancy?.checkOut,
        expectedArrival: dto.occupancy?.expectedArrival,
        lastUpdated: new Date(),
      },
      iotState: dto.iotState || [],
      features: {
        bedType: dto.features.bedType,
        bedCount: dto.features.bedCount,
        maxOccupancy: dto.features.maxOccupancy,
        roomSize: dto.features.roomSize,
        floor: dto.features.floor,
        view: dto.features.view || 'none',
        balcony: dto.features.balcony || false,
        bathtub: dto.features.bathtub || false,
        showerType: dto.features.showerType || 'standup',
        amenities: dto.features.amenities || [],
        accessibility: dto.features.accessibility || false,
        smoking: dto.features.smoking || false,
      },
      currentCondition: {
        cleanlinessScore: dto.currentCondition?.cleanlinessScore || 100,
        maintenanceIssues: dto.currentCondition?.maintenanceIssues || [],
        lastInspected: dto.currentCondition?.lastInspected || new Date(),
        nextScheduledMaintenance: dto.currentCondition?.nextScheduledMaintenance,
      },
      pricing: {
        baseRate: dto.pricing.baseRate,
        currency: dto.pricing.currency || 'USD',
        weekendRate: dto.pricing.weekendRate,
        seasonalRates: dto.pricing.seasonalRates,
      },
      tags: dto.tags || [],
      statusHistory: [
        {
          status: dto.status || 'available',
          changedAt: new Date(),
          changedBy: 'system',
          reason: 'Room twin created',
        },
      ],
    });

    await roomTwin.save();
    logger.info(`Room twin created successfully: ${roomTwin._id}`);
    return roomTwin;
  }

  /**
   * Get room twin by ID
   */
  async getById(roomId: string): Promise<IRoomTwin | null> {
    logger.debug(`Getting room twin for roomId: ${roomId}`);
    return RoomTwin.findOne({ roomId });
  }

  /**
   * Get room status
   */
  async getStatus(roomId: string): Promise<{
    roomId: string;
    status: string;
    occupancy: IRoomOccupancy;
    readinessScore: number;
    needsMaintenance: boolean;
    lastUpdated: Date;
  } | null> {
    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) return null;

    return {
      roomId: roomTwin.roomId,
      status: roomTwin.status,
      occupancy: roomTwin.occupancy,
      readinessScore: roomTwin.getReadinessScore(),
      needsMaintenance: roomTwin.needsMaintenance(),
      lastUpdated: roomTwin.metadata.lastActivity,
    };
  }

  /**
   * Update room status
   */
  async updateStatus(
    roomId: string,
    status: IRoomTwin['status'],
    changedBy: string = 'system',
    reason?: string
  ): Promise<IRoomTwin | null> {
    logger.info(`Updating status for roomId: ${roomId} to ${status}`);

    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) {
      throw new Error(`Room twin not found for roomId: ${roomId}`);
    }

    roomTwin.status = status;
    roomTwin.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy,
      reason: reason || `Status changed to ${status}`,
    });

    // Keep only last 50 status history entries
    if (roomTwin.statusHistory.length > 50) {
      roomTwin.statusHistory = roomTwin.statusHistory.slice(-50);
    }

    roomTwin.metadata.lastActivity = new Date();
    await roomTwin.save();

    logger.info(`Status updated for roomId: ${roomId}`);
    return roomTwin;
  }

  /**
   * Update room condition
   */
  async updateCondition(
    roomId: string,
    condition: {
      cleanlinessScore?: number;
      maintenanceIssues?: string[];
      lastInspected?: Date;
      nextScheduledMaintenance?: Date;
    }
  ): Promise<IRoomTwin | null> {
    logger.info(`Updating condition for roomId: ${roomId}`);

    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) {
      throw new Error(`Room twin not found for roomId: ${roomId}`);
    }

    if (condition.cleanlinessScore !== undefined) {
      roomTwin.currentCondition.cleanlinessScore = condition.cleanlinessScore;
    }
    if (condition.maintenanceIssues !== undefined) {
      roomTwin.currentCondition.maintenanceIssues = condition.maintenanceIssues;
    }
    if (condition.lastInspected) {
      roomTwin.currentCondition.lastInspected = condition.lastInspected;
    }
    if (condition.nextScheduledMaintenance) {
      roomTwin.currentCondition.nextScheduledMaintenance = condition.nextScheduledMaintenance;
    }

    roomTwin.metadata.lastActivity = new Date();
    await roomTwin.save();

    logger.info(`Condition updated for roomId: ${roomId}`);
    return roomTwin;
  }

  /**
   * Update IoT device state
   */
  async updateIoTState(
    roomId: string,
    deviceState: IIoTDeviceState
  ): Promise<IRoomTwin | null> {
    logger.info(`Updating IoT state for roomId: ${roomId}, device: ${deviceState.deviceId}`);

    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) {
      throw new Error(`Room twin not found for roomId: ${roomId}`);
    }

    const deviceIndex = roomTwin.iotState.findIndex(
      (d) => d.deviceId === deviceState.deviceId
    );

    if (deviceIndex >= 0) {
      roomTwin.iotState[deviceIndex] = {
        ...roomTwin.iotState[deviceIndex],
        ...deviceState,
        lastUpdated: new Date(),
      };
    } else {
      roomTwin.iotState.push({
        ...deviceState,
        lastUpdated: new Date(),
      });
    }

    roomTwin.metadata.lastActivity = new Date();
    await roomTwin.save();

    logger.info(`IoT state updated for roomId: ${roomId}`);
    return roomTwin;
  }

  /**
   * Check-in guest to room
   */
  async checkIn(
    roomId: string,
    guestId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<IRoomTwin | null> {
    logger.info(`Checking in guest ${guestId} to room ${roomId}`);

    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) {
      throw new Error(`Room twin not found for roomId: ${roomId}`);
    }

    if (roomTwin.status !== 'available') {
      throw new Error(`Room ${roomId} is not available for check-in`);
    }

    roomTwin.occupancy = {
      isOccupied: true,
      currentGuestId: guestId,
      checkIn,
      checkOut,
      lastUpdated: new Date(),
    };

    await this.updateStatus(roomId, 'occupied', guestId, `Guest ${guestId} checked in`);

    roomTwin.metadata.lastActivity = new Date();
    await roomTwin.save();

    logger.info(`Guest ${guestId} checked in to room ${roomId}`);
    return roomTwin;
  }

  /**
   * Check-out guest from room
   */
  async checkOut(roomId: string): Promise<IRoomTwin | null> {
    logger.info(`Checking out room ${roomId}`);

    const roomTwin = await RoomTwin.findOne({ roomId });
    if (!roomTwin) {
      throw new Error(`Room twin not found for roomId: ${roomId}`);
    }

    roomTwin.occupancy = {
      isOccupied: false,
      lastUpdated: new Date(),
    };

    await this.updateStatus(roomId, 'cleaning', 'system', 'Guest checked out');

    roomTwin.metadata.lastActivity = new Date();
    await roomTwin.save();

    logger.info(`Room ${roomId} checked out and marked for cleaning`);
    return roomTwin;
  }

  /**
   * Query room twins with filters
   */
  async query(filters: RoomTwinFilters): Promise<{ rooms: IRoomTwin[]; total: number }> {
    const { propertyId, status, bedType, floor, view, minPrice, maxPrice, accessibility, tag, limit = 20, offset = 0 } = filters;

    const query: Record<string, unknown> = {};

    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;
    if (bedType) query['features.bedType'] = bedType;
    if (floor !== undefined) query.floor = floor;
    if (view) query['features.view'] = view;
    if (minPrice !== undefined) query['pricing.baseRate'] = { $gte: minPrice };
    if (maxPrice !== undefined) query['pricing.baseRate'] = { ...(query['pricing.baseRate'] as object || {}), $lte: maxPrice };
    if (accessibility !== undefined) query['features.accessibility'] = accessibility;
    if (tag) query.tags = tag;

    const [rooms, total] = await Promise.all([
      RoomTwin.find(query).skip(offset).limit(limit).sort({ roomNumber: 1 }),
      RoomTwin.countDocuments(query),
    ]);

    return { rooms, total };
  }

  /**
   * Find available rooms
   */
  async findAvailable(query: RoomAvailabilityQuery): Promise<IRoomTwin[]> {
    const { propertyId, guestCount = 1, bedType, floor, view, accessibility, limit = 20 } = query;

    const filterQuery: Record<string, unknown> = {
      propertyId,
      status: 'available',
      'occupancy.isOccupied': false,
      'features.maxOccupancy': { $gte: guestCount },
    };

    if (bedType) filterQuery['features.bedType'] = bedType;
    if (floor !== undefined) filterQuery.floor = floor;
    if (view) filterQuery['features.view'] = view;
    if (accessibility !== undefined) filterQuery['features.accessibility'] = accessibility;

    return RoomTwin.find(filterQuery)
      .where('currentCondition.cleanlinessScore')
      .gte(70)
      .where('status')
      .ne('out-of-order')
      .limit(limit)
      .sort({ 'pricing.baseRate': 1 });
  }

  /**
   * Get rooms needing maintenance
   */
  async getRoomsNeedingMaintenance(propertyId?: string): Promise<IRoomTwin[]> {
    const query: Record<string, unknown> = {
      $or: [
        { 'currentCondition.maintenanceIssues.0': { $exists: true } },
        { 'currentCondition.cleanlinessScore': { $lt: 70 } },
        { status: 'out-of-order' },
      ],
    };

    if (propertyId) query.propertyId = propertyId;

    return RoomTwin.find(query).sort({ 'currentCondition.cleanlinessScore': 1 });
  }

  /**
   * Get room statistics
   */
  async getStatistics(propertyId?: string): Promise<{
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    averageReadinessScore: number;
    averageCleanlinessScore: number;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (propertyId) matchStage.propertyId = propertyId;

    const stats = await RoomTwin.aggregate([
      { $match: matchStage },
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          avgReadiness: [
            {
              $project: {
                readinessScore: {
                  $subtract: [
                    100,
                    {
                      $add: [
                        { $multiply: [{ $size: '$currentCondition.maintenanceIssues' }, 10] },
                        { $multiply: [{ $subtract: [100, '$currentCondition.cleanlinessScore'] }, 0.5] },
                      ],
                    },
                  ],
                },
              },
            },
            { $group: { _id: null, avg: { $avg: '$readinessScore' } } },
          ],
          avgCleanliness: [{ $group: { _id: null, avg: { $avg: '$currentCondition.cleanlinessScore' } } }],
        },
      },
    ]);

    const result = stats[0] || {};
    const statusCounts = result.statusCounts || [];

    const getCount = (status: string) => statusCounts.find((s: { _id: string }) => s._id === status)?.count || 0;

    return {
      totalRooms: statusCounts.reduce((sum: number, s: { count: number }) => sum + s.count, 0),
      availableRooms: getCount('available'),
      occupiedRooms: getCount('occupied'),
      maintenanceRooms: getCount('maintenance') + getCount('out-of-order'),
      averageReadinessScore: result.avgReadiness?.[0]?.avg || 0,
      averageCleanlinessScore: result.avgCleanliness?.[0]?.avg || 0,
    };
  }

  /**
   * Bulk create rooms
   */
  async bulkCreate(rooms: CreateRoomTwinDTO[]): Promise<{ created: number; failed: number; errors: string[] }> {
    logger.info(`Bulk creating ${rooms.length} rooms`);

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const roomData of rooms) {
      try {
        await this.create(roomData);
        created++;
      } catch (error) {
        failed++;
        errors.push(`Room ${roomData.roomId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info(`Bulk create completed: ${created} created, ${failed} failed`);
    return { created, failed, errors };
  }
}

export const roomTwinService = new RoomTwinService();
