import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StakeholderMap, Contact, BuyerMatrix } from '../models/BuyerMapping';
import { BuyerMatrixService } from '../services/buyerMatrixService';

const router = Router();

// Validation schemas
const CreateStakeholderMapSchema = z.object({
  accountId: z.string().min(1),
  accountName: z.string().min(1),
  industry: z.string().optional(),
  contacts: z.array(z.string()).optional(),
  buyingCommittee: z.array(z.object({
    role: z.enum(['champion', 'economic_buyer', 'technical_buyer', 'legal_buyer', 'user_buyer', 'executive_sponsor', 'influencer', 'coach']),
    title: z.string(),
    importance: z.enum(['critical', 'high', 'medium', 'low'])
  })).optional()
});

const UpdateStakeholderMapSchema = CreateStakeholderMapSchema.partial();

const AddRelationshipSchema = z.object({
  fromContactId: z.string(),
  toContactId: z.string(),
  relationship: z.enum(['reports_to', 'peers', 'works_with', 'supports']),
  strength: z.number().min(1).max(10).default(5)
});

// Create stakeholder map
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateStakeholderMapSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // Check if map already exists
    const existing = await StakeholderMap.findOne({
      tenantId,
      accountId: data.accountId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Stakeholder map already exists for this account',
        existingMapId: existing._id
      });
    }

    const map = new StakeholderMap({
      ...data,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await map.save();

    res.status(201).json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// List stakeholder maps
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      status,
      minCoverage
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (status) query.status = status;
    if (minCoverage) query.coverageScore = { $gte: Number(minCoverage) };

    const skip = (Number(page) - 1) * Number(limit);

    const [maps, total] = await Promise.all([
      StakeholderMap.find(query)
        .populate('contacts')
        .populate('priorityContacts')
        .sort({ coverageScore: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StakeholderMap.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: maps,
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

// Get stakeholder map
router.get('/:mapId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOne({
      _id: req.params.mapId,
      tenantId
    })
      .populate('contacts')
      .populate('priorityContacts')
      .populate('blockers.contactId');

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Update stakeholder map
router.patch('/:mapId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateStakeholderMapSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndUpdate(
      { _id: req.params.mapId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Delete stakeholder map
router.delete('/:mapId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndDelete({
      _id: req.params.mapId,
      tenantId
    });

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    // Delete associated buyer matrix
    await BuyerMatrix.deleteMany({
      tenantId,
      stakeholderMapId: map._id
    });

    res.json({
      success: true,
      message: 'Stakeholder map deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Add contact to map
router.post('/:mapId/contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId } = z.object({ contactId: z.string() }).parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndUpdate(
      { _id: req.params.mapId, tenantId },
      {
        $addToSet: { contacts: contactId },
        $set: { status: 'in_progress' }
      },
      { new: true }
    );

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    // Update contact's stakeholderMapId
    await Contact.findByIdAndUpdate(contactId, {
      stakeholderMapId: map._id
    });

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Remove contact from map
router.delete('/:mapId/contacts/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndUpdate(
      { _id: req.params.mapId, tenantId },
      { $pull: { contacts: req.params.contactId } },
      { new: true }
    );

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Add relationship
router.post('/:mapId/relationships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = AddRelationshipSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndUpdate(
      { _id: req.params.mapId, tenantId },
      {
        $push: { relationships: data },
        $set: { status: 'in_progress' }
      },
      { new: true }
    );

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Add blocker
router.post('/:mapId/blockers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId, reason, mitigation } = z.object({
      contactId: z.string(),
      reason: z.string(),
      mitigation: z.string().optional()
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOneAndUpdate(
      { _id: req.params.mapId, tenantId },
      {
        $push: { blockers: { contactId, reason, mitigation } }
      },
      { new: true }
    );

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

// Calculate coverage scores
router.post('/:mapId/calculate-coverage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOne({
      _id: req.params.mapId,
      tenantId
    }).populate('contacts');

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found'
      });
    }

    // Calculate coverage scores
    const contacts = map.contacts as unknown as typeof map.contacts;
    const coverage = BuyerMatrixService.calculateCoverage(map);

    // Update map with coverage scores
    map.coverageScore = coverage.overall;
    map.technicalCoverage = coverage.technical;
    map.economicCoverage = coverage.economic;
    map.executiveCoverage = coverage.executive;

    // Determine status
    if (coverage.overall >= 80) {
      map.status = 'complete';
    } else if (coverage.overall >= 40) {
      map.status = 'in_progress';
    } else {
      map.status = 'incomplete';
    }

    await map.save();

    res.json({
      success: true,
      data: {
        coverage,
        status: map.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get map by account
router.get('/account/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const map = await StakeholderMap.findOne({
      tenantId,
      accountId: req.params.accountId
    })
      .populate('contacts')
      .populate('priorityContacts');

    if (!map) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder map not found for this account'
      });
    }

    res.json({
      success: true,
      data: map
    });
  } catch (error) {
    next(error);
  }
});

export default router;
