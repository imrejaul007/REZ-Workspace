import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWarranty extends Document {
  productId: Types.ObjectId;
  productName: string;
  productSku: string;
  customerId: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  warrantyPeriod: number;
  warrantyType: 'manufacturer' | 'extended' | 'limited' | 'lifetime';
  status: 'active' | 'expired' | 'void' | 'claimed';
  purchasePrice: number;
  invoiceUrl?: string;
  claims: {
    claimId: string;
    claimDate: Date;
    issue: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'resolved';
    resolution?: string;
    resolutionDate?: Date;
  }[];
  terms?: string;
  isTransferable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWarrantyClaim extends Document {
  warrantyId: Types.ObjectId;
  claimId: string;
  issue: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resolved';
  customerPhone: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WarrantySchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,
  serialNumber: String,
  purchaseDate: { type: Date, required: true },
  warrantyStartDate: { type: Date, required: true },
  warrantyEndDate: { type: Date, required: true, index: true },
  warrantyPeriod: { type: Number, required: true },
  warrantyType: { type: String, enum: ['manufacturer', 'extended', 'limited', 'lifetime'], required: true },
  status: { type: String, enum: ['active', 'expired', 'void', 'claimed'], default: 'active', index: true },
  purchasePrice: { type: Number, required: true },
  invoiceUrl: String,
  claims: [{
    claimId: String,
    claimDate: Date,
    issue: String,
    description: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
    resolution: String,
    resolutionDate: Date,
  }],
  terms: String,
  isTransferable: { type: Boolean, default: false },
}, { timestamps: true });

WarrantySchema.index({ customerId: 1, status: 1 });
WarrantySchema.index({ serialNumber: 1 }, { sparse: true });

const WarrantyClaimSchema = new Schema({
  warrantyId: { type: Schema.Types.ObjectId, ref: 'Warranty', required: true, index: true },
  claimId: { type: String, required: true, unique: true },
  issue: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected', 'resolved'], default: 'pending' },
  customerPhone: { type: String, required: true },
  resolution: String,
  resolvedAt: Date,
}, { timestamps: true });

WarrantyClaimSchema.index({ warrantyId: 1, status: 1 });

export const Warranty = mongoose.models.Warranty || mongoose.model<IWarranty>('Warranty', WarrantySchema);
export const WarrantyClaim = mongoose.models.WarrantyClaim || mongoose.model<IWarrantyClaim>('WarrantyClaim', WarrantyClaimSchema);
