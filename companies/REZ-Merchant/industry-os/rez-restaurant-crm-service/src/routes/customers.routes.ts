import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { customerService, CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from '../services/CustomerService';
import { visitService } from '../services/VisitService';
import { SegmentType } from '../config/constants';

const router = Router();

// Validation schemas
const CreateCustomerSchema = z.object({
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().optional(),
  anniversary: z.string().datetime().optional(),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    favoriteCuisines: z.array(z.string()).optional(),
    preferredSeating: z.string().optional(),
    preferredPaymentMethod: z.string().optional(),
    notificationsEnabled: z.object({
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().datetime().optional(),
  anniversary: z.string().datetime().optional(),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    favoriteCuisines: z.array(z.string()).optional(),
    preferredSeating: z.string().optional(),
    preferredPaymentMethod: z.string().optional(),
    notificationsEnabled: z.object({
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const CustomerFiltersSchema = z.object({
  segment: z.enum(['VIP', 'REGULAR', 'LAPSED', 'NEW']).optional(),
  isActive: z.boolean().optional(),
  birthdayThisMonth: z.boolean().optional(),
  anniversaryThisMonth: z.boolean().optional(),
  minLifetimeValue: z.number().optional(),
  maxLifetimeValue: z.number().optional(),
  minVisits: z.number().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// Middleware for validation
const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        next(error);
      }
    }
  };
};

// Create customer
router.post('/', validate(CreateCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateCustomerInput = {
      phone: req.body.phone,
      email: req.body.email,
      name: req.body.name,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      anniversary: req.body.anniversary ? new Date(req.body.anniversary) : undefined,
      preferences: req.body.preferences,
    };

    const customer = await customerService.createCustomer(input);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// Get customer by ID
router.get('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.getCustomerById(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Get customer by phone
router.get('/phone/:phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.getCustomerByPhone(req.params.phone);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Update customer
router.patch('/:customerId', validate(UpdateCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: UpdateCustomerInput = {
      name: req.body.name,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      anniversary: req.body.anniversary ? new Date(req.body.anniversary) : undefined,
      preferences: req.body.preferences,
      isActive: req.body.isActive,
      metadata: req.body.metadata,
    };

    const customer = await customerService.updateCustomer(req.params.customerId, input);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// List customers with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: CustomerFilters = {
      segment: req.query.segment as SegmentType | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      birthdayThisMonth: req.query.birthdayThisMonth === 'true',
      anniversaryThisMonth: req.query.anniversaryThisMonth === 'true',
      minLifetimeValue: req.query.minLifetimeValue ? Number(req.query.minLifetimeValue) : undefined,
      maxLifetimeValue: req.query.maxLifetimeValue ? Number(req.query.maxLifetimeValue) : undefined,
      minVisits: req.query.minVisits ? Number(req.query.minVisits) : undefined,
      search: req.query.search as string | undefined,
    };

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await customerService.listCustomers(filters, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update segment
router.post('/:customerId/update-segment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newSegment = await customerService.updateSegment(req.params.customerId);
    res.json({ customerId: req.params.customerId, segment: newSegment });
  } catch (error) {
    next(error);
  }
});

// Update all segments
router.post('/segments/update-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await customerService.updateAllSegments();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add loyalty points
router.post('/:customerId/points/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points } = req.body;
    if (typeof points !== 'number' || points < 0) {
      res.status(400).json({ error: 'Points must be a positive number' });
      return;
    }

    const customer = await customerService.addLoyaltyPoints(req.params.customerId, points);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ customerId: req.params.customerId, loyaltyPoints: customer.loyaltyPoints });
  } catch (error) {
    next(error);
  }
});

// Redeem loyalty points
router.post('/:customerId/points/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points } = req.body;
    if (typeof points !== 'number' || points < 0) {
      res.status(400).json({ error: 'Points must be a positive number' });
      return;
    }

    const result = await customerService.redeemLoyaltyPoints(req.params.customerId, points);
    res.json({ customerId: req.params.customerId, ...result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient')) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// Get customer stats
router.get('/:customerId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await customerService.getCustomerStats(req.params.customerId);
    if (!stats) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get today's celebrations
router.get('/celebrations/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const celebrations = await customerService.getTodayCelebrations();
    res.json(celebrations);
  } catch (error) {
    next(error);
  }
});

// Get customer visit history
router.get('/:customerId/visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await visitService.getCustomerVisits(req.params.customerId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get customer visit frequency stats
router.get('/:customerId/frequency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await visitService.getCustomerFrequencyStats(req.params.customerId);
    if (!stats) {
      res.status(404).json({ error: 'No visits found for customer' });
      return;
    }
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Deactivate customer
router.delete('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.deactivateCustomer(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json({ message: 'Customer deactivated', customerId: req.params.customerId });
  } catch (error) {
    next(error);
  }
});

export default router;
