import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { GeoSearchService } from '../services/geo-search.service';

const router = Router();
const geoSearch = new GeoSearchService();

/**
 * @route GET /api/geo/search
 * @desc Search for places
 * @query q - Search query
 * @query lat - Latitude (optional)
 * @query lng - Longitude (optional)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, lat, lng } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const location = lat && lng ? { lat: parseFloat(lat as string), lng: parseFloat(lng as string) } : undefined;

    const results = await geoSearch.searchPlaces(q, location);

    res.json({ success: true, results });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * @route GET /api/geo/reverse
 * @desc Reverse geocode coordinates to address
 * @query lat - Latitude
 * @query lng - Longitude
 */
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const address = await geoSearch.reverseGeocode(parseFloat(lat as string), parseFloat(lng as string));

    res.json({ success: true, address });
  } catch (error) {
    logger.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Reverse geocode failed' });
  }
});

/**
 * @route GET /api/geo/distance
 * @desc Calculate distance between two points
 * @query fromLat, fromLng, toLat, toLng
 */
router.get('/distance', async (req: Request, res: Response) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'All coordinates are required' });
    }

    const distance = geoSearch.calculateDistance(
      parseFloat(fromLat as string),
      parseFloat(fromLng as string),
      parseFloat(toLat as string),
      parseFloat(toLng as string)
    );

    res.json({ success: true, distance: Math.round(distance * 100) / 100 });
  } catch (error) {
    logger.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Distance calculation failed' });
  }
});

/**
 * @route GET /api/geo/place/:placeId
 * @desc Get place details
 */
router.get('/place/:placeId', async (req: Request, res: Response) => {
  try {
    const details = await geoSearch.getPlaceDetails(req.params.placeId);

    if (!details) {
      return res.status(404).json({ error: 'Place not found' });
    }

    res.json({ success: true, details });
  } catch (error) {
    logger.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

export default router;
