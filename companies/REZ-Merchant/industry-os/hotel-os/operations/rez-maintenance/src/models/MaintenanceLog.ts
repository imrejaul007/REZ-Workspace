/**
 * MaintenanceLog Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IMaintenanceLog } from '../types';

export interface IMaintenanceLogDocument extends IMaintenanceLog, Document {}

const MaintenanceLogSchema = new Schema<IMaintenanceLogDocument>({
  logId: { type: String, required: true, unique: true, index: true },
  issueId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'hotel_maintenance_logs',
});

MaintenanceLogSchema.index({ issueId: 1, createdAt: -1 });

export const MaintenanceLog = mongoose.model<IMaintenanceLogDocument>('MaintenanceLog', MaintenanceLogSchema);
