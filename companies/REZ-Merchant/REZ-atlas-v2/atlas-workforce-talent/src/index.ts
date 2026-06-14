/**
 * Atlas Workforce Talent - AI Talent Matching
 * Internal talent marketplace and skill matching
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5230;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const talents: Map<string, any> = new Map();

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-workforce-talent', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/talents', (req: Request, res: Response) => {
  const { skill, availability } = req.query;
  let result = Array.from(talents.values());
  if (skill) result = result.filter(t => t.skills?.includes(skill));
  res.json({ count: result.length, talents: result });
});

app.post('/api/talents', (req: Request, res: Response) => {
  const id = uuidv4();
  const talent = { id, ...req.body, createdAt: new Date().toISOString() };
  talents.set(id, talent);
  res.status(201).json(talent);
});

app.post('/api/match', (req: Request, res: Response) => {
  const { requirement } = req.body;
  res.json({
    matches: [
      { id: '1', name: 'Best Match', score: 95, skills: ['sales', 'restaurant'] },
      { id: '2', name: 'Good Match', score: 82, skills: ['sales', 'retail'] }
    ]
  });
});

app.listen(PORT, () => console.log(`🎯 Atlas Workforce Talent running on port ${PORT}`));
export default app;
