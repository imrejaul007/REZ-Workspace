import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { nutritionService, NutritionInput, MealInput } from '../services/nutritionService';
import { nutritionPlanSchema, nutritionAssignSchema, nutritionMealLogSchema, validateBody } from '../utils/validation';

const router = Router();

// Apply authentication to all routes
router.use(merchantAuth);

/**
 * Create a new nutrition plan
 * POST /api/v1/merchant/nutrition
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const validation = validateBody(nutritionPlanSchema)(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.errors });
  }

  const data: NutritionInput = {
    storeId: validation.data.storeId,
    name: validation.data.name,
    description: validation.data.description,
    type: validation.data.type,
    dailyCalories: validation.data.dailyCalories,
    proteinGrams: validation.data.proteinGrams,
    carbsGrams: validation.data.carbsGrams,
    fatGrams: validation.data.fatGrams,
    meals: validation.data.meals,
    duration: validation.data.duration,
    createdBy: validation.data.createdBy,
  };

  const plan = await nutritionService.createPlan(data);
  res.status(201).json({ success: true, data: plan });
});

/**
 * Get all nutrition plans for a store
 * GET /api/v1/merchant/nutrition/:storeId
 */
router.get('/:storeId', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const plans = await nutritionService.getPlans(req.params.storeId);
  res.json({ data: plans });
});

/**
 * Get a specific nutrition plan
 * GET /api/v1/merchant/nutrition/plan/:id
 */
router.get('/plan/:id', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const plan = await nutritionService.getPlanById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }
  res.json({ data: plan });
});

/**
 * Assign a nutrition plan to a member
 * POST /api/v1/merchant/nutrition/:id/assign
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { memberId, assignedBy } = req.body;
  if (!memberId) {
    return res.status(400).json({ success: false, message: 'memberId is required' });
  }
  await nutritionService.assignToMember(req.params.id, memberId, assignedBy || 'system');
  res.json({ success: true });
});

/**
 * Get active nutrition plan for a member
 * GET /api/v1/merchant/nutrition/member/:memberId
 */
router.get('/member/:memberId', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const plan = await nutritionService.getMemberPlan(req.params.memberId);
  res.json({ data: plan });
});

/**
 * Log a meal for a member
 * POST /api/v1/merchant/nutrition/member/:memberId/meal
 */
router.post('/member/:memberId/meal', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const meal: MealInput = {
    name: req.body.name,
    calories: req.body.calories,
    date: new Date(req.body.date),
  };
  const storeId = req.body.storeId || 'default';
  await nutritionService.logMeal(req.params.memberId, meal, storeId);
  res.status(201).json({ success: true });
});

/**
 * Get meal logs for a member on a specific date
 * GET /api/v1/merchant/nutrition/member/:memberId/meals?date=YYYY-MM-DD
 */
router.get('/member/:memberId/meals', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const date = req.query.date
    ? new Date(req.query.date as string)
    : new Date();

  const logs = await nutritionService.getMealLogs(req.params.memberId, date);
  res.json({ data: logs });
});

/**
 * Get daily summary for a member
 * GET /api/v1/merchant/nutrition/member/:memberId/summary?date=YYYY-MM-DD
 */
router.get('/member/:memberId/summary', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const date = req.query.date
    ? new Date(req.query.date as string)
    : new Date();

  const summary = await nutritionService.getDailySummary(req.params.memberId, date);
  res.json({ data: summary });
});

/**
 * Update a nutrition plan
 * PUT /api/v1/merchant/nutrition/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const updates: Partial<NutritionInput> = req.body;
  const plan = await nutritionService.updatePlan(req.params.id, updates);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }
  res.json({ success: true, data: plan });
});

/**
 * Deactivate a nutrition plan
 * DELETE /api/v1/merchant/nutrition/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  await nutritionService.deactivatePlan(req.params.id);
  res.json({ success: true });
});

export default router;
