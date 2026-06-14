import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Folder } from '../types';

const router = Router();

const folders: Map<string, Folder> = new Map();

// List folders
router.get('/', async (req, res) => {
  try {
    const { parentId } = req.query;
    let results = Array.from(folders.values());
    if (parentId === 'root') results = results.filter(f => !f.parentId);
    else if (parentId) results = results.filter(f => f.parentId === parentId);
    res.json({ success: true, data: results });
  } catch (error: any) {
    logger.error('Error listing folders:', error);
    res.status(500).json({ success: false, error: 'Failed to list folders' });
  }
});

// Create folder
router.post('/', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const path = parentId
      ? `${folders.get(parentId)?.path || ''}/${name}`
      : `/${name}`;

    const folder: Folder = {
      id: uuidv4(),
      tenantId: req.headers['x-tenant-id'] as string || 'default',
      name,
      parentId,
      path,
      assetCount: 0,
      createdBy: req.body.userId || 'system',
      createdAt: new Date()
    };
    folders.set(folder.id, folder);
    res.status(201).json({ success: true, data: folder });
  } catch (error: any) {
    logger.error('Error creating folder:', error);
    res.status(500).json({ success: false, error: 'Failed to create folder' });
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  try {
    folders.delete(req.params.id);
    res.json({ success: true, message: 'Folder deleted' });
  } catch (error: any) {
    logger.error('Error deleting folder:', error);
    res.status(500).json({ success: false, error: 'Failed to delete folder' });
  }
});

export { router as folderRoutes };
