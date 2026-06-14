/**
 * REZ Google Hotel Ads Service
 * Port: 4024
 *
 * Express server with endpoints for:
 * - Hotel data feed management
 * - Price & availability updates
 * - Programmatic bidding
 * - Performance tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  FeedStatus,
  CampaignStatus,
  BidStrategy,
  registerHotel,
  getHotelListing,
  getAllHotelListings,
  updateHotelFeedStatus,
  verifyHotel,
  updatePrices,
  getPriceHistory,
  createCampaign,
  getCampaign,
  getCampaignsByHotel,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  endCampaign,
  getCampaignStats,
} from './services/google-ads.service.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4024');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-google-hotel-ads-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ========================
// HOTEL FEED ENDPOINTS
// ========================

// GET /api/hotels/:hotelId - Get hotel configuration
app.get('/api/hotels/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const listing = getHotelListing(hotelId);

  if (!listing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Hotel not found' },
    });
  }

  res.json({
    success: true,
    data: { hotel: listing },
  });
});

// GET /api/hotels - Get all hotels
app.get('/api/hotels', (_req: Request, res: Response) => {
  const hotels = getAllHotelListings();

  res.json({
    success: true,
    data: { hotels, count: hotels.length },
  });
});

// POST /api/hotels - Register hotel
app.post('/api/hotels', (req: Request, res: Response) => {
  const { hotelId, propertyId, destinationId, feedData } = req.body;

  if (!hotelId || !propertyId || !destinationId || !feedData) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'hotelId, propertyId, destinationId, and feedData are required',
      },
    });
  }

  const listing = registerHotel(hotelId, propertyId, destinationId, feedData);

  res.status(201).json({
    success: true,
    data: { hotel: listing },
  });
});

// PUT /api/hotels/:id/verify - Verify with Google
app.put('/api/hotels/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const listing = getHotelListing(id);

  if (!listing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Hotel not found' },
    });
  }

  const verified = verifyHotel(id);

  res.json({
    success: true,
    data: { hotel: verified },
    message: 'Hotel verified with Google Hotel Center',
  });
});

// ========================
// FEED UPDATE ENDPOINTS
// ========================

// POST /api/feed/update - Update price/availability
app.post('/api/feed/update', (req: Request, res: Response) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'updates array is required and must not be empty',
      },
    });
  }

  // Validate each update
  for (const update of updates) {
    if (!update.hotelId || !update.roomId || !update.date || update.price === undefined || !update.bookingUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Each update must have hotelId, roomId, date, price, and bookingUrl',
        },
      });
    }
  }

  const results = updatePrices(updates);

  res.json({
    success: true,
    data: { results, synced: updates.length },
  });
});

// GET /api/feed/history/:hotelId - Get price history
app.get('/api/feed/history/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { roomId, startDate, endDate } = req.query;

  const history = getPriceHistory(
    hotelId,
    roomId as string | undefined,
    startDate as string | undefined,
    endDate as string | undefined
  );

  res.json({
    success: true,
    data: { history, count: history.length },
  });
});

// ========================
// CAMPAIGN ENDPOINTS
// ========================

// GET /api/campaigns/:hotelId - Get campaigns
app.get('/api/campaigns/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { status } = req.query;

  let campaignList = getCampaignsByHotel(hotelId);

  if (status && Object.values(CampaignStatus).includes(status as CampaignStatus)) {
    campaignList = campaignList.filter(c => c.status === status);
  }

  res.json({
    success: true,
    data: { campaigns: campaignList, count: campaignList.length },
  });
});

// POST /api/campaigns - Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { hotelId, campaignName, dailyBudget, bidStrategy, targeting } = req.body;

  if (!hotelId || !campaignName || !dailyBudget || !bidStrategy) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'hotelId, campaignName, dailyBudget, and bidStrategy are required',
      },
    });
  }

  if (!Object.values(BidStrategy).includes(bidStrategy)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `bidStrategy must be one of: ${Object.values(BidStrategy).join(', ')}`,
      },
    });
  }

  const campaign = createCampaign(hotelId, campaignName, dailyBudget, bidStrategy, targeting);

  res.status(201).json({
    success: true,
    data: { campaign },
  });
});

// GET /api/campaigns/:hotelId/:campaignId - Get specific campaign
app.get('/api/campaigns/:hotelId/:campaignId', (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const campaign = getCampaign(campaignId);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  res.json({
    success: true,
    data: { campaign },
  });
});

// PUT /api/campaigns/:id - Update campaign
app.put('/api/campaigns/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { campaignName, dailyBudget, bidStrategy, status, targeting } = req.body;

  const existing = getCampaign(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  const updates: Record<string, unknown> = {};
  if (campaignName !== undefined) updates.campaignName = campaignName;
  if (dailyBudget !== undefined) updates.dailyBudget = dailyBudget;
  if (bidStrategy !== undefined) updates.bidStrategy = bidStrategy;
  if (status !== undefined) updates.status = status;
  if (targeting !== undefined) updates.targeting = targeting;

  const campaign = updateCampaign(id, updates as Parameters<typeof updateCampaign>[1]);

  res.json({
    success: true,
    data: { campaign },
  });
});

// POST /api/campaigns/:id/pause - Pause campaign
app.post('/api/campaigns/:id/pause', (req: Request, res: Response) => {
  const { id } = req.params;
  const campaign = getCampaign(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  const paused = pauseCampaign(id);

  res.json({
    success: true,
    data: { campaign: paused },
  });
});

// POST /api/campaigns/:id/resume - Resume campaign
app.post('/api/campaigns/:id/resume', (req: Request, res: Response) => {
  const { id } = req.params;
  const campaign = getCampaign(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  const resumed = resumeCampaign(id);

  res.json({
    success: true,
    data: { campaign: resumed },
  });
});

// POST /api/campaigns/:id/end - End campaign
app.post('/api/campaigns/:id/end', (req: Request, res: Response) => {
  const { id } = req.params;
  const campaign = getCampaign(id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  const ended = endCampaign(id);

  res.json({
    success: true,
    data: { campaign: ended },
  });
});

// ========================
// STATS ENDPOINT
// ========================

// GET /api/stats/:hotelId - Get ad performance
app.get('/api/stats/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const stats = getCampaignStats(hotelId);

  res.json({
    success: true,
    data: { stats },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GoogleAdsService Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\nREZ Google Hotel Ads Service - Port ${PORT}`);
  console.log('Bid Strategies:', Object.values(BidStrategy).join(', '));
  console.log('Feed Statuses:', Object.values(FeedStatus).join(', '));
  console.log('Campaign Statuses:', Object.values(CampaignStatus).join(', '));
  console.log('\nEndpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/hotels/:hotelId');
  console.log('  POST /api/hotels');
  console.log('  PUT  /api/hotels/:id/verify');
  console.log('  POST /api/feed/update');
  console.log('  GET  /api/campaigns/:hotelId');
  console.log('  POST /api/campaigns');
  console.log('  GET  /api/stats/:hotelId');
});

export { app, server };
