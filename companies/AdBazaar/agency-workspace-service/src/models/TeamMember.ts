import mongoose, { Document, Schema, Types } from 'mongoose';

export type TeamRole = 'admin' | 'manager' | 'analyst' | 'campaign_manager' | 'viewer';

export type Permission =
  | 'view_agencies' | 'edit_agencies'
  | 'view_clients' | 'edit_clients' | 'delete_clients'
  | 'view_campaigns' | 'edit_campaigns' | 'delete_campaigns'
  | 'view_analytics' | 'export_data'
  | 'manage_team' | 'manage_billing'
  | 'manage_templates' | 'manage_settings';

export interface ITeamMember extends Document {
  agencyId: Types.ObjectId;
  name: string;
  email: string;
  role: TeamRole;
  permissions: Permission[];
  department?: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  activityLog: Array<{
    action: string;
    timestamp: Date;
    details?: string;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'analyst', 'campaign_manager', 'viewer'],
      required: true
    },
    permissions: [{
      type: String,
      enum: [
        'view_agencies', 'edit_agencies',
        'view_clients', 'edit_clients', 'delete_clients',
        'view_campaigns', 'edit_campaigns', 'delete_campaigns',
        'view_analytics', 'export_data',
        'manage_team', 'manage_billing',
        'manage_templates', 'manage_settings'
      ]
    }],
    department: { type: String },
    phone: { type: String },
    avatar: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    lastLogin: { type: Date },
    activityLog: [{
      action: { type: String },
      timestamp: { type: Date, default: Date.now },
      details: { type: String }
    }],
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes
TeamMemberSchema.index({ agencyId: 1 });
TeamMemberSchema.index({ email: 1 });
TeamMemberSchema.index({ role: 1 });
TeamMemberSchema.index({ status: 1 });

// Unique email per agency
TeamMemberSchema.index({ agencyId: 1, email: 1 }, { unique: true });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);