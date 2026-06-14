import 'dotenv/config';
process.env.SERVICE_NAME = 'risna-intelligence-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './config/logger';
import intelligenceRoutes from './routes/intelligence.routes';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '4110', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => successResponse(res, { status: 'ok', service: 'intelligence' }));
app.use('/api/v1/intelligence', intelligenceRoutes);

app.listen(PORT, () => logger.info('Intelligence service on :' + PORT));
