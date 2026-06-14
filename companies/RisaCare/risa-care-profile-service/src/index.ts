/**
 * RisaCare Profile Service - Main Entry Point
 * User profiles, family management with MongoDB
 */

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: string;
    }
  }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Models
import { UserProfile, FamilyMember, ProfileAccessLog, IUserProfile } from './models/profile.model';

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.PORT || '4704', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_profiles';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================
// APP SETUP
// ============================================

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Request ID middleware
app.use((req: Request, res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  req.userId = req.headers['x-user-id'] as string;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      requestId: req.requestId,
      userId: req.userId
    });
  });
  next();
});

// ============================================
// ZOD SCHEMAS
// ============================================

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.enum(['self', 'spouse', 'child', 'parent', 'sibling', 'other']),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
  dateOfBirth: z.string().optional(),
  isMinor: z.boolean().optional(),
  health: z.object({
    height: z.object({ value: z.number(), unit: z.string() }).optional(),
    weight: z.object({ value: z.number(), unit: z.string() }).optional(),
    allergies: z.array(z.object({
      allergen: z.string(),
      severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
      reaction: z.string().optional()
    })).optional(),
    chronicConditions: z.array(z.object({
      condition: z.string(),
      diagnosedDate: z.string().optional(),
      status: z.enum(['active', 'managed', 'resolved']),
      notes: z.string().optional()
    })).optional(),
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      prescribedBy: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isActive: z.boolean().optional()
    })).optional()
  }).optional()
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
  dateOfBirth: z.string().optional(),
  isMinor: z.boolean().optional(),
  health: z.object({
    height: z.object({ value: z.number(), unit: z.string() }).optional(),
    weight: z.object({ value: z.number(), unit: z.string() }).optional()
  }).optional()
});

const updatePreferencesSchema = z.object({
  notifications: z.object({
    appointments: z.boolean().optional(),
    medications: z.boolean().optional(),
    reminders: z.boolean().optional(),
    reports: z.boolean().optional(),
    healthAlerts: z.boolean().optional(),
    wellnessTips: z.boolean().optional(),
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    whatsapp: z.boolean().optional()
  }).optional(),
  privacyLevel: z.enum(['minimal', 'balanced', 'maximum']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  measurementSystem: z.enum(['metric', 'imperial']).optional()
});

const updateConsentSchema = z.object({
  anonymousAnalytics: z.boolean().optional(),
  researchParticipation: z.boolean().optional(),
  thirdPartySharing: z.boolean().optional()
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateProfileId(): string {
  return `PRF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

async function logAccess(
  userId: string,
  profileId: string,
  accessorId: string,
  accessorType: 'user' | 'caregiver' | 'doctor' | 'system',
  action: 'read' | 'update' | 'delete',
  fields: string[],
  req: Request
) {
  try {
    await ProfileAccessLog.create({
      userId,
      accessorId,
      accessorType,
      profileId,
      action,
      fieldsAccessed: fields,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to log profile access', { error });
  }
}

// ============================================
// DATABASE CONNECTION
// ============================================

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'risa-care-profile-service',
    version: '2.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ============================================
// PROFILE ROUTES
// ============================================

// GET /profile - Get user profile with all profiles
app.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      // Create new profile if not exists
      profile = await UserProfile.create({
        userId,
        profiles: [{
          profileId: generateProfileId(),
          name: 'Default User',
          relationship: 'self',
          gender: 'prefer_not_to_say',
          isPrimary: true,
          health: {}
        }],
        preferences: {
          notifications: {
            appointments: true,
            medications: true,
            reminders: true,
            reports: true,
            healthAlerts: true,
            wellnessTips: true,
            sms: true,
            email: true,
            push: true,
            whatsapp: false
          },
          privacyLevel: 'balanced',
          language: 'en',
          timezone: 'Asia/Kolkata',
          theme: 'system',
          dateFormat: 'DD/MM/YYYY',
          measurementSystem: 'metric'
        },
        consent: {
          version: '2.0',
          givenAt: new Date(),
          anonymousAnalytics: false,
          researchParticipation: false,
          thirdPartySharing: false
        }
      });

      logger.info('Created new user profile', { userId });
    }

    // Log access
    await logAccess(userId, profile.profiles[0]?.profileId || '', userId, 'user', 'read', ['profile'], req);

    res.json({
      success: true,
      data: profile,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /profile - Update user profile
app.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';
    const { preferences, consent } = req.body;

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    if (preferences) {
      profile.preferences = { ...profile.preferences, ...preferences };
    }

    if (consent) {
      profile.consent = { ...profile.consent, ...consent };
    }

    await profile.save();

    // Log access
    await logAccess(userId, profile.profiles[0]?.profileId || '', userId, 'user', 'update', ['preferences', 'consent'], req);

    res.json({
      success: true,
      data: profile,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /profile/preferences - Update preferences
app.patch('/profile/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updatePreferencesSchema.parse(req.body);
    const userId = req.userId || 'default_user';

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: { preferences: validated } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    await logAccess(userId, profile.profiles[0]?.profileId || '', userId, 'user', 'update', ['preferences'], req);

    res.json({
      success: true,
      data: profile.preferences,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors }
      });
    }
    next(error);
  }
});

// PATCH /profile/consent - Update consent
app.patch('/profile/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateConsentSchema.parse(req.body);
    const userId = req.userId || 'default_user';

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    Object.assign(profile.consent, validated);
    await profile.save();

    await logAccess(userId, profile.profiles[0]?.profileId || '', userId, 'user', 'update', ['consent'], req);

    res.json({
      success: true,
      data: profile.consent,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors }
      });
    }
    next(error);
  }
});

// ============================================
// FAMILY MEMBER ROUTES
// ============================================

// POST /profile/family - Add family member
app.post('/profile/family', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createProfileSchema.parse(req.body);
    const userId = req.userId || 'default_user';

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      // Create profile if not exists
      profile = await UserProfile.create({
        userId,
        profiles: [],
        preferences: {},
        consent: { version: '2.0', givenAt: new Date() }
      });
    }

    const profileId = generateProfileId();
    const newProfile = {
      profileId,
      name: validated.name,
      relationship: validated.relationship,
      age: validated.age,
      gender: validated.gender,
      bloodGroup: validated.bloodGroup,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      isPrimary: false,
      isMinor: validated.isMinor || false,
      health: validated.health || {}
    };

    profile.profiles.push(newProfile);
    await profile.save();

    logger.info('Added family member', { userId, profileId, name: validated.name });
    await logAccess(userId, profileId, userId, 'user', 'create', ['family_member'], req);

    res.status(201).json({
      success: true,
      data: { profileId, name: validated.name, relationship: validated.relationship },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors }
      });
    }
    next(error);
  }
});

// GET /profile/family - List family members
app.get('/profile/family', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    await logAccess(userId, 'all', userId, 'user', 'read', ['family_members'], req);

    res.json({
      success: true,
      data: profile.profiles.filter(p => p.relationship !== 'self'),
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// GET /profile/family/:id - Get family member
app.get('/profile/family/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';
    const { id } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    const member = profile.profiles.find(p => p.profileId === id);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Family member not found' }
      });
    }

    await logAccess(userId, id, userId, 'user', 'read', ['family_member'], req);

    res.json({
      success: true,
      data: member,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /profile/family/:id - Update family member
app.put('/profile/family/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const userId = req.userId || 'default_user';
    const { id } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    const memberIndex = profile.profiles.findIndex(p => p.profileId === id);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Family member not found' }
      });
    }

    profile.profiles[memberIndex] = { ...profile.profiles[memberIndex], ...validated };
    await profile.save();

    logger.info('Updated family member', { userId, profileId: id });
    await logAccess(userId, id, userId, 'user', 'update', ['family_member'], req);

    res.json({
      success: true,
      data: profile.profiles[memberIndex],
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors }
      });
    }
    next(error);
  }
});

// DELETE /profile/family/:id - Remove family member
app.delete('/profile/family/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';
    const { id } = req.params;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    const memberIndex = profile.profiles.findIndex(p => p.profileId === id);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Family member not found' }
      });
    }

    // Cannot delete primary/self profile
    if (profile.profiles[memberIndex].relationship === 'self') {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_PRIMARY', message: 'Cannot delete primary profile' }
      });
    }

    profile.profiles.splice(memberIndex, 1);
    await profile.save();

    logger.info('Removed family member', { userId, profileId: id });
    await logAccess(userId, id, userId, 'user', 'delete', ['family_member'], req);

    res.json({
      success: true,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// HEALTH DATA ROUTES
// ============================================

// POST /profile/health - Add health data
app.post('/profile/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';
    const { profileId, healthData } = req.body;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' }
      });
    }

    // Find the profile to update
    const profileIndex = profile.profiles.findIndex(p => p.profileId === profileId || p.relationship === 'self');
    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
      });
    }

    // Update health data
    profile.profiles[profileIndex].health = {
      ...profile.profiles[profileIndex].health,
      ...healthData
    };
    await profile.save();

    await logAccess(userId, profile.profiles[profileIndex].profileId, userId, 'user', 'update', ['health'], req);

    res.json({
      success: true,
      data: profile.profiles[profileIndex].health,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ACCESS LOG ROUTES
// ============================================

// GET /profile/access-logs - Get access logs
app.get('/profile/access-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || 'default_user';
    const { limit = '50', offset = '0' } = req.query;

    const logs = await ProfileAccessLog.find({ userId })
      .sort({ timestamp: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

    const total = await ProfileAccessLog.countDocuments({ userId });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, requestId: req.requestId });

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      logger.info(`RisaCare Profile Service started on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
