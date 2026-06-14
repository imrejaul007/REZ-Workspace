/**
 * Onboarding AI Agent - Port 4013
 * Guide new hires through onboarding
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Onboarding checklist template
const onboardingTemplate = {
  documents: [
    { id: 'doc_1', name: 'Offer Letter', required: true, esign: true },
    { id: 'doc_2', name: 'NDA Agreement', required: true, esign: true },
    { id: 'doc_3', name: 'Employee Handbook', required: true, esign: false },
    { id: 'doc_4', name: 'PAN Card', required: true, esign: false },
    { id: 'doc_5', name: 'Aadhaar Card', required: true, esign: false },
    { id: 'doc_6', name: 'Bank Details', required: true, esign: false },
    { id: 'doc_7', name: 'Photo ID', required: true, esign: false },
  ],
  setup: [
    { id: 'setup_1', name: 'Email Setup', category: 'it' },
    { id: 'setup_2', name: 'Laptop Configuration', category: 'it' },
    { id: 'setup_3', name: 'Slack Access', category: 'it' },
    { id: 'setup_4', name: 'GitHub Access', category: 'it' },
    { id: 'setup_5', name: 'HR Portal Access', category: 'hr' },
    { id: 'setup_6', name: 'Payroll Setup', category: 'hr' },
    { id: 'setup_7', name: 'Badge/Access Card', category: 'security' },
  ],
  training: [
    { id: 'train_1', name: 'Company Orientation', duration: 60, mandatory: true },
    { id: 'train_2', name: 'Security Training', duration: 30, mandatory: true },
    { id: 'train_3', name: 'Product Overview', duration: 45, mandatory: true },
    { id: 'train_4', name: 'Role-specific Training', duration: 120, mandatory: true },
    { id: 'train_5', name: 'Tools & Systems', duration: 60, mandatory: false },
  ],
  meetings: [
    { id: 'meet_1', name: 'Team Introduction', with: 'Manager', duration: 30 },
    { id: 'meet_2', name: '1:1 with Manager', with: 'Manager', duration: 60 },
    { id: 'meet_3', name: 'Team Lunch', with: 'Team', duration: 60 },
    { id: 'meet_4', name: 'HR Introduction', with: 'HR', duration: 30 },
  ],
};

// Store employee onboarding progress
const onboardings: Map<string, any> = new Map();

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'onboarding', port: 4013 }));

// Get onboarding template
app.get('/template', (_, res) => {
  res.json({ template: onboardingTemplate });
});

// Start onboarding for employee
app.post('/start', (req, res) => {
  const { employeeId, name, email, department, designation, managerId, startDate } = req.body;

  if (!employeeId || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const progress = {
    documents: onboardingTemplate.documents.map(d => ({ ...d, status: 'pending', completedAt: null })),
    setup: onboardingTemplate.setup.map(s => ({ ...s, status: 'pending', completedAt: null })),
    training: onboardingTemplate.training.map(t => ({ ...t, status: 'pending', progress: 0 })),
    meetings: onboardingTemplate.meetings.map(m => ({ ...m, status: 'pending', scheduledAt: null })),
  };

  const onboarding = {
    id: `onboard_${employeeId}`,
    employeeId,
    name,
    email,
    department,
    designation,
    managerId,
    startDate: startDate || new Date().toISOString().split('T')[0],
    progress,
    overallProgress: 0,
    currentStep: 'documents',
    status: 'in_progress',
    startedAt: new Date(),
    buddyAssigned: null,
  };

  onboardings.set(employeeId, onboarding);

  res.json({
    onboarding,
    nextStep: getNextStep(progress),
    checklist: progress,
  });
});

// Update task status
app.post('/update', (req, res) => {
  const { employeeId, category, taskId, status, data } = req.body;

  const onboarding = onboardings.get(employeeId);
  if (!onboarding) {
    return res.status(404).json({ error: 'Onboarding not found' });
  }

  const task = onboarding.progress[category]?.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = status;
  task.completedAt = status === 'completed' ? new Date() : null;
  if (data) Object.assign(task, data);

  // Recalculate overall progress
  onboarding.overallProgress = calculateProgress(onboarding.progress);
  onboarding.currentStep = getNextStep(onboarding.progress);

  res.json({
    task,
    overallProgress: onboarding.overallProgress,
    nextStep: onboarding.currentStep,
    completed: onboarding.overallProgress === 100,
  });
});

// Get onboarding status
app.get('/:employeeId', (req, res) => {
  const onboarding = onboardings.get(req.params.employeeId);
  if (!onboarding) {
    return res.status(404).json({ error: 'Onboarding not found' });
  }
  res.json({ onboarding });
});

// Get chat response (AI buddy)
app.post('/chat', (req, res) => {
  const { employeeId, message } = req.body;

  const onboarding = onboardings.get(employeeId);
  if (!onboarding) {
    return res.status(404).json({ error: 'Onboarding not found' });
  }

  // Simple keyword-based responses
  const lowerMsg = message.toLowerCase();
  let response = "I'm here to help with your onboarding! What would you like to know about?";

  if (lowerMsg.includes('document') || lowerMsg.includes('paper')) {
    const pendingDocs = onboarding.progress.documents.filter((d: any) => d.status !== 'completed');
    response = `You have ${pendingDocs.length} pending documents: ${pendingDocs.map((d: any) => d.name).join(', ')}. Would you like help with any of these?`;
  } else if (lowerMsg.includes('setup') || lowerMsg.includes('tool')) {
    const pendingSetup = onboarding.progress.setup.filter((s: any) => s.status !== 'completed');
    response = `Pending setup tasks: ${pendingSetup.map((s: any) => s.name).join(', ')}. Contact IT if you need help.`;
  } else if (lowerMsg.includes('training') || lowerMsg.includes('learn')) {
    response = "Your training path includes company orientation, security training, and role-specific sessions. Check the Training tab for details.";
  } else if (lowerMsg.includes('meeting') || lowerMsg.includes('schedule')) {
    response = "You have meetings scheduled with your manager, team, and HR. Check your calendar for details.";
  } else if (lowerMsg.includes('help') || lowerMsg.includes('?') || lowerMsg.includes('who')) {
    response = "I can help with: documents, IT setup, training schedules, meeting安排, and general questions about your first week!";
  }

  res.json({
    response,
    suggestion: 'Try asking about documents, setup, training, or meetings',
    onboardingProgress: onboarding.overallProgress,
  });
});

// Helper functions
function getNextStep(progress: any): string {
  if (progress.documents.some((d: any) => d.status !== 'completed')) return 'documents';
  if (progress.setup.some((s: any) => s.status !== 'completed')) return 'setup';
  if (progress.training.some((t: any) => t.status !== 'completed')) return 'training';
  if (progress.meetings.some((m: any) => m.status !== 'completed')) return 'meetings';
  return 'complete';
}

function calculateProgress(progress: any): number {
  const total =
    progress.documents.length +
    progress.setup.length +
    progress.training.length +
    progress.meetings.length;

  const completed =
    progress.documents.filter((d: any) => d.status === 'completed').length +
    progress.setup.filter((s: any) => s.status === 'completed').length +
    progress.training.filter((t: any) => t.status === 'completed').length +
    progress.meetings.filter((m: any) => m.status === 'completed').length;

  return Math.round((completed / total) * 100);
}

const PORT = 4013;
app.listen(PORT, () => logger.info(`Onboarding Agent running on port ${PORT}`));
