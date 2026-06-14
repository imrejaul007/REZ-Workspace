import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 4520;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip });
  next();
});

// Routes - Screen Management
app.use('/api/screens', createProxy('/api/screens', 4521));

// Routes - Inventory Management
app.use('/api/inventory', createProxy('/api/inventory', 4522));

// Routes - Bidding
app.use('/api/bids', createProxy('/api/bids', 4523));

// Routes - Revenue
app.use('/api/revenue', createProxy('/api/revenue', 4524));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ssp-gateway', port: PORT });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

function createProxy(basePath: string, targetPort: number) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const axios = (await import('axios')).default;
      const targetUrl = `http://localhost:${targetPort}${req.originalUrl}`;
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: { ...req.headers, host: undefined }
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error({ error: error.message, path: req.path, targetPort });
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
    }
  };
}

app.listen(PORT, () => {
  logger.info(`SSP Gateway running on port ${PORT}`);
});

export default app;
