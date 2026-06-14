import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Room, Presence } from '../models';
import { webSocketService } from '../services';
import { internalAuth } from '../middleware';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// Router Setup
// ==========================================

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const JoinRoomSchema = z.object({
  roomId: z.string().min(1),
  roomType: z.enum(['user', 'team', 'company', 'project', 'custom']),
  userId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const PublishEventSchema = z.object({
  type: z.string().min(1),
  roomId: z.string().min(1),
  data: z.unknown(),
  targetUsers: z.array(z.string()).optional(),
  excludeUsers: z.array(z.string()).optional(),
  persistent: z.boolean().optional(),
});

const UpdatePresenceSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['online', 'offline', 'away', 'busy']),
  metadata: z
    .object({
      device: z.string().optional(),
      platform: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
});

// ==========================================
// Health Check
// ==========================================

router.get('/health', async (_req: Request, res: Response) => {
  const stats = webSocketService.getStats();

  res.json({
    success: true,
    service: 'realtime-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    stats,
  });
});

// ==========================================
// Get User Rooms (REST API)
// ==========================================

router.get('/rooms/:userId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const rooms = await Room.findByUserId(userId);

    res.json({
      success: true,
      data: rooms.map((room) => ({
        id: room._id,
        type: room.type,
        name: room.name,
        members: room.members,
        metadata: room.metadata,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('Failed to get user rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user rooms',
    });
  }
});

// ==========================================
// Join Room (REST API)
// ==========================================

router.post('/rooms/join', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = JoinRoomSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const { roomId, roomType, userId, metadata } = validation.data;

    // Create or update room
    const room = await Room.findOneAndUpdate(
      { id: roomId },
      {
        $set: {
          type: roomType,
          name: roomId,
          metadata: metadata || {},
          updatedAt: new Date(),
        },
        $addToSet: { members: userId },
      },
      { upsert: true, new: true }
    );

    // Update presence
    await Presence.findOneAndUpdate(
      { userId },
      { $addToSet: { rooms: roomId } },
      { upsert: true }
    );

    // Publish to WebSocket clients
    webSocketService.publishToRoom(roomId, 'room_joined', {
      userId,
      roomId,
      roomType,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        id: room._id,
        type: room.type,
        name: room.name,
        members: room.members,
        metadata: room.metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to join room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join room',
    });
  }
});

// ==========================================
// Leave Room (REST API)
// ==========================================

router.post('/rooms/leave', internalAuth, async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.body;

    if (!roomId || !userId) {
      res.status(400).json({
        success: false,
        error: 'roomId and userId are required',
      });
      return;
    }

    // Update room
    await Room.findOneAndUpdate({ id: roomId }, { $pull: { members: userId } });

    // Update presence
    await Presence.findOneAndUpdate({ userId }, { $pull: { rooms: roomId } });

    // Publish to WebSocket clients
    webSocketService.publishToRoom(roomId, 'room_left', {
      userId,
      roomId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Left room successfully',
    });
  } catch (error) {
    logger.error('Failed to leave room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave room',
    });
  }
});

// ==========================================
// Publish Event
// ==========================================

router.post('/publish', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = PublishEventSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const { type, roomId, data, targetUsers, excludeUsers } = validation.data;

    // Publish to WebSocket
    webSocketService.publishToRoom(roomId, type, data);

    // If specific users, also publish directly
    if (targetUsers && targetUsers.length > 0) {
      for (const userId of targetUsers) {
        if (excludeUsers && excludeUsers.includes(userId)) continue;
        webSocketService.publishToUser(userId, type, { ...(data as object), roomId });
      }
    }

    res.json({
      success: true,
      message: 'Event published successfully',
      data: {
        id: uuidv4(),
        type,
        roomId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to publish event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish event',
    });
  }
});

// ==========================================
// Get User Presence
// ==========================================

router.get('/presence/:userId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const presence = await Presence.findOne({ userId });

    if (!presence) {
      res.json({
        success: true,
        data: {
          userId,
          status: 'offline',
          lastSeen: null,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: presence.userId,
        status: presence.status,
        lastSeen: presence.lastSeen,
        rooms: presence.rooms,
        metadata: presence.metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to get presence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get presence',
    });
  }
});

// ==========================================
// Update Presence (REST API)
// ==========================================

router.post('/presence/update', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = UpdatePresenceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const { userId, status, metadata } = validation.data;

    const presence = await Presence.findOneAndUpdate(
      { userId },
      {
        $set: {
          status,
          lastSeen: new Date(),
          ...(metadata && { metadata }),
        },
      },
      { upsert: true, new: true }
    );

    // Broadcast presence update to all user's rooms
    for (const roomId of presence.rooms) {
      webSocketService.publishToRoom(roomId, 'presence', {
        userId,
        status,
        lastSeen: presence.lastSeen,
        metadata: presence.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        userId: presence.userId,
        status: presence.status,
        lastSeen: presence.lastSeen,
      },
    });
  } catch (error) {
    logger.error('Failed to update presence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update presence',
    });
  }
});

// ==========================================
// Get Room Members
// ==========================================

router.get('/rooms/:roomId/members', internalAuth, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ id: roomId });

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    // Get online status for each member
    const presenceList = await Presence.find({ userId: { $in: room.members } });
    const presenceMap = new Map(presenceList.map((p) => [p.userId, p]));

    const membersWithPresence = room.members.map((memberId) => {
      const presence = presenceMap.get(memberId);
      return {
        userId: memberId,
        status: presence?.status || 'offline',
        lastSeen: presence?.lastSeen,
      };
    });

    res.json({
      success: true,
      data: {
        roomId,
        roomType: room.type,
        members: membersWithPresence,
        totalMembers: room.members.length,
        onlineCount: membersWithPresence.filter((m) => m.status === 'online').length,
      },
    });
  } catch (error) {
    logger.error('Failed to get room members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room members',
    });
  }
});

// ==========================================
// Get Service Stats
// ==========================================

router.get('/stats', async (_req: Request, res: Response) => {
  const stats = webSocketService.getStats();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Export Router
// ==========================================

export default router;
