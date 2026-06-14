/**
 * Maintenance AI Service
 * Port: 3815
 *
 * Intelligent maintenance management for StayOwn hotels.
 * Handles maintenance requests, scheduling, and AI-powered diagnostics.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Configuration
const PORT = process.env.PORT || 3815;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayown';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'maintenance-ai-secret';
const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:3812';
const PROCUREMENT_SERVICE_URL = process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:3814';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/maintenance-ai.log' })
  ]
});

// Redis client
let redis: RedisClientType;

// Types
interface MaintenanceRequest {
  requestId: string;
  hotelId: string;
  roomId?: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'cleaning' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  partsUsed?: Array<{ partId: string; name: string; quantity: number; cost: number }>;
  cost?: number;
  photos?: string[];
  notes: Array<{ text: string; addedBy: string; timestamp: Date }>;
  guestImpact: 'none' | 'minor' | 'moderate' | 'severe';
  roomOutOfService: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface ScheduledMaintenance {
  scheduleId: string;
  hotelId: string;
  roomId?: string;
  assetId?: string;
  type: 'preventive' | 'inspection' | 'replacement';
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  nextDue: Date;
  lastCompleted?: Date;
  assignedStaff?: string[];
  estimatedDuration: number;
  checklist: Array<{ item: string; completed: boolean }>;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
}

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  avgResolutionTime: number;
  costThisMonth: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// Schemas
const MaintenanceRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, index: true },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cleaning', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: String, required: true },
  assignedTo: { type: String },
  estimatedDuration: { type: Number },
  actualDuration: { type: Number },
  partsUsed: [{
    partId: String,
    name: String,
    quantity: Number,
    cost: Number
  }],
  cost: { type: Number },
  photos: [String],
  notes: [{
    text: String,
    addedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],
  guestImpact: {
    type: String,
    enum: ['none', 'minor', 'moderate', 'severe'],
    default: 'none'
  },
  roomOutOfService: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { timestamps: true });

const ScheduledMaintenanceSchema = new mongoose.Schema({
  scheduleId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String },
  assetId: { type: String },
  type: {
    type: String,
    enum: ['preventive', 'inspection', 'replacement'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    required: true
  },
  nextDue: { type: Date, required: true, index: true },
  lastCompleted: { type: Date },
  assignedStaff: [String],
  estimatedDuration: { type: Number, default: 60 },
  checklist: [{
    item: String,
    completed: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'skipped'],
    default: 'scheduled'
  }
}, { timestamps: true });

const MaintenanceRequest = mongoose.model('MaintenanceRequest', MaintenanceRequestSchema);
const ScheduledMaintenance = mongoose.model('ScheduledMaintenance', ScheduledMaintenanceSchema);

// Express App
const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).hotelId = decoded.hotelId || decoded.hotel_id;
    (req as any).userId = decoded.userId || decoded.user_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper functions
async function emitEvent(event: any): Promise<void> {
  try {
    await fetch(`${EVENT_BUS_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (error: any) {
    logger.error('Failed to emit event', { error: error.message });
  }
}

async function checkPartsAvailability(requiredParts: string[]): Promise<Record<string, boolean>> {
  const availability: Record<string, boolean> = {};
  for (const partId of requiredParts) {
    try {
      const response = await fetch(`${PROCUREMENT_SERVICE_URL}/inventory/${partId}`, {
        headers: { 'Authorization': `Bearer ${JWT_SECRET}` }
      });
      if (response.ok) {
        const data = await response.json();
        availability[partId] = data.available;
      }
    } catch (error) {
      availability[partId] = false;
    }
  }
  return availability;
}

function calculatePriority(category: string, description: string): 'low' | 'normal' | 'high' | 'urgent' {
  const urgentKeywords = ['flood', 'fire', 'smoke', 'no power', 'no water', 'gas leak', 'broken door', 'security'];
  const highKeywords = ['ac not working', 'heater broken', 'leak', 'clogged', 'malfunction'];

  const desc = description.toLowerCase();

  if (urgentKeywords.some(k => desc.includes(k))) return 'urgent';
  if (highKeywords.some(k => desc.includes(k))) return 'high';
  if (category === 'electrical' || category === 'plumbing') return 'normal';
  return 'low';
}

function calculateGuestImpact(category: string, priority: string): 'none' | 'minor' | 'moderate' | 'severe' {
  if (priority === 'urgent') return 'severe';
  if (category === 'hvac' || category === 'electrical') return 'moderate';
  if (category === 'plumbing') return 'minor';
  return 'none';
}

function estimateDuration(category: string): number {
  const estimates: Record<string, number> = {
    plumbing: 90,
    electrical: 60,
    hvac: 120,
    appliance: 45,
    structural: 240,
    cleaning: 30,
    other: 60
  };
  return estimates[category] || 60;
}

// AI Diagnostics
function diagnoseFromDescription(category: string, description: string): string[] {
  const diagnostics: string[] = [];

  if (category === 'plumbing') {
    if (description.includes('drain') || description.includes('sink')) {
      diagnostics.push('Check for clogs in drain pipe');
      diagnostics.push('Inspect P-trap for blockages');
      diagnostics.push('Check main sewer line');
    }
    if (description.includes('leak') || description.includes('dripping')) {
      diagnostics.push('Inspect pipe joints for corrosion');
      diagnostics.push('Check faucet washer condition');
      diagnostics.push('Look for pipe cracks');
    }
  }

  if (category === 'electrical') {
    if (description.includes('outlet') || description.includes('socket')) {
      diagnostics.push('Test outlet with multimeter');
      diagnostics.push('Check circuit breaker');
      diagnostics.push('Inspect wiring connections');
    }
    if (description.includes('light') || description.includes('bulb')) {
      diagnostics.push('Replace light bulb first');
      diagnostics.push('Check light fixture wiring');
      diagnostics.push('Test switch functionality');
    }
  }

  if (category === 'hvac') {
    if (description.includes('not cooling')) {
      diagnostics.push('Check air filter condition');
      diagnostics.push('Inspect refrigerant levels');
      diagnostics.push('Clean condenser coils');
      diagnostics.push('Verify thermostat settings');
    }
    if (description.includes('not heating')) {
      diagnostics.push('Check heating element');
      diagnostics.push('Inspect igniter');
      diagnostics.push('Verify gas supply');
    }
  }

  if (category === 'appliance') {
    if (description.includes('refrigerator')) {
      diagnostics.push('Check power supply');
      diagnostics.push('Clean condenser coils');
      diagnostics.push('Verify temperature settings');
    }
    if (description.includes('tv') || description.includes('television')) {
      diagnostics.push('Check remote batteries');
      diagnostics.push('Verify HDMI connections');
      diagnostics.push('Test power outlet');
    }
  }

  return diagnostics;
}

// Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'maintenance-ai',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Create maintenance request
app.post('/requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { roomId, category, title, description, reportedBy, photos } = req.body;

    const priority = calculatePriority(category, description);
    const guestImpact = calculateGuestImpact(category, priority);
    const estimatedDuration = estimateDuration(category);

    const request: any = {
      requestId: uuidv4(),
      hotelId,
      roomId,
      category,
      priority,
      status: 'pending',
      title,
      description,
      reportedBy,
      guestImpact,
      estimatedDuration,
      notes: [],
      roomOutOfService: guestImpact === 'severe'
    };

    if (photos) request.photos = photos;

    const newRequest = new MaintenanceRequest(request);
    await newRequest.save();

    // Emit event
    await emitEvent({
      type: 'maintenance.request.created',
      source: 'maintenance-ai',
      hotelId,
      roomId,
      payload: {
        requestId: request.requestId,
        category,
        priority,
        title
      }
    });

    // If urgent, mark room out of service
    if (guestImpact === 'severe' && roomId) {
      await emitEvent({
        type: 'room.status.changed',
        source: 'maintenance-ai',
        hotelId,
        roomId,
        payload: {
          status: 'out_of_service',
          reason: `Maintenance: ${title}`,
          estimatedReturn: new Date(Date.now() + estimatedDuration * 60000)
        }
      });
    }

    // Cache for quick access
    await redis.hset(`hotel:${hotelId}:maintenance:pending`, request.requestId, JSON.stringify(request));

    logger.info('Maintenance request created', { requestId: request.requestId, category, priority });

    res.status(201).json({
      requestId: request.requestId,
      priority,
      guestImpact,
      estimatedDuration,
      diagnostics: diagnoseFromDescription(category, description)
    });
  } catch (error: any) {
    logger.error('Failed to create maintenance request', { error: error.message });
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

// Get maintenance requests
app.get('/requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { status, priority, category, roomId, limit = 50, offset = 0 } = req.query;

    const query: any = { hotelId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (roomId) query.roomId = roomId;

    const requests = await MaintenanceRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await MaintenanceRequest.countDocuments(query);

    res.json({
      requests,
      total,
      offset,
      limit
    });
  } catch (error: any) {
    logger.error('Failed to get maintenance requests', { error: error.message });
    res.status(500).json({ error: 'Failed to get maintenance requests' });
  }
});

// Get single request
app.get('/requests/:requestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = await MaintenanceRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    logger.error('Failed to get maintenance request', { error: error.message });
    res.status(500).json({ error: 'Failed to get maintenance request' });
  }
});

// Update request
app.patch('/requests/:requestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const updates = req.body;

    const request = await MaintenanceRequest.findOneAndUpdate(
      { requestId },
      { $set: updates },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update cache
    if (request.status === 'completed') {
      await redis.hdel(`hotel:${request.hotelId}:maintenance:pending`, requestId);
    }

    // Emit event
    await emitEvent({
      type: `maintenance.request.${request.status === 'completed' ? 'completed' : 'updated'}`,
      source: 'maintenance-ai',
      hotelId: request.hotelId,
      roomId: request.roomId,
      payload: {
        requestId,
        status: request.status,
        assignedTo: request.assignedTo
      }
    });

    logger.info('Maintenance request updated', { requestId, status: request.status });

    res.json(request);
  } catch (error: any) {
    logger.error('Failed to update maintenance request', { error: error.message });
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

// Assign request
app.post('/requests/:requestId/assign', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { assignedTo } = req.body;

    const request = await MaintenanceRequest.findOneAndUpdate(
      { requestId },
      {
        $set: {
          assignedTo,
          status: 'assigned'
        }
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await emitEvent({
      type: 'maintenance.request.assigned',
      source: 'maintenance-ai',
      hotelId: request.hotelId,
      payload: {
        requestId,
        assignedTo
      }
    });

    res.json(request);
  } catch (error: any) {
    logger.error('Failed to assign maintenance request', { error: error.message });
    res.status(500).json({ error: 'Failed to assign maintenance request' });
  }
});

// Start work
app.post('/requests/:requestId/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const request = await MaintenanceRequest.findOneAndUpdate(
      { requestId },
      { $set: { status: 'in_progress' } },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await emitEvent({
      type: 'maintenance.request.started',
      source: 'maintenance-ai',
      hotelId: request.hotelId,
      roomId: request.roomId,
      payload: { requestId }
    });

    res.json(request);
  } catch (error: any) {
    logger.error('Failed to start maintenance', { error: error.message });
    res.status(500).json({ error: 'Failed to start maintenance' });
  }
});

// Complete request
app.post('/requests/:requestId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { notes, partsUsed, actualDuration } = req.body;

    const request = await MaintenanceRequest.findOne({ requestId });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Calculate cost
    let totalCost = 0;
    if (partsUsed) {
      for (const part of partsUsed) {
        totalCost += part.cost * part.quantity;
      }
    }

    const updates: any = {
      status: 'completed',
      completedAt: new Date(),
      partsUsed: partsUsed || [],
      cost: totalCost,
      actualDuration
    };

    if (notes) {
      updates.$push = {
        notes: {
          text: notes,
          addedBy: (req as any).userId,
          timestamp: new Date()
        }
      };
    }

    const updatedRequest = await MaintenanceRequest.findOneAndUpdate(
      { requestId },
      { $set: updates },
      { new: true }
    );

    // If room was out of service, put it back
    if (request.roomOutOfService && request.roomId) {
      await emitEvent({
        type: 'room.status.changed',
        source: 'maintenance-ai',
        hotelId: request.hotelId,
        roomId: request.roomId,
        payload: {
          status: 'available',
          reason: 'Maintenance completed'
        }
      });

      // Trigger housekeeping for room
      await emitEvent({
        type: 'room.cleaning.started',
        source: 'maintenance-ai',
        hotelId: request.hotelId,
        roomId: request.roomId,
        payload: {
          reason: 'post-maintenance',
          priority: 'normal'
        }
      });
    }

    await emitEvent({
      type: 'maintenance.request.completed',
      source: 'maintenance-ai',
      hotelId: request.hotelId,
      roomId: request.roomId,
      payload: {
        requestId,
        cost: totalCost,
        duration: actualDuration
      }
    });

    // Remove from pending cache
    await redis.hdel(`hotel:${request.hotelId}:maintenance:pending`, requestId);

    logger.info('Maintenance completed', { requestId, cost: totalCost });

    res.json(updatedRequest);
  } catch (error: any) {
    logger.error('Failed to complete maintenance', { error: error.message });
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
});

// Add note to request
app.post('/requests/:requestId/notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;

    const request = await MaintenanceRequest.findOneAndUpdate(
      { requestId },
      {
        $push: {
          notes: {
            text,
            addedBy: (req as any).userId,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    logger.error('Failed to add note', { error: error.message });
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get scheduled maintenance
app.get('/schedules', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { upcoming = true, roomId } = req.query;

    const query: any = { hotelId };
    if (upcoming === 'true') {
      query.nextDue = { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
    }
    if (roomId) query.roomId = roomId;

    const schedules = await ScheduledMaintenance.find(query).sort({ nextDue: 1 });

    res.json({ schedules });
  } catch (error: any) {
    logger.error('Failed to get schedules', { error: error.message });
    res.status(500).json({ error: 'Failed to get schedules' });
  }
});

// Create scheduled maintenance
app.post('/schedules', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const schedule: any = {
      scheduleId: uuidv4(),
      hotelId,
      ...req.body
    };

    const newSchedule = new ScheduledMaintenance(schedule);
    await newSchedule.save();

    res.status(201).json(newSchedule);
  } catch (error: any) {
    logger.error('Failed to create schedule', { error: error.message });
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Complete scheduled maintenance
app.post('/schedules/:scheduleId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { notes, actualDuration } = req.body;

    const schedule = await ScheduledMaintenance.findOne({ scheduleId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Calculate next due date
    const nextDue = calculateNextDueDate(schedule.nextDue, schedule.frequency);

    const updatedSchedule = await ScheduledMaintenance.findOneAndUpdate(
      { scheduleId },
      {
        $set: {
          status: 'completed',
          lastCompleted: new Date(),
          nextDue,
          ...(actualDuration && { estimatedDuration: actualDuration })
        }
      },
      { new: true }
    );

    logger.info('Scheduled maintenance completed', { scheduleId, nextDue });

    res.json(updatedSchedule);
  } catch (error: any) {
    logger.error('Failed to complete scheduled maintenance', { error: error.message });
    res.status(500).json({ error: 'Failed to complete scheduled maintenance' });
  }
});

function calculateNextDueDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'one-time':
      next.setFullYear(next.getFullYear() + 10);
      break;
  }
  return next;
}

// Get statistics
app.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await MaintenanceRequest.aggregate([
      { $match: { hotelId } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'assigned', 'in_progress']] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgResolutionTime: { $avg: '$actualDuration' },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } }
        }
      }
    ]);

    const byCategory = await MaintenanceRequest.aggregate([
      { $match: { hotelId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const byPriority = await MaintenanceRequest.aggregate([
      { $match: { hotelId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const recentRequests = await MaintenanceRequest.find({
      hotelId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      summary: stats[0] || { totalRequests: 0, pendingRequests: 0, avgResolutionTime: 0, totalCost: 0 },
      byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count])),
      byPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count])),
      recentRequests
    });
  } catch (error: any) {
    logger.error('Failed to get stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AI-powered diagnostics
app.post('/diagnose', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { category, description, roomId } = req.body;

    const diagnostics = diagnoseFromDescription(category, description);

    // Check similar historical requests
    const similarRequests = await MaintenanceRequest.find({
      category,
      title: { $regex: description.substring(0, 20), $options: 'i' },
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select('title description solutions cost actualDuration');

    res.json({
      diagnostics,
      similarCases: similarRequests,
      estimatedDuration: estimateDuration(category),
      suggestedPriority: calculatePriority(category, description),
      suggestedParts: getSuggestedParts(category, description)
    });
  } catch (error: any) {
    logger.error('Failed to run diagnostics', { error: error.message });
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

function getSuggestedParts(category: string, description: string): Array<{ name: string; partId: string }> {
  const parts: Record<string, Array<{ name: string; partId: string }>> = {
    plumbing: [
      { name: 'Faucet Washer Kit', partId: 'PLB-001' },
      { name: 'Pipe Seal Tape', partId: 'PLB-002' },
      { name: 'Drain Cleaner', partId: 'PLB-003' }
    ],
    electrical: [
      { name: 'LED Bulb 9W', partId: 'ELC-001' },
      { name: 'Outlet Plate', partId: 'ELC-002' },
      { name: 'Circuit Breaker 15A', partId: 'ELC-003' }
    ],
    hvac: [
      { name: 'Air Filter 20x25', partId: 'HVC-001' },
      { name: 'Thermostat Battery', partId: 'HVC-002' },
      { name: 'Remote Control', partId: 'HVC-003' }
    ],
    appliance: [
      { name: 'Remote Control', partId: 'APL-001' },
      { name: 'Power Cable', partId: 'APL-002' }
    ]
  };

  return parts[category] || [];
}

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    redis = createClient({ url: REDIS_URL });
    await redis.connect();
    logger.info('Connected to Redis');

    app.listen(PORT, () => {
      logger.info(`Maintenance AI Service started on port ${PORT}`);
      logger.info(🔧 Maintenance AI Service running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
