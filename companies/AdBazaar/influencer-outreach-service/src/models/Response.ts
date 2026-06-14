import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const ResponseSchema = z.object({
  outreachId: z.string(),
  influencerId: z.string(),
  type: z.enum(['interested', 'not_interested', 'price_negotiation', 'need_more_info', 'no_response', 'out_of_office', 'callback_requested', 'custom']),
  message: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  intent: z.string().optional(),
  extractedData: z.record(z.any()).optional(),
  source: z.enum(['email', 'dm', 'whatsapp', 'sms', 'call', 'manual']).default('email'),
  respondedAt: z.date(),
  isRead: z.boolean().default(false),
  readAt: z.date().optional(),
  followUpRequired: z.boolean().default(false),
  followUpScheduledAt: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional()
});

export type IResponse = z.infer<typeof ResponseSchema>;

const responseSchema = new Schema({
  outreachId: { type: Schema.Types.ObjectId, ref: 'Outreach', required: true, index: true },
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: ['interested', 'not_interested', 'price_negotiation', 'need_more_info', 'no_response', 'out_of_office', 'callback_requested', 'custom'],
    required: true
  },
  message: { type: String, required: true },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  intent: { type: String },
  extractedData: { type: Map, of: Schema.Types.Mixed },
  source: {
    type: String,
    enum: ['email', 'dm', 'whatsapp', 'sms', 'call', 'manual'],
    default: 'email'
  },
  respondedAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  followUpRequired: { type: Boolean, default: false },
  followUpScheduledAt: { type: Date },
  notes: { type: String }
}, {
  timestamps: true
});

responseSchema.index({ influencerId: 1, respondedAt: -1 });
responseSchema.index({ type: 1, respondedAt: -1 });
responseSchema.index({ followUpRequired: 1, followUpScheduledAt: 1 });

export const Response = mongoose.model<IResponse& Document>('Response', responseSchema);