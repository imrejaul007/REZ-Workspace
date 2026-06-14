import { Router } from 'express';
import { workflowController } from '../controllers/workflowController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Instance routes
router.get('/', (req, res, next) => workflowController.listInstances(req, res, next));
router.get('/stats', (req, res, next) => workflowController.getStats(req, res, next));
router.get('/:id', (req, res, next) => workflowController.getInstance(req, res, next));
router.post('/:id/approve', (req, res, next) => workflowController.approve(req, res, next));
router.post('/:id/reject', (req, res, next) => workflowController.reject(req, res, next));
router.post('/:id/cancel', (req, res, next) => workflowController.cancel(req, res, next));

export default router;
