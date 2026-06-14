/**
 * REZ Save - Save/Wishlist Routes
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const saveRouter = Router();

// In-memory store (use MongoDB in production)
const wishlists = new Map();
const collections = new Map();

/**
 * POST /api/save
 * Add item to wishlist
 */
saveRouter.post('/', async (req, res) => {
  try {
    const { userId, type, itemRef, itemName, itemImage, price, originalPrice, tags } = req.body;

    const item = {
      item_id: uuidv4(),
      user_id: userId,
      type,
      item_ref: itemRef,
      item_name: itemName,
      item_image: itemImage,
      price: price || 0,
      original_price: originalPrice || price || 0,
      saved_at: new Date(),
      notified: false,
      purchase_intent_score: 0.5,
      tags: tags || [],
    };

    wishlists.set(item.item_id, item);

    res.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save item' });
  }
});

/**
 * GET /api/save/:userId
 * Get user's wishlist
 */
saveRouter.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, sort } = req.query;

    let items = Array.from(wishlists.values()).filter((i) => i.user_id === userId);

    if (type) {
      items = items.filter((i) => i.type === type);
    }

    if (sort === 'price_asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === 'newest') {
      items.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    }

    res.json({
      success: true,
      data: { items, total: items.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get wishlist' });
  }
});

/**
 * DELETE /api/save/:itemId
 * Remove item from wishlist
 */
saveRouter.delete('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    wishlists.delete(itemId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

/**
 * GET /api/save/:userId/price-alerts
 * Get items with price alerts
 */
saveRouter.get('/:userId/price-alerts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetPrice } = req.query;

    const items = Array.from(wishlists.values()).filter((i) => {
      if (i.user_id !== userId) return false;
      if (i.price >= (targetPrice || i.price)) return false;
      return i.original_price > i.price;
    });

    res.json({
      success: true,
      data: { items, count: items.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get price alerts' });
  }
});

/**
 * POST /api/save/collections
 * Create collection
 */
saveRouter.post('/collections', async (req, res) => {
  try {
    const { userId, name, description } = req.body;

    const collection = {
      collection_id: uuidv4(),
      user_id: userId,
      name,
      description,
      items: [],
      created_at: new Date(),
    };

    collections.set(collection.collection_id, collection);

    res.json({
      success: true,
      data: { collection },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
});

/**
 * GET /api/save/collections/:userId
 * Get user's collections
 */
saveRouter.get('/collections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userCollections = Array.from(collections.values()).filter((c) => c.user_id === userId);
    res.json({ success: true, data: { collections: userCollections } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get collections' });
  }
});

/**
 * POST /api/save/collections/:id/items
 * Add item to collection
 */
saveRouter.post('/collections/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    const collection = collections.get(id);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    if (!collection.items.includes(itemId)) {
      collection.items.push(itemId);
    }

    res.json({ success: true, data: { collection } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add item to collection' });
  }
});
