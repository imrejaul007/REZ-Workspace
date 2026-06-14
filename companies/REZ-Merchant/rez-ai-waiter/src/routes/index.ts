import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/OrderService';
import { whatsAppService } from '../services/WhatsAppService';
import { Restaurant, MenuItem, Order, Customer } from '../models/Restaurant';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  customerPhone: z.string().min(10),
  customerName: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().min(1).default(1),
    notes: z.string().optional(),
    customizations: z.array(z.string()).optional(),
  })).min(1),
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']).default('dine-in'),
  tableNumber: z.string().optional(),
  deliveryAddress: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().min(1),
    landmark: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  source: z.enum(['whatsapp', 'app', 'pos', 'call']).default('app'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
});

// ==================== RESTAURANT ROUTES ====================

// Get all restaurants
router.get('/restaurants', async (_req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true })
      .select('name phone address cuisine openHours deliveryAvailable takeawayAvailable rating')
      .sort({ totalOrders: -1 });

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    logger.error('Failed to get restaurants', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch restaurants' },
    });
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' },
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch restaurant' },
    });
  }
});

// Create restaurant
router.post('/restaurants', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    logger.error('Failed to create restaurant', { error });
    res.status(400).json({
      success: false,
      error: { message: (error as Error).message },
    });
  }
});

// ==================== MENU ROUTES ====================

// Get restaurant menu
router.get('/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const { category, available, search, dietary, isVeg } = req.query;

    const query: Record<string, any> = { restaurantId: req.params.id };

    if (available !== undefined) {
      query.available = available === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }

    if (dietary) {
      query.dietary = { $in: (dietary as string).split(',') };
    }

    let menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

    if (search) {
      const searchLower = (search as string).toLowerCase();
      menuItems = menuItems.filter(
        item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: menuItems,
      count: menuItems.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch menu' },
    });
  }
});

// Get menu categories
router.get('/restaurants/:id/menu/categories', async (req: Request, res: Response) => {
  try {
    const categories = await MenuItem.distinct('category', {
      restaurantId: req.params.id,
      available: true,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch categories' },
    });
  }
});

// Add menu item
router.post('/restaurants/:id/menu', async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.create({
      ...req.body,
      restaurantId: req.params.id,
    });

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: (error as Error).message },
    });
  }
});

// Update menu item
router.put('/menu/:itemId', async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: { message: 'Menu item not found' },
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: (error as Error).message },
    });
  }
});

// ==================== ORDER ROUTES ====================

// Create order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);

    const result = await orderService.createOrder(validatedData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error },
      });
    }

    res.status(201).json({
      success: true,
      data: result.order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation error', details: error.errors },
      });
    }

    logger.error('Failed to create order', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create order' },
    });
  }
});

// Get order by ID
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const result = await orderService.getOrder(req.params.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.error },
      });
    }

    res.json({
      success: true,
      data: result.order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order' },
    });
  }
});

// Get orders by phone
router.get('/orders/phone/:phone', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const result = await orderService.getOrdersByPhone(
      req.params.phone,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: result.orders,
      count: result.orders?.length || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch orders' },
    });
  }
});

// Get restaurant orders
router.get('/restaurants/:id/orders', async (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;
    const result = await orderService.getRestaurantOrders(
      req.params.id,
      status as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: result.orders,
      count: result.orders?.length || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch orders' },
    });
  }
});

// Update order status
router.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);
    const result = await orderService.updateOrderStatus(req.params.id, validatedData.status);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error },
      });
    }

    res.json({
      success: true,
      data: result.order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation error', details: error.errors },
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to update order status' },
    });
  }
});

// Cancel order
router.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const result = await orderService.cancelOrder(req.params.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error },
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel order' },
    });
  }
});

// ==================== WHATSAPP WEBHOOK ====================

// WhatsApp webhook endpoint
router.post('/webhook/whatsapp', async (req: Request, res: Response) => {
  try {
    const { from, message, timestamp } = req.body;

    if (!from || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: from, message' },
      });
    }

    logger.info('WhatsApp webhook received', { from, message });

    const response = await whatsAppService.processMessage(from, message);

    res.json({
      success: true,
      response: response.message,
    });
  } catch (error) {
    logger.error('WhatsApp webhook error', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process message' },
    });
  }
});

// ==================== RECOMMENDATIONS ====================

// Get personalized recommendations
router.get('/recommendations/:phone', async (req: Request, res: Response) => {
  try {
    const recommendations = await orderService.getRecommendations(req.params.phone);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch recommendations' },
    });
  }
});

// ==================== STATISTICS ====================

// Get order statistics
router.get('/stats/:restaurantId', async (req: Request, res: Response) => {
  try {
    const result = await orderService.getOrderStats(req.params.restaurantId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error },
      });
    }

    res.json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch statistics' },
    });
  }
});

// ==================== CUSTOMER ROUTES ====================

// Get customer by phone
router.get('/customers/:phone', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found' },
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch customer' },
    });
  }
});

// Update customer
router.put('/customers/:phone', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { phone: req.params.phone },
      req.body,
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Customer not found' },
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: (error as Error).message },
    });
  }
});

export default router;
