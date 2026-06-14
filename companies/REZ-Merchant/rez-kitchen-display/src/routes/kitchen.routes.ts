import { Router, Request, Response } from 'express';
import { KitchenService } from '../services/kitchenService';
import { KitchenOrder, CreateOrderRequest, UpdateStatusRequest, ApiResponse } from '../types';

export function createKitchenRoutes(kitchenService: KitchenService): Router {
  const router = Router();

  /**
   * GET /api/orders
   * Get all active orders (priority queue)
   */
  router.get('/orders', (req: Request, res: Response) => {
    try {
      const { status } = req.query;

      let orders: KitchenOrder[];

      if (status) {
        const statuses = (status as string).split(',') as any[];
        orders = kitchenService.getOrdersByStatus(statuses);
      } else {
        orders = kitchenService.getActiveOrders();
      }

      const response: ApiResponse<KitchenOrder[]> = {
        success: true,
        data: orders,
      };

      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch orders',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/orders/all
   * Get all orders including completed and cancelled
   */
  router.get('/orders/all', (req: Request, res: Response) => {
    try {
      const orders = kitchenService.getAllOrders();
      const response: ApiResponse<KitchenOrder[]> = {
        success: true,
        data: orders,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching all orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch orders',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/orders/stats
   * Get order statistics
   */
  router.get('/orders/stats', (req: Request, res: Response) => {
    try {
      const stats = kitchenService.getStats();
      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching stats:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch statistics',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/orders/next
   * Get next order in priority queue
   */
  router.get('/orders/next', (req: Request, res: Response) => {
    try {
      const order = kitchenService.getNextOrder();
      const response: ApiResponse<KitchenOrder | null> = {
        success: true,
        data: order,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching next order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch next order',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/orders/delayed
   * Get all delayed orders
   */
  router.get('/orders/delayed', (req: Request, res: Response) => {
    try {
      const orders = kitchenService.getDelayedOrders();
      const response: ApiResponse<KitchenOrder[]> = {
        success: true,
        data: orders,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching delayed orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch delayed orders',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/orders/:id
   * Get single order by ID
   */
  router.get('/orders/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = kitchenService.getOrder(id);

      if (!order) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<KitchenOrder> = {
        success: true,
        data: order,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch order',
      };
      res.status(500).json(response);
    }
  });

  /**
   * POST /api/orders
   * Create a new order
   */
  router.post('/orders', (req: Request, res: Response) => {
    try {
      const orderRequest: CreateOrderRequest = req.body;

      // Validate required fields
      if (!orderRequest.orderNumber) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order number is required',
        };
        return res.status(400).json(response);
      }

      if (!orderRequest.items || orderRequest.items.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'At least one item is required',
        };
        return res.status(400).json(response);
      }

      const order = kitchenService.createOrder(orderRequest);

      const response: ApiResponse<KitchenOrder> = {
        success: true,
        data: order,
        message: 'Order created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error creating order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create order',
      };
      res.status(500).json(response);
    }
  });

  /**
   * PATCH /api/orders/:id/status
   * Update order status
   */
  router.patch('/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateStatusRequest;

      if (!status) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Status is required',
        };
        return res.status(400).json(response);
      }

      const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        };
        return res.status(400).json(response);
      }

      const order = kitchenService.updateOrderStatus(id, status);

      if (!order) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<KitchenOrder> = {
        success: true,
        data: order,
        message: `Order status updated to ${status}`,
      };

      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error updating order status:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update order status',
      };
      res.status(500).json(response);
    }
  });

  /**
   * PATCH /api/orders/:orderId/items/:itemId/toggle
   * Toggle item completion status
   */
  router.patch('/orders/:orderId/items/:itemId/toggle', (req: Request, res: Response) => {
    try {
      const { orderId, itemId } = req.params;
      const order = kitchenService.toggleItemCompletion(orderId, itemId);

      if (!order) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order or item not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<KitchenOrder> = {
        success: true,
        data: order,
        message: 'Item completion toggled',
      };

      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error toggling item:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to toggle item completion',
      };
      res.status(500).json(response);
    }
  });

  /**
   * POST /api/orders/clear-completed
   * Clear all completed orders
   */
  router.post('/orders/clear-completed', (req: Request, res: Response) => {
    try {
      const count = kitchenService.clearCompletedOrders();
      const response: ApiResponse<{ clearedCount: number }> = {
        success: true,
        data: { clearedCount: count },
        message: `Cleared ${count} completed orders`,
      };
      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error clearing completed orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to clear completed orders',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/sounds/:type
   * Get sound configuration for a notification type
   */
  router.get('/sounds/:type', (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const validTypes = ['new_order', 'delay_alert', 'order_ready', 'order_complete'];

      if (!validTypes.includes(type)) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Invalid sound type. Must be one of: ${validTypes.join(', ')}`,
        };
        return res.status(400).json(response);
      }

      const soundConfig = kitchenService.getSoundConfig(type as any);

      const response: ApiResponse<typeof soundConfig> = {
        success: true,
        data: soundConfig,
      };

      res.json(response);
    } catch (error) {
      console.error('[KitchenRoutes] Error fetching sound config:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch sound configuration',
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    const stats = kitchenService.getStats();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats,
    });
  });

  return router;
}
