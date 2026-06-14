import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { connectDatabase, connectRedis } from './config/database';
import pointsRoutes from './routes/points.routes';
import rewardsRoutes from './routes/rewards.routes';
import { ExpiryService } from './services/ExpiryService';
import { LoyaltyProgram } from './models/LoyaltyProgram';
import { CustomerPoints } from './models/CustomerPoints';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const PORT = process.env.PORT || 4007;

// Middleware
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'restaurant-loyalty-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/loyalty/points', pointsRoutes);
app.use('/api/loyalty/rewards', rewardsRoutes);

// Tier management routes (admin)
app.post('/api/loyalty/admin/tiers/check', async (req: Request, res: Response) => {
  try {
    const { customerId, programId } = req.body;

    // Simple import inline to avoid circular dependency
    const { TierService } = await import('./services/TierService');
    const tierService = new TierService();

    const result = await tierService.checkTierUpgrade(customerId, programId);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
    res.status(500).json({ success: false, error: 'Failed to check tier upgrade' });
  }
});

// Expiry processing (admin/cron)
app.post('/api/loyalty/admin/expiry/process', async (req: Request, res: Response) => {
  try {
    const expiryService = new ExpiryService();
    const result = await expiryService.processExpiredPoints();

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error processing expired points:', error);
    res.status(500).json({ success: false, error: 'Failed to process expired points' });
  }
});

// Create loyalty program
app.post('/api/loyalty/programs', async (req: Request, res: Response) => {
  try {
    const programData = req.body;
    const program = await LoyaltyProgram.create({
      programId: programData.programId || uuidv4(),
      name: programData.name,
      restaurantId: programData.restaurantId,
      ...programData,
    });

    res.json({ success: true, data: program });
  } catch (error) {
    console.error('Error creating loyalty program:', error);
    res.status(500).json({ success: false, error: 'Failed to create loyalty program' });
  }
});

// Get loyalty program
app.get('/api/loyalty/programs/:programId', async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;
    const program = await LoyaltyProgram.findOne({ programId });

    if (!program) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    res.json({ success: true, data: program });
  } catch (error) {
    console.error('Error getting loyalty program:', error);
    res.status(500).json({ success: false, error: 'Failed to get loyalty program' });
  }
});

// Initialize customer in loyalty program
app.post('/api/loyalty/customers', async (req: Request, res: Response) => {
  try {
    const { customerId, programId } = req.body;

    let customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      customerPoints = await CustomerPoints.create({
        customerId,
        programId,
        currentPoints: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
        tierProgress: 0,
        nextTier: 'SILVER',
        pointsToNextTier: 1000,
      });
    }

    res.json({ success: true, data: customerPoints });
  } catch (error) {
    console.error('Error initializing customer:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize customer' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await connectDatabase();
    const redis = connectRedis();

    // Store redis in app locals for routes
    app.locals.redis = redis;

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Restaurant Loyalty Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
