/**
 * Job Routes
 * API endpoints for job postings
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { JobPosting, IJobPosting } from '../models/talent';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']),
  location: z.object({
    city: z.string(),
    state: z.string().optional(),
    country: z.string().default('India'),
    remote: z.boolean().default(false),
    hybrid: z.boolean().default(false),
  }),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('INR'),
    period: z.enum(['monthly', 'yearly']).default('yearly'),
    negotiable: z.boolean().default(true),
  }).optional(),
  employer: z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    type: z.enum(['company', 'restaurant', 'startup']).default('company'),
    size: z.string().optional(),
    industry: z.string().optional(),
    verified: z.boolean().default(false),
  }),
  benefits: z.array(z.string()).default([]),
  source: z.enum(['insight_campus', 'hr_app', 'restopapa', 'corpperks']),
  expiresAt: z.string().optional(),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/jobs
 * List jobs with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      type,
      city,
      remote,
      skills,
      employerId,
      status = 'active',
      limit = 20,
      skip = 0,
    } = req.query;

    const query: any = { status };

    if (type) query.type = type;
    if (city) query['location.city'] = city;
    if (remote === 'true') query['location.remote'] = true;
    if (skills) query.skills = { $in: (skills as string).split(',') };
    if (employerId) query['employer.id'] = employerId;

    const jobs = await JobPosting.find(query)
      .sort({ postedAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .lean();

    const total = await JobPosting.countDocuments(query);

    return res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        },
      },
    });
  } catch (error) {
    logger.error('Error listing jobs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/jobs/recommended
 * Get recommended jobs for candidate (with personalization)
 */
router.get('/recommended', async (req: Request, res: Response) => {
  try {
    const { candidateId, limit = 10 } = req.query;

    if (!candidateId) {
      // Return active jobs without personalization
      const jobs = await JobPosting.find({ status: 'active' })
        .sort({ applications: -1, postedAt: -1 })
        .limit(parseInt(limit as string))
        .lean();

      return res.json({ success: true, data: jobs });
    }

    // Import integration services
    const { getCareerGraph } = await import('../services/integration.js');

    // Get candidate's career data for personalization
    const careerData = await getCareerGraph(candidateId as string);

    if (!careerData || !careerData.careerProfile.skills?.length) {
      // Fallback to popular jobs
      const jobs = await JobPosting.find({ status: 'active' })
        .sort({ applications: -1 })
        .limit(parseInt(limit as string))
        .lean();

      return res.json({ success: true, data: jobs, personalized: false });
    }

    // Get candidate's skills
    const candidateSkills = careerData.careerProfile.skills.map((s: any) => s.name.toLowerCase());

    // Find matching jobs
    const jobs = await JobPosting.find({ status: 'active' })
      .lean();

    // Score jobs based on skill match
    const scoredJobs = jobs.map((job) => {
      const jobSkills = job.skills.map((s: string) => s.toLowerCase());
      const matchCount = candidateSkills.filter((cs: string) =>
        jobSkills.some((js: string) => js.includes(cs) || cs.includes(js))
      ).length;
      const matchScore = jobSkills.length > 0
        ? (matchCount / jobSkills.length) * 100
        : 0;

      return { ...job, matchScore: Math.round(matchScore) };
    });

    // Sort by match score and popularity
    scoredJobs.sort((a, b) => {
      const scoreDiff = b.matchScore - a.matchScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.applications - a.applications;
    });

    return res.json({
      success: true,
      data: scoredJobs.slice(0, parseInt(limit as string)),
      personalized: true,
      candidateSkills,
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
    const jobs = await JobPosting.find({ status: 'active' })
      .sort({ applications: -1 })
      .limit(parseInt(limit as string))
      .lean();

    return res.json({ success: true, data: jobs });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/jobs/:id
 * Get job details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await JobPosting.findById(id).lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Increment view count
    await JobPosting.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Error getting job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/jobs
 * Create job posting
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = createJobSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const job = new JobPosting({
      ...validation.data,
      status: 'active',
      postedAt: new Date(),
      expiresAt: validation.data.expiresAt
        ? new Date(validation.data.expiresAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await job.save();

    return res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully',
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/jobs/:id
 * Update job posting
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent status change through this endpoint
    delete updates.status;
    delete updates.applications;
    delete updates.views;

    const job = await JobPosting.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/jobs/:id/status
 * Update job status (pause/close)
 */
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const job = await JobPosting.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({
      success: true,
      data: job,
      message: `Job ${status === 'paused' ? 'paused' : status === 'closed' ? 'closed' : 'activated'} successfully`,
    });
  } catch (error) {
    logger.error('Error updating job status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete job posting
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await JobPosting.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
