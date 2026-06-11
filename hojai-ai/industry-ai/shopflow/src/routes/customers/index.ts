import { Router, Request, Response } from 'express';
import { Customer } from '../../models';
import { customerSchema, updateLoyaltySchema } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { apiLimiter } from '../../middleware/rateLimit';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';

const router = Router();

// POST /api/customers - Create customer
router.post('/', apiLimiter, validate(customerSchema), async (req: Request, res: Response) => {
  try {
    const customerData = req.body;

    // Check for duplicate phone
    const existingCustomer = await Customer.findOne({ phone: customerData.phone });
    if (existingCustomer) {
      throw new ConflictError(`Customer with phone ${customerData.phone} already exists`);
    }

    const customer = new Customer(customerData);
    await customer.save();

    logger.info('Customer created', { customerId: customer._id, phone: customer.phone });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error: any) {
    logger.error('Create customer failed', { error });
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: 'Duplicate phone number',
        code: 'DUPLICATE_PHONE',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer',
    });
  }
});

// GET /api/customers - List customers
router.get('/', apiLimiter, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      tier,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (tier) {
      filter.tier = tier;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy as string] = order === 'asc' ? 1 : -1;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: skip + customers.length < total,
        },
      },
    });
  } catch (error: any) {
    logger.error('List customers failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list customers',
    });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    logger.error('Get customer failed', { error });
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid customer ID',
        code: 'INVALID_ID',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customer',
    });
  }
});

// GET /api/customers/phone/:phone - Get customer by phone
router.get('/phone/:phone', apiLimiter, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    logger.error('Get customer by phone failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customer',
    });
  }
});

// PATCH /api/customers/:id - Update customer
router.patch('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phone', 'email'];
    const updateData: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    logger.info('Customer updated', { customerId: customer._id });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error: any) {
    logger.error('Update customer failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update customer',
    });
  }
});

// PATCH /api/customers/:id/loyalty - Update loyalty
router.patch('/:id/loyalty', apiLimiter, validate(updateLoyaltySchema), async (req: Request, res: Response) => {
  try {
    const { points, operation = 'add' } = req.body;
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const previousPoints = customer.loyaltyPoints;
    const previousTier = customer.tier;

    switch (operation) {
      case 'add':
        customer.loyaltyPoints += points;
        break;
      case 'subtract':
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - points);
        break;
      case 'set':
        customer.loyaltyPoints = Math.max(0, points);
        break;
    }

    await customer.save();

    logger.info('Loyalty updated', {
      customerId,
      operation,
      points,
      previousPoints,
      newPoints: customer.loyaltyPoints,
      tierUpgrade: customer.tier !== previousTier,
    });

    res.json({
      success: true,
      data: {
        customerId,
        previousPoints,
        newPoints: customer.loyaltyPoints,
        operation,
        points,
        tierChanged: customer.tier !== previousTier,
        newTier: customer.tier,
        previousTier,
      },
      message: 'Loyalty points updated successfully',
    });
  } catch (error: any) {
    logger.error('Update loyalty failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update loyalty',
    });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    logger.info('Customer deleted', { customerId: req.params.id });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete customer failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete customer',
    });
  }
});

export default router;