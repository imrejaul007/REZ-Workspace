import { Router, Request, Response, NextFunction } from 'express';
import { dataIngestionService } from '../services';
import { UploadDataRequestSchema, ApiResponse } from '../types';
import { validateRequest, asyncHandler } from '../middleware';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/data/upload
 * Upload brand data for clean room processing
 */
router.post(
  '/upload',
  validateRequest(UploadDataRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Data upload request received', {
      brandId: req.body.brandId,
      dataFormat: req.body.dataFormat,
    });

    const upload = await dataIngestionService.uploadData(req.body);

    const response: ApiResponse = {
      success: true,
      data: {
        uploadId: upload.uploadId,
        recordCount: upload.recordCount,
        processedCount: upload.processedCount,
        hashedCount: upload.hashedCount,
        status: upload.status,
        segments: upload.segments,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/data/uploads
 * Get all uploads for a brand
 */
router.get(
  '/uploads',
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      res.status(400).json({
        success: false,
        error: 'Brand ID is required in x-brand-id header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const uploads = await dataIngestionService.getUploadsByBrand(brandId, limit);

    const response: ApiResponse = {
      success: true,
      data: uploads.map(u => ({
        uploadId: u.uploadId,
        recordCount: u.recordCount,
        status: u.status,
        segments: u.segments,
        createdAt: u.createdAt,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/data/upload/:uploadId
 * Get specific upload details
 */
router.get(
  '/upload/:uploadId',
  asyncHandler(async (req: Request, res: Response) => {
    const { uploadId } = req.params;

    const upload = await dataIngestionService.getUpload(uploadId);

    if (!upload) {
      res.status(404).json({
        success: false,
        error: 'Upload not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        uploadId: upload.uploadId,
        brandId: upload.brandId,
        recordCount: upload.recordCount,
        processedCount: upload.processedCount,
        status: upload.status,
        segments: upload.segments,
        metadata: upload.metadata,
        createdAt: upload.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * DELETE /api/data/upload/:uploadId
 * Delete an upload
 */
router.delete(
  '/upload/:uploadId',
  asyncHandler(async (req: Request, res: Response) => {
    const { uploadId } = req.params;

    const deleted = await dataIngestionService.deleteUpload(uploadId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Upload not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      message: 'Upload deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/data/stats
 * Get upload statistics for a brand
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      res.status(400).json({
        success: false,
        error: 'Brand ID is required in x-brand-id header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const stats = await dataIngestionService.getUploadStats(brandId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;