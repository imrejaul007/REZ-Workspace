import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Contact, StakeholderMap } from '../models/BuyerMapping';
import { requireInternalAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireInternalAuth);

// Validation schemas
const CreateContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional(),
  department: z.string().optional(),
  linkedInUrl: z.string().url().optional(),
  phone: z.string().optional(),
  companyName: z.string().min(1),
  companyId: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  annualRevenue: z.number().optional(),
  decisionRole: z.enum(['champion', 'economic_buyer', 'technical_buyer', 'legal_buyer', 'user_buyer', 'executive_sponsor', 'influencer', 'coach']),
  influenceLevel: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  isPrimaryContact: z.boolean().default(false),
  preferredChannel: z.enum(['email', 'phone', 'linkedin', 'in-person']).default('email'),
  notes: z.string().optional()
});

const UpdateContactSchema = CreateContactSchema.partial();

const AddInteractionSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'demo', 'social']),
  date: z.string().datetime().optional(),
  summary: z.string().min(1),
  outcome: z.string().optional()
});

// Create contact
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateContactSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const fullName = `${data.firstName} ${data.lastName}`;

    const contact = new Contact({
      ...data,
      tenantId,
      fullName,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await contact.save();

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// List contacts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      companyId,
      decisionRole,
      engagementLevel,
      status,
      isCoach
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (companyId) query.companyId = companyId;
    if (decisionRole) query.decisionRole = decisionRole;
    if (engagementLevel) query.engagementLevel = engagementLevel;
    if (status) query.status = status;
    if (isCoach !== undefined) query.isCoach = isCoach === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ engagementLevel: -1, touchpoints: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contacts,
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

// Get contact
router.get('/:contactId', async (req: Request, res: Response, next: NextFunction) => {
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

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Update contact
router.patch('/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdateContactSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // Update fullName if name fields changed
    if (data.firstName || data.lastName) {
      const existing = await Contact.findOne({ _id: req.params.contactId, tenantId });
      if (existing) {
        data.fullName = `${data.firstName || existing.firstName} ${data.lastName || existing.lastName}`;
      }
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Delete contact
router.delete('/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const contact = await Contact.findOneAndDelete({
      _id: req.params.contactId,
      tenantId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Remove from stakeholder maps
    await StakeholderMap.updateMany(
      { tenantId, contacts: contact._id },
      { $pull: { contacts: contact._id } }
    );

    res.json({
      success: true,
      message: 'Contact deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Add interaction
router.post('/:contactId/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = AddInteractionSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, tenantId },
      {
        $push: {
          interactionHistory: {
            ...data,
            date: data.date ? new Date(data.date) : new Date()
          }
        },
        $set: {
          lastContactedAt: new Date(),
          touchpoints: await Contact.countDocuments({ _id: req.params.contactId }) > 0 ? undefined : 1
        },
        $inc: { touchpoints: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Get interactions
router.get('/:contactId/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { limit = 20 } = req.query;

    const contact = await Contact.findOne({
      _id: req.params.contactId,
      tenantId
    }).select('interactionHistory');

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    const interactions = contact.interactionHistory
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: interactions
    });
  } catch (error) {
    next(error);
  }
});

// Update engagement
router.patch('/:contactId/engagement', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { engagementLevel, status } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;

    const updateData: Record<string, unknown> = {};
    if (engagementLevel) updateData.engagementLevel = engagementLevel;
    if (status) updateData.status = status;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, tenantId },
      { $set: updateData },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Bulk create contacts
router.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactsData = z.array(CreateContactSchema).parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string || 'system';

    const contacts = contactsData.map(data => ({
      ...data,
      tenantId,
      fullName: `${data.firstName} ${data.lastName}`,
      createdBy: userId
    }));

    const result = await Contact.insertMany(contacts, { ordered: false });

    res.status(201).json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
});

// Search contacts
router.get('/search/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { q, companyId, decisionRole } = req.query;

    const query: Record<string, unknown> = { tenantId };

    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } }
      ];
    }

    if (companyId) query.companyId = companyId;
    if (decisionRole) query.decisionRole = decisionRole;

    const contacts = await Contact.find(query)
      .sort({ fullName: 1 })
      .limit(50);

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
});

export default router;
