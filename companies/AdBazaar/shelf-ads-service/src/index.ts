import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { register, httpRequestDuration, httpRequestTotal } from './utils/metrics.js';
import logger from 'utils/logger.js';
import { internalServiceAuth, validateBody, AuthenticatedRequest } from './middleware/auth.js';

// Services
import { storeService, CreateStoreSchema, UpdateStoreSchema, ListStoresQuerySchema } from './services/storeService.js';
import { shelfService, CreateShelfSchema, UpdateShelfSchema, ListShelvesQuerySchema } from './services/shelfService.js';
import { adService, CreateShelfAdSchema, UpdateShelfAdSchema, ListShelfAdsQuerySchema } from './services/adService.js';
import { campaignService, CreateCampaignSchema, UpdateCampaignSchema, GeoTargetingSchema, ListCampaignsQuerySchema } from './services/campaignService.js';
import { salesLiftService, CreateSalesLiftSchema, ListSalesLiftQuerySchema } from './services/salesLiftService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4994;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    httpRequestTotal.inc(
      { method: req.method, route, status_code: res.statusCode }
    );

    logger.debug('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`
    });
  });

  next();
});

// Health check endpoints
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'shelf-ads-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisClient.isOpen ? 'connected' : 'disconnected'
    }
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = redisClient.isOpen;

  if (mongoReady && redisReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({
      status: 'not ready',
      mongodb: mongoReady,
      redis: redisReady
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// ==================== STORE ROUTES ====================

// Create store
app.post('/api/stores',
  internalServiceAuth,
  validateBody(CreateStoreSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const store = await storeService.createStore(req.body);
      res.status(201).json({
        success: true,
        data: store
      });
    } catch (error) {
      logger.error('Error creating store', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create store'
      });
    }
  }
);

// Get store by ID
app.get('/api/stores/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const store = await storeService.getStoreById(req.params.id);
      if (!store) {
        res.status(404).json({
          success: false,
          error: 'Store not found'
        });
        return;
      }
      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      logger.error('Error getting store', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get store'
      });
    }
  }
);

// List stores
app.get('/api/stores',
  internalServiceAuth,
  validateBody(ListStoresQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await storeService.listStores(req.body);
      res.json({
        success: true,
        data: result.stores,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing stores', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list stores'
      });
    }
  }
);

// Update store
app.patch('/api/stores/:id',
  internalServiceAuth,
  validateBody(UpdateStoreSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const store = await storeService.updateStore(req.params.id, req.body);
      if (!store) {
        res.status(404).json({
          success: false,
          error: 'Store not found'
        });
        return;
      }
      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      logger.error('Error updating store', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update store'
      });
    }
  }
);

// Delete store
app.delete('/api/stores/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await storeService.deleteStore(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Store not found'
        });
        return;
      }
      res.json({
        success: true,
        message: 'Store deleted'
      });
    } catch (error) {
      logger.error('Error deleting store', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete store'
      });
    }
  }
);

// Get store statistics
app.get('/api/stores/stats/overview',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storeService.getStoreStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting store stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get store statistics'
      });
    }
  }
);

// ==================== SHELF ROUTES ====================

// Add shelf to store
app.post('/api/stores/:id/shelves',
  internalServiceAuth,
  validateBody(CreateShelfSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shelf = await shelfService.addShelfToStore(req.params.id, req.body);
      if (!shelf) {
        res.status(404).json({
          success: false,
          error: 'Store not found or invalid data'
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: shelf
      });
    } catch (error) {
      logger.error('Error adding shelf', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to add shelf'
      });
    }
  }
);

// Get shelf by ID
app.get('/api/shelves/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shelf = await shelfService.getShelfById(req.params.id);
      if (!shelf) {
        res.status(404).json({
          success: false,
          error: 'Shelf not found'
        });
        return;
      }
      res.json({
        success: true,
        data: shelf
      });
    } catch (error) {
      logger.error('Error getting shelf', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get shelf'
      });
    }
  }
);

// List shelves for a store
app.get('/api/stores/:id/shelves',
  internalServiceAuth,
  validateBody(ListShelvesQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await shelfService.listShelvesByStore(req.params.id, req.body);
      res.json({
        success: true,
        data: result.shelves,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing shelves', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list shelves'
      });
    }
  }
);

// List all shelves
app.get('/api/shelves',
  internalServiceAuth,
  validateBody(ListShelvesQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await shelfService.listAllShelves(req.body);
      res.json({
        success: true,
        data: result.shelves,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing all shelves', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list shelves'
      });
    }
  }
);

// Get available shelves
app.get('/api/shelves/available',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category, minVisibility } = req.query;
      const shelves = await shelfService.getAvailableShelves(
        category as string | undefined,
        minVisibility as string | undefined
      );
      res.json({
        success: true,
        data: shelves
      });
    } catch (error) {
      logger.error('Error getting available shelves', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get available shelves'
      });
    }
  }
);

// Update shelf
app.patch('/api/shelves/:id',
  internalServiceAuth,
  validateBody(UpdateShelfSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shelf = await shelfService.updateShelf(req.params.id, req.body);
      if (!shelf) {
        res.status(404).json({
          success: false,
          error: 'Shelf not found'
        });
        return;
      }
      res.json({
        success: true,
        data: shelf
      });
    } catch (error) {
      logger.error('Error updating shelf', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update shelf'
      });
    }
  }
);

// Delete shelf
app.delete('/api/shelves/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await shelfService.deleteShelf(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Shelf not found'
        });
        return;
      }
      res.json({
        success: true,
        message: 'Shelf deleted'
      });
    } catch (error) {
      logger.error('Error deleting shelf', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete shelf'
      });
    }
  }
);

// ==================== AD ROUTES ====================

// Add ad to shelf
app.post('/api/shelves/:id/ads',
  internalServiceAuth,
  validateBody(CreateShelfAdSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adData = { ...req.body, shelfId: req.params.id };
      const ad = await adService.addAdToShelf(adData);
      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Shelf not found or at capacity'
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: ad
      });
    } catch (error) {
      logger.error('Error adding ad to shelf', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to add ad'
      });
    }
  }
);

// Get ad by ID
app.get('/api/ads/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ad = await adService.getAdById(req.params.id);
      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Ad not found'
        });
        return;
      }
      res.json({
        success: true,
        data: ad
      });
    } catch (error) {
      logger.error('Error getting ad', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get ad'
      });
    }
  }
);

// List shelf ads
app.get('/api/shelves/:id/ads',
  internalServiceAuth,
  validateBody(ListShelfAdsQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await adService.listShelfAds(req.params.id, req.body);
      res.json({
        success: true,
        data: result.ads,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing shelf ads', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list ads'
      });
    }
  }
);

// Update ad
app.patch('/api/ads/:id',
  internalServiceAuth,
  validateBody(UpdateShelfAdSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ad = await adService.updateAd(req.params.id, req.body);
      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Ad not found'
        });
        return;
      }
      res.json({
        success: true,
        data: ad
      });
    } catch (error) {
      logger.error('Error updating ad', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update ad'
      });
    }
  }
);

// Delete ad
app.delete('/api/ads/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await adService.deleteAd(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Ad not found'
        });
        return;
      }
      res.json({
        success: true,
        message: 'Ad deleted'
      });
    } catch (error) {
      logger.error('Error deleting ad', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete ad'
      });
    }
  }
);

// Record impression
app.post('/api/ads/:id/impressions',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const count = req.body.impressions || 1;
      const ad = await adService.recordImpression(req.params.id, count);
      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Ad not found'
        });
        return;
      }
      res.json({
        success: true,
        data: { impressions: ad.impressions.total }
      });
    } catch (error) {
      logger.error('Error recording impression', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to record impression'
      });
    }
  }
);

// Record click
app.post('/api/ads/:id/clicks',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ad = await adService.recordClick(req.params.id);
      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Ad not found'
        });
        return;
      }
      res.json({
        success: true,
        data: { clicks: ad.clicks.total }
      });
    } catch (error) {
      logger.error('Error recording click', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to record click'
      });
    }
  }
);

// ==================== CAMPAIGN ROUTES ====================

// Create campaign
app.post('/api/campaigns',
  internalServiceAuth,
  validateBody(CreateCampaignSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.createCampaign(req.body);
      res.status(201).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error creating campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create campaign'
      });
    }
  }
);

// Get campaign by ID
app.get('/api/campaigns/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error getting campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign'
      });
    }
  }
);

// List campaigns
app.get('/api/campaigns',
  internalServiceAuth,
  validateBody(ListCampaignsQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await campaignService.listCampaigns(req.body);
      res.json({
        success: true,
        data: result.campaigns,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing campaigns', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list campaigns'
      });
    }
  }
);

// Update campaign
app.patch('/api/campaigns/:id',
  internalServiceAuth,
  validateBody(UpdateCampaignSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error updating campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update campaign'
      });
    }
  }
);

// Delete campaign
app.delete('/api/campaigns/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await campaignService.deleteCampaign(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        message: 'Campaign deleted'
      });
    } catch (error) {
      logger.error('Error deleting campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete campaign'
      });
    }
  }
);

// Activate campaign
app.post('/api/campaigns/:id/activate',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.activateCampaign(req.params.id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error activating campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to activate campaign'
      });
    }
  }
);

// Pause campaign
app.post('/api/campaigns/:id/pause',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.pauseCampaign(req.params.id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error pausing campaign', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to pause campaign'
      });
    }
  }
);

// Get campaign performance
app.get('/api/campaigns/:id/performance',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const performance = await campaignService.getCampaignPerformance(req.params.id);
      if (!performance) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      logger.error('Error getting campaign performance', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign performance'
      });
    }
  }
);

// Update geo targeting
app.post('/api/campaigns/:id/geo-target',
  internalServiceAuth,
  validateBody(GeoTargetingSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const campaign = await campaignService.updateGeoTargeting(req.params.id, req.body);
      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error updating geo targeting', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update geo targeting'
      });
    }
  }
);

// ==================== SALES LIFT ROUTES ====================

// Create sales lift study
app.post('/api/sales-lifts',
  internalServiceAuth,
  validateBody(CreateSalesLiftSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salesLift = await salesLiftService.createSalesLift(req.body);
      res.status(201).json({
        success: true,
        data: salesLift
      });
    } catch (error) {
      logger.error('Error creating sales lift', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create sales lift study'
      });
    }
  }
);

// Get sales lift by ID
app.get('/api/sales-lifts/:id',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salesLift = await salesLiftService.getSalesLiftById(req.params.id);
      if (!salesLift) {
        res.status(404).json({
          success: false,
          error: 'Sales lift not found'
        });
        return;
      }
      res.json({
        success: true,
        data: salesLift
      });
    } catch (error) {
      logger.error('Error getting sales lift', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get sales lift'
      });
    }
  }
);

// List sales lifts
app.get('/api/sales-lifts',
  internalServiceAuth,
  validateBody(ListSalesLiftQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await salesLiftService.listSalesLifts(req.body);
      res.json({
        success: true,
        data: result.salesLifts,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Error listing sales lifts', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to list sales lifts'
      });
    }
  }
);

// Get campaign analytics (sales lift analytics)
app.get('/api/campaigns/:id/analytics',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const aggregated = await salesLiftService.getAggregatedSalesLift(req.params.id);
      if (!aggregated) {
        res.status(404).json({
          success: false,
          error: 'No sales lift data found for campaign'
        });
        return;
      }
      res.json({
        success: true,
        data: aggregated
      });
    } catch (error) {
      logger.error('Error getting campaign analytics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign analytics'
      });
    }
  }
);

// ==================== ANALYTICS DASHBOARD ====================

app.get('/api/analytics/dashboard',
  internalServiceAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [storeStats, shelfStats, campaignStats, salesLiftStats] = await Promise.all([
        storeService.getStoreStats(),
        shelfService.getShelfStats(),
        campaignService.getCampaignStats(),
        salesLiftService.getSalesLiftStats()
      ]);

      res.json({
        success: true,
        data: {
          stores: storeStats,
          shelves: shelfStats,
          campaigns: campaignStats,
          salesLift: salesLiftStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting analytics dashboard', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics dashboard'
      });
    }
  }
);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ==================== DATABASE CONNECTIONS ====================

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shelf_ads';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  })
  .catch((error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error', { error: error.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (error) => {
  logger.error('Redis error', { error: error.message });
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis', { url: REDIS_URL });
});

redisClient.connect().catch((error) => {
  logger.error('Redis connection error', { error: error.message });
});

// ==================== SERVER START ====================

const server = app.listen(PORT, () => {
  logger.info(`Shelf Ads Service started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      await redisClient.quit();
      logger.info('Redis connection closed');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;