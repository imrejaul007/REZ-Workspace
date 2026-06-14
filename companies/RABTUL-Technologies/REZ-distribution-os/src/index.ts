import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import distributionRoutes from './routes/distribution';
import logger from './utils/logger';

const app: Application = express();
const PORT = process.env.PORT || 4340;

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'REZ-distribution-os', port: PORT });
});

app.use('/api', distributionRoutes);

app.use((err: Error, req: Request, res: Response, _next: unknown) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`REZ Distribution OS running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
