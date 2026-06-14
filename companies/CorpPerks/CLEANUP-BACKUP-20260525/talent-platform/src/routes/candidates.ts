/**
 * Candidate Routes
 * API endpoints for candidate profile and matching
 */

import { Router, Request, Response } from 'express';
import { Application } from '../models/talent.js';

const router = Router();

/**
 * GET /api/candidates/:userId/profile
 * Get candidate profile with applications
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all applications for candidate
    const applications = await Application.find({ candidateId: userId })
      .sort({ appliedAt: -1 })
      .lean();

    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      pending: applications.filter(a => a.status === 'applied' || a.status === 'screening').length,
      interviews: applications.filter(a => a.status === 'interview').length,
      offers: applications.filter(a => a.status === 'offer').length,
      hired: applications.filter(a => a.status === 'hired').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };

    return res.json({
      success: true,
      data: {
        userId,
        stats,
        applications: applications.map(a => ({
          id: a._id,
          jobId: a.jobId,
          status: a.status,
          appliedAt: a.appliedAt,
          overallScore: a.overallScore,
        })),
      },
    });
  } catch (error) {
    logger.error('Error getting candidate profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/candidates/:userId/applications
 * Get all applications for a candidate
 */
router.get('/:userId/applications', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query: any = { candidateId: userId };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .sort({ appliedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        applications,
        total: applications.length,
      },
    });
  } catch (error) {
    logger.error('Error getting applications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/candidates/:userId/match-score
 * Get overall match score for candidate
 */
router.get('/:userId/match-score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const applications = await Application.find({ candidateId: userId })
      .select('overallScore skillMatchScore')
      .lean();

    if (applications.length === 0) {
      return res.json({
        success: true,
        data: {
          userId,
          averageScore: 0,
          totalApplications: 0,
          grade: 'New',
        },
      });
    }

    const totalScore = applications.reduce((sum, a) => sum + (a.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / applications.length);

    let grade = 'New';
    if (applications.length > 10) {
      if (averageScore >= 80) grade = 'Excellent';
      else if (averageScore >= 60) grade = 'Good';
      else if (averageScore >= 40) grade = 'Average';
      else grade = 'Needs Improvement';
    }

    return res.json({
      success: true,
      data: {
        userId,
        averageScore,
        totalApplications: applications.length,
        grade,
      },
    });
  } catch (error) {
    logger.error('Error getting match score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
