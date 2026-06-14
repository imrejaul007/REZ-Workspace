import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import socialLoginRoutes from './routes/socialLoginRoutes.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3111;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'rez-shopify-social-login', timestamp: new Date().toISOString() }));
app.use('/api', socialLoginRoutes);

app.listen(PORT, () => logger.info(`REZ Shopify Social Login running on port ${PORT}`));
export default app;
