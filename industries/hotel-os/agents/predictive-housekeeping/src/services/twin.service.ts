import { GuestTwinModel, IGuestTwin, RoomTwinModel, IRoomTwin, PropertyTwinModel, IPropertyTwin } from '../models/twin.models';
import {
  GuestTwin,
  CreateGuestTwinRequest,
  UpdateGuestPreferencesRequest,
  RoomTwin,
  CreateRoomTwinRequest,
  UpdateRoomStatusRequest,
  UpdateHousekeepingRequest,
  PropertyTwin,
  CreatePropertyTwinRequest,
} from '../schemas/twin.schemas';
import { generateTwinId } from '../utils/helpers';
import { TwinNotFoundError, TwinAlreadyExistsError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class TwinService {
  // ============================================================================
  // Guest Twin Operations
  // ============================================================================

  async createGuestTwin(data: CreateGuestTwinRequest): Promise<GuestTwin> {
    logger.info('Creating guest twin', { guest_id: data.guest_id });

    const existingTwin = await GuestTwinModel.findOne({ guest_id: data.guest_id });
    if (existingTwin) {
      throw new TwinAlreadyExistsError('guest', data.guest_id);
    }

    const twin_id = generateTwinId('guest', data.guest_id);
    const now = new Date().toISOString();

    const guestTwin = new GuestTwinModel({
      ...data,
      twin_id,
      created_at: now,
      updated_at: now,
    });

    await guestTwin.save();
    logger.info('Guest twin created', { twin_id, guest_id: data.guest_id });

    return this.formatGuestTwin(guestTwin);
  }

  async getGuestTwin(guestId: string): Promise<GuestTwin> {
    logger.debug('Getting guest twin', { guest_id: guestId });

    const guestTwin = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guestTwin) {
      throw new TwinNotFoundError('guest', guestId);
    }

    return this.formatGuestTwin(guestTwin);
  }

  async getGuestTwinByTwinId(twinId: string): Promise<GuestTwin> {
    logger.debug('Getting guest twin by twin ID', { twin_id: twinId });

    const guestTwin = await GuestTwinModel.findOne({ twin_id: twinId });
    if (!guestTwin) {
      throw new TwinNotFoundError('guest', twinId);
    }

    return this.formatGuestTwin(guestTwin);
  }

  async updateGuestPreferences(
    guestId: string,
    data: UpdateGuestPreferencesRequest
  ): Promise<GuestTwin> {
    logger.info('Updating guest preferences', { guest_id: guestId });

    const guestTwin = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guestTwin) {
      throw new TwinNotFoundError('guest', guestId);
    }

    guestTwin.preferences = {
      ...guestTwin.preferences,
      ...data.preferences,
    };
    guestTwin.updated_at = new Date();

    await guestTwin.save();
    logger.info('Guest preferences updated', { guest_id: guestId });

    return this.formatGuestTwin(guestTwin);
  }

  async updateGuestTwin(guestId: string, updates: Partial<GuestTwin>): Promise<GuestTwin> {
    logger.info('Updating guest twin', { guest_id: guestId });

    const guestTwin = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guestTwin) {
      throw new TwinNotFoundError('guest', guestId);
    }

    Object.assign(guestTwin, updates);
    guestTwin.updated_at = new Date();

    await guestTwin.save();
    logger.info('Guest twin updated', { guest_id: guestId });

    return this.formatGuestTwin(guestTwin);
  }

  async getGuestsByProperty(propertyId: string): Promise<GuestTwin[]> {
    logger.debug('Getting guests by property', { property_id: propertyId });

    const guests = await GuestTwinModel.find({ preferred_property_id: propertyId });
    return guests.map(g => this.formatGuestTwin(g));
  }

  async getGuestsByRoom(roomId: string): Promise<GuestTwin | null> {
    logger.debug('Getting guest by room', { room_id: roomId });

    const guest = await GuestTwinModel.findOne({ 'current_stay.room_id': roomId });
    return guest ? this.formatGuestTwin(guest) : null;
  }

  async deleteGuestTwin(guestId: string): Promise<void> {
    logger.info('Deleting guest twin', { guest_id: guestId });

    const result = await GuestTwinModel.deleteOne({ guest_id: guestId });
    if (result.deletedCount === 0) {
      throw new TwinNotFoundError('guest', guestId);
    }

    logger.info('Guest twin deleted', { guest_id: guestId });
  }

  // ============================================================================
  // Room Twin Operations
  // ============================================================================

  async createRoomTwin(data: CreateRoomTwinRequest): Promise<RoomTwin> {
    logger.info('Creating room twin', { room_id: data.room_id });

    const existingTwin = await RoomTwinModel.findOne({ room_id: data.room_id });
    if (existingTwin) {
      throw new TwinAlreadyExistsError('room', data.room_id);
    }

    const twin_id = generateTwinId('room', data.room_id);
    const now = new Date().toISOString();

    const roomTwin = new RoomTwinModel({
      ...data,
      twin_id,
      created_at: now,
      updated_at: now,
    });

    await roomTwin.save();
    logger.info('Room twin created', { twin_id, room_id: data.room_id });

    return this.formatRoomTwin(roomTwin);
  }

  async getRoomTwin(roomId: string): Promise<RoomTwin> {
    logger.debug('Getting room twin', { room_id: roomId });

    const roomTwin = await RoomTwinModel.findOne({ room_id: roomId });
    if (!roomTwin) {
      throw new TwinNotFoundError('room', roomId);
    }

    return this.formatRoomTwin(roomTwin);
  }

  async getRoomTwinStatus(roomId: string): Promise<RoomTwin['status']> {
    logger.debug('Getting room status', { room_id: roomId });

    const roomTwin = await RoomTwinModel.findOne({ room_id: roomId }).select('status');
    if (!roomTwin) {
      throw new TwinNotFoundError('room', roomId);
    }

    return roomTwin.status;
  }

  async updateRoomTwinStatus(roomId: string, data: UpdateRoomStatusRequest): Promise<RoomTwin> {
    logger.info('Updating room status', { room_id: roomId, new_status: data.status.current });

    const roomTwin = await RoomTwinModel.findOne({ room_id: roomId });
    if (!roomTwin) {
      throw new TwinNotFoundError('room', roomId);
    }

    roomTwin.status = data.status;
    roomTwin.updated_at = new Date();

    await roomTwin.save();
    logger.info('Room status updated', { room_id: roomId });

    return this.formatRoomTwin(roomTwin);
  }

  async updateHousekeepingState(
    roomId: string,
    data: UpdateHousekeepingRequest
  ): Promise<RoomTwin> {
    logger.info('Updating housekeeping state', { room_id: roomId });

    const roomTwin = await RoomTwinModel.findOne({ room_id: roomId });
    if (!roomTwin) {
      throw new TwinNotFoundError('room', roomId);
    }

    roomTwin.housekeeping = data.housekeeping;
    roomTwin.updated_at = new Date();

    await roomTwin.save();
    logger.info('Housekeeping state updated', { room_id: roomId });

    return this.formatRoomTwin(roomTwin);
  }

  async getRoomsByProperty(propertyId: string): Promise<RoomTwin[]> {
    logger.debug('Getting rooms by property', { property_id: propertyId });

    const rooms = await RoomTwinModel.find({ property_id: propertyId });
    return rooms.map(r => this.formatRoomTwin(r));
  }

  async getRoomsByStatus(
    propertyId: string,
    status: string
  ): Promise<RoomTwin[]> {
    logger.debug('Getting rooms by status', { property_id: propertyId, status });

    const rooms = await RoomTwinModel.find({ property_id: propertyId, 'status.current': status });
    return rooms.map(r => this.formatRoomTwin(r));
  }

  async getRoomsNeedingCleaning(propertyId: string): Promise<RoomTwin[]> {
    logger.debug('Getting rooms needing cleaning', { property_id: propertyId });

    const now = new Date();
    const rooms = await RoomTwinModel.find({
      property_id: propertyId,
      $or: [
        { 'status.current': { $in: ['occupied', 'available'] } },
        { 'housekeeping.next_scheduled': { $lte: now } },
      ],
    });

    return rooms.map(r => this.formatRoomTwin(r));
  }

  async updateRoomTwin(roomId: string, updates: Partial<RoomTwin>): Promise<RoomTwin> {
    logger.info('Updating room twin', { room_id: roomId });

    const roomTwin = await RoomTwinModel.findOne({ room_id: roomId });
    if (!roomTwin) {
      throw new TwinNotFoundError('room', roomId);
    }

    Object.assign(roomTwin, updates);
    roomTwin.updated_at = new Date();

    await roomTwin.save();
    logger.info('Room twin updated', { room_id: roomId });

    return this.formatRoomTwin(roomTwin);
  }

  async deleteRoomTwin(roomId: string): Promise<void> {
    logger.info('Deleting room twin', { room_id: roomId });

    const result = await RoomTwinModel.deleteOne({ room_id: roomId });
    if (result.deletedCount === 0) {
      throw new TwinNotFoundError('room', roomId);
    }

    logger.info('Room twin deleted', { room_id: roomId });
  }

  // ============================================================================
  // Property Twin Operations
  // ============================================================================

  async createPropertyTwin(data: CreatePropertyTwinRequest): Promise<PropertyTwin> {
    logger.info('Creating property twin', { property_id: data.property_id });

    const existingTwin = await PropertyTwinModel.findOne({ property_id: data.property_id });
    if (existingTwin) {
      throw new TwinAlreadyExistsError('property', data.property_id);
    }

    const twin_id = generateTwinId('property', data.property_id);
    const now = new Date().toISOString();

    const propertyTwin = new PropertyTwinModel({
      ...data,
      twin_id,
      created_at: now,
      updated_at: now,
    });

    await propertyTwin.save();
    logger.info('Property twin created', { twin_id, property_id: data.property_id });

    return this.formatPropertyTwin(propertyTwin);
  }

  async getPropertyTwin(propertyId: string): Promise<PropertyTwin> {
    logger.debug('Getting property twin', { property_id: propertyId });

    const propertyTwin = await PropertyTwinModel.findOne({ property_id: propertyId });
    if (!propertyTwin) {
      throw new TwinNotFoundError('property', propertyId);
    }

    return this.formatPropertyTwin(propertyTwin);
  }

  async getPropertyTwinByTwinId(twinId: string): Promise<PropertyTwin> {
    logger.debug('Getting property twin by twin ID', { twin_id: twinId });

    const propertyTwin = await PropertyTwinModel.findOne({ twin_id: twinId });
    if (!propertyTwin) {
      throw new TwinNotFoundError('property', twinId);
    }

    return this.formatPropertyTwin(propertyTwin);
  }

  async updatePropertyTwin(
    propertyId: string,
    updates: Partial<PropertyTwin>
  ): Promise<PropertyTwin> {
    logger.info('Updating property twin', { property_id: propertyId });

    const propertyTwin = await PropertyTwinModel.findOne({ property_id: propertyId });
    if (!propertyTwin) {
      throw new TwinNotFoundError('property', propertyId);
    }

    Object.assign(propertyTwin, updates);
    propertyTwin.updated_at = new Date();

    await propertyTwin.save();
    logger.info('Property twin updated', { property_id: propertyId });

    return this.formatPropertyTwin(propertyTwin);
  }

  async updatePropertyRevenue(
    propertyId: string,
    revenue: Partial<PropertyTwin['revenue']>
  ): Promise<PropertyTwin> {
    logger.info('Updating property revenue', { property_id: propertyId });

    const propertyTwin = await PropertyTwinModel.findOne({ property_id: propertyId });
    if (!propertyTwin) {
      throw new TwinNotFoundError('property', propertyId);
    }

    propertyTwin.revenue = { ...propertyTwin.revenue, ...revenue };
    propertyTwin.updated_at = new Date();

    await propertyTwin.save();
    logger.info('Property revenue updated', { property_id: propertyId });

    return this.formatPropertyTwin(propertyTwin);
  }

  async deletePropertyTwin(propertyId: string): Promise<void> {
    logger.info('Deleting property twin', { property_id: propertyId });

    const result = await PropertyTwinModel.deleteOne({ property_id: propertyId });
    if (result.deletedCount === 0) {
      throw new TwinNotFoundError('property', propertyId);
    }

    logger.info('Property twin deleted', { property_id: propertyId });
  }

  // ============================================================================
  // Formatting Helpers
  // ============================================================================

  private formatGuestTwin(twin: IRuestTwin): GuestTwin {
    return {
      guest_id: twin.guest_id,
      twin_id: twin.twin_id,
      profile: twin.profile,
      loyalty: twin.loyalty,
      preferences: twin.preferences,
      stay_patterns: twin.stay_patterns,
      sentiment: twin.sentiment,
      lifetime_value: twin.lifetime_value,
      current_stay: twin.current_stay,
      preferred_property_id: twin.preferred_property_id,
      created_at: twin.created_at?.toISOString(),
      updated_at: twin.updated_at?.toISOString(),
    };
  }

  private formatRoomTwin(twin: IRoomTwin): RoomTwin {
    return {
      room_id: twin.room_id,
      twin_id: twin.twin_id,
      property_id: twin.property_id,
      room_number: twin.room_number,
      room_type: twin.room_type,
      floor: twin.floor,
      view: twin.view,
      capacity: twin.capacity,
      bed_configuration: twin.bed_configuration,
      amenities: twin.amenities,
      status: twin.status,
      iot_state: twin.iot_state,
      housekeeping: twin.housekeeping,
      revenue: twin.revenue,
      created_at: twin.created_at?.toISOString(),
      updated_at: twin.updated_at?.toISOString(),
    };
  }

  private formatPropertyTwin(twin: IPropertyTwin): PropertyTwin {
    return {
      property_id: twin.property_id,
      twin_id: twin.twin_id,
      brand: twin.brand,
      name: twin.name,
      location: twin.location,
      inventory: {
        total_rooms: twin.inventory.total_rooms,
        by_type: twin.inventory.by_type instanceof Map
          ? Object.fromEntries(twin.inventory.by_type)
          : twin.inventory.by_type,
        available_today: twin.inventory.available_today,
        available_tomorrow: twin.inventory.available_tomorrow,
      },
      venues: twin.venues,
      staff: {
        total_count: twin.staff.total_count,
        by_department: twin.staff.by_department instanceof Map
          ? Object.fromEntries(twin.staff.by_department)
          : twin.staff.by_department,
        on_duty_now: twin.staff.on_duty_now,
      },
      services: twin.services,
      revenue: twin.revenue,
      settings: twin.settings,
      created_at: twin.created_at?.toISOString(),
      updated_at: twin.updated_at?.toISOString(),
    };
  }
}

export const twinService = new TwinService();