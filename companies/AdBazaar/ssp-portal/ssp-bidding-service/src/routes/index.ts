import { Router, Request, Response } from 'express';
import { biddingService } from '../services';
import { validateRequest, asyncHandler } from '../middleware';
import { placeBidSchema, createAuctionSchema, queryParamsSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const router = Router();

// POST /bid - Place a bid
router.post(
  '/bid',
  validateRequest(placeBidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await biddingService.placeBid(req.body);

    res.status(201).json({
      success: true,
      data: bid,
      message: 'Bid placed successfully',
    });
  })
);

// GET / - List all bids with pagination
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;

    const result = await biddingService.getAllBids(page, limit, status);

    res.json({
      success: true,
      data: result.bids,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  })
);

// GET /:id - Get bid by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await biddingService.getBidById(req.params.id);

    if (!bid) {
      res.status(404).json({
        success: false,
        error: { message: 'Bid not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: bid,
    });
  })
);

// GET /auction/:auctionId - Get bids by auction
router.get(
  '/auction/:auctionId',
  asyncHandler(async (req: Request, res: Response) => {
    const bids = await biddingService.getBidsByAuction(req.params.auctionId);

    res.json({
      success: true,
      data: bids,
      count: bids.length,
    });
  })
);

// POST /auction - Create a new auction
router.post(
  '/auction',
  validateRequest(createAuctionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const auction = await biddingService.createAuction(req.body);

    res.status(201).json({
      success: true,
      data: auction,
      message: 'Auction created successfully',
    });
  })
);

// GET /auction/:auctionId/result - Get auction result
router.get(
  '/auction/:auctionId/result',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await biddingService.getAuctionResult(req.params.auctionId);

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /advertiser/:advertiserId - Get bids by advertiser
router.get(
  '/advertiser/:advertiserId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;

    const result = await biddingService.getBidsByAdvertiser(
      req.params.advertiserId,
      page,
      limit,
      status
    );

    res.json({
      success: true,
      data: result.bids,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  })
);

// GET /stats/advertiser/:advertiserId - Get advertiser bid statistics
router.get(
  '/stats/advertiser/:advertiserId',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await biddingService.getAdvertiserStats(req.params.advertiserId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// GET /campaign/:campaignId - Get bids by campaign
router.get(
  '/campaign/:campaignId',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;

    const result = await biddingService.getBidsByCampaign(
      req.params.campaignId,
      page,
      limit,
      status
    );

    res.json({
      success: true,
      data: result.bids,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  })
);

// DELETE /:id - Cancel a bid (only if pending)
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await biddingService.cancelBid(req.params.id);

    res.json({
      success: true,
      data: bid,
      message: 'Bid cancelled successfully',
    });
  })
);

export default router;