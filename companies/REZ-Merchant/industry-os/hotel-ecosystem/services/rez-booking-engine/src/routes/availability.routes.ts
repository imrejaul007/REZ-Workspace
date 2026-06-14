import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Booking, Room } from '../models/booking.model';
import { DynamicPricingService } from '../services/dynamic-pricing.service';

const router = express.Router();
const pricingService = new DynamicPricingService();

// Check availability for date range
router.post('/check', async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, roomTypeId, guests, rooms = 1 } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'hotelId, checkIn, and checkOut are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'checkOut must be after checkIn' });
    }

    // Build room query
    const roomQuery: any = { hotelId, status: 'available' };
    if (roomTypeId) {
      roomQuery.roomTypeId = roomTypeId;
    }
    if (guests) {
      roomQuery.capacity = { $gte: guests };
    }

    // Find available rooms
    const availableRooms = await Room.find(roomQuery);

    // Filter by booking conflicts
    const conflicts = await Booking.find({
      hotelId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    const bookedRoomIds = new Set(conflicts.map(b => b.rooms.map(r => r.roomId)).flat());

    const availableRoomList = availableRooms.filter(r => !bookedRoomIds.has(r.roomId));

    // Get pricing for each room type
    const pricing = await pricingService.calculateRate({
      hotelId,
      roomTypeId: roomTypeId || availableRoomList[0]?.roomTypeId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      occupancy: availableRooms.length > 0 ? (availableRooms.length - availableRoomList.length) / availableRooms.length : 0,
    });

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      available: availableRoomList.length >= rooms,
      requestedRooms: rooms,
      availableRooms: availableRoomList.length,
      nights,
      pricing: {
        basePrice: pricing.basePrice,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency || 'INR',
        breakdown: pricing.breakdown,
      },
      rooms: availableRoomList.slice(0, rooms).map(r => ({
        roomId: r.roomId,
        roomNumber: r.roomNumber,
        roomTypeId: r.roomTypeId,
        floor: r.floor,
        view: r.view,
        amenities: r.amenities,
      })),
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Search availability with filters
router.post('/search', async (req, res) => {
  try {
    const {
      hotelId,
      checkIn,
      checkOut,
      guests = 1,
      rooms = 1,
      budget,
      amenities = [],
      bedType,
    } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'hotelId, checkIn, and checkOut are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Build query
    const roomQuery: any = { hotelId, status: 'available', capacity: { $gte: guests } };

    if (bedType) {
      roomQuery.bedType = bedType;
    }

    if (amenities.length > 0) {
      roomQuery['amenities.name'] = { $all: amenities };
    }

    const availableRooms = await Room.find(roomQuery);

    // Check conflicts
    const conflicts = await Booking.find({
      hotelId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    const bookedRoomIds = new Set(conflicts.map(b => b.rooms.map(r => r.roomId)).flat());
    const availableRoomList = availableRooms.filter(r => !bookedRoomIds.has(r.roomId));

    // Calculate pricing for each room
    const roomResults = await Promise.all(
      availableRoomList.slice(0, 20).map(async (room) => {
        const pricing = await pricingService.calculateRate({
          hotelId,
          roomTypeId: room.roomTypeId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          occupancy: availableRooms.length > 0 ? (availableRooms.length - availableRoomList.length) / availableRooms.length : 0,
        });

        return {
          roomId: room.roomId,
          roomNumber: room.roomNumber,
          roomTypeId: room.roomTypeId,
          roomTypeName: room.roomTypeName,
          floor: room.floor,
          view: room.view,
          bedType: room.bedType,
          capacity: room.capacity,
          amenities: room.amenities,
          pricing: {
            basePrice: pricing.basePrice,
            finalPrice: pricing.finalPrice,
            pricePerNight: pricing.finalPrice / nights,
            currency: pricing.currency || 'INR',
          },
          score: calculateRoomScore(room, pricing.finalPrice, budget),
        };
      })
    );

    // Sort by score (best value first)
    roomResults.sort((a, b) => b.score - a.score);

    // Filter by budget if provided
    const filteredResults = budget
      ? roomResults.filter(r => r.pricing.finalPrice <= budget)
      : roomResults;

    res.json({
      searchId: uuidv4(),
      checkIn,
      checkOut,
      nights,
      totalRooms: filteredResults.length,
      rooms: filteredResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search rooms' });
  }
});

// Get hotel info with room types
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;

    const rooms = await Room.find({ hotelId, status: 'available' });

    // Group by room type
    const roomTypes = new Map<string, any>();
    rooms.forEach(room => {
      const key = room.roomTypeId;
      if (!roomTypes.has(key)) {
        roomTypes.set(key, {
          roomTypeId: room.roomTypeId,
          roomTypeName: room.roomTypeName,
          description: room.description,
          basePrice: room.basePrice,
          maxOccupancy: room.capacity,
          amenities: room.amenities,
          bedType: room.bedType,
          view: room.view,
          images: room.images,
          count: 0,
          available: 0,
        });
      }
      roomTypes.get(key).count++;
    });

    // Get pricing for each type
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const [_, type] of roomTypes) {
      const pricing = await pricingService.calculateRate({
        hotelId,
        roomTypeId: type.roomTypeId,
        checkIn: today,
        checkOut: tomorrow,
        occupancy: 0.5,
      });
      type.currentPrice = pricing.finalPrice;
      type.available = type.count;
    }

    res.json({
      hotelId,
      roomTypes: Array.from(roomTypes.values()),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Hotel info error:', error);
    res.status(500).json({ error: 'Failed to get hotel info' });
  }
});

function calculateRoomScore(room: any, price: number, budget?: number): number {
  let score = 100;

  // Price score (lower is better)
  if (budget) {
    score -= Math.max(0, (price - budget) / budget * 50);
  }

  // Amenities score
  score += room.amenities?.length * 2 || 0;

  // View bonus
  if (room.view && ['sea', 'ocean', 'pool'].includes(room.view.toLowerCase())) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

export default router;
