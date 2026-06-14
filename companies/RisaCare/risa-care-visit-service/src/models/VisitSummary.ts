import mongoose, { Document, Schema } from 'mongoose';

// Action item interface
export interface IActionItem {
  id: string;
  type: 'medication' | 'lifestyle' | 'follow-up' | 'test' | 'procedure' | 'referral';
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

// Key point interface
export interface IKeyPoint {
  category: 'diagnosis' | 'treatment' | 'warning' | 'instruction';
  point: string;
  importance: 'critical' | 'important' | 'informational';
}

// Visit summary document interface
export interface IVisitSummary extends Document {
  id: string;
  visitId: string;
  profileId: string;
  summary: string;
  keyPoints: IKeyPoint[];
  actionItems: IActionItem[];
  generatedAt: Date;
  modelVersion: string;
  rawResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Visit summary schema
const VisitSummarySchema = new Schema<IVisitSummary>(
  {
    id: { type: String, required: true, unique: true, index: true },
    visitId: { type: String, required: true, unique: true, index: true },
    profileId: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    keyPoints: [{
      category: {
        type: String,
        enum: ['diagnosis', 'treatment', 'warning', 'instruction'],
        required: true
      },
      point: { type: String, required: true },
      importance: {
        type: String,
        enum: ['critical', 'important', 'informational'],
        default: 'important'
      }
    }],
    actionItems: [{
      id: { type: String, required: true },
      type: {
        type: String,
        enum: ['medication', 'lifestyle', 'follow-up', 'test', 'procedure', 'referral'],
        required: true
      },
      description: { type: String, required: true },
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      dueDate: Date,
      completed: { type: Boolean, default: false },
      completedAt: Date
    }],
    generatedAt: { type: Date, required: true },
    modelVersion: { type: String, required: true },
    rawResponse: String
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
VisitSummarySchema.index({ visitId: 1 });
VisitSummarySchema.index({ profileId: 1, generatedAt: -1 });

export const VisitSummary = mongoose.model<IVisitSummary>('VisitSummary', VisitSummarySchema);
