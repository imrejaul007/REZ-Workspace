import { Router, Request, Response } from 'express';
import { collectionService } from '../services/collection.service';
import { ApiResponse, PhotoCollection } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create collection
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const collection = await collectionService.create(tenantId, req.body);
    const response: ApiResponse<PhotoCollection> = {
      success: true,
      data: collection,
      message: 'Collection created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collection',
    };
    res.status(400).json(response);
  }
});

// Get all collections
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const publicOnly = req.query.public === 'true';

    const collections = publicOnly
      ? await collectionService.findPublic()
      : await collectionService.findAll(tenantId);

    const response: ApiResponse<PhotoCollection[]> = {
      success: true,
      data: collections,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch collections',
    };
    res.status(500).json(response);
  }
});

// Get collection by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const collection = await collectionService.findById(tenantId, req.params.id);
    if (!collection) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<PhotoCollection> = {
      success: true,
      data: collection,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch collection',
    };
    res.status(500).json(response);
  }
});

// Update collection
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const collection = await collectionService.update(tenantId, req.params.id, req.body);
    if (!collection) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<PhotoCollection> = {
      success: true,
      data: collection,
      message: 'Collection updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update collection',
    };
    res.status(400).json(response);
  }
});

// Delete collection
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await collectionService.delete(tenantId, req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Collection deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete collection',
    };
    res.status(500).json(response);
  }
});

// Add photo to collection
router.post('/:id/photos', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { photoId } = req.body;

    if (!photoId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'photoId is required',
      };
      return res.status(400).json(response);
    }

    const collection = await collectionService.addPhoto(tenantId, req.params.id, photoId);
    if (!collection) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<PhotoCollection> = {
      success: true,
      data: collection,
      message: 'Photo added to collection',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add photo',
    };
    res.status(400).json(response);
  }
});

// Remove photo from collection
router.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const collection = await collectionService.removePhoto(tenantId, req.params.id, req.params.photoId);
    if (!collection) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<PhotoCollection> = {
      success: true,
      data: collection,
      message: 'Photo removed from collection',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove photo',
    };
    res.status(400).json(response);
  }
});

// Get collection photos
router.get('/:id/photos', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const collection = await collectionService.findById(tenantId, req.params.id);
    if (!collection) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Collection not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<string[]> = {
      success: true,
      data: collection.photoIds,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch photos',
    };
    res.status(500).json(response);
  }
});

export default router;
