/**
 * Atlas Revenue OS - Revenue Operations System
 * Central revenue operations platform
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5183;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-revenue-os', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/pipeline', (req: Request, res: Response) => {
  res.json({ pipeline: {}, deals: [], timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`💰 Atlas Revenue OS running on port ${PORT}`));
export default app;
