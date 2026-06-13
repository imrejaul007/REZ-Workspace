const mongoose = require('mongoose');

const clientTwinSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['individual', 'corporate', 'government', 'nonprofit'], required: true },
  email: { type: String, required: true },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  company: String,
  industry: String,
  status: { type: String, enum: ['active', 'inactive', 'prospect'], default: 'prospect' },
  source: { type: String, enum: ['referral', 'marketing', 'direct', 'partnership'] },
  referralSource: String,
  matters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MatterTwin' }],
  billingInfo: {
    paymentTerms: { type: String, enum: ['immediate', 'net15', 'net30', 'net60'] },
    billingEmail: String,
    taxId: String
  },
  notes: String,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clientTwinSchema.index({ name: 'text', email: 'text', company: 'text' });
clientTwinSchema.index({ status: 1, type: 1 });
clientTwinSchema.index({ createdAt: -1 });

const matterTwinSchema = new mongoose.Schema({
  matterId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  caseNumber: String,
  type: {
    type: String,
    enum: ['litigation', 'corporate', 'real_estate', 'ip', 'employment', 'family', 'criminal', 'bankruptcy', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['intake', 'pending', 'active', 'on_hold', 'closed', 'archived'],
    default: 'intake'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientTwin', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parties: [{
    name: String,
    type: { type: String, enum: ['plaintiff', 'defendant', 'petitioner', 'respondent', 'other'] },
    counsel: String
  }],
  court: {
    name: String,
    jurisdiction: String,
    caseNumber: String
  },
  opposingCounsel: {
    name: String,
    firm: String,
    email: String,
    phone: String
  },
  description: String,
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'] },
    completedAt: Date
  }],
  timeEntries: [{
    attorney: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: Date,
    hours: Number,
    description: String,
    billingRate: Number,
    billed: { type: Boolean, default: false }
  }],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTwin' }],
  expenses: [{
    date: Date,
    description: String,
    amount: Number,
    category: String,
    receipt: String,
    billed: { type: Boolean, default: false }
  }],
  billingRate: Number,
  billingType: { type: String, enum: ['hourly', 'flat', 'contingency', 'pro_bono'] },
  flatFee: Number,
  estimatedHours: Number,
  budget: Number,
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

matterTwinSchema.index({ status: 1, type: 1 });
matterTwinSchema.index({ client: 1 });
matterTwinSchema.index({ assignedTo: 1 });
matterTwinSchema.index({ 'milestones.dueDate': 1 });

const DocumentTwinSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['contract', 'brief', 'motion', 'pleading', 'correspondence', 'evidence', 'internal', 'other'],
    required: true
  },
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'MatterTwin' },
  originalName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  hash: String,
  version: { type: Number, default: 1 },
  parentDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTwin' },
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed,
  archived: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DocumentTwinSchema.index({ case: 1, type: 1 });
DocumentTwinSchema.index({ archived: 1 });

const CalendarTwinSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['court_date', 'deadline', 'meeting', 'call', 'deposition', 'hearing', 'other'],
    required: true
  },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'MatterTwin' },
  location: String,
  description: String,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reminders: [{
    time: Date,
    type: String,
    sent: { type: Boolean, default: false }
  }],
  recurring: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    interval: Number,
    endDate: Date
  },
  color: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CalendarTwinSchema.index({ start: 1, end: 1 });
CalendarTwinSchema.index({ attendees: 1 });

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['partner', 'associate', 'paralegal', 'admin', 'client'], required: true },
  barNumber: String,
  specializations: [String],
  hourlyRate: Number,
  bio: String,
  avatar: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.index({ role: 1, active: 1 });

const ClientTwin = mongoose.model('ClientTwin', clientTwinSchema);
const MatterTwin = mongoose.model('MatterTwin', matterTwinSchema);
const DocumentTwin = mongoose.model('DocumentTwin', DocumentTwinSchema);
const CalendarTwin = mongoose.model('CalendarTwin', CalendarTwinSchema);
const User = mongoose.model('User', UserSchema);

module.exports = { ClientTwin, MatterTwin, DocumentTwin, CalendarTwin, User };
