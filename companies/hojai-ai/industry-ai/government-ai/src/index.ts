/**
 * Government AI Service - Industry AI Vertical
 * "AI-Powered Government Services"
 *
 * Features:
 * - Citizen Service Navigation
 * - Permit/License Processing
 * - Grievance Redressal
 * - Benefit Eligibility
 * - Compliance Checking
 *
 * @module government-ai
 * @version 1.0.0
 * @port 4511
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4511', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Health endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'government-ai',
    version: '1.0.0',
    tagline: 'AI-Powered Government Services',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    agents: ['Citizen Services Agent', 'Permit Agent', 'Grievance Agent', 'Compliance Agent']
  });
});

// AI Agents endpoint
app.get('/ai/agents', (req: Request, res: Response) => {
  res.json({
    active: true,
    agents: [
      {
        name: 'Citizen Services Agent',
        status: 'active',
        capabilities: ['Service navigation', 'Document verification', 'Application tracking', 'Scheme matching']
      },
      {
        name: 'Permit Agent',
        status: 'active',
        capabilities: ['Permit processing', 'License management', 'Status updates', 'Renewal reminders']
      },
      {
        name: 'Grievance Agent',
        status: 'active',
        capabilities: ['Complaint handling', 'Status tracking', 'Escalation', 'Resolution suggestions']
      },
      {
        name: 'Compliance Agent',
        status: 'active',
        capabilities: ['Policy compliance', 'Audit support', 'Reporting', 'Regulation checking']
      }
    ]
  });
});

// Government services routes
import citizenServicesRoutes from './routes/citizen-services.js';
import permitsRoutes from './routes/permits.js';
import benefitsRoutes from './routes/benefits.js';
import complaintsRoutes from './routes/complaints.js';

app.use('/api/citizen-services', citizenServicesRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/benefits', benefitsRoutes);
app.use('/api/complaints', complaintsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Government AI',
    tagline: 'AI-Powered Government Services',
    version: '1.0.0',
    description: 'Industry AI Vertical for Government Services',
    port: PORT,
    agents: ['Citizen Services Agent', 'Permit Agent', 'Grievance Agent', 'Compliance Agent'],
    endpoints: [
      'GET /api/citizen-services',
      'GET /api/permits',
      'GET /api/benefits',
      'GET /api/complaints',
      'POST /api/ai/check-eligibility',
      'GET /ai/agents'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  GOVERNMENT AI - Industry AI Vertical                            ║
║  "AI-Powered Government Services"                                ║
║  Port: ${PORT}                                                     ║
║                                                                  ║
║  Agents:                                                         ║
║  • Citizen Services Agent - Service navigation, document verify   ║
║  • Permit Agent - License management, status tracking             ║
║  • Grievance Agent - Complaint handling, escalation             ║
║  • Compliance Agent - Policy compliance, audit support           ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
