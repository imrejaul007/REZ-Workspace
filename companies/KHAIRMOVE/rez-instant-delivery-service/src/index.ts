import { logger } from '../../shared/logger';
import express from 'express';
import mongoose from 'mongoose';
import deliveryRoutes from './routes/delivery';

const app = express();
const PORT = process.env.PORT || 3084;

app.use(express.json());
app.use('/api/delivery', deliveryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-instant-delivery' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_delivery')
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Instant Delivery Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('MongoDB error:', err);
    process.exit(1);
  });
