/**
 * Room Service
 *
 * Business logic for room management
 */

import { Room } from '../models/Room';
import { Booking } from '../models/Booking';
import { logger } from '../config/logger';
import { CreateRoomInput, UpdateRoomInput, RoomSearchFilters, RoomStatus } from '../types';

const log = (msg: string, meta?) => logger.info(`[room-service] ${msg}`, meta);

function generateRoomId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `RM${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'RM' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

class RoomService {
  /**
   * Create a new room
   */
  async createRoom(hotelId: string, input: CreateRoomInput): Promise<typeof Room.prototype> {
    const roomId = generateRoomId();

    const room = new Room({
      roomId,
      hotelId,
      ...input,
      status: 'available',
      currency: 'INR',
      isActive: true,
    });

    await room.save();
    log('Room created', { roomId, hotelId, roomNumber: input.roomNumber });

    return room;
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<typeof Room.prototype | null> {
    return Room.findOne({ roomId, isActive: true });
  }

  /**
   * Get room by hotel and room number
   */
  async getRoomByNumber(hotelId: string, roomNumber: string): Promise<typeof Room.prototype | null> {
    return Room.findOne({ hotelId, roomNumber, isActive: true });
  }

  /**
   * Get all rooms for a hotel
   */
  async getRoomsByHotel(hotelId: string): Promise<typeof Room[]> {
    return Room.find({ hotelId, isActive: true }).sort({ floor: 1, roomNumber: 1 });
  }

  /**
   * Update room
   */
  async updateRoom(roomId: string, input: UpdateRoomInput): Promise<typeof Room.prototype | null> {
    const room = await Room.findOneAndUpdate(
      { roomId, isActive: true },
      { $set: input },
      { new: true }
    );

    if (room) {
      log('Room updated', { roomId });
    }

    return room;
  }

  /**
   * Update room status
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<typeof Room.prototype | null> {
    const room = await Room.findOneAndUpdate(
      { roomId, isActive: true },
      { $set: { status } },
      { new: true }
    );

    if (room) {
      log('Room status updated', { roomId, status });
    }

    return room;
  }

  /**
   * Delete room (soft delete)
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    const result = await Room.findOneAndUpdate(
      { roomId },
      { $set: { isActive: false } }
    );

    if (result) {
      log('Room deleted', { roomId });
      return true;
    }

    return false;
  }

  /**
   * Search rooms with filters
   */
  async searchRooms(filters: RoomSearchFilters): Promise<typeof Room[]> {
    const query: Record<string, unknown> = { isActive: true };

    if (filters.hotelId) query.hotelId = filters.hotelId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.floor) query.floor = filters.floor;
    if (filters.minPrice) query.price = { ...(query.price as object || {}), $gte: filters.minPrice };
    if (filters.maxPrice) query.price = { ...(query.price as object || {}), $lte: filters.maxPrice };

    return Room.find(query).sort({ floor: 1, roomNumber: 1 });
  }

  /**
   * Get available rooms for date range
   */
  async getAvailableRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<typeof Room[]> {
    // Find rooms that are not booked during the date range
    const bookedRoomIds = await Booking.find({
      hotelId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } },
      ],
    }).distinct('roomId');

    return Room.find({
      hotelId,
      isActive: true,
      status: { $nin: ['maintenance', 'blocked'] },
      roomId: { $nin: bookedRoomIds },
    }).sort({ floor: 1, roomNumber: 1 });
  }

  /**
   * Get room availability summary
   */
  async getRoomAvailabilitySummary(hotelId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
    byType: Record<string, { total: number; available: number }>;
  }> {
    const rooms = await Room.find({ hotelId, isActive: true });

    const summary = {
      total: rooms.length,
      available: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
      byType: {} as Record<string, { total: number; available: number }>,
    };

    for (const room of rooms) {
      switch (room.status) {
        case 'available':
          summary.available++;
          break;
        case 'occupied':
          summary.occupied++;
          break;
        case 'cleaning':
          summary.cleaning++;
          break;
        case 'maintenance':
          summary.maintenance++;
          break;
      }

      if (!summary.byType[room.type]) {
        summary.byType[room.type] = { total: 0, available: 0 };
      }
      summary.byType[room.type].total++;
      if (room.status === 'available') {
        summary.byType[room.type].available++;
      }
    }

    return summary;
  }

  /**
   * Get room types with pricing
   */
  async getRoomTypes(hotelId: string): Promise<{
    type: string;
    count: number;
    available: number;
    minPrice: number;
    maxPrice: number;
  }[]> {
    const rooms = await Room.find({ hotelId, isActive: true });

    const typeMap = new Map<string, { count: number; available: number; minPrice: number; maxPrice: number }>();

    for (const room of rooms) {
      if (!typeMap.has(room.type)) {
        typeMap.set(room.type, { count: 0, available: 0, minPrice: room.price, maxPrice: room.price });
      }
      const typeData = typeMap.get(room.type)!;
      typeData.count++;
      if (room.status === 'available') typeData.available++;
      if (room.price < typeData.minPrice) typeData.minPrice = room.price;
      if (room.price > typeData.maxPrice) typeData.maxPrice = room.price;
    }

    return Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }));
  }

  /**
   * Bulk create rooms
   */
  async bulkCreateRooms(hotelId: string, rooms: CreateRoomInput[]): Promise<typeof Room[]> {
    const createdRooms: typeof Room[] = [];

    for (const roomInput of rooms) {
      const room = await this.createRoom(hotelId, roomInput);
      createdRooms.push(room);
    }

    log('Bulk rooms created', { hotelId, count: createdRooms.length });
    return createdRooms;
  }
}

export const roomService = new RoomService();
