/**
 * FLEETIQ - Maintenance Routes
 * CRUD operations for maintenance records
 */

import { Router, Request, Response } from 'express';
import { Maintenance, Vehicle } from '../../models';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// GET ALL MAINTENANCE RECORDS
// ============================================

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, type, vehicleId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (vehicleId) query.vehicleId = vehicleId;

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .populate('vehicleId', 'registrationNumber type')
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 })
        .lean(),
      Maintenance.countDocuments(query)
    ]);

    res.json({
      success: true,
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  })
);

// ============================================
// GET SINGLE MAINTENANCE RECORD
// ============================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const record = await Maintenance.findById(req.params.id)
      .populate('vehicleId', 'registrationNumber type status mileage');

    if (!record) {
      throw new NotFoundError('Maintenance record');
    }

    res.json({
      success: true,
      record
    });
  })
);

// ============================================
// CREATE MAINTENANCE RECORD
// ============================================

router.post(
  '/',
  authenticate,
  validate(schemas.createMaintenance, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId, type, description, cost, date, nextDue, technician, parts, notes } = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    const record = await Maintenance.create({
      vehicleId,
      type,
      description,
      cost: cost || 0,
      date: date || new Date(),
      nextDue,
      status: 'pending',
      technician,
      parts,
      notes
    });

    // If emergency maintenance, update vehicle status
    if (type === 'emergency') {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: 'maintenance' });
    }

    logger.info('Maintenance record created', {
      recordId: record._id,
      vehicle: vehicle.registrationNumber,
      type
    });

    res.status(201).json({
      success: true,
      record,
      message: 'Maintenance record created successfully'
    });
  })
);

// ============================================
// UPDATE MAINTENANCE RECORD
// ============================================

router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const record = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!record) {
      throw new NotFoundError('Maintenance record');
    }

    logger.info('Maintenance record updated', { recordId: record._id });

    res.json({
      success: true,
      record,
      message: 'Maintenance record updated successfully'
    });
  })
);

// ============================================
// UPDATE MAINTENANCE STATUS
// ============================================

router.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;

    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      throw new NotFoundError('Maintenance record');
    }

    const previousStatus = record.status;
    record.status = status;

    if (status === 'completed') {
      record.completedAt = new Date();
      // Update vehicle next service date if provided
      if (record.nextDue) {
        await Vehicle.findByIdAndUpdate(record.vehicleId, {
          status: 'available',
          nextServiceDue: record.nextDue,
          lastServiceDate: new Date()
        });
      } else {
        await Vehicle.findByIdAndUpdate(record.vehicleId, { status: 'available' });
      }
    } else if (status === 'in-progress') {
      await Vehicle.findByIdAndUpdate(record.vehicleId, { status: 'maintenance' });
    }

    if (notes) {
      record.notes = notes;
    }

    await record.save();

    logger.info('Maintenance status updated', {
      recordId: record._id,
      previousStatus,
      newStatus: status
    });

    res.json({
      success: true,
      record,
      message: `Status updated to ${status}`
    });
  })
);

// ============================================
// DELETE MAINTENANCE RECORD
// ============================================

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const record = await Maintenance.findByIdAndDelete(req.params.id);

    if (!record) {
      throw new NotFoundError('Maintenance record');
    }

    logger.info('Maintenance record deleted', { recordId: req.params.id });

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  })
);

// ============================================
// GET UPCOMING MAINTENANCE
// ============================================

router.get(
  '/upcoming/schedule',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    const endDate = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);

    const upcoming = await Maintenance.find({
      status: 'pending',
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('vehicleId', 'registrationNumber type')
      .sort({ date: 1 })
      .lean();

    // Also get vehicles with overdue service
    const overdue = await Vehicle.find({
      nextServiceDue: { $lt: new Date() },
      status: { $ne: 'maintenance' }
    }).lean();

    res.json({
      success: true,
      upcoming: {
        count: upcoming.length,
        records: upcoming
      },
      overdue: {
        count: overdue.length,
        vehicles: overdue.map(v => ({
          id: v._id,
          registrationNumber: v.registrationNumber,
          type: v.type,
          serviceDue: v.nextServiceDue
        }))
      }
    });
  })
);

// ============================================
// GET MAINTENANCE COSTS
// ============================================

router.get(
  '/stats/costs',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 30) * 24 * 60 * 60 * 1000);

    const costs = await Maintenance.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$cost' },
          count: { $sum: 1 },
          avgCost: { $avg: '$cost' }
        }
      }
    ]);

    const totalCost = costs.reduce((sum, c) => sum + c.total, 0);

    res.json({
      success: true,
      stats: {
        period,
        totalCost,
        byType: costs.map(c => ({
          type: c._id,
          total: c.total,
          count: c.count,
          average: Math.round(c.avgCost)
        }))
      }
    });
  })
);

export default router;