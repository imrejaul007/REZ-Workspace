/**
 * REZ Forms - Submission Routes
 * Handle form submissions
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  submitForm,
  getSubmission,
  getFormSubmissions,
  getUserSubmission,
  exportSubmissionsToCSV,
  getSubmissionAnalytics,
} from '../services/submissionService';
import { getForm } from '../services/formService';

export const submissionRoutes = Router();

// Validation schemas
const submitFormSchema = z.object({
  answers: z.array(z.object({
    fieldId: z.string(),
    value: z.any(),
  })),
});

/**
 * Submit a form
 * POST /api/submissions/:formId
 */
submissionRoutes.post('/:formId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || undefined;
    const data = submitFormSchema.parse(req.body);

    const submission = await submitForm(req.params.formId, {
      userId,
      answers: data.answers,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceInfo: {
        browser: req.headers['sec-ch-ua'],
        os: req.headers['sec-ch-ua-platform'],
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else if (error instanceof Error && error.message === 'Form not found') {
      res.status(404).json({ error: 'Form not found' });
    } else if (error instanceof Error && error.message === 'Form is not accepting submissions') {
      res.status(403).json({ error: 'Form is not accepting submissions' });
    } else if (error instanceof Error && error.message.includes('already submitted')) {
      res.status(409).json({ error: 'You have already submitted this form' });
    } else {
      console.error('Submit form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Get submission by ID
 * GET /api/submissions/:submissionId
 */
submissionRoutes.get('/:submissionId', async (req, res) => {
  try {
    const submission = await getSubmission(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all submissions for a form
 * GET /api/submissions/form/:formId
 */
submissionRoutes.get('/form/:formId', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = await getFormSubmissions(req.params.formId, { page, pageSize });

    res.json({
      submissions: result.submissions,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's submission for a form
 * GET /api/submissions/form/:formId/me
 */
submissionRoutes.get('/form/:formId/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const submission = await getUserSubmission(req.params.formId, userId);

    if (!submission) {
      return res.status(404).json({ error: 'No submission found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get user submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Export submissions to CSV
 * GET /api/submissions/form/:formId/export
 */
submissionRoutes.get('/form/:formId/export', async (req, res) => {
  try {
    const form = await getForm(req.params.formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const csv = await exportSubmissionsToCSV(req.params.formId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.slug}-submissions.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get submission analytics for a form
 * GET /api/submissions/form/:formId/analytics
 */
submissionRoutes.get('/form/:formId/analytics', async (req, res) => {
  try {
    const analytics = await getSubmissionAnalytics(req.params.formId);

    res.json(analytics);
  } catch (error) {
    console.error('Get submission analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Batch submit (for QR/offline forms)
 * POST /api/submissions/batch
 */
submissionRoutes.post('/batch', async (req, res) => {
  try {
    const { submissions } = z.object({
      submissions: z.array(z.object({
        formId: z.string(),
        answers: z.array(z.object({
          fieldId: z.string(),
          value: z.any(),
        })),
      })),
    }).parse(req.body);

    const results = [];
    for (const sub of submissions) {
      try {
        const submission = await submitForm(sub.formId, {
          answers: sub.answers,
        });
        results.push({ success: true, submission });
      } catch (error) {
        results.push({
          success: false,
          formId: sub.formId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.status(201).json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Batch submit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});