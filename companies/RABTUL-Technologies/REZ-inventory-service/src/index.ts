import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4101;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-inventory-service', timestamp: new Date().toISOString() });
});

app.use('/api', inventoryRoutes);

app.listen(PORT, () => {
  logger.info(`REZ Inventory Service running on port ${PORT}`);
});

export default app;
