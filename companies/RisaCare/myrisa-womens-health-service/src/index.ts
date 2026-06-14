import { logger } from '../../shared/logger';
/**
 * MyRisa Women's Health Service
 * Port: 4820
 */

import express from 'express';
import womensHealthRoutes from './routes/womensHealthRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4820', 10);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-womens-health-service',
    status: 'healthy',
    version: '1.0.0',
    domains: ['Cycle', 'Fertility', 'Pregnancy', 'PCOS', 'Menopause'],
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'MyRisa Women\'s Health Service',
    description: 'Cycle, Fertility, Pregnancy, PCOS, Menopause',
    version: '1.0.0',
    endpoints: {
      profile: '/api/profile/:userId',
      cycles: '/api/cycles/:userId',
      fertility: '/api/fertility/:userId',
      pregnancy: '/api/pregnancy/:userId',
      pcos: '/api/pcos/:userId',
      menopause: '/api/menopause/:userId',
      reminders: '/api/reminders/:userId',
      insights: '/api/insights/:userId'
    }
  });
});

// API Routes
app.use('/api', womensHealthRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌸 MyRisa Women's Health Service                        ║
║                                                           ║
║   Cycle • Fertility • Pregnancy • PCOS • Menopause          ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;