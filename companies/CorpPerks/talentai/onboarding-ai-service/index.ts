import { logger } from '../../shared/logger';
/**
 * MyTalent Onboarding AI Service
 * Port: 4003
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4003;

// Welcome Kit
app.post('/api/onboarding/welcome', (req, res) => {
  const { employeeId, name, role, department } = req.body;

  res.json({
    kitId: `KIT-${Date.now()}`,
    employeeId,
    welcomeMessage: `Welcome to the team, ${name}!`,
    documents: [
      { doc: 'Offer Letter', status: 'pending' },
      { doc: 'NDA', status: 'pending' },
      { doc: 'Policy Acknowledgment', status: 'pending' }
    ],
    tasks: [
      { task: 'Complete KYC', status: 'pending', days: 1 },
      { task: 'Document Verification', status: 'pending', days: 3 },
      { task: 'System Access', status: 'pending', days: 1 },
      { task: 'Team Introduction', status: 'pending', days: 5 },
      { task: 'Training Completion', status: 'pending', days: 30 }
    ],
    buddy: 'Assigned AI Buddy'
  });
});

// 30-60-90 Plan
app.post('/api/onboarding/plan', (req, res) => {
  const { role, department } = req.body;

  res.json({
    planId: `PLAN-${Date.now()}`,
    role,
    phases: [
      { phase: 30, goals: ['Learn product', 'Meet team', 'Complete basics'],
      { phase: 60, goals: ['Take ownership', 'Lead small project'],
      { phase: 90, goals: ['Full ownership', 'Impact metrics', 'Growth plan']
    ]
  });
});

// Training
app.post('/api/onboarding/training', (req, res) => {
  const { employeeId } = req.body;

  res.json({
    trainingId: `TRAIN-${Date.now()}`,
    modules: [
      { name: 'Company Culture', progress: 0, status: 'not_started' },
      { name: 'Product Training', progress: 0, status: 'not_started' },
      { name: 'Tools Setup', progress: 0, status: 'not_started' }
    ]
  });
});

// Document Collection
app.post('/api/onboarding/documents', (req, res) => {
  const { employeeId } = req.body;

  res.json({
    employeeId,
    required: [
      { doc: 'Aadhaar', status: 'pending' },
      { doc: 'PAN', status: 'pending' },
      { doc: 'Bank Details', status: 'pending' },
      { doc: 'Photo ID', status: 'pending' }
    ]
  });
});

app.listen(PORT, () => {
  logger.info(`MyTalent Onboarding AI on port ${PORT}`);
});

export default app;
