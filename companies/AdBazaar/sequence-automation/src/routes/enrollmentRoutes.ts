import { Router, Response } from 'express';
import { enrollmentService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from 'utils/logger.js';

const logger = createChildLogger('EnrollmentRoutes');
const router = Router();

// Get enrollment by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enrollment = await enrollmentService.findById(req.params.id);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json(enrollment);
  } catch (error) {
    logger.error('Error fetching enrollment', { error });
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Pause enrollment
router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enrollment = await enrollmentService.pause(req.params.id);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json(enrollment);
  } catch (error) {
    logger.error('Error pausing enrollment', { error });
    res.status(500).json({ error: 'Failed to pause enrollment' });
  }
});

// Resume enrollment
router.post('/:id/resume', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enrollment = await enrollmentService.resume(req.params.id);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found or not paused' });
      return;
    }

    res.json(enrollment);
  } catch (error) {
    logger.error('Error resuming enrollment', { error });
    res.status(500).json({ error: 'Failed to resume enrollment' });
  }
});

// Drop enrollment
router.post('/:id/drop', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const enrollment = await enrollmentService.drop(req.params.id, reason);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json(enrollment);
  } catch (error) {
    logger.error('Error dropping enrollment', { error });
    res.status(500).json({ error: 'Failed to drop enrollment' });
  }
});

// Get enrollments for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, limit } = req.query;
    const enrollments = await enrollmentService.findByUser(req.userId!, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json(enrollments);
  } catch (error) {
    logger.error('Error fetching enrollments', { error });
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

export default router;