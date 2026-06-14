import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit';
import personasRoutes from './routes/personas';
import contactsRoutes from './routes/contacts';
import stakeholderMapsRoutes from './routes/stakeholderMaps';
import matrixRoutes from './routes/matrix';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-User-ID'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'REZ-buyer-mapping-service',
    version: '1.0.0',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/v1/personas', personasRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/stakeholder-maps', stakeholderMapsRoutes);
app.use('/api/v1/matrix', matrixRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
const PORT = parseInt(process.env.PORT || '4134');

async function start(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_buyer_mapping';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`REZ Buyer Mapping Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

start();

export { app };
