import { Router, Request, Response, NextFunction } from 'express';
import { PinterestService } from '../services/pinterest.service';
import { authMiddleware, IAuthenticatedRequest, AppError } from '../middleware';
import { z } from 'zod';

const router = Router();
const pinterestService = new PinterestService();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'secret']).optional(),
});

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'secret']).optional(),
});

/**
 * @route GET /api/boards
 * @description List all boards for the authenticated account
 */
router.get('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const boards = await pinterestService.getBoards(accountId);

    res.json({
      success: true,
      data: boards.map((board) => ({
        id: board.id,
        pinterestBoardId: board.pinterestBoardId,
        name: board.name,
        description: board.description,
        privacy: board.privacy,
        pinCount: board.pinCount,
        followerCount: board.followerCount,
        coverImage: board.coverImage,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/boards/:id
 * @description Get board details
 */
router.get('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const board = await pinterestService.getBoardById(id);

    if (!board) {
      throw new AppError(404, 'Board not found');
    }

    res.json({
      success: true,
      data: {
        id: board.id,
        pinterestBoardId: board.pinterestBoardId,
        accountId: board.accountId,
        name: board.name,
        description: board.description,
        privacy: board.privacy,
        pinCount: board.pinCount,
        followerCount: board.followerCount,
        coverImage: board.coverImage,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/boards
 * @description Create a new board
 */
router.post('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const validatedData = createBoardSchema.parse(req.body);

    const board = await pinterestService.createBoard(accountId, validatedData);

    res.status(201).json({
      success: true,
      data: {
        id: board.id,
        pinterestBoardId: board.pinterestBoardId,
        name: board.name,
        description: board.description,
        privacy: board.privacy,
        pinCount: board.pinCount,
        followerCount: board.followerCount,
        coverImage: board.coverImage,
        createdAt: board.createdAt,
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
 * @route PATCH /api/boards/:id
 * @description Update a board
 */
router.patch('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateBoardSchema.parse(req.body);

    const board = await pinterestService.updateBoard(id, validatedData);

    res.json({
      success: true,
      data: {
        id: board.id,
        pinterestBoardId: board.pinterestBoardId,
        name: board.name,
        description: board.description,
        privacy: board.privacy,
        pinCount: board.pinCount,
        followerCount: board.followerCount,
        coverImage: board.coverImage,
        updatedAt: board.updatedAt,
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
 * @route DELETE /api/boards/:id
 * @description Delete a board
 */
router.delete('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await pinterestService.deleteBoard(id);

    res.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/boards/:id/sync
 * @description Sync pins for a board
 */
router.post('/:id/sync', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pins = await pinterestService.syncPins(id);

    res.json({
      success: true,
      data: {
        pinsSynced: pins.length,
        pins: pins.map((pin) => ({
          id: pin.id,
          title: pin.title,
          status: pin.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;