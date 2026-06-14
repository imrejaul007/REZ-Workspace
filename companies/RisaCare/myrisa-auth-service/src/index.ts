import { logger } from '../../shared/logger';
/**
 * MyRisa Auth Service
 * Port: 4910
 */

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4910', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-auth-service',
    status: 'healthy',
    version: '1.0.0',
    integrations: ['RABTUL Auth (4002)'],
    timestamp: new Date().toISOString()
  });
});

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 MyRisa Auth Service                                ║
║                                                           ║
║   RABTUL Integration • JWT Tokens • OAuth               ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;