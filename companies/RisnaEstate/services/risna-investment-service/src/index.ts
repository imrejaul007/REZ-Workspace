import 'dotenv/config';
process.env.SERVICE_NAME = 'risna-investment-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import investmentRoutes from './routes/investment.routes';
import { logger } from './config/logger';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '4112', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => successResponse(res, { status: 'ok', service: 'investment' }));
app.use('/api/v1/investment', investmentRoutes);

app.listen(PORT, () => logger.info('Investment service on :' + PORT));
