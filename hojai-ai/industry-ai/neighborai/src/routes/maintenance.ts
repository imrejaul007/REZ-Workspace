/**
 * NEIGHBORAI - Maintenance Routes
 */

import { Router, Response } from 'express';
import { Maintenance, Resident } from '../models';
import { maintenanceRequestSchema, maintenanceBillSchema, maintenancePaySchema } from '../utils/validators';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// Default maintenance amounts
const DEFAULT_MAINTENANCE_AMOUNT = 3000;
const WATER_CHARGES = 200;
const PARKING_CHARGES = 300;

// GET /api/maintenance/:flatNumber - Get maintenance for a flat
router.get('/:flatNumber', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { flatNumber } = req.params;
    const { month, status, year } = req.query;

    const query: any = { flatNumber };

    if (month) query.month = month;
    if (status) query.status = status;
    if (year) {
      const startOfYear = new Date(Number(year), 0, 1);
      const endOfYear = new Date(Number(year), 11, 31, 23, 59, 59);
      query.dueDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const maintenanceRecords = await Maintenance.find(query).sort({ dueDate: -1 });

    // Calculate totals
    const totalPending = maintenanceRecords
      .filter(m => m.status !== 'paid')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalPaid = maintenanceRecords
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount, 0);

    logger.info('Maintenance fetched', {
      flatNumber,
      count: maintenanceRecords.length,
      totalPending,
      userId: req.userId
    });

    res.json({
      success: true,
      flatNumber,
      records: maintenanceRecords,
      totalRecords: maintenanceRecords.length,
      summary: {
        totalPending,
        totalPaid,
        pendingCount: maintenanceRecords.filter(m => m.status === 'pending' || m.status === 'overdue').length,
        paidCount: maintenanceRecords.filter(m => m.status === 'paid').length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/maintenance - Get all maintenance records
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, wing, month, limit = 50, page = 1 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (wing) query.wing = wing;
    if (month) query.month = month;

    const skip = (Number(page) - 1) * Number(limit);

    const records = await Maintenance.find(query)
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Maintenance.countDocuments(query);

    // Get statistics
    const totalPending = await Maintenance.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalPaid = await Maintenance.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      records,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      summary: {
        pendingAmount: totalPending[0]?.total || 0,
        pendingCount: totalPending[0]?.count || 0,
        paidAmount: totalPaid[0]?.total || 0,
        paidCount: totalPaid[0]?.count || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/request - Create maintenance request
router.post('/request', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = maintenanceRequestSchema.parse(req.body);

    // Get resident info
    const resident = await Resident.findOne({ flatNumber: validatedData.flatNumber });

    const maintenance = await Maintenance.create({
      residentId: validatedData.residentId,
      flatNumber: validatedData.flatNumber,
      wing: validatedData.wing || resident?.wing,
      category: validatedData.category,
      description: validatedData.description,
      amount: validatedData.amount || DEFAULT_MAINTENANCE_AMOUNT,
      dueDate: validatedData.dueDate,
      status: 'pending'
    });

    logger.info('Maintenance request created', {
      maintenanceId: maintenance._id,
      flatNumber: maintenance.flatNumber,
      amount: maintenance.amount
    });

    res.status(201).json({
      success: true,
      maintenance,
      message: `Maintenance request created for Flat ${maintenance.flatNumber}. Amount: Rs. ${maintenance.amount}`,
      billNumber: `MAINT-${maintenance._id.toString().slice(-8).toUpperCase()}`
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

// POST /api/maintenance/generate - Generate monthly bills
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { month, year, maintenanceAmount = DEFAULT_MAINTENANCE_AMOUNT, includeWater = true, includeParking = true } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get all residents
    const residents = await Resident.find({});

    // Generate bills
    const bills = [];
    const dueDate = new Date(year, getMonthIndex(month) + 1, 10); // Due on 10th of next month

    for (const resident of residents) {
      const amount = maintenanceAmount + (includeWater ? WATER_CHARGES : 0) + (includeParking ? PARKING_CHARGES : 0);

      const existingBill = await Maintenance.findOne({
        flatNumber: resident.flatNumber,
        month: `${month} ${year}`,
        category: 'monthly-maintenance'
      });

      if (existingBill) {
        continue; // Skip if bill already exists
      }

      const maintenance = await Maintenance.create({
        residentId: resident._id.toString(),
        flatNumber: resident.flatNumber,
        wing: resident.wing,
        category: 'monthly-maintenance',
        description: `Monthly maintenance for ${month} ${year}`,
        amount,
        dueDate,
        status: 'pending',
        month: `${month} ${year}`
      });

      bills.push(maintenance);
    }

    logger.info('Monthly maintenance bills generated', {
      count: bills.length,
      month,
      year,
      amount: maintenanceAmount,
      userId: req.userId
    });

    res.status(201).json({
      success: true,
      generated: bills.length,
      bills: bills.slice(0, 10), // Return first 10
      message: `Generated ${bills.length} maintenance bills for ${month} ${year}`,
      breakdown: {
        maintenanceAmount,
        waterCharges: includeWater ? WATER_CHARGES : 0,
        parkingCharges: includeParking ? PARKING_CHARGES : 0,
        totalPerFlat: maintenanceAmount + (includeWater ? WATER_CHARGES : 0) + (includeParking ? PARKING_CHARGES : 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/:id/pay - Record payment
router.post('/:id/pay', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { paidAmount } = req.body;

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found',
        code: 'MAINTENANCE_NOT_FOUND'
      });
    }

    if (maintenance.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Bill already paid',
        code: 'ALREADY_PAID'
      });
    }

    const amount = paidAmount || maintenance.amount;
    maintenance.paidAmount = amount;
    maintenance.paidAt = new Date();

    if (amount >= maintenance.amount) {
      maintenance.status = 'paid';
    } else {
      maintenance.status = 'partial';
    }

    await maintenance.save();

    logger.info('Maintenance payment recorded', {
      maintenanceId: maintenance._id,
      amount,
      status: maintenance.status
    });

    res.json({
      success: true,
      maintenance,
      message: `Payment of Rs. ${amount} recorded for Flat ${maintenance.flatNumber}`,
      remainingAmount: maintenance.status === 'paid' ? 0 : maintenance.amount - amount
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/maintenance/:id - Update maintenance record
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { amount, dueDate, status, category, description } = req.body;
    const updates: any = {};

    if (amount !== undefined) updates.amount = amount;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (status !== undefined) updates.status = status;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found',
        code: 'MAINTENANCE_NOT_FOUND'
      });
    }

    logger.info('Maintenance updated', {
      maintenanceId: maintenance._id,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      maintenance,
      message: 'Maintenance record updated'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/maintenance/:id - Delete maintenance record
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found',
        code: 'MAINTENANCE_NOT_FOUND'
      });
    }

    logger.info('Maintenance deleted', {
      maintenanceId: req.params.id,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Maintenance record deleted'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/overdue/update - Mark overdue bills
router.post('/overdue/update', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Maintenance.updateMany(
      {
        status: 'pending',
        dueDate: { $lt: today }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    logger.info('Overdue bills marked', {
      count: result.modifiedCount,
      userId: req.userId
    });

    res.json({
      success: true,
      updated: result.modifiedCount,
      message: `${result.modifiedCount} bills marked as overdue`
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get month index
function getMonthIndex(monthName: string): number {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months.indexOf(monthName);
}

export default router;