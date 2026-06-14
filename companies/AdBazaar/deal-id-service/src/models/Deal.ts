import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema
export const DealSchema = z.object({
  dealId: z.string().min(1),
  buyer: z.string().min(1),
  seller: z.string().min(1),
  type: z.enum(['private', 'preferred', 'programmatic', 'preferred_deal', 'block']),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string().default('USD'),
    model: z.enum(['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate']).default('cpm'),
  }),
  status: z.enum(['draft', 'pending', 'active', 'paused', 'completed', 'cancelled', 'rejected']).default('draft'),
  terms: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  impressions: z.number().int().min(0).default(0),
  budget: z.object({
    amount: z.number().min(0).default(0),
    spent: z.number().min(0).default(0),
  }).optional(),
  targeting: z.object({
    geo: z.array(z.string()).optional(),
    device: z.array(z.string()).optional(),
    browser: z.array(z.string()).optional(),
    os: z.array(z.string()).optional(),
    ageRange: z.object({
      min: z.number().min(0),
      max: z.number().max(120),
    }).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
  pacing: z.object({
    daily: z.number().min(0).optional(),
    weekly: z.number().min(0).optional(),
    monthly: z.number().min(0).optional(),
    strategy: z.enum(['asap', 'even', 'frontload', 'backload']).default('even'),
  }).optional(),
  dealCategory: z.string().optional(),
  advertiserId: z.string().optional(),
  publisherId: z.string().optional(),
  creativeIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type IDeal = z.infer<typeof DealSchema>;

export interface IDealDocument extends Omit<IDeal, 'startDate' | 'endDate'>, Document {
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  activate(): Promise<IDealDocument>;
  pause(): Promise<IDealDocument>;
  complete(): Promise<IDealDocument>;
}

const dealMongooseSchema = new Schema<IDealDocument>(
  {
    dealId: { type: String, required: true, unique: true, index: true },
    buyer: { type: String, required: true, index: true },
    seller: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['private', 'preferred', 'programmatic', 'preferred_deal', 'block'],
      index: true,
    },
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD' },
      model: { type: String, enum: ['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate'], default: 'cpm' },
    },
    status: {
      type: String,
      default: 'draft',
      enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled', 'rejected'],
      index: true,
    },
    terms: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    impressions: { type: Number, default: 0, min: 0 },
    budget: {
      amount: { type: Number, default: 0, min: 0 },
      spent: { type: Number, default: 0, min: 0 },
    },
    targeting: {
      geo: [String],
      device: [String],
      browser: [String],
      os: [String],
      ageRange: {
        min: Number,
        max: Number,
      },
      interests: [String],
    },
    pacing: {
      daily: Number,
      weekly: Number,
      monthly: Number,
      strategy: { type: String, enum: ['asap', 'even', 'frontload', 'backload'], default: 'even' },
    },
    dealCategory: { type: String, index: true },
    advertiserId: { type: String, index: true },
    publisherId: { type: String, index: true },
    creativeIds: [String],
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Instance methods
dealMongooseSchema.methods.activate = async function (this: IDealDocument) {
  this.status = 'active';
  await this.save();
  return this;
};

dealMongooseSchema.methods.pause = async function (this: IDealDocument) {
  this.status = 'paused';
  await this.save();
  return this;
};

dealMongooseSchema.methods.complete = async function (this: IDealDocument) {
  this.status = 'completed';
  await this.save();
  return this;
};

// Indexes
dealMongooseSchema.index({ buyer: 1, status: 1 });
dealMongooseSchema.index({ seller: 1, status: 1 });
dealMongooseSchema.index({ dealCategory: 1, status: 1 });
dealMongooseSchema.index({ startDate: 1, endDate: 1 });

export const Deal = mongoose.model<IDealDocument>('Deal', dealMongooseSchema);