import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import {
  MediaItem,
  UploadResponse,
  MediaListResponse,
  TransformationRequest,
  TransformationResponse,
  IntegrationStatus,
  PaginationParams,
  PaginationInfo,
  ErrorResponse,
  TransformationType,
} from './types';
import { mockMediaItems } from './mockData';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store (initialized with mock data)
let mediaStore: MediaItem[] = [...mockMediaItems];
const startTime = Date.now();

// Service version
const SERVICE_VERSION = '1.0.0';

// Helper functions
function paginate(items: MediaItem[], page: number, limit: number): { items: MediaItem[]; pagination: PaginationInfo } {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

function findMediaById(id: string): MediaItem | undefined {
  return mediaStore.find((item) => item.id === id && item.status !== 'deleted');
}

function generateTransformedUrl(original: MediaItem, transformation: TransformationRequest): string {
  const baseName = original.filename.replace(/\.[^.]+$/, '');
  const ext = original.filename.split('.').pop() || 'jpg';

  switch (transformation.type) {
    case 'resize':
      const width = transformation.params.width || 800;
      const height = transformation.params.height || 600;
      return `https://cdn.adbazaar.com/media/${baseName}-${width}x${height}.${ext}`;
    case 'compress':
      return `https://cdn.adbazaar.com/media/${baseName}-compressed.${ext}`;
    case 'crop':
      return `https://cdn.adbazaar.com/media/${baseName}-cropped.${ext}`;
    case 'rotate':
      return `https://cdn.adbazaar.com/media/${baseName}-rotated.${ext}`;
    case 'flip':
      return `https://cdn.adbazaar.com/media/${baseName}-flipped.${ext}`;
    case 'blur':
      return `https://cdn.adbazaar.com/media/${baseName}-blurred.${ext}`;
    case 'sharpen':
      return `https://cdn.adbazaar.com/media/${baseName}-sharpened.${ext}`;
    case 'grayscale':
      return `https://cdn.adbazaar.com/media/${baseName}-grayscale.${ext}`;
    case 'format_convert':
      const targetFormat = transformation.params.format || 'jpg';
      return `https://cdn.adbazaar.com/media/${baseName}.${targetFormat}`;
    case 'watermark':
      return `https://cdn.adbazaar.com/media/${baseName}-watermarked.${ext}`;
    default:
      return `https://cdn.adbazaar.com/media/${baseName}-transformed.${ext}`;
  }
}

// Error handling middleware
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(`[ERROR] ${err.message}`);
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  };
  res.status(500).json(errorResponse);
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'healthy',
    service: 'rez-media-integration-service',
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
  });
});

// Media upload endpoint
app.post('/api/media/upload', (req: Request, res: Response) => {
  try {
    const { filename, mimeType, size, width, height, base64Data, tags } = req.body;

    if (!filename || !mimeType) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'filename and mimeType are required',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    const now = new Date().toISOString();
    const mediaId = uuidv4();

    // Mock: In a real implementation, we would store the file to disk/S3/etc.
    const newMedia: MediaItem = {
      id: mediaId,
      filename: `${mediaId}-${filename}`,
      originalFilename: filename,
      mimeType,
      size: size || 0,
      width,
      height,
      url: `https://cdn.adbazaar.com/media/${mediaId}-${filename}`,
      thumbnailUrl: mimeType.startsWith('image/')
        ? `https://cdn.adbazaar.com/media/thumbs/${mediaId}-${filename}`
        : undefined,
      metadata: {
        format: mimeType.split('/')[1] || 'unknown',
        hasAlpha: mimeType === 'image/png',
      },
      transformations: [],
      createdAt: now,
      updatedAt: now,
      status: 'ready',
      tags: tags || [],
    };

    mediaStore.push(newMedia);

    const response: UploadResponse = {
      success: true,
      data: newMedia,
      message: 'Media uploaded successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    const err = error as Error;
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: err.message,
      },
    };
    res.status(500).json(errorResponse);
  }
});

// Get single media by ID
app.get('/api/media/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const media = findMediaById(id);

  if (!media) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Media with id '${id}' not found`,
      },
    };
    res.status(404).json(errorResponse);
    return;
  }

  res.json({
    success: true,
    data: media,
    message: 'Media retrieved successfully',
  });
});

// List all media with pagination
app.get('/api/media', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  const tag = req.query.tag as string | undefined;
  const mimeType = req.query.mimeType as string | undefined;
  const status = req.query.status as string | undefined;

  // Filter media items
  let filtered = mediaStore.filter((item) => item.status !== 'deleted');

  if (tag) {
    filtered = filtered.filter((item) =>
      item.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  if (mimeType) {
    filtered = filtered.filter((item) => item.mimeType.includes(mimeType));
  }

  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }

  // Sort media items
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof MediaItem];
    const bVal = b[sortBy as keyof MediaItem];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const { items, pagination } = paginate(filtered, page, limit);

  const response: MediaListResponse = {
    success: true,
    data: {
      items,
      pagination,
    },
    message: 'Media list retrieved successfully',
  };

  res.json(response);
});

// Delete media by ID
app.delete('/api/media/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const mediaIndex = mediaStore.findIndex((item) => item.id === id);

  if (mediaIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Media with id '${id}' not found`,
      },
    };
    res.status(404).json(errorResponse);
    return;
  }

  // Soft delete
  mediaStore[mediaIndex].status = 'deleted';
  mediaStore[mediaIndex].updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: { id, deleted: true },
    message: 'Media deleted successfully',
  });
});

// Transform media
app.post('/api/media/:id/transform', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transformation: TransformationRequest = req.body;

    if (!transformation.type) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'MISSING_TRANSFORMATION_TYPE',
          message: 'Transformation type is required',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    const validTypes: TransformationType[] = [
      'resize', 'compress', 'crop', 'rotate', 'flip',
      'blur', 'sharpen', 'grayscale', 'format_convert', 'watermark',
    ];

    if (!validTypes.includes(transformation.type)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_TRANSFORMATION_TYPE',
          message: `Invalid transformation type. Valid types: ${validTypes.join(', ')}`,
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    const media = findMediaById(id);

    if (!media) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Media with id '${id}' not found`,
        },
      };
      res.status(404).json(errorResponse);
      return;
    }

    const now = new Date().toISOString();
    const transformationId = uuidv4();
    const resultUrl = generateTransformedUrl(media, transformation);

    // Create the transformation record
    const newTransformation = {
      id: transformationId,
      type: transformation.type,
      params: transformation.params || {},
      resultUrl,
      createdAt: now,
    };

    // Update the media item with the new transformation
    const mediaIndex = mediaStore.findIndex((item) => item.id === id);
    mediaStore[mediaIndex].transformations.push(newTransformation);
    mediaStore[mediaIndex].updatedAt = now;

    // Create a new "transformed" media item
    const transformedMedia: MediaItem = {
      ...mediaStore[mediaIndex],
      id: uuidv4(),
      filename: resultUrl.split('/').pop() || media.filename,
      transformations: [],
      createdAt: now,
      updatedAt: now,
    };

    // Add the transformation to the transformed media as well
    transformedMedia.transformations.push(newTransformation);

    const response: TransformationResponse = {
      success: true,
      data: {
        original: mediaStore[mediaIndex],
        transformed: transformedMedia,
      },
      message: `Media transformed successfully using ${transformation.type}`,
    };

    res.json(response);
  } catch (error) {
    const err = error as Error;
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'TRANSFORMATION_FAILED',
        message: err.message,
      },
    };
    res.status(500).json(errorResponse);
  }
});

// Integration status check
app.get('/api/integration/status', (_req: Request, res: Response) => {
  const totalStorageBytes = mediaStore
    .filter((item) => item.status !== 'deleted')
    .reduce((acc, item) => acc + item.size, 0);

  const totalTransformations = mediaStore
    .filter((item) => item.status !== 'deleted')
    .reduce((acc, item) => acc + item.transformations.length, 0);

  const status: IntegrationStatus = {
    service: 'rez-media-integration-service',
    status: 'connected',
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    capabilities: [
      'media-upload',
      'media-retrieval',
      'media-list',
      'media-deletion',
      'media-transformation',
      'thumbnail-generation',
      'format-conversion',
      'resize',
      'compress',
      'crop',
      'watermark',
    ],
    stats: {
      totalMediaItems: mediaStore.filter((item) => item.status !== 'deleted').length,
      totalStorageBytes,
      totalTransformations,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  };

  res.json({
    success: true,
    data: status,
    message: 'Integration status retrieved successfully',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4900;

app.listen(PORT, () => {
  logger.info(`REZ-Media Integration Service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Media store initialized with ${mediaStore.length} mock items`);
});

export default app;
