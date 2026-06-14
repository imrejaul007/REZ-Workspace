import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { connectDatabase } from './database.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 4025;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - Whitelist only
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://now.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-table-qr-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use('/api', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RABTUL Table QR Service',
    description: 'QR code generation for RestaurantOS table ordering',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateTableQR: 'POST /api/tables/:restaurantId/generate',
      generateBatchQRCodes: 'POST /api/tables/:restaurantId/generate-batch',
      getRestaurantQRCodes: 'GET /api/tables/:restaurantId',
      getTableQR: 'GET /api/tables/:restaurantId/:tableNumber',
      updateTable: 'PATCH /api/tables/:restaurantId/:tableNumber',
      deleteTableQR: 'DELETE /api/tables/:restaurantId/:tableNumber',
      getQRImage: 'GET /api/qr/:id/image',
      verifyQR: 'POST /api/verify',
      scanQR: 'POST /api/scan',
    },
  })
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  })
})

// Start server
async function start() {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║           RABTUL Table QR Service v2.0.0                   ║
║═══════════════════════════════════════════════════════════════║
║  Status:  RUNNING                                           ║
║  Port:    ${PORT}                                              ║
║  Database: MongoDB ✅                                        ║
║  Purpose: QR code generation for RestaurantOS                ║
║           Table scan → Menu → Order → Pay                   ║
╚═══════════════════════════════════════════════════════════════╝
      `)
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start:', { error: message })
    process.exit(1)
  }
}

start()

export default app
