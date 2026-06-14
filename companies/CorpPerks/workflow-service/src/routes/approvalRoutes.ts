import { Router } from 'express';
import { workflowController } from '../controllers/workflowController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Pending approvals for a user
router.get('/pending/:userId', (req, res, next) => workflowController.getPendingApprovals(req, res, next));

export default router;
