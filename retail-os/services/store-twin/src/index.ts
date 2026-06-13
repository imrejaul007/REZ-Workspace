import express from 'express';
import { getStoreRouter } from './routes/store.routes';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = process.env.STORE_TWIN_PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'store-twin', timestamp: new Date().toISOString() });
});

app.use('/api/v1/stores', getStoreRouter());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  logger.info(`Store twin service running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app };
