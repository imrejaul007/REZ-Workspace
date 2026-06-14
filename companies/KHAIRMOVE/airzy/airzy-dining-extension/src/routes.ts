/**
 * Dining Extension Routes
 * API endpoints for airport dining
 */

import { Router, Request, Response } from 'express';
import { getRestaurants, getRestaurant, searchRestaurants } from './restaurantData';
import { getRecommendations, createOrder, getDeliveryZones, trackOrder } from './diningService';

const router = Router();

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'airzy-dining-extension',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get all restaurants for an airport
 */
router.get('/airports/:airportCode/restaurants', (req: Request, res: Response) => {
  const { airportCode } = req.params;
  const restaurants = getRestaurants(airportCode.toUpperCase());
  res.json({ restaurants });
});

/**
 * Get restaurant by ID
 */
router.get('/airports/:airportCode/restaurants/:restaurantId', (req: Request, res: Response) => {
  const { airportCode, restaurantId } = req.params;
  const restaurant = getRestaurant(airportCode.toUpperCase(), restaurantId);

  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  res.json({ restaurant });
});

/**
 * Search restaurants
 */
router.get('/search', (req: Request, res: Response) => {
  const { airportCode, cuisine, priceRange, dietary, delivery, openNow } = req.query;

  if (!airportCode) {
    return res.status(400).json({ error: 'airportCode is required' });
  }

  const results = searchRestaurants(airportCode as string, {
    cuisine: cuisine as string,
    priceRange: priceRange as any,
    dietary: dietary ? (dietary as string).split(',') : undefined,
    delivery: delivery === 'true' ? true : delivery === 'false' ? false : undefined,
    openNow: openNow === 'true',
  });

  res.json({ restaurants: results });
});

/**
 * Get recommendations based on gate
 */
router.get('/recommendations/:airportCode/:gateId', (req: Request, res: Response) => {
  const { airportCode, gateId } = req.params;
  const { dietary, cuisines } = req.query;

  const recommendations = getRecommendations(
    airportCode.toUpperCase(),
    gateId.toUpperCase(),
    {
      dietary: dietary ? (dietary as string).split(',') : undefined,
      favoriteCuisines: cuisines ? (cuisines as string).split(',') : undefined,
    }
  );

  res.json({ recommendations });
});

/**
 * Get delivery zones for an airport
 */
router.get('/airports/:airportCode/delivery-zones', (req: Request, res: Response) => {
  const { airportCode } = req.params;
  const zones = getDeliveryZones(airportCode.toUpperCase());
  res.json({ zones });
});

/**
 * Create order
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const order = req.body;
    const result = await createOrder(order);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Track order
 */
router.get('/orders/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const tracking = trackOrder(orderId);
  res.json(tracking);
});

/**
 * Get cuisine types available at airport
 */
router.get('/airports/:airportCode/cuisines', (req: Request, res: Response) => {
  const { airportCode } = req.params;
  const restaurants = getRestaurants(airportCode.toUpperCase());
  const cuisines = [...new Set(restaurants.map(r => r.cuisine))];
  res.json({ cuisines });
});

export default router;
