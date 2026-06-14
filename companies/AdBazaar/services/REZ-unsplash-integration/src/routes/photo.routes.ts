import { Router, Request, Response } from 'express';
import { unsplashService } from '../services/unsplash.service';
import { downloadService } from '../services/download.service';
import { ApiResponse, SearchOptions, UnsplashPhoto, SearchOptionsSchema } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Search photos
router.post('/search', async (req: Request, res: Response) => {
  try {
    const options = SearchOptionsSchema.parse(req.body);
    const result = await unsplashService.searchPhotos(options);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search photos',
    };
    res.status(400).json(response);
  }
});

// Get photo by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const photo = await unsplashService.getPhoto(req.params.id);

    // Record attribution
    await downloadService.recordAttribution(photo);

    const response: ApiResponse<UnsplashPhoto> = {
      success: true,
      data: photo,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get photo',
    };
    res.status(404).json(response);
  }
});

// Download photo
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { url, location } = await unsplashService.downloadPhoto(req.params.id);

    // Record the download
    const download = await downloadService.recordDownload(
      tenantId,
      req.params.id,
      url,
      req.ip
    );

    // Track download with Unsplash
    await unsplashService.trackDownload(req.params.id, location);

    const response: ApiResponse<{ download: typeof download; url: string }> = {
      success: true,
      data: { download, url },
      message: 'Photo download tracked',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download photo',
    };
    res.status(400).json(response);
  }
});

// Get photo stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await unsplashService.getPhotoStats(req.params.id);
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get photo stats',
    };
    res.status(400).json(response);
  }
});

// Get attribution for photo
router.get('/:id/attribution', async (req: Request, res: Response) => {
  try {
    const photo = await unsplashService.getPhoto(req.params.id);
    const attribution = unsplashService.getAttribution(photo);

    const response: ApiResponse<typeof attribution> = {
      success: true,
      data: attribution,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attribution',
    };
    res.status(400).json(response);
  }
});

// Get attribution text formats
router.get('/:id/attribution/text', async (req: Request, res: Response) => {
  try {
    const photo = await unsplashService.getPhoto(req.params.id);

    const response: ApiResponse<{
      plain: string;
      html: string;
    }> = {
      success: true,
      data: {
        plain: downloadService.generateAttributionText(photo),
        html: downloadService.generateAttributionHtml(photo),
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate attribution',
    };
    res.status(400).json(response);
  }
});

export default router;
