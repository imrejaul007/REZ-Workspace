import { Router, Request, Response } from 'express';
import { z } from 'zod';
import audienceService from '../services/audienceService';
import { DmpProvider, ApiResponse, SyncJob } from '../types';
import logger from '../utils/logger';

const router = Router();

// Middleware
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Sync to Liveramp
router.post('/liveramp/:audienceId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const job = await audienceService.syncToLiveramp(req.params.audienceId, tenantId);

    const response: ApiResponse<SyncJob> = {
      success: true,
      data: job,
      message: 'Liveramp sync started'
    };
    res.json(response);
  } catch (error) {
    logger.error('Error syncing to Liveramp:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Sync to Segment
router.post('/segment/:audienceId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const job = await audienceService.syncToSegment(req.params.audienceId, tenantId);

    const response: ApiResponse<SyncJob> = {
      success: true,
      data: job,
      message: 'Segment sync started'
    };
    res.json(response);
  } catch (error) {
    logger.error('Error syncing to Segment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Download from provider
router.get('/download/:audienceId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const provider = req.query.provider as DmpProvider || DmpProvider.LIVERAMP;

    const job = await audienceService.downloadAudience(req.params.audienceId, provider, tenantId);

    const response: ApiResponse<SyncJob> = {
      success: true,
      data: job,
      message: `Download from ${provider} completed`
    };
    res.json(response);
  } catch (error) {
    logger.error('Error downloading audience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get sync job status
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const job = audienceService.getSyncJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Sync job not found' });
    }

    const response: ApiResponse<SyncJob> = {
      success: true,
      data: job
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching sync job:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List sync jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const audienceId = req.query.audienceId as string | undefined;
    const jobs = audienceService.getSyncJobs(audienceId);

    const response: ApiResponse<SyncJob[]> = {
      success: true,
      data: jobs
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching sync jobs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
