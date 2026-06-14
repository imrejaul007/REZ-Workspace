/**
 * REZ Atlas v2 - Follow-up Agent
 * Automated Follow-up Sequences
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5177;

interface FollowUpSequence {
  id: string;
  name: string;
  trigger: 'no_reply' | 'no_open' | 'meeting_scheduled' | 'meeting_completed' | 'manual';
  steps: FollowUpStep[];
  active: boolean;
  createdAt: string;
}

interface FollowUpStep {
  step: number;
  delayDays: number;
  action: 'email' | 'whatsapp' | 'sms' | 'call';
  template: string;
  subject: string;
}

interface FollowUpTask {
  id: string;
  sequenceId: string;
  leadId: string;
  leadName: string;
  contactEmail: string;
  currentStep: number;
  status: 'active' | 'completed' | 'opted_out' | 'paused';
  scheduledAt: string;
  completedSteps: FollowUpStepLog[];
  createdAt: string;
  updatedAt: string;
}

interface FollowUpStepLog {
  step: number;
  action: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'skipped';
}

const sequences: Map<string, FollowUpSequence> = new Map();
const tasks: Map<string, FollowUpTask> = new Map();

// Seed default sequences
const defaultSequences: FollowUpSequence[] = [
  {
    id: uuidv4(),
    name: 'No Reply Follow-up',
    trigger: 'no_reply',
    steps: [
      { step: 1, delayDays: 3, action: 'email', template: 'follow_up_1', subject: 'Re: Quick question' },
      { step: 2, delayDays: 5, action: 'whatsapp', template: 'wa_followup', subject: '' },
      { step: 3, delayDays: 7, action: 'email', template: 'final_followup', subject: 'Last follow-up' },
      { step: 4, delayDays: 14, action: 'sms', template: 'sms_reminder', subject: '' }
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Post-Meeting Follow-up',
    trigger: 'meeting_completed',
    steps: [
      { step: 1, delayDays: 0, action: 'email', template: 'thank_you', subject: 'Thank you for your time' },
      { step: 2, delayDays: 1, action: 'email', template: 'meeting_notes', subject: 'Meeting summary' },
      { step: 3, delayDays: 3, action: 'email', template: 'proposal', subject: 'Proposal attached' }
    ],
    active: true,
    createdAt: new Date().toISOString()
  }
];
defaultSequences.forEach(s => sequences.set(s.id, s));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-followup-agent', version: '2.0.0' }));

// Get sequences
app.get('/api/sequences', (req, res) => {
  res.json({ sequences: Array.from(sequences.values()), count: sequences.size });
});

// Create sequence
app.post('/api/sequences', (req, res) => {
  const { name, trigger, steps } = req.body;
  const sequence: FollowUpSequence = {
    id: uuidv4(),
    name,
    trigger,
    steps: steps || [],
    active: true,
    createdAt: new Date().toISOString()
  };
  sequences.set(sequence.id, sequence);
  res.status(201).json(sequence);
});

// Start follow-up
app.post('/api/start', (req, res) => {
  const { sequenceId, leadId, leadName, contactEmail } = req.body;

  const sequence = sequences.get(sequenceId);
  if (!sequence) return res.status(404).json({ error: 'Sequence not found' });

  const firstStep = sequence.steps[0];
  const scheduledAt = new Date(Date.now() + firstStep.delayDays * 24 * 60 * 60 * 1000);

  const task: FollowUpTask = {
    id: uuidv4(),
    sequenceId,
    leadId,
    leadName,
    contactEmail,
    currentStep: 1,
    status: 'active',
    scheduledAt: scheduledAt.toISOString(),
    completedSteps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.set(task.id, task);
  res.status(201).json({ task, nextStep: firstStep });
});

// Get task
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const { status, limit = 50 } = req.query;
  let result = Array.from(tasks.values());
  if (status) result = result.filter(t => t.status === status);
  res.json({ tasks: result.slice(0, Number(limit)), count: result.length });
});

// Complete step
app.post('/api/tasks/:id/step', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { stepNumber, action, status } = req.body;

  task.completedSteps.push({
    step: stepNumber || task.currentStep,
    action,
    sentAt: new Date().toISOString(),
    status
  });

  // Move to next step or complete
  const sequence = sequences.get(task.sequenceId);
  if (sequence && task.currentStep < sequence.steps.length) {
    task.currentStep++;
    const nextStep = sequence.steps[task.currentStep - 1];
    task.scheduledAt = new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000).toISOString();
  } else {
    task.status = 'completed';
  }

  task.updatedAt = new Date().toISOString();
  tasks.set(task.id, task);
  res.json(task);
});

// Pause task
app.post('/api/tasks/:id/pause', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = 'paused';
  task.updatedAt = new Date().toISOString();
  tasks.set(task.id, task);
  res.json(task);
});

// Stop task
app.post('/api/tasks/:id/stop', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = 'opted_out';
  task.updatedAt = new Date().toISOString();
  tasks.set(task.id, task);
  res.json(task);
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const allTasks = Array.from(tasks.values());

  res.json({
    total: allTasks.length,
    byStatus: allTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    completionRate: (allTasks.filter(t => t.status === 'completed').length / allTasks.length * 100).toFixed(1) + '%',
    avgStepsCompleted: (allTasks.reduce((sum, t) => sum + t.completedSteps.length, 0) / allTasks.length).toFixed(1)
  });
});

app.listen(PORT, () => console.log(`🔄 Atlas Follow-up Agent running on port ${PORT}`));
export default app;