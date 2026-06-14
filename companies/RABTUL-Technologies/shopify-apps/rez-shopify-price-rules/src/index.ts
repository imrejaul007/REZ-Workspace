import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import priceRulesRoutes from './routes/priceRulesRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3117;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-price-rules', timestamp: new Date().toISOString() }));
app.use('/api', priceRulesRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Price Rules running on port ${PORT}`));
export default app;
