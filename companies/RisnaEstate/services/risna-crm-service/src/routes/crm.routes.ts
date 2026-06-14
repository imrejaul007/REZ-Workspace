import { Router, Request, Response, NextFunction } from 'express';
import { crmService } from '../services/crmService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';
import { requireInternalAuth } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(requireInternalAuth);

// Follow-ups

router.post('/follow-ups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followUp = await crmService.createFollowUp(req.body);
    successResponse(res, followUp, 201);
  } catch (err) { next(err); }
});

router.get('/follow-ups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId, leadId, status, type, page, limit } = req.query;
    const result = await crmService.getFollowUps({
      brokerId: brokerId as string,
      leadId: leadId as string,
      status: status as string,
      type: type as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    paginatedResponse(res, result.followUps, (page as unknown as number) || 1, (limit as unknown as number) || 20, result.total);
  } catch (err) { next(err); }
});

router.get('/follow-ups/due', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.query;
    if (!brokerId) return errorResponse(res, errors.badRequest('brokerId required'), 400);
    const followUps = await crmService.getDueFollowUps(brokerId as string);
    successResponse(res, followUps);
  } catch (err) { next(err); }
});

router.get('/follow-ups/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followUp = await crmService.getFollowUp(req.params.id);
    if (!followUp) return errorResponse(res, errors.notFound('Follow-up'), 404);
    successResponse(res, followUp);
  } catch (err) { next(err); }
});

router.post('/follow-ups/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outcome, notes } = req.body;
    const followUp = await crmService.completeFollowUp(req.params.id, outcome, notes);
    if (!followUp) return errorResponse(res, errors.notFound('Follow-up'), 404);
    successResponse(res, followUp);
  } catch (err) { next(err); }
});

router.post('/follow-ups/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newScheduledAt } = req.body;
    if (!newScheduledAt) return errorResponse(res, errors.badRequest('newScheduledAt required'), 400);
    const followUp = await crmService.rescheduleFollowUp(req.params.id, new Date(newScheduledAt));
    if (!followUp) return errorResponse(res, errors.notFound('Follow-up'), 404);
    successResponse(res, followUp);
  } catch (err) { next(err); }
});

router.post('/follow-ups/:id/skip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const followUp = await crmService.skipFollowUp(req.params.id, reason);
    if (!followUp) return errorResponse(res, errors.notFound('Follow-up'), 404);
    successResponse(res, followUp);
  } catch (err) { next(err); }
});

// Site Visits

router.post('/site-visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.createSiteVisit(req.body);
    successResponse(res, visit, 201);
  } catch (err) { next(err); }
});

router.get('/site-visits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId, leadId, propertyId, status, from, to, page, limit } = req.query;
    const result = await crmService.getSiteVisits({
      brokerId: brokerId as string,
      leadId: leadId as string,
      propertyId: propertyId as string,
      status: status as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    paginatedResponse(res, result.visits, (page as unknown as number) || 1, (limit as unknown as number) || 20, result.total);
  } catch (err) { next(err); }
});

router.get('/site-visits/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.getSiteVisit(req.params.id);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

router.post('/site-visits/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.confirmSiteVisit(req.params.id);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

router.post('/site-visits/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.startSiteVisit(req.params.id);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

router.post('/site-visits/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.completeSiteVisit(req.params.id, req.body);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

router.post('/site-visits/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const visit = await crmService.cancelSiteVisit(req.params.id, reason);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

router.post('/site-visits/:id/no-show', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visit = await crmService.markNoShow(req.params.id);
    if (!visit) return errorResponse(res, errors.notFound('Site visit'), 404);
    successResponse(res, visit);
  } catch (err) { next(err); }
});

// Dashboard

router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.query;
    if (!brokerId) return errorResponse(res, errors.badRequest('brokerId required'), 400);
    const dashboard = await crmService.getDashboard(brokerId as string);
    successResponse(res, dashboard);
  } catch (err) { next(err); }
});

export default router;
