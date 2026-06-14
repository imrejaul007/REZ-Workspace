/**
 * Goals AI Agent - Port 4017
 * OKRs, Goal tracking, Performance alignment
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Store goals
const goals: Map<string, any> = new Map();
const okrCycles: Map<string, any> = new Map();

// Sample data
okrCycles.set('q1_2026', {
  id: 'q1_2026',
  name: 'Q1 2026',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  status: 'active',
  progress: 65,
});

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'goals', port: 4017 }));

// Get goals for employee
app.get('/goals', (req, res) => {
  const employeeId = req.query.employeeId as string;
  const cycle = req.query.cycle as string || 'q1_2026';

  const employeeGoals = Array.from(goals.values())
    .filter(g => g.employeeId === employeeId && g.cycle === cycle);

  res.json({ goals: employeeGoals, cycle });
});

// Create goal
app.post('/goals', (req, res) => {
  const { employeeId, title, description, type, cycle, parentGoalId, dueDate, metrics } = req.body;

  if (!employeeId || !title) {
    return res.status(400).json({ error: 'Employee ID and title required' });
  }

  const goalId = `goal_${Date.now()}`;
  const goal = {
    id: goalId,
    employeeId,
    title,
    description,
    type: type || 'individual', // individual, team, company
    cycle: cycle || 'q1_2026',
    parentGoalId,
    dueDate,
    metrics: metrics || [],
    progress: 0,
    status: 'not_started',
    createdAt: new Date(),
    updates: [],
  };

  goals.set(goalId, goal);

  res.json({ goal });
});

// Update goal progress
app.put('/goals/:id', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { progress, status, update } = req.body;

  if (progress !== undefined) {
    goal.progress = Math.min(100, Math.max(0, progress));
    goal.status = goal.progress >= 100 ? 'completed' : goal.progress > 0 ? 'in_progress' : 'not_started';
  }
  if (status) goal.status = status;
  if (update) {
    goal.updates.push({
      text: update,
      timestamp: new Date(),
      progress: goal.progress,
    });
  }

  res.json({ goal });
});

// Align goal to parent
app.post('/goals/:id/align', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { parentGoalId, contribution } = req.body;

  goal.parentGoalId = parentGoalId;
  goal.contribution = contribution || 0.1;

  res.json({ goal, message: 'Goal aligned to parent' });
});

// Get OKR dashboard
app.get('/dashboard', (req, res) => {
  const cycle = okrCycles.get('q1_2026');
  const allGoals = Array.from(goals.values());

  const byStatus = {
    not_started: allGoals.filter(g => g.status === 'not_started').length,
    in_progress: allGoals.filter(g => g.status === 'in_progress').length,
    completed: allGoals.filter(g => g.status === 'completed').length,
  };

  const avgProgress = allGoals.length > 0
    ? Math.round(allGoals.reduce((sum, g) => sum + g.progress, 0) / allGoals.length)
    : 0;

  res.json({
    cycle,
    summary: {
      totalGoals: allGoals.length,
      ...byStatus,
      avgProgress,
    },
    companyProgress: cycle.progress,
  });
});

// AI goal suggestions
app.post('/suggest', (req, res) => {
  const { employeeId, department } = req.body;

  const suggestions = [
    {
      title: 'Improve Customer Satisfaction',
      type: 'company',
      alignment: 'Company OKR',
      difficulty: 'medium',
      reason: 'Aligned with Q1 focus on retention',
    },
    {
      title: 'Reduce Process Time by 20%',
      type: 'team',
      alignment: 'Department Goal',
      difficulty: 'high',
      reason: 'Based on recent efficiency audit',
    },
    {
      title: 'Learn New Technology Stack',
      type: 'individual',
      alignment: 'Career Growth',
      difficulty: 'low',
      reason: 'Supports technical roadmap',
    },
  ];

  res.json({ suggestions });
});

// Check-in on goal
app.post('/goals/:id/checkin', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { progress, notes, blockers } = req.body;

  if (progress !== undefined) {
    const prevProgress = goal.progress;
    goal.progress = Math.min(100, Math.max(0, progress));

    goal.updates.push({
      type: 'checkin',
      progress: goal.progress,
      delta: goal.progress - prevProgress,
      notes,
      blockers,
      timestamp: new Date(),
    });

    goal.status = goal.progress >= 100 ? 'completed' : 'in_progress';
  }

  res.json({
    goal,
    message: 'Check-in recorded',
  });
});

// Get cycles
app.get('/cycles', (_, res) => {
  res.json({ cycles: Array.from(okrCycles.values()) });
});

const PORT = 4017;
app.listen(PORT, () => logger.info(`Goals Agent running on port ${PORT}`));
