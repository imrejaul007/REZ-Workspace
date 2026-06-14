import { Router, Request, Response, NextFunction } from 'express';
import { folderService } from '../services/folderService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().optional(),
  createdBy: z.string().min(1),
  permissions: z.object({
    public: z.boolean().default(false),
    allowedUsers: z.array(z.string()).optional(),
    allowedRoles: z.array(z.string()).optional()
  }).optional()
});

// Create folder
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    createFolderSchema.parse(req.body);
    const folder = await folderService.create(req.body);
    logger.info('Folder created via API', { folderId: folder.folderId });
    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
});

// Get all folders (optionally by parent)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folders = await folderService.findAll(req.query.parentId as string);
    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    next(error);
  }
});

// Get folder by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folder = await folderService.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    next(error);
  }
});

// Get folder contents
router.get('/:id/contents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contents = await folderService.getFolderContents(req.params.id);
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    next(error);
  }
});

// Get folder breadcrumb
router.get('/:id/breadcrumb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const breadcrumb = await folderService.getBreadcrumb(req.params.id);
    res.json({
      success: true,
      data: breadcrumb
    });
  } catch (error) {
    next(error);
  }
});

// Update folder
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folder = await folderService.update(req.params.id, req.body);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    logger.info('Folder updated via API', { folderId: req.params.id });
    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    next(error);
  }
});

// Delete folder
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await folderService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    logger.info('Folder deleted via API', { folderId: req.params.id });
    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error: any) {
    if (error.message.includes('not empty')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

export const folderRoutes = router;