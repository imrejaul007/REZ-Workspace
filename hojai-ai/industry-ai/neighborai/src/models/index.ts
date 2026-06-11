/**
 * NEIGHBORAI - Residential Society AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// RESIDENT MODEL
// ============================================

export interface IResident extends Document {
  name: string;
  phone: string;
  email: string;
  flatNumber: string;
  wing: string;
  familyMembers: string[];
  vehicleNumbers: string[];
  status: 'owner' | 'tenant';
  moveInDate: Date;
  emergencyContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  flatNumber: { type: String, required: true, trim: true },
  wing: { type: String, required: true, trim: true },
  familyMembers: { type: [String], default: [] },
  vehicleNumbers: { type: [String], default: [] },
  status: { type: String, enum: ['owner', 'tenant'], default: 'owner' },
  moveInDate: { type: Date, default: Date.now },
  emergencyContact: { type: String, trim: true }
}, { timestamps: true });

ResidentSchema.index({ flatNumber: 1 }, { unique: true });
ResidentSchema.index({ wing: 1 });
ResidentSchema.index({ email: 1 });
ResidentSchema.index({ phone: 1 });

// ============================================
// VISITOR MODEL
// ============================================

export interface IVisitor extends Document {
  name: string;
  phone: string;
  purpose: string;
  hostFlat: string;
  checkIn: Date;
  checkOut?: Date;
  status: 'checked-in' | 'checked-out' | 'pending';
  entryCode?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  purpose: { type: String, required: true, trim: true },
  hostFlat: { type: String, required: true, trim: true },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date },
  status: { type: String, enum: ['checked-in', 'checked-out', 'pending'], default: 'pending' },
  entryCode: { type: String },
  approvedBy: { type: String, trim: true }
}, { timestamps: true });

VisitorSchema.index({ hostFlat: 1 });
VisitorSchema.index({ status: 1 });
VisitorSchema.index({ checkIn: 1 });

// ============================================
// COMPLAINT MODEL
// ============================================

export interface IComplaint extends Document {
  residentId: string;
  flatNumber: string;
  wing?: string;
  category: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  residentId: { type: String, required: true },
  flatNumber: { type: String, required: true, trim: true },
  wing: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTo: { type: String },
  resolution: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

ComplaintSchema.index({ flatNumber: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ createdAt: -1 });

// ============================================
// MAINTENANCE MODEL
// ============================================

export interface IMaintenance extends Document {
  residentId: string;
  flatNumber: string;
  wing?: string;
  category: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
  paidAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>({
  residentId: { type: String, required: true },
  flatNumber: { type: String, required: true, trim: true },
  wing: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  paidAt: { type: Date },
  paidAmount: { type: Number }
}, { timestamps: true });

MaintenanceSchema.index({ flatNumber: 1 });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ dueDate: 1 });

// ============================================
// EVENT MODEL
// ============================================

export interface IEvent extends Document {
  title: string;
  date: Date;
  time?: string;
  venue?: string;
  description: string;
  attendees: string[];
  organizer?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, trim: true },
  venue: { type: String, trim: true },
  description: { type: String, required: true },
  attendees: { type: [String], default: [] },
  organizer: { type: String, trim: true }
}, { timestamps: true });

EventSchema.index({ date: 1 });
EventSchema.index({ title: 1 });

// ============================================
// USER MODEL (for authentication)
// ============================================

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'resident' | 'security';
  flatNumber?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'resident', 'security'], default: 'resident' },
  flatNumber: { type: String, trim: true },
  name: { type: String, required: true, trim: true }
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ============================================
// EXPORT MODELS
// ============================================

export const Resident = mongoose.model<IResident>('Resident', ResidentSchema);
export const Visitor = mongoose.model<IVisitor>('Visitor', VisitorSchema);
export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export const Maintenance = mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
export const Event = mongoose.model<IEvent>('Event', EventSchema);
export const User = mongoose.model<IUser>('User', UserSchema);

export const Models = { Resident, Visitor, Complaint, Maintenance, Event, User };
export default Models;