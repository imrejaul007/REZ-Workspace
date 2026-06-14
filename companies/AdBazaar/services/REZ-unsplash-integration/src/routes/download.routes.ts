import { Router, Request, Response } from 'express';
import { downloadService } from '../services/download.service';
import { ApiResponse, DownloadRecord, AttributionRecord } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Get download stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = await downloadService.getStats(tenantId);
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
    res.status(500).json(response);
  }
});

// Get all downloads for tenant
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const downloads = await downloadService.getDownloadsByTenant(tenantId);
    const response: ApiResponse<DownloadRecord[]> = {
      success: true,
      data: downloads,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch downloads',
    };
    res.status(500).json(response);
  }
});

// Get downloads by photo
router.get('/photo/:photoId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const downloads = await downloadService.getDownloadsByPhoto(tenantId, req.params.photoId);
    const response: ApiResponse<DownloadRecord[]> = {
      success: true,
      data: downloads,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch downloads',
    };
    res.status(500).json(response);
  }
});

// Get attributions for a photo
router.get('/attributions/:photoId', async (req: Request, res: Response) => {
  try {
    const attributions = await downloadService.getAttributions(req.params.photoId);
    const response: ApiResponse<AttributionRecord[]> = {
      success: true,
      data: attributions,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attributions',
    };
    res.status(500).json(response);
  }
});

// Get all attributions
router.get('/attributions', async (req: Request, res: Response) => {
  try {
    const attributions = await downloadService.getAllAttributions();
    const response: ApiResponse<AttributionRecord[]> = {
      success: true,
      data: attributions,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attributions',
    };
    res.status(500).json(response);
  }
});

export default router;
