import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BuyerPersona, Contact } from '../models/BuyerMapping';
import { requireInternalAuth, requireUserAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireInternalAuth);

// Validation schemas
const CreatePersonaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: z.string().optional(),
  companySize: z.array(z.string()).optional(),
  revenue: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  painPoints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  buyingTriggers: z.array(z.string()).default([]),
  preferredContent: z.array(z.string()).default([]),
  communicationStyle: z.enum(['formal', 'casual', 'technical', 'relationship']).optional(),
  decisionTimeline: z.enum(['impulsive', 'short', 'moderate', 'long']).optional(),
  commonObjections: z.array(z.object({
    objection: z.string(),
    response: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low'])
  })).optional()
});

const UpdatePersonaSchema = CreatePersonaSchema.partial();

const MatchContactsSchema = z.object({
  contacts: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    title: z.string().optional(),
    companyName: z.string(),
    industry: z.string().optional(),
    companySize: z.string().optional()
  }))
});

// Create persona
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreatePersonaSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const persona = new BuyerPersona({
      ...data,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await persona.save();

    res.status(201).json({
      success: true,
      data: persona
    });
  } catch (error) {
    next(error);
  }
});

// List personas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      industry,
      isActive = 'true'
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (industry) query.industry = industry;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [personas, total] = await Promise.all([
      BuyerPersona.find(query)
        .sort({ usageCount: -1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      BuyerPersona.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: personas,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get persona
router.get('/:personaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const persona = await BuyerPersona.findOne({
      _id: req.params.personaId,
      tenantId
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Increment usage count
    persona.usageCount += 1;
    await persona.save();

    res.json({
      success: true,
      data: persona
    });
  } catch (error) {
    next(error);
  }
});

// Update persona
router.patch('/:personaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdatePersonaSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const persona = await BuyerPersona.findOneAndUpdate(
      { _id: req.params.personaId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    res.json({
      success: true,
      data: persona
    });
  } catch (error) {
    next(error);
  }
});

// Delete persona (soft delete)
router.delete('/:personaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const persona = await BuyerPersona.findOneAndUpdate(
      { _id: req.params.personaId, tenantId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    res.json({
      success: true,
      message: 'Persona deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Match contacts to persona
router.post('/:personaId/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { contacts } = MatchContactsSchema.parse(req.body);

    const persona = await BuyerPersona.findOne({
      _id: req.params.personaId,
      tenantId
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Score each contact against persona
    const scoredContacts = contacts.map(contact => {
      let score = 0;
      const matchReasons: string[] = [];
      const gaps: string[] = [];

      // Industry match
      if (persona.industry && contact.industry === persona.industry) {
        score += 20;
        matchReasons.push(`Industry match: ${contact.industry}`);
      }

      // Company size match
      if (persona.companySize?.length && contact.companySize) {
        if (persona.companySize.includes(contact.companySize)) {
          score += 15;
          matchReasons.push(`Company size: ${contact.companySize}`);
        }
      }

      // Pain points check (from title/role indicators)
      const titleLower = (contact.title || '').toLowerCase();
      const painPointsKeywords = persona.painPoints.join(' ').toLowerCase();
      const matchingPainPoints = persona.painPoints.filter(pp =>
        titleLower.includes(pp.toLowerCase().split(' ')[0])
      );
      if (matchingPainPoints.length > 0) {
        score += matchingPainPoints.length * 10;
        matchReasons.push(`Pain points alignment: ${matchingPainPoints.length}`);
      }

      // Check for gaps
      if (!persona.industry || contact.industry !== persona.industry) {
        gaps.push('Industry mismatch');
      }
      if (persona.companySize?.length && contact.companySize && !persona.companySize.includes(contact.companySize)) {
        gaps.push('Company size outside typical range');
      }

      return {
        contact,
        score: Math.min(score, 100),
        matchReasons,
        gaps,
        recommendation: score >= 60 ? 'strong_match' : score >= 40 ? 'potential_match' : 'weak_match'
      };
    });

    // Sort by score
    scoredContacts.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        persona: {
          id: persona._id,
          name: persona.name
        },
        contacts: scoredContacts,
        summary: {
          strongMatches: scoredContacts.filter(c => c.score >= 60).length,
          potentialMatches: scoredContacts.filter(c => c.score >= 40 && c.score < 60).length,
          weakMatches: scoredContacts.filter(c => c.score < 40).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get recommended personas for a contact
router.get('/recommend/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const contact = await Contact.findOne({
      _id: req.params.contactId,
      tenantId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Find personas that match this contact
    const query: Record<string, unknown> = { tenantId, isActive: true };

    if (contact.industry) {
      query.industry = contact.industry;
    }

    const personas = await BuyerPersona.find(query);

    // Score personas against contact
    const scoredPersonas = personas.map(persona => {
      let score = 0;

      if (persona.industry === contact.industry) score += 30;
      if (persona.companySize?.includes(contact.companySize || '')) score += 20;

      return { persona, score };
    });

    // Sort by score and return top 5
    scoredPersonas.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        contact: {
          id: contact._id,
          name: contact.fullName,
          company: contact.companyName
        },
        recommendedPersonas: scoredPersonas.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
