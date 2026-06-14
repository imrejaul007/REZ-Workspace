import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shippingRoutes from './routes/shippingRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4102;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-shipping-service', timestamp: new Date().toISOString() });
});

app.use('/api', shippingRoutes);

app.listen(PORT, () => {
  logger.info(`REZ Shipping Service running on port ${PORT}`);
});

export default app;
