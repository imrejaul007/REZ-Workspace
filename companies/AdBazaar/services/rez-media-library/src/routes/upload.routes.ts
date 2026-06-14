import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { Asset, AssetType } from '../types';

const router = Router();

const assets: Map<string, Asset> = new Map();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf'];
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload single asset
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const id = uuidv4();
    const assetType = getAssetType(req.file.mimetype);

    const asset: Asset = {
      id,
      tenantId: req.headers['x-tenant-id'] as string || 'default',
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      type: assetType,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${id}`,
      status: 'ready',
      visibility: req.body.visibility || 'private',
      folderId: req.body.folderId,
      collectionId: req.body.collectionId,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      metadata: {
        uploadedBy: req.body.userId || 'system',
        colors: []
      },
      variants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate thumbnail for images
    if (assetType === 'image') {
      const metadata = await sharp(req.file.buffer).metadata();
      asset.width = metadata.width;
      asset.height = metadata.height;
      asset.thumbnailUrl = `/thumbnails/${id}`;
    }

    assets.set(id, asset);

    logger.info(`Asset uploaded: ${id}`);
    res.status(201).json({ success: true, data: asset });
  } catch (error: any) {
    logger.error('Error uploading asset:', error);
    res.status(500).json({ success: false, error: 'Failed to upload asset' });
  }
});

// Upload multiple assets
router.post('/multiple', upload.array('files', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const results: Asset[] = [];

    for (const file of files) {
      const id = uuidv4();
      const assetType = getAssetType(file.mimetype);

      const asset: Asset = {
        id,
        tenantId: req.headers['x-tenant-id'] as string || 'default',
        name: req.body.name || file.originalname,
        originalName: file.originalname,
        type: assetType,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${id}`,
        status: 'ready',
        visibility: req.body.visibility || 'private',
        folderId: req.body.folderId,
        collectionId: req.body.collectionId,
        tags: req.body.tags ? req.body.tags.split(',') : [],
        metadata: { uploadedBy: req.body.userId || 'system', colors: [] },
        variants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      assets.set(id, asset);
      results.push(asset);
    }

    res.status(201).json({ success: true, data: results });
  } catch (error: any) {
    logger.error('Error uploading multiple assets:', error);
    res.status(500).json({ success: false, error: 'Failed to upload assets' });
  }
});

// Import from URL
router.post('/url', async (req, res) => {
  try {
    const { url, name, tags } = req.body;

    const asset: Asset = {
      id: uuidv4(),
      tenantId: req.headers['x-tenant-id'] as string || 'default',
      name: name || 'Imported Asset',
      originalName: name || 'Imported Asset',
      type: 'image',
      mimeType: 'image/jpeg',
      size: 0,
      url,
      status: 'ready',
      visibility: 'private',
      tags: tags || [],
      metadata: { uploadedBy: req.body.userId || 'system', source: url },
      variants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    assets.set(asset.id, asset);
    res.status(201).json({ success: true, data: asset });
  } catch (error: any) {
    logger.error('Error importing from URL:', error);
    res.status(500).json({ success: false, error: 'Failed to import asset' });
  }
});

function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/gif')) return 'gif';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

export { router as uploadRoutes };
