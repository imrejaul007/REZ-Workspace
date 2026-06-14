import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { cartService } from '../services/cartService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const addItemSchema = z.object({
  barcode: z.string().min(1),
  quantity: z.number().int().positive().optional().default(1),
  weight: z.number().positive().optional(),
});

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const removeItemSchema = z.object({
  itemId: z.string().min(1),
});

/**
 * POST /api/cart/:sessionId/items
 * Add item to cart
 */
router.post('/:sessionId/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = addItemSchema.parse(req.body);
    const session = await cartService.addItem({
      sessionId,
      userId,
      barcode: validated.barcode,
      quantity: validated.quantity,
      weight: validated.weight,
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Add item error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add item' });
  }
});

/**
 * POST /api/cart/:sessionId/scan
 * Add item by barcode scan
 */
router.post('/:sessionId/scan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;
    const { barcode, quantity = 1, weight } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' });
    }

    const result = await cartService.addItemByScan({
      sessionId,
      userId,
      barcode,
      quantity,
      weight,
    });

    res.status(201).json({
      success: true,
      item: result.item,
      isNew: result.isNew,
      session: result.session,
    });
  } catch (error) {
    console.error('Scan item error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to scan item' });
  }
});

/**
 * PATCH /api/cart/:sessionId/items
 * Update item quantity
 */
router.patch('/:sessionId/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = updateItemSchema.parse(req.body);
    const session = await cartService.updateItemQuantity({
      sessionId,
      userId,
      itemId: validated.itemId,
      quantity: validated.quantity,
    });

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Update item error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update item' });
  }
});

/**
 * DELETE /api/cart/:sessionId/items/:itemId
 * Remove item from cart
 */
router.delete('/:sessionId/items/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId, itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await cartService.removeItem({
      sessionId,
      userId,
      itemId,
    });

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove item' });
  }
});

/**
 * DELETE /api/cart/:sessionId
 * Clear cart
 */
router.delete('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const session = await cartService.clearCart(sessionId, userId);

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to clear cart' });
  }
});

/**
 * GET /api/cart/:sessionId/summary
 * Get cart summary
 */
router.get('/:sessionId/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const summary = await cartService.getCartSummary(sessionId, userId);

    if (!summary) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({ error: 'Failed to get cart summary' });
  }
});

export default router;
