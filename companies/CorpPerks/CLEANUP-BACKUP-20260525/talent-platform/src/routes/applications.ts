/**
 * Application Routes
 * API endpoints for job applications
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Application, JobPosting } from '../models/talent';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const applySchema = z.object({
  jobId: z.string(),
  candidateId: z.string(),
  resume: z.object({
    fileUrl: z.string(),
    parsed: z.boolean().default(false),
  }).optional(),
  coverLetter: z.string().optional(),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/applications
 * Apply for a job
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = applySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { jobId, candidateId, resume, coverLetter } = validation.data;

    // Check if already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    // Get job to get employer
    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate skill match score from Career Graph
    let skillMatchScore = 0;
    try {
      const { getCareerGraph } = await import('../services/integration.js');
      const careerData = await getCareerGraph(candidateId);

      if (careerData?.careerProfile.skills?.length && job.skills.length) {
        const candidateSkills = careerData.careerProfile.skills.map((s: any) => s.name.toLowerCase());
        const jobSkills = job.skills.map((s: string) => s.toLowerCase());

        const matchCount = candidateSkills.filter((cs: string) =>
          jobSkills.some((js: string) => js.includes(cs) || cs.includes(js))
        ).length;

        skillMatchScore = Math.round((matchCount / jobSkills.length) * 100);
      }
    } catch (err) {
      logger.error('Error calculating skill match:', err);
    }

    // Create application
    const application = new Application({
      jobId,
      candidateId,
      employerId: job.employer.id,
      status: 'applied',
      stage: 0,
      resume,
      coverLetter,
      skillMatchScore,
      overallScore: skillMatchScore,
      appliedAt: new Date(),
      statusHistory: [{
        status: 'applied',
        changedAt: new Date(),
        changedBy: candidateId,
      }],
    });

    await application.save();

    // Increment application count on job
    await JobPosting.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });

    return res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    logger.error('Error applying:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/applications
 * List applications (candidate or employer view)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { candidateId, employerId, jobId, status, limit = 20, skip = 0 } = req.query;

    if (!candidateId && !employerId) {
      return res.status(400).json({ error: 'candidateId or employerId required' });
    }

    const query: any = {};
    if (candidateId) query.candidateId = candidateId;
    if (employerId) query.employerId = employerId;
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;

    const applications = await Application.find(query)
      .sort({ appliedAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .lean();

    const total = await Application.countDocuments(query);

    return res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        },
      },
    });
  } catch (error) {
    logger.error('Error listing applications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/applications/:id
 * Get application details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).lean();

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get job details
    const job = await JobPosting.findById(application.jobId).lean();

    return res.json({
      success: true,
      data: {
        ...application,
        job,
      },
    });
  } catch (error) {
    logger.error('Error getting application:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Update application status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, changedBy, notes } = req.body;

    const validStatuses = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const previousStatus = application.status;

    // Update status
    application.status = status;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: changedBy || 'system',
      notes,
    });

    // Update stage based on status
    const stageMap: Record<string, number> = {
      applied: 0,
      screening: 1,
      interview: 2,
      offer: 3,
      hired: 4,
      rejected: 4,
      withdrawn: 4,
    };
    application.stage = stageMap[status] || 0;

    await application.save();

    return res.json({
      success: true,
      data: application,
      message: `Status updated from ${previousStatus} to ${status}`,
    });
  } catch (error) {
    logger.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/applications/:id/notes
 * Add notes to application
 */
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, type } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (type === 'employer') {
      application.employerNotes = notes;
    } else {
      application.candidateNotes = notes;
    }

    await application.save();

    return res.json({
      success: true,
      message: 'Notes added successfully',
    });
  } catch (error) {
    logger.error('Error adding notes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
