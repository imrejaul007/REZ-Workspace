/**
 * Employer Routes
 * API endpoints for employer dashboard
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { JobPosting, Application, EmployerProfile } from '../models/talent';

const router = Router();

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/employer/dashboard
 * Get employer dashboard stats
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { employerId } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: 'employerId required' });
    }

    // Get job stats
    const jobs = await JobPosting.find({ 'employer.id': employerId });
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalJobs = jobs.length;

    // Get application stats
    const applications = await Application.find({ employerId });
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'applied' || a.status === 'screening').length;
    const interviewsScheduled = applications.filter(a => a.status === 'interview').length;
    const hired = applications.filter(a => a.status === 'hired').length;

    return res.json({
      success: true,
      data: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          interviews: interviewsScheduled,
          hired,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/employer/pipeline/:jobId
 * Get hiring pipeline for a job
 */
router.get('/pipeline/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ jobId }).sort({ appliedAt: -1 });

    // Group by status
    const pipeline = {
      applied: applications.filter(a => a.status === 'applied'),
      screening: applications.filter(a => a.status === 'screening'),
      interview: applications.filter(a => a.status === 'interview'),
      offer: applications.filter(a => a.status === 'offer'),
      hired: applications.filter(a => a.status === 'hired'),
      rejected: applications.filter(a => a.status === 'rejected'),
    };

    return res.json({
      success: true,
      data: {
        jobId,
        total: applications.length,
        pipeline,
      },
    });
  } catch (error) {
    logger.error('Error getting pipeline:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/employer/jobs
 * Get all jobs for employer
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { employerId, status } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: 'employerId required' });
    }

    const query: any = { 'employer.id': employerId };
    if (status) query.status = status;

    const jobs = await JobPosting.find(query)
      .sort({ postedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    logger.error('Error getting jobs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/employer/applications
 * Get all applications for employer
 */
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const { employerId, status, jobId } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: 'employerId required' });
    }

    const query: any = { employerId };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await Application.find(query)
      .sort({ appliedAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    logger.error('Error getting applications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/employer/bulk-status
 * Bulk update application status
 */
router.patch('/bulk-status', async (req: Request, res: Response) => {
  try {
    const { applicationIds, status, changedBy } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }

    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: changedBy || 'system',
          },
        },
      }
    );

    return res.json({
      success: true,
      data: {
        modified: result.modifiedCount,
      },
      message: `${result.modifiedCount} applications updated`,
    });
  } catch (error) {
    logger.error('Error bulk updating:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/employer/analytics
 * Get hiring analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { employerId, period = '30d' } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: 'employerId required' });
    }

    // Calculate date range
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get applications in period
    const applications = await Application.find({
      employerId,
      appliedAt: { $gte: startDate },
    });

    // Calculate stats
    const totalApplications = applications.length;
    const byStatus = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate conversion rates
    const totalHired = byStatus['hired'] || 0;
    const totalInterviewed = (byStatus['interview'] || 0) + (byStatus['offer'] || 0) + totalHired;
    const totalReviewed = (byStatus['screening'] || 0) + totalInterviewed;

    const interviewRate = totalReviewed > 0 ? (totalInterviewed / totalReviewed * 100).toFixed(1) : 0;
    const hireRate = totalInterviewed > 0 ? (totalHired / totalInterviewed * 100).toFixed(1) : 0;
    const overallRate = totalApplications > 0 ? (totalHired / totalApplications * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        period,
        totalApplications,
        byStatus,
        rates: {
          interviewRate: parseFloat(interviewRate),
          hireRate: parseFloat(hireRate),
          overallRate: parseFloat(overallRate),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
