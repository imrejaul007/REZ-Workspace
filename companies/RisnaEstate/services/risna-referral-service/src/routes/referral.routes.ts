import { Router, Request, Response, NextFunction } from 'express';
import { referralService } from '../services/referralService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// Create referral
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referral = await referralService.create(req.body);
    successResponse(res, referral, 201);
  } catch (err) {
    next(err);
  }
});

// Validate referral code
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) return errorResponse(res, errors.badRequest('code required'), 400);
    const referral = await referralService.validateCode(code);
    successResponse(res, { valid: !!referral, referral });
  } catch (err) {
    next(err);
  }
});

// Get my referrals
router.get('/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', userId } = req.query;
    if (!userId) return errorResponse(res, errors.badRequest('userId required'), 400);
    const result = await referralService.getMyReferrals(userId as string, parseInt(page as string, 10), parseInt(limit as string, 10));
    paginatedResponse(res, result.referrals, parseInt(page as string, 10), parseInt(limit as string, 10), result.total);
  } catch (err) {
    next(err);
  }
});

// Get earnings
router.get('/earnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, page = '1', limit = '20' } = req.query;
    if (!userId) return errorResponse(res, errors.badRequest('userId required'), 400);
    const result = await referralService.getEarnings(userId as string, parseInt(page as string, 10), parseInt(limit as string, 10));
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// Get leaderboard
router.get('/leaderboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await referralService.getLeaderboard();
    successResponse(res, leaderboard);
  } catch (err) {
    next(err);
  }
});

// Get programs
router.get('/programs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = await referralService.getPrograms();
    successResponse(res, programs);
  } catch (err) {
    next(err);
  }
});

// Get stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    const stats = await referralService.getStats(userId as string | undefined);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// Get referral by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referral = await referralService.getById(req.params.id);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

// Register referral
router.post('/:id/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refereeId, refereeName } = req.body;
    const referral = await referralService.register(req.params.id, refereeId, refereeName);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

// Mark as interested
router.post('/:id/interested', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referral = await referralService.markInterested(req.params.id);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

// Mark as visited
router.post('/:id/visited', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referral = await referralService.markVisited(req.params.id);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

// Mark as qualified
router.post('/:id/qualified', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referral = await referralService.markQualified(req.params.id);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

// Mark as converted
router.post('/:id/converted', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dealValue, propertyId } = req.body;
    if (!dealValue) return errorResponse(res, errors.badRequest('dealValue required'), 400);
    const referral = await referralService.markConverted(req.params.id, dealValue, propertyId);
    if (!referral) return errorResponse(res, errors.notFound('Referral'), 404);
    successResponse(res, referral);
  } catch (err) {
    next(err);
  }
});

export default router;
