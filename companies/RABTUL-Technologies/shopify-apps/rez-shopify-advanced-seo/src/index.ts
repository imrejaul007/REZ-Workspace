import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import seoRoutes from './routes/seoRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3115;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-advanced-seo', timestamp: new Date().toISOString() }));
app.use('/api', seoRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Advanced SEO running on port ${PORT}`));
export default app;
