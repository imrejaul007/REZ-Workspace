import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Asset, AssetSearchQuery } from '../types';

const router = Router();

// In-memory store (replace with database)
const assets: Map<string, Asset> = new Map();
const assetIndex: Map<string, Set<string>> = new Map(); // tag -> asset ids

// Search assets
router.get('/', async (req, res) => {
  try {
    const {
      query, type, folderId, collectionId, tags, visibility,
      mimeTypes, dateFrom, dateTo, sortBy = 'createdAt',
      sortOrder = 'desc', page = 1, limit = 20
    } = req.query;

    let results = Array.from(assets.values());

    // Apply filters
    if (query) {
      const q = (query as string).toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (type) results = results.filter(a => a.type === type);
    if (folderId) results = results.filter(a => a.folderId === folderId);
    if (collectionId) results = results.filter(a => a.collectionId === collectionId);
    if (visibility) results = results.filter(a => a.visibility === visibility);
    if (tags) {
      const tagList = (tags as string).split(',');
      results = results.filter(a => tagList.some(t => a.tags.includes(t)));
    }

    // Sort
    results.sort((a, b) => {
      const aVal = a[sortBy as keyof Asset];
      const bVal = b[sortBy as keyof Asset];
      if (aVal! < bVal!) return sortOrder === 'asc' ? -1 : 1;
      if (aVal! > bVal!) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const start = (Number(page) - 1) * Number(limit);
    const paginated = results.slice(start, start + Number(limit));

    res.json({
      success: true,
      data: {
        assets: paginated,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: results.length,
          pages: Math.ceil(results.length / Number(limit))
        }
      }
    });
  } catch (error: any) {
    logger.error('Error searching assets:', error);
    res.status(500).json({ success: false, error: 'Failed to search assets' });
  }
});

// Get single asset
router.get('/:id', async (req, res) => {
  try {
    const asset = assets.get(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (error: any) {
    logger.error('Error getting asset:', error);
    res.status(500).json({ success: false, error: 'Failed to get asset' });
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const asset = assets.get(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    const updated: Asset = {
      ...asset,
      ...req.body,
      id: asset.id,
      updatedAt: new Date()
    };
    assets.set(asset.id, updated);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating asset:', error);
    res.status(500).json({ success: false, error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const asset = assets.get(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    assets.delete(req.params.id);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error: any) {
    logger.error('Error deleting asset:', error);
    res.status(500).json({ success: false, error: 'Failed to delete asset' });
  }
});

// Batch delete
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = ids.filter((id: string) => assets.delete(id));
    res.json({ success: true, deleted: deleted.length });
  } catch (error: any) {
    logger.error('Error batch deleting:', error);
    res.status(500).json({ success: false, error: 'Failed to delete assets' });
  }
});

// Move assets
router.post('/move', async (req, res) => {
  try {
    const { ids, folderId } = req.body;
    let moved = 0;
    ids.forEach((id: string) => {
      const asset = assets.get(id);
      if (asset) {
        asset.folderId = folderId;
        asset.updatedAt = new Date();
        moved++;
      }
    });
    res.json({ success: true, moved });
  } catch (error: any) {
    logger.error('Error moving assets:', error);
    res.status(500).json({ success: false, error: 'Failed to move assets' });
  }
});

export { router as assetRoutes };
