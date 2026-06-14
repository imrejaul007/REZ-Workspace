/**
 * REZ TAM Builder - Contact Routes
 *
 * API endpoints for contact discovery and management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AccountUniverseModel } from '../models/AccountUniverse.js';
import { companyDatabase } from '../integrations/companyDB.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const DiscoverContactsSchema = z.object({
  universeId: z.string().optional(),
  companyIds: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
});

const EnrichContactSchema = z.object({
  companyId: z.string(),
  role: z.string().optional(),
  department: z.string().optional(),
});

// ============================================================================
// Types
// ============================================================================

interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  title: string;
  department: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  score: number;
  isDecisionMaker: boolean;
  isInfluencer: boolean;
}

// ============================================================================
// Mock Contacts
// ============================================================================

const MOCK_CONTACTS: Contact[] = [
  { id: 'ct1', companyId: 'c1', companyName: 'TechCorp Solutions', name: 'John Smith', title: 'VP of Engineering', department: 'Engineering', email: 'john.smith@techcorp.io', linkedinUrl: 'https://linkedin.com/in/johnsmith', score: 85, isDecisionMaker: true, isInfluencer: false },
  { id: 'ct2', companyId: 'c1', companyName: 'TechCorp Solutions', name: 'Sarah Johnson', title: 'CTO', department: 'Technology', email: 'sarah.j@techcorp.io', linkedinUrl: 'https://linkedin.com/in/sarahjohnson', score: 92, isDecisionMaker: true, isInfluencer: true },
  { id: 'ct3', companyId: 'c1', companyName: 'TechCorp Solutions', name: 'Mike Davis', title: 'Sales Ops Manager', department: 'Sales', email: 'mike.d@techcorp.io', linkedinUrl: 'https://linkedin.com/in/mikedavis', score: 78, isDecisionMaker: false, isInfluencer: true },
  { id: 'ct4', companyId: 'c2', companyName: 'CloudFirst Inc', name: 'Lisa Chen', title: 'Director of IT', department: 'IT', email: 'lisa.chen@cloudfirst.com', linkedinUrl: 'https://linkedin.com/in/lisachen', score: 88, isDecisionMaker: false, isInfluencer: true },
  { id: 'ct5', companyId: 'c2', companyName: 'CloudFirst Inc', name: 'Tom Wilson', title: 'CEO', department: 'Executive', email: 'tom@cloudfirst.com', linkedinUrl: 'https://linkedin.com/in/tomwilson', score: 95, isDecisionMaker: true, isInfluencer: false },
  { id: 'ct6', companyId: 'c3', companyName: 'DataDriven Analytics', name: 'Emily Brown', title: 'Head of Data', department: 'Analytics', email: 'emily@datadriven.ai', linkedinUrl: 'https://linkedin.com/in/emilybrown', score: 82, isDecisionMaker: false, isInfluencer: true },
  { id: 'ct7', companyId: 'c4', companyName: 'MedTech Health', name: 'Dr. Robert Lee', title: 'Chief Medical Officer', department: 'Medical', email: 'r.lee@medtech.health', linkedinUrl: 'https://linkedin.com/in/drrobertlee', score: 90, isDecisionMaker: true, isInfluencer: true },
  { id: 'ct8', companyId: 'c12', companyName: 'Bangalore Tech Hub', name: 'Priya Sharma', title: 'Engineering Director', department: 'Engineering', email: 'priya@blrtech.in', linkedinUrl: 'https://linkedin.com/in/priyasharma', score: 87, isDecisionMaker: true, isInfluencer: true },
  { id: 'ct9', companyId: 'c12', companyName: 'Bangalore Tech Hub', name: 'Arjun Patel', title: 'VP Sales', department: 'Sales', email: 'arjun@blrtech.in', linkedinUrl: 'https://linkedin.com/in/arjunpatel', score: 89, isDecisionMaker: true, isInfluencer: false },
  { id: 'ct10', companyId: 'c15', companyName: 'London Tech Ventures', name: 'Emma Wilson', title: 'Head of Product', department: 'Product', email: 'emma@londontech.co.uk', linkedinUrl: 'https://linkedin.com/in/emmawilson', score: 84, isDecisionMaker: false, isInfluencer: true },
];

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/contacts/discover
 * Discover contacts at target accounts
 */
router.post('/discover', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = DiscoverContactsSchema.parse(req.body);

    let contacts: Contact[] = [];

    // Get contacts from universe
    if (validated.universeId) {
      const universe = await AccountUniverseModel.findById(validated.universeId);
      if (universe) {
        // Filter contacts by companies in universe
        contacts = MOCK_CONTACTS.filter(c =>
          universe.companies.some(co => co.id === c.companyId)
        );
      }
    }

    // Filter by company IDs
    if (validated.companyIds?.length) {
      contacts = contacts.filter(c => validated.companyIds!.includes(c.companyId));
      if (contacts.length === 0) {
        // If no universe match, use mock data
        contacts = MOCK_CONTACTS.filter(c =>
          validated.companyIds!.includes(c.companyId)
        );
      }
    }

    // If no filters, return all mock contacts
    if (!validated.universeId && !validated.companyIds) {
      contacts = MOCK_CONTACTS;
    }

    // Filter by roles
    if (validated.roles?.length) {
      contacts = contacts.filter(c =>
        validated.roles!.some(r =>
          c.title.toLowerCase().includes(r.toLowerCase())
        )
      );
    }

    // Filter by departments
    if (validated.departments?.length) {
      contacts = contacts.filter(c =>
        validated.departments!.some(d =>
          c.department.toLowerCase().includes(d.toLowerCase())
        )
      );
    }

    // Sort by score
    contacts.sort((a, b) => b.score - a.score);

    // Apply limit
    const limited = contacts.slice(0, validated.limit);

    logger.info('Contacts discovered', {
      tenantId,
      universeId: validated.universeId,
      count: limited.length,
    });

    res.json({
      success: true,
      data: {
        contacts: limited,
        stats: {
          total: contacts.length,
          decisionMakers: limited.filter(c => c.isDecisionMaker).length,
          influencers: limited.filter(c => c.isInfluencer).length,
          avgScore: Math.round(limited.reduce((sum, c) => sum + c.score, 0) / limited.length),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to discover contacts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to discover contacts' });
  }
});

/**
 * POST /api/v1/contacts/enrich
 * Enrich contact with additional data
 */
router.post('/enrich', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = EnrichContactSchema.parse(req.body);

    // Get company
    const company = await companyDatabase.getCompany(validated.companyId);
    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    // Find contact in mock data
    let contact = MOCK_CONTACTS.find(c => c.companyId === validated.companyId);

    if (!contact) {
      // Create mock contact
      contact = {
        id: `ct_${Date.now()}`,
        companyId: validated.companyId,
        companyName: company.name,
        name: 'Contact',
        title: validated.role || 'Unknown',
        department: validated.department || 'General',
        score: 75,
        isDecisionMaker: false,
        isInfluencer: false,
      };
    }

    // Enrich with company data
    const enriched = {
      ...contact,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        location: `${company.city}, ${company.country}`,
        technologies: company.technologies,
      },
      email: contact.email || `contact@${company.domain}`,
      phone: '+1-555-0100',
      linkedinUrl: contact.linkedinUrl || `https://linkedin.com/in/${company.name.toLowerCase().replace(/\s+/g, '')}`,
      enrichedAt: new Date(),
    };

    logger.info('Contact enriched', { tenantId, contactId: contact.id });

    res.json({
      success: true,
      data: { contact: enriched },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to enrich contact', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to enrich contact' });
  }
});

/**
 * GET /api/v1/contacts/roles
 * Get available contact roles/titles
 */
router.get('/roles', async (_req: Request, res: Response) => {
  const roles = [
    { name: 'C-Suite', titles: ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CRO', 'CISO', 'CIO', 'CSO'] },
    { name: 'VP Level', titles: ['VP', 'Vice President', 'SVP', 'EVP', 'Head of'] },
    { name: 'Director Level', titles: ['Director', 'Managing Director', 'Head'] },
    { name: 'Manager Level', titles: ['Manager', 'Senior Manager', 'Principal', 'Lead'] },
    { name: 'Individual Contributor', titles: ['Engineer', 'Developer', 'Analyst', 'Consultant', 'Specialist'] },
  ];

  res.json({ success: true, data: { roles } });
});

/**
 * GET /api/v1/contacts/departments
 * Get available departments
 */
router.get('/departments', async (_req: Request, res: Response) => {
  const departments = [
    'Engineering', 'Technology', 'IT', 'Product', 'Design',
    'Sales', 'Marketing', 'Business Development',
    'Finance', 'Operations', 'HR', 'Legal',
    'Executive', 'Analytics', 'Customer Success', 'Support',
  ];

  res.json({ success: true, data: { departments } });
});

export default router;
