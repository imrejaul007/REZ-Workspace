import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// NEGOTIATION MODEL
// ============================================

export interface IParty {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'agent';
  organization?: string;
}

export interface IOffer {
  id: string;
  partyId: string;
  partyName: string;
  amount: number;
  currency: string;
  terms: string[];
  validUntil: Date;
  createdAt: Date;
}

export interface ICounterOffer {
  id: string;
  partyId: string;
  partyName: string;
  previousOfferId: string;
  amount: number;
  currency: string;
  terms: string[];
  message: string;
  createdAt: Date;
}

export interface INegotiation extends Document {
  negotiationId: string;
  title: string;
  description: string;
  type: 'rfq' | 'quote' | 'counter' | 'deal';
  status: 'initiated' | 'rfq_sent' | 'quote_received' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

  // Parties
  buyer: IParty;
  seller?: IParty;

  // Product/Service Details
  product: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    specifications?: Record<string, unknown>;
  };

  // Pricing
  targetPrice?: number;
  currentPrice?: number;
  currency: string;

  // Offers
  initialOffer?: IOffer;
  currentOffer?: IOffer;
  offerHistory: IOffer[];
  counterOffers: ICounterOffer[];

  // Terms
  terms: string[];
  acceptedTerms: string[];

  // Timeline
  startedAt: Date;
  deadline?: Date;
  completedAt?: Date;

  // Metadata
  createdBy: string;
  tenantId: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };

  // Audit Trail
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details: string;
  }>;
}

const OfferSchema = new Schema({
  id: String,
  partyId: String,
  partyName: String,
  amount: Number,
  currency: String,
  terms: [String],
  validUntil: Date,
  createdAt: Date
}, { _id: false });

const CounterOfferSchema = new Schema({
  id: String,
  partyId: String,
  partyName: String,
  previousOfferId: String,
  amount: Number,
  currency: String,
  terms: [String],
  message: String,
  createdAt: Date
}, { _id: false });

const PartySchema = new Schema({
  id: String,
  name: String,
  email: String,
  role: String,
  organization: String
}, { _id: false });

const NegotiationSchema = new Schema<INegotiation>({
  negotiationId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['rfq', 'quote', 'counter', 'deal'],
    default: 'rfq'
  },
  status: {
    type: String,
    enum: ['initiated', 'rfq_sent', 'quote_received', 'negotiating', 'accepted', 'rejected', 'expired', 'cancelled'],
    default: 'initiated'
  },

  buyer: { type: PartySchema, required: true },
  seller: PartySchema,

  product: {
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    specifications: Schema.Types.Mixed
  },

  targetPrice: Number,
  currentPrice: Number,
  currency: { type: String, default: 'INR' },

  initialOffer: OfferSchema,
  currentOffer: OfferSchema,
  offerHistory: [OfferSchema],
  counterOffers: [CounterOfferSchema],

  terms: [String],
  acceptedTerms: [String],

  startedAt: { type: Date, default: Date.now },
  deadline: Date,
  completedAt: Date,

  createdBy: { type: String, required: true },
  tenantId: { type: String, required: true, index: true },

  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  },

  auditTrail: [{
    action: String,
    performedBy: String,
    performedAt: Date,
    details: String
  }]
}, {
  timestamps: false
});

// Indexes
NegotiationSchema.index({ tenantId: 1, status: 1 });
NegotiationSchema.index({ tenantId: 1, buyer: 1 });
NegotiationSchema.index({ tenantId: 1, seller: 1 });
NegotiationSchema.index({ deadline: 1 });

export const Negotiation = mongoose.model<INegotiation>('Negotiation', NegotiationSchema);

// ============================================
// RFQ MODEL
// ============================================

export interface IRFQ extends Document {
  rfqId: string;
  negotiationId: string;
  buyer: IParty;
  product: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    specifications?: Record<string, unknown>;
  };
  requirements: {
    budget?: number;
    deliveryDate?: Date;
    qualityStandards?: string[];
    certifications?: string[];
  };
  status: 'draft' | 'sent' | 'quotes_received' | 'closed' | 'cancelled';
  responses: Array<{
    sellerId: string;
    sellerName: string;
    quotedPrice: number;
    deliveryTime: number;
    validUntil: Date;
    message?: string;
    respondedAt: Date;
  }>;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const RFQResponseSchema = new Schema({
  sellerId: String,
  sellerName: String,
  quotedPrice: Number,
  deliveryTime: Number,
  validUntil: Date,
  message: String,
  respondedAt: Date
}, { _id: false });

const RFQSchema = new Schema<IRFQ>({
  rfqId: { type: String, required: true, unique: true, index: true },
  negotiationId: String,
  buyer: { type: PartySchema, required: true },
  product: {
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    specifications: Schema.Types.Mixed
  },
  requirements: {
    budget: Number,
    deliveryDate: Date,
    qualityStandards: [String],
    certifications: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'quotes_received', 'closed', 'cancelled'],
    default: 'draft'
  },
  responses: [RFQResponseSchema],
  createdBy: { type: String, required: true },
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RFQSchema.index({ tenantId: 1, status: 1 });

export const RFQ = mongoose.model<IRFQ>('RFQ', RFQSchema);

// ============================================
// QUOTE MODEL
// ============================================

export interface IQuote extends Document {
  quoteId: string;
  rfqId?: string;
  negotiationId?: string;
  seller: IParty;
  buyer: IParty;
  product: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
  };
  pricing: {
    unitPrice: number;
    totalPrice: number;
    currency: string;
    taxes: number;
    discounts: Array<{ type: string; value: number }>;
  };
  delivery: {
    leadTime: number;
    deliveryDate: Date;
    shippingCost: number;
  };
  validity: {
    validUntil: Date;
    terms: string[];
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'countered';
  createdAt: Date;
  tenantId: string;
}

const QuotePricingSchema = new Schema({
  unitPrice: Number,
  totalPrice: Number,
  currency: String,
  taxes: Number,
  discounts: [{
    type: String,
    value: Number
  }]
}, { _id: false });

const QuoteDeliverySchema = new Schema({
  leadTime: Number,
  deliveryDate: Date,
  shippingCost: Number
}, { _id: false });

const QuoteValiditySchema = new Schema({
  validUntil: Date,
  terms: [String]
}, { _id: false });

const QuoteSchema = new Schema<IQuote>({
  quoteId: { type: String, required: true, unique: true, index: true },
  rfqId: String,
  negotiationId: String,
  seller: { type: PartySchema, required: true },
  buyer: { type: PartySchema, required: true },
  product: {
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  },
  pricing: { type: QuotePricingSchema, required: true },
  delivery: { type: QuoteDeliverySchema, required: true },
  validity: { type: QuoteValiditySchema, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'countered'],
    default: 'draft'
  },
  createdAt: { type: Date, default: Date.now },
  tenantId: { type: String, required: true, index: true }
});

QuoteSchema.index({ tenantId: 1, status: 1 });
QuoteSchema.index({ seller: 1 });

export const Quote = mongoose.model<IQuote>('Quote', QuoteSchema);
