import mongoose, { Document, Schema } from 'mongoose';

// Types
export type KeyType = 'main_door' | 'bedroom' | 'bathroom' | 'cupboard' | 'parking' | 'mailbox' | 'society' | 'other';
export type DocumentType = 'original_title_deed' | 'sale_agreement' | 'noc' | 'society_noc' | 'tax_receipt' | 'utility_bill' | 'insurance' | 'warranty' | 'manual' | 'other';
export type ConditionType = 'excellent' | 'good' | 'fair' | 'poor';
export type FixturesType = 'complete' | 'incomplete' | 'damaged';
export type AppliancesType = 'working' | 'not_tested' | 'damaged';
export type ChecklistCategory = 'interior' | 'exterior' | 'utilities' | 'documents' | 'keys' | 'other';
export type DisputeStatus = 'open' | 'resolved' | 'escalated';
export type HandoverStatus = 'scheduled' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';

// Interfaces
export interface IKey {
  type: KeyType;
  quantity: number;
  handedOver: boolean;
  notes?: string;
}

export interface IDocument {
  type: DocumentType;
  handedOver: boolean;
  verified: boolean;
  notes?: string;
}

export interface IConditionReport {
  interior: ConditionType;
  exterior: ConditionType;
  fixtures: FixturesType;
  appliances: AppliancesType;
  keysWorking: boolean;
  electricityConnected: boolean;
  waterConnected: boolean;
  gasConnected?: boolean;
  notes?: string;
}

export interface IMeterReading {
  reading: number;
  unit: string;
  photo?: string;
}

export interface IMeterReadings {
  electricity: IMeterReading;
  water: IMeterReading;
  gas?: IMeterReading;
}

export interface IChecklistItem {
  item: string;
  category: ChecklistCategory;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface IBuyerAcceptance {
  accepted: boolean;
  acceptedAt?: Date;
  acceptedBy: string;
  signature?: string;
  conditionAccepted: boolean;
  notes?: string;
}

export interface IDispute {
  item: string;
  description: string;
  raisedBy: string;
  raisedAt: Date;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
}

export interface IFeedback {
  rating: number;
  comments?: string;
  sellerFeedback?: string;
  buyerFeedback?: string;
}

export interface IHandover extends Document {
  handoverId: string;

  // References
  dealId: mongoose.Types.ObjectId;
  agreementId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  buyerId: string;
  sellerId: string;
  brokerId?: mongoose.Types.ObjectId;

  // Property Details
  propertyAddress: string;
  unitNumber?: string;
  floor?: string;
  tower?: string;

  // Scheduled Handover
  scheduledDate?: Date;
  scheduledTime?: string;
  scheduledBy?: string;

  // Actual Handover
  actualDate?: Date;
  actualTime?: string;

  // Check-in
  buyerArrivedAt?: Date;
  buyerArrived: boolean;
  buyerRepresentative?: string;

  // Keys
  keys: IKey[];
  keysHandedAt?: Date;

  // Documents
  documents: IDocument[];
  documentsHandedAt?: Date;

  // Condition Report
  conditionReport?: IConditionReport;

  // Meter Readings
  meterReadings?: IMeterReadings;

  // Checklist
  checklist: IChecklistItem[];

  // Buyer Acceptance
  buyerAcceptance?: IBuyerAcceptance;

  // Disputes
  disputes: IDispute[];

  // Status
  status: HandoverStatus;

  // Photos & Documents
  photos: string[];
  handoverDocumentUrl?: string;

  // Feedback
  feedback?: IFeedback;

  // Notes
  notes?: string;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Timeline events
  timeline: Array<{
    event: string;
    description: string;
    timestamp: Date;
    userId: string;
    metadata?: Record<string, unknown>;
  }>;
}

// Key Subdocument Schema
const KeySchema = new Schema<IKey>(
  {
    type: {
      type: String,
      enum: ['main_door', 'bedroom', 'bathroom', 'cupboard', 'parking', 'mailbox', 'society', 'other'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    handedOver: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

// Document Subdocument Schema
const DocumentSchema = new Schema<IDocument>(
  {
    type: {
      type: String,
      enum: ['original_title_deed', 'sale_agreement', 'noc', 'society_noc', 'tax_receipt', 'utility_bill', 'insurance', 'warranty', 'manual', 'other'],
      required: true,
    },
    handedOver: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

// Condition Report Schema
const ConditionReportSchema = new Schema<IConditionReport>(
  {
    interior: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], required: true },
    exterior: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], required: true },
    fixtures: { type: String, enum: ['complete', 'incomplete', 'damaged'], required: true },
    appliances: { type: String, enum: ['working', 'not_tested', 'damaged'], required: true },
    keysWorking: { type: Boolean, required: true },
    electricityConnected: { type: Boolean, required: true },
    waterConnected: { type: Boolean, required: true },
    gasConnected: { type: Boolean },
    notes: { type: String },
  },
  { _id: false }
);

// Meter Reading Schema
const MeterReadingSchema = new Schema<IMeterReading>(
  {
    reading: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kWh' },
    photo: { type: String },
  },
  { _id: false }
);

// Meter Readings Schema
const MeterReadingsSchema = new Schema<IMeterReadings>(
  {
    electricity: { type: MeterReadingSchema, required: true },
    water: { type: MeterReadingSchema, required: true },
    gas: { type: MeterReadingSchema },
  },
  { _id: false }
);

// Checklist Item Schema
const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    item: { type: String, required: true },
    category: {
      type: String,
      enum: ['interior', 'exterior', 'utilities', 'documents', 'keys', 'other'],
      required: true,
    },
    required: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    verifiedBy: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

// Buyer Acceptance Schema
const BuyerAcceptanceSchema = new Schema<IBuyerAcceptance>(
  {
    accepted: { type: Boolean, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: String, required: true },
    signature: { type: String },
    conditionAccepted: { type: Boolean, required: true },
    notes: { type: String },
  },
  { _id: false }
);

// Dispute Schema
const DisputeSchema = new Schema<IDispute>(
  {
    item: { type: String, required: true },
    description: { type: String, required: true },
    raisedBy: { type: String, required: true },
    raisedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'resolved', 'escalated'], default: 'open' },
    resolution: { type: String },
    resolvedAt: { type: Date },
  },
  { _id: true }
);

// Feedback Schema
const FeedbackSchema = new Schema<IFeedback>(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
    sellerFeedback: { type: String },
    buyerFeedback: { type: String },
  },
  { _id: false }
);

// Timeline Event Schema
const TimelineEventSchema = new Schema(
  {
    event: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

// Main Handover Schema
const HandoverSchema = new Schema<IHandover>(
  {
    handoverId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
    agreementId: { type: Schema.Types.ObjectId, ref: 'Agreement', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    brokerId: { type: Schema.Types.ObjectId, ref: 'Broker' },

    // Property Details
    propertyAddress: { type: String, required: true },
    unitNumber: { type: String },
    floor: { type: String },
    tower: { type: String },

    // Scheduled Handover
    scheduledDate: { type: Date },
    scheduledTime: { type: String },
    scheduledBy: { type: String },

    // Actual Handover
    actualDate: { type: Date },
    actualTime: { type: String },

    // Check-in
    buyerArrivedAt: { type: Date },
    buyerArrived: { type: Boolean, default: false },
    buyerRepresentative: { type: String },

    // Keys
    keys: { type: [KeySchema], default: [] },
    keysHandedAt: { type: Date },

    // Documents
    documents: { type: [DocumentSchema], default: [] },
    documentsHandedAt: { type: Date },

    // Condition Report
    conditionReport: { type: ConditionReportSchema },

    // Meter Readings
    meterReadings: { type: MeterReadingsSchema },

    // Checklist
    checklist: { type: [ChecklistItemSchema], default: [] },

    // Buyer Acceptance
    buyerAcceptance: { type: BuyerAcceptanceSchema },

    // Disputes
    disputes: { type: [DisputeSchema], default: [] },

    // Status
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'disputed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },

    // Photos & Documents
    photos: { type: [String], default: [] },
    handoverDocumentUrl: { type: String },

    // Feedback
    feedback: { type: FeedbackSchema },

    // Notes
    notes: { type: String },

    // Metadata
    createdBy: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },

    // Timeline
    timeline: { type: [TimelineEventSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate handover ID middleware
HandoverSchema.pre('save', async function (next) {
  if (this.isNew && !this.handoverId) {
    const count = await mongoose.model('Handover').countDocuments();
    this.handoverId = `HANDOVER-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
HandoverSchema.index({ 'scheduledDate': 1, 'status': 1 });
HandoverSchema.index({ 'buyerId': 1, 'status': 1 });
HandoverSchema.index({ 'sellerId': 1, 'status': 1 });
HandoverSchema.index({ createdAt: -1 });

export const Handover = mongoose.model<IHandover>('Handover', HandoverSchema);

export default Handover;