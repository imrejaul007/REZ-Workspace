import 'dotenv/config';
process.env.SERVICE_NAME = 'risna-whatsapp-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { logger } from './config/logger';
import whatsappRoutes from './routes/whatsapp.routes';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '4111', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-whatsapp';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  successResponse(res, { status: 'ok', service: 'whatsapp', mongo: mongoOk });
});

app.use('/api/v1/whatsapp', whatsappRoutes);

mongoose.connect(MONGODB_URI).then(() => {
  logger.info('[MongoDB] Connected');
  app.listen(PORT, () => logger.info('WhatsApp service on :' + PORT));
});
