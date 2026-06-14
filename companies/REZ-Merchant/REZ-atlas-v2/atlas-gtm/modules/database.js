/**
 * Database Module
 *
 * MongoDB persistence for Atlas GTM
 * Replaces in-memory storage with proper database
 */

const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-gtm';

let isConnected = false;

/**
 * Connect to MongoDB
 */
async function connect() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('MongoDB connected:', MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnect() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

/**
 * Check connection status
 */
function getStatus() {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
}

// ============================================
// SCHEMAS
// ============================================

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  domain: { type: String, required: true },
  name: String,
  status: { type: String, enum: ['draft', 'generating', 'completed', 'failed'], default: 'draft' },
  companyInsight: mongoose.Schema.Types.Mixed,
  competitors: mongoose.Schema.Types.Mixed,
  segments: mongoose.Schema.Types.Mixed,
  personas: mongoose.Schema.Types.Mixed,
  stats: {
    prospectsFound: Number,
    contactsFound: Number,
    companiesTargeted: Number,
    emailsGenerated: Number,
    campaignsCreated: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prospect Schema
const prospectSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  campaignId: { type: String, index: true },
  segmentId: { type: String, index: true },
  firstName: String,
  lastName: String,
  email: { type: String, index: true },
  phone: String,
  company: String,
  domain: String,
  title: String,
  seniority: String,
  linkedinUrl: String,
  persona: String,
  painPoints: [String],
  competitorUsing: String,
  budget: Number,
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new', index: true },
  stage: { type: String, default: 'lead' },
  tags: [String],
  scores: {
    opportunity: Number,
    pain: Number,
    intent: Number,
    urgency: Number,
    revenue: Number,
    overall: Number
  },
  crmId: String,
  lastActivity: Date,
  activities: [{
    type: String,
    description: String,
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  engagement: {
    emailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    calls: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Sequence Schema
const sequenceSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  description: String,
  steps: [{
    id: String,
    order: Number,
    type: { type: String, enum: ['email', 'sms', 'whatsapp', 'linkedin', 'delay', 'condition', 'task'] },
    config: mongoose.Schema.Types.Mixed,
    delay: Number,
    condition: mongoose.Schema.Types.Mixed
  }],
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  stats: {
    enrolled: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    optOuts: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  sequenceId: { type: String, required: true, index: true },
  prospectId: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'completed', 'bounced', 'optout'], default: 'active' },
  currentStep: Number,
  stepHistory: [{
    stepId: String,
    status: String,
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date
  }],
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Workflow Schema
const workflowSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  description: String,
  trigger: { type: String, enum: ['prospect_created', 'email_opened', 'email_clicked', 'replied', 'stage_changed', 'score_changed', 'manual'] },
  steps: [{
    id: String,
    type: { type: String, enum: ['trigger', 'send_email', 'send_sms', 'send_whatsapp', 'add_tag', 'update_status', 'create_crm_deal', 'schedule_meeting', 'webhook', 'ai_analyze', 'condition', 'delay', 'end'] },
    config: mongoose.Schema.Types.Mixed
  }],
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  stats: {
    triggered: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Experiment Schema (A/B Testing)
const experimentSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  type: { type: String, enum: ['subject_line', 'email_content', 'send_time', 'cta'] },
  hypothesis: String,
  status: { type: String, enum: ['draft', 'running', 'paused', 'completed'], default: 'draft' },
  metric: { type: String, enum: ['open_rate', 'click_rate', 'reply_rate', 'conversion'], default: 'open_rate' },
  variants: [{
    id: String,
    name: String,
    content: String,
    trafficPercentage: Number,
    stats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      converted: { type: Number, default: 0 }
    }
  }],
  settings: {
    trafficSplit: [Number],
    minSampleSize: Number,
    confidenceLevel: Number,
    maxDuration: Number
  },
  results: {
    winner: String,
    confidence: Number,
    pValue: Number,
    statisticalSignificance: Boolean
  },
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Territory Schema
const territorySchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  description: String,
  type: { type: String, enum: ['geographic', 'industry', 'company_size', 'custom'], default: 'geographic' },
  rules: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed
  }],
  boundaries: {
    countries: [String],
    states: [String],
    cities: [String],
    zipCodes: [String]
  },
  ownerId: String,
  stats: {
    prospects: { type: Number, default: 0 },
    companies: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Rep Schema
const repSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  email: { type: String, required: true },
  territoryIds: [String],
  quotas: {
    daily: Number,
    weekly: Number,
    monthly: Number
  },
  stats: {
    outreach: { type: Number, default: 0 },
    qualified: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// AdBazaar Campaign Schema
const adCampaignSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  name: String,
  type: { type: String, enum: ['qr_code', 'dooh', 'social', 'retail_media'], default: 'qr_code' },
  subtype: String,
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  budget: {
    daily: Number,
    total: Number,
    spent: { type: Number, default: 0 }
  },
  targeting: mongoose.Schema.Types.Mixed,
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: Number,
    cpc: Number,
    cpa: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Email Log Schema
const emailLogSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  prospectId: { type: String, index: true },
  campaignId: String,
  from: String,
  to: String,
  subject: String,
  status: { type: String, enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'], index: true },
  sentAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  workspaceId: { type: String, index: true },
  prospectId: { type: String, index: true },
  userId: String,
  type: { type: String, enum: ['email_sent', 'email_opened', 'email_clicked', 'email_replied', 'call_made', 'call_completed', 'meeting_scheduled', 'note_added', 'stage_changed', 'score_updated'], required: true },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ============================================
// MODELS
// ============================================

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
const Prospect = mongoose.models.Prospect || mongoose.model('Prospect', prospectSchema);
const Sequence = mongoose.models.Sequence || mongoose.model('Sequence', sequenceSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
const Experiment = mongoose.models.Experiment || mongoose.model('Experiment', experimentSchema);
const Territory = mongoose.models.Territory || mongoose.model('Territory', territorySchema);
const Rep = mongoose.models.Rep || mongoose.model('Rep', repSchema);
const AdCampaign = mongoose.models.AdCampaign || mongoose.model('AdCampaign', adCampaignSchema);
const EmailLog = mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function ensureIndexes() {
  await Campaign.createIndexes();
  await Prospect.createIndexes();
  await Sequence.createIndexes();
  await Enrollment.createIndexes();
  await Workflow.createIndexes();
  await Experiment.createIndexes();
  await Territory.createIndexes();
  await Rep.createIndexes();
  await AdCampaign.createIndexes();
  await EmailLog.createIndexes();
  await ActivityLog.createIndexes();
}

module.exports = {
  connect,
  disconnect,
  getStatus,
  ensureIndexes,

  // Models
  Campaign,
  Prospect,
  Sequence,
  Enrollment,
  Workflow,
  Experiment,
  Territory,
  Rep,
  AdCampaign,
  EmailLog,
  ActivityLog
};
