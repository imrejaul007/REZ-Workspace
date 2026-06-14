/**
 * CorpID Identity Service
 * Handles CorpID creation, entity management, and identity resolution
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import type { EntityType, VerificationStatus, IIdentity } from './types/index.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Config
const PORT = parseInt(process.env.PORT || '4702', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// CorpID Prefixes
const ENTITY_PREFIXES: Record<EntityType, string> = {
  INDIVIDUAL: 'IND',
  BUSINESS: 'BIZ',
  SUPPLIER: 'SUP',
  MERCHANT: 'MER',
  DRIVER: 'DRV',
  FRANCHISE: 'FRN',
  AGENT: 'AGT',  // CorpID v2.0: AI Agent entities
};

// Generate CorpID
function generateCorpId(entityType: EntityType): string {
  const prefix = ENTITY_PREFIXES[entityType];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(randomBytes(1)[0] % chars.length));
  }
  return `CI-${prefix}-${result}`;
}

// Validation schemas
const createIndividualSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    country: z.string().default('India'),
    postalCode: z.string().min(4).max(10),
  }).optional(),
});

const createBusinessSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessType: z.string().min(1).max(100),
  registrationNumber: z.string().min(1).max(50),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    country: z.string().default('India'),
    postalCode: z.string().min(4).max(10),
  }),
});

const updateIdentitySchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    country: z.string().default('India'),
    postalCode: z.string().min(4).max(10),
  }).optional(),
});

// CorpID v2.0: Agent creation schema
const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  version: z.string().max(50).optional(),
  agentType: z.enum(['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR']).default('SPECIALIZED'),
  capabilities: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(200).optional(),
    inputTypes: z.array(z.string()).optional(),
    outputTypes: z.array(z.string()).optional(),
  })).optional(),
  tools: z.array(z.object({
    name: z.string().min(1).max(100),
    enabled: z.boolean().default(true),
    config: z.record(z.unknown()).optional(),
  })).optional(),
  permissions: z.object({
    dataAccess: z.array(z.string()).optional(),
    actionAccess: z.array(z.string()).optional(),
    escalationRules: z.array(z.string()).optional(),
  }).optional(),
  costProfile: z.object({
    perInvocation: z.number().optional(),
    perTokenInput: z.number().optional(),
    perTokenOutput: z.number().optional(),
    monthlyBudget: z.number().optional(),
  }).optional(),
  ownerId: z.string().regex(/^CI-[A-Z]{3}-[A-Z0-9]{5}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// CorpID v2.0: Employee link schema
const linkEmployeeSchema = z.object({
  employeeId: z.string().min(1).max(50),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  department: z.string().optional(),
  designation: z.string().optional(),
  managerCorpId: z.string().regex(/^CI-IND-[A-Z0-9]{5}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Mongoose Schema
const identitySchema = new Schema<IIdentity & mongoose.Document>({
  corpId: { type: String, required: true, unique: true, index: true },
  entityType: {
    type: String,
    enum: ['INDIVIDUAL', 'BUSINESS', 'SUPPLIER', 'MERCHANT', 'DRIVER', 'FRANCHISE', 'AGENT'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED', 'ACTIVE', 'INACTIVE', 'DEPRECATED'],
    default: 'PENDING',
  },
  verificationLevel: { type: Number, default: 0 },

  // Individual fields
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  email: { type: String, index: true },
  phone: { type: String, index: true },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },

  // Business fields
  businessName: { type: String, index: true },
  businessType: String,
  registrationNumber: String,
  gstin: String,
  pan: String,
  companyAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },

  // Agent fields (CorpID v2.0)
  agentName: String,
  agentDescription: String,
  agentVersion: String,
  agentType: { type: String, enum: ['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR'] },
  capabilities: { type: Schema.Types.Mixed, default: [] },
  tools: { type: Schema.Types.Mixed, default: [] },
  permissions: { type: Schema.Types.Mixed },
  costProfile: { type: Schema.Types.Mixed },
  performance: { type: Schema.Types.Mixed },
  ownerId: String,
  trustScore: Number,
  humanRatings: {
    count: Number,
    average: Number,
  },

  // Employee link fields (CorpID v2.0)
  employeeId: { type: String, sparse: true },
  managerCorpId: String,
  corpIdSyncStatus: { type: String, enum: ['synced', 'pending', 'error'] },

  // Verification
  lastVerifiedAt: Date,
  verifiedBy: String,

  // Metadata
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Identity = model<IIdentity & mongoose.Document>('Identity', identitySchema);

// Auth middleware
function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'];
  if (token === INTERNAL_TOKEN) {
    return next();
  }
  // For development, allow all
  next();
}

// Validation middleware
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors },
        });
      }
      next(error);
    }
  };
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-identity-service', timestamp: new Date().toISOString() });
});

// Routes

// Create individual identity
app.post('/identities/individual',
  authMiddleware,
  validateBody(createIndividualSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const corpId = generateCorpId('INDIVIDUAL');

      const identity = new Identity({
        corpId,
        entityType: 'INDIVIDUAL',
        status: 'PENDING',
        verificationLevel: 0,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        address: data.address,
        metadata: {},
      });

      await identity.save();

      res.status(201).json({
        success: true,
        data: {
          corpId,
          entityType: 'INDIVIDUAL',
          status: 'PENDING',
          verificationLevel: 0,
        },
      });
    } catch (error) {
      logger.error('Error creating individual identity:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create identity' },
      });
    }
  }
);

// Create business identity
app.post('/identities/business',
  authMiddleware,
  validateBody(createBusinessSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const corpId = generateCorpId('BUSINESS');

      const identity = new Identity({
        corpId,
        entityType: 'BUSINESS',
        status: 'PENDING',
        verificationLevel: 0,
        businessName: data.businessName,
        businessType: data.businessType,
        registrationNumber: data.registrationNumber,
        gstin: data.gstin,
        pan: data.pan,
        companyAddress: data.address,
        metadata: {},
      });

      await identity.save();

      res.status(201).json({
        success: true,
        data: {
          corpId,
          entityType: 'BUSINESS',
          status: 'PENDING',
          verificationLevel: 0,
        },
      });
    } catch (error) {
      logger.error('Error creating business identity:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create identity' },
      });
    }
  }
);

// Create supplier identity
app.post('/identities/supplier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const corpId = generateCorpId('SUPPLIER');

    const identity = new Identity({
      corpId,
      entityType: 'SUPPLIER',
      status: 'PENDING',
      businessName: data.businessName,
      businessType: data.businessType || 'Supplier',
      registrationNumber: data.registrationNumber,
      gstin: data.gstin,
      email: data.email,
      phone: data.phone,
      companyAddress: data.address,
      metadata: {},
    });

    await identity.save();

    res.status(201).json({
      success: true,
      data: { corpId, entityType: 'SUPPLIER', status: 'PENDING' },
    });
  } catch (error) {
    logger.error('Error creating supplier identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create identity' },
    });
  }
});

// Create merchant identity
app.post('/identities/merchant', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const corpId = generateCorpId('MERCHANT');

    const identity = new Identity({
      corpId,
      entityType: 'MERCHANT',
      status: 'PENDING',
      businessName: data.businessName,
      businessType: data.businessType || 'Merchant',
      registrationNumber: data.registrationNumber,
      gstin: data.gstin,
      email: data.email,
      phone: data.phone,
      companyAddress: data.address,
      metadata: {},
    });

    await identity.save();

    res.status(201).json({
      success: true,
      data: { corpId, entityType: 'MERCHANT', status: 'PENDING' },
    });
  } catch (error) {
    logger.error('Error creating merchant identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create identity' },
    });
  }
});

// Create driver identity
app.post('/identities/driver', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const corpId = generateCorpId('DRIVER');

    const identity = new Identity({
      corpId,
      entityType: 'DRIVER',
      status: 'PENDING',
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      metadata: { licenseNumber: data.licenseNumber, vehicleType: data.vehicleType },
    });

    await identity.save();

    res.status(201).json({
      success: true,
      data: { corpId, entityType: 'DRIVER', status: 'PENDING' },
    });
  } catch (error) {
    logger.error('Error creating driver identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create identity' },
    });
  }
});

// CorpID v2.0: Create agent identity
app.post('/identities/agent',
  authMiddleware,
  validateBody(createAgentSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const corpId = generateCorpId('AGENT');

      const identity = new Identity({
        corpId,
        entityType: 'AGENT',
        status: 'ACTIVE',
        agentName: data.name,
        agentDescription: data.description,
        agentVersion: data.version,
        agentType: data.agentType,
        capabilities: data.capabilities || [],
        tools: data.tools || [],
        permissions: data.permissions,
        costProfile: data.costProfile,
        ownerId: data.ownerId,
        metadata: data.metadata || {},
      });

      await identity.save();

      res.status(201).json({
        success: true,
        data: {
          corpId,
          entityType: 'AGENT',
          status: 'ACTIVE',
          agentType: data.agentType,
          name: data.name,
        },
      });
    } catch (error) {
      logger.error('Error creating agent identity:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create agent identity' },
      });
    }
  }
);

// CorpID v2.0: Find agents by capability
app.get('/agents/find', authMiddleware, async (req: Request, res: Response) => {
  try {
    const capability = req.query.capability as string;
    const agentType = req.query.agentType as string;
    const status = req.query.status as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = { entityType: 'AGENT' };
    if (status) filter.status = status.toUpperCase();
    if (agentType) filter.agentType = agentType.toUpperCase();
    if (capability) {
      filter['capabilities.name'] = { $regex: capability, $options: 'i' };
    }

    const [agents, total] = await Promise.all([
      Identity.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }).lean(),
      Identity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: agents.map(a => ({
          corpId: a.corpId,
          name: a.agentName,
          description: a.agentDescription,
          agentType: a.agentType,
          capabilities: a.capabilities,
          status: a.status,
          trustScore: a.trustScore,
          createdAt: a.createdAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error finding agents:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to find agents' },
    });
  }
});

// CorpID v2.0: Get agent metrics
app.get('/agents/:corpId/metrics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const identity = await Identity.findOne({ corpId, entityType: 'AGENT' }).lean();

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    res.json({
      success: true,
      data: {
        corpId: identity.corpId,
        name: identity.agentName,
        performance: identity.performance,
        trustScore: identity.trustScore,
        humanRatings: identity.humanRatings,
        costProfile: identity.costProfile,
      },
    });
  } catch (error) {
    logger.error('Error fetching agent metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch agent metrics' },
    });
  }
});

// CorpID v2.0: Update agent
app.patch('/agents/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const updates = req.body;

    const identity = await Identity.findOneAndUpdate(
      { corpId, entityType: 'AGENT' },
      {
        $set: {
          ...(updates.name && { agentName: updates.name }),
          ...(updates.description && { agentDescription: updates.description }),
          ...(updates.version && { agentVersion: updates.version }),
          ...(updates.agentType && { agentType: updates.agentType }),
          ...(updates.status && { status: updates.status }),
          ...(updates.capabilities && { capabilities: updates.capabilities }),
          ...(updates.tools && { tools: updates.tools }),
          ...(updates.permissions && { permissions: updates.permissions }),
          ...(updates.metadata && { metadata: updates.metadata }),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    res.json({
      success: true,
      data: {
        corpId: identity.corpId,
        name: identity.agentName,
        status: identity.status,
        updatedAt: identity.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update agent' },
    });
  }
});

// CorpID v2.0: Link employee to CorpID
app.post('/identities/link/employee',
  authMiddleware,
  validateBody(linkEmployeeSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;

      // Check if CorpID already exists for this employee
      let identity = await Identity.findOne({
        $or: [
          { employeeId: data.employeeId },
          { email: data.email.toLowerCase() },
        ],
        entityType: 'INDIVIDUAL',
      }).lean();

      if (identity) {
        // Update existing identity with employee data
        identity = await Identity.findOneAndUpdate(
          { _id: identity._id },
          {
            $set: {
              employeeId: data.employeeId,
              firstName: data.firstName,
              lastName: data.lastName,
              department: data.department,
              designation: data.designation,
              managerCorpId: data.managerCorpId,
              corpIdSyncStatus: 'synced',
              metadata: {
                ...identity.metadata,
                ...data.metadata,
              },
            },
          },
          { new: true }
        );

        // Create REPORTS_TO relationship if managerCorpId provided
        if (data.managerCorpId) {
          const existingRelationship = await Identity.findOne({
            corpId: identity!.corpId,
            'metadata.relationships.manager': data.managerCorpId,
          });

          if (!existingRelationship) {
            await Identity.findOneAndUpdate(
              { corpId: identity!.corpId },
              {
                $push: {
                  'metadata.relationships': {
                    type: 'REPORTS_TO',
                    targetCorpId: data.managerCorpId,
                    createdAt: new Date(),
                  },
                },
              }
            );
          }
        }

        return res.json({
          success: true,
          data: {
            corpId: identity!.corpId,
            employeeId: data.employeeId,
            linked: true,
            preExisting: true,
          },
        });
      }

      // Create new identity
      const corpId = generateCorpId('INDIVIDUAL');
      const newIdentity = new Identity({
        corpId,
        entityType: 'INDIVIDUAL',
        status: 'PENDING',
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        department: data.department,
        designation: data.designation,
        managerCorpId: data.managerCorpId,
        corpIdSyncStatus: 'synced',
        metadata: data.metadata || {},
      });

      await newIdentity.save();

      // Create REPORTS_TO relationship if managerCorpId provided
      if (data.managerCorpId) {
        await Identity.findOneAndUpdate(
          { corpId },
          {
            $push: {
              'metadata.relationships': {
                type: 'REPORTS_TO',
                targetCorpId: data.managerCorpId,
                createdAt: new Date(),
              },
            },
          }
        );
      }

      res.status(201).json({
        success: true,
        data: {
          corpId,
          employeeId: data.employeeId,
          linked: true,
          preExisting: false,
        },
      });
    } catch (error) {
      logger.error('Error linking employee to CorpID:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to link employee' },
      });
    }
  }
);

// CorpID v2.0: Get CorpID from employee ID
app.get('/identities/employee/:employeeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const identity = await Identity.findOne({ employeeId, entityType: 'INDIVIDUAL' }).lean();

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee CorpID not found' },
      });
    }

    res.json({
      success: true,
      data: {
        corpId: identity.corpId,
        employeeId: identity.employeeId,
        firstName: identity.firstName,
        lastName: identity.lastName,
        email: identity.email,
        managerCorpId: identity.managerCorpId,
      },
    });
  } catch (error) {
    logger.error('Error fetching employee CorpID:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch employee CorpID' },
    });
  }
});

// CorpID v2.0: Get graph for an entity
app.get('/identities/:corpId/graph', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const depth = Math.min(3, Math.max(1, parseInt(req.query.depth as string) || 1));

    const identity = await Identity.findOne({ corpId }).lean();

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Identity not found' },
      });
    }

    // Build graph by traversing relationships
    const graph: Record<string, unknown>[] = [];
    const visited = new Set<string>();
    visited.add(corpId);

    // Get direct relationships from metadata
    const relationships = identity.metadata?.relationships || [];

    for (const rel of relationships) {
      const node: Record<string, unknown> = {
        corpId: identity.corpId,
        name: identity.firstName
          ? `${identity.firstName} ${identity.lastName}`
          : identity.agentName || identity.businessName || identity.corpId,
        entityType: identity.entityType,
        relationships: relationships,
      };
      graph.push(node);
    }

    // For now, return the identity with its relationships
    // Full graph traversal would require recursive queries
    res.json({
      success: true,
      data: {
        root: {
          corpId: identity.corpId,
          entityType: identity.entityType,
          name: identity.firstName
            ? `${identity.firstName} ${identity.lastName}`
            : identity.agentName || identity.businessName,
          managerCorpId: identity.managerCorpId,
        },
        relationships: relationships,
        depth: 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching entity graph:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch graph' },
    });
  }
});

// Get identity by CorpID
app.get('/identities/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const identity = await Identity.findOne({ corpId }).lean();

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Identity not found' },
      });
    }

    // Remove sensitive fields based on access level
    const response = {
      corpId: identity.corpId,
      entityType: identity.entityType,
      status: identity.status,
      verificationLevel: identity.verificationLevel,
      firstName: identity.firstName,
      lastName: identity.lastName,
      businessName: identity.businessName,
      email: identity.email,
      phone: identity.phone ? `***-***-${identity.phone.slice(-4)}` : undefined,
      address: identity.address || identity.companyAddress,
      lastVerifiedAt: identity.lastVerifiedAt,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Error fetching identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch identity' },
    });
  }
});

// Update identity
app.patch('/identities/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const updates = req.body;

    const identity = await Identity.findOneAndUpdate(
      { corpId },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    );

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Identity not found' },
      });
    }

    res.json({
      success: true,
      data: {
        corpId: identity.corpId,
        entityType: identity.entityType,
        status: identity.status,
        verificationLevel: identity.verificationLevel,
        updatedAt: identity.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update identity' },
    });
  }
});

// List entities
app.get('/entities', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;
    const entityType = req.query.entityType as EntityType | undefined;
    const status = req.query.status as VerificationStatus | undefined;

    const filter: Record<string, unknown> = {};
    if (entityType) filter.entityType = entityType;
    if (status) filter.status = status;

    const [identities, total] = await Promise.all([
      Identity.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }).lean(),
      Identity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: identities.map(i => ({
          corpId: i.corpId,
          entityType: i.entityType,
          status: i.status,
          verificationLevel: i.verificationLevel,
          firstName: i.firstName,
          lastName: i.lastName,
          businessName: i.businessName,
          createdAt: i.createdAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error listing entities:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list entities' },
    });
  }
});

// Search entities
app.get('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const skip = (page - 1) * pageSize;
    const entityType = req.query.entityType as EntityType | undefined;

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$or = [
        { corpId: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { businessName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { registrationNumber: { $regex: query, $options: 'i' } },
      ];
    }

    if (entityType) filter.entityType = entityType;

    const [identities, total] = await Promise.all([
      Identity.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }).lean(),
      Identity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: identities.map(i => ({
          corpId: i.corpId,
          entityType: i.entityType,
          status: i.status,
          verificationLevel: i.verificationLevel,
          firstName: i.firstName,
          lastName: i.lastName,
          businessName: i.businessName,
          email: i.email ? `${i.email.slice(0, 2)}***@${i.email.split('@')[1]}` : undefined,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error searching entities:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search entities' },
    });
  }
});

// Resolve identity (identity resolution)
app.post('/resolve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { identifier, identifierType } = req.body;

    let identity;
    switch (identifierType) {
      case 'corpId':
        identity = await Identity.findOne({ corpId: identifier }).lean();
        break;
      case 'email':
        identity = await Identity.findOne({ email: identifier }).lean();
        break;
      case 'phone':
        identity = await Identity.findOne({ phone: identifier }).lean();
        break;
      case 'pan':
        identity = await Identity.findOne({ pan: identifier }).lean();
        break;
      case 'gstin':
        identity = await Identity.findOne({ gstin: identifier }).lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid identifier type' },
        });
    }

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Identity not found' },
      });
    }

    res.json({
      success: true,
      data: {
        corpId: identity.corpId,
        entityType: identity.entityType,
        status: identity.status,
        resolutionType: identifierType,
      },
    });
  } catch (error) {
    logger.error('Error resolving identity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve identity' },
    });
  }
});

// Link identities
app.post('/identities/:corpId/link', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { linkCorpId, linkType } = req.body;

    const identity = await Identity.findOneAndUpdate(
      { corpId },
      { $push: { 'metadata.linkedIdentities': { corpId: linkCorpId, type: linkType, linkedAt: new Date() } } },
      { new: true }
    );

    if (!identity) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Identity not found' },
      });
    }

    res.json({
      success: true,
      data: { corpId, linkedCorpId: linkCorpId, linkType },
    });
  } catch (error) {
    logger.error('Error linking identities:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to link identity' },
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Start server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create indexes
    await Identity.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Identity Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
