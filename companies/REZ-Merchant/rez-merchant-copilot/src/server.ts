import express from 'express';
import logger from './utils/logger';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import copilotRoutes from './routes/copilot.routes';
import orderWebhooks from './routes/orderWebhooks';
import salonRoutes from './routes/salonRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import healthcareRoutes from './routes/healthcareRoutes';
import fitnessRoutes from './routes/fitnessRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4022;

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// CORS - restrict to known origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://rez.money,https://admin.rez.money,https://merchant.rez.money').split(',');
app.use(cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Serve dashboard HTML
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API Routes
app.use('/api', copilotRoutes);
app.use('/api/webhooks', orderWebhooks);
app.use('/api/salon', salonRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/fitness', fitnessRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'merchant-copilot',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'REZ Merchant Copilot',
    version: '2.0.0',
    description: 'AI-powered business intelligence for merchants with REZ Media Insights',
    endpoints: {
      dashboard: 'GET /dashboard',
      health: 'GET /health',
      profile: 'GET /api/merchant/:id/profile',
      insights: 'GET /api/merchant/:id/insights',
      recommendations: 'GET /api/merchant/:id/recommendations',
      health_score: 'GET /api/merchant/:id/health-score',
      decisions: 'GET /api/merchant/:id/decisions',
      competitors: 'GET /api/merchant/:id/competitors',
      trends: 'GET /api/merchant/:id/trends',
      feedback: 'POST /api/merchant/:id/feedback',
      // REZ Media Insights
      chat: 'POST /api/chat',
      whatsapp_insights: 'GET /api/whatsapp/insights',
      whatsapp_campaigns: 'GET /api/whatsapp/campaigns',
      voice_insights: 'GET /api/voice/insights',
      voice_campaigns: 'GET /api/voice/campaigns',
      engagement_insights: 'GET /api/engagement/insights',
      engagement_segments: 'GET /api/engagement/segments',
      audience_insights: 'GET /api/audience/insights',
      audience_segments: 'GET /api/audience/segments',
      auto_campaign: 'POST /api/campaigns/auto',
      message_analyze: 'POST /api/messages/analyze',
      message_optimize: 'POST /api/messages/optimize',
      dashboard_overview: 'GET /api/dashboard/overview',
      dashboard_actions: 'GET /api/dashboard/actions',
    },
  });
});

// Error handling
app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  logger.info(`Merchant Copilot running on port ${PORT}`);
  logger.info(`Dashboard: http://localhost:${PORT}/dashboard`);
  logger.info(`API: http://localhost:${PORT}/api/merchant/:id/recommendations`);
});

export default app;
