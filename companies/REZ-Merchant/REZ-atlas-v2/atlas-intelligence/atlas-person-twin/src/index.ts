/**
 * REZ Atlas v2 - Person Twin Service
 * Contact Intelligence Engine
 *
 * Provides deep contact intelligence:
 * - Email finding & verification
 * - Phone number lookup
 * - LinkedIn profiles
 * - Role & influence scoring
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5157;

// Person Twin Interface
interface PersonTwin {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  emailType: 'work' | 'personal' | 'unknown';
  phone: string;
  phoneVerified: boolean;
  whatsapp: string;
  linkedin: string;
  twitter: string;
  role: string;
  title: string;
  seniority: 'owner' | 'founder' | 'director' | 'manager' | 'executive' | 'staff';
  department: string;
  influenceScore: number;
  engagementScore: number;
  companyId: string;
  companyName: string;
  companyDomain: string;
  linkedAccounts: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  bestContactTime: string;
  socialProfiles: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
  };
  outreachHistory: {
    lastEmail: string | null;
    lastCall: string | null;
    lastMeeting: string | null;
    emailCount: number;
    callCount: number;
  };
  dataSources: string[];
  enrichedAt: string;
  tags: string[];
}

// In-memory storage
const personTwins: Map<string, PersonTwin> = new Map();

// Seed sample contacts
const sampleContacts: PersonTwin[] = [
  {
    id: uuidv4(),
    firstName: 'Rajesh',
    lastName: 'Sharma',
    fullName: 'Rajesh Sharma',
    email: 'rajesh@truffles.in',
    emailVerified: true,
    emailType: 'work',
    phone: '+919876543210',
    phoneVerified: true,
    whatsapp: '+919876543210',
    linkedin: 'https://linkedin.com/in/rajesh-sharma-truffles',
    twitter: 'rajeshTruffles',
    role: 'owner',
    title: 'Owner & Founder',
    seniority: 'owner',
    department: 'Leadership',
    influenceScore: 95,
    engagementScore: 78,
    companyId: 'c1',
    companyName: 'Truffles Restaurant',
    companyDomain: 'truffles.in',
    linkedAccounts: [],
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    bestContactTime: '10:00-11:00 AM',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/rajesh-sharma-truffles',
      twitter: 'rajeshTruffles',
      facebook: '',
      instagram: 'rajesh_sharma'
    },
    outreachHistory: {
      lastEmail: '2026-06-01',
      lastCall: null,
      lastMeeting: '2026-05-15',
      emailCount: 3,
      callCount: 0
    },
    dataSources: ['LinkedIn', 'Google', 'Website'],
    enrichedAt: new Date().toISOString(),
    tags: ['decision-maker', 'food-industry', 'bangalore']
  },
  {
    id: uuidv4(),
    firstName: 'Priya',
    lastName: 'Menon',
    fullName: 'Priya Menon',
    email: 'priya.menon@urbanivan.com',
    emailVerified: true,
    emailType: 'work',
    phone: '+919876543211',
    phoneVerified: true,
    whatsapp: '+919876543211',
    linkedin: 'https://linkedin.com/in/priya-menon-salon',
    twitter: '',
    role: 'manager',
    title: 'Operations Manager',
    seniority: 'manager',
    department: 'Operations',
    influenceScore: 72,
    engagementScore: 85,
    companyId: 'c2',
    companyName: 'Urbanivan Salon',
    companyDomain: 'urbanivan.com',
    linkedAccounts: [],
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    bestContactTime: '2:00-4:00 PM',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/priya-menon-salon',
      twitter: '',
      facebook: 'priya.menon.7',
      instagram: 'priya_menon_salon'
    },
    outreachHistory: {
      lastEmail: '2026-06-05',
      lastCall: '2026-06-03',
      lastMeeting: null,
      emailCount: 5,
      callCount: 2
    },
    dataSources: ['LinkedIn', 'Instagram'],
    enrichedAt: new Date().toISOString(),
    tags: ['operations', 'beauty-industry', 'bangalore']
  },
  {
    id: uuidv4(),
    firstName: 'Amit',
    lastName: 'Kapoor',
    fullName: 'Amit Kapoor',
    email: 'amit.k@freshmart.in',
    emailVerified: true,
    emailType: 'work',
    phone: '+919876543212',
    phoneVerified: true,
    whatsapp: '+919876543212',
    linkedin: 'https://linkedin.com/in/amit-kapoor-freshmart',
    twitter: 'amitfreshmart',
    role: 'director',
    title: 'Director of Operations',
    seniority: 'director',
    department: 'Operations',
    influenceScore: 88,
    engagementScore: 92,
    companyId: 'c3',
    companyName: 'FreshMart Grocery',
    companyDomain: 'freshmart.in',
    linkedAccounts: ['c4', 'c5'],
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    bestContactTime: '9:00-10:00 AM',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/amit-kapoor-freshmart',
      twitter: 'amitfreshmart',
      facebook: '',
      instagram: 'amit_kapoor_fm'
    },
    outreachHistory: {
      lastEmail: '2026-06-08',
      lastCall: '2026-06-06',
      lastMeeting: '2026-05-28',
      emailCount: 12,
      callCount: 5
    },
    dataSources: ['LinkedIn', 'Sequoia', 'Company Website'],
    enrichedAt: new Date().toISOString(),
    tags: ['decision-maker', 'funded-company', 'retail', 'bangalore']
  }
];

sampleContacts.forEach(c => personTwins.set(c.id, c));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atlas-person-twin',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all contacts
app.get('/api/contacts', (req, res) => {
  const { seniority, department, companyId, minScore, limit = 50 } = req.query;
  let filtered = Array.from(personTwins.values());

  if (seniority) filtered = filtered.filter(p => p.seniority === seniority);
  if (department) filtered = filtered.filter(p => p.department === department);
  if (companyId) filtered = filtered.filter(p => p.companyId === companyId);
  if (minScore) filtered = filtered.filter(p => p.influenceScore >= Number(minScore));

  filtered.sort((a, b) => b.influenceScore - a.influenceScore);

  res.json({
    contacts: filtered.slice(0, Number(limit)),
    count: filtered.length,
    total: personTwins.size
  });
});

// Get contact by ID
app.get('/api/contacts/:id', (req, res) => {
  const contact = personTwins.get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json(contact);
});

// Search contacts
app.post('/api/contacts/search', (req, res) => {
  const { query, seniority, department, company, city, hasEmail, hasPhone } = req.body;

  let results = Array.from(personTwins.values());

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q)
    );
  }

  if (seniority) results = results.filter(p => p.seniority === seniority);
  if (department) results = results.filter(p => p.department === department);
  if (company) results = results.filter(p => p.companyName.toLowerCase().includes(company.toLowerCase()));
  if (city) results = results.filter(p => p.location.city.toLowerCase().includes(city.toLowerCase()));
  if (hasEmail) results = results.filter(p => p.email && p.emailVerified);
  if (hasPhone) results = results.filter(p => p.phone && p.phoneVerified);

  results.sort((a, b) => b.influenceScore - a.influenceScore);

  res.json({
    contacts: results,
    count: results.length
  });
});

// Create contact
app.post('/api/contacts', (req, res) => {
  const { firstName, lastName, email, phone, companyName, companyDomain, role, title } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  const contact: PersonTwin = {
    id: uuidv4(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: email || '',
    emailVerified: false,
    emailType: 'unknown',
    phone: phone || '',
    phoneVerified: false,
    whatsapp: phone || '',
    linkedin: '',
    twitter: '',
    role: role || 'unknown',
    title: title || '',
    seniority: determineSeniority(role || ''),
    department: determineDepartment(role || ''),
    influenceScore: 50,
    engagementScore: 0,
    companyId: '',
    companyName: companyName || '',
    companyDomain: companyDomain || '',
    linkedAccounts: [],
    location: { city: '', state: '', country: 'India' },
    bestContactTime: '9:00-5:00 PM',
    socialProfiles: { linkedin: '', twitter: '', facebook: '', instagram: '' },
    outreachHistory: {
      lastEmail: null,
      lastCall: null,
      lastMeeting: null,
      emailCount: 0,
      callCount: 0
    },
    dataSources: [],
    enrichedAt: new Date().toISOString(),
    tags: []
  };

  personTwins.set(contact.id, contact);

  res.status(201).json(contact);
});

// Find email for contact
app.post('/api/contacts/:id/find-email', async (req, res) => {
  const contact = personTwins.get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Simulate email finding
  const firstInitial = contact.firstName.toLowerCase();
  const lastName = contact.lastName.toLowerCase().replace(/\s+/g, '');
  const domain = contact.companyDomain || 'company.com';

  const patterns = [
    `${firstInitial}.${lastName}@${domain}`,
    `${firstInitial}${lastName}@${domain}`,
    `${lastName}@${domain}`,
    `${firstInitial[0]}${lastName}@${domain}`
  ];

  const foundEmail = patterns[Math.floor(Math.random() * patterns.length)];
  const verified = Math.random() > 0.3;

  contact.email = foundEmail;
  contact.emailVerified = verified;
  contact.emailType = 'work';
  contact.dataSources.push('Email Finder');

  personTwins.set(contact.id, contact);

  res.json({
    email: foundEmail,
    verified,
    patterns
  });
});

// Find phone for contact
app.post('/api/contacts/:id/find-phone', async (req, res) => {
  const contact = personTwins.get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Simulate phone finding
  const phone = `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  const verified = Math.random() > 0.2;

  contact.phone = phone;
  contact.phoneVerified = verified;
  contact.whatsapp = phone;
  contact.dataSources.push('Phone Finder');

  personTwins.set(contact.id, contact);

  res.json({
    phone,
    verified,
    hasWhatsApp: verified
  });
});

// Enrich contact
app.post('/api/contacts/:id/enrich', async (req, res) => {
  const contact = personTwins.get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Simulate enrichment
  const enrichment = {
    linkedin: `https://linkedin.com/in/${contact.firstName.toLowerCase()}-${contact.lastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
    twitter: contact.firstName.toLowerCase() + contact.lastName.toLowerCase(),
    influenceScore: Math.floor(Math.random() * 30) + 60,
    engagementScore: Math.floor(Math.random() * 40) + 50,
    bestContactTime: ['9:00-10:00 AM', '2:00-3:00 PM', '4:00-5:00 PM'][Math.floor(Math.random() * 3)],
    dataSources: ['LinkedIn', 'Hunter.io', 'Apollo.io']
  };

  Object.assign(contact, enrichment);
  contact.dataSources = [...new Set([...contact.dataSources, ...enrichment.dataSources])];
  contact.enrichedAt = new Date().toISOString();

  personTwins.set(contact.id, contact);

  res.json({
    contact,
    enrichment
  });
});

// Update outreach
app.post('/api/contacts/:id/outreach', (req, res) => {
  const contact = personTwins.get(req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const { type, date } = req.body;

  if (type === 'email') {
    contact.outreachHistory.lastEmail = date || new Date().toISOString();
    contact.outreachHistory.emailCount++;
  } else if (type === 'call') {
    contact.outreachHistory.lastCall = date || new Date().toISOString();
    contact.outreachHistory.callCount++;
  } else if (type === 'meeting') {
    contact.outreachHistory.lastMeeting = date || new Date().toISOString();
  }

  // Recalculate engagement score
  const recency = contact.outreachHistory.lastEmail ?
    daysSince(contact.outreachHistory.lastEmail) : 30;
  contact.engagementScore = Math.min(100,
    (100 - recency) * 0.5 +
    contact.outreachHistory.emailCount * 5 +
    contact.outreachHistory.callCount * 10
  );

  personTwins.set(contact.id, contact);

  res.json(contact);
});

// Get contacts by seniority
app.get('/api/contacts/seniority/:level', (req, res) => {
  const { level } = req.params;
  const contacts = Array.from(personTwins.values()).filter(p => p.seniority === level);
  res.json({ contacts, count: contacts.length });
});

// Helper functions
function determineSeniority(role: string): PersonTwin['seniority'] {
  const r = role.toLowerCase();
  if (r.includes('owner') || r.includes('founder')) return 'owner';
  if (r.includes('director') || r.includes('ceo') || r.includes('coo') || r.includes('cfo')) return 'director';
  if (r.includes('vp') || r.includes('head')) return 'executive';
  if (r.includes('manager') || r.includes('lead')) return 'manager';
  return 'staff';
}

function determineDepartment(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('market') || r.includes('sales')) return 'Marketing/Sales';
  if (r.includes('operat') || r.includes('supply')) return 'Operations';
  if (r.includes('financ') || r.includes('account')) return 'Finance';
  if (r.includes('hr') || r.includes('human')) return 'HR';
  if (r.includes('techn') || r.includes('engineer')) return 'Technology';
  return 'General';
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Contact analytics
app.get('/api/analytics/overview', (req, res) => {
  const contacts = Array.from(personTwins.values());

  const overview = {
    totalContacts: contacts.length,
    verifiedEmails: contacts.filter(c => c.emailVerified).length,
    verifiedPhones: contacts.filter(c => c.phoneVerified).length,
    bySeniority: contacts.reduce((acc, c) => {
      acc[c.seniority] = (acc[c.seniority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDepartment: contacts.reduce((acc, c) => {
      acc[c.department] = (acc[c.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgInfluenceScore: Math.round(contacts.reduce((sum, c) => sum + c.influenceScore, 0) / contacts.length),
    avgEngagementScore: Math.round(contacts.reduce((sum, c) => sum + c.engagementScore, 0) / contacts.length),
    topContacts: contacts.sort((a, b) => b.influenceScore - a.influenceScore).slice(0, 5).map(c => ({
      id: c.id,
      name: c.fullName,
      title: c.title,
      company: c.companyName,
      score: c.influenceScore
    }))
  };

  res.json(overview);
});

// Start server
app.listen(PORT, () => {
  console.log(`👤 Atlas Person Twin running on port ${PORT}`);
  console.log(`   ${personTwins.size} contacts loaded`);
});

export default app;
