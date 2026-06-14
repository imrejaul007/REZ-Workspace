import { Router, Request, Response, NextFunction } from 'express';
import { driverService, CreateDriverDTO } from '../services/driverService';
import { trackingService } from '../services/trackingService';
import { DriverStatus, UpdateDriverLocationDTO, ApiResponse } from '../types';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const successResponse = <T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> => ({
  success: true,
  data,
  meta
});

const errorResponse = (code: string, message: string, details?): ApiResponse => ({
  success: false,
  error: { code, message, details }
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data: CreateDriverDTO = req.body;

    if (!data.userId || !data.name || !data.email || !data.phone || !data.vehicle) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields')
      );
      return;
    }

    const driver = await driverService.createDriver(data);

    res.status(201).json(successResponse({
      id: driver._id,
      userId: driver.userId,
      name: driver.name,
      status: driver.status,
      vehicle: driver.vehicle
    }));
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as DriverStatus;
    const isAvailable = req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined;
    const vehicleType = req.query.vehicleType as string;

    const { drivers, total } = await driverService.getAllDrivers(page, limit, {
      status,
      isAvailable,
      vehicleType: vehicleType as unknown
    });

    res.json(successResponse(drivers, { page, limit, total }));
  })
);

router.get(
  '/available',
  asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude } = req.query;
    const location = latitude && longitude
      ? { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) }
      : undefined;

    const drivers = await driverService.getAvailableDrivers(location);
    res.json(successResponse(drivers));
  })
);

router.get(
  '/nearby',
  asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing latitude or longitude'));
      return;
    }

    const location = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string)
    };
    const radiusKm = parseFloat(radius as string) || 10;

    const nearbyDrivers = await trackingService.getNearbyDrivers(location, radiusKm);
    res.json(successResponse(nearbyDrivers));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await driverService.getDriverById(req.params.id);

    if (!driver) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Driver not found'));
      return;
    }

    res.json(successResponse(driver));
  })
);

router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await driverService.getDriverByUserId(req.params.userId);

    if (!driver) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Driver not found'));
      return;
    }

    res.json(successResponse(driver));
  })
);

router.patch(
  '/:id/location',
  asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, address } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing latitude or longitude'));
      return;
    }

    const data: UpdateDriverLocationDTO = {
      driverId: req.params.id,
      location: { latitude, longitude, address }
    };

    const driver = await driverService.updateDriverLocation(data);
    await trackingService.updateDriverLiveLocation(driver._id?.toString() || '', data.location);

    res.json(successResponse({
      id: driver._id,
      currentLocation: driver.currentLocation
    }));
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!status) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing status'));
      return;
    }

    const driver = await driverService.updateDriverStatus(req.params.id, status);

    res.json(successResponse({
      id: driver._id,
      status: driver.status
    }));
  })
);

router.patch(
  '/:id/availability',
  asyncHandler(async (req: Request, res: Response) => {
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing isAvailable'));
      return;
    }

    const driver = await driverService.setDriverAvailability(req.params.id, isAvailable);

    res.json(successResponse({
      id: driver._id,
      isAvailable: driver.availability.isAvailable,
      status: driver.status
    }));
  })
);

router.get(
  '/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await driverService.getDriverStats(req.params.id);
    res.json(successResponse(stats));
  })
);

router.get(
  '/:id/live-location',
  asyncHandler(async (req: Request, res: Response) => {
    const location = await trackingService.getDriverLiveLocation(req.params.id);

    if (!location) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Driver location not available'));
      return;
    }

    res.json(successResponse({
      driverId: req.params.id,
      location
    }));
  })
);

router.patch(
  '/:id/rating',
  asyncHandler(async (req: Request, res: Response) => {
    const { rating } = req.body;

    if (rating === undefined || rating < 0 || rating > 5) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Rating must be between 0 and 5')
      );
      return;
    }

    const driver = await driverService.updateDriverRating(req.params.id, rating);

    res.json(successResponse({
      id: driver._id,
      rating: driver.rating
    }));
  })
);

router.get(
  '/:id/active-delivery',
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await driverService.getDriverById(req.params.id);

    if (!driver) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Driver not found'));
      return;
    }

    if (!driver.currentDeliveryId) {
      res.json(successResponse({ activeDelivery: null }));
      return;
    }

    const { deliveryService } = await import('../services/deliveryService');
    const delivery = await deliveryService.getDeliveryById(driver.currentDeliveryId);

    res.json(successResponse({
      driverId: driver._id,
      delivery
    }));
  })
);

export default router;
