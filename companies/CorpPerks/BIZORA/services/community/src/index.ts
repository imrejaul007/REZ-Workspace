/**
 * BIZORA Community & Knowledge Network
 * "Organic Retention Engine"
 * Playbooks, guides, templates, benchmarking, founder community, CA/legal discussions
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Playbook {
  id: string;
  title: string;
  industry: string;
  category: 'launch' | 'growth' | 'compliance' | 'marketing' | 'operations' | 'finance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  steps: number;
  views: number;
  rating: number;
  author: { name: string; verified: boolean };
  tags: string[];
  content: string;
}

interface Discussion {
  id: string;
  title: string;
  category: 'general' | 'compliance' | 'marketing' | 'operations' | 'funding' | 'legal';
  author: { id: string; name: string; business: string };
  content: string;
  replies: number;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  lastActivity: string;
}

interface Template {
  id: string;
  title: string;
  type: 'invoice' | 'contract' | 'proposal' | 'checklist' | 'report' | 'email';
  industry: string;
  downloads: number;
  rating: number;
  author: { name: string; verified: boolean };
  preview: string;
  tags: string[];
}

interface Expert {
  id: string;
  name: string;
  type: 'ca' | 'lawyer' | 'consultant' | 'mentor' | 'agency';
  specialization: string[];
  rating: number;
  sessions: number;
  hourlyRate?: number;
  verified: boolean;
}

// ============================================================================
// Sample Data
// ============================================================================

const playbooks: Playbook[] = [
  {
    id: 'pb1',
    title: 'Restaurant Launch in 6 Weeks',
    industry: 'restaurant',
    category: 'launch',
    difficulty: 'intermediate',
    duration: '6 weeks',
    steps: 42,
    views: 12500,
    rating: 4.8,
    author: { name: 'BIZORA Team', verified: true },
    tags: ['setup', 'registration', 'gst', 'fssai', 'pos'],
    content: '# Restaurant Launch Playbook\n\nWeek 1-2: Legal Setup\n- Company registration\n- GST registration\n...',
  },
  {
    id: 'pb2',
    title: 'Salon Launch from Scratch',
    industry: 'salon',
    category: 'launch',
    difficulty: 'beginner',
    duration: '4 weeks',
    steps: 28,
    views: 8900,
    rating: 4.7,
    author: { name: 'BIZORA Team', verified: true },
    tags: ['setup', 'appointments', 'marketing'],
    content: '# Salon Launch Playbook\n\nWeek 1: Legal Setup...',
  },
  {
    id: 'pb3',
    title: 'UAE Company Setup for Indian Businesses',
    industry: 'all',
    category: 'launch',
    difficulty: 'advanced',
    duration: '8 weeks',
    steps: 65,
    views: 5200,
    rating: 4.9,
    author: { name: 'BIZORA Team', verified: true },
    tags: ['uae', 'dubai', 'vat', 'expansion'],
    content: '# UAE Expansion Playbook\n\nStep 1: Choose Business Type...',
  },
  {
    id: 'pb4',
    title: 'GST Compliance Mastery',
    industry: 'all',
    category: 'compliance',
    difficulty: 'intermediate',
    duration: 'Ongoing',
    steps: 35,
    views: 15000,
    rating: 4.6,
    author: { name: 'CA Vikas Sharma', verified: true },
    tags: ['gst', 'filing', 'compliance', 'tax'],
    content: '# GST Compliance Guide\n\n## Monthly Tasks...',
  },
  {
    id: 'pb5',
    title: 'Restaurant Marketing on a Budget',
    industry: 'restaurant',
    category: 'marketing',
    difficulty: 'beginner',
    duration: '4 weeks',
    steps: 22,
    views: 9800,
    rating: 4.5,
    author: { name: 'DigitalBuzz Agency', verified: true },
    tags: ['marketing', 'social', 'zomato', 'instagram'],
    content: '# Restaurant Marketing Guide\n\nWeek 1: Social Media Setup...',
  },
];

const discussions: Discussion[] = [
  {
    id: 'd1',
    title: 'Best POS system for a 20-table restaurant in Mumbai?',
    category: 'operations',
    author: { id: 'u1', name: 'Rahul Mehta', business: 'The Spice Route' },
    content: 'Looking for POS recommendations. Currently using manual billing...',
    replies: 23,
    views: 1450,
    likes: 45,
    tags: ['pos', 'restaurant', 'mumbai'],
    createdAt: '2026-05-20',
    lastActivity: '2026-05-23',
  },
  {
    id: 'd2',
    title: 'GSTR-1 vs GSTR-3B - When to file what?',
    category: 'compliance',
    author: { id: 'u2', name: 'Priya Patel', business: 'FitLife Salon' },
    content: 'Confused about the difference between GSTR-1 and GSTR-3B...',
    replies: 18,
    views: 2300,
    likes: 67,
    tags: ['gst', 'compliance', 'tax'],
    createdAt: '2026-05-18',
    lastActivity: '2026-05-22',
  },
  {
    id: 'd3',
    title: 'How to handle delivery complaints on Zomato?',
    category: 'operations',
    author: { id: 'u3', name: 'Amit Singh', business: 'Pizza Paradise' },
    content: 'Getting 3-4 complaints daily about late delivery. Any tips?',
    replies: 31,
    views: 1890,
    likes: 52,
    tags: ['delivery', 'zomato', 'complaints'],
    createdAt: '2026-05-15',
    lastActivity: '2026-05-23',
  },
  {
    id: 'd4',
    title: 'Dubai freezone vs mainland - pros and cons?',
    category: 'general',
    author: { id: 'u4', name: 'Suresh Kumar', business: 'TechStart India' },
    content: 'Planning to expand to UAE. Which is better for IT services?',
    replies: 42,
    views: 3200,
    likes: 89,
    tags: ['uae', 'dubai', 'expansion'],
    createdAt: '2026-05-10',
    lastActivity: '2026-05-21',
  },
];

const templates: Template[] = [
  {
    id: 't1',
    title: 'Restaurant Franchise Agreement',
    type: 'contract',
    industry: 'restaurant',
    downloads: 2340,
    rating: 4.7,
    author: { name: 'LegalDesk', verified: true },
    preview: 'Franchise Agreement Template for Restaurant Chains...',
    tags: ['franchise', 'agreement', 'legal'],
  },
  {
    id: 't2',
    title: 'Monthly GST Filing Checklist',
    type: 'checklist',
    industry: 'all',
    downloads: 5600,
    rating: 4.9,
    author: { name: 'CA Sharma', verified: true },
    preview: 'Never miss a GST deadline again...',
    tags: ['gst', 'checklist', 'compliance'],
  },
  {
    id: 't3',
    title: 'Restaurant Project Proposal',
    type: 'proposal',
    industry: 'restaurant',
    downloads: 1890,
    rating: 4.6,
    author: { name: 'Bizora Templates', verified: true },
    preview: 'Professional proposal template for restaurant projects...',
    tags: ['proposal', 'restaurant', 'project'],
  },
  {
    id: 't4',
    title: 'Employee Offer Letter Template',
    type: 'contract',
    industry: 'all',
    downloads: 4200,
    rating: 4.8,
    author: { name: 'PeopleOS', verified: true },
    preview: 'Compliant offer letter with all clauses...',
    tags: ['hr', 'employee', 'offer'],
  },
];

const experts: Expert[] = [
  {
    id: 'e1',
    name: 'CA Vikas Sharma',
    type: 'ca',
    specialization: ['GST', 'Income Tax', 'Compliance'],
    rating: 4.9,
    sessions: 234,
    hourlyRate: 1500,
    verified: true,
  },
  {
    id: 'e2',
    name: 'Advocate Rajesh Gupta',
    type: 'lawyer',
    specialization: ['Business Law', 'Contracts', 'IP'],
    rating: 4.8,
    sessions: 156,
    hourlyRate: 3000,
    verified: true,
  },
  {
    id: 'e3',
    name: 'Restaurant Expert Network',
    type: 'agency',
    specialization: ['Restaurant Setup', 'Menu Design', 'Marketing'],
    rating: 4.7,
    sessions: 89,
    verified: true,
  },
  {
    id: 'e4',
    name: 'Rahul Khanna',
    type: 'mentor',
    specialization: ['F&B Growth', 'Scaling', 'Operations'],
    rating: 4.9,
    sessions: 312,
    verified: true,
  },
];

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'community',
    playbooks: playbooks.length,
    discussions: discussions.length,
    templates: templates.length,
    experts: experts.length,
  });
});

// === PLAYBOOKS ===

// List playbooks
app.get('/api/playbooks', (req: Request, res: Response) => {
  const { industry, category, difficulty, search } = req.query;

  let filtered = [...playbooks];

  if (industry) filtered = filtered.filter(p => p.industry === industry || p.industry === 'all');
  if (category) filtered = filtered.filter(p => p.category === category);
  if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
  if (search) filtered = filtered.filter(p =>
    p.title.toLowerCase().includes((search as string).toLowerCase()) ||
    p.tags.some(t => t.includes(search as string))
  );

  filtered.sort((a, b) => b.views - a.views);

  res.json({
    playbooks: filtered,
    categories: [...new Set(playbooks.map(p => p.category))],
    industries: [...new Set(playbooks.map(p => p.industry))],
  });
});

// Get playbook
app.get('/api/playbooks/:id', (req: Request, res: Response) => {
  const playbook = playbooks.find(p => p.id === req.params.id);
  if (!playbook) return res.status(404).json({ error: 'Playbook not found' });

  // Increment views
  playbook.views++;

  res.json(playbook);
});

// === DISCUSSIONS ===

// List discussions
app.get('/api/discussions', (req: Request, res: Response) => {
  const { category, search, sort = 'recent' } = req.query;

  let filtered = [...discussions];

  if (category) filtered = filtered.filter(d => d.category === category);
  if (search) filtered = filtered.filter(d =>
    d.title.toLowerCase().includes((search as string).toLowerCase()) ||
    d.tags.some(t => t.includes(search as string))
  );

  if (sort === 'popular') filtered.sort((a, b) => b.views - a.views);
  else if (sort === 'active') filtered.sort((a, b) => b.likes - a.likes);
  else filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  res.json({
    discussions: filtered,
    categories: [...new Set(discussions.map(d => d.category))],
  });
});

// Get discussion
app.get('/api/discussions/:id', (req: Request, res: Response) => {
  const discussion = discussions.find(d => d.id === req.params.id);
  if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

  discussion.views++;
  res.json(discussion);
});

// Create discussion
app.post('/api/discussions', (req: Request, res: Response) => {
  const { title, category, content, tags, author } = req.body;

  const id = `d_${Date.now()}`;
  const discussion: Discussion = {
    id,
    title,
    category,
    author,
    content,
    replies: 0,
    views: 0,
    likes: 0,
    tags,
    createdAt: new Date().toISOString().split('T')[0],
    lastActivity: new Date().toISOString().split('T')[0],
  };

  discussions.unshift(discussion);

  res.status(201).json({
    discussionId: id,
    message: 'Discussion posted successfully',
  });
});

// === TEMPLATES ===

// List templates
app.get('/api/templates', (req: Request, res: Response) => {
  const { type, industry, search } = req.query;

  let filtered = [...templates];

  if (type) filtered = filtered.filter(t => t.type === type);
  if (industry) filtered = filtered.filter(t => t.industry === industry || t.industry === 'all');
  if (search) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes((search as string).toLowerCase()) ||
    t.tags.some(tag => tag.includes(search as string))
  );

  filtered.sort((a, b) => b.downloads - a.downloads);

  res.json({
    templates: filtered,
    types: [...new Set(templates.map(t => t.type))],
  });
});

// Get template
app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  template.downloads++;
  res.json(template);
});

// === EXPERTS ===

// List experts
app.get('/api/experts', (req: Request, res: Response) => {
  const { type, specialization } = req.query;

  let filtered = [...experts];

  if (type) filtered = filtered.filter(e => e.type === type);
  if (specialization) filtered = filtered.filter(e =>
    e.specialization.some(s => s.toLowerCase().includes((specialization as string).toLowerCase()))
  );

  filtered.sort((a, b) => b.rating - a.rating);

  res.json({
    experts: filtered,
    types: [...new Set(experts.map(e => e.type))],
  });
});

// Book expert
app.post('/api/experts/:id/book', (req: Request, res: Response) => {
  const expert = experts.find(e => e.id === req.params.id);
  if (!expert) return res.status(404).json({ error: 'Expert not found' });

  const { userId, topic, duration, preferredTime } = req.body;

  res.json({
    bookingId: `book_${Date.now()}`,
    expert: { id: expert.id, name: expert.name },
    topic,
    duration,
    cost: expert.hourlyRate ? expert.hourlyRate * duration : 0,
    status: 'confirmed',
    meetingLink: `bizora.com/meet/${expert.id}/${Date.now()}`,
  });
});

// === COMMUNITY DASHBOARD ===

app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json({
    stats: {
      members: 12500,
      activeToday: 423,
      discussions: discussions.length,
      playbooks: playbooks.length,
    },
    trendingPlaybooks: playbooks.sort((a, b) => b.views - a.views).slice(0, 3),
    recentDiscussions: discussions.sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    ).slice(0, 5),
    topExperts: experts.sort((a, b) => b.sessions - a.sessions).slice(0, 3),
  });
});

const PORT = process.env.PORT || 4084;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  👥 Community & Knowledge Network        ║
║  Organic Retention Engine              ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════════════╝
  `);
});
