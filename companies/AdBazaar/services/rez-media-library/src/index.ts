import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { assetRoutes } from './routes/asset.routes';
import { collectionRoutes } from './routes/collection.routes';
import { folderRoutes } from './routes/folder.routes';
import { uploadRoutes } from './routes/upload.routes';

config();

const app = express();
const PORT = process.env.PORT || 4620;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-media-library',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/folders', folderRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  logger.info(`REZ Media Library Service running on port ${PORT}`);
});

export default app;
