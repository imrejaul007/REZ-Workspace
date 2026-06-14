import { Router } from 'express';
import { objectiveController } from '../controllers/objectiveController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create objective
router.post('/', (req, res, next) => objectiveController.create(req, res, next));

// List objectives with filters
router.get('/', (req, res, next) => objectiveController.list(req, res, next));

// Dashboard
router.get('/dashboard', (req, res, next) => objectiveController.dashboard(req, res, next));

// Company OKRs
router.get('/company', (req, res, next) => objectiveController.companyOKRs(req, res, next));

// Get objectives by owner
router.get('/owner/:ownerId', (req, res, next) => objectiveController.getByOwner(req, res, next));

// Get objectives by department
router.get('/department/:departmentId', (req, res, next) => objectiveController.getByDepartment(req, res, next));

// Get single objective
router.get('/:id', (req, res, next) => objectiveController.getById(req, res, next));

// Update objective
router.patch('/:id', (req, res, next) => objectiveController.update(req, res, next));

// Delete objective
router.delete('/:id', (req, res, next) => objectiveController.delete(req, res, next));

// Update key result progress
router.patch('/:id/progress', (req, res, next) => objectiveController.updateProgress(req, res, next));

// Bulk update progress
router.post('/progress/bulk', (req, res, next) => objectiveController.bulkUpdateProgress(req, res, next));

// Add key result
router.post('/:id/key-results', (req, res, next) => objectiveController.addKeyResult(req, res, next));

// Add milestone
router.post('/:id/milestones', (req, res, next) => objectiveController.addMilestone(req, res, next));

// Toggle milestone
router.patch('/:id/milestones/:milestoneId/toggle', (req, res, next) => objectiveController.toggleMilestone(req, res, next));

export default router;
