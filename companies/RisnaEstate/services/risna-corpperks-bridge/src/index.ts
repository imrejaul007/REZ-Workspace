import { logger } from './logger';
/**
 * RisnaEstate - CorpPerks Bridge Service
 *
 * Connects CorpPerks employee network to RisnaEstate leads.
 * CorpPerks employees become premium real estate leads.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

const app = express();
const PORT = process.env.PORT || 4114;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Event emitter for bridge events
const bridgeEvents = new EventEmitter();

// CorpPerks API (external service)
const CORPPERKS_API = process.env.CORPPERKS_API_URL || 'https://corpperks.rez.app';
const CORPPERKS_API_KEY = process.env.CORPPERKS_API_KEY || '';

// =============================================
// CORPPERKS USER SCHEMA
// =============================================

interface ICorpPerksUser {
  corpperksUserId: string;
  employeeId?: string;
  companyId: string;
  companyName: string;
  name: string;
  email: string;
  phone: string;
  designation?: string;
  department?: string;
  salary?: number;
  workLocation?: string;
  isHighEarner: boolean;
  corporateTier: 'free' | 'starter' | 'professional' | 'enterprise';
  signupSource: string;
  joinedAt: Date;
  lastActiveAt: Date;
}

const CorpPerksUserSchema = new Schema<ICorpPerksUser & Document>({
  corpperksUserId: { type: String, unique: true, index: true },
  employeeId: String,
  companyId: String,
  companyName: String,
  name: String,
  email: { type: String, index: true },
  phone: { type: String, index: true },
  designation: String,
  department: String,
  salary: Number,
  workLocation: String,
  isHighEarner: { type: Boolean, default: false },
  corporateTier: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'free' },
  signupSource: String,
  joinedAt: Date,
  lastActiveAt: Date,
}, { timestamps: true });

const CorpPerksUser = mongoose.model<ICorpPerksUser & Document>('CorpPerksUser', CorpPerksUserSchema);

// =============================================
// RISNAESTATE LEAD BRIDGE SCHEMA
// =============================================

interface ILeadBridge {
  corpperksUserId: string;
  risnaLeadId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAt?: Date;
  syncError?: string;
  tags: string[];
  leadScore?: number;
  segment?: 'hni' | 'corporate' | 'standard';
  convertedToBooking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadBridgeSchema = new Schema<ILeadBridge & Document>('LeadBridge', {
  corpperksUserId: { type: String, unique: true, index: true },
  risnaLeadId: { type: String, index: true },
  syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
  syncAttempts: { type: Number, default: 0 },
  lastSyncAt: Date,
  syncError: String,
  tags: [String],
  leadScore: Number,
  segment: String,
  convertedToBooking: { type: Boolean, default: false },
}, { timestamps: true });

const LeadBridge = mongoose.model<ILeadBridge & Document>('LeadBridge', LeadBridgeSchema);

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Calculate lead score based on CorpPerks data
 */
function calculateLeadScore(user: ICorpPerksUser): { score: number; segment: string; tags: string[] } {
  let score = 50; // Base score
  const tags: string[] = ['corpperks'];

  // High earner bonus (salary >= 30L INR or 500K AED)
  if (user.isHighEarner || (user.salary && user.salary >= 3000000)) {
    score += 30;
    tags.push('high-earner');
  }

  // Corporate tier bonus
  const tierScores = { enterprise: 15, professional: 10, starter: 5, free: 0 };
  score += tierScores[user.corporateTier] || 0;
  if (user.corporateTier === 'enterprise') tags.push('enterprise');

  // Designation-based scoring
  const cxoTitles = ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'Founder', 'Co-Founder', 'Director', 'VP', 'Head'];
  const seniorTitles = ['Senior Manager', 'Principal', 'Lead', 'Architect', 'Senior Director'];

  if (user.designation && cxoTitles.some(t => user.designation!.includes(t))) {
    score += 20;
    tags.push('cxo', 'decision-maker');
  } else if (user.designation && seniorTitles.some(t => user.designation!.includes(t))) {
    score += 10;
    tags.push('senior');
  }

  // Location-based scoring (Dubai/UAE preference)
  if (user.workLocation?.toLowerCase().includes('dubai') ||
      user.workLocation?.toLowerCase().includes('uae') ||
      user.workLocation?.toLowerCase().includes('abudhabi')) {
    score += 15;
    tags.push('uae-based');
  }

  // Department-based scoring
  if (user.department?.toLowerCase().includes('finance') ||
      user.department?.toLowerCase().includes('investment')) {
    score += 10;
    tags.push('finance');
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine segment
  let segment: string;
  if (score >= 80) segment = 'hni';
  else if (score >= 60 || user.corporateTier === 'enterprise') segment = 'corporate';
  else segment = 'standard';

  return { score, segment, tags };
}

/**
 * Fetch CorpPerks user data
 */
async function fetchCorpPerksUser(userId: string): Promise<any> {
  try {
    const response = await fetch(`${CORPPERKS_API}/api/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${CORPPERKS_API_KEY}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    logger.error('CorpPerks API error:', error);
    return null;
  }
}

/**
 * Fetch all CorpPerks users (for batch sync)
 */
async function fetchCorpPerksUsers(filters?: { highEarner?: boolean; tier?: string }): Promise<any[]> {
  try {
    let url = `${CORPPERKS_API}/api/users`;
    const params = new URLSearchParams();
    if (filters?.highEarner) params.append('highEarner', 'true');
    if (filters?.tier) params.append('tier', filters.tier);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${CORPPERKS_API_KEY}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    logger.error('CorpPerks batch fetch error:', error);
    return [];
  }
}

/**
 * Create lead in RisnaEstate Lead Service
 */
async function createRisnaLead(bridgeData: {
  corpperksUserId: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  designation?: string;
  segment: string;
  leadScore: number;
  tags: string[];
}): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.RISNA_LEAD_URL || 'http://localhost:4101'}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
      },
      body: JSON.stringify({
        source: 'corpperks',
        name: bridgeData.name,
        phone: bridgeData.phone,
        email: bridgeData.email,
        company: bridgeData.company,
        designation: bridgeData.designation,
        segment: bridgeData.segment,
        score: bridgeData.leadScore,
        tags: bridgeData.tags,
        metadata: {
          corpperksUserId: bridgeData.corpperksUserId,
          corporateLead: true
        }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.lead?._id || data.lead?.id || null;
  } catch (error) {
    logger.error('Create lead error:', error);
    return null;
  }
}

// =============================================
// API ROUTES
// =============================================

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'risna-corpperks-bridge',
    status: 'healthy',
    connectedToCorpPerks: !!CORPPERKS_API_KEY
  });
});

/**
 * Sync single CorpPerks user to RisnaEstate lead
 * POST /api/sync/user/:userId
 */
app.post('/api/sync/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if already synced
    const existing = await LeadBridge.findOne({ corpperksUserId: userId });
    if (existing && existing.syncStatus === 'synced') {
      return res.json({
        success: true,
        message: 'Already synced',
        bridge: existing
      });
    }

    // Fetch CorpPerks user data
    const corpperksUser = await fetchCorpPerksUser(userId);
    if (!corpperksUser) {
      return res.status(404).json({ error: 'CorpPerks user not found' });
    }

    // Calculate lead score
    const { score, segment, tags } = calculateLeadScore(corpperksUser);

    // Create lead in RisnaEstate
    const leadId = await createRisnaLead({
      corpperksUserId: userId,
      name: corpperksUser.name,
      email: corpperksUser.email,
      phone: corpperksUser.phone,
      company: corpperksUser.companyName,
      designation: corpperksUser.designation,
      segment,
      leadScore: score,
      tags
    });

    if (!leadId) {
      // Save as pending if lead creation fails
      const pendingBridge = await LeadBridge.findOneAndUpdate(
        { corpperksUserId: userId },
        {
          syncStatus: 'failed',
          syncAttempts: existing ? existing.syncAttempts + 1 : 1,
          syncError: 'Lead creation failed',
          tags,
          leadScore: score,
          segment
        },
        { upsert: true, new: true }
      );
      return res.status(500).json({ error: 'Failed to create lead', bridge: pendingBridge });
    }

    // Update or create bridge record
    const bridge = await LeadBridge.findOneAndUpdate(
      { corpperksUserId: userId },
      {
        risnaLeadId: leadId,
        syncStatus: 'synced',
        lastSyncAt: new Date(),
        syncAttempts: existing ? existing.syncAttempts + 1 : 1,
        tags,
        leadScore: score,
        segment
      },
      { upsert: true, new: true }
    );

    // Emit event
    bridgeEvents.emit('lead:synced', { corpperksUserId: userId, leadId, score, segment });

    res.json({ success: true, bridge });
  } catch (error: any) {
    logger.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch sync CorpPerks users
 * POST /api/sync/batch
 */
app.post('/api/sync/batch', async (req: Request, res: Response) => {
  try {
    const { filters, limit = 100 } = req.body;

    // Fetch CorpPerks users
    const users = await fetchCorpPerksUsers(filters);
    const limitedUsers = users.slice(0, limit);

    const results = {
      total: limitedUsers.length,
      synced: 0,
      skipped: 0,
      failed: 0,
      leads: [] as string[]
    };

    for (const user of limitedUsers) {
      const existing = await LeadBridge.findOne({ corpperksUserId: user.id || user._id });
      if (existing && existing.syncStatus === 'synced') {
        results.skipped++;
        continue;
      }

      const { score, segment, tags } = calculateLeadScore(user);
      const leadId = await createRisnaLead({
        corpperksUserId: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.companyName,
        designation: user.designation,
        segment,
        leadScore: score,
        tags
      });

      if (leadId) {
        await LeadBridge.findOneAndUpdate(
          { corpperksUserId: user.id || user._id },
          {
            risnaLeadId: leadId,
            syncStatus: 'synced',
            lastSyncAt: new Date(),
            tags,
            leadScore: score,
            segment
          },
          { upsert: true }
        );
        results.synced++;
        results.leads.push(leadId);
      } else {
        results.failed++;
      }
    }

    bridgeEvents.emit('batch:synced', results);

    res.json({ success: true, results });
  } catch (error: any) {
    logger.error('Batch sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get sync status for CorpPerks users
 * GET /api/sync/status
 */
app.get('/api/sync/status', async (req: Request, res: Response) => {
  try {
    const stats = await LeadBridge.aggregate([
      {
        $group: {
          _id: '$syncStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const segmentStats = await LeadBridge.aggregate([
      { $match: { syncStatus: 'synced' } },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 },
          avgScore: { $avg: '$leadScore' }
        }
      }
    ]);

    const recentSyncs = await LeadBridge.find()
      .sort({ lastSyncAt: -1 })
      .limit(10)
      .select('corpperksUserId syncStatus segment leadScore lastSyncAt');

    res.json({
      status: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      segments: segmentStats,
      recent: recentSyncs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get CorpPerks user by ID
 * GET /api/users/:userId
 */
app.get('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check local cache first
    const cached = await CorpPerksUser.findOne({ corpperksUserId: userId });
    if (cached) {
      return res.json({ user: cached });
    }

    // Fetch from CorpPerks
    const user = await fetchCorpPerksUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate score
    const { score, segment, tags } = calculateLeadScore(user);

    res.json({
      user,
      score,
      segment,
      tags,
      recommendation: score >= 80 ? 'HNI - Priority outreach' :
                     score >= 60 ? 'Corporate - Targeted campaigns' :
                     'Standard - Nurture sequence'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search CorpPerks users (high earners, by company, etc.)
 * GET /api/users/search
 */
app.get('/api/users/search', async (req: Request, res: Response) => {
  try {
    const { q, company, tier, highEarner, minSalary, limit = 50 } = req.query;

    const query: any = {};
    if (company) query.companyName = new RegExp(company as string, 'i');
    if (tier) query.corporateTier = tier;
    if (highEarner === 'true') query.isHighEarner = true;
    if (minSalary) query.salary = { $gte: parseInt(minSalary as string) };

    const users = await CorpPerksUser.find(query)
      .limit(parseInt(limit as string))
      .select('-__v');

    // Add score to each user
    const usersWithScore = users.map(user => {
      const { score, segment, tags } = calculateLeadScore(user);
      return { ...user.toObject(), leadScore: score, segment, tags };
    });

    res.json({ users: usersWithScore, count: usersWithScore.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get HNI/Corporate leads from CorpPerks
 * GET /api/leads/hni
 */
app.get('/api/leads/hni', async (req: res) => {
  try {
    const hniLeads = await LeadBridge.find({
      syncStatus: 'synced',
      segment: 'hni'
    }).populate('risnaLeadId');

    res.json({ leads: hniLeads, count: hniLeads.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get conversion status
 * GET /api/conversions
 */
app.get('/api/conversions', async (req: Request, res: Response) => {
  try {
    const stats = await LeadBridge.aggregate([
      {
        $group: {
          _id: '$convertedToBooking',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSynced = await LeadBridge.countDocuments({ syncStatus: 'synced' });
    const converted = stats.find(s => s._id === true)?.count || 0;

    res.json({
      totalSynced,
      converted,
      conversionRate: totalSynced > 0 ? ((converted / totalSynced) * 100).toFixed(2) + '%' : '0%',
      stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// WEBHOOK - CorpPerks events
// =============================================

/**
 * Webhook from CorpPerks (new signup, high earner flagged, etc.)
 * POST /api/webhooks/corpperks
 */
app.post('/api/webhooks/corpperks', async (req: Request, res: Response) => {
  try {
    const { event, userId, data } = req.body;

    logger.info(`CorpPerks webhook: ${event}`, { userId });

    switch (event) {
      case 'user.signup':
        // New CorpPerks user - create lead
        await createRisnaLead({
          corpperksUserId: userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.companyName,
          segment: 'standard',
          leadScore: 50,
          tags: ['corpperks', 'new-signup']
        });
        break;

      case 'user.high_earner_flagged':
        // User flagged as high earner - boost lead
        const bridge = await LeadBridge.findOne({ corpperksUserId: userId });
        if (bridge) {
          const { score, segment, tags } = calculateLeadScore({ ...data, isHighEarner: true });
          bridge.leadScore = score;
          bridge.segment = segment;
          bridge.tags = [...new Set([...bridge.tags, 'high-earner-flagged'])];
          await bridge.save();
        }
        break;

      case 'user.tier_upgrade':
        // User upgraded tier - re-score
        const updated = await LeadBridge.findOne({ corpperksUserId: userId });
        if (updated) {
          const { score, segment, tags } = calculateLeadScore(data);
          updated.leadScore = score;
          updated.segment = segment;
          updated.tags = tags;
          await updated.save();
        }
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START SERVER
// =============================================

async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-corpperks-bridge');
    logger.info('✅ Connected to MongoDB');

    // Create indexes
    await CorpPerksUser.createIndexes();
    await LeadBridge.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate CorpPerks Bridge running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
