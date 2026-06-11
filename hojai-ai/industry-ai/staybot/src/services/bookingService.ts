/**
 * STAYBOT - Booking Service
 * Handles all booking-related operations
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { Booking, BookingStatus, BookingSource, RoomType, Room } from '../types';

// In-memory store (replace with MongoDB in production)
const bookings: Map<string, Booking> = new Map();
const rooms: Map<string, Room> = new Map();

// Default room types and pricing
const ROOM_PRICES: Record<RoomType, number> = {
  standard: 3000,
  deluxe: 5000,
  suite: 10000,
  presidential: 25000,
};

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: {
    hotelId: string;
    guestId: string;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    roomType: RoomType;
    source?: BookingSource;
    specialRequests?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      // Find available room of requested type
      const availableRoom = this.findAvailableRoom(data.hotelId, data.roomType);
      if (!availableRoom) {
        return { success: false, error: 'No rooms available of the requested type' };
      }

      // Calculate total amount
      const nights = Math.ceil(
        (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const roomPrice = ROOM_PRICES[data.roomType];
      const subtotal = nights * roomPrice;
      const taxes = subtotal * 0.18;
      const totalAmount = subtotal + taxes;

      // Create booking
      const booking: Booking = {
        bookingId: `BOOK-${Date.now().toString(36).toUpperCase()}`,
        hotelId: data.hotelId,
        guestId: data.guestId,
        guestName: data.guestName,
        roomId: availableRoom.roomId,
        roomNumber: availableRoom.roomNumber,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        roomType: data.roomType,
        totalAmount,
        paidAmount: 0,
        status: 'confirmed',
        source: data.source || 'direct',
        specialRequests: data.specialRequests,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mark room as occupied
      availableRoom.status = 'occupied';
      availableRoom.occupancy = 100;
      rooms.set(availableRoom.roomId, availableRoom);

      // Store booking
      bookings.set(booking.bookingId, booking);

      logger.info(`Booking created: ${booking.bookingId}`, {
        bookingId: booking.bookingId,
        guestName: data.guestName,
        roomNumber: availableRoom.roomNumber,
        totalAmount,
      });

      return { success: true, booking };
    } catch (error: any) {
      logger.error(`Failed to create booking: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    return bookings.get(bookingId) || null;
  }

  /**
   * Get bookings by hotel
   */
  async getBookingsByHotel(
    hotelId: string,
    filters?: {
      status?: BookingStatus;
      checkIn?: Date;
      checkOut?: Date;
    }
  ): Promise<Booking[]> {
    let results = Array.from(bookings.values()).filter(
      (b) => b.hotelId === hotelId
    );

    if (filters?.status) {
      results = results.filter((b) => b.status === filters.status);
    }

    if (filters?.checkIn) {
      results = results.filter(
        (b) => new Date(b.checkIn) >= new Date(filters.checkIn!)
      );
    }

    if (filters?.checkOut) {
      results = results.filter(
        (b) => new Date(b.checkOut) <= new Date(filters.checkOut!)
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get bookings by guest
   */
  async getBookingsByGuest(guestId: string): Promise<Booking[]> {
    return Array.from(bookings.values())
      .filter((b) => b.guestId === guestId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = bookings.get(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // If cancelling, free up the room
    if (status === 'cancelled' && booking.status !== 'cancelled') {
      const room = rooms.get(booking.roomId);
      if (room) {
        room.status = 'available';
        room.occupancy = 0;
        rooms.set(room.roomId, room);
      }
    }

    booking.status = status;
    booking.updatedAt = new Date();
    bookings.set(bookingId, booking);

    logger.info(`Booking status updated: ${bookingId}`, {
      bookingId,
      newStatus: status,
    });

    return { success: true, booking };
  }

  /**
   * Record payment for booking
   */
  async recordPayment(
    bookingId: string,
    amount: number
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = bookings.get(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    booking.paidAmount += amount;
    booking.updatedAt = new Date();

    // Update status if fully paid
    if (booking.paidAmount >= booking.totalAmount) {
      booking.status = 'confirmed';
    }

    bookings.set(bookingId, booking);

    logger.info(`Payment recorded for booking: ${bookingId}`, {
      bookingId,
      amount,
      totalPaid: booking.paidAmount,
    });

    return { success: true, booking };
  }

  /**
   * Find available rooms
   */
  async findAvailableRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    roomType?: RoomType
  ): Promise<Room[]> {
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();

    return Array.from(rooms.values()).filter((room) => {
      if (room.hotelId !== hotelId) return false;
      if (room.status !== 'available') return false;
      if (roomType && room.roomType !== roomType) return false;

      // Check if room is available for the date range
      const conflictingBookings = Array.from(bookings.values()).filter(
        (b) =>
          b.roomId === room.roomId &&
          b.status !== 'cancelled' &&
          b.status !== 'no-show'
      );

      for (const booking of conflictingBookings) {
        const bookingCheckIn = new Date(booking.checkIn).getTime();
        const bookingCheckOut = new Date(booking.checkOut).getTime();

        // Check for overlap
        if (checkInTime < bookingCheckOut && checkOutTime > bookingCheckIn) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Initialize rooms for a hotel
   */
  async initializeRooms(hotelId: string, roomCount: number): Promise<void> {
    for (let i = 1; i <= roomCount; i++) {
      const floor = Math.ceil(i / 10);
      const roomType: RoomType =
        i <= roomCount * 0.5
          ? 'standard'
          : i <= roomCount * 0.8
          ? 'deluxe'
          : i <= roomCount * 0.95
          ? 'suite'
          : 'presidential';

      const room: Room = {
        roomId: `ROOM-${hotelId}-${i.toString().padStart(3, '0')}`,
        hotelId,
        roomNumber: `${floor}0${i % 10 || 10}`,
        roomType,
        floor,
        status: 'available',
        features: this.getRoomFeatures(roomType),
        pricePerNight: ROOM_PRICES[roomType],
        basePrice: ROOM_PRICES[roomType],
        dynamicPrice: ROOM_PRICES[roomType],
        occupancy: 0,
        lastCleaned: new Date(),
        amenities: this.getRoomAmenities(roomType),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rooms.set(room.roomId, room);
    }

    logger.info(`Initialized ${roomCount} rooms for hotel ${hotelId}`);
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<Room | null> {
    return rooms.get(roomId) || null;
  }

  /**
   * Get room by number
   */
  async getRoomByNumber(hotelId: string, roomNumber: string): Promise<Room | null> {
    return (
      Array.from(rooms.values()).find(
        (r) => r.hotelId === hotelId && r.roomNumber === roomNumber
      ) || null
    );
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    roomId: string,
    status: Room['status']
  ): Promise<{ success: boolean; room?: Room; error?: string }> {
    const room = rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    room.status = status;
    room.updatedAt = new Date();
    rooms.set(roomId, room);

    logger.info(`Room status updated: ${roomId}`, {
      roomId,
      newStatus: status,
    });

    return { success: true, room };
  }

  /**
   * Get occupancy statistics
   */
  async getOccupancyStats(hotelId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    cleaning: number;
    occupancyRate: number;
  }> {
    const hotelRooms = Array.from(rooms.values()).filter(
      (r) => r.hotelId === hotelId
    );

    const total = hotelRooms.length;
    const available = hotelRooms.filter((r) => r.status === 'available').length;
    const occupied = hotelRooms.filter((r) => r.status === 'occupied').length;
    const maintenance = hotelRooms.filter((r) => r.status === 'maintenance').length;
    const cleaning = hotelRooms.filter((r) => r.status === 'cleaning').length;

    return {
      total,
      available,
      occupied,
      maintenance,
      cleaning,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
    };
  }

  // Private helper methods
  private findAvailableRoom(hotelId: string, roomType: RoomType): Room | null {
    return (
      Array.from(rooms.values()).find(
        (r) => r.hotelId === hotelId && r.roomType === roomType && r.status === 'available'
      ) || null
    );
  }

  private getRoomFeatures(roomType: RoomType): string[] {
    const features: Record<RoomType, string[]> = {
      standard: ['WiFi', 'AC', 'TV', 'Mini Fridge'],
      deluxe: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View', 'Work Desk'],
      suite: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Living Area', 'Jacuzzi'],
      presidential: ['All Suite Features', 'Private Butler', 'Dining Room', 'Panoramic View'],
    };
    return features[roomType];
  }

  private getRoomAmenities(roomType: RoomType): string[] {
    const amenities: Record<RoomType, string[]> = {
      standard: ['Bed Linen', 'Towels', 'Toiletries', 'Coffee Maker'],
      deluxe: ['Premium Linen', 'Bathrobes', 'Premium Toiletries', 'Nespresso Machine', 'Slippers'],
      suite: ['Egyptian Cotton', 'Jacuzzi', 'Premium Toiletries', 'Wine Menu', 'Smart TV'],
      presidential: ['All Premium', 'Private Bar', 'Cigars', '24/7 Butler', 'Helicopter Transfer'],
    };
    return amenities[roomType];
  }
}

export const bookingService = new BookingService();
export default BookingService;
