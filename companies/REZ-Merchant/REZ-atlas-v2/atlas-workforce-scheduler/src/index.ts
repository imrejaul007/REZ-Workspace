/**
 * Atlas Workforce Scheduler - AI-Powered Scheduling
 * Intelligent workforce allocation and route planning
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5220;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const schedules: Map<string, any> = new Map();

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-workforce-scheduler', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/schedules', (req: Request, res: Response) => {
  const { date, employeeId } = req.query;
  let result = Array.from(schedules.values());
  if (date) result = result.filter(s => s.date === date);
  if (employeeId) result = result.filter(s => s.employeeId === employeeId);
  res.json({ count: result.length, schedules: result });
});

app.post('/api/schedules/generate', (req: Request, res: Response) => {
  const { date, territoryId, employees } = req.body;
  const schedule = {
    id: uuidv4(),
    date: date || new Date().toISOString().split('T')[0],
    territoryId,
    routes: employees.map((emp: string) => ({
      employeeId: emp,
      stops: Math.floor(Math.random() * 10) + 5,
      estimatedTime: `${Math.floor(Math.random() * 4) + 6}:00`,
      priority: 'balanced'
    })),
    status: 'generated',
    createdAt: new Date().toISOString()
  };
  schedules.set(schedule.id, schedule);
  res.json(schedule);
});

app.listen(PORT, () => console.log(`📅 Atlas Workforce Scheduler running on port ${PORT}`));
export default app;
