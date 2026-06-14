/**
 * REZ Atlas Score - Lead Scoring Routes
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store (would use database in production)
interface Lead {
  id: string;
  merchantId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  category?: string;
  source: string;
  status: 'new' | 'assigned' | 'in_progress' | 'qualified' | 'converted' | 'disqualified';
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  ownerId?: string;
  assignedAt?: string;
  convertedAt?: string;
  tags: string[];
  notes: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  description: string;
  createdAt: string;
}

const leads: Map<string, Lead> = new Map();
const activities: Map<string, LeadActivity[]> = new Map();

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

function calculateScore(lead: Partial<Lead>): number {
  let score = 0;

  // Basic info scoring
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 20;
  if (lead.name) score += 10;

  // Category scoring (merchant intelligence)
  const categoryScores: Record<string, number> = {
    restaurant: 25,
    retail: 20,
    hotel: 25,
    salon: 15,
    healthcare: 20,
    ecommerce: 30,
    services: 15
  };
  if (lead.category && categoryScores[lead.category]) {
    score += categoryScores[lead.category];
  }

  // Source scoring
  const sourceScores: Record<string, number> = {
    organic: 20,
    referral: 35,
    linkedin: 30,
    cold_email: 10,
    webinar: 20,
    paid_ads: 15,
    partnership: 25,
    event: 20,
    discovery: 30, // From Atlas Discover
    twin: 25 // From Atlas Twin
  };
  if (lead.source && sourceScores[lead.source]) {
    score += sourceScores[lead.source];
  }

  // Metadata enrichment
  if (lead.metadata) {
    if (lead.metadata.hasWebsite) score += 10;
    if (lead.metadata.hasPOS) score += 15;
    if (lead.metadata.hasReviews) score += 10;
    if (lead.metadata.twinScore) score += Math.min(lead.metadata.twinScore, 20);
    if (lead.metadata.revenueEstimate) score += Math.min(lead.metadata.revenueEstimate / 10000, 15);
  }

  return Math.min(score, 100);
}

function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function getRecommendation(score: number): string {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  return 'cold';
}

// ============================================================================
// LEADS API
// ============================================================================

/**
 * GET /api/leads
 * List leads with filters
 */
router.get('/leads', (req: Request, res: Response) => {
  const { status, grade, ownerId, source, limit = 100 } = req.query;

  let filtered = Array.from(leads.values());

  if (status) filtered = filtered.filter(l => l.status === status);
  if (grade) filtered = filtered.filter(l => l.grade === grade);
  if (ownerId) filtered = filtered.filter(l => l.ownerId === ownerId);
  if (source) filtered = filtered.filter(l => l.source === source);

  filtered = filtered.slice(0, Number(limit));

  res.json({
    leads: filtered,
    count: filtered.length,
    total: leads.size
  });
});

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/leads', (req: Request, res: Response) => {
  const { name, email, phone, company, category, source, ownerId, tags, metadata, merchantId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const leadData: Partial<Lead> = { name, email, phone, company, category, source, metadata, merchantId };
  const score = calculateScore(leadData);

  const lead: Lead = {
    id: uuidv4(),
    merchantId,
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    category: category || 'services',
    source: source || 'organic',
    status: 'new',
    score,
    grade: calculateGrade(score),
    ownerId,
    tags: tags || [],
    notes: [],
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.set(lead.id, lead);
  activities.set(lead.id, []);

  res.status(201).json({
    lead,
    recommendation: {
      label: getRecommendation(score),
      score,
      grade: lead.grade
    }
  });
});

/**
 * GET /api/leads/:id
 * Get lead by ID
 */
router.get('/leads/:id', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const leadActivities = activities.get(lead.id) || [];

  res.json({
    lead,
    activities: leadActivities,
    recommendation: {
      label: getRecommendation(lead.score),
      score: lead.score,
      grade: lead.grade
    }
  });
});

/**
 * PUT /api/leads/:id
 * Update a lead
 */
router.put('/leads/:id', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { status, ownerId, tags, notes, metadata, name, email, phone, company, category, source } = req.body;

  if (status) lead.status = status;
  if (ownerId) lead.ownerId = ownerId;
  if (tags) lead.tags = [...lead.tags, ...tags];
  if (notes) lead.notes = [...lead.notes, ...notes];
  if (metadata) lead.metadata = { ...lead.metadata, ...metadata };
  if (name) lead.name = name;
  if (email) lead.email = email;
  if (phone) lead.phone = phone;
  if (company) lead.company = company;
  if (category) lead.category = category;
  if (source) lead.source = source;

  // Recalculate score if relevant fields changed
  const newScore = calculateScore(lead);
  lead.score = newScore;
  lead.grade = calculateGrade(newScore);
  lead.updatedAt = new Date().toISOString();

  res.json({
    lead,
    recommendation: {
      label: getRecommendation(lead.score),
      score: lead.score,
      grade: lead.grade
    }
  });
});

/**
 * DELETE /api/leads/:id
 * Delete a lead
 */
router.delete('/leads/:id', (req: Request, res: Response) => {
  const existed = leads.delete(req.params.id);

  if (!existed) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  activities.delete(req.params.id);

  res.json({ success: true });
});

// ============================================================================
// SCORE
// ============================================================================

/**
 * POST /api/leads/:id/score
 * Recalculate lead score
 */
router.post('/leads/:id/score', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Update metadata if provided
  if (req.body.metadata) {
    lead.metadata = { ...lead.metadata, ...req.body.metadata };
  }

  // Recalculate score
  const newScore = calculateScore(lead);
  const oldScore = lead.score;

  lead.score = newScore;
  lead.grade = calculateGrade(newScore);
  lead.updatedAt = new Date().toISOString();

  res.json({
    lead,
    scoreChange: {
      previous: oldScore,
      current: newScore,
      delta: newScore - oldScore
    },
    recommendation: {
      label: getRecommendation(newScore),
      score: newScore,
      grade: lead.grade
    }
  });
});

/**
 * POST /api/leads/:id/score/bulk
 * Bulk score multiple leads
 */
router.post('/leads/score/bulk', (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const results = [];
  for (const id of ids) {
    const lead = leads.get(id);
    if (lead) {
      const newScore = calculateScore(lead);
      lead.score = newScore;
      lead.grade = calculateGrade(newScore);
      lead.updatedAt = new Date().toISOString();
      results.push({ id, score: newScore, grade: lead.grade });
    }
  }

  res.json({
    updated: results.length,
    results
  });
});

// ============================================================================
// ACTIVITIES
// ============================================================================

/**
 * POST /api/leads/:id/activities
 * Add activity to lead
 */
router.post('/leads/:id/activities', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { type, description } = req.body;

  const activity: LeadActivity = {
    id: uuidv4(),
    leadId: lead.id,
    type: type || 'note',
    description: description || '',
    createdAt: new Date().toISOString()
  };

  if (!activities.has(lead.id)) {
    activities.set(lead.id, []);
  }
  activities.get(lead.id)!.push(activity);

  // Update lead status based on activity
  if (type === 'email_sent') lead.status = 'in_progress';
  if (type === 'call_completed' && lead.status === 'new') lead.status = 'in_progress';
  if (type === 'meeting') lead.status = 'qualified';

  res.status(201).json({ activity });
});

/**
 * GET /api/leads/:id/activities
 * Get lead activities
 */
router.get('/leads/:id/activities', (req: Request, res: Response) => {
  const leadActivities = activities.get(req.params.id) || [];
  res.json({ activities: leadActivities });
});

// ============================================================================
// ASSIGNMENT
// ============================================================================

/**
 * POST /api/leads/:id/assign
 * Assign lead to owner
 */
router.post('/leads/:id/assign', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { ownerId } = req.body;

  lead.ownerId = ownerId;
  lead.status = 'assigned';
  lead.assignedAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();

  res.json({ lead });
});

/**
 * POST /api/leads/:id/convert
 * Convert lead to customer
 */
router.post('/leads/:id/convert', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  lead.status = 'converted';
  lead.convertedAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();

  res.json({
    lead,
    message: 'Lead converted to customer'
  });
});

/**
 * POST /api/leads/bulk-assign
 * Bulk assign leads
 */
router.post('/leads/bulk-assign', (req: Request, res: Response) => {
  const { ids, ownerId } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const updated = [];
  for (const id of ids) {
    const lead = leads.get(id);
    if (lead) {
      lead.ownerId = ownerId;
      lead.status = 'assigned';
      lead.assignedAt = new Date().toISOString();
      lead.updatedAt = new Date().toISOString();
      updated.push(id);
    }
  }

  res.json({
    updated: updated.length,
    ids: updated
  });
});

// ============================================================================
// STATS
// ============================================================================

/**
 * GET /api/stats
 * Get lead statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  const allLeads = Array.from(leads.values());

  const byStatus = {
    new: allLeads.filter(l => l.status === 'new').length,
    assigned: allLeads.filter(l => l.status === 'assigned').length,
    in_progress: allLeads.filter(l => l.status === 'in_progress').length,
    qualified: allLeads.filter(l => l.status === 'qualified').length,
    converted: allLeads.filter(l => l.status === 'converted').length,
    disqualified: allLeads.filter(l => l.status === 'disqualified').length
  };

  const byGrade = {
    A: allLeads.filter(l => l.grade === 'A').length,
    B: allLeads.filter(l => l.grade === 'B').length,
    C: allLeads.filter(l => l.grade === 'C').length,
    D: allLeads.filter(l => l.grade === 'D').length
  };

  const bySource: Record<string, number> = {};
  allLeads.forEach(l => {
    bySource[l.source] = (bySource[l.source] || 0) + 1;
  });

  const recommendations = {
    hot: allLeads.filter(l => l.score >= 80).length,
    warm: allLeads.filter(l => l.score >= 60 && l.score < 80).length,
    cold: allLeads.filter(l => l.score < 60).length
  };

  const averageScore = allLeads.length > 0
    ? Math.round(allLeads.reduce((s, l) => s + l.score, 0) / allLeads.length)
    : 0;

  res.json({
    total: allLeads.length,
    byStatus,
    byGrade,
    bySource,
    recommendations,
    averageScore
  });
});

export { router as scoreRoutes };