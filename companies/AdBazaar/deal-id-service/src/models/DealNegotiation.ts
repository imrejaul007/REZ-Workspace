import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema
export const DealNegotiationSchema = z.object({
  dealId: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn']).default('pending'),
  offers: z.array(z.object({
    id: z.string(),
    party: z.enum(['buyer', 'seller']),
    partyId: z.string(),
    price: z.object({
      amount: z.number().min(0),
      currency: z.string().default('USD'),
      model: z.enum(['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate']).default('cpm'),
    }),
    impressions: z.object({
      guaranteed: z.number().int().min(0),
      total: z.number().int().min(0),
    }),
    terms: z.object({
      pacing: z.string().optional(),
      targeting: z.any().optional(),
      restrictions: z.any().optional(),
    }),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  })).default([]),
  counteroffers: z.array(z.object({
    id: z.string(),
    originalOfferId: z.string(),
    party: z.enum(['buyer', 'seller']),
    partyId: z.string(),
    changes: z.record(z.any()),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  })).default([]),
  currentRound: z.number().int().min(1).default(1),
  maxRounds: z.number().int().min(1).default(5),
  deadline: z.string().datetime().optional(),
  acceptedTerms: z.any().optional(),
  rejectionReason: z.string().optional(),
  negotiationHistory: z.array(z.object({
    action: z.string(),
    party: z.string(),
    details: z.any(),
    timestamp: z.string().datetime(),
  })).default([]),
  metadata: z.record(z.any()).optional(),
});

export type IDealNegotiation = z.infer<typeof DealNegotiationSchema>;

export interface IDealNegotiationDocument extends IDealNegotiation, Document {
  createdAt: Date;
  updatedAt: Date;
  addOffer(offer: NonNullable<IDealNegotiation['offers']>[0]): Promise<void>;
  addCounteroffer(counteroffer: NonNullable<IDealNegotiation['counteroffers']>[0]): Promise<void>;
  accept(acceptedTerms: any): Promise<void>;
  reject(reason: string): Promise<void>;
  expire(): Promise<void>;
}

const dealNegotiationMongooseSchema = new Schema<IDealNegotiationDocument>(
  {
    dealId: { type: String, required: true, index: true },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'in_progress', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn'],
      index: true,
    },
    offers: [{
      id: { type: String, required: true },
      party: { type: String, enum: ['buyer', 'seller'], required: true },
      partyId: { type: String, required: true },
      price: {
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' },
        model: { type: String, enum: ['cpm', 'cpc', 'cpa', 'cpv', 'flat_rate'], default: 'cpm' },
      },
      impressions: {
        guaranteed: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
      terms: {
        pacing: String,
        targeting: Schema.Types.Mixed,
        restrictions: Schema.Types.Mixed,
      },
      message: String,
      timestamp: { type: String, required: true },
    }],
    counteroffers: [{
      id: { type: String, required: true },
      originalOfferId: { type: String, required: true },
      party: { type: String, enum: ['buyer', 'seller'], required: true },
      partyId: { type: String, required: true },
      changes: { type: Schema.Types.Mixed, required: true },
      message: String,
      timestamp: { type: String, required: true },
    }],
    currentRound: { type: Number, default: 1, min: 1 },
    maxRounds: { type: Number, default: 5, min: 1 },
    deadline: Date,
    acceptedTerms: Schema.Types.Mixed,
    rejectionReason: String,
    negotiationHistory: [{
      action: { type: String, required: true },
      party: { type: String, required: true },
      details: Schema.Types.Mixed,
      timestamp: { type: String, required: true },
    }],
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Instance methods
dealNegotiationMongooseSchema.methods.addOffer = async function (
  this: IDealNegotiationDocument,
  offer: NonNullable<IDealNegotiation['offers']>[0]
) {
  this.offers.push(offer);
  this.status = 'in_progress';
  this.negotiationHistory.push({
    action: 'offer_added',
    party: offer.party,
    details: { offerId: offer.id, price: offer.price },
    timestamp: new Date().toISOString(),
  });
  await this.save();
};

dealNegotiationMongooseSchema.methods.addCounteroffer = async function (
  this: IDealNegotiationDocument,
  counteroffer: NonNullable<IDealNegotiation['counteroffers']>[0]
) {
  this.counteroffers.push(counteroffer);
  this.currentRound += 1;
  this.status = 'countered';
  this.negotiationHistory.push({
    action: 'counteroffer_added',
    party: counteroffer.party,
    details: { counterofferId: counteroffer.id, changes: counteroffer.changes },
    timestamp: new Date().toISOString(),
  });
  await this.save();
};

dealNegotiationMongooseSchema.methods.accept = async function (
  this: IDealNegotiationDocument,
  acceptedTerms: any
) {
  this.status = 'accepted';
  this.acceptedTerms = acceptedTerms;
  this.negotiationHistory.push({
    action: 'negotiation_accepted',
    party: 'system',
    details: { acceptedTerms },
    timestamp: new Date().toISOString(),
  });
  await this.save();
};

dealNegotiationMongooseSchema.methods.reject = async function (
  this: IDealNegotiationDocument,
  reason: string
) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.negotiationHistory.push({
    action: 'negotiation_rejected',
    party: 'system',
    details: { reason },
    timestamp: new Date().toISOString(),
  });
  await this.save();
};

dealNegotiationMongooseSchema.methods.expire = async function (this: IDealNegotiationDocument) {
  this.status = 'expired';
  this.negotiationHistory.push({
    action: 'negotiation_expired',
    party: 'system',
    details: {},
    timestamp: new Date().toISOString(),
  });
  await this.save();
};

// Indexes
dealNegotiationMongooseSchema.index({ dealId: 1, status: 1 });

export const DealNegotiation = mongoose.model<IDealNegotiationDocument>('DealNegotiation', dealNegotiationMongooseSchema);