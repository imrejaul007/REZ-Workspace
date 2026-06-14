import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Collection } from '../types';

const router = Router();

const collections: Map<string, Collection> = new Map();

// List collections
router.get('/', async (req, res) => {
  try {
    const { visibility } = req.query;
    let results = Array.from(collections.values());
    if (visibility) results = results.filter(c => c.visibility === visibility);
    res.json({ success: true, data: results });
  } catch (error: any) {
    logger.error('Error listing collections:', error);
    res.status(500).json({ success: false, error: 'Failed to list collections' });
  }
});

// Get collection
router.get('/:id', async (req, res) => {
  try {
    const collection = collections.get(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    res.json({ success: true, data: collection });
  } catch (error: any) {
    logger.error('Error getting collection:', error);
    res.status(500).json({ success: false, error: 'Failed to get collection' });
  }
});

// Create collection
router.post('/', async (req, res) => {
  try {
    const collection: Collection = {
      id: uuidv4(),
      tenantId: req.headers['x-tenant-id'] as string || 'default',
      name: req.body.name,
      description: req.body.description,
      visibility: req.body.visibility || 'private',
      assetCount: 0,
      createdBy: req.body.userId || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    collections.set(collection.id, collection);
    res.status(201).json({ success: true, data: collection });
  } catch (error: any) {
    logger.error('Error creating collection:', error);
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
});

// Update collection
router.put('/:id', async (req, res) => {
  try {
    const collection = collections.get(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    const updated: Collection = { ...collection, ...req.body, id: collection.id, updatedAt: new Date() };
    collections.set(collection.id, updated);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating collection:', error);
    res.status(500).json({ success: false, error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', async (req, res) => {
  try {
    if (!collections.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    collections.delete(req.params.id);
    res.json({ success: true, message: 'Collection deleted' });
  } catch (error: any) {
    logger.error('Error deleting collection:', error);
    res.status(500).json({ success: false, error: 'Failed to delete collection' });
  }
});

export { router as collectionRoutes };
