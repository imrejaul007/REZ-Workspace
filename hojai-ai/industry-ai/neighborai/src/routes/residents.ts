/**
 * NEIGHBORAI - Residents Routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { Resident } from '../models';
import { residentSchema, residentUpdateSchema } from '../utils/validators';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// Webhook configuration
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'neighborai' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'neighborai', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

// GET /api/residents - List all residents
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { wing, status, search } = req.query;
    const query: any = {};

    if (wing) query.wing = wing;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { flatNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const residents = await Resident.find(query).sort({ wing: 1, flatNumber: 1 });
    const total = await Resident.countDocuments(query);

    logger.info('Residents fetched', { count: residents.length, userId: req.userId });

    res.json({
      success: true,
      residents,
      total,
      stats: {
        owners: await Resident.countDocuments({ ...query, status: 'owner' }),
        tenants: await Resident.countDocuments({ ...query, status: 'tenant' }),
        totalWings: (await Resident.distinct('wing', query)).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/residents/:id - Get single resident
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      resident
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/residents/flat/:flatNumber - Get resident by flat number
router.get('/flat/:flatNumber', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const resident = await Resident.findOne({ flatNumber: req.params.flatNumber });
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      resident
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/residents - Create new resident
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = residentSchema.parse(req.body);

    // Check for duplicate flat number
    const existing = await Resident.findOne({ flatNumber: validatedData.flatNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Flat number already registered',
        code: 'DUPLICATE_FLAT'
      });
    }

    const resident = await Resident.create(validatedData);

    logger.info('New resident registered', {
      residentId: resident._id,
      flatNumber: resident.flatNumber,
      userId: req.userId
    });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('neighborai.resident.registered', { residentId: resident._id.toString(), name: resident.name, flatNumber: resident.flatNumber, wing: resident.wing });
    await syncToHOJAI('resident', 'registered', { residentId: resident._id.toString(), name: resident.name, flatNumber: resident.flatNumber, wing: resident.wing });

    res.status(201).json({
      success: true,
      resident,
      message: `Resident ${resident.name} registered for Flat ${resident.flatNumber}`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// PATCH /api/residents/:id - Update resident
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = residentUpdateSchema.parse(req.body);

    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    logger.info('Resident updated', {
      residentId: resident._id,
      updates: Object.keys(validatedData),
      userId: req.userId
    });

    res.json({
      success: true,
      resident,
      message: 'Resident updated successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// DELETE /api/residents/:id - Delete resident
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    logger.info('Resident deleted', {
      residentId: req.params.id,
      flatNumber: resident.flatNumber,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/residents/:id/vehicle - Add vehicle
router.post('/:id/vehicle', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { vehicleNumber } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { vehicleNumbers: vehicleNumber.toUpperCase() } },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      resident,
      message: `Vehicle ${vehicleNumber} added to Flat ${resident.flatNumber}`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/residents/:id/family - Add family member
router.post('/:id/family', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Family member name is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { familyMembers: name } },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found',
        code: 'RESIDENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      resident,
      message: `Family member ${name} added to Flat ${resident.flatNumber}`
    });
  } catch (error) {
    next(error);
  }
});

export default router;