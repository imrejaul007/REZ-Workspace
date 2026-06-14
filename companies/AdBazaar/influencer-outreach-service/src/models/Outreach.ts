import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const OutreachSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  brandId: z.string(),
  type: z.enum(['initial', 'follow_up', 'negotiation', 'contract', 'thank_you', 'check_in']).default('initial'),
  status: z.enum(['draft', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'accepted', 'rejected', 'bounced']).default('draft'),
  channel: z.enum(['email', 'dm', 'whatsapp', 'sms', 'call']).default('email'),
  subject: z.string().optional(),
  content: z.string(),
  templateId: z.string().optional(),
  personalization: z.record(z.string()).optional(),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  repliedAt: z.date().optional(),
  response: z.object({
    type: z.enum(['interested', 'not_interested', 'price_negotiation', 'need_more_info', 'no_response', 'out_of_office']),
    message: z.string().optional(),
    respondedAt: z.date().optional()
  }).optional(),
  sequenceId: z.string().optional(),
  sequenceStep: z.number().optional(),
  attemptCount: z.number().default(0),
  lastAttemptAt: z.date().optional(),
  nextAttemptAt: z.date().optional(),
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type IOutreach = z.infer<typeof OutreachSchema>;

const outreachSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: ['initial', 'follow_up', 'negotiation', 'contract', 'thank_you', 'check_in'],
    default: 'initial'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'accepted', 'rejected', 'bounced'],
    default: 'draft',
    index: true
  },
  channel: {
    type: String,
    enum: ['email', 'dm', 'whatsapp', 'sms', 'call'],
    default: 'email'
  },
  subject: { type: String },
  content: { type: String, required: true },
  templateId: { type: String },
  personalization: { type: Map, of: String },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  openedAt: { type: Date },
  repliedAt: { type: Date },
  response: {
    type: {
      type: String,
      enum: ['interested', 'not_interested', 'price_negotiation', 'need_more_info', 'no_response', 'out_of_office']
    },
    message: String,
    respondedAt: Date
  },
  sequenceId: { type: Schema.Types.ObjectId, index: true },
  sequenceStep: { type: Number },
  attemptCount: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  nextAttemptAt: { type: Date },
  createdBy: { type: String }
}, {
  timestamps: true
});

outreachSchema.index({ influencerId: 1, status: 1 });
outreachSchema.index({ brandId: 1, status: 1 });
outreachSchema.index({ campaignId: 1, status: 1 });
outreachSchema.index({ scheduledAt: 1, status: 1 });
outreachSchema.index({ nextAttemptAt: 1 });

export const Outreach = mongoose.model<IOutreach & Document>('Outreach', outreachSchema);