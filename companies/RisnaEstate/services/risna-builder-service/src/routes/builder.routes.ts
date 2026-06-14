import { Router, Request, Response, NextFunction } from 'express';
import { builderService } from '../services/builderService';
import { successResponse, errorResponse, errors, paginatedResponse } from '../utils/response';

const router = Router();

// Dashboard
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const builderId = req.headers['x-user-id'] as string;
    if (!builderId) return errorResponse(res, errors.badRequest('Builder ID required'), 400);
    const dashboard = await builderService.getDashboard(builderId);
    successResponse(res, dashboard);
  } catch (err) { next(err); }
});

// Projects
router.post('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await builderService.createProject({ ...req.body, builderId: req.headers['x-user-id'] as string });
    successResponse(res, project, 201);
  } catch (err) { next(err); }
});

router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const builderId = req.headers['x-user-id'] as string;
    const projects = await builderService.getProjects(builderId);
    successResponse(res, projects);
  } catch (err) { next(err); }
});

router.get('/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await builderService.getProject(req.params.id);
    if (!project) return errorResponse(res, errors.notFound('Project'), 404);
    successResponse(res, project);
  } catch (err) { next(err); }
});

router.put('/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await builderService.updateProject(req.params.id, req.body);
    if (!project) return errorResponse(res, errors.notFound('Project'), 404);
    successResponse(res, project);
  } catch (err) { next(err); }
});

router.get('/projects/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await builderService.getProjectStats(req.params.id);
    successResponse(res, stats);
  } catch (err) { next(err); }
});

router.get('/projects/:id/units', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, towerId } = req.query;
    const units = await builderService.getUnits(req.params.id, { status: status as string, towerId: towerId as string });
    successResponse(res, units);
  } catch (err) { next(err); }
});

router.patch('/units/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, bookedBy } = req.body;
    const unit = await builderService.updateUnitStatus(req.params.id, status, bookedBy);
    if (!unit) return errorResponse(res, errors.notFound('Unit'), 404);
    successResponse(res, unit);
  } catch (err) { next(err); }
});

export default router;
