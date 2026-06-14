/**
 * REZ Atlas v2 - CRM Core MongoDB Models
 * Complete CRM with Lead, Account, Contact, Opportunity, Activity
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// Account Schema
// ================================================
export interface IAccount extends Document {
  name: string;
  domain: string;
  industry: string;
  size: string;
  phone: string;
  address: string;
  city: string;
  ownerId: string;
  territoryId: string;
  status: 'prospect' | 'active' | 'churned';
  lifetimeValue: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
  name: { type: String, required: true, index: true },
  domain: { type: String, default: '' },
  industry: { type: String, default: '' },
  size: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  ownerId: { type: String, default: 'system', index: true },
  territoryId: { type: String, default: '', index: true },
  status: { type: String, enum: ['prospect', 'active', 'churned'], default: 'prospect', index: true },
  lifetimeValue: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

AccountSchema.index({ status: 1, city: 1 });
AccountSchema.index({ ownerId: 1, status: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);

// ================================================
// Contact Schema
// ================================================
export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  seniority: string;
  accountId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, default: '' },
  title: { type: String, default: '' },
  seniority: { type: String, default: '' },
  accountId: { type: String, required: true, index: true },
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

ContactSchema.index({ accountId: 1, isPrimary: -1 });
ContactSchema.index({ email: 1 }, { unique: true });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);

// ================================================
// Opportunity Schema
// ================================================
export interface IOpportunity extends Document {
  name: string;
  accountId: string;
  contactId: string;
  productId: string;
  productName: string;
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number;
  expectedCloseDate: string;
  nextAction: string;
  aiScore: number;
  notes: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>({
  name: { type: String, required: true },
  accountId: { type: String, required: true, index: true },
  contactId: { type: String, default: '' },
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  stage: { type: String, enum: ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'], default: 'discovery', index: true },
  value: { type: Number, default: 0 },
  probability: { type: Number, default: 20 },
  expectedCloseDate: { type: String, default: '' },
  nextAction: { type: String, default: '' },
  aiScore: { type: Number, default: 50 },
  notes: { type: String, default: '' },
  ownerId: { type: String, default: 'system', index: true },
}, { timestamps: true });

OpportunitySchema.index({ stage: 1, value: -1 });
OpportunitySchema.index({ accountId: 1, stage: 1 });
OpportunitySchema.index({ ownerId: 1, stage: 1 });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

// ================================================
// Activity Schema
// ================================================
export interface IActivity extends Document {
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  accountId: string;
  contactId: string;
  opportunityId: string | null;
  subject: string;
  description: string;
  completed: boolean;
  dueDate: Date | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  type: { type: String, enum: ['email', 'call', 'meeting', 'note', 'task'], required: true, index: true },
  accountId: { type: String, required: true, index: true },
  contactId: { type: String, default: '', index: true },
  opportunityId: { type: String, default: null, index: true },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false, index: true },
  dueDate: { type: Date, default: null },
  ownerId: { type: String, default: 'system', index: true },
}, { timestamps: true });

ActivitySchema.index({ accountId: 1, createdAt: -1 });
ActivitySchema.index({ completed: 1, dueDate: 1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);