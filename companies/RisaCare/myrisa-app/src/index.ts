import { logger } from '../../shared/logger';
/**
 * MyRisa App - Personal Wellbeing Intelligence Platform
 * Port: 4900
 *
 * Unified consumer interface for all wellbeing domains
 */

import express from 'express';
import cors from 'cors';
import myrismaRoutes from './routes/myrisaRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4900', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-app',
    status: 'healthy',
    version: '1.0.0',
    tagline: 'Your Health. Understood.',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'MyRisa',
    tagline: 'Your Health. Understood.',
    description: 'Personal Wellbeing Intelligence Platform',
    version: '1.0.0',

    domains: [
      { id: 'womens-health', name: "Women's Health", icon: '🌸', color: '#E57373' },
      { id: 'sexual-wellness', name: 'Sexual Wellness', icon: '💜', color: '#BA68C8' },
      { id: 'mental', name: 'Mental Wellness', icon: '🧠', color: '#7986CB' },
      { id: 'sleep', name: 'Sleep', icon: '😴', color: '#5C6BC0' },
      { id: 'lifestyle', name: 'Lifestyle', icon: '🏃', color: '#4DB6AC' },
      { id: 'worklife', name: 'Work-Life', icon: '⚡', color: '#FFB74D' },
      { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: '#81C784' },
      { id: 'relationships', name: 'Relationships', icon: '❤️', color: '#EF5350' }
    ],

    features: [
      'Unified Dashboard',
      'Human Twin',
      'Health Insights',
      'Consultation Copilot',
      'Cross-Domain Intelligence'
    ],

    endpoints: {
      dashboard: '/api/dashboard/:userId',
      womensHealth: '/api/womens-health/*',
      sexualWellness: '/api/sexual-wellness/*',
      mental: '/api/mental/*',
      sleep: '/api/sleep/*',
      worklife: '/api/worklife/*',
      relationships: '/api/relationships/*',
      twin: '/api/twin/*',
      consultations: '/api/consultations/*'
    },

    integration: {
      womensHealthService: 'http://localhost:4820',
      sexualWellnessService: 'http://localhost:4821',
      worklifeService: 'http://localhost:4822',
      relationshipsService: 'http://localhost:4823',
      humanTwinService: 'http://localhost:4824',
      consultationCopilot: 'http://localhost:4825',
      mentalHealthService: 'http://localhost:4722',
      sleepService: 'http://localhost:4729',
      wellnessService: 'http://localhost:4703',
      careCircle: 'http://localhost:4706'
    },

    documentation: {
      overview: 'MyRisa unifies all wellbeing domains into a single platform',
      humanTwin: 'Your complete health twin that learns from all domains',
      insights: 'AI-powered insights that connect your health patterns'
    }
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', myrismaRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███╗   ███╗███████╗██╗ ██████╗ ███╗   ██╗                      ║
║   ████╗ ████║██╔════╝╚██╗██╔═══██╗████╗  ██║                      ║
║   ██╔████╔██║█████╗   ██║██║   ██║██╔██╗ ██║                      ║
║   ██║╚██╔╝██║██╔══╝   ██║██║   ██║██║╚██╗██║                      ║
║   ██║ ╚═╝ ██║███████╗██╔╝╚██████╔╝██║ ╚████║                      ║
║   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═════╝ ╚═╝  ╚═══╝                      ║
║                                                                   ║
║   ███████╗██╗  ██╗██████╗ ███████╗██████╗ ██╗   ██╗ █████╗║
║   ██╔════╝╚██╗██╔╝██╔══██╗██╔════╝██╔══██╗██║   ██║██╔══██║
║   █████╗   ╚███╔╝ ██████╔╝█████╗  ██████╔╝██║   ██║███████║
║   ██╔══╝   ██╔██╗ ██╔═══╝ ██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══██║
║   ███████╗██╔╝ ██╗██║     ███████╗██║  ██║ ╚████╔╝ ██║  ██║
║   ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝
║                                                                   ║
║   Your Health. Understood.                                          ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Personal Wellbeing Intelligence Platform                          ║
║                                                                   ║
║   🌸 Women's Health    💜 Sexual Wellness    🧠 Mental Wellness    ║
║   😴 Sleep            ⚡ Work-Life Balance   ❤️ Relationships      ║
║                                                                   ║
║   ─────────────────────────────────────────────────────────────   ║
║                                                                   ║
║   Human Twin • Cross-Domain Intelligence • Consultation Copilot   ║
║                                                                   ║
║   Port: ${PORT}                                                       ║
║                                                                   ║
║   Integrates: 4820-4825, 4703, 4722, 4729, 4706                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
});

export default app;