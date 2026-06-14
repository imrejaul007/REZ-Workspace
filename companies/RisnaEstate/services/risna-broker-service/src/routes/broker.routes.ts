import { Router, Request, Response, NextFunction } from 'express';
import { brokerService } from '../services/brokerService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// Register broker
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const broker = await brokerService.register(req.body);
    successResponse(res, broker, 201);
  } catch (err) {
    next(err);
  }
});

// Search brokers
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, country, city, specialization, status, minRating } = req.query;
    const result = await brokerService.search({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      country: country as string,
      city: city as string,
      specialization: specialization as string,
      status: status as any,
      minRating: minRating ? parseFloat(minRating as string) : undefined
    });
    paginatedResponse(res, result.brokers, (page as unknown as number) || 1, (limit as unknown as number) || 20, result.total);
  } catch (err) {
    next(err);
  }
});

// Get dashboard stats
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await brokerService.getDashboard();
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// Get broker by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const broker = await brokerService.getById(req.params.id);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

// Get broker by user ID
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const broker = await brokerService.getByUserId(req.params.userId);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

// Update broker
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const broker = await brokerService.update(req.params.id, req.body);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

// Verify broker
router.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verifiedBy } = req.body;
    const broker = await brokerService.verify(req.params.id, verifiedBy);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

// Suspend broker
router.post('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const broker = await brokerService.suspend(req.params.id, reason);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

// Get broker stats
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await brokerService.getStats(req.params.id);
    if (!stats) return errorResponse(res, errors.notFound('Broker'), 404);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// Calculate commission
router.post('/:id/commission/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dealValue, propertyType, listingType } = req.body;
    const broker = await brokerService.getById(req.params.id);
    if (!broker) return errorResponse(res, errors.notFound('Broker'), 404);
    const calculation = brokerService.calculateCommission(broker, dealValue, propertyType, listingType);
    successResponse(res, calculation);
  } catch (err) {
    next(err);
  }
});

// Create team
router.post('/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, managerId } = req.body;
    const team = await brokerService.createTeam(name, managerId);
    successResponse(res, team, 201);
  } catch (err) {
    next(err);
  }
});

// Get team
router.get('/teams/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await brokerService.getTeam(req.params.teamId);
    if (!team) return errorResponse(res, errors.notFound('Team'), 404);
    successResponse(res, team);
  } catch (err) {
    next(err);
  }
});

// Get team members
router.get('/teams/:teamId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await brokerService.getTeamMembers(req.params.teamId);
    successResponse(res, members);
  } catch (err) {
    next(err);
  }
});

// Add broker to team
router.post('/:id/team', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.body;
    const broker = await brokerService.addToTeam(req.params.id, teamId);
    if (!broker) return errorResponse(res, errors.notFound('Broker or Team'), 404);
    successResponse(res, broker);
  } catch (err) {
    next(err);
  }
});

export default router;
