/**
 * Dashboard Model - Mongoose schema for dashboard configurations
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IDashboard extends Document {
  dashboardId: string;
  name: string;
  description: string;
  ownerId: string;
  ownerType: 'team' | 'agent' | 'admin';
  teamId?: string;
  isDefault: boolean;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    config: Record<string, unknown>;
    position: { x: number; y: number; w: number; h: number };
  }>;
  filters: {
    dateRange: { start: Date; end: Date };
    teams?: string[];
    agents?: string[];
    categories?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const dashboardSchema = new Schema<IDashboard>(
  {
    dashboardId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    ownerId: { type: String, required: true },
    ownerType: {
      type: String,
      enum: ['team', 'agent', 'admin'],
      required: true,
    },
    teamId: String,
    isDefault: { type: Boolean, default: false },
    widgets: [
      {
        id: String,
        type: String,
        title: String,
        config: { type: Schema.Types.Mixed },
        position: {
          x: Number,
          y: Number,
          w: Number,
          h: Number,
        },
      },
    ],
    filters: {
      dateRange: {
        start: Date,
        end: Date,
      },
      teams: [String],
      agents: [String],
      categories: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dashboardSchema.index({ ownerId: 1, ownerType: 1 });
dashboardSchema.index({ teamId: 1, isDefault: 1 });

export const Dashboard = mongoose.model<IDashboard>('Dashboard', dashboardSchema);
export default Dashboard;