import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const EmailSchema = z.object({
  outreachId: z.string(),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional()
  }),
  to: z.object({
    email: z.string().email(),
    name: z.string().optional()
  }),
  subject: z.string(),
  body: z.string(),
  headers: z.record(z.string()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    mimeType: z.string(),
    size: z.number()
  })).optional(),
  metadata: z.record(z.any()).optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
  bouncedAt: z.date().optional(),
  bouncedReason: z.string().optional(),
  spamScore: z.number().optional()
});

export type IEmail = z.infer<typeof EmailSchema>;

const emailSchema = new Schema({
  outreachId: { type: Schema.Types.ObjectId, ref: 'Outreach', required: true, index: true },
  from: {
    email: { type: String, required: true },
    name: String
  },
  to: {
    email: { type: String, required: true },
    name: String
  },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  headers: { type: Map, of: String },
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  metadata: { type: Map, of: Schema.Types.Mixed },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  openedAt: { type: Date },
  clickedAt: { type: Date },
  bouncedAt: { type: Date },
  bouncedReason: String,
  spamScore: Number
}, {
  timestamps: true
});

emailSchema.index({ outreachId: 1 });
emailSchema.index({ 'to.email': 1 });

export const Email = mongoose.model<IEmail & Document>('Email', emailSchema);