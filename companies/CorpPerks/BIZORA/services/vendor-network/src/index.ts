/**
 * BIZORA Vendor Network Service
 * HYBRID MODEL: Automated lead gen + Manual vendor execution
 *
 * BIZORA generates leads → Distributes to verified vendors
 * Vendors complete work manually → BIZORA tracks & pays
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: { city: string; state: string; country: string };
  services: string[];
  categories: Category[];
  rating: number;
  completedJobs: number;
  responseTime: string;
  priceRange: { min: number; max: number };
  type: 'automated' | 'manual' | 'hybrid';
  verified: boolean;
  trustScore: number;
  commission: number;  // BIZORA takes this %
  status: 'active' | 'busy' | 'offline';
  capabilities: {
    aiAssisted: boolean;  // Uses BIZORA AI tools
    canEscalate: boolean;  // Can request AI help
    providesReports: boolean;
  };
  currentJobs: number;
  maxJobs: number;
  earnings: {
    thisMonth: number;
    total: number;
    pending: number;
  };
}

interface Category {
  id: string;
  name: string;
  automationLevel: 'high' | 'medium' | 'low';
  priceRange: { min: number; max: number };
  avgCompletion: string;
  workflow: WorkflowStep[];
}

interface WorkflowStep {
  step: number;
  name: string;
  automated: boolean;  // true = AI does it, false = vendor does it
  duration: string;
  instructions: string;
}

interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  location: { city: string; state: string };
  category: string;
  requirements: string;
  budget: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedVendor?: string;
  assignedAt?: string;
  completionDetails?: CompletionDetails;
  commission: number;  // BIZORA takes this
  createdAt: string;
}

interface CompletionDetails {
  completedAt: string;
  actualPrice: number;
  workDone: string;
  deliverables: string[];
  rating?: number;
  review?: string;
  customerSatisfaction?: number;
}

interface Task {
  id: string;
  leadId: string;
  vendorId: string;
  category: string;
  steps: TaskStep[];
  status: 'assigned' | 'in_progress' | 'awaiting_approval' | 'completed' | 'disputed';
  progress: number;
  timeline: { step: string; status: string; time: string }[];
  createdAt: string;
  estimatedCompletion: string;
  actualCompletion?: string;
}

interface TaskStep {
  step: number;
  name: string;
  automated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const vendors: Map<string, Vendor> = new Map([
  ['v1', {
    id: 'v1',
    businessName: 'TechServe Solutions',
    ownerName: 'Rahul Sharma',
    email: 'rahul@techserve.in',
    phone: '+91-9876500001',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    services: ['website', 'app', 'crm'],
    categories: [
      { id: 'c1', name: 'Website Development', automationLevel: 'medium', priceRange: { min: 25000, max: 150000 }, avgCompletion: '2-4 weeks', workflow: [
        { step: 1, name: 'Requirements Analysis', automated: false, duration: '1 day', instructions: 'Call client, document requirements' },
        { step: 2, name: 'Design Mockups', automated: true, duration: '1 day', instructions: 'AI generates 5 options' },
        { step: 3, name: 'Development', automated: true, duration: '1-2 weeks', instructions: 'AI-assisted coding' },
        { step: 4, name: 'Client Review', automated: false, duration: '2 days', instructions: 'Present, collect feedback' },
        { step: 5, name: 'Revisions', automated: true, duration: '1 week', instructions: 'AI implements changes' },
        { step: 6, name: 'Launch', automated: true, duration: '1 day', instructions: 'Deploy, handover' },
      ]},
    ],
    rating: 4.7,
    completedJobs: 156,
    responseTime: '< 2 hours',
    priceRange: { min: 25000, max: 200000 },
    type: 'hybrid',
    verified: true,
    trustScore: 88,
    commission: 15,
    status: 'active',
    capabilities: { aiAssisted: true, canEscalate: true, providesReports: true },
    currentJobs: 3,
    maxJobs: 8,
    earnings: { thisMonth: 125000, total: 1500000, pending: 35000 },
  }],
  ['v2', {
    id: 'v2',
    businessName: 'Marketing Pros Agency',
    ownerName: 'Priya Patel',
    email: 'priya@marketingpros.in',
    phone: '+91-9876500002',
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    services: ['meta_ads', 'google_ads', 'seo', 'content'],
    categories: [
      { id: 'c2', name: 'Digital Marketing', automationLevel: 'high', priceRange: { min: 15000, max: 100000 }, avgCompletion: '1-4 weeks', workflow: [
        { step: 1, name: 'Audit & Analysis', automated: true, duration: '1 day', instructions: 'AI analyzes current presence' },
        { step: 2, name: 'Strategy', automated: true, duration: '1 day', instructions: 'AI creates campaign strategy' },
        { step: 3, name: 'Ad Creation', automated: true, duration: '2 days', instructions: 'AI generates ad creatives' },
        { step: 4, name: 'Campaign Launch', automated: true, duration: '1 day', instructions: 'Auto-deploy to channels' },
        { step: 5, name: 'Monitoring', automated: true, duration: 'ongoing', instructions: 'AI optimizes daily' },
        { step: 6, name: 'Reporting', automated: true, duration: 'weekly', instructions: 'AI generates reports' },
      ]},
    ],
    rating: 4.8,
    completedJobs: 234,
    responseTime: '< 1 hour',
    priceRange: { min: 15000, max: 100000 },
    type: 'automated',
    verified: true,
    trustScore: 92,
    commission: 20,
    status: 'active',
    capabilities: { aiAssisted: true, canEscalate: false, providesReports: true },
    currentJobs: 5,
    maxJobs: 15,
    earnings: { thisMonth: 180000, total: 2200000, pending: 45000 },
  }],
  ['v3', {
    id: 'v3',
    businessName: 'UAE Setup Experts',
    ownerName: 'Ahmed Hassan',
    email: 'ahmed@uaesetup.ae',
    phone: '+971-501234567',
    location: { city: 'Dubai', state: 'Dubai', country: 'UAE' },
    services: ['company_setup', 'visa', 'banking', 'vat'],
    categories: [
      { id: 'c3', name: 'UAE Company Formation', automationLevel: 'low', priceRange: { min: 15000, max: 50000 }, avgCompletion: '4-8 weeks', workflow: [
        { step: 1, name: 'Document Collection', automated: false, duration: '3 days', instructions: 'Collect all required docs from client' },
        { step: 2, name: 'Application Filing', automated: false, duration: '5 days', instructions: 'Submit to DED/freezone authority' },
        { step: 3, name: 'Follow-up', automated: false, duration: '2-3 weeks', instructions: 'Track application status' },
        { step: 4, name: 'License Collection', automated: false, duration: '1 day', instructions: 'Collect physical license' },
        { step: 5, name: 'Bank Account', automated: false, duration: '2-3 weeks', instructions: 'Coordinate with bank' },
        { step: 6, name: 'VAT Registration', automated: true, duration: '1 week', instructions: 'AI prepares and files' },
      ]},
    ],
    rating: 4.6,
    completedJobs: 89,
    responseTime: '< 4 hours',
    priceRange: { min: 15000, max: 50000 },
    type: 'manual',
    verified: true,
    trustScore: 85,
    commission: 25,
    status: 'active',
    capabilities: { aiAssisted: true, canEscalate: true, providesReports: true },
    currentJobs: 4,
    maxJobs: 6,
    earnings: { thisMonth: 95000, total: 890000, pending: 22000 },
  }],
]);

const leads: Map<string, Lead> = new Map([
  ['l1', {
    id: 'l1',
    businessName: 'The Burger Joint',
    contactName: 'Rahul Mehta',
    email: 'rahul@burgerjoint.in',
    phone: '+91-9876511111',
    location: { city: 'Mumbai', state: 'Maharashtra' },
    category: 'website',
    requirements: 'Need a restaurant website with online ordering and menu display',
    budget: 50000,
    urgency: 'medium',
    status: 'assigned',
    assignedVendor: 'v1',
    assignedAt: new Date().toISOString(),
    commission: 15,
    createdAt: new Date().toISOString(),
  }],
]);

const tasks: Map<string, Task> = new Map();

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'vendor-network',
    vendors: vendors.size,
    activeLeads: Array.from(leads.values()).filter(l => l.status === 'new' || l.status === 'assigned').length,
  });
});

// === VENDORS ===

// List vendors
app.get('/api/vendors', (req: Request, res: Response) => {
  const { category, city, type, minRating } = req.query;

  let filtered = Array.from(vendors.values());

  if (category) filtered = filtered.filter(v => v.services.includes(category as string));
  if (city) filtered = filtered.filter(v => v.location.city === city);
  if (type) filtered = filtered.filter(v => v.type === type);
  if (minRating) filtered = filtered.filter(v => v.rating >= parseFloat(minRating as string));

  res.json({
    vendors: filtered.map(v => ({
      id: v.id,
      businessName: v.businessName,
      location: v.location,
      services: v.services,
      rating: v.rating,
      completedJobs: v.completedJobs,
      priceRange: v.priceRange,
      type: v.type,
      trustScore: v.trustScore,
      availability: v.currentJobs < v.maxJobs ? 'available' : 'busy',
    })),
    total: filtered.length,
  });
});

// Get vendor details
app.get('/api/vendors/:id', (req: Request, res: Response) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  res.json(vendor);
});

// Get vendor dashboard
app.get('/api/vendors/:id/dashboard', (req: Request, res: Response) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const vendorTasks = Array.from(tasks.values()).filter(t => t.vendorId === req.params.id);

  res.json({
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      status: vendor.status,
      currentJobs: vendor.currentJobs,
      maxJobs: vendor.maxJobs,
    },
    performance: {
      rating: vendor.rating,
      completedJobs: vendor.completedJobs,
      responseTime: vendor.responseTime,
    },
    earnings: vendor.earnings,
    currentTasks: vendorTasks,
    recommendations: getRecommendations(vendor),
  });
});

function getRecommendations(vendor: Vendor): string[] {
  const recs: string[] = [];

  if (vendor.capabilities.aiAssisted && vendor.rating < 4.5) {
    recs.push('Enable AI-assisted workflows to improve speed and quality');
  }
  if (vendor.currentJobs < vendor.maxJobs * 0.5) {
    recs.push('You have capacity for more jobs. Optimize your profile.');
  }
  if (vendor.earnings.pending > vendor.earnings.thisMonth * 0.3) {
    recs.push('High pending payouts. Complete outstanding jobs for faster payment.');
  }

  return recs;
}

// === LEADS ===

// Create lead (from BIZORA AI or user)
app.post('/api/leads', (req: Request, res: Response) => {
  const { businessName, contactName, email, phone, location, category, requirements, budget, urgency } = req.body;

  const id = `lead_${Date.now()}`;

  const lead: Lead = {
    id,
    businessName,
    contactName,
    email,
    phone,
    location,
    category,
    requirements,
    budget,
    urgency: urgency || 'medium',
    status: 'new',
    commission: 20, // BIZORA takes 20%
    createdAt: new Date().toISOString(),
  };

  leads.set(id, lead);

  // Auto-match vendors
  const matchedVendors = matchVendors(lead);
  if (matchedVendors.length > 0) {
    assignLeadToVendor(lead.id, matchedVendors[0].id);
  }

  res.status(201).json({
    leadId: id,
    status: 'new',
    matchedVendors: matchedVendors.slice(0, 3).map(v => ({
      id: v.id,
      businessName: v.businessName,
      rating: v.rating,
      priceRange: v.priceRange,
    })),
    message: matchedVendors.length > 0
      ? 'Lead created and matched with vendors'
      : 'Lead created. Finding best vendors...',
  });
});

// Get leads
app.get('/api/leads', (req: Request, res: Response) => {
  const { status, vendorId, category } = req.query;

  let filtered = Array.from(leads.values());

  if (status) filtered = filtered.filter(l => l.status === status);
  if (vendorId) filtered = filtered.filter(l => l.assignedVendor === vendorId);
  if (category) filtered = filtered.filter(l => l.category === category);

  res.json({
    leads: filtered,
    summary: {
      total: filtered.length,
      new: filtered.filter(l => l.status === 'new').length,
      assigned: filtered.filter(l => l.status === 'assigned').length,
      inProgress: filtered.filter(l => l.status === 'in_progress').length,
      completed: filtered.filter(l => l.status === 'completed').length,
    },
  });
});

// Get lead details
app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const task = Array.from(tasks.values()).find(t => t.leadId === req.params.id);

  res.json({
    lead,
    task,
    vendor: lead.assignedVendor ? vendors.get(lead.assignedVendor) : null,
  });
});

// Auto-match vendors to lead
app.post('/api/leads/:id/match', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const matched = matchVendors(lead);

  res.json({
    leadId: lead.id,
    matchedVendors: matched.map(v => ({
      id: v.id,
      businessName: v.businessName,
      rating: v.rating,
      priceRange: v.priceRange,
      location: v.location,
      completedJobs: v.completedJobs,
      matchScore: calculateMatchScore(lead, v),
    })),
  });
});

// Assign lead to vendor
app.post('/api/leads/:id/assign', (req: Request, res: Response) => {
  const { vendorId } = req.body;

  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const vendor = vendors.get(vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  assignLeadToVendor(lead.id, vendorId);

  res.json({
    leadId: lead.id,
    vendorId,
    vendorName: vendor.businessName,
    message: `Lead assigned to ${vendor.businessName}`,
  });
});

function assignLeadToVendor(leadId: string, vendorId: string) {
  const lead = leads.get(leadId);
  const vendor = vendors.get(vendorId);

  if (!lead || !vendor) return;

  lead.status = 'assigned';
  lead.assignedVendor = vendorId;
  lead.assignedAt = new Date().toISOString();

  leads.set(leadId, lead);
  vendor.currentJobs++;
  vendors.set(vendorId, vendor);

  // Create task
  const category = vendor.categories.find(c => c.name.toLowerCase().includes(lead.category.toLowerCase()));
  if (category) {
    const taskId = `task_${Date.now()}`;
    const task: Task = {
      id: taskId,
      leadId,
      vendorId,
      category: lead.category,
      status: 'assigned',
      progress: 0,
      steps: category.workflow.map((step, i) => ({
        step: i + 1,
        name: step.name,
        automated: step.automated,
        status: 'pending',
      })),
      timeline: [{ step: 'Assigned', status: 'Start working', time: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      estimatedCompletion: calculateETA(category),
    };
    tasks.set(taskId, task);
  }
}

function calculateETA(category: Category): string {
  const days = category.workflow.reduce((sum, step) => {
    const match = step.duration.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 1);
  }, 0);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function matchVendors(lead: Lead): Vendor[] {
  return Array.from(vendors.values())
    .filter(v => {
      if (v.status === 'offline') return false;
      if (v.currentJobs >= v.maxJobs) return false;
      if (!v.services.includes(lead.category)) return false;
      if (v.location.city !== lead.location.city && v.location.country !== lead.location.country) return false;
      return true;
    })
    .map(v => ({
      ...v,
      matchScore: calculateMatchScore(lead, v),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(lead: Lead, vendor: Vendor): number {
  let score = 50;

  // Rating
  if (vendor.rating >= 4.5) score += 20;
  else if (vendor.rating >= 4.0) score += 10;

  // Location
  if (vendor.location.city === lead.location.city) score += 15;
  else if (vendor.location.country === lead.location.country) score += 10;

  // Budget fit
  if (lead.budget >= vendor.priceRange.min && lead.budget <= vendor.priceRange.max) score += 10;

  // Availability
  const availability = (vendor.maxJobs - vendor.currentJobs) / vendor.maxJobs;
  score += availability * 5;

  // Trust score
  score += vendor.trustScore * 0.1;

  return Math.min(100, Math.round(score));
}

// === TASKS ===

// Get task details
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const lead = leads.get(task.leadId);
  const vendor = vendors.get(task.vendorId);

  res.json({
    task,
    lead,
    vendor: vendor ? {
      id: vendor.id,
      businessName: vendor.businessName,
      phone: vendor.phone,
    } : null,
  });
});

// Update task step
app.post('/api/tasks/:id/step/:step', (req: Request, res: Response) => {
  const { status, notes } = req.body;

  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const stepNum = parseInt(req.params.step);
  const step = task.steps.find(s => s.step === stepNum);

  if (!step) return res.status(404).json({ error: 'Step not found' });

  step.status = status;
  step.completedAt = new Date().toISOString();
  if (notes) step.notes = notes;

  // Update progress
  task.progress = Math.round(
    (task.steps.filter(s => s.status === 'completed').length / task.steps.length) * 100
  );

  task.timeline.push({
    step: step.name,
    status,
    time: new Date().toISOString(),
  });

  // Update task status
  if (task.progress === 100) {
    task.status = 'awaiting_approval';
  } else if (task.progress > 0) {
    task.status = 'in_progress';
  }

  tasks.set(task.id, task);

  // Update lead status
  const lead = leads.get(task.leadId);
  if (lead) {
    lead.status = task.status === 'awaiting_approval' ? 'in_progress' : 'assigned';
    leads.set(lead.id, lead);
  }

  res.json({
    taskId: task.id,
    step: step.name,
    status,
    progress: task.progress,
    message: task.progress === 100 ? 'Task complete! Awaiting customer approval.' : 'Step updated.',
  });
});

// Complete task (vendor marks done)
app.post('/api/tasks/:id/complete', (req: Request, res: Response) => {
  const { workDone, deliverables, actualPrice } = req.body;

  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = 'completed';
  task.actualCompletion = new Date().toISOString();
  task.progress = 100;
  task.steps.forEach(s => s.status = 'completed');

  const lead = leads.get(task.leadId);
  if (lead) {
    lead.status = 'completed';
    lead.completionDetails = {
      completedAt: task.actualCompletion,
      actualPrice: actualPrice || lead.budget,
      workDone,
      deliverables,
    };
    leads.set(lead.id, lead);
  }

  const vendor = vendors.get(task.vendorId);
  if (vendor) {
    vendor.currentJobs--;
    vendor.completedJobs++;
    const earnings = actualPrice || lead?.budget || 0;
    vendor.earnings.thisMonth += earnings * (1 - vendor.commission / 100);
    vendor.earnings.pending += earnings * (1 - vendor.commission / 100);
    vendors.set(vendor.id, vendor);
  }

  res.json({
    taskId: task.id,
    status: 'completed',
    message: 'Task completed successfully!',
    payment: {
      amount: actualPrice || lead?.budget,
      commission: vendor?.commission,
      vendorEarnings: (actualPrice || lead?.budget || 0) * (1 - (vendor?.commission || 20) / 100),
    },
  });
});

// Customer approves completion
app.post('/api/tasks/:id/approve', (req: Request, res: Response) => {
  const { rating, review } = req.body;

  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const lead = leads.get(task.leadId);
  if (lead && lead.completionDetails) {
    lead.completionDetails.rating = rating;
    lead.completionDetails.review = review;
    leads.set(lead.id, lead);
  }

  const vendor = vendors.get(task.vendorId);
  if (vendor) {
    // Update vendor rating
    const newRating = ((vendor.rating * vendor.completedJobs) + rating) / (vendor.completedJobs + 1);
    vendor.rating = Math.round(newRating * 10) / 10;
    vendor.earnings.pending = 0; // Release pending
    vendors.set(vendor.id, vendor);
  }

  res.json({
    taskId: task.id,
    status: 'completed',
    message: 'Completion approved! Payment released to vendor.',
  });
});

// === AI ASSISTANT ===

// Get AI recommendations for vendor
app.get('/api/vendors/:id/ai-recommendations', (req: Request, res: Response) => {
  const vendor = vendors.get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const recommendations = [];

  // Analyze performance
  if (vendor.currentJobs > vendor.maxJobs * 0.8) {
    recommendations.push({
      type: 'capacity',
      priority: 'high',
      message: 'Approaching capacity limit. Consider raising prices or expanding team.',
      action: 'update_pricing',
    });
  }

  // Analyze earnings
  const avgJobValue = vendor.earnings.total / (vendor.completedJobs || 1);
  if (avgJobValue < vendor.priceRange.min) {
    recommendations.push({
      type: 'pricing',
      priority: 'medium',
      message: 'Your average job value is below your minimum price. Quality clients may be filtered.',
      action: 'adjust_pricing',
    });
  }

  // Analyze ratings
  if (vendor.rating < 4.0) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      message: 'Your rating needs attention. Focus on customer satisfaction.',
      action: 'review_process',
    });
  }

  // Analyze speed
  recommendations.push({
    type: 'efficiency',
    priority: 'low',
    message: 'Enable more AI-assisted steps to reduce completion time.',
    action: 'enable_ai_workflow',
  });

  res.json({
    vendorId: vendor.id,
    recommendations,
    nextAction: recommendations.find(r => r.priority === 'high')?.action || 'continue',
  });
});

// Get workflow for category
app.get('/api/workflows/:category', (req: Request, res: Response) => {
  const categoryName = req.params.category;

  // Find workflow in any vendor's categories
  for (const vendor of vendors.values()) {
    const category = vendor.categories.find(c =>
      c.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    if (category) {
      return res.json({
        category: category.name,
        automationLevel: category.automationLevel,
        priceRange: category.priceRange,
        avgCompletion: category.avgCompletion,
        steps: category.workflow,
        summary: {
          totalSteps: category.workflow.length,
          automatedSteps: category.workflow.filter(s => s.automated).length,
          manualSteps: category.workflow.filter(s => !s.automated).length,
          estimatedDays: category.avgCompletion,
        },
      });
    }
  }

  res.status(404).json({ error: 'Category not found' });
});

const PORT = process.env.PORT || 4092;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║  🤝 BIZORA Vendor Network Service                      ║
║  HYBRID MODEL: Automated + Manual Execution           ║
║  Port: ${PORT}                                          ║
║                                                        ║
║  Flow:                                                 ║
║  Lead → Match → Assign → Execute → Complete → Pay     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
