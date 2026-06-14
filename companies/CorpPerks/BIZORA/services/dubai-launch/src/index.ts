/**
 * BIZORA Dubai Company Launch Service
 * End-to-end orchestration for starting a company in UAE
 * Complete journey: Setup → Finance → Marketing → Tech → Sales → Security → Operations
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface CompanyLaunch {
  id: string;
  businessName: string;
  type: 'mainland' | 'freezone';
  activity: string;
  ownerId: string;
  status: 'planning' | 'in_progress' | 'operational';
  phases: Phase[];
  currentPhase: number;
  progress: number;
  estimatedCompletion: string;
  cost: {
    estimated: number;
    paid: number;
  };
  createdAt: string;
}

interface Phase {
  id: string;
  name: string;
  services: string[];
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  estimatedDays: number;
  cost: number;
  steps: Step[];
}

interface Step {
  id: string;
  name: string;
  service: string;
  status: 'pending' | 'in_progress' | 'completed';
  automated: boolean;
  vendorAssigned?: string;
  estimatedTime: string;
}

// Store launches in memory
const launches: Map<string, CompanyLaunch> = new Map();

// ============================================================================
// Launch Phases
// ============================================================================

const LAUNCH_PHASES = {
  1: {
    name: 'Company Setup',
    services: ['india-gcc-bridge', 'ai-execution', 'trust-escrow'],
    estimatedDays: 28,
    cost: 35000,
    steps: [
      { name: 'Trade License Application', service: 'india-gcc-bridge', automated: true, estimatedTime: '3-5 days' },
      { name: 'VAT Registration', service: 'india-gcc-bridge', automated: true, estimatedTime: '5-7 days' },
      { name: 'Corporate Tax Setup', service: 'taxflow', automated: true, estimatedTime: '7-10 days' },
      { name: 'Emirates ID & Visa', service: 'procurement', automated: false, estimatedTime: '10-14 days' },
      { name: 'Bank Account Opening', service: 'procurement', automated: false, estimatedTime: '14-21 days' },
      { name: 'Payment Gateway Setup', service: 'payment', automated: true, estimatedTime: '3-5 days' },
    ],
  },
  2: {
    name: 'Finance & Compliance',
    services: ['taxflow', 'invoiceflow', 'embedded-finance', 'trust-score'],
    estimatedDays: 14,
    cost: 12000,
    steps: [
      { name: 'Chart of Accounts Setup', service: 'taxflow', automated: true, estimatedTime: '1 day' },
      { name: 'QuickBooks/Xero Integration', service: 'finance', automated: true, estimatedTime: '2 days' },
      { name: 'VAT Filing System', service: 'taxflow', automated: true, estimatedTime: '1 day' },
      { name: 'Invoice Template Setup', service: 'invoiceflow', automated: true, estimatedTime: '1 day' },
      { name: 'Trust Score Calculation', service: 'trust-score', automated: true, estimatedTime: 'Instant' },
      { name: 'Audit Firm Matching', service: 'procurement', automated: true, estimatedTime: '1 day' },
    ],
  },
  3: {
    name: 'Branding & Marketing',
    services: ['community', 'partner-network', 'karma'],
    estimatedDays: 21,
    cost: 25000,
    steps: [
      { name: 'Logo Design', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Brand Guidelines', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Agency Matching', service: 'partner-network', automated: true, estimatedTime: '2 days' },
      { name: 'Meta Ads Account Setup', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Google Ads Setup', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'WhatsApp Business Setup', service: 'whatsapp-os', automated: true, estimatedTime: '1 day' },
      { name: 'DOOH Screen Booking', service: 'partner-network', automated: true, estimatedTime: '3 days' },
    ],
  },
  4: {
    name: 'Website & Technology',
    services: ['ai-execution', 'partner-network', 'command-center'],
    estimatedDays: 21,
    cost: 45000,
    steps: [
      { name: 'Website Wireframe AI', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Developer Matching', service: 'partner-network', automated: true, estimatedTime: '2 days' },
      { name: 'Website Development', service: 'partner-network', automated: false, estimatedTime: '14 days' },
      { name: 'CRM Setup', service: 'ai-execution', automated: true, estimatedTime: '2 days' },
      { name: 'Email System Configuration', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Command Center Integration', service: 'command-center', automated: true, estimatedTime: '1 day' },
    ],
  },
  5: {
    name: 'Sales Infrastructure',
    services: ['ai-execution', 'procurement', 'business-graph'],
    estimatedDays: 14,
    cost: 15000,
    steps: [
      { name: 'CRM Pipeline Configuration', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Lead Source Integration', service: 'ai-execution', automated: true, estimatedTime: '2 days' },
      { name: 'Sales Automation Setup', service: 'ai-execution', automated: true, estimatedTime: '2 days' },
      { name: 'Quote Template Setup', service: 'invoiceflow', automated: true, estimatedTime: '1 day' },
      { name: 'Lead Database Building', service: 'ai-execution', automated: true, estimatedTime: '5 days' },
      { name: 'Outbound Campaign Setup', service: 'ai-execution', automated: true, estimatedTime: '3 days' },
    ],
  },
  6: {
    name: 'Security & Compliance',
    services: ['ai-execution', 'partner-network'],
    estimatedDays: 7,
    cost: 18000,
    steps: [
      { name: 'Security Audit', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'SSL Certificate', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Security Partner Matching', service: 'partner-network', automated: true, estimatedTime: '2 days' },
      { name: 'Backup System Setup', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Phishing Protection', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
      { name: 'Monitoring Setup', service: 'ai-execution', automated: true, estimatedTime: '1 day' },
    ],
  },
  7: {
    name: 'Operations Launch',
    services: ['command-center', 'whatsapp-os', 'ai-execution'],
    estimatedDays: 7,
    cost: 5000,
    steps: [
      { name: 'Command Center Dashboard', service: 'command-center', automated: true, estimatedTime: '1 day' },
      { name: 'WhatsApp OS Training', service: 'whatsapp-os', automated: true, estimatedTime: '1 day' },
      { name: 'AI Assistant Training', service: 'ai-execution', automated: true, estimatedTime: '2 days' },
      { name: 'Team Onboarding', service: 'people-os', automated: true, estimatedTime: '2 days' },
      { name: 'First Month Operations Run', service: 'ai-execution', automated: true, estimatedTime: '30 days' },
    ],
  },
};

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'dubai-launch',
    launches: launches.size,
    phases: Object.keys(LAUNCH_PHASES).length,
  });
});

// Start a new company launch
app.post('/api/launch/start', (req: Request, res: Response) => {
  const {
    businessName,
    type,
    activity,
    ownerId,
    ownerName,
    ownerEmail,
    ownerPhone
  } = req.body;

  const launchId = `launch_${Date.now()}`;

  const launch: CompanyLaunch = {
    id: launchId,
    businessName,
    type,
    activity,
    ownerId,
    status: 'planning',
    currentPhase: 0,
    progress: 0,
    estimatedCompletion: calculateEstimatedDate(92), // ~12 weeks total
    cost: {
      estimated: calculateTotalCost(),
      paid: 0,
    },
    phases: Object.entries(LAUNCH_PHASES).map(([id, phase]) => ({
      id: `phase_${id}`,
      name: phase.name,
      services: phase.services,
      status: 'pending',
      progress: 0,
      estimatedDays: phase.estimatedDays,
      cost: phase.cost,
      steps: phase.steps.map((step, idx) => ({
        id: `step_${id}_${idx}`,
        name: step.name,
        service: step.service,
        status: 'pending',
        automated: step.automated,
        estimatedTime: step.estimatedTime,
      })),
    })),
    createdAt: new Date().toISOString(),
  };

  launches.set(launchId, launch);

  res.status(201).json({
    launchId,
    businessName,
    status: 'Planning',
    phases: launch.phases.map(p => ({ id: p.id, name: p.name, status: p.status })),
    estimatedCompletion: launch.estimatedCompletion,
    totalCost: launch.cost.estimated,
    message: 'Company launch initiated. Ready to start Phase 1?',
  });
});

// Get launch status
app.get('/api/launch/:id', (req: Request, res: Response) => {
  const launch = launches.get(req.params.id);
  if (!launch) return res.status(404).json({ error: 'Launch not found' });

  res.json(launch);
});

// Start next phase
app.post('/api/launch/:id/phase/:phaseId/start', (req: Request, res: Response) => {
  const launch = launches.get(req.params.id);
  if (!launch) return res.status(404).json({ error: 'Launch not found' });

  const phaseIndex = parseInt(req.params.phaseId.split('_')[1]) - 1;
  if (phaseIndex < 0 || phaseIndex >= launch.phases.length) {
    return res.status(404).json({ error: 'Phase not found' });
  }

  const phase = launch.phases[phaseIndex];
  phase.status = 'in_progress';
  launch.status = 'in_progress';

  // Mark all steps as in_progress
  phase.steps.forEach(step => {
    step.status = 'in_progress';
  });

  launches.set(req.params.id, launch);

  res.json({
    phase: phase.name,
    status: 'In Progress',
    steps: phase.steps.map(s => ({ id: s.id, name: s.name, automated: s.automated })),
    estimatedDays: phase.estimatedDays,
    cost: phase.cost,
  });
});

// Execute a step
app.post('/api/launch/:id/step/:stepId/execute', async (req: Request, res: Response) => {
  const launch = launches.get(req.params.id);
  if (!launch) return res.status(404).json({ error: 'Launch not found' });

  // Find the step
  let foundStep: any;
  let foundPhase: any;

  for (const phase of launch.phases) {
    for (const step of phase.steps) {
      if (step.id === req.params.stepId) {
        foundStep = step;
        foundPhase = phase;
        break;
      }
    }
    if (foundStep) break;
  }

  if (!foundStep) return res.status(404).json({ error: 'Step not found' });

  // Simulate execution
  foundStep.status = 'completed';

  // Update phase progress
  const completedSteps = foundPhase.steps.filter((s: any) => s.status === 'completed').length;
  foundPhase.progress = Math.round((completedSteps / foundPhase.steps.length) * 100);

  // Check if phase is complete
  if (foundPhase.progress === 100) {
    foundPhase.status = 'completed';
    launch.currentPhase++;
    launch.cost.paid += foundPhase.cost;
    launch.progress = Math.round((launch.phases.filter(p => p.status === 'completed').length / launch.phases.length) * 100);

    if (launch.progress === 100) {
      launch.status = 'operational';
    }
  }

  launches.set(req.params.id, launch);

  res.json({
    step: foundStep.name,
    status: 'Completed',
    phaseProgress: foundPhase.progress,
    launchProgress: launch.progress,
    nextStep: getNextStep(launch),
    message: foundPhase.progress === 100
      ? `Phase ${foundPhase.name} complete! Starting next phase...`
      : 'Step completed. Continue with next step.',
  });
});

// Get WhatsApp-style updates
app.get('/api/launch/:id/whatsapp', (req: Request, res: Response) => {
  const launch = launches.get(req.params.id);
  if (!launch) return res.status(404).json({ error: 'Launch not found' });

  const updates = [];

  for (const phase of launch.phases) {
    if (phase.status === 'completed') {
      updates.push({
        type: 'completed',
        message: `✅ ${phase.name} completed`,
        time: 'Recently',
      });
    } else if (phase.status === 'in_progress') {
      for (const step of phase.steps) {
        if (step.status === 'completed') {
          updates.push({
            type: 'step',
            message: `✅ ${step.name}`,
            time: 'Recently',
          });
        } else if (step.status === 'in_progress') {
          updates.push({
            type: 'current',
            message: `⏳ ${step.name} in progress...`,
            time: 'Now',
          });
        }
      }
    } else {
      updates.push({
        type: 'pending',
        message: `📋 ${phase.name} - ${phase.steps.length} steps`,
        time: phase.estimatedDays + ' days',
      });
    }
  }

  res.json({
    businessName: launch.businessName,
    progress: launch.progress,
    status: launch.status,
    updates,
  });
});

// Get launch dashboard
app.get('/api/launch/:id/dashboard', (req: Request, res: Response) => {
  const launch = launches.get(req.params.id);
  if (!launch) return res.status(404).json({ error: 'Launch not found' });

  res.json({
    businessName: launch.businessName,
    type: launch.type,
    activity: launch.activity,
    status: launch.status,
    progress: launch.progress,
    estimatedCompletion: launch.estimatedCompletion,
    cost: launch.cost,
    phases: launch.phases.map(p => ({
      name: p.name,
      status: p.status,
      progress: p.progress,
      completedSteps: p.steps.filter(s => s.status === 'completed').length,
      totalSteps: p.steps.length,
    })),
    currentPhase: launch.phases[launch.currentPhase]?.name || 'Completed',
    quickActions: [
      { action: 'Check Progress', command: '/progress' },
      { action: 'Get Help', command: '/help' },
      { action: 'Contact Support', command: '/support' },
    ],
  });
});

// AI Chat for launch
app.post('/api/launch/:id/chat', (req: Request, res: Response) => {
  const { message } = req.body;
  const launch = launches.get(req.params.id);

  const lower = message.toLowerCase();

  let response: any;

  if (lower.includes('progress') || lower.includes('status')) {
    response = {
      message: `Your ${launch?.businessName} is ${launch?.progress}% complete. ${launch?.phases.filter(p => p.status === 'completed').length} of ${launch?.phases.length} phases done.`,
      quickReply: 'Would you like detailed phase breakdown?',
    };
  } else if (lower.includes('cost') || lower.includes('pay')) {
    response = {
      message: `Total estimated: ₹${launch?.cost.estimated.toLocaleString()}\nPaid so far: ₹${launch?.cost.paid.toLocaleString()}\nRemaining: ₹${((launch?.cost.estimated || 0) - (launch?.cost.paid || 0)).toLocaleString()}`,
      quickReply: 'Need payment link?',
    };
  } else if (lower.includes('vat') || lower.includes('tax')) {
    response = {
      message: 'VAT registration is part of Phase 1. Estimated to start in Week 4.',
      action: 'Want me to check Phase 1 details?',
    };
  } else if (lower.includes('website') || lower.includes('marketing')) {
    response = {
      message: 'Website and marketing are in Phase 3 & 4. Want me to explain the timeline?',
      action: '/start phase 4',
    };
  } else {
    response = {
      message: `I'm here to help with your ${launch?.businessName} launch. What would you like to know?`,
      suggestions: ['Progress', 'Cost', 'Timeline', 'Next Steps'],
    };
  }

  res.json({
    ...response,
    launchId: req.params.id,
    timestamp: new Date().toISOString(),
  });
});

// List all launches
app.get('/api/launches', (_req: Request, res: Response) => {
  const allLaunches = Array.from(launches.values());
  res.json({
    launches: allLaunches.map(l => ({
      id: l.id,
      businessName: l.businessName,
      type: l.type,
      status: l.status,
      progress: l.progress,
      estimatedCompletion: l.estimatedCompletion,
    })),
    summary: {
      total: allLaunches.length,
      planning: allLaunches.filter(l => l.status === 'planning').length,
      inProgress: allLaunches.filter(l => l.status === 'in_progress').length,
      operational: allLaunches.filter(l => l.status === 'operational').length,
    },
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTotalCost(): number {
  return Object.values(LAUNCH_PHASES).reduce((sum, phase) => sum + phase.cost, 0);
}

function calculateEstimatedDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getNextStep(launch: CompanyLaunch): string | null {
  for (const phase of launch.phases) {
    if (phase.status === 'pending') return `Start: ${phase.name}`;
    if (phase.status === 'in_progress') {
      for (const step of phase.steps) {
        if (step.status === 'in_progress') return `Continue: ${step.name}`;
      }
    }
  }
  return null;
}

// ============================================================================
// WhatsApp Commands
// ============================================================================

app.post('/api/whatsapp/webhook', (req: Request, res: Response) => {
  const { from, message } = req.body;

  // Parse command
  const cmd = message.toLowerCase().trim();

  if (cmd === '/start') {
    res.json({
      message: 'Welcome to BIZORA Dubai Launch! 🏢\n\nI can help you start your UAE company.\n\nWhat would you like to do?',
      options: ['Start New Company', 'Check Existing', 'Get Pricing'],
    });
  } else if (cmd === '/progress') {
    res.json({
      message: '📊 Your Progress\n\n1️⃣ Company Setup - 80%\n2️⃣ Finance - 100%\n3️⃣ Marketing - 45%\n4️⃣ Website - 20%\n5️⃣ Sales - Pending\n6️⃣ Security - Pending\n7️⃣ Operations - Pending',
    });
  } else if (cmd === '/help') {
    res.json({
      message: '🤖 BIZORA AI Help\n\nCommands:\n/start - Start new launch\n/progress - Check status\n/cost - View costs\n/next - What\'s next\n/support - Contact team',
    });
  } else {
    res.json({
      message: 'I didn\'t understand that. Try:\n/start\n/progress\n/help',
    });
  }
});

// ============================================================================
// Start
// ============================================================================

const PORT = process.env.PORT || 4091;
app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════════════════════╗
║  🏢 Dubai Company Launch Service                       ║
║  End-to-end UAE company formation                      ║
║  Port: ${PORT}                                          ║
║                                                        ║
║  Phases: Company → Finance → Marketing → Tech →      ║
║          Sales → Security → Operations               ║
╚════════════════════════════════════════════════════════╝
  `);
});
