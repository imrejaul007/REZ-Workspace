/**
 * Room Routes
 *
 * Endpoints for room management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, optionalAuth, requireRoles } from '../middleware/auth';
import { roomService } from '../services/room.service';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[room-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number().int().min(0),
  type: z.enum(['standard', 'deluxe', 'suite', 'presidential']),
  price: z.number().positive(),
  amenities: z.array(z.string()).optional().default([]),
  maxOccupancy: z.number().int().min(1),
  bedConfiguration: z.string().min(1),
  size: z.number().positive(),
  view: z.string().optional().default('city'),
  images: z.array(z.string()).optional().default([]),
});

const updateRoomSchema = createRoomSchema.partial();

const bulkCreateRoomsSchema = z.object({
  rooms: z.array(createRoomSchema).min(1).max(100),
});

const searchSchema = z.object({
  hotelId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  floor: z.string().optional(),
});

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get room availability summary
 * GET /api/rooms/availability/:hotelId
 */
router.get('/availability/:hotelId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const summary = await roomService.getRoomAvailabilitySummary(req.params.hotelId);
    res.json({ success: true, data: summary });
  } catch (error) {
    log('Get availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to get room availability' });
  }
});

/**
 * Get room types with pricing
 * GET /api/rooms/types/:hotelId
 */
router.get('/types/:hotelId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const types = await roomService.getRoomTypes(req.params.hotelId);
    res.json({ success: true, data: types });
  } catch (error) {
    log('Get room types error:', error);
    res.status(500).json({ success: false, message: 'Failed to get room types' });
  }
});

/**
 * Get available rooms
 * GET /api/rooms/available/:hotelId
 */
router.get('/available/:hotelId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      res.status(400).json({ success: false, message: 'checkIn and checkOut dates required' });
      return;
    }

    const rooms = await roomService.getAvailableRooms(
      req.params.hotelId,
      new Date(checkIn as string),
      new Date(checkOut as string)
    );

    res.json({ success: true, data: { rooms, total: rooms.length } });
  } catch (error) {
    log('Get available rooms error:', error);
    res.status(500).json({ success: false, message: 'Failed to get available rooms' });
  }
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * Create room
 * POST /api/rooms
 */
router.post('/', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = createRoomSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const room = await roomService.createRoom(hotelId, input);

    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) {
    log('Create room error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
});

/**
 * Bulk create rooms
 * POST /api/rooms/bulk
 */
router.post('/bulk', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const { rooms } = bulkCreateRoomsSchema.parse(req.body);
    const hotelId = req.user?.hotelId || req.body.hotelId;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const createdRooms = await roomService.bulkCreateRooms(hotelId, rooms);

    res.status(201).json({
      success: true,
      data: { rooms: createdRooms, count: createdRooms.length },
      message: 'Rooms created successfully',
    });
  } catch (error) {
    log('Bulk create rooms error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create rooms' });
  }
});

/**
 * Get all rooms for hotel
 * GET /api/rooms
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.query.hotelId as string;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'Hotel ID required' });
      return;
    }

    const rooms = await roomService.getRoomsByHotel(hotelId);

    res.json({
      success: true,
      data: { rooms, total: rooms.length },
    });
  } catch (error) {
    log('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Failed to get rooms' });
  }
});

/**
 * Search rooms
 * GET /api/rooms/search
 */
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = searchSchema.parse(req.query);
    const rooms = await roomService.searchRooms({
      ...filters,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      floor: filters.floor ? parseInt(filters.floor) : undefined,
    });

    res.json({
      success: true,
      data: { rooms, total: rooms.length, filters },
    });
  } catch (error) {
    log('Search rooms error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid parameters', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

/**
 * Get room by ID
 * GET /api/rooms/:roomId
 */
router.get('/:roomId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(req.params.roomId);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({ success: true, data: room });
  } catch (error) {
    log('Get room error:', error);
    res.status(500).json({ success: false, message: 'Failed to get room' });
  }
});

/**
 * Update room
 * PUT /api/rooms/:roomId
 */
router.put('/:roomId', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = updateRoomSchema.parse(req.body);
    const room = await roomService.updateRoom(req.params.roomId, input);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error) {
    log('Update room error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
});

/**
 * Update room status
 * PATCH /api/rooms/:roomId/status
 */
router.patch('/:roomId/status', authenticateToken, requireRoles('admin', 'hotel_owner', 'staff', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { status } = z.object({
      status: z.enum(['available', 'occupied', 'cleaning', 'maintenance', 'blocked']),
    }).parse(req.body);

    const room = await roomService.updateRoomStatus(req.params.roomId, status);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      data: room,
      message: 'Room status updated successfully',
    });
  } catch (error) {
    log('Update room status error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid status', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update room status' });
  }
});

/**
 * Delete room
 * DELETE /api/rooms/:roomId
 */
router.delete('/:roomId', authenticateToken, requireRoles('admin', 'hotel_owner'), async (req: Request, res: Response) => {
  try {
    const deleted = await roomService.deleteRoom(req.params.roomId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    log('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
});

export default router;
