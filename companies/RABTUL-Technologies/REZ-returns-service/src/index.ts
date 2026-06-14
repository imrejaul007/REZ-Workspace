import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rapp.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

  ateLimit from 'express-rate-limit';
import returnsRoutes from './routes/returnsRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4103;

app.use(helmet());

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' }
});
app.use(rateLimiter);
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-returns-service', timestamp: new Date().toISOString() });
});

app.use('/api', returnsRoutes);


// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(JSON.stringify({ type: 'error', error: err.message, requestId: (req as any).requestId }));
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`REZ Returns Service running on port ${PORT}`);
});

export default app;
