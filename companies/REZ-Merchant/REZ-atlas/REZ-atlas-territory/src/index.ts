/**
 * REZ Atlas Territory - Sales Territory Management
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { territoryRoutes } from './routes/territory.js';

const PORT = process.env.PORT || 5170;
const app = express();

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  res.setHeader('X-Request-ID', requestId);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-atlas-territory',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', territoryRoutes);

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🗺️  REZ ATLAS TERRITORY                                   ║
║   Sales Territory Management                                 ║
║                                                               ║
║   Port: ${PORT}                                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;