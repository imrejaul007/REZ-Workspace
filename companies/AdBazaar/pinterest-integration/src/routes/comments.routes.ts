import { Router, Request, Response, NextFunction } from 'express';
import { PinterestService } from '../services/pinterest.service';
import { PinterestComment } from '../models';
import { authMiddleware, IAuthenticatedRequest, AppError } from '../middleware';

const router = Router();
const pinterestService = new PinterestService();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/comments
 * @description Get comments for pins
 */
router.get('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const { pinId, page = 1, limit = 20 } = req.query;

    const comments = await pinterestService.getComments(accountId, pinId as string | undefined);

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedComments = comments.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginatedComments.map((comment) => ({
        id: comment.id,
        pinId: comment.pinId,
        authorName: comment.authorName,
        authorImage: comment.authorImage,
        text: comment.text,
        hidden: comment.hidden,
        createdAt: comment.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: comments.length,
        totalPages: Math.ceil(comments.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/comments/:id
 * @description Get comment details
 */
router.get('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comment = await PinterestComment.findOne({ id });

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    res.json({
      success: true,
      data: {
        id: comment.id,
        pinId: comment.pinId,
        authorName: comment.authorName,
        authorImage: comment.authorImage,
        text: comment.text,
        hidden: comment.hidden,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/comments/:id/hide
 * @description Hide a comment
 */
router.post('/:id/hide', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comment = await pinterestService.hideComment(id);

    res.json({
      success: true,
      message: 'Comment hidden successfully',
      data: {
        id: comment.id,
        pinId: comment.pinId,
        hidden: comment.hidden,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/comments/:id/unhide
 * @description Unhide a comment
 */
router.post('/:id/unhide', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comment = await PinterestComment.findOne({ id });

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    comment.hidden = false;
    await comment.save();

    res.json({
      success: true,
      message: 'Comment unhidden successfully',
      data: {
        id: comment.id,
        pinId: comment.pinId,
        hidden: comment.hidden,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/comments/:id
 * @description Delete a comment
 */
router.delete('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await PinterestComment.deleteOne({ id });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;