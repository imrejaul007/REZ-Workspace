import { Router, Request, Response } from 'express';
import { CityService } from '../services/city.service';

const router = Router();
const cityService = new CityService(null as any, null as any);

/**
 * @route GET /api/cities
 * @desc Get all active cities
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const cities = await cityService.getActiveCities();
    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/cities/:slug
 * @desc Get city by slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const city = await cityService.getCityBySlug(req.params.slug);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    res.json({ success: true, city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/cities/:id/stats
 * @desc Get city statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cityService.getCityStats(req.params.id);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/cities/:id/drivers
 * @desc Get drivers in city
 */
router.get('/:id/drivers', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    let drivers;

    if (lat && lng) {
      drivers = await cityService.findNearbyDriversInCity(
        req.params.id,
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string) || 5
      );
    } else {
      drivers = await cityService.getDriversInCity(req.params.id);
    }

    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/cities/locate
 * @desc Find city for location
 */
router.get('/locate/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const city = await cityService.findCityForLocation(
      parseFloat(req.params.lat),
      parseFloat(req.params.lng)
    );

    if (!city) {
      return res.status(404).json({ error: 'No service in this area' });
    }

    res.json({ success: true, city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/cities/:id/zones
 * @desc Get zones at location
 */
router.get('/:id/zones', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const zone = await cityService.getZoneAtLocation(
      req.params.id,
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
