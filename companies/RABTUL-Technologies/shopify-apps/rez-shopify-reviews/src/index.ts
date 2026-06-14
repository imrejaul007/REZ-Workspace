import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import reviewsRoutes from './routes/reviewsRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3108;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-reviews', timestamp: new Date().toISOString() }));
app.use('/api', reviewsRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Reviews running on port ${PORT}`));
export default app;
