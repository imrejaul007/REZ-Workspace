import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bundlesRoutes from './routes/bundlesRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3109;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-bundles', timestamp: new Date().toISOString() }));
app.use('/api', bundlesRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Bundles running on port ${PORT}`));
export default app;
