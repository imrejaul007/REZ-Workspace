import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const SequenceStepSchema = z.object({
  step: z.number(),
  type: z.enum(['email', 'dm', 'whatsapp', 'sms', 'delay', 'condition']),
  subject: z.string().optional(),
  content: z.string(),
  delayDays: z.number().optional(),
  delayHours: z.number().optional(),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.any()
  }).optional(),
  triggerOnResponse: z.boolean().default(false)
});

export const SequenceSchema = z.object({
  name: z.string(),
  brandId: z.string(),
  description: z.string().optional(),
  steps: z.array(SequenceStepSchema),
  targetCriteria: z.object({
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    niches: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional(),
    engagementRate: z.number().optional()
  }).optional(),
  isActive: z.boolean().default(true),
  totalEnrolled: z.number().default(0),
  totalCompleted: z.number().default(0),
  totalResponses: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type ISequence = z.infer<typeof SequenceSchema>;
export type ISequenceStep = z.infer<typeof SequenceStepSchema>;

const sequenceSchema = new Schema({
  name: { type: String, required: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  description: { type: String },
  steps: [{
    step: { type: Number, required: true },
    type: {
      type: String,
      enum: ['email', 'dm', 'whatsapp', 'sms', 'delay', 'condition'],
      required: true
    },
    subject: String,
    content: { type: String, required: true },
    delayDays: Number,
    delayHours: Number,
    condition: {
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than']
      },
      value: Schema.Types.Mixed
    },
    triggerOnResponse: { type: Boolean, default: false }
  }],
  targetCriteria: {
    minFollowers: Number,
    maxFollowers: Number,
    niches: [String],
    platforms: [String],
    engagementRate: Number
  },
  isActive: { type: Boolean, default: true },
  totalEnrolled: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  totalResponses: { type: Number, default: 0 }
}, {
  timestamps: true
});

sequenceSchema.index({ brandId: 1, isActive: 1 });

export const Sequence = mongoose.model<ISequence& Document>('Sequence', sequenceSchema);