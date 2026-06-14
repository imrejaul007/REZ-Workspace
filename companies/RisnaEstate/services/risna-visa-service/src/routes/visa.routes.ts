import { Router, Request, Response, NextFunction } from 'express';
import { visaService } from '../services/visaService';
import { successResponse, errorResponse, errors } from '../utils/response';

const router = Router();

// Get available programs
router.get('/programs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = visaService.getPrograms();
    successResponse(res, programs);
  } catch (err) {
    next(err);
  }
});

// Get document requirements
router.get('/requirements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { programType } = req.query;
    if (!programType) {
      return errorResponse(res, errors.badRequest('programType required'), 400);
    }
    const requirements = visaService.getDocumentRequirements(programType as any);
    successResponse(res, requirements);
  } catch (err) {
    next(err);
  }
});

// Check eligibility
router.post('/eligibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await visaService.checkEligibility(req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// Create assessment
router.post('/assessment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await visaService.createAssessment(req.body);
    successResponse(res, assessment, 201);
  } catch (err) {
    next(err);
  }
});

// Get stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await visaService.getStats();
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
});

// Get assessment by ID
router.get('/assessment/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await visaService.getById(req.params.id);
    if (!assessment) {
      return errorResponse(res, errors.notFound('Assessment'), 404);
    }
    successResponse(res, assessment);
  } catch (err) {
    next(err);
  }
});

// Get assessments by user
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessments = await visaService.getByUser(req.params.userId);
    successResponse(res, assessments);
  } catch (err) {
    next(err);
  }
});

// Calculate points
router.post('/assessment/:id/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { programType } = req.body;
    const assessment = await visaService.getById(req.params.id);
    if (!assessment) {
      return errorResponse(res, errors.notFound('Assessment'), 404);
    }
    const points = visaService.calculatePoints(assessment, programType);
    successResponse(res, points);
  } catch (err) {
    next(err);
  }
});

// Upload document
router.post('/assessment/:id/document', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await visaService.uploadDocument(req.params.id, req.body);
    if (!assessment) {
      return errorResponse(res, errors.notFound('Assessment'), 404);
    }
    successResponse(res, assessment);
  } catch (err) {
    next(err);
  }
});

// Update assessment
router.put('/assessment/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await visaService.update(req.params.id, req.body);
    if (!assessment) {
      return errorResponse(res, errors.notFound('Assessment'), 404);
    }
    successResponse(res, assessment);
  } catch (err) {
    next(err);
  }
});

export default router;
