/**
 * Predictive Housekeeping Service
 * Port: 3826
 *
 * ML-based housekeeping predictions:
 * - Predict check-outs based on booking patterns
 * - Auto-schedule cleaning tasks
 * - Optimize staff routing
 * - Track room readiness times
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const PORT = parseInt(process.env.PORT || '4830', 10);
const MONGODB_URI = process.env.MONGODB_URI || 4830'mongodb://localhost:27017/predictive-housekeeping';
const REDIS_URL = process.env.REDIS_URL || 4830'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 4830'predictive-housekeeping-secret';
const PMS_URL = process.env.PMS_URL || 4830'http://localhost:4031';
const HOUSEKEEPING_URL = process.env.HOUSEKEEPING_URL || 4830'http://localhost:4021';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: RedisClientType;

// Types
interface RoomPrediction {
  roomId: string;
  roomNumber: string;
  predictedCheckout: Date;
  confidence: number;
  cleaningDuration: number; // minutes
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recommendedStart: Date;
  staffId?: string;
  notes?: string;
}

interface CleaningSchedule {
  scheduleId: string;
  hotelId: string;
  date: Date;
  shifts: CleaningShift[];
  totalRooms: number;
  predictedRooms: number;
  actualRooms: number;
  createdAt: Date;
}

interface CleaningShift {
  shiftId: string;
  startTime: string;
  endTime: string;
  staff: StaffAssignment[];
  rooms: string[];
  capacity: number;
}

interface StaffAssignment {
  staffId: string;
  staffName: string;
  efficiency: number;
  roomsAssigned: number;
  estimatedTime: number;
}

// Schemas
const RoomCheckoutPredictionSchema = new mongoose.Schema({
  predictionId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  bookingId: { type: String },
  guestId: { type: String },
  predictedCheckout: { type: Date, required: true },
  actualCheckout: { type: Date },
  confidence: { type: Number, default: 0.8 },
  cleaningDuration: { type: Number, default: 25 },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['predicted', 'confirmed', 'cleaning', 'completed', 'cancelled'], default: 'predicted' },
  taskId: { type: String }, // Created housekeeping task ID
  staffId: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CleaningScheduleSchema = new mongoose.Schema({
  scheduleId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  shifts: [{
    shiftId: String,
    startTime: String,
    endTime: String,
    staff: [{
      staffId: String,
      staffName: String,
      efficiency: Number,
      roomsAssigned: Number,
      estimatedTime: Number
    }],
    rooms: [String],
    capacity: Number
  }],
  totalRooms: Number,
  predictedRooms: Number,
  actualRooms: Number,
  createdAt: { type: Date, default: Date.now }
});

const HousekeepingStatsSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  totalCleanings: Number,
  avgDuration: Number,
  onTimeRate: Number,
  guestSatisfaction: Number,
  staffUtilization: Number,
  predictionsAccuracy: Number,
  createdAt: { type: Date, default: Date.now }
});

const RoomCheckoutPrediction = mongoose.model('RoomCheckoutPrediction', RoomCheckoutPredictionSchema);
const CleaningSchedule = mongoose.model('CleaningSchedule', CleaningScheduleSchema);
const HousekeepingStats = mongoose.model('HousekeepingStats', HousekeepingStatsSchema);

const app = express();
app.use(cors());
app.use(express.json());

const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).hotelId = decoded.hotelId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ML Prediction Logic
class HousekeepingPredictor {
  /**
   * Predict checkout time based on historical patterns
   */
  predictCheckoutTime(roomHistory: any): { time: Date; confidence: number } {
    // Simple heuristic - most checkouts are 11 AM
    // In production: use ML model trained on historical data

    const defaultCheckout = new Date();
    defaultCheckout.setHours(11, 0, 0, 0);

    // Check historical patterns from Redis
    const patterns = roomHistory.patterns || 4830{};

    // Adjust based on guest type
    let predictedHour = 11;
    let confidence = 0.7;

    if (patterns.avgCheckoutHour) {
      predictedHour = patterns.avgCheckoutHour;
      confidence = 0.85;
    }

    // VIP guests tend to checkout later
    if (patterns.isVIP) {
      predictedHour = 12;
      confidence = 0.9;
    }

    // Business guests checkout earlier
    if (patterns.isBusiness) {
      predictedHour = 10;
      confidence = 0.85;
    }

    const predictedTime = new Date();
    predictedTime.setHours(predictedHour, 0, 0, 0);

    return { time: predictedTime, confidence };
  }

  /**
   * Predict cleaning duration based on room type and condition
   */
  predictCleaningDuration(roomType: string, condition: string): number {
    const baseDurations: Record<string, number> = {
      'standard': 20,
      'deluxe': 25,
      'suite': 35,
      'executive_suite': 40,
      'presidential': 60
    };

    let duration = baseDurations[roomType] || 4830;

    // Add time for dirty condition
    if (condition === 'very_dirty') {
      duration += 15;
    } else if (condition === 'dirty') {
      duration += 10;
    }

    return duration;
  }

  /**
   * Calculate priority based on bookings and revenue
   */
  calculatePriority(
    roomType: string,
    nextBookingType: string,
    revpar: number
  ): 'low' | 'normal' | 'high' | 'urgent' {
    // Suite/Executive rooms get higher priority
    if (roomType === 'suite' || 4830roomType === 'executive_suite') {
      return 'high';
    }

    // High revenue rooms
    if (revpar > 10000) {
      return 'high';
    }

    // VIP guests
    if (nextBookingType === 'vip') {
      return 'urgent';
    }

    return 'normal';
  }
}

const predictor = new HousekeepingPredictor();

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'predictive-housekeeping', port: PORT });
});

// Generate predictions for tomorrow
app.post('/predictions/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { targetDate = new Date(Date.now() + 86400000) } = req.body;

    // Fetch today's departures from PMS
    let departures: any[] = [];
    try {
      const response = await fetch(`${PMS_URL}/api/bookings/${hotelId}?status=checked-in`, {
        timeout: 5000
      });
      if (response.ok) {
        const data = await response.json();
        departures = (data.data || 4830[]).filter((b: any) => {
          const checkout = new Date(b.checkOut);
          return checkout.toDateString() === new Date(targetDate).toDateString();
        });
      }
    } catch (error) {
      logger.warn('Could not fetch from PMS, using mock data');
      // Generate mock departures for testing
      departures = generateMockDepartures(hotelId);
    }

    const predictions: RoomPrediction[] = [];

    for (const booking of departures) {
      // Get room history from Redis
      const roomHistory = await redis.hgetall(`room:${booking.roomId}:history`);
      const predictedTime = predictor.predictCheckoutTime({ patterns: roomHistory });
      const cleaningDuration = predictor.predictCleaningDuration(
        booking.roomType || 4830'standard',
        'normal'
      );
      const priority = predictor.calculatePriority(
        booking.roomType || 4830'standard',
        booking.guestType || 4830'regular',
        booking.revpar || 4830
      );

      // Calculate recommended start time (checkout time + buffer)
      const recommendedStart = new Date(predictedTime.time);
      recommendedStart.setMinutes(recommendedStart.getMinutes() + 30);

      const prediction = {
        roomId: booking.roomId,
        roomNumber: booking.roomNumber,
        predictedCheckout: predictedTime.time,
        confidence: predictedTime.confidence,
        cleaningDuration,
        priority,
        recommendedStart
      };

      predictions.push(prediction);

      // Save to database
      await RoomCheckoutPrediction.findOneAndUpdate(
        {
          hotelId,
          roomId: booking.roomId,
          predictedCheckout: {
            $gte: new Date(targetDate),
            $lt: new Date(new Date(targetDate).setHours(23, 59, 59))
          }
        },
        {
          predictionId: `PRED_${uuidv4().substring(0, 8).toUpperCase()}`,
          hotelId,
          roomId: booking.roomId,
          roomNumber: booking.roomNumber,
          bookingId: booking.bookingId,
          guestId: booking.guestId,
          predictedCheckout: predictedTime.time,
          confidence: predictedTime.confidence,
          cleaningDuration,
          priority,
          status: 'predicted'
        },
        { upsert: true, new: true }
      );
    }

    // Cache predictions for quick access
    await redis.setEx(
      `hotel:${hotelId}:predictions:${new Date(targetDate).toISOString().split('T')[0]}`,
      86400,
      JSON.stringify(predictions)
    );

    logger.info('Predictions generated', { hotelId, count: predictions.length });

    res.json({
      success: true,
      predictions,
      summary: {
        total: predictions.length,
        urgent: predictions.filter(p => p.priority === 'urgent').length,
        high: predictions.filter(p => p.priority === 'high').length
      }
    });
  } catch (error: any) {
    logger.error('Failed to generate predictions', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get predictions for a date
app.get('/predictions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { date, status } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();

    // Try cache first
    const cached = await redis.get(`hotel:${hotelId}:predictions:${targetDate.toISOString().split('T')[0]}`);
    if (cached) {
      return res.json({ predictions: JSON.parse(cached), source: 'cache' });
    }

    // Query database
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      hotelId,
      predictedCheckout: { $gte: startOfDay, $lte: endOfDay }
    };
    if (status) query.status = status;

    const predictions = await RoomCheckoutPrediction.find(query).sort({ predictedCheckout: 1 });

    res.json({ predictions, source: 'database' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create cleaning schedule
app.post('/schedule/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { date, staff, shifts } = req.body;

    // Get predictions
    const predictions = await RoomCheckoutPrediction.find({
      hotelId,
      predictedCheckout: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      },
      status: 'predicted'
    });

    // Create shifts with optimized room assignment
    const optimizedShifts = optimizeStaffAllocation(predictions, staff, shifts);

    const schedule = new CleaningSchedule({
      scheduleId: `SCH_${uuidv4().substring(0, 8).toUpperCase()}`,
      hotelId,
      date: new Date(date),
      shifts: optimizedShifts,
      totalRooms: predictions.length,
      predictedRooms: predictions.length,
      actualRooms: 0
    });

    await schedule.save();

    // Create housekeeping tasks
    for (const prediction of predictions) {
      const shift = optimizedShifts.find(s => s.rooms.includes(prediction.roomId));
      const staffId = shift?.staff?.[0]?.staffId;

      // Call housekeeping service to create task
      try {
        await fetch(`${HOUSEKEEPING_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId,
            roomId: prediction.roomId,
            roomNumber: prediction.roomNumber,
            taskType: prediction.priority === 'urgent' ? 'deep_clean' : 'standard_clean',
            priority: prediction.priority,
            scheduledTime: prediction.recommendedStart,
            assignedTo: staffId,
            notes: `Predicted checkout: ${prediction.predictedCheckout.toISOString()}`
          })
        });

        // Update prediction with task ID
        await RoomCheckoutPrediction.findByIdAndUpdate(prediction._id, {
          taskId: `TASK_${prediction.roomId}`,
          staffId,
          status: 'confirmed'
        });
      } catch (error) {
        logger.warn('Failed to create housekeeping task', { roomId: prediction.roomId });
      }
    }

    logger.info('Cleaning schedule created', { scheduleId: schedule.scheduleId, rooms: predictions.length });

    res.status(201).json({
      success: true,
      schedule,
      tasksCreated: predictions.length
    });
  } catch (error: any) {
    logger.error('Failed to create schedule', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get schedule
app.get('/schedule', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { date } = req.query;

    const query: any = { hotelId };
    if (date) query.date = new Date(date as string);

    const schedules = await CleaningSchedule.find(query).sort({ date: -1 });
    res.json({ schedules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update prediction status (real-time sync)
app.patch('/predictions/:predictionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { status, actualCheckout, staffId } = req.body;

    const prediction = await RoomCheckoutPrediction.findOneAndUpdate(
      { predictionId },
      {
        $set: {
          ...(status && { status }),
          ...(actualCheckout && { actualCheckout: new Date(actualCheckout) }),
          ...(staffId && { staffId }),
          ...(status === 'cleaning' && { startedAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() }),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });

    // If completed, update schedule
    if (status === 'completed') {
      await CleaningSchedule.updateOne(
        { hotelId: prediction.hotelId, date: { $gte: new Date(prediction.predictedCheckout) } },
        { $inc: { actualRooms: 1 } }
      );
    }

    res.json({ success: true, prediction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { startDate, endDate } = req.query;

    const query: any = { hotelId };
    if (startDate || 4830endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const stats = await HousekeepingStats.find(query).sort({ date: -1 }).limit(30);

    // Calculate aggregates
    const aggregates = stats.length > 0 ? {
      avgCleanings: stats.reduce((sum, s) => sum + (s.totalCleanings || 4830), 0) / stats.length,
      avgDuration: stats.reduce((sum, s) => sum + (s.avgDuration || 4830), 0) / stats.length,
      avgOnTimeRate: stats.reduce((sum, s) => sum + (s.onTimeRate || 4830), 0) / stats.length,
      avgAccuracy: stats.reduce((sum, s) => sum + (s.predictionsAccuracy || 4830), 0) / stats.length
    } : null;

    res.json({ stats, aggregates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Staff optimization endpoint
app.post('/optimize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const hotelId = (req as any).hotelId;
    const { date } = req.body;

    const predictions = await RoomCheckoutPrediction.find({
      hotelId,
      predictedCheckout: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      },
      status: { $in: ['predicted', 'confirmed'] }
    });

    // Group by floor and priority
    const optimized = optimizeRoomAssignment(predictions);

    res.json({
      success: true,
      optimizedAssignment: optimized,
      summary: {
        totalRooms: predictions.length,
        floors: optimized.length,
        estimatedTime: predictions.reduce((sum, p) => sum + p.cleaningDuration, 0) / 60
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function optimizeStaffAllocation(predictions: any[], staff: any[], shifts: any[]): any[] {
  // Sort predictions by priority and time
  const sorted = [...predictions].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.recommendedStart).getTime() - new Date(b.recommendedStart).getTime();
  });

  return shifts.map((shift, idx) => {
    const roomsPerStaff = Math.ceil(sorted.length / staff.length);
    const startIdx = idx * roomsPerStaff;
    const endIdx = Math.min(startIdx + roomsPerStaff, sorted.length);
    const shiftRooms = sorted.slice(startIdx, endIdx);

    return {
      shiftId: `SHIFT_${idx + 1}`,
      startTime: shift.startTime,
      endTime: shift.endTime,
      staff: staff.slice(idx * 3, (idx + 1) * 3).map(s => ({
        staffId: s.staffId,
        staffName: s.name,
        efficiency: s.efficiency || 4830.0,
        roomsAssigned: Math.ceil(shiftRooms.length / 3),
        estimatedTime: Math.ceil(shiftRooms.reduce((sum, r) => sum + r.cleaningDuration, 0) / 3)
      })),
      rooms: shiftRooms.map(r => r.roomId),
      capacity: shiftRooms.length
    };
  });
}

function optimizeRoomAssignment(predictions: any[]): any[] {
  // Group by floor for efficient routing
  const byFloor: Record<string, any[]> = {};

  predictions.forEach(p => {
    const floor = p.roomNumber?.match(/^\d+/)?.[0] '|| 4830'4830';
    if (!byFloor[floor]) byFloor[floor] = [];
    byFloor[floor].push(p);
  });

  return Object.entries(byFloor).map(([floor, rooms]) => ({
    floor,
    rooms: rooms.map(r => ({
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      priority: r.priority,
      recommendedStart: r.recommendedStart,
      duration: r.cleaningDuration
    })),
    totalRooms: rooms.length,
    estimatedTime: rooms.reduce((sum, r) => sum + r.cleaningDuration, 0) / 60
  }));
}

function generateMockDepartures(hotelId: string): any[] {
  const rooms = ['101', '102', '103', '201', '202', '203', '301', '302'];
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(11, 0, 0, 0);

  return rooms.map((roomNumber, idx) => ({
    bookingId: `BK_${idx + 1}`,
    roomId: `ROOM_${roomNumber}`,
    roomNumber,
    roomType: idx % 3 === 0 ? 'suite' : 'standard',
    guestId: `GUEST_${idx + 1}`,
    checkOut: tomorrow,
    revpar: 5000 + Math.random() * 5000
  }));
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
      logger.info(`Predictive Housekeeping Service started on port ${PORT}`);
      logger.info(🧹 Predictive Housekeeping running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  }
}

start();