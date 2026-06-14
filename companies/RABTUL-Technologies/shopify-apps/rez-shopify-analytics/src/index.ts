import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3112;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-analytics', timestamp: new Date().toISOString() }));
app.use('/api', analyticsRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Analytics running on port ${PORT}`));
export default app;
