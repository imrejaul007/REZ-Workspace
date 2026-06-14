import { logger } from '../../shared/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Error handling
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup - CORS configured securely
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://rezapp.app').split(',');

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Define namespace
const rideNamespace = io.of('/ride');

// Services
import { RideService } from './services/ride.service';
import { DriverService } from './services/driver.service';
import { MapsService } from './services/maps.service';
import { WalletService } from './services/wallet.service';
import { VoucherService } from './services/voucher.service';
import { NotificationService } from './services/notification.service';
import { AdsService } from './services/ads.service';
import { AuthService } from './services/auth.service';
import { intelligenceService } from './services/intelligence.service';
import { rabtulService } from './services/rabtul.service';
import { mediaService } from './services/media.service';
import { corporateService } from './services/corporate.service';
import { ecosystemService } from './services/ecosystem.service';
import { dataPipelineService } from './services/data-pipeline.service';
import { fraudDetectionService } from './services/fraud.service';
import { identityService } from './services/identity.service';
import { locationIntelligenceService } from './services/location-intelligence.service';
import { signalAggregatorService } from './services/signal-aggregator.service';
import { attributionService } from './services/attribution.service';
import { ReportsService } from './services/reports.service';
import { subscriptionService } from './services/subscription.service';
import { rideCommerceService } from './services/ride-commerce.service';
import { predictiveSuggestionsService } from './services/predictive-suggestions.service';

// Models - Register schemas with mongoose
import './models/ride.model';
import './models/driver.model';
import './models/user.model';
import './models/voucher.model';
import './models/campaign.model';
import './models/wallet.model';
import './models/wallet-transaction.model';
import './models/corporate.model';
import './models/rental.model';

// Explicitly register NestJS-decorated schemas
import { registerSchemas } from './models/schema-registration';
registerSchemas();

// Routes
import subscriptionRoutes from './routes/subscription.routes';
import commerceRoutes from './routes/commerce.routes';
import predictionsRoutes from './routes/predictions.routes';
import safetyRoutes from './routes/safety.routes';
import authRoutes from './routes/auth.routes';
import ridesRouter from './routes/rides.routes';
import driversRouter from './routes/driver.routes';
import faresRouter from './routes/fares.routes';
import vouchersRouter from './routes/voucher.routes';
import webhooksRouter from './routes/webhooks.routes';
import adminRouter from './routes/admin.routes';
import payoutRouter from './routes/payout.routes';
import surgeRouter from './routes/surge.routes';
import cityRouter from './routes/city.routes';
import scheduledRouter from './routes/scheduled.routes';
import corporateRouter from './routes/corporate.routes';
import questsRouter from './routes/quests.routes';
import geoRouter from './routes/geo.routes';
import airportRouter from './routes/airport.routes';
import giftCardsRouter from './routes/gift-cards.routes';
import quickRideRouter from './routes/quick-ride.routes';
import greenRouter from './routes/green.routes';
import voiceRouter from './routes/voice.routes';
import aiRouter from './routes/ai-integration.routes';
import reportsRouter from './routes/reports.routes';
import chatRouter from './routes/chat.routes';
import ticketRouter from './routes/tickets.routes';
import dashboardRouter from './routes/dashboard.routes';
import realtimeRouter from './routes/realtime.routes';
import analyticsRouter from './routes/analytics.routes';

// WebSocket Gateway
import { RideGateway } from './websocket/ride.gateway';

// ===========================================
// MIDDLEWARE
// ===========================================

// Security - CORS configured securely
const corsOptions: cors.CorsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
};
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===========================================
// INITIALIZE SERVICES
// ===========================================

// Initialize services with models - models are registered via imports above
const mapsService = new MapsService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

const walletService = new WalletService(
  mongoose.model('RideWallet') as any,
  mongoose.model('WalletTransaction') as any
);

const notificationService = new NotificationService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

const adsService = new AdsService(
  mongoose.model('Ride') as any,
  mongoose.model('User') as any,
  {
    get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
  } as any
);

const voucherService = new VoucherService(
  mongoose.model('Voucher') as any,
  mongoose.model('Campaign') as any,
  walletService
);

const driverService = new DriverService(
  mongoose.model('Driver') as any,
  mongoose.model('Ride') as any
);

const authService = new AuthService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

const rideService = new RideService(
  mongoose.model('Ride') as any,
  mongoose.model('User') as any,
  mongoose.model('Driver') as any,
  mongoose.model('Voucher') as any,
  mapsService,
  walletService,
  voucherService,
  notificationService,
  adsService
);

// Initialize WebSocket Gateway
const rideGateway = new RideGateway(rideService, driverService, adsService, undefined);

// Register services with app
app.set('rideService', rideService);
app.set('driverService', driverService);
app.set('mapsService', mapsService);
app.set('walletService', walletService);
app.set('voucherService', voucherService);
app.set('notificationService', notificationService);
app.set('adsService', adsService);
app.set('authService', authService);

// ===========================================
// ROUTES - ALL PROTECTED WITH AUTH
// ===========================================

// Import auth middleware
import { requireAuth, requireInternalAuth } from './middleware/auth.middleware';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Public routes (no auth required)
app.use('/api/auth', authRoutes); // OTP, login, register
app.use('/api/webhooks', webhooksRouter); // Webhooks use signature verification
app.use('/api/analytics', analyticsRouter); // Analytics events (rate limited)
app.use('/health', (req, res) => res.json({ status: 'ok' })); // Health check

// Authenticated routes - require JWT
app.use('/api/rides', requireAuth(), ridesRouter);
app.use('/api/drivers', requireAuth(), driversRouter);
app.use('/api/fares', requireAuth(), faresRouter);
app.use('/api/vouchers', requireAuth(), vouchersRouter);
app.use('/api/payouts', requireAuth(), payoutRouter);
app.use('/api/surge', requireAuth(), surgeRouter);
app.use('/api/cities', requireAuth(), cityRouter);
app.use('/api/scheduled', requireAuth(), scheduledRouter);
app.use('/api/corporate', requireAuth(), corporateRouter);
app.use('/api/quests', requireAuth(), questsRouter);
app.use('/api/airports', requireAuth(), airportRouter);
app.use('/api/gift-cards', requireAuth(), giftCardsRouter);
app.use('/api/quick', requireAuth(), quickRideRouter);
app.use('/api/green', requireAuth(), greenRouter);
app.use('/api/voice', requireAuth(), voiceRouter);
app.use('/api/ai', requireAuth(), aiRouter);
app.use('/api/reports', requireAuth(), reportsRouter);
app.use('/api/chat', requireAuth(), chatRouter);
app.use('/api/tickets', requireAuth(), ticketRouter);
app.use('/api/geo', requireAuth(), geoRouter);
app.use('/api/dashboard', requireAuth(), dashboardRouter);
app.use('/api/realtime', requireAuth(), realtimeRouter);
app.use('/api/subscription', requireAuth(), subscriptionRoutes);
app.use('/api/commerce', requireAuth(), commerceRoutes);
app.use('/api/predictions', requireAuth(), predictionsRoutes);
app.use('/api/safety', requireAuth(), safetyRoutes);

// Admin routes - require admin role
app.use('/api/admin', requireAuth('admin'), adminRouter);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'ReZ Ride API',
    version: '1.0.0',
    description: 'India\'s first commission-free ride-hailing platform',
  });
});

// ===========================================
// SOCKET.IO EVENTS
// ===========================================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Handle driver join
  socket.on('driver:join', (data) => {
    socket.join(`driver:${data.driverId}`);
    logger.info(`Driver ${data.driverId} joined`);
  });

  // Handle user join
  socket.on('user:join', (data) => {
    socket.join(`user:${data.userId}`);
    logger.info(`User ${data.userId} joined`);
  });

  // Handle location updates
  socket.on('driver:location', async (data) => {
    await driverService.updateLocation(data.driverId, data.location);

    // Get active ride
    const activeRide = await rideService.getDriverActiveRide(data.driverId);

    if (activeRide) {
      io.to(`user:${activeRide.userId}`).emit('ride:driver_location', {
        rideId: activeRide._id.toString(),
        location: data.location,
      });
    }
  });

  // Handle screen join
  socket.on('screen:join', (data) => {
    socket.join(`screen:${data.screenId}`);
    logger.info(`Screen ${data.screenId} joined`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ===========================================
// DATABASE CONNECTION
// ===========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-ride';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
  });

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ██╗███████╗ ██████╗ ███╗   ██╗           ║
║   ██╔══██╗██╔══██╗██║██╔════╝██╔═══██╗████╗  ██║           ║
║   ██████╔╝██████╔╝██║███████╗██║   ██║██╔██╗ ██║           ║
║   ██╔═══╝ ██╔══██╗██║╚════██║██║   ██║██║╚██╗██║           ║
║   ██║     ██║  ██║██║███████║╚██████╔╝██║ ╚████║           ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝           ║
║                                                               ║
║   Ride API Server                                             ║
║   Port: ${PORT}                                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                ║
║                                                               ║
║   "Rides that pay you back"                                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await mongoose.connection.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io, httpServer };
