import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { estimateFare, getFareRange, getAllVehicleTypes, calculateSurgeMultiplier, FARE_CONFIG } from '../config/fare.config';
import { MapsService } from '../services/maps.service';

const router = Router();
const mapsService = new MapsService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

/**
 * @route GET /api/fares/estimate
 * @desc Get fare estimate for a route
 */
router.get('/estimate', async (req: Request, res: Response) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, vehicleType } = req.query;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !vehicleType) {
      return res.status(400).json({
        error: 'Missing required parameters: pickupLat, pickupLng, dropLat, dropLng, vehicleType'
      });
    }

    const pickup = {
      lat: parseFloat(pickupLat as string),
      lng: parseFloat(pickupLng as string)
    };
    const drop = {
      lat: parseFloat(dropLat as string),
      lng: parseFloat(dropLng as string)
    };

    // Get route
    const route = await mapsService.getRoute(pickup, drop);

    if (!route) {
      return res.status(400).json({ error: 'Could not calculate route' });
    }

    // Estimate fare
    const estimate = estimateFare(
      vehicleType as any,
      route.distanceKm,
      route.durationMinutes
    );

    res.json({
      success: true,
      estimate: {
        vehicleType,
        base: estimate.base,
        distanceCharge: estimate.distanceCharge,
        timeCharge: estimate.timeCharge,
        nightCharges: estimate.nightCharges,
        surge: estimate.surge,
        surgeMultiplier: estimate.surgeMultiplier,
        subtotal: estimate.subtotal,
        total: estimate.total,
        cashback: estimate.cashback,
      },
      route: {
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
      },
    });
  } catch (error) {
    logger.error('Fare estimate error:', error);
    res.status(500).json({ error: 'Failed to calculate fare estimate' });
  }
});

/**
 * @route GET /api/fares/compare
 * @desc Compare fares across all vehicle types
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng } = req.query;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res.status(400).json({
        error: 'Missing required parameters: pickupLat, pickupLng, dropLat, dropLng'
      });
    }

    const pickup = {
      lat: parseFloat(pickupLat as string),
      lng: parseFloat(pickupLng as string)
    };
    const drop = {
      lat: parseFloat(dropLat as string),
      lng: parseFloat(dropLng as string)
    };

    // Get route
    const route = await mapsService.getRoute(pickup, drop);

    if (!route) {
      return res.status(400).json({ error: 'Could not calculate route' });
    }

    // Get estimates for all vehicle types
    const vehicleTypes = getAllVehicleTypes();
    const estimates = vehicleTypes.map(({ type, info }) => {
      const estimate = estimateFare(type, route.distanceKm, route.durationMinutes);
      return {
        type,
        name: info.name,
        icon: info.icon,
        base: estimate.base,
        total: estimate.total,
        cashback: estimate.cashback,
        eta: route.durationMinutes,
        capacity: type === 'suv' ? 6 : type === 'auto' ? 3 : 4,
      };
    });

    // Sort by price
    estimates.sort((a, b) => a.total - b.total);

    res.json({
      success: true,
      route: {
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
      },
      estimates,
    });
  } catch (error) {
    logger.error('Fare compare error:', error);
    res.status(500).json({ error: 'Failed to compare fares' });
  }
});

/**
 * @route GET /api/fares/surge
 * @desc Get current surge multiplier for a location
 */
router.get('/surge', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters: lat, lng'
      });
    }

    // In production, calculate based on demand/supply ratio
    // For now, return mock surge based on time of day
    const hour = new Date().getHours();
    let surgeMultiplier = 1.0;

    // Peak hours
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      surgeMultiplier = 1.25;
    } else if (hour >= 21 || hour <= 1) {
      surgeMultiplier = 1.5;
    }

    const surge = calculateSurgeMultiplier(surgeMultiplier);

    res.json({
      success: true,
      surge: {
        multiplier: surge,
        level: surge >= 2 ? 'high' : surge >= 1.25 ? 'medium' : 'normal',
        available: surge <= FARE_CONFIG.SURGE.maxMultiplier,
      },
    });
  } catch (error) {
    logger.error('Surge check error:', error);
    res.status(500).json({ error: 'Failed to check surge' });
  }
});

/**
 * @route GET /api/fares/config
 * @desc Get fare configuration
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      vehicles: Object.entries(FARE_CONFIG.VEHICLE_TYPES).map(([type, info]) => ({
        type,
        name: info.name,
        icon: info.icon,
        baseFare: info.baseFare,
        perKm: info.perKm,
        perMinute: info.perMinute,
        minFare: info.minFare,
      })),
      nightCharges: {
        enabled: FARE_CONFIG.NIGHT_CHARGES.enabled,
        multiplier: FARE_CONFIG.NIGHT_CHARGES.multiplier,
        startHour: FARE_CONFIG.NIGHT_CHARGES.startHour,
        endHour: FARE_CONFIG.NIGHT_CHARGES.endHour,
      },
      cashback: {
        percentage: FARE_CONFIG.CASHBACK.percentage,
      },
      surge: {
        minMultiplier: FARE_CONFIG.SURGE.minMultiplier,
        maxMultiplier: FARE_CONFIG.SURGE.maxMultiplier,
      },
    },
  });
});

export default router;
