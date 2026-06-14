import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import referralsRoutes from './routes/referralsRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3113;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-referrals', timestamp: new Date().toISOString() }));
app.use('/api', referralsRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Referrals running on port ${PORT}`));
export default app;
