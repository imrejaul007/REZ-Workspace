/**
 * Atlas Workforce Core - AI Employee Management
 * AI-native workforce for field sales teams
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5200;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// In-memory storage (use MongoDB in production)
const employees: Map<string, any> = new Map();
const teams: Map<string, any> = new Map();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'atlas-workforce-core',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============ EMPLOYEES ============

app.get('/api/employees', (req: Request, res: Response) => {
  const { teamId, role, status } = req.query;
  let result = Array.from(employees.values());

  if (teamId) result = result.filter(e => e.teamId === teamId);
  if (role) result = result.filter(e => e.role === role);
  if (status) result = result.filter(e => e.status === status);

  res.json({ count: result.length, employees: result });
});

app.get('/api/employees/:id', (req: Request, res: Response) => {
  const employee = employees.get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

app.post('/api/employees', (req: Request, res: Response) => {
  const id = uuidv4();
  const employee = { id, ...req.body, createdAt: new Date().toISOString() };
  employees.set(id, employee);
  res.status(201).json(employee);
});

app.put('/api/employees/:id', (req: Request, res: Response) => {
  const employee = employees.get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const updated = { ...employee, ...req.body, updatedAt: new Date().toISOString() };
  employees.set(req.params.id, updated);
  res.json(updated);
});

// ============ TEAMS ============

app.get('/api/teams', (req: Request, res: Response) => {
  const teamsList = Array.from(teams.values());
  res.json({ count: teamsList.length, teams: teamsList });
});

app.get('/api/teams/:id', (req: Request, res: Response) => {
  const team = teams.get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

app.post('/api/teams', (req: Request, res: Response) => {
  const id = uuidv4();
  const team = { id, ...req.body, createdAt: new Date().toISOString() };
  teams.set(id, team);
  res.status(201).json(team);
});

// ============ PERFORMANCE ============

app.get('/api/employees/:id/performance', (req: Request, res: Response) => {
  const employee = employees.get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  res.json({
    employeeId: req.params.id,
    period: req.query.period || 'month',
    metrics: {
      visits: Math.floor(Math.random() * 100) + 50,
      conversions: Math.floor(Math.random() * 30) + 10,
      revenue: Math.floor(Math.random() * 500000) + 100000,
      NPS: Math.floor(Math.random() * 40) + 60
    },
    trend: 'up',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Atlas Workforce Core running on port ${PORT}`);
});

export default app;
