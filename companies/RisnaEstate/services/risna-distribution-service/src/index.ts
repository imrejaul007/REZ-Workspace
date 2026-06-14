import 'dotenv/config';
process.env.SERVICE_NAME = 'risna-distribution-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import distributionRoutes from './routes/distribution.routes';
import { logger } from './config/logger';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '4113', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-distribution';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => successResponse(res, { status: 'ok', service: 'distribution' }));
app.use('/api/v1/distribution', distributionRoutes);

mongoose.connect(MONGODB_URI).then(() => {
  logger.info('[MongoDB] Connected');
  app.listen(PORT, () => logger.info('Distribution service on :' + PORT));
});
