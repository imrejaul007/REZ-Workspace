/**
 * Delivery Tracking Routes
 *
 * REST API endpoints for delivery tracking operations.
 * All routes are prefixed with /:orderId/delivery
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getDeliveryTrackingService } from '../services/deliveryTrackingService';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { DELIVERY_STATUS_VALUES } from '../models/DeliveryTracking';

const router = Router();

// Apply merchant authentication to all routes
router.use(merchantAuth as unknown);

/**
 * POST /:orderId/delivery
 * Create a new delivery tracking record for an order
 */
router.post('/:orderId/delivery', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { driverId, driverName, driverPhone, estimatedTime, location } = req.body;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    const service = getDeliveryTrackingService();
    const delivery = await service.createDelivery(orderId, {
      driverId,
      driverName,
      driverPhone,
      estimatedTime: estimatedTime ? new Date(estimatedTime) : undefined,
      location,
    });

    res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return errorResponse(res, errors.conflict({ message: error.message }));
    }
    next(error);
  }
});

/**
 * GET /:orderId/delivery
 * Get delivery status for an order
 */
router.get('/:orderId/delivery', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    const service = getDeliveryTrackingService();
    const delivery = await service.getDelivery(orderId);

    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found for this order' }));
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:orderId/delivery/assign
 * Assign a driver to a delivery
 */
router.post('/:orderId/delivery/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { driverId, driverName, driverPhone } = req.body;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    // Validate driverId
    if (!driverId) {
      return errorResponse(res, errors.badRequest({ message: 'Driver ID is required' }));
    }

    const service = getDeliveryTrackingService();

    // First get the delivery by orderId
    const delivery = await service.getDelivery(orderId);
    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found. Create delivery first.' }));
    }

    const updatedDelivery = await service.assignDriver(
      delivery._id.toString(),
      driverId,
      driverName,
      driverPhone,
    );

    res.json({
      success: true,
      data: updatedDelivery,
      message: 'Driver assigned successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, errors.notFound({ message: error.message }));
      }
      if (error.message.includes('Cannot assign')) {
        return errorResponse(res, errors.badRequest({ message: error.message }));
      }
    }
    next(error);
  }
});

/**
 * POST /:orderId/delivery/status
 * Update delivery status
 */
router.post('/:orderId/delivery/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { status, location } = req.body;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    // Validate status
    if (!status) {
      return errorResponse(res, errors.badRequest({ message: 'Status is required' }));
    }

    if (!DELIVERY_STATUS_VALUES.includes(status)) {
      return errorResponse(res, errors.badRequest({
        message: `Invalid status. Valid values: ${DELIVERY_STATUS_VALUES.join(', ')}`,
      }));
    }

    const service = getDeliveryTrackingService();

    // First get the delivery by orderId
    const delivery = await service.getDelivery(orderId);
    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found. Create delivery first.' }));
    }

    const updatedDelivery = await service.updateStatus(delivery._id.toString(), status, location);

    res.json({
      success: true,
      data: updatedDelivery,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, errors.notFound({ message: error.message }));
      }
      if (error.message.includes('Invalid status')) {
        return errorResponse(res, errors.badRequest({ message: error.message }));
      }
    }
    next(error);
  }
});

/**
 * POST /:orderId/delivery/location
 * Update driver/delivery location
 */
router.post('/:orderId/delivery/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return errorResponse(res, errors.badRequest({ message: 'Valid lat and lng coordinates are required' }));
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return errorResponse(res, errors.badRequest({ message: 'Coordinates out of valid range' }));
    }

    const service = getDeliveryTrackingService();

    // First get the delivery by orderId
    const delivery = await service.getDelivery(orderId);
    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found. Create delivery first.' }));
    }

    const updatedDelivery = await service.updateLocation(delivery._id.toString(), lat, lng);

    res.json({
      success: true,
      data: updatedDelivery,
      message: 'Location updated',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return errorResponse(res, errors.notFound({ message: error.message }));
    }
    next(error);
  }
});

/**
 * POST /:orderId/delivery/complete
 * Complete a delivery
 */
router.post('/:orderId/delivery/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { proof } = req.body;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    const service = getDeliveryTrackingService();

    // First get the delivery by orderId
    const delivery = await service.getDelivery(orderId);
    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found. Create delivery first.' }));
    }

    const updatedDelivery = await service.completeDelivery(delivery._id.toString(), proof);

    res.json({
      success: true,
      data: updatedDelivery,
      message: 'Delivery completed',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, errors.notFound({ message: error.message }));
      }
      if (error.message.includes('Cannot complete')) {
        return errorResponse(res, errors.badRequest({ message: error.message }));
      }
    }
    next(error);
  }
});

/**
 * POST /:orderId/delivery/cancel
 * Cancel a delivery
 */
router.post('/:orderId/delivery/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return errorResponse(res, errors.badRequest({ message: 'Invalid order ID format' }));
    }

    const service = getDeliveryTrackingService();

    // First get the delivery by orderId
    const delivery = await service.getDelivery(orderId);
    if (!delivery) {
      return errorResponse(res, errors.notFound({ message: 'Delivery not found. Create delivery first.' }));
    }

    const updatedDelivery = await service.cancelDelivery(delivery._id.toString());

    res.json({
      success: true,
      data: updatedDelivery,
      message: 'Delivery cancelled',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(res, errors.notFound({ message: error.message }));
      }
      if (error.message.includes('Cannot cancel')) {
        return errorResponse(res, errors.badRequest({ message: error.message }));
      }
    }
    next(error);
  }
});

/**
 * GET /driver/:driverId/deliveries
 * Get all deliveries for a driver
 */
router.get('/driver/:driverId/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return errorResponse(res, errors.badRequest({ message: 'Driver ID is required' }));
    }

    const service = getDeliveryTrackingService();
    const deliveries = await service.getDriverDeliveries(driverId);

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
