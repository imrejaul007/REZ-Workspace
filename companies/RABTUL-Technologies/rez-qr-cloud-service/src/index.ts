/**
 * REZ QR Cloud Service - Stabilized Version
 * Port: 4300
 *
 * Features:
 * - MongoDB database
 * - API key authentication
 * - RABTUL Payments integration
 * - RABTUL Wallet integration
 * - Event bus
 * - Rate limiting
 * - WebSocket for real-time updates
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

import { config } from './config';
import { connectDatabase } from './database';
import { initWebSocket } from './websocket';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

// CORS - Whitelist only (SECURITY FIX)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://now.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (mobile, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize WebSocket
initWebSocket(httpServer);

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'REZ QR Cloud Service',
    version: '2.1.0',
    description: 'Stabilized QR commerce platform with MongoDB, Auth, Payments, Wallet, WebSocket',
    features: [
      'MongoDB Database',
      'API Key Authentication',
      'RABTUL Payments Integration',
      'RABTUL Wallet Integration',
      'Event Bus',
      'Rate Limiting',
      'WebSocket (Real-time Updates)'
    ],
    websocket: '/socket.io',
    docs: '/api',
    health: '/api/health'
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    httpServer.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   REZ QR Cloud Service - STABILIZED v2.1               ║
║   ─────────────────────────────────────                    ║
║                                                            ║
║   Version:    2.1.0                                       ║
║   Port:       ${config.port}                                          ║
║   Environment: ${config.env}                               ║
║                                                            ║
║   MongoDB:    Connected                                   ║
║   WebSocket:  Enabled                                     ║
║                                                            ║
║   Features:                                                ║
║   ├── MongoDB Database ✅                                ║
║   ├── API Key Auth ✅                                    ║
║   ├── RABTUL Payments ✅                                ║
║   ├── RABTUL Wallet ✅                                  ║
║   ├── Event Bus ✅                                      ║
║   ├── Rate Limiting ✅                                  ║
║   └── WebSocket ✅                                      ║
║                                                            ║
║   Health:    http://localhost:${config.port}/api/health             ║
║   Docs:      http://localhost:${config.port}/api                   ║
║   WebSocket: http://localhost:${config.port}/socket.io              ║
║                                                            ║
║   Started:   ${new Date().toISOString()}                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app, httpServer };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-qr-cloud-service',
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
