import { logger } from '../../shared/logger';
/**
 * MyRisa Work-Life Balance Service
 * Port: 4822
 */

import express from 'express';
import worklifeRoutes from './routes/worklifeRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4822', 10);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-worklife-service',
    status: 'healthy',
    version: '1.0.0',
    domains: ['Work Hours', 'Burnout', 'Energy', 'PTO', 'Work-Life Balance'],
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'MyRisa Work-Life Balance Service',
    description: 'Burnout Risk, Energy Levels, Productivity, PTO Management',
    version: '1.0.0',
    endpoints: {
      work: '/api/work/:userId',
      score: '/api/score/:userId',
      burnout: '/api/burnout/:userId',
      pto: '/api/pto/:userId',
      insights: '/api/insights/:userId'
    }
  });
});

app.use('/api', worklifeRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ MyRisa Work-Life Balance Service                    ║
║                                                           ║
║   Burnout • Energy • Productivity • PTO                  ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;