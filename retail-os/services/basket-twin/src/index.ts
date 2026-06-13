import express from 'express';
import { getBasketRouter } from './routes/basket.routes';
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
const PORT = process.env.BASKET_TWIN_PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'basket-twin', timestamp: new Date().toISOString() });
});

app.use('/api/v1/baskets', getBasketRouter());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  logger.info(`Basket twin service running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app };