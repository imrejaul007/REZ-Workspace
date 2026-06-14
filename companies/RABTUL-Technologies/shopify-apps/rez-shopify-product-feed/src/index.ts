import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import feedRoutes from './routes/feedRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3116;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-product-feed', timestamp: new Date().toISOString() }));
app.use('/api', feedRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Product Feed running on port ${PORT}`));
export default app;
