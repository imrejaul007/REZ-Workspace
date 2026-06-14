import { Router, Response } from 'express';
import { SurveyService, surveyService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('SurveyRoutes');
router.use(authMiddleware);
const service: SurveyService = surveyService;

// POST /api/surveys - Create survey
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const survey = await service.createSurvey({ ...req.body, createdBy: req.userId || 'system', companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    logger.error('Failed to create survey', { error });
    res.status(500).json({ success: false, error: 'Failed to create survey' });
  }
});

// GET /api/surveys/:id - Get survey by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const survey = await service.getSurveyById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    res.json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get survey' });
  }
});

// PUT /api/surveys/:id - Update survey
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const survey = await service.updateSurvey(req.params.id, req.body);
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });
    res.json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update survey' });
  }
});

// POST /api/surveys/:id/send - Send survey
router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const result = await service.sendSurvey(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send survey' });
  }
});

// POST /api/surveys/:id/close - Close survey
router.post('/:id/close', async (req: AuthRequest, res: Response) => {
  try {
    const survey = await service.closeSurvey(req.params.id);
    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found or not active' });
    res.json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to close survey' });
  }
});

// GET /api/surveys/:id/results - Get survey results
router.get('/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const results = await service.getResults(req.params.id);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get results' });
  }
});

// POST /api/surveys/:id/compute - Compute results
router.post('/:id/compute', async (req: AuthRequest, res: Response) => {
  try {
    const result = await service.computeResults(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to compute results' });
  }
});

// POST /api/surveys/:id/questions - Add question
router.post('/:id/questions', async (req: AuthRequest, res: Response) => {
  try {
    const question = await service.addQuestion(req.params.id, req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add question' });
  }
});

// GET /api/surveys/:id/questions - Get questions
router.get('/:id/questions', async (req: AuthRequest, res: Response) => {
  try {
    const questions = await service.getQuestionsBySurvey(req.params.id);
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get questions' });
  }
});

// POST /api/surveys/respond - Submit response
router.post('/respond', async (req: AuthRequest, res: Response) => {
  try {
    const response = await service.submitResponse({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit response' });
  }
});

// GET /api/surveys - Get all surveys
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const status = req.query.status as string;
    const surveys = await service.getAllSurveys(companyId, status);
    res.json({ success: true, data: surveys });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get surveys' });
  }
});

export default router;