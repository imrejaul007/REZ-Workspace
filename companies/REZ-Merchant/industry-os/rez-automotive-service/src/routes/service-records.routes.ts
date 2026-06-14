import { Router, Request, Response } from 'express';
import { ServiceRecord, ServiceRecordDocument } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createServiceRecordSchema, updateServiceRecordSchema, paginationSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/service-records
 * List all service records with pagination
 */
router.get(
  '/',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
    const { merchantId, customerId, vehicleId, serviceType } = req.query as any;

    const query: Record<string, unknown> = {};
    if (merchantId) query.merchantId = merchantId;
    if (customerId) query.customerId = customerId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (serviceType) query.serviceType = serviceType;

    const skip = (Number(page) - 1) * Number(limit);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [records, total] = await Promise.all([
      ServiceRecord.find(query).sort(sort).skip(skip).limit(Number(limit)),
      ServiceRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * GET /api/v1/service-records/:recordId
 * Get service record by ID
 */
router.get(
  '/:recordId',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const record = await ServiceRecord.findOne({ recordId });

    if (!record) {
      res.status(404).json({
        success: false,
        error: 'Service record not found',
      });
      return;
    }

    res.json({
      success: true,
      data: record,
    });
  })
);

/**
 * GET /api/v1/service-records/vehicle/:vehicleId
 * Get vehicle service history
 */
router.get(
  '/vehicle/:vehicleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const records = await ServiceRecord.getVehicleHistory(vehicleId);

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  })
);

/**
 * GET /api/v1/service-records/customer/:customerId
 * Get customer's service history
 */
router.get(
  '/customer/:customerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const { page = 1, limit = 20 } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      ServiceRecord.find({ customerId })
        .sort({ serviceDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceRecord.countDocuments({ customerId }),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * GET /api/v1/service-records/merchant/:merchantId/stats
 * Get service statistics for merchant
 */
router.get(
  '/merchant/:merchantId/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query as any;

    const matchStage: Record<string, unknown> = { merchantId };
    if (startDate && endDate) {
      matchStage.serviceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await ServiceRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalCost' },
          avgCost: { $avg: '$totalCost' },
        },
      },
      {
        $project: {
          serviceType: '$_id',
          count: 1,
          totalRevenue: 1,
          avgCost: { $round: ['$avgCost', 2] },
          _id: 0,
        },
      },
    ]);

    const totalStats = await ServiceRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalRevenue: { $sum: '$totalCost' },
          avgCost: { $avg: '$totalCost' },
          maxCost: { $max: '$totalCost' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byType: stats,
        overall: totalStats[0] || {
          totalRecords: 0,
          totalRevenue: 0,
          avgCost: 0,
          maxCost: 0,
        },
      },
    });
  })
);

/**
 * POST /api/v1/service-records
 * Create new service record
 */
router.post(
  '/',
  validate(createServiceRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const record = new ServiceRecord(req.body);
    await record.save();

    logger.info('Service record created', {
      recordId: record.recordId,
      vehicleId: record.vehicleId,
      merchantId: record.merchantId,
    });

    res.status(201).json({
      success: true,
      data: record,
      message: 'Service record created successfully',
    });
  })
);

/**
 * PUT /api/v1/service-records/:recordId
 * Update service record
 */
router.put(
  '/:recordId',
  validate(updateServiceRecordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const record = await ServiceRecord.findOneAndUpdate(
      { recordId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!record) {
      res.status(404).json({
        success: false,
        error: 'Service record not found',
      });
      return;
    }

    logger.info('Service record updated', { recordId });

    res.json({
      success: true,
      data: record,
      message: 'Service record updated successfully',
    });
  })
);

/**
 * DELETE /api/v1/service-records/:recordId
 * Delete service record
 */
router.delete(
  '/:recordId',
  asyncHandler(async (req: Request, res: Response) => {
    const { recordId } = req.params;
    const result = await ServiceRecord.deleteOne({ recordId });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Service record not found',
      });
      return;
    }

    logger.info('Service record deleted', { recordId });

    res.json({
      success: true,
      message: 'Service record deleted successfully',
    });
  })
);

export default router;