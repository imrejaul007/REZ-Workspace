/**
 * REZ Save - Savings Goals
 * Track savings goals, progress, contributions
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

import { v4 as uuidv4 } from 'uuid';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
};

const app = express();
const PORT = parseInt(process.env.PORT || '3014', 10);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// STORES
// ============================================

const goals = new Map();
const contributions = new Map();

// ============================================
// HEALTH
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-save',
    version: '1.0.0',
    stats: { goals: goals.size }
  });
});

// ============================================
// GOALS
// ============================================

app.post('/api/goals', (req, res) => {
  const { userId, name, targetAmount, deadline, category, icon } = req.body;

  if (!userId || !name || !targetAmount) {
    return res.status(400).json({ success: false, error: 'userId, name, targetAmount required' });
  }

  const goal = {
    id: uuidv4(),
    userId,
    name,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    deadline: deadline ? new Date(deadline) : null,
    category: category || 'general',
    icon: icon || '🎯',
    status: 'active',
    createdAt: new Date()
  };

  goals.set(goal.id, goal);
  logger.info(`Goal created: ${goal.id}`);

  res.json({ success: true, goal });
});

app.get('/api/goals', (req, res) => {
  const { userId, status } = req.query;
  let list = Array.from(goals.values());

  if (userId) list = list.filter(g => g.userId === userId);
  if (status) list = list.filter(g => g.status === status);

  res.json({ success: true, goals: list, count: list.length });
});

app.get('/api/goals/:id', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, goal });
});

app.put('/api/goals/:id', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) return res.status(404).json({ success: false, error: 'Not found' });

  const updated = { ...goal, ...req.body, updatedAt: new Date() };
  goals.set(req.params.id, updated);
  res.json({ success: true, goal: updated });
});

app.delete('/api/goals/:id', (req, res) => {
  if (!goals.has(req.params.id)) return res.status(404).json({ success: false, error: 'Not found' });
  goals.delete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ============================================
// CONTRIBUTIONS
// ============================================

app.post('/api/contributions', (req, res) => {
  const { goalId, amount, note } = req.body;

  if (!goalId || !amount) {
    return res.status(400).json({ success: false, error: 'goalId, amount required' });
  }

  const goal = goals.get(goalId);
  if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });

  const contribution = {
    id: uuidv4(),
    goalId,
    amount: parseFloat(amount),
    note: note || '',
    createdAt: new Date()
  };

  contributions.set(contribution.id, contribution);

  // Update goal
  goal.currentAmount += contribution.amount;
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
    goal.completedAt = new Date();
  }
  goals.set(goalId, goal);

  res.json({ success: true, contribution, goal });
});

app.get('/api/contributions/:goalId', (req, res) => {
  const goalContributions = Array.from(contributions.values()).filter(c => c.goalId === req.params.goalId);
  res.json({ success: true, contributions: goalContributions });
});

// ============================================
// SUMMARY
// ============================================

app.get('/api/summary/:userId', (req, res) => {
  const userGoals = Array.from(goals.values()).filter(g => g.userId === req.params.userId);

  const totalSaved = userGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = userGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  res.json({
    success: true,
    summary: {
      totalGoals: userGoals.length,
      activeGoals: userGoals.filter(g => g.status === 'active').length,
      completedGoals: userGoals.filter(g => g.status === 'completed').length,
      totalSaved,
      totalTarget,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    }
  });
});

app.listen(PORT, () => logger.info(`REZ Save started on port ${PORT}`));

export default app;