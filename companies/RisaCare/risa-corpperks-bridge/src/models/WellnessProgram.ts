import mongoose, { Schema, Document } from 'mongoose';

export interface IWellnessProgram extends Document {
  programId: string;
  name: string;
  description: string;
  category: 'fitness' | 'nutrition' | 'mental_health' | 'preventive' |
             'chronic_care' | 'maternity' | 'pediatric' | 'general';
  targetAudience: 'all' | 'employees' | 'managers' | 'seniors';
  duration: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'once';
  pointsReward: number;
  completionCertificate: boolean;
  prerequisites: string[];
  features: Array<{
    name: string;
    description: string;
  }>;
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const WellnessProgramSchema = new Schema<IWellnessProgram>({
  programId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['fitness', 'nutrition', 'mental_health', 'preventive',
           'chronic_care', 'maternity', 'pediatric', 'general'],
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'employees', 'managers', 'seniors'],
    default: 'all',
  },
  duration: { type: String, required: true },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'once'],
    required: true,
  },
  pointsReward: { type: Number, default: 0 },
  completionCertificate: { type: Boolean, default: false },
  prerequisites: [{ type: String }],
  features: [{
    name: { type: String },
    description: { type: String },
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft',
  },
}, { timestamps: true });

WellnessProgramSchema.index({ category: 1 });
WellnessProgramSchema.index({ status: 1 });
WellnessProgramSchema.index({ targetAudience: 1 });

export const WellnessProgram = mongoose.model<IWellnessProgram>('WellnessProgram', WellnessProgramSchema);
