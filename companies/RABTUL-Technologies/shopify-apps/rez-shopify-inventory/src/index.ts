import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3114;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-inventory', timestamp: new Date().toISOString() }));
app.use('/api', inventoryRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Inventory running on port ${PORT}`));
export default app;
