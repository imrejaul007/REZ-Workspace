const mongoose = require('mongoose');
const projectTwinSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  client: String, scope: String, budget: Number, schedule: String,
  status: { type: String, enum: ['planning', 'in_progress', 'completed', 'on_hold'], default: 'planning' },
  milestones: [{ title: String, dueDate: Date, status: String }],
  riskScore: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const ProjectTwin = mongoose.model('ProjectTwin', projectTwinSchema);
module.exports = { ProjectTwin };
