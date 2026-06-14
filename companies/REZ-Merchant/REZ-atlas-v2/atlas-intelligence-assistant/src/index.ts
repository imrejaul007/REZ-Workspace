/**
 * Atlas Intelligence Assistant - Conversational AI
 * Natural language interface for business queries
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5390;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence-assistant', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.post('/api/chat', (req: Request, res: Response) => {
  const { message, context } = req.body;
  res.json({
    response: `Based on your data, ${message.includes('revenue') ? 'revenue grew 15% this month.' : 'here\'s the analysis.'}`,
    sources: ['analytics', 'sales'],
    actions: ['View Report', 'Export Data']
  });
});

app.listen(PORT, () => console.log(`🤖 Atlas Intelligence Assistant running on port ${PORT}`));
export default app;
