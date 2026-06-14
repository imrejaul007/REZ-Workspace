import 'dotenv/config';
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'risna-gateway';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { RateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';

// Core service routes
import propertyRoutes from './routes/property.routes';
import leadRoutes from './routes/lead.routes';
import visaRoutes from './routes/visa.routes';
import referralRoutes from './routes/referral.routes';
import brokerRoutes from './routes/broker.routes';
import crmRoutes from './routes/crm.routes';
import mediaRoutes from './routes/media.routes';

// NEW: Deal, Agreement, Handover services
import dealRoutes from './routes/deal.routes';
import agreementRoutes from './routes/agreement.routes';
import handoverRoutes from './routes/handover.routes';
import propflowAIRoutes from './routes/propflow.routes';

// Intelligence service routes
import intelligenceRoutes from './routes/intelligence.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import investmentRoutes from './routes/investment.routes';
import distributionRoutes from './routes/distribution.routes';
import corpperksRoutes from './routes/corpperks.routes';
import adsRoutes from './routes/ads.routes';
import propertyIntelligenceRoutes from './routes/property-intelligence.routes';
import distributionRouterRoutes from './routes/distribution-router.routes';
import influencerRoutes from './routes/influencer.routes';

// Platform service routes
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import bookingRoutes from './routes/booking.routes';
import realtimeRoutes from './routes/realtime.routes';
import emailRoutes from './routes/email.routes';
import chatbotRoutes from './routes/chatbot.routes';

// User service routes
import documentRoutes from './routes/document.routes';
import virtualTourRoutes from './routes/virtual-tour.routes';
import pushRoutes from './routes/push.routes';

// Auth and docs routes
import authRoutes from './routes/auth.routes';
import docsRoutes from './routes/docs.routes';
import healthRoutes from './routes/health.routes';
import { logger } from './config/logger';
import { errorResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(RateLimiter);

// Health routes (no auth)
app.use('/health', healthRoutes);

// Auth routes (no auth)
app.use('/api/auth', authRoutes);

// API Docs (no auth)
app.use('/api/docs', docsRoutes);

// ============================================
// CORE SERVICES
// ============================================
app.use('/api/v1/properties', authMiddleware, propertyRoutes);
app.use('/api/v1/leads', authMiddleware, leadRoutes);
app.use('/api/v1/visa', authMiddleware, visaRoutes);
app.use('/api/v1/referrals', authMiddleware, referralRoutes);
app.use('/api/v1/brokers', authMiddleware, brokerRoutes);
app.use('/api/v1/crm', authMiddleware, crmRoutes);
app.use('/api/v1/media', authMiddleware, mediaRoutes);

// ============================================
// INTELLIGENCE SERVICES
// ============================================
app.use('/api/v1/intelligence', authMiddleware, intelligenceRoutes);
app.use('/api/v1/whatsapp', authMiddleware, whatsappRoutes);
app.use('/api/v1/investment', authMiddleware, investmentRoutes);
app.use('/api/v1/distribution', authMiddleware, distributionRoutes);
app.use('/api/v1/corpperks', authMiddleware, corpperksRoutes);
app.use('/api/v1/ads', authMiddleware, adsRoutes);
app.use('/api/v1/property-intelligence', authMiddleware, propertyIntelligenceRoutes);
app.use('/api/v1/distribution-router', authMiddleware, distributionRouterRoutes);
app.use('/api/v1/influencer', authMiddleware, influencerRoutes);

// ============================================
// PLATFORM SERVICES
// ============================================
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
app.use('/api/v1/payments', authMiddleware, paymentRoutes);
app.use('/api/v1/bookings', authMiddleware, bookingRoutes);
app.use('/api/v1/realtime', authMiddleware, realtimeRoutes);
app.use('/api/v1/email', authMiddleware, emailRoutes);
app.use('/api/v1/chatbot', authMiddleware, chatbotRoutes);

// ============================================
// USER SERVICES
// ============================================
app.use('/api/v1/documents', authMiddleware, documentRoutes);
app.use('/api/v1/virtual-tours', authMiddleware, virtualTourRoutes);
app.use('/api/v1/push', authMiddleware, pushRoutes);

// ============================================
// NEW: TRANSACTION LIFECYCLE SERVICES
// ============================================
app.use('/api/v1/deals', authMiddleware, dealRoutes);
app.use('/api/v1/agreements', authMiddleware, agreementRoutes);
app.use('/api/v1/handovers', authMiddleware, handoverRoutes);

// ============================================
// AI SERVICES (PropFlow)
// ============================================
app.use('/api/ai', propflowAIRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Gateway error: ' + err.message);
  errorResponse(res, { code: 'GATEWAY_ERROR', message: err.message });
});



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risna-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
  logger.info('RisnaEstate Gateway running on port ' + PORT + ' with 30 services');
});

export default app;
