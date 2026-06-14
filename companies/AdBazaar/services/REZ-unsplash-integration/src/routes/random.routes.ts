import { Router, Request, Response } from 'express';
import { unsplashService } from '../services/unsplash.service';
import { downloadService } from '../services/download.service';
import { ApiResponse, UnsplashPhoto, RandomPhotoOptionsSchema } from '../types';

const router = Router();

// Get random photos
router.post('/random', async (req: Request, res: Response) => {
  try {
    const options = RandomPhotoOptionsSchema.parse(req.body);
    const photos = await unsplashService.getRandomPhotos({
      query: options.query,
      count: options.count,
      orientation: options.orientation,
    });

    // Record attributions for all photos
    for (const photo of photos) {
      await downloadService.recordAttribution(photo);
    }

    const response: ApiResponse<UnsplashPhoto[]> = {
      success: true,
      data: photos,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get random photos',
    };
    res.status(400).json(response);
  }
});

// Get single random photo
router.get('/random', async (req: Request, res: Response) => {
  try {
    const options = RandomPhotoOptionsSchema.parse({
      query: req.query.query,
      orientation: req.query.orientation,
      count: 1,
    });

    const photos = await unsplashService.getRandomPhotos({
      query: options.query,
      count: 1,
      orientation: options.orientation,
    });

    if (photos.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No photos found',
      };
      return res.status(404).json(response);
    }

    // Record attribution
    await downloadService.recordAttribution(photos[0]);

    const response: ApiResponse<UnsplashPhoto> = {
      success: true,
      data: photos[0],
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get random photo',
    };
    res.status(400).json(response);
  }
});

export default router;
