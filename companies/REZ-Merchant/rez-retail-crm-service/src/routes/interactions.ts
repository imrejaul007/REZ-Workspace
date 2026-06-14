import { Router, Request, Response, NextFunction } from 'express';
import { Interaction, Customer } from '../models';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/interactions - List all interactions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, type, status, storeId, priority, page = '1', limit = '50' } = req.query;

    const query: any = {};
    if (customerId) query.customerId = customerId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (storeId) query.storeId = storeId;
    if (priority) query.priority = priority;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [interactions, total] = await Promise.all([
      Interaction.find(query)
        .populate('customerId', 'name phone customerId')
        .populate('employeeId', 'name employeeId')
        .populate('storeId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Interaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: interactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/interactions/:id - Get single interaction
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interaction = await Interaction.findById(req.params.id)
      .populate('customerId', 'name phone customerId')
      .populate('employeeId', 'name employeeId')
      .populate('storeId', 'name code');

    if (!interaction) {
      res.status(404).json({ success: false, error: 'Interaction not found' });
      return;
    }

    res.json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
});

// GET /api/interactions/customer/:customerId - Get customer interactions
router.get('/customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interactions = await Interaction.find({ customerId: req.params.customerId })
      .populate('employeeId', 'name employeeId')
      .populate('storeId', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: interactions,
      count: interactions.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/interactions - Create interaction
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      res.status(400).json({ success: false, error: 'Customer not found' });
      return;
    }

    const interaction = new Interaction(req.body);
    await interaction.save();

    logger.info('Interaction created', { interactionId: interaction._id, type: interaction.type });

    res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
});

// PUT /api/interactions/:id - Update interaction
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interaction = await Interaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!interaction) {
      res.status(404).json({ success: false, error: 'Interaction not found' });
      return;
    }

    logger.info('Interaction updated', { interactionId: interaction._id });

    res.json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/interactions/:id/status - Update status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    const update: any = { status };
    if (status === 'resolved' || status === 'closed') {
      update.resolvedAt = new Date();
    }

    const interaction = await Interaction.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!interaction) {
      res.status(404).json({ success: false, error: 'Interaction not found' });
      return;
    }

    logger.info('Interaction status updated', { interactionId: interaction._id, status });

    res.json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
});

// GET /api/interactions/open - Get open interactions
router.get('/status/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { priority, storeId } = req.query;

    const query: any = { status: { $in: ['open', 'in_progress'] } };
    if (priority) query.priority = priority;
    if (storeId) query.storeId = storeId;

    const interactions = await Interaction.find(query)
      .populate('customerId', 'name phone customerId')
      .populate('storeId', 'name code')
      .sort({ priority: -1, createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      data: interactions,
      count: interactions.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;