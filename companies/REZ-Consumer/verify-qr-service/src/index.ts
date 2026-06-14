/**
 * REZ Verify QR Service - Main Entry Point
 * Port 4003
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

import { openapiSpecification } from './swagger';

const app = express();
const PORT = process.env.PORT || 4003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verify-qr';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

function getMongoUri(): string {
  const uri = MONGODB_URI;
  if (MONGODB_USER && MONGODB_PASSWORD) {
    try {
      const url = new URL(uri);
      url.username = MONGODB_USER;
      url.password = MONGODB_PASSWORD;
      return url.toString();
    } catch {
      return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:27017/verify-qr`;
    }
  }
  return uri;
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS - Whitelist only
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://verify.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'REZ Verify QR API Documentation',
}));

// API JSON spec endpoint
app.get('/api-spec.json', (req, res) => {
  res.json(openapiSpecification);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Verify QR Service',
    version: '2.0.0',
    port: PORT,
    features: [
      // Phase 1: Core
      'serial_registry',
      'scan_verification',
      'warranty_management',
      'claim_management',
      'service_booking',
      'service_centers',
      'ownership_transfer',
      'fraud_detection',
      // Phase 1: Trust Platform
      'ownership_passport',
      'service_history',
      'resale_verification',
      // Phase 2: Ownership Infrastructure
      'ownership_certificate',
      'transfer_mechanism',
      'resale_safety_flow',
      'extended_warranty',
      'insurance_layer',
      // Phase 3: OEM Platform
      'oem_dashboard',
      'counterfeit_analytics',
      'regional_analytics',
      'fraud_maps',
      'predictive_analytics',
      'recall_campaigns',
      // Integrations
      'whatsapp_bot',
      'payment_integration',
      'push_notifications',
      'sms_notifications',
      // Extended
      'extended_warranty',
      'insurance_layer',
      'express_replacement',
      // Integrations
      'rez_care_integration',
      'rez_wallet_integration',
      'rez_intelligence_integration',
      'rez_agent_whatsapp'
    ]
  });
});

// Import routes
import merchantRoutes from './merchant';
import serviceRoutes from './service';
import merchantIntegration from './merchantIntegration';

// Import new routes (v2.0)
import ownershipPassportRoutes from './ownershipPassport';
import extendedWarrantyRoutes from './extendedWarranty';
import expressReplacementRoutes from './expressReplacement';
import oemDashboardRoutes from './oemDashboard';
import whatsappBotRoutes from './whatsappBot';
import paymentRoutes from './paymentIntegration';
import notificationRoutes from './notificationService';

// Mount routes
app.use('/api', merchantRoutes);
app.use('/api', serviceRoutes);
app.use('/api', merchantIntegration);

// Mount new v2.0 routes
try {
  app.use('/api', ownershipPassportRoutes);
  app.use('/api', extendedWarrantyRoutes);
  app.use('/api', expressReplacementRoutes);
  app.use('/oem', oemDashboardRoutes);

  // Integration routes
  app.use('/api/whatsapp', whatsappBotRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/notifications', notificationRoutes);

  logger.info('✓ v2.0 routes mounted successfully');
} catch (error) {
  console.error('Error mounting v2.0 routes:', error);
}

// Error handler
app.use((err, req: Request, res: Response, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
async function start() {
  try {
    await mongoose.connect(getMongoUri());
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`REZ Verify QR Service running on port ${PORT}`);
      logger.info(`Health: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
