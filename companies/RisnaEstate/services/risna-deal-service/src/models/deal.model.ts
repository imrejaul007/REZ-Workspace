import mongoose, { Schema, Document, Types } from 'mongoose';

// ==============================================
// ENUMS
// ==============================================

export enum DealType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  RENTAL = 'rental',
}

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  PLOT = 'plot',
  COMMERCIAL = 'commercial',
  LAND = 'land',
}

export enum DealStage {
  INQUIRY = 'inquiry',
  SITE_VISIT = 'site_visit',
  OFFER_MADE = 'offer_made',
  NEGOTIATION = 'negotiation',
  AGREEMENT = 'agreement',
  REGISTRY = 'registry',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum DealStatus {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  ON_HOLD = 'on_hold',
}

export enum DealSource {
  DIRECT = 'direct',
  REFERRAL = 'referral',
  BROKER = 'broker',
  INFLUENCER = 'influencer',
  AD = 'ad',
}

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COUNTERED = 'countered',
}

export enum PaymentMilestoneStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum OfferedBy {
  BUYER = 'buyer',
  SELLER = 'seller',
}

// ==============================================
// INTERFACES
// ==============================================

export interface IStageHistory {
  stage: DealStage;
  changedAt: Date;
  changedBy: string;
  notes?: string;
}

export interface IOffer {
  offeredBy: OfferedBy;
  price: number;
  notes?: string;
  createdAt: Date;
  status: OfferStatus;
  counteredAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export interface IPaymentMilestone {
  milestone: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: PaymentMilestoneStatus;
  transactionId?: string;
  notes?: string;
}

export interface IHandoverChecklistItem {
  item: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface IDeal extends Document {
  // IDs
  dealId: string;
  leadId: Types.ObjectId;
  propertyId: Types.ObjectId;
  brokerId: Types.ObjectId;
  buyerId: string;
  sellerId: string;

  // Deal Details
  dealType: DealType;
  propertyType: PropertyType;

  // Pricing
  askingPrice: number;
  negotiatedPrice?: number;
  finalPrice?: number;
  discount?: number;
  discountPercent?: number;

  // Pipeline Stage
  stage: DealStage;
  stageHistory: IStageHistory[];

  // Negotiations
  offers: IOffer[];

  // Agreement
  agreementId?: Types.ObjectId;
  agreementGeneratedAt?: Date;
  agreementSignedAt?: Date;

  // Payment
  bookingAmount?: number;
  bookingPaidAt?: Date;
  totalAmount?: number;
  amountPaid?: number;
  paymentMilestones: IPaymentMilestone[];

  // Handover
  handoverDate?: Date;
  handoverChecklist: IHandoverChecklistItem[];
  keysHandedOver: boolean;
  documentsHandedOver: boolean;

  // AI Scoring
  probability: number;
  aiScore?: number;
  lastAiAnalysis?: Date;

  // Analytics
  source: DealSource;
  utmCampaign?: string;
  utmMedium?: string;

  // Metadata
  status: DealStatus;
  lostReason?: string;
  wonNotes?: string;

  // Ownership
  createdBy: string;
  companyId?: string;

  // Soft Delete
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================
// SCHEMAS
// ==============================================

const StageHistorySchema = new Schema<IStageHistory>({
  stage: { type: String, enum: Object.values(DealStage), required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, required: true },
  notes: String,
}, { _id: true });

const OfferSchema = new Schema<IOffer>({
  offeredBy: { type: String, enum: Object.values(OfferedBy), required: true },
  price: { type: Number, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: Object.values(OfferStatus), default: OfferStatus.PENDING },
  counteredAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
}, { _id: true });

const PaymentMilestoneSchema = new Schema<IPaymentMilestone>({
  milestone: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAt: Date,
  status: { type: String, enum: Object.values(PaymentMilestoneStatus), default: PaymentMilestoneStatus.PENDING },
  transactionId: String,
  notes: String,
}, { _id: true });

const HandoverChecklistItemSchema = new Schema<IHandoverChecklistItem>({
  item: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  notes: String,
}, { _id: true });

const DealSchema = new Schema<IDeal>({
  // IDs
  dealId: { type: String, required: true, unique: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  brokerId: { type: Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
  buyerId: { type: String, required: true, index: true },
  sellerId: { type: String, required: true },

  // Deal Details
  dealType: { type: String, enum: Object.values(DealType), required: true },
  propertyType: { type: String, enum: Object.values(PropertyType), required: true },

  // Pricing
  askingPrice: { type: Number, required: true },
  negotiatedPrice: Number,
  finalPrice: Number,
  discount: Number,
  discountPercent: Number,

  // Pipeline Stage
  stage: { type: String, enum: Object.values(DealStage), default: DealStage.INQUIRY, index: true },
  stageHistory: [StageHistorySchema],

  // Negotiations
  offers: [OfferSchema],

  // Agreement
  agreementId: { type: Schema.Types.ObjectId, ref: 'Agreement' },
  agreementGeneratedAt: Date,
  agreementSignedAt: Date,

  // Payment
  bookingAmount: Number,
  bookingPaidAt: Date,
  totalAmount: Number,
  amountPaid: { type: Number, default: 0 },
  paymentMilestones: [PaymentMilestoneSchema],

  // Handover
  handoverDate: Date,
  handoverChecklist: [HandoverChecklistItemSchema],
  keysHandedOver: { type: Boolean, default: false },
  documentsHandedOver: { type: Boolean, default: false },

  // AI Scoring
  probability: { type: Number, default: 50, min: 0, max: 100 },
  aiScore: Number,
  lastAiAnalysis: Date,

  // Analytics
  source: { type: String, enum: Object.values(DealSource), default: DealSource.DIRECT },
  utmCampaign: String,
  utmMedium: String,

  // Metadata
  status: { type: String, enum: Object.values(DealStatus), default: DealStatus.ACTIVE, index: true },
  lostReason: String,
  wonNotes: String,

  // Ownership
  createdBy: { type: String, required: true },
  companyId: String,

  // Soft Delete
  deletedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ==============================================
// INDEXES
// ==============================================

DealSchema.index({ stage: 1, status: 1 });
DealSchema.index({ brokerId: 1, status: 1 });
DealSchema.index({ propertyId: 1, status: 1 });
DealSchema.index({ leadId: 1 });
DealSchema.index({ buyerId: 1 });
DealSchema.index({ createdAt: -1 });
DealSchema.index({ source: 1, createdAt: -1 });
DealSchema.index({ 'paymentMilestones.status': 1 });
DealSchema.index({ probability: -1 });
DealSchema.index({ aiScore: -1 });

// Compound indexes for common queries
DealSchema.index({ brokerId: 1, stage: 1 });
DealSchema.index({ status: 1, stage: 1 });
DealSchema.index({ dealType: 1, propertyType: 1 });

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);

// ==============================================
// PIPELINE STAGE ORDER
// ==============================================

export const STAGE_ORDER: DealStage[] = [
  DealStage.INQUIRY,
  DealStage.SITE_VISIT,
  DealStage.OFFER_MADE,
  DealStage.NEGOTIATION,
  DealStage.AGREEMENT,
  DealStage.REGISTRY,
  DealStage.CLOSED_WON,
];

export const STAGE_PROBABILITY_MAP: Record<DealStage, number> = {
  [DealStage.INQUIRY]: 10,
  [DealStage.SITE_VISIT]: 25,
  [DealStage.OFFER_MADE]: 40,
  [DealStage.NEGOTIATION]: 60,
  [DealStage.AGREEMENT]: 75,
  [DealStage.REGISTRY]: 90,
  [DealStage.CLOSED_WON]: 100,
  [DealStage.CLOSED_LOST]: 0,
};

// ==============================================
// DEFAULT HANDOVER CHECKLIST
// ==============================================

export const DEFAULT_HANDOVER_CHECKLIST: string[] = [
  'Keys received from seller',
  'Property inspection completed',
  'Documents verified',
  'Utilities transferred',
  'Parking spot assigned',
  'Amenities access provided',
  'Welcome kit delivered',
  'Final walkthrough done',
];
