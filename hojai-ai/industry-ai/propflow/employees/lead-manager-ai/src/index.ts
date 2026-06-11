/**
 * PROPFLOW - Lead Manager AI Employee
 * Lead qualification, scoring, nurturing, and follow-up management
 * "AI That Converts Leads Into Closed Deals"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4921;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: 'website' | 'phone' | 'walkin' | 'referral' | 'agent' | 'social' | 'classifieds';
  budget: { min: number; max: number };
  preferredType?: 'apartment' | 'villa' | 'plot' | 'commercial' | 'office';
  preferredLocation?: string;
  bedrooms?: number[];
  status: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed-won' | 'closed-lost';
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  assignedAgentId?: string;
  lastContact?: string;
  nextFollowUp?: string;
  notes: string[];
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
  stageHistory: StageChange[];
}

interface Interaction {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'visit' | 'meeting';
  direction: 'inbound' | 'outbound';
  summary: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  followUpRequired: boolean;
  agentId?: string;
  timestamp: string;
}

interface StageChange {
  from: Lead['status'];
  to: Lead['status'];
  reason?: string;
  timestamp: string;
}

interface QualificationRequest {
  name: string;
  phone: string;
  email?: string;
  source: Lead['source'];
  budget?: { min: number; max: number };
  preferredType?: Lead['preferredType'];
  preferredLocation?: string;
  requirements?: string[];
  notes?: string[];
}

interface FollowUpTask {
  id: string;
  leadId: string;
  type: 'call' | 'whatsapp' | 'visit' | 'email';
  scheduledTime: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
  createdAt: string;
}

// ============================================
// IN-MEMORY STORES
// ============================================

const leads = new Map<string, Lead>();
const followUpTasks = new Map<string, FollowUpTask>();

// Sample leads
const sampleLeads: Lead[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya.sharma@email.com',
    source: 'website',
    budget: { min: 5000000, max: 10000000 },
    preferredType: 'apartment',
    preferredLocation: 'Andheri West',
    bedrooms: [2, 3],
    status: 'qualified',
    score: 85,
    tier: 'hot',
    assignedAgentId: 'agent1',
    notes: ['Looking for family home', 'Ready to buy in 3 months'],
    interactions: [],
    stageHistory: [],
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-06-01T14:30:00Z'
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    phone: '9876543211',
    email: 'rahul.mehta@email.com',
    source: 'referral',
    budget: { min: 20000000, max: 35000000 },
    preferredType: 'villa',
    preferredLocation: 'Navi Mumbai',
    status: 'visiting',
    score: 92,
    tier: 'hot',
    assignedAgentId: 'agent2',
    notes: ['NRI family visiting soon', 'Interested in Palm Beach area'],
    interactions: [],
    stageHistory: [],
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-06-02T11:00:00Z'
  },
  {
    id: '3',
    name: 'Anita Desai',
    phone: '9876543212',
    source: 'walkin',
    budget: { min: 3000000, max: 5000000 },
    preferredType: 'apartment',
    status: 'new',
    score: 45,
    tier: 'warm',
    notes: ['First-time buyer', 'Exploring options'],
    interactions: [],
    stageHistory: [],
    createdAt: '2026-06-01T16:00:00Z',
    updatedAt: '2026-06-01T16:00:00Z'
  }
];

sampleLeads.forEach(l => leads.set(l.id, l));

// ============================================
// AI QUALIFICATION ENGINE
// ============================================

interface QualificationResult {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  factors: {
    name: string;
    score: number;
    weight: number;
    reason: string;
  }[];
  recommendations: string[];
  urgency: 'high' | 'medium' | 'low';
  estimatedCloseTime: string;
  matchingPropertyTypes: string[];
}

function calculateLeadScore(req: QualificationRequest): QualificationResult {
  const factors: QualificationResult['factors'] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Budget scoring (weight: 30)
  if (req.budget) {
    const budgetScore = req.budget.max >= 20000000 ? 30 :
                        req.budget.max >= 10000000 ? 25 :
                        req.budget.max >= 5000000 ? 20 : 10;
    factors.push({
      name: 'Budget',
      score: budgetScore,
      weight: 30,
      reason: req.budget.max >= 20000000 ? 'Premium budget range' :
              req.budget.max >= 10000000 ? 'Upper mid-range budget' :
              req.budget.max >= 5000000 ? 'Mid-range budget' : 'Entry-level budget'
    });
    totalScore += budgetScore * 30 / 30;
    totalWeight += 30;
  }

  // Source scoring (weight: 20)
  const sourceScores: Record<Lead['source'], { score: number; reason: string }> = {
    referral: { score: 20, reason: 'Referral - high trust source' },
    walkin: { score: 18, reason: 'Walk-in - high intent' },
    website: { score: 12, reason: 'Website inquiry - active interest' },
    phone: { score: 15, reason: 'Phone inquiry - direct contact' },
    agent: { score: 10, reason: 'Agent-sourced lead' },
    social: { score: 8, reason: 'Social media lead' },
    classifieds: { score: 5, reason: 'Classified ad - exploratory' }
  };
  const source = sourceScores[req.source] || { score: 10, reason: 'Standard source' };
  factors.push({ name: 'Source', score: source.score, weight: 20, reason: source.reason });
  totalScore += source.score * 20 / 20;
  totalWeight += 20;

  // Requirements clarity (weight: 25)
  let reqClarity = 0;
  let reqReasons: string[] = [];
  if (req.preferredType) {
    reqClarity += 10;
    reqReasons.push(`Knows preferred type: ${req.preferredType}`);
  }
  if (req.preferredLocation) {
    reqClarity += 10;
    reqReasons.push(`Location preference: ${req.preferredLocation}`);
  }
  if (req.budget) {
    reqClarity += 5;
  }
  factors.push({
    name: 'Requirements Clarity',
    score: reqClarity,
    weight: 25,
    reason: reqReasons.length > 0 ? reqReasons.join(', ') : 'Vague requirements'
  });
  totalScore += reqClarity * 25 / 25;
  totalWeight += 25;

  // Notes/content scoring (weight: 15)
  let noteScore = 5;
  let noteReason = 'Basic inquiry';
  if (req.notes && req.notes.length > 0) {
    const hasUrgency = req.notes.some(n =>
      n.toLowerCase().includes('ready') ||
      n.toLowerCase().includes('urgent') ||
      n.toLowerCase().includes('asap')
    );
    const hasTimeline = req.notes.some(n =>
      n.toLowerCase().includes('month') ||
      n.toLowerCase().includes('week')
    );
    if (hasUrgency) {
      noteScore = 15;
      noteReason = 'Expresses urgency to buy';
    } else if (hasTimeline) {
      noteScore = 12;
      noteReason = 'Has defined timeline';
    } else {
      noteScore = 8;
      noteReason = 'Has additional context';
    }
  }
  factors.push({ name: 'Engagement Level', score: noteScore, weight: 15, reason: noteReason });
  totalScore += noteScore * 15 / 15;
  totalWeight += 15;

  // Contact completeness (weight: 10)
  let contactScore = req.email ? 10 : 5;
  factors.push({
    name: 'Contact Info',
    score: contactScore,
    weight: 10,
    reason: req.email ? 'Complete contact details' : 'Phone only'
  });
  totalScore += contactScore * 10 / 10;
  totalWeight += 10;

  const finalScore = Math.min(100, Math.round(totalScore));
  const tier: 'hot' | 'warm' | 'cold' = finalScore >= 75 ? 'hot' : finalScore >= 50 ? 'warm' : 'cold';

  const recommendations: string[] = [];
  if (tier === 'hot') {
    recommendations.push('Priority follow-up within 2 hours');
    recommendations.push('Schedule site visit immediately');
    recommendations.push('Assign senior agent');
    recommendations.push('Prepare shortlisted properties');
  } else if (tier === 'warm') {
    recommendations.push('Follow-up within 24 hours');
    recommendations.push('Share relevant property listings');
    recommendations.push('Nurture with market insights');
  } else {
    recommendations.push('Regular weekly follow-up');
    recommendations.push('Share market updates');
    recommendations.push('Add to nurturing campaign');
  }

  const closeTime = tier === 'hot' ? '2-4 weeks' : tier === 'warm' ? '1-3 months' : '3-6 months';

  const propertyTypes = req.preferredType ? [req.preferredType] :
    ['apartment', 'villa', 'plot', 'commercial'].slice(0, 2);

  return {
    score: finalScore,
    tier,
    factors,
    recommendations,
    urgency: tier === 'hot' ? 'high' : tier === 'warm' ? 'medium' : 'low',
    estimatedCloseTime: closeTime,
    matchingPropertyTypes: propertyTypes
  };
}

// ============================================
// FOLLOW-UP MANAGEMENT
// ============================================

function generateFollowUpTasks(lead: Lead): FollowUpTask[] {
  const tasks: FollowUpTask[] = [];
  const now = new Date();

  if (lead.tier === 'hot') {
    // Hot leads get daily follow-ups
    const hotDates = [
      new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
    ];
    hotDates.forEach((date, i) => {
      tasks.push({
        id: uuidv4(),
        leadId: lead.id,
        type: i === 0 ? 'call' : 'whatsapp',
        scheduledTime: date.toISOString(),
        priority: 'high',
        status: 'pending',
        createdAt: now.toISOString()
      });
    });
  } else if (lead.tier === 'warm') {
    // Warm leads get weekly follow-ups
    tasks.push({
      id: uuidv4(),
      leadId: lead.id,
      type: 'whatsapp',
      scheduledTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'pending',
      createdAt: now.toISOString()
    });
  } else {
    // Cold leads get bi-weekly nurture
    tasks.push({
      id: uuidv4(),
      leadId: lead.id,
      type: 'email',
      scheduledTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'low',
      status: 'pending',
      createdAt: now.toISOString()
    });
  }

  return tasks;
}

function determineNextStage(lead: Lead, outcome: 'positive' | 'neutral' | 'negative'): Lead['status'] {
  const stageProgression: Record<Lead['status'], Record<string, Lead['status']>> = {
    'new': { positive: 'contacted', neutral: 'new', negative: 'new' },
    'contacted': { positive: 'qualified', neutral: 'contacted', negative: 'contacted' },
    'qualified': { positive: 'visiting', neutral: 'qualified', negative: 'qualified' },
    'visiting': { positive: 'negotiating', neutral: 'visiting', negative: 'qualified' },
    'negotiating': { positive: 'closed-won', neutral: 'negotiating', negative: 'closed-lost' },
    'closed-won': { positive: 'closed-won', neutral: 'closed-won', negative: 'closed-won' },
    'closed-lost': { positive: 'new', neutral: 'closed-lost', negative: 'closed-lost' }
  };

  return stageProgression[lead.status]?.[outcome] || lead.status;
}

// ============================================
// API ROUTES
// ============================================

/**
 * Qualify a new lead
 */
app.post('/api/leads/qualify', async (req: Request, res: Response) => {
  try {
    const qualificationReq: QualificationRequest = req.body;

    if (!qualificationReq.name || !qualificationReq.phone || !qualificationReq.source) {
      return res.status(400).json({
        error: 'Missing required fields: name, phone, source'
      });
    }

    const qualification = calculateLeadScore(qualificationReq);
    const id = uuidv4();
    const now = new Date().toISOString();

    const lead: Lead = {
      id,
      name: qualificationReq.name,
      phone: qualificationReq.phone,
      email: qualificationReq.email,
      source: qualificationReq.source,
      budget: qualificationReq.budget || { min: 0, max: 0 },
      preferredType: qualificationReq.preferredType,
      preferredLocation: qualificationReq.preferredLocation,
      status: 'new',
      score: qualification.score,
      tier: qualification.tier,
      notes: qualificationReq.notes || [],
      interactions: [],
      stageHistory: [],
      createdAt: now,
      updatedAt: now
    };

    leads.set(id, lead);

    // Generate follow-up tasks
    const tasks = generateFollowUpTasks(lead);
    tasks.forEach(t => followUpTasks.set(t.id, t));

    res.status(201).json({
      success: true,
      lead,
      qualification,
      followUpTasks: tasks,
      message: `Lead qualified as ${qualification.tier.toUpperCase()} with score ${qualification.score}`
    });
  } catch (error) {
    console.error('Lead qualification error:', error);
    res.status(500).json({ error: 'Failed to qualify lead' });
  }
});

/**
 * Get lead by ID
 */
app.get('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get related follow-up tasks
    const tasks = Array.from(followUpTasks.values())
      .filter(t => t.leadId === lead.id && t.status === 'pending')
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    res.json({
      success: true,
      lead,
      pendingTasks: tasks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

/**
 * Get all leads with filtering
 */
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const { status, tier, agentId, minScore, source } = req.query;
    let result = Array.from(leads.values());

    if (status) result = result.filter(l => l.status === status);
    if (tier) result = result.filter(l => l.tier === tier);
    if (agentId) result = result.filter(l => l.assignedAgentId === agentId);
    if (minScore) result = result.filter(l => l.score >= Number(minScore));
    if (source) result = result.filter(l => l.source === source);

    result.sort((a, b) => b.score - a.score);

    const summary = {
      total: result.length,
      hot: result.filter(l => l.tier === 'hot').length,
      warm: result.filter(l => l.tier === 'warm').length,
      cold: result.filter(l => l.tier === 'cold').length,
      avgScore: result.length > 0 ? Math.round(result.reduce((sum, l) => sum + l.score, 0) / result.length) : 0
    };

    res.json({
      leads: result,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leads' });
  }
});

/**
 * Update lead status/interaction
 */
app.patch('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { status, notes, assignedAgentId, outcome, interactionType, interactionSummary } = req.body;

    if (status && status !== lead.status) {
      const newStatus = determineNextStage(lead, outcome || 'neutral');
      lead.stageHistory.push({
        from: lead.status,
        to: newStatus,
        reason: notes || 'Status update',
        timestamp: new Date().toISOString()
      });
      lead.status = newStatus;
    }

    if (notes) {
      if (Array.isArray(notes)) {
        lead.notes.push(...notes);
      } else {
        lead.notes.push(notes);
      }
    }

    if (assignedAgentId) {
      lead.assignedAgentId = assignedAgentId;
    }

    if (interactionType && interactionSummary) {
      lead.interactions.push({
        id: uuidv4(),
        type: interactionType,
        direction: 'outbound',
        summary: interactionSummary,
        outcome: outcome || 'neutral',
        followUpRequired: outcome !== 'positive',
        timestamp: new Date().toISOString()
      });
    }

    lead.lastContact = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    // Re-score if significant changes
    if (status === 'visiting' || status === 'negotiating') {
      lead.score = Math.min(100, lead.score + 5);
      lead.tier = lead.score >= 75 ? 'hot' : lead.score >= 50 ? 'warm' : 'cold';
    }

    leads.set(lead.id, lead);

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

/**
 * Re-score and re-qualify a lead
 */
app.post('/api/leads/:id/requalify', async (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const qualificationReq: QualificationRequest = {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      budget: lead.budget,
      preferredType: lead.preferredType,
      preferredLocation: lead.preferredLocation,
      requirements: lead.notes
    };

    const qualification = calculateLeadScore(qualificationReq);

    lead.score = qualification.score;
    lead.tier = qualification.tier;
    lead.updatedAt = new Date().toISOString();
    leads.set(lead.id, lead);

    res.json({
      success: true,
      lead,
      qualification,
      message: 'Lead re-qualified successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to re-qualify lead' });
  }
});

/**
 * Get follow-up tasks
 */
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { leadId, priority, status } = req.query;
    let tasks = Array.from(followUpTasks.values());

    if (leadId) tasks = tasks.filter(t => t.leadId === leadId);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (status) tasks = tasks.filter(t => t.status === status);

    // Group by status
    const grouped = {
      overdue: tasks.filter(t => t.status === 'pending' && new Date(t.scheduledTime) < new Date()),
      today: tasks.filter(t =>
        t.status === 'pending' &&
        new Date(t.scheduledTime).toDateString() === new Date().toDateString()
      ),
      upcoming: tasks.filter(t =>
        t.status === 'pending' &&
        new Date(t.scheduledTime) > new Date() &&
        new Date(t.scheduledTime).toDateString() !== new Date().toDateString()
      ),
      completed: tasks.filter(t => t.status === 'completed')
    };

    res.json({
      tasks,
      grouped,
      summary: {
        overdue: grouped.overdue.length,
        today: grouped.today.length,
        upcoming: grouped.upcoming.length,
        completed: grouped.completed.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

/**
 * Complete a follow-up task
 */
app.post('/api/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const task = followUpTasks.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'completed';

    // Create interaction on lead
    const lead = leads.get(task.leadId);
    if (lead) {
      lead.interactions.push({
        id: uuidv4(),
        type: task.type,
        direction: 'outbound',
        summary: req.body.notes || `Follow-up ${task.type} completed`,
        outcome: req.body.outcome || 'neutral',
        followUpRequired: false,
        timestamp: new Date().toISOString()
      });
      lead.lastContact = new Date().toISOString();
      leads.set(lead.id, lead);
    }

    followUpTasks.set(task.id, task);

    res.json({
      success: true,
      task,
      message: 'Task completed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

/**
 * Generate follow-up sequence for a lead
 */
app.post('/api/leads/:id/sequence', async (req: Request, res: Response) => {
  try {
    const lead = leads.get(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Generate a nurture sequence based on tier
    const sequences: Record<string, { day: number; action: string; message: string }[]> = {
      hot: [
        { day: 0, action: 'call', message: 'Hi {name}, this is from PROPFLOW. I saw your inquiry about properties in {location}. Do you have 5 minutes to discuss?' },
        { day: 0, action: 'whatsapp', message: 'Hi {name}! Thanks for reaching out. I\'ve shortlisted 3 properties matching your requirements. Want me to share details?' },
        { day: 1, action: 'call', message: 'Follow up on the properties shared. Schedule a site visit if interested.' },
        { day: 2, action: 'whatsapp', message: '{name}, we have a new listing matching your criteria. Quick site visit this weekend?' },
        { day: 3, action: 'call', message: 'Final follow-up. Any questions about the properties?' }
      ],
      warm: [
        { day: 0, action: 'whatsapp', message: 'Hi {name}! Thanks for your interest. I\'ll share some great options soon.' },
        { day: 3, action: 'email', message: 'Here are 5 properties matching your requirements: [links]' },
        { day: 7, action: 'whatsapp', message: 'Hi {name}, any properties catch your eye?' },
        { day: 14, action: 'email', message: 'Market update: New properties in {location} that might interest you.' },
        { day: 21, action: 'whatsapp', message: 'Hi {name}, any updates on your property search?' }
      ],
      cold: [
        { day: 0, action: 'email', message: 'Welcome to PROPFLOW! Here\'s our latest property newsletter.' },
        { day: 7, action: 'email', message: 'Market insights: {location} trends and new launches.' },
        { day: 14, action: 'whatsapp', message: 'Hi {name}, just checking in. Still looking for properties?' },
        { day: 30, action: 'email', message: 'Featured properties this month.' },
        { day: 60, action: 'email', message: 'End of quarter deals - limited time offers!' }
      ]
    };

    const sequence = sequences[lead.tier] || sequences.cold;
    const now = new Date();

    const scheduledSequence = sequence.map(step => ({
      ...step,
      scheduledDate: new Date(now.getTime() + step.day * 24 * 60 * 60 * 1000).toISOString(),
      message: step.message
        .replace('{name}', lead.name)
        .replace('{location}', lead.preferredLocation || 'your preferred area')
    }));

    res.json({
      success: true,
      leadId: lead.id,
      tier: lead.tier,
      sequence: scheduledSequence,
      totalSteps: scheduledSequence.length,
      estimatedDuration: `${sequence.length} days`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sequence' });
  }
});

/**
 * Get lead pipeline summary
 */
app.get('/api/pipeline', async (req: Request, res: Response) => {
  try {
    const allLeads = Array.from(leads.values());

    const pipeline = {
      new: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      qualified: { count: 0, value: 0 },
      visiting: { count: 0, value: 0 },
      negotiating: { count: 0, value: 0 },
      'closed-won': { count: 0, value: 0 },
      'closed-lost': { count: 0, value: 0 }
    };

    allLeads.forEach(lead => {
      const stage = lead.status;
      pipeline[stage].count++;
      if (lead.budget.max > 0) {
        pipeline[stage].value += lead.budget.max;
      }
    });

    const conversionRates = {
      newToQualified: pipeline.qualified.count > 0
        ? Math.round(pipeline.qualified.count / (pipeline.new.count + pipeline.contacted.count) * 100)
        : 0,
      qualifiedToWon: pipeline['closed-won'].count > 0
        ? Math.round(pipeline['closed-won'].count / (pipeline.qualified.count + pipeline.visiting.count + pipeline.negotiating.count) * 100)
        : 0,
      overallCloseRate: pipeline['closed-won'].count > 0
        ? Math.round(pipeline['closed-won'].count / allLeads.length * 100)
        : 0
    };

    res.json({
      success: true,
      pipeline,
      conversionRates,
      summary: {
        totalLeads: allLeads.length,
        activePipeline: allLeads.filter(l => !['closed-won', 'closed-lost'].includes(l.status)).length,
        pipelineValue: Object.values(pipeline).reduce((sum, s) => sum + s.value, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pipeline' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const allLeads = Array.from(leads.values());
  res.json({
    status: 'healthy',
    service: 'lead-manager-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Lead qualification',
      'AI scoring',
      'Follow-up automation',
      'Nurture sequences',
      'Pipeline management'
    ],
    stats: {
      totalLeads: leads.size,
      hotLeads: allLeads.filter(l => l.tier === 'hot').length,
      pendingTasks: Array.from(followUpTasks.values()).filter(t => t.status === 'pending').length
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'PROPFLOW Lead Manager AI',
    description: 'AI-powered lead qualification and management',
    version: '1.0.0',
    endpoints: {
      qualify: 'POST /api/leads/qualify',
      list: 'GET /api/leads',
      get: 'GET /api/leads/:id',
      update: 'PATCH /api/leads/:id',
      requalify: 'POST /api/leads/:id/requalify',
      sequence: 'POST /api/leads/:id/sequence',
      tasks: 'GET /api/tasks',
      pipeline: 'GET /api/pipeline'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗
║               PROPFLOW LEAD MANAGER AI v1.0.0        ║
║        Lead Qualification & Follow-up Management      ║
║                                                              ║
║  Tagline: "AI That Converts Leads Into Closed Deals" ║
║  Port: ${PORT}                                               ║
║                                                              ║
║  Capabilities:                                           ║
║  • AI Lead Qualification                              ║
║  • Smart Scoring & Tiering                            ║
║  • Automated Follow-up Sequences                      ║
║  • Pipeline Management                                ║
╚══════════════════════════════════════════════════════════════╝\n`);
});

export { app, calculateLeadScore, generateFollowUpTasks };
