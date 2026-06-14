/**
 * Atlas Intelligence - Business Intelligence Hub
 * Central AI analytics platform
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5160;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json({ metrics: {}, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🧠 Atlas Intelligence running on port ${PORT}`));
export default app;
