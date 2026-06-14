import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import giftCardsRoutes from './routes/giftCardsRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3110;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-gift-cards', timestamp: new Date().toISOString() }));
app.use('/api', giftCardsRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Gift Cards running on port ${PORT}`));
export default app;
