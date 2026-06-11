import { Router, Request, Response } from 'express';
import { Sale } from '../../models';
import { logger } from '../../utils/logger';
import { apiLimiter } from '../../middleware/rateLimit';
import { NotFoundError } from '../../middleware/errorHandler';

const router = Router();

// POST /api/sales - Create sale
router.post('/', apiLimiter, async (req: Request, res: Response) => {
  try {
    const saleData = req.body;

    const sale = new Sale(saleData);
    await sale.save();

    logger.info('Sale created', { saleId: sale._id, total: sale.total });

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Sale created successfully',
    });
  } catch (error: any) {
    logger.error('Create sale failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create sale',
    });
  }
});

// GET /api/sales - List sales
router.get('/', apiLimiter, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      customerId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const sort: any = {};
    sort[sortBy as string] = order === 'asc' ? 1 : -1;

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('customerId', 'name phone email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: skip + sales.length < total,
        },
      },
    });
  } catch (error: any) {
    logger.error('List sales failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list sales',
    });
  }
});

// GET /api/sales/:id - Get sale by ID
router.get('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'name phone email tier loyaltyPoints');

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error: any) {
    logger.error('Get sale failed', { error });
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid sale ID',
        code: 'INVALID_ID',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sale',
    });
  }
});

// PATCH /api/sales/:id/status - Update sale status
router.patch('/:id/status', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'refunded', 'cancelled'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        code: 'INVALID_STATUS',
      });
      return;
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    logger.info('Sale status updated', { saleId: sale._id, status });

    res.json({
      success: true,
      data: sale,
      message: 'Sale status updated successfully',
    });
  } catch (error: any) {
    logger.error('Update sale status failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update sale status',
    });
  }
});

// GET /api/sales/customer/:customerId - Get sales by customer
router.get('/customer/:customerId', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);

    const sales = await Sale.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        sales,
        count: sales.length,
      },
    });
  } catch (error: any) {
    logger.error('Get customer sales failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get customer sales',
    });
  }
});

// GET /api/sales/stats - Get sales statistics
router.get('/stats/summary', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalDiscount: { $sum: '$discount' },
          avgOrderValue: { $avg: '$total' },
          minOrderValue: { $min: '$total' },
          maxOrderValue: { $max: '$total' },
        },
      },
    ]);

    const paymentStats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    const statusStats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || null,
        byPaymentMethod: paymentStats,
        byStatus: statusStats,
      },
    });
  } catch (error: any) {
    logger.error('Get sales stats failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get sales statistics',
    });
  }
});

export default router;