import { logger } from '../../shared/logger';
/**
 * MyRisa Sexual Wellness Service
 * Port: 4821
 */

import express from 'express';
import sexualWellnessRoutes from './routes/sexualWellnessRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4821', 10);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-sexual-wellness-service',
    status: 'healthy',
    version: '1.0.0',
    domains: ['Libido', 'Contraception', 'Reproductive Health', 'Intimacy'],
    timestamp: new Date().toISOString()
  });
});

app.use('/api', sexualWellnessRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💜 MyRisa Sexual Wellness Service                       ║
║                                                           ║
║   Libido • Contraception • Reproductive Health • Intimacy║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;