import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const router = Router();

// Logger for this module
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Cart item schema
const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
  mrp: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  image: z.string().url().optional(),
  unit: z.string().optional(),
  notes: z.string().max(200).optional()
});

// Add item schema
const AddItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive().default(1).optional(),
  unitPrice: z.number().positive(),
  mrp: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  image: z.string().url().optional(),
  unit: z.string().optional(),
  notes: z.string().max(200).optional()
});

// Update item schema
const UpdateItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  notes: z.string().max(200).optional()
});

// Apply promo code schema
const ApplyPromoSchema = z.object({
  code: z.string().min(1)
});

// Types
export type CartItem = z.infer<typeof CartItemSchema>;
export type AddItemInput = z.infer<typeof AddItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

// Cart interface
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// In-memory cart storage (replace with Redis/database in production)
const carts: Map<string, Cart> = new Map();

// Helper: Calculate item total
function calculateItemTotal(item: CartItem): number {
  const discountAmount = item.discount ? (item.unitPrice * item.discount / 100) : 0;
  return Math.round((item.unitPrice - discountAmount) * item.quantity * 100) / 100;
}

// Helper: Calculate cart totals
function calculateCartTotals(items: CartItem[], promoCode?: string): { subtotal: number; discount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  // Apply promo code discounts
  let discount = 0;
  if (promoCode === 'FIRST50' && subtotal > 0) {
    discount = Math.min(Math.round(subtotal * 0.5 * 100) / 100, 50);
  } else if (promoCode === 'SAVE10') {
    discount = Math.round(subtotal * 0.1 * 100) / 100;
  } else if (promoCode === 'FREESHIP') {
    // Free shipping discount (handled at order level)
    discount = 0;
  }

  const total = Math.round((subtotal - discount) * 100) / 100;

  return { subtotal, discount, total };
}

// Helper: Get or create cart for user
function getOrCreateCart(userId: string): Cart {
  // Find existing cart for user
  for (const cart of carts.values()) {
    if (cart.userId === userId) {
      // Check if cart has expired (7 days)
      const expiryDate = new Date(cart.expiresAt);
      if (new Date() < expiryDate) {
        return cart;
      }
      // Remove expired cart
      carts.delete(cart.id);
    }
  }

  // Create new cart
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const newCart: Cart = {
    id: uuidv4(),
    userId,
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  carts.set(newCart.id, newCart);
  return newCart;
}

// Auth middleware (extract user from request)
const authMiddleware = (req: Request, res: Response, next: Function): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  // Extract userId from JWT (placeholder - integrate with RABTUL Auth)
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT_SECRET environment variable required' });
      return;
    }
    const jwt = require('jsonwebtoken');
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtSecret);
    (req as any).userId = decoded.userId || decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * GET /cart
 * Get user's cart
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // User ID should come from auth middleware
    const userId = (req as any).userId || req.query.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const cart = getOrCreateCart(userId);

    res.json({
      cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /cart/items
 * Add item to cart
 */
router.post('/items', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.body.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const validatedData = AddItemSchema.parse(req.body);
    const cart = getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === validatedData.productId);

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += validatedData.quantity || 1;
      cart.items[existingItemIndex].notes = validatedData.notes || cart.items[existingItemIndex].notes;

      // Recalculate item total
      cart.items[existingItemIndex] = {
        ...cart.items[existingItemIndex],
        totalPrice: calculateItemTotal(cart.items[existingItemIndex])
      } as any;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: validatedData.productId,
        name: validatedData.name,
        sku: validatedData.sku,
        quantity: validatedData.quantity || 1,
        unitPrice: validatedData.unitPrice,
        mrp: validatedData.mrp,
        discount: validatedData.discount,
        image: validatedData.image,
        unit: validatedData.unit,
        notes: validatedData.notes
      } as CartItem;

      // Add calculated total
      (newItem as any).totalPrice = calculateItemTotal(newItem);

      cart.items.push(newItem);
    }

    // Recalculate cart totals
    const totals = calculateCartTotals(cart.items, cart.promoCode);
    cart.subtotal = totals.subtotal;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Item added to cart: ${cart.id}, product: ${validatedData.productId}`);

    res.status(201).json({
      cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /cart/items/:id
 * Update cart item quantity or notes
 */
router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.body.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const { id } = req.params;
    const validatedData = UpdateItemSchema.parse(req.body);

    const cart = getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId === id || (item as any).id === id);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    // Update item
    if (validatedData.quantity !== undefined) {
      cart.items[itemIndex].quantity = validatedData.quantity;

      // If quantity is 0, remove item
      if (validatedData.quantity === 0) {
        cart.items.splice(itemIndex, 1);
        const totals = calculateCartTotals(cart.items, cart.promoCode);
        cart.subtotal = totals.subtotal;
        cart.discount = totals.discount;
        cart.total = totals.total;
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.updatedAt = new Date().toISOString();
        carts.set(cart.id, cart);

        res.json({
          cart,
          message: 'Item removed from cart'
        });
        return;
      }
    }

    if (validatedData.notes !== undefined) {
      cart.items[itemIndex].notes = validatedData.notes;
    }

    // Recalculate item total
    (cart.items[itemIndex] as any).totalPrice = calculateItemTotal(cart.items[itemIndex]);

    // Recalculate cart totals
    const totals = calculateCartTotals(cart.items, cart.promoCode);
    cart.subtotal = totals.subtotal;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Cart item updated: ${cart.id}, item: ${id}`);

    res.json({
      cart,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /cart/items/:id
 * Remove item from cart
 */
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.query.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const { id } = req.params;
    const cart = getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex(item => item.productId === id || (item as any).id === id);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate cart totals
    const totals = calculateCartTotals(cart.items, cart.promoCode);
    cart.subtotal = totals.subtotal;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Item removed from cart: ${cart.id}, item: ${id}`);

    res.json({
      cart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    logger.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /cart
 * Clear entire cart
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.query.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const cart = getOrCreateCart(userId);

    // Clear items
    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.total = 0;
    cart.itemCount = 0;
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Cart cleared: ${cart.id}`);

    res.json({
      cart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /cart/promo
 * Apply promo code to cart
 */
router.post('/promo', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.body.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const { code } = ApplyPromoSchema.parse(req.body);
    const cart = getOrCreateCart(userId);

    // Validate promo code (placeholder - integrate with promo service)
    const validPromoCodes = ['FIRST50', 'SAVE10', 'FREESHIP', 'NEWUSER20'];
    if (!validPromoCodes.includes(code.toUpperCase())) {
      res.status(400).json({ error: 'Invalid promo code' });
      return;
    }

    // Apply promo code
    cart.promoCode = code.toUpperCase();
    const totals = calculateCartTotals(cart.items, cart.promoCode);
    cart.subtotal = totals.subtotal;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Promo code applied: ${cart.id}, code: ${code}`);

    res.json({
      cart,
      message: 'Promo code applied successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error applying promo code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /cart/promo
 * Remove promo code from cart
 */
router.delete('/promo', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.query.userId;

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const cart = getOrCreateCart(userId);

    if (!cart.promoCode) {
      res.status(400).json({ error: 'No promo code applied' });
      return;
    }

    // Remove promo code
    cart.promoCode = undefined;
    const totals = calculateCartTotals(cart.items);
    cart.subtotal = totals.subtotal;
    cart.discount = totals.discount;
    cart.total = totals.total;
    cart.updatedAt = new Date().toISOString();

    // Save cart
    carts.set(cart.id, cart);

    logger.info(`Promo code removed: ${cart.id}`);

    res.json({
      cart,
      message: 'Promo code removed successfully'
    });
  } catch (error) {
    logger.error('Error removing promo code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
