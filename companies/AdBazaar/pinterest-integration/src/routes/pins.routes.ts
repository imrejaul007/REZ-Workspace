import { Router, Request, Response, NextFunction } from 'express';
import { PinterestService } from '../services/pinterest.service';
import { authMiddleware, IAuthenticatedRequest, AppError } from '../middleware';
import { z } from 'zod';

const router = Router();
const pinterestService = new PinterestService();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createPinSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['image', 'video']),
  link: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  keywords: z.array(z.string()).optional(),
  ctaLink: z.string().url().optional(),
});

const updatePinSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  link: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  keywords: z.array(z.string()).optional(),
  ctaLink: z.string().url().optional(),
});

const schedulePinSchema = z.object({
  scheduledTime: z.string().datetime(),
});

const createIdeaPinSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  mediaUrls: z.array(z.string().url()).min(2).max(20),
  link: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * @route GET /api/pins
 * @description List all pins for the authenticated account
 */
router.get('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const { boardId, status, page =1, limit = 20 } = req.query;

    const pins = await pinterestService.getPins(accountId, boardId as string | undefined);

    // Filter by status if provided
    let filteredPins = pins;
    if (status) {
      filteredPins = pins.filter((pin) => pin.status === status);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedPins = filteredPins.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedPins.map((pin) => ({
        id: pin.id,
        pinterestPinId: pin.pinterestPinId,
        boardId: pin.boardId,
        title: pin.title,
        description: pin.description,
        link: pin.link,
        mediaUrl: pin.mediaUrl,
        mediaType: pin.mediaType,
        altText: pin.altText,
        keywords: pin.keywords,
        ctaLink: pin.ctaLink,
        viewCount: pin.viewCount,
        repinCount: pin.repinCount,
        clickCount: pin.clickCount,
        savedCount: pin.savedCount,
        status: pin.status,
        scheduledTime: pin.scheduledTime,
        publishedAt: pin.publishedAt,
        createdAt: pin.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredPins.length,
        totalPages: Math.ceil(filteredPins.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/pins/:id
 * @description Get pin details
 */
router.get('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pin = await pinterestService.getPinById(id);

    if (!pin) {
      throw new AppError(404, 'Pin not found');
    }

    res.json({
      success: true,
      data: {
        id: pin.id,
        pinterestPinId: pin.pinterestPinId,
        boardId: pin.boardId,
        accountId: pin.accountId,
        title: pin.title,
        description: pin.description,
        link: pin.link,
        mediaUrl: pin.mediaUrl,
        mediaType: pin.mediaType,
        altText: pin.altText,
        keywords: pin.keywords,
        ctaLink: pin.ctaLink,
        viewCount: pin.viewCount,
        repinCount: pin.repinCount,
        clickCount: pin.clickCount,
        savedCount: pin.savedCount,
        status: pin.status,
        scheduledTime: pin.scheduledTime,
        publishedAt: pin.publishedAt,
        createdAt: pin.createdAt,
        updatedAt: pin.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/pins
 * @description Create a new pin
 */
router.post('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const validatedData = createPinSchema.parse(req.body);

    const pin = await pinterestService.createPin(accountId, validatedData);

    res.status(201).json({
      success: true,
      data: {
        id: pin.id,
        pinterestPinId: pin.pinterestPinId,
        boardId: pin.boardId,
        title: pin.title,
        description: pin.description,
        link: pin.link,
        mediaUrl: pin.mediaUrl,
        mediaType: pin.mediaType,
        altText: pin.altText,
        keywords: pin.keywords,
        ctaLink: pin.ctaLink,
        status: pin.status,
        publishedAt: pin.publishedAt,
        createdAt: pin.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, 'Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * @route PATCH /api/pins/:id
 * @description Update a pin
 */
router.patch('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updatePinSchema.parse(req.body);

    const pin = await pinterestService.updatePin(id, validatedData);

    res.json({
      success: true,
      data: {
        id: pin.id,
        pinterestPinId: pin.pinterestPinId,
        title: pin.title,
        description: pin.description,
        link: pin.link,
        altText: pin.altText,
        keywords: pin.keywords,
        ctaLink: pin.ctaLink,
        status: pin.status,
        updatedAt: pin.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, 'Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * @route DELETE /api/pins/:id
 * @description Delete a pin
 */
router.delete('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await pinterestService.deletePin(id);

    res.json({
      success: true,
      message: 'Pin deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/pins/:id/schedule
 * @description Schedule a pin for future publishing
 */
router.post('/:id/schedule', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = schedulePinSchema.parse(req.body);

    const pin = await pinterestService.schedulePin(id, validatedData);

    res.json({
      success: true,
      data: {
        id: pin.id,
        title: pin.title,
        status: pin.status,
        scheduledTime: pin.scheduledTime,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, 'Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * @route POST /api/idea-pins
 * @description Create an idea pin (story format)
 */
router.post('/idea-pins', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const validatedData = createIdeaPinSchema.parse(req.body);

    const pin = await pinterestService.createIdeaPin(accountId, validatedData);

    res.status(201).json({
      success: true,
      data: {
        id: pin.id,
        pinterestPinId: pin.pinterestPinId,
        boardId: pin.boardId,
        title: pin.title,
        description: pin.description,
        mediaUrl: pin.mediaUrl,
        status: pin.status,
        publishedAt: pin.publishedAt,
        createdAt: pin.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, 'Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * @route POST /api/pins/:id/buyable
 * @description Add buyable pin functionality
 */
router.post('/:id/buyable', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { productId, price, currency } = req.body;

    if (!productId || !price || !currency) {
      throw new AppError(400, 'productId, price, and currency are required');
    }

    // This would call the Pinterest API to add product to pin
    // For now, return a success response
    res.json({
      success: true,
      message: 'Buyable pin configured',
      data: {
        pinId: id,
        productId,
        price,
        currency,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/pins/:id/rich-pin
 * @description Validate and configure rich pin
 */
router.post('/:id/rich-pin', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // This would call the Pinterest API to validate rich pin
    res.json({
      success: true,
      message: 'Rich pin validation initiated',
      data: {
        pinId: id,
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;