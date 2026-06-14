import { Router, Request, Response } from 'express';
import { customerService, CreateCustomerInput, UpdateCustomerInput, CustomerFilters } from '../services/CustomerService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateCustomerSchema = z.object({
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100),
  dateOfBirth: z.string().optional(),
  anniversary: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  acquisitionSource: z.string().optional(),
  referralCode: z.string().optional(),
});

const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  anniversary: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  preferences: z.object({
    preferredServices: z.array(z.string()).optional(),
    preferredStylists: z.array(z.string()).optional(),
    preferredTimeSlots: z.array(z.string()).optional(),
    communicationChannel: z.enum(['sms', 'email', 'both']).optional(),
    language: z.string().optional(),
    notificationsEnabled: z.boolean().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const RecordVisitSchema = z.object({
  service: z.string().min(1),
  stylist: z.string().min(1),
  amount: z.number().positive(),
  duration: z.number().positive(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const SegmentQuerySchema = z.object({
  tier: z.enum(['new', 'regular', 'vip', 'at-risk', 'churned']).optional(),
  minSpend: z.coerce.number().optional(),
  maxSpend: z.coerce.number().optional(),
  minVisits: z.coerce.number().optional(),
  maxVisits: z.coerce.number().optional(),
  daysInactiveMin: z.coerce.number().optional(),
  daysInactiveMax: z.coerce.number().optional(),
  tags: z.string().optional().transform(s => s ? s.split(',') : undefined),
  services: z.string().optional().transform(s => s ? s.split(',') : undefined),
});

/**
 * @route POST /api/customers
 * @desc Create a new customer
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(validatedData as CreateCustomerInput);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create customer' });
    }
  }
});

/**
 * @route GET /api/customers/:id
 * @desc Get customer by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get customer' });
  }
});

/**
 * @route GET /api/customers/phone/:phone
 * @desc Get customer by phone
 */
router.get('/phone/:phone', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerByPhone(req.params.phone);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get customer' });
  }
});

/**
 * @route GET /api/customers/email/:email
 * @desc Get customer by email
 */
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerByEmail(decodeURIComponent(req.params.email));
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get customer' });
  }
});

/**
 * @route PUT /api/customers/:id
 * @desc Update customer profile
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(req.params.id, validatedData as UpdateCustomerInput);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update customer' });
    }
  }
});

/**
 * @route POST /api/customers/:id/visits
 * @desc Record a visit for customer
 */
router.post('/:id/visits', async (req: Request, res: Response) => {
  try {
    const validatedData = RecordVisitSchema.parse(req.body);
    const customer = await customerService.recordVisit(req.params.id, validatedData);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to record visit' });
    }
  }
});

/**
 * @route GET /api/customers/:id/visits
 * @desc Get customer visit history
 */
router.get('/:id/visits', async (req: Request, res: Response) => {
  try {
    const { limit, offset, startDate, endDate } = req.query;
    const result = await customerService.getVisitHistory(req.params.id, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get visit history' });
  }
});

/**
 * @route GET /api/customers/:id/ltv
 * @desc Get customer lifetime value metrics
 */
router.get('/:id/ltv', async (req: Request, res: Response) => {
  try {
    const metrics = await customerService.getLTVMetrics(req.params.id);
    if (!metrics) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get LTV metrics' });
  }
});

/**
 * @route GET /api/customers/search
 * @desc Search customers by name, phone, or email
 */
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { q, limit, offset } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }
    const result = await customerService.searchCustomers(q as string, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search customers' });
  }
});

/**
 * @route POST /api/customers/segment
 * @desc Segment customers based on criteria
 */
router.post('/segment', async (req: Request, res: Response) => {
  try {
    const validatedData = SegmentQuerySchema.parse(req.query);
    const filters: CustomerFilters = {};

    if (validatedData.tier) filters.tier = validatedData.tier;
    if (validatedData.minSpend) filters.minSpend = validatedData.minSpend;
    if (validatedData.maxSpend) filters.maxSpend = validatedData.maxSpend;
    if (validatedData.minVisits) filters.minVisits = validatedData.minVisits;
    if (validatedData.maxVisits) filters.maxVisits = validatedData.maxVisits;
    if (validatedData.daysInactiveMin) filters.daysInactiveMin = validatedData.daysInactiveMin;
    if (validatedData.daysInactiveMax) filters.daysInactiveMax = validatedData.daysInactiveMax;
    if (validatedData.tags) filters.tags = validatedData.tags;
    if (validatedData.services) filters.services = validatedData.services;

    const segment = await customerService.segmentCustomers(filters);
    res.json({ success: true, data: segment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to segment customers' });
    }
  }
});

/**
 * @route GET /api/customers/birthdays/upcoming
 * @desc Get customers with upcoming birthdays
 */
router.get('/birthdays/upcoming', async (req: Request, res: Response) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 7;
    const customers = await customerService.getUpcomingBirthdays(daysAhead);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get upcoming birthdays' });
  }
});

/**
 * @route GET /api/customers/anniversaries/upcoming
 * @desc Get customers with upcoming anniversaries
 */
router.get('/anniversaries/upcoming', async (req: Request, res: Response) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 7;
    const customers = await customerService.getUpcomingAnniversaries(daysAhead);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get upcoming anniversaries' });
  }
});

/**
 * @route GET /api/customers/at-risk
 * @desc Get at-risk customers
 */
router.get('/status/at-risk', async (req: Request, res: Response) => {
  try {
    const inactiveDays = req.query.days ? parseInt(req.query.days as string) : 60;
    const customers = await customerService.getAtRiskCustomers(inactiveDays);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get at-risk customers' });
  }
});

/**
 * @route GET /api/customers/vip
 * @desc Get VIP customers
 */
router.get('/status/vip', async (req: Request, res: Response) => {
  try {
    const minSpend = req.query.minSpend ? parseInt(req.query.minSpend as string) : 10000;
    const customers = await customerService.getVIPCustomers(minSpend);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get VIP customers' });
  }
});

/**
 * @route DELETE /api/customers/:id
 * @desc Deactivate a customer
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await customerService.deactivateCustomer(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate customer' });
  }
});

export default router;
