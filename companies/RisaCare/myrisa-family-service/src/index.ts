import { logger } from '../../shared/logger';
/**
 * MyRisa Family Service
 * Port: 4930
 * Shab AI Integration for Family Health
 */

import express from 'express';
import cors from 'cors';
import familyRoutes from './routes/familyRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4930', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-family-service',
    status: 'healthy',
    version: '1.0.0',
    tagline: 'Family Health Coordination',
    integrations: ['Shab AI (4970)', 'Elder Care (4721)', 'Care Circle (4706)'],
    timestamp: new Date().toISOString()
  });
});

app.use('/family', familyRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   👨‍👩‍👧 MyRisa Family Service ║
║                                                           ║
║   Family Health Coordination                              ║
║                                                           ║
║   Integrations:                                         ║
║   • Shab AI (Family Intelligence)                       ║
║   • Elder Care                                          ║
║   • Care Circle                                         ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;