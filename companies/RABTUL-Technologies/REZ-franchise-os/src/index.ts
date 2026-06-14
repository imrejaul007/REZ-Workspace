import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import franchiseRoutes from './routes/franchise';
import logger from './utils/logger';

const app: Application = express();
const PORT = process.env.PORT || 4341;

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'REZ-franchise-os', port: PORT });
});

app.use('/api', franchiseRoutes);

app.use((err: Error, req: Request, res: Response, _next: unknown) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`REZ Franchise OS running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
