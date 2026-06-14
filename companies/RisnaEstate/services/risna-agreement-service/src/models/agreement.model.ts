import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPaymentSchedule {
  milestone: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

export interface IAgreement extends Document {
  agreementId: string;

  // References
  dealId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  buyerId: string;
  sellerId: string;
  brokerId: mongoose.Types.ObjectId;

  // Agreement Type
  type: 'sale_agreement' | 'noc' | 'mou' | '租约' | 'leave_license' | '租让协议';

  // Property Details
  propertyAddress: string;
  propertyType: 'apartment' | 'villa' | 'plot' | 'commercial' | 'land';
  propertyArea: number;
  propertyAreaUnit: 'sqft' | 'sqm' | 'sqyd';

  // Price Details
  totalPrice: number;
  tokenAmount: number;
  tokenPaidAt?: Date;
  registrationAmount: number;
  registrationPaidAt?: Date;
  stampDuty: number;
  gst: number;

  // Payment Schedule
  paymentSchedule: IPaymentSchedule[];

  // Terms
  saleConsideration: number;
  parkingIncluded: boolean;
  parkingPrice: number;
  possessionDate: Date;
  agreementDate: Date;

  // Terms & Conditions
  terms: string;
  specialConditions: string;

  // Document URLs
  agreementPdfUrl?: string;
  stampDutyReceiptUrl?: string;
  registrationReceiptUrl?: string;

  // Signing
  buyerSignedAt?: Date;
  sellerSignedAt?: Date;
  witness1SignedAt?: Date;
  witness2SignedAt?: Date;

  // Signatures (Base64 for e-sign)
  buyerSignature?: string;
  sellerSignature?: string;
  witness1Signature?: string;
  witness2Signature?: string;

  // Status
  status: 'draft' | 'pending_buyer_sign' | 'pending_seller_sign' | 'pending_witness' | 'completed' | 'registered' | 'cancelled';

  // Registration
  registrationNumber?: string;
  registeredAt?: Date;
  registeredAtOffice?: string;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const PaymentScheduleSchema = new Schema<IPaymentSchedule>({
  milestone: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  notes: { type: String }
}, { _id: true });

const AgreementSchema = new Schema<IAgreement>({
  agreementId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // References
  dealId: {
    type: Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
    index: true
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  brokerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Agreement Type
  type: {
    type: String,
    enum: ['sale_agreement', 'noc', 'mou', '租约', 'leave_license', '租让协议'],
    required: true,
    index: true
  },

  // Property Details
  propertyAddress: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'villa', 'plot', 'commercial', 'land'],
    required: true
  },
  propertyArea: {
    type: Number,
    required: true
  },
  propertyAreaUnit: {
    type: String,
    enum: ['sqft', 'sqm', 'sqyd'],
    default: 'sqft'
  },

  // Price Details
  totalPrice: {
    type: Number,
    required: true
  },
  tokenAmount: {
    type: Number,
    default: 0
  },
  tokenPaidAt: {
    type: Date
  },
  registrationAmount: {
    type: Number,
    default: 0
  },
  registrationPaidAt: {
    type: Date
  },
  stampDuty: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },

  // Payment Schedule
  paymentSchedule: [PaymentScheduleSchema],

  // Terms
  saleConsideration: {
    type: Number,
    required: true
  },
  parkingIncluded: {
    type: Boolean,
    default: false
  },
  parkingPrice: {
    type: Number,
    default: 0
  },
  possessionDate: {
    type: Date,
    required: true
  },
  agreementDate: {
    type: Date,
    required: true
  },

  // Terms & Conditions
  terms: {
    type: String,
    default: ''
  },
  specialConditions: {
    type: String,
    default: ''
  },

  // Document URLs
  agreementPdfUrl: {
    type: String
  },
  stampDutyReceiptUrl: {
    type: String
  },
  registrationReceiptUrl: {
    type: String
  },

  // Signing timestamps
  buyerSignedAt: {
    type: Date
  },
  sellerSignedAt: {
    type: Date
  },
  witness1SignedAt: {
    type: Date
  },
  witness2SignedAt: {
    type: Date
  },

  // Signatures
  buyerSignature: {
    type: String
  },
  sellerSignature: {
    type: String
  },
  witness1Signature: {
    type: String
  },
  witness2Signature: {
    type: String
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_buyer_sign', 'pending_seller_sign', 'pending_witness', 'completed', 'registered', 'cancelled'],
    default: 'draft',
    index: true
  },

  // Registration
  registrationNumber: {
    type: String
  },
  registeredAt: {
    type: Date
  },
  registeredAtOffice: {
    type: String
  },

  // Metadata
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
AgreementSchema.index({ buyerId: 1, status: 1 });
AgreementSchema.index({ sellerId: 1, status: 1 });
AgreementSchema.index({ createdAt: -1 });
AgreementSchema.index({ type: 1, status: 1 });

// Soft delete query helper
AgreementSchema.methods.softDelete = function() {
  (this as any).deletedAt = new Date();
  return (this as any).save();
};

// Virtual for checking if all parties signed
AgreementSchema.virtual('allSigned').get(function() {
  return !!(this.buyerSignedAt && this.sellerSignedAt && this.witness1SignedAt && this.witness2SignedAt);
});

// Update status based on signatures
AgreementSchema.methods.updateSigningStatus = function(): void {
  if (this.buyerSignedAt && this.sellerSignedAt && this.witness1SignedAt && this.witness2SignedAt) {
    this.status = 'completed';
  } else if (!this.buyerSignedAt) {
    this.status = 'pending_buyer_sign';
  } else if (!this.sellerSignedAt) {
    this.status = 'pending_seller_sign';
  } else {
    this.status = 'pending_witness';
  }
};

// Pre-save hook for agreement ID generation
AgreementSchema.pre('save', async function(next) {
  if (this.isNew && !this.agreementId) {
    const count = await mongoose.model<IAgreement>('Agreement').countDocuments();
    this.agreementId = `AGREEMENT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Agreement: Model<IAgreement> = mongoose.model<IAgreement>('Agreement', AgreementSchema);

export default Agreement;