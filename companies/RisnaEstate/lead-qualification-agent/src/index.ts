import { logger } from '../../shared/logger';
/**
 * RisnaEstate Lead Qualification Agent
 * Port: 5100 - AI-powered lead scoring and qualification
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 5100;
const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Types
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: 'website' | 'referral' | 'social' | 'walkin' | 'campaign';
  budget: number;
  propertyType: string[];
  location: string[];
  timeline: 'immediate' | '1month' | '3months' | '6months' | 'exploring';
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  stage: 'new' | 'contacted' | 'qualified' | 'visiting' | 'negotiating' | 'closed';
  assignedTo?: string;
  notes: string[];
  createdAt: Date;
  lastContact?: Date;
}

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  area: number;
}

const leads: Map<string, Lead> = new Map();
const properties: Map<string, Property> = new Map();

// Score calculation
function calculateScore(lead: Partial<Lead>): number {
  let score = 0;

  // Budget score (40 points max)
  if (lead.budget) {
    if (lead.budget >= 10000000) score += 40;
    else if (lead.budget >= 5000000) score += 30;
    else if (lead.budget >= 2000000) score += 20;
    else if (lead.budget >= 1000000) score += 10;
  }

  // Timeline score (30 points max)
  if (lead.timeline) {
    const timelineScores: Record<string, number> = { immediate: 30, '1month': 25, '3months': 15, '6months': 8, exploring: 3 };
    score += timelineScores[lead.timeline] || 0;
  }

  // Source score (20 points max)
  const sourceScores: Record<string, number> = { referral: 20, walkin: 18, campaign: 15, website: 10, social: 8 };
  score += sourceScores[lead.source || ''] || 0;

  // Contact info completeness (10 points)
  if (lead.email) score += 5;
  if (lead.phone) score += 5;

  return Math.min(100, score);
}

function getGrade(score: number): Lead['grade'] {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'lead-agent', version: '1.0.0' });
});

// Lead management
app.post('/api/leads', (req: Request, res: Response) => {
  const { name, phone, email, source, budget, propertyType, location, timeline } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone required' });
  }

  const score = calculateScore({ budget, timeline, source, email, phone });
  const lead: Lead = {
    id: uuidv4(),
    name, phone, email, source: source || 'website',
    budget: budget || 0,
    propertyType: propertyType || [],
    location: location || [],
    timeline: timeline || 'exploring',
    score,
    grade: getGrade(score),
    stage: 'new',
    notes: [],
    createdAt: new Date()
  };

  leads.set(lead.id, lead);
  res.status(201).json({ lead, recommendation: getRecommendation(lead) });
});

app.get('/api/leads', (req: Request, res: Response) => {
  const { grade, stage, assignedTo } = req.query;
  let list = Array.from(leads.values());

  if (grade) list = list.filter(l => l.grade === grade);
  if (stage) list = list.filter(l => l.stage === stage);
  if (assignedTo) list = list.filter(l => l.assignedTo === assignedTo);

  list.sort((a, b) => b.score - a.score);
  res.json({ leads: list, count: list.length });
});

app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ lead, matchingProperties: getMatchingProperties(lead) });
});

app.put('/api/leads/:id/stage', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  lead.stage = req.body.stage;
  lead.lastContact = new Date();
  leads.set(lead.id, lead);
  res.json({ lead });
});

app.post('/api/leads/:id/assign', (req: Request, res: Response) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  lead.assignedTo = req.body.agentId;
  leads.set(lead.id, lead);
  res.json({ lead });
});

// AI Recommendation
function getRecommendation(lead: Lead): { action: string; message: string } {
  if (lead.grade === 'A') {
    return { action: 'priority', message: `High-value lead! Contact within 1 hour. Budget: ₹${(lead.budget / 100000).toFixed(1)}L` };
  }
  if (lead.grade === 'B') {
    return { action: 'schedule', message: 'Schedule visit within 24 hours. Good conversion potential.' };
  }
  if (lead.grade === 'C') {
    return { action: 'nurture', message: 'Add to nurture sequence. Send relevant listings weekly.' };
  }
  return { action: 'archive', message: 'Low priority. Respond when resources available.' };
}

function getMatchingProperties(lead: Lead): Property[] {
  return Array.from(properties.values()).filter(p => {
    if (lead.budget && p.price > lead.budget * 1.2) return false;
    if (lead.propertyType.length && !lead.propertyType.includes(p.type)) return false;
    if (lead.location.length && !lead.location.includes(p.location)) return false;
    return true;
  });
}

// Dashboard
app.get('/api/dashboard', (_req: Request, res: Response) => {
  const all = Array.from(leads.values());
  res.json({
    total: all.length,
    byGrade: { A: all.filter(l => l.grade === 'A').length, B: all.filter(l => l.grade === 'B').length, C: all.filter(l => l.grade === 'C').length, D: all.filter(l => l.grade === 'D').length },
    byStage: all.reduce((acc, l) => { acc[l.stage] = (acc[l.stage] || 0) + 1; return acc; }, {} as Record<string, number>),
    avgScore: all.length ? all.reduce((s, l) => s + l.score, 0) / all.length : 0
  });
});

app.listen(PORT, () => logger.info(`Lead Qualification Agent running on port ${PORT}`));
export default app;