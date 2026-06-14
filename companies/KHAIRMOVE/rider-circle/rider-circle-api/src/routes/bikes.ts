/**
 * Bike Routes
 * Handles all bike digital twin operations including health tracking and service records
 *
 * @module routes/bikes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BikeDigitalTwin, RiderProfile } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for creating a new bike */
const CreateBikeSchema = z.object({
  nickname: z.string().min(1).max(30),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  registrationNumber: z.string().min(1).max(20),
  color: z.string().optional(),
  engineCC: z.number().int().positive(),
  horsepower: z.number().optional(),
  torque: z.number().optional(),
  fuelCapacity: z.number().positive(),
  weight: z.number().optional(),
  fuelType: z.enum(['petrol', 'electric', 'hybrid']).optional(),
  odometer: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  documents: z.object({
    registration: z.object({
      number: z.string(),
      issueDate: z.date().optional(),
      expiryDate: z.date().optional(),
      url: z.string().optional(),
    }),
    insurance: z.object({
      number: z.string(),
      issueDate: z.date().optional(),
      expiryDate: z.date().optional(),
      url: z.string().optional(),
    }),
    pollution: z.object({
      number: z.string(),
      issueDate: z.date().optional(),
      expiryDate: z.date().optional(),
      url: z.string().optional(),
    }).optional(),
  }).optional(),
});

/** Schema for updating bike (all fields optional) */
const UpdateBikeSchema = CreateBikeSchema.partial();

/** Schema for adding service record */
const AddServiceRecordSchema = z.object({
  date: z.string().or(z.date()),
  type: z.enum(['regular', 'repair', 'upgrade', 'accident']),
  description: z.string().min(1),
  odometer: z.number().int().positive(),
  cost: z.number().optional(),
  serviceCenter: z.string().optional(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates health recommendations based on bike component status
 * @param health - Health status object with component scores
 * @returns Array of recommendation strings
 */
function generateHealthRecommendations(health: any): string[] {
  const recommendations: string[] = [];

  if (health.tires.front < 50) recommendations.push('Front tire needs replacement soon');
  if (health.tires.rear < 50) recommendations.push('Rear tire needs replacement soon');
  if (health.chain < 60) recommendations.push('Chain maintenance overdue');
  if (health.brakes.front < 50) recommendations.push('Front brake pads need attention');
  if (health.brakes.rear < 50) recommendations.push('Rear brake pads need attention');
  if (health.oil < 70) recommendations.push('Oil change recommended');
  if (health.battery < 60) recommendations.push('Battery health declining - consider replacement');

  // Document expiry checks
  if (health.documents.insurance) {
    const daysUntilExpiry = Math.ceil((health.documents.insurance.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 30) recommendations.push('Insurance renewal due soon');
  }

  if (health.documents.pollution) {
    const daysUntilExpiry = Math.ceil((health.documents.pollution.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 30) recommendations.push('PUC renewal due soon');
  }

  return recommendations;
}

/**
 * Generates AI predictions for maintenance and document renewals
 * @param bike - Bike document
 * @returns Predictions object with estimated dates
 */
function generatePredictions(bike: any): any {
  const predictions: any = {};

  // Tire replacement based on health and typical usage
  if (bike.tireHealth.front < 70) {
    const avgTireLife = 20000; // km
    predictions.tireReplacementDue = new Date(
      Date.now() + (bike.tireHealth.front / 100) * avgTireLife * 24 * 60 * 60 * 1000 / 50
    );
  }

  // Next service estimate
  const serviceInterval = 5000; // km
  predictions.nextServiceDate = new Date(
    bike.odometer * 24 * 60 * 60 * 1000 / 50 + serviceInterval
  );

  // Insurance renewal
  if (bike.documents.insurance.expiryDate) {
    predictions.insuranceRenewal = bike.documents.insurance.expiryDate;
  }

  // PUC expiry
  if (bike.documents.pollution?.expiryDate) {
    predictions.pucExpiry = bike.documents.pollution.expiryDate;
  }

  return predictions;
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/bikes
 * @desc Create a new bike digital twin
 * @access Private
 *
 * @requestBody - Bike data including make, model, registration
 * @returns Created bike twin
 *
 * @example
 * POST /api/bikes
 * {
 *   "nickname": "Thunder",
 *   "make": "KTM",
 *   "model": "Duke 390",
 *   "year": 2023,
 *   "registrationNumber": "MH12AB1234",
 *   "engineCC": 373
 * }
 */
router.post('/',
  authenticate,
  validateBody(CreateBikeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    // Get rider profile
    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    // If setting as primary, unset other primaries
    if (req.body.isPrimary) {
      await BikeDigitalTwin.updateMany(
        { riderId: rider._id },
        { isPrimary: false }
      );
    }

    // Create bike
    const bike = new BikeDigitalTwin({
      riderId: rider._id,
      ...req.body,
    });

    await bike.save();

    // Add bike to rider's bikes array
    rider.bikes.push(bike._id);
    await rider.save();

    logger.info(`Bike created: ${bike._id} for rider ${rider._id}`);

    res.status(201).json({
      success: true,
      data: bike,
    });
  })
);

/**
 * @route GET /api/bikes
 * @desc Get all bikes for current user
 * @access Private
 *
 * @returns Array of bikes sorted by primary first, then creation date
 *
 * @example
 * GET /api/bikes
 */
router.get('/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const bikes = await BikeDigitalTwin.find({ riderId: rider._id, isActive: true })
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json({
      success: true,
      data: bikes,
    });
  })
);

/**
 * @route GET /api/bikes/:id
 * @desc Get bike by ID
 * @access Private
 *
 * @param id - Bike MongoDB ID
 * @returns Bike details with rider info
 *
 * @example
 * GET /api/bikes/60d5ec9af682fbd12a0b1234
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const bike = await BikeDigitalTwin.findById(req.params.id)
      .populate('riderId', 'displayName avatar');

    if (!bike) {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }

    res.json({
      success: true,
      data: bike,
    });
  })
);

/**
 * @route PUT /api/bikes/:id
 * @desc Update bike details
 * @access Private (owner only)
 *
 * @param id - Bike MongoDB ID
 * @requestBody - Partial bike data
 * @returns Updated bike
 *
 * @example
 * PUT /api/bikes/60d5ec9af682fbd12a0b1234
 * { "nickname": "Thunder Pro", "color": "Orange" }
 */
router.put('/:id',
  authenticate,
  validateBody(UpdateBikeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const bike = await BikeDigitalTwin.findOne({
      _id: req.params.id,
      riderId: rider._id,
    });

    if (!bike) {
      res.status(404).json({ error: 'Bike not found or unauthorized' });
      return;
    }

    // If setting as primary, unset other primaries
    if (req.body.isPrimary) {
      await BikeDigitalTwin.updateMany(
        { riderId: rider._id, _id: { $ne: bike._id } },
        { isPrimary: false }
      );
    }

    Object.assign(bike, req.body);
    await bike.save();

    res.json({
      success: true,
      data: bike,
    });
  })
);

/**
 * @route DELETE /api/bikes/:id
 * @desc Delete bike (soft delete)
 * @access Private (owner only)
 *
 * @param id - Bike MongoDB ID
 * @returns Success message
 *
 * @example
 * DELETE /api/bikes/60d5ec9af682fbd12a0b1234
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const bike = await BikeDigitalTwin.findOne({
      _id: req.params.id,
      riderId: rider._id,
    });

    if (!bike) {
      res.status(404).json({ error: 'Bike not found or unauthorized' });
      return;
    }

    // Soft delete
    bike.isActive = false;
    await bike.save();

    // Remove from rider's bikes array
    rider.bikes = rider.bikes.filter(id => id.toString() !== bike._id.toString());
    await rider.save();

    res.json({
      success: true,
      message: 'Bike removed successfully',
    });
  })
);

/**
 * @route GET /api/bikes/:id/health
 * @desc Get bike health score and recommendations
 * @access Public
 *
 * @param id - Bike MongoDB ID
 * @returns Health details with component scores and maintenance recommendations
 *
 * @example
 * GET /api/bikes/60d5ec9af682fbd12a0b1234/health
 */
router.get('/:id/health',
  asyncHandler(async (req: Request, res: Response) => {
    const bike = await BikeDigitalTwin.findById(req.params.id)
      .select('overallHealth tireHealth chainCondition brakeHealth oilCondition batteryHealth documents');

    if (!bike) {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }

    const healthDetails = {
      overall: bike.overallHealth,
      tires: {
        front: bike.tireHealth.front,
        rear: bike.tireHealth.rear,
        lastReplaced: bike.tireHealth.lastReplaced,
      },
      chain: bike.chainCondition,
      brakes: bike.brakeHealth,
      oil: bike.oilCondition,
      battery: bike.batteryHealth,
      documents: {
        registration: bike.documents.registration.expiryDate,
        insurance: bike.documents.insurance.expiryDate,
        pollution: bike.documents.pollution?.expiryDate,
      },
    };

    // Calculate health status
    let status: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (bike.overallHealth < 50) status = 'poor';
    else if (bike.overallHealth < 70) status = 'fair';
    else if (bike.overallHealth < 90) status = 'good';

    res.json({
      success: true,
      data: {
        ...healthDetails,
        status,
        recommendations: generateHealthRecommendations(healthDetails),
      },
    });
  })
);

/**
 * @route GET /api/bikes/:id/service-history
 * @desc Get bike service history
 * @access Private
 *
 * @param id - Bike MongoDB ID
 * @returns Service records sorted by date, plus cost summary
 *
 * @example
 * GET /api/bikes/60d5ec9af682fbd12a0b1234/service-history
 */
router.get('/:id/service-history',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const bike = await BikeDigitalTwin.findById(req.params.id)
      .select('serviceHistory odometer');

    if (!bike) {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        records: bike.serviceHistory.sort((a, b) => b.date.getTime() - a.date.getTime()),
        totalCost: bike.serviceHistory.reduce((sum, r) => sum + (r.cost || 0), 0),
        lastServiceDate: bike.serviceHistory[0]?.date,
        currentOdometer: bike.odometer,
      },
    });
  })
);

/**
 * @route POST /api/bikes/:id/service-record
 * @desc Add a service record to bike
 * @access Private (owner only)
 *
 * @param id - Bike MongoDB ID
 * @requestBody - Service record data
 * @returns Created service record
 *
 * @example
 * POST /api/bikes/60d5ec9af682fbd12a0b1234/service-record
 * {
 *   "type": "regular",
 *   "description": "Oil change and filter replacement",
 *   "odometer": 15000,
 *   "cost": 1500,
 *   "serviceCenter": "KTM Service Center"
 * }
 */
router.post('/:id/service-record',
  authenticate,
  validateBody(AddServiceRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const bike = await BikeDigitalTwin.findOne({
      _id: req.params.id,
      riderId: rider._id,
    });

    if (!bike) {
      res.status(404).json({ error: 'Bike not found or unauthorized' });
      return;
    }

    const record = {
      ...req.body,
      date: new Date(req.body.date),
    };

    bike.serviceHistory.push(record);

    // Update odometer if new reading is higher
    bike.odometer = Math.max(bike.odometer, record.odometer);

    await bike.save();

    logger.info(`Service record added to bike ${bike._id}`);

    res.status(201).json({
      success: true,
      data: bike.serviceHistory[bike.serviceHistory.length - 1],
    });
  })
);

/**
 * @route GET /api/bikes/:id/predictions
 * @desc Get AI predictions for bike maintenance
 * @access Private
 *
 * @param id - Bike MongoDB ID
 * @returns Predictions for tire replacement, next service, document renewals
 *
 * @example
 * GET /api/bikes/60d5ec9af682fbd12a0b1234/predictions
 */
router.get('/:id/predictions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const bike = await BikeDigitalTwin.findById(req.params.id);

    if (!bike) {
      res.status(404).json({ error: 'Bike not found' });
      return;
    }

    // Generate predictions based on current state
    // In production, this would call the AI engine for ML predictions
    const predictions = generatePredictions(bike);

    res.json({
      success: true,
      data: predictions,
    });
  })
);

/**
 * @route PATCH /api/bikes/:id/health
 * @desc Update a specific bike health component
 * @access Private (owner only)
 *
 * @param id - Bike MongoDB ID
 * @requestBody - { component: string, value: number }
 * @returns Updated overall health score
 *
 * @example
 * PATCH /api/bikes/60d5ec9af682fbd12a0b1234/health
 * { "component": "oil", "value": 85 }
 */
router.patch('/:id/health',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { component, value } = req.body;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const bike = await BikeDigitalTwin.findOne({
      _id: req.params.id,
      riderId: rider._id,
    });

    if (!bike) {
      res.status(404).json({ error: 'Bike not found or unauthorized' });
      return;
    }

    // Update health component using model's method
    await bike.updateHealth(component, value);

    res.json({
      success: true,
      data: {
        overallHealth: bike.overallHealth,
        component: component,
        value: value,
      },
    });
  })
);

export default router;
