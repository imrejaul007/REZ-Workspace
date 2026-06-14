import { Router, Request, Response, NextFunction } from 'express';
import { PinterestService } from '../services/pinterest.service';
import { authMiddleware, IAuthenticatedRequest, AppError } from '../middleware';

const router = Router();
const pinterestService = new PinterestService();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/accounts
 * @description List all connected Pinterest accounts
 */
router.get('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await pinterestService.getAccounts();

    res.json({
      success: true,
      data: accounts.map((account) => ({
        id: account.id,
        pinterestUserId: account.pinterestUserId,
        username: account.username,
        displayName: account.displayName,
        profileImage: account.profileImage,
        websiteUrl: account.websiteUrl,
        followerCount: account.followerCount,
        followingCount: account.followingCount,
        connectedAt: account.connectedAt,
        isConnected: !!account.accessToken,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/accounts/:id
 * @description Get account details
 */
router.get('/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const account = await pinterestService.getAccountById(id);

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    res.json({
      success: true,
      data: {
        id: account.id,
        pinterestUserId: account.pinterestUserId,
        username: account.username,
        displayName: account.displayName,
        profileImage: account.profileImage,
        websiteUrl: account.websiteUrl,
        followerCount: account.followerCount,
        followingCount: account.followingCount,
        connectedAt: account.connectedAt,
        isConnected: !!account.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/accounts/connect
 * @description Connect a new Pinterest account
 */
router.post('/connect', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
      throw new AppError(400, 'Access token is required');
    }

    const account = await pinterestService.connectAccount('', accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        id: account.id,
        pinterestUserId: account.pinterestUserId,
        username: account.username,
        displayName: account.displayName,
        profileImage: account.profileImage,
        followerCount: account.followerCount,
        connectedAt: account.connectedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/accounts/:id/disconnect
 * @description Disconnect a Pinterest account
 */
router.post('/:id/disconnect', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await pinterestService.disconnectAccount(id);

    res.json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/accounts/:id/sync
 * @description Sync account data with Pinterest
 */
router.post('/:id/sync', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Sync boards
    const boards = await pinterestService.syncBoards(id);

    res.json({
      success: true,
      data: {
        boardsSynced: boards.length,
        boards: boards.map((board) => ({
          id: board.id,
          name: board.name,
          pinCount: board.pinCount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;