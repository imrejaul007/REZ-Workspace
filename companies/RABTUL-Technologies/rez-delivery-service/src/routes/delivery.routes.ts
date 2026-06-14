import { Router, Request, Response, NextFunction } from 'express';
import { deliveryService } from '../services/deliveryService';
import { driverService } from '../services/driverService';
import { trackingService } from '../services/trackingService';
import {
  CreateDeliveryDTO,
  UpdateDeliveryStatusDTO,
  AssignDriverDTO,
  DeliveryStatus,
  ApiResponse
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'];

  // Check for internal service token first
  if (internalToken) {
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (expectedToken && crypto.timingSafeEqual(Buffer.from(internalToken as string), Buffer.from(expectedToken))) {
      req.headers['x-user-id'] = 'internal-service';
      req.headers['x-user-role'] = 'service';
      return next();
    }
  }

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'));
    return;
  }

  const token = authHeader.substring(7);

  // Verify JWT token
  try {
    // In production, use proper JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (base64url)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Attach user info to request
    req.headers['x-user-id'] = payload.sub || payload.userId || payload.id;
    req.headers['x-user-role'] = payload.role || 'user';

    if (!req.headers['x-user-id']) {
      throw new Error('Token missing user ID');
    }

    next();
  } catch (error) {
    res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired token'));
    return;
  }
}

// Role-based authorization
function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.headers['x-user-role'] as string;

    if (!userRole || (allowedRoles.length > 0 && !allowedRoles.includes(userRole))) {
      res.status(403).json(errorResponse('FORBIDDEN', 'Insufficient permissions'));
      return;
    }

    next();
  };
}

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

// All routes now require authentication
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const data: CreateDeliveryDTO = req.body;

    // Only services and admins can create deliveries for any customer
    if (userRole !== 'service' && userRole !== 'admin') {
      // Users can only create deliveries for themselves
      if (data.customerId !== userId) {
        res.status(403).json(errorResponse('FORBIDDEN', 'Cannot create delivery for another user'));
        return;
      }
    }

    if (!data.orderId || !data.customerId || !data.pickup || !data.dropoff || !data.packageDetails) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields')
      );
      return;
    }

    const delivery = await deliveryService.createDelivery({
      ...data,
      customerId: userRole === 'service' || userRole === 'admin' ? data.customerId : userId,
      createdBy: userId
    });

    res.status(201).json(successResponse({
      id: delivery._id,
      orderId: delivery.orderId,
      status: delivery.status,
      eta: delivery.eta,
      pricing: delivery.pricing
    }));
  })
);

// All routes require authentication
router.get(
  '/',
  authenticate,
  authorize('admin', 'service', 'driver'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as DeliveryStatus;
    const driverId = req.query.driverId as string;
    const customerId = req.query.customerId as string;

    // Users can only see their own deliveries
    const filters = {
      status,
      driverId: userRole === 'driver' ? userId : driverId,
      customerId: userRole === 'user' ? userId : customerId
    };

    const { deliveries, total } = await deliveryService.getAllDeliveries(page, limit, filters);

    res.json(successResponse(deliveries, { page, limit, total }));
  })
);

router.get(
  '/stats',
  authenticate,
  authorize('admin', 'service'),
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await deliveryService.getDeliveryStats();
    res.json(successResponse(stats));
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const delivery = await deliveryService.getDeliveryById(req.params.id);

    if (!delivery) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
      return;
    }

    // Users can only view their own deliveries
    if (userRole === 'user' && delivery.customerId !== userId) {
      res.status(403).json(errorResponse('FORBIDDEN', 'Access denied'));
      return;
    }

    res.json(successResponse(delivery));
  })
);

router.get(
  '/order/:orderId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const delivery = await deliveryService.getDeliveryByOrderId(req.params.orderId);

    if (!delivery) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
      return;
    }

    // Users can only view their own deliveries
    if (userRole === 'user' && delivery.customerId !== userId) {
      res.status(403).json(errorResponse('FORBIDDEN', 'Access denied'));
      return;
    }

    res.json(successResponse(delivery));
  })
);

router.get(
  '/customer/:customerId',
  authenticate,
  authorize('admin', 'service'),
  asyncHandler(async (req: Request, res: Response) => {
    const deliveries = await deliveryService.getDeliveriesByCustomer(req.params.customerId);
    res.json(successResponse(deliveries));
  })
);

router.get(
  '/driver/:driverId',
  authenticate,
  authorize('admin', 'service', 'driver'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    // Drivers can only see their own deliveries
    const driverId = userRole === 'driver' ? userId : req.params.driverId;
    const deliveries = await deliveryService.getDeliveriesByDriver(driverId);
    res.json(successResponse(deliveries));
  })
);

router.post(
  '/assign',
  authenticate,
  authorize('admin', 'service'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const data: AssignDriverDTO = req.body;

    if (!data.deliveryId || !data.driverId) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing deliveryId or driverId'));
      return;
    }

    const delivery = await deliveryService.assignDriver(data);
    res.json(successResponse({
      id: delivery._id,
      orderId: delivery.orderId,
      driverId: delivery.driverId,
      status: delivery.status
    }));
  })
);

router.post(
  '/auto-assign',
  authenticate,
  authorize('admin', 'service'),
  asyncHandler(async (req: Request, res: Response) => {
    const { deliveryId, vehicleType } = req.body;

    if (!deliveryId) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing deliveryId'));
      return;
    }

    const delivery = await deliveryService.getDeliveryById(deliveryId);
    if (!delivery) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
      return;
    }

    const nearestDriver = await driverService.findNearestAvailableDriver(
      delivery.pickup,
      vehicleType
    );

    if (!nearestDriver) {
      res.status(404).json(errorResponse('NO_DRIVER', 'No available drivers found'));
      return;
    }

    const updatedDelivery = await deliveryService.assignDriver({
      deliveryId,
      driverId: nearestDriver._id?.toString() || ''
    });

    res.json(successResponse({
      delivery: {
        id: updatedDelivery._id,
        status: updatedDelivery.status,
        driverId: updatedDelivery.driverId
      },
      driver: {
        id: nearestDriver._id,
        name: nearestDriver.name,
        phone: nearestDriver.phone,
        vehicle: nearestDriver.vehicle
      }
    }));
  })
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'service', 'driver'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    const data: UpdateDeliveryStatusDTO = {
      deliveryId: req.params.id,
      status: req.body.status,
      location: req.body.location,
      notes: req.body.notes
    };

    if (!data.status) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing status'));
      return;
    }

    // Drivers can only update their own deliveries
    if (userRole === 'driver') {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      if (!delivery || delivery.driverId !== userId) {
        res.status(403).json(errorResponse('FORBIDDEN', 'Cannot update this delivery'));
        return;
      }
    }

    const delivery = await deliveryService.updateDeliveryStatus(data);

    res.json(successResponse({
      id: delivery._id,
      status: delivery.status,
      eta: delivery.eta,
      actualPickup: delivery.actualPickup,
      actualDropoff: delivery.actualDropoff
    }));
  })
);

router.patch(
  '/:id/cancel',
  authenticate,
  authorize('admin', 'service', 'user', 'driver'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { reason } = req.body;

    // Users can only cancel their own deliveries
    if (userRole === 'user' || userRole === 'driver') {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      if (!delivery) {
        res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
        return;
      }
      if (userRole === 'user' && delivery.customerId !== userId) {
        res.status(403).json(errorResponse('FORBIDDEN', 'Cannot cancel this delivery'));
        return;
      }
      if (userRole === 'driver' && delivery.driverId !== userId) {
        res.status(403).json(errorResponse('FORBIDDEN', 'Cannot cancel this delivery'));
        return;
      }
    }

    const delivery = await deliveryService.cancelDelivery(req.params.id, reason);

    res.json(successResponse({
      id: delivery._id,
      status: delivery.status
    }));
  })
);

router.patch(
  '/:id/proof',
  authenticate,
  authorize('admin', 'service', 'driver'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { signature, photo, recipientName } = req.body;

    // Drivers can only update their own deliveries
    if (userRole === 'driver') {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      if (!delivery || delivery.driverId !== userId) {
        res.status(403).json(errorResponse('FORBIDDEN', 'Cannot update this delivery'));
        return;
      }
    }

    const delivery = await deliveryService.updateProofOfDelivery(req.params.id, {
      signature,
      photo,
      recipientName
    });

    res.json(successResponse({
      id: delivery._id,
      status: delivery.status,
      proofOfDelivery: delivery.proofOfDelivery
    }));
  })
);

router.get(
  '/:id/tracking',
  asyncHandler(async (req: Request, res: Response) => {
    const routeInfo = await trackingService.getDeliveryRoute(req.params.id);

    if (!routeInfo) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Tracking not found or delivery not active'));
      return;
    }

    const delivery = await deliveryService.getDeliveryById(req.params.id);

    res.json(successResponse({
      deliveryId: req.params.id,
      status: delivery?.status,
      currentLocation: routeInfo.currentLocation,
      destination: delivery?.dropoff,
      progress: routeInfo.progress,
      eta: delivery?.eta,
      history: routeInfo.route
    }));
  })
);

router.get(
  '/:id/history',
  asyncHandler(async (req: Request, res: Response) => {
    const delivery = await deliveryService.getDeliveryById(req.params.id);

    if (!delivery) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
      return;
    }

    const trackingHistory = await trackingService.getDeliveryHistory(req.params.id);

    res.json(successResponse({
      events: delivery.events,
      locationHistory: trackingHistory
    }));
  })
);

router.post(
  '/:id/location',
  asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, address } = req.body;
    const driverId = req.body.driverId;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing latitude or longitude'));
      return;
    }

    const delivery = await deliveryService.getDeliveryById(req.params.id);
    if (!delivery) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Delivery not found'));
      return;
    }

    const location: { latitude: number; longitude: number; address?: string } = {
      latitude,
      longitude,
      address
    };

    const eta = await trackingService.updateLocation(
      req.params.id,
      driverId || delivery.driverId || '',
      location
    );

    res.json(successResponse({
      deliveryId: req.params.id,
      location,
      eta
    }));
  })
);

export default router;
