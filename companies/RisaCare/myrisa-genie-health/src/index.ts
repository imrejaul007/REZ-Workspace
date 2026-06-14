import { logger } from '../../shared/logger';
/**
 * MyRisa Genie Health Service
 * Port: 4920
 * AI Health Assistant for MyRisa
 */

import express from 'express';
import cors from 'cors';
import genieHealthRoutes from './routes/genieHealthRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4920', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-genie-health',
    status: 'healthy',
    version: '1.0.0',
    tagline: 'Your AI Health Companion',
    integrations: ['HOJAI AI', 'Genie Memory', 'MyRisa Services'],
    timestamp: new Date().toISOString()
  });
});

app.use('/genie', genieHealthRoutes);

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧞 MyRisa Genie Health                                 ║
║                                                           ║
║   Your AI Health Companion                                ║
║                                                           ║
║   Integrations:                                         ║
║   • HOJAI AI (LLM, Memory)                              ║
║   • Genie Memory (Personal Context)                     ║
║   • MyRisa Services (Health Data)                       ║
║                                                           ║
║   Port: ${PORT}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;