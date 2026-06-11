/**
 * GLAMAI - Customer Routes
 * Salon AI Operating System
 */

import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Customer, Appointment, Payment } from '../models';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/error';
import { CustomerSchema, PaginatedResponse } from '../types';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = CustomerSchema.parse(req.body);
    const { name, phone, email, birthday, preferences, loyaltyTier } = validated;

    // Check if customer already exists by phone
    const existing = await Customer.findOne({ phone });
    if (existing) {
      throw errors.conflict('Customer with this phone already exists');
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      birthday: birthday ? new Date(birthday) : undefined,
      preferences: preferences || [],
      loyaltyTier: loyaltyTier || 'bronze',
      totalSpent: 0,
      visits: 0,
    });

    logger.info('Customer registered', { customerId: customer._id, name });

    res.status(201).json({
      success: true,
      message: `Welcome to GLAMAI, ${name}!`,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyTier: customer.loyaltyTier,
      },
      welcomeBonus: customer.loyaltyTier === 'bronze' ? 100 : 0,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/customers
 * List all customers with pagination
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', tier, search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const query: any = {};
    if (tier) {
      query.loyaltyTier = tier;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query).skip(skip).limit(take).sort({ createdAt: -1 }),
      Customer.countDocuments(query),
    ]);

    const response: PaginatedResponse<any> = {
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    res.json({
      success: true,
      customer,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/customers/:id
 * Update customer
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    const { name, email, birthday, preferences, loyaltyTier } = req.body;

    if (name) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (birthday) customer.birthday = new Date(birthday);
    if (preferences) customer.preferences = preferences;
    if (loyaltyTier) customer.loyaltyTier = loyaltyTier;

    await customer.save();

    logger.info('Customer updated', { customerId: customer._id });

    res.json({
      success: true,
      customer,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    await customer.deleteOne();

    logger.info('Customer deleted', { customerId: req.params.id });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/customers/:id/history
 * Get customer appointment history
 */
router.get(
  '/:id/history',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    const appointments = await Appointment.find({ customerId: customer._id })
      .populate('serviceId', 'name category price duration')
      .populate('stylistId', 'name')
      .sort({ date: -1 })
      .limit(20);

    const appointmentIds = appointments.map(a => a._id);
    const payments = await Payment.find({ appointmentId: { $in: appointmentIds } });

    // Get unique services
    const seenServiceIds = new Set<string>();
    const recentServices: any[] = [];
    for (const a of appointments) {
      if (a.serviceId && !seenServiceIds.has((a.serviceId as any)._id.toString())) {
        seenServiceIds.add((a.serviceId as any)._id.toString());
        recentServices.push(a.serviceId);
      }
    }

    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        loyaltyTier: customer.loyaltyTier,
        totalSpent: customer.totalSpent,
        visits: customer.visits,
        lastVisit: customer.lastVisit,
      },
      history: {
        appointments,
        recentServices,
        totalPayments: payments.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/customers/:id/loyalty
 * Get customer loyalty status
 */
router.get(
  '/:id/loyalty',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw errors.notFound('Customer');
    }

    const tier = customer.loyaltyTier;
    const spent = customer.totalSpent;

    // Calculate progress to next tier
    let nextTier = null;
    let progress = 100;

    if (tier === 'bronze') {
      nextTier = { name: 'Silver', minSpent: 2000 };
      progress = Math.min((spent / 2000) * 100, 100);
    } else if (tier === 'silver') {
      nextTier = { name: 'Gold', minSpent: 5000 };
      progress = Math.min(((spent - 2000) / 3000) * 100, 100);
    } else if (tier === 'gold') {
      nextTier = { name: 'Platinum', minSpent: 10000 };
      progress = Math.min(((spent - 5000) / 5000) * 100, 100);
    }

    res.json({
      success: true,
      loyalty: {
        currentTier: tier,
        totalSpent,
        visits: customer.visits,
        nextTier,
        progress: Math.round(progress),
        benefits: getTierBenefits(tier),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ['Base rewards', 'Birthday bonus'],
    silver: ['5% discount', 'Priority booking', 'Birthday bonus'],
    gold: ['10% discount', 'Priority booking', 'Free add-ons', 'Birthday bonus'],
    platinum: ['15% discount', 'VIP treatment', 'Free premium services', 'Exclusive events'],
  };
  return benefits[tier] || benefits.bronze;
}

export default router;