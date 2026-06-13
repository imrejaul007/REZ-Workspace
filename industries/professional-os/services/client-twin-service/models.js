const mongoose = require('mongoose');

const clientTwinSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  contactPerson: { name: String, email: String, phone: String },
  industry: String,
  status: { type: String, enum: ['prospect', 'active', 'inactive'], default: 'prospect' },
  accountStatus: { type: String, enum: ['current', 'overdue', 'blocked'], default: 'current' },
  contractValue: Number,
  lifetimeValue: Number,
  paymentTerms: String,
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectTwin' }],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const projectTwinSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientTwin', required: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['proposal', 'in_progress', 'on_hold', 'completed', 'cancelled'], default: 'proposal' },
  startDate: Date,
  endDate: Date,
  budget: Number,
  spent: Number,
  team: [{ name: String, role: String, rate: Number }],
  milestones: [{ title: String, dueDate: Date, status: String }],
  deliverables: [{ name: String, status: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ClientTwin = mongoose.model('ClientTwin', clientTwinSchema);
const ProjectTwin = mongoose.model('ProjectTwin', projectTwinSchema);

module.exports = { ClientTwin, ProjectTwin };
