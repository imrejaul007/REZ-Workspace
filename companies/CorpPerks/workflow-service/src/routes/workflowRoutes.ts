import { Router } from 'express';
import { workflowController } from '../controllers/workflowController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Workflow template routes
router.post('/', (req, res, next) => workflowController.create(req, res, next));
router.get('/', (req, res, next) => workflowController.list(req, res, next));
router.get('/categories', (req, res, next) => workflowController.getCategories(req, res, next));
router.get('/stats', (req, res, next) => workflowController.getStats(req, res, next));
router.get('/:id', (req, res, next) => workflowController.getById(req, res, next));
router.patch('/:id', (req, res, next) => workflowController.update(req, res, next));
router.delete('/:id', (req, res, next) => workflowController.delete(req, res, next));

// Workflow instance routes
router.post('/:id/initiate', (req, res, next) => workflowController.initiate(req, res, next));

export default router;
