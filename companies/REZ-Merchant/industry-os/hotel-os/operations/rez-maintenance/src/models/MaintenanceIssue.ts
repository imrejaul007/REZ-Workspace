/**
 * MaintenanceIssue Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IMaintenanceIssue } from '../types';

export interface IMaintenanceIssueDocument extends IMaintenanceIssue, Document {}

const MaintenanceIssueSchema = new Schema<IMaintenanceIssueDocument>({
  issueId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, index: true },
  roomNumber: { type: String },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'structural', 'cleaning', 'other'],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['reported', 'in_progress', 'pending_parts', 'resolved', 'closed'],
    default: 'reported',
    index: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: String, required: true },
  assignedTo: { type: String },
  images: [{ type: String }],
  notes: [{ type: String }],
  resolvedAt: { type: Date },
  closedAt: { type: Date },
}, {
  timestamps: true,
  collection: 'hotel_maintenance_issues',
});

MaintenanceIssueSchema.index({ hotelId: 1, status: 1 });
MaintenanceIssueSchema.index({ hotelId: 1, category: 1 });
MaintenanceIssueSchema.index({ assignedTo: 1, status: 1 });

export const MaintenanceIssue = mongoose.model<IMaintenanceIssueDocument>('MaintenanceIssue', MaintenanceIssueSchema);
