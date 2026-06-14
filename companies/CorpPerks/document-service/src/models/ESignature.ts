import mongoose, { Schema, Document, Model } from 'mongoose';
import { ESignature, Signer, SignatureStatus } from '../types';

export interface ESignatureDocument extends Omit<ESignature, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

interface IESignatureModel extends Model<ESignatureDocument> {
  findPendingForUser(userId: string): Promise<ESignatureDocument[]>;
  findByDocument(documentId: string): Promise<ESignatureDocument[]>;
  sign(
    signatureId: string,
    userId: string,
    signatureImageUrl?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ESignatureDocument | null>;
  reject(
    signatureId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ESignatureDocument | null>;
  incrementReminder(signatureId: string): Promise<ESignatureDocument | null>;
  expireOldSignatures(): Promise<number>;
}

const SignerSchema = new Schema<Signer>(
  {
    signerId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['employee', 'manager', 'hr', 'legal', 'witness'],
    },
    order: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      required: true,
      enum: Object.values(SignatureStatus),
      default: SignatureStatus.PENDING,
    },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    rejectionReason: { type: String },
    signatureImageUrl: { type: String },
  },
  { _id: false }
);

const ESignatureSchema = new Schema<ESignatureDocument, IESignatureModel>(
  {
    signatureId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    documentTitle: {
      type: String,
      required: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    signers: {
      type: [SignerSchema],
      required: true,
      validate: {
        validator: (v: Signer[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one signer is required',
      },
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SignatureStatus),
      default: SignatureStatus.PENDING,
      index: true,
    },
    currentSignerOrder: {
      type: Number,
      default: 1,
      min: 1,
    },
    signedDocumentUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReminderAt: {
      type: Date,
    },
    signedAt: {
      type: Date,
    },
    createdById: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'e_signatures',
  }
);

// Compound indexes
ESignatureSchema.index({ documentId: 1, status: 1 });
ESignatureSchema.index({ companyId: 1, status: 1 });
ESignatureSchema.index({ expiresAt: 1, status: 1 });
ESignatureSchema.index({ 'signers.userId': 1, status: 1 });

// Static method to find pending signatures for user
ESignatureSchema.statics.findPendingForUser = async function (
  userId: string
) {
  return this.find({
    'signers.userId': userId,
    status: SignatureStatus.PENDING,
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: 1 });
};

// Static method to find by document
ESignatureSchema.statics.findByDocument = async function (
  documentId: string
) {
  return this.find({ documentId }).sort({ createdAt: -1 });
};

// Static method to sign document
ESignatureSchema.statics.sign = async function (
  signatureId: string,
  userId: string,
  signatureImageUrl?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const signature = await this.findOne({ signatureId });
  if (!signature) return null;

  const signer = signature.signers.find((s: Signer) => s.userId === userId);
  if (!signer) return null;

  // Check if it's this signer's turn
  if (signer.order !== signature.currentSignerOrder) {
    throw new Error('Not this signer\'s turn');
  }

  // Check if expired
  if (signature.expiresAt < new Date()) {
    signature.status = SignatureStatus.EXPIRED;
    await signature.save();
    return signature;
  }

  // Update signer
  signer.status = SignatureStatus.SIGNED;
  signer.signedAt = new Date();
  signer.ipAddress = ipAddress;
  signer.userAgent = userAgent;
  if (signatureImageUrl) signer.signatureImageUrl = signatureImageUrl;

  // Check if all signed
  const allSigned = signature.signers.every((s: Signer) => s.status === SignatureStatus.SIGNED);
  if (allSigned) {
    signature.status = SignatureStatus.SIGNED;
    signature.signedAt = new Date();
  } else {
    signature.currentSignerOrder += 1;
  }

  await signature.save();
  return signature;
};

// Static method to reject signature
ESignatureSchema.statics.reject = async function (
  signatureId: string,
  userId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
) {
  const signature = await this.findOne({ signatureId });
  if (!signature) return null;

  const signer = signature.signers.find((s: Signer) => s.userId === userId);
  if (!signer) return null;

  signer.status = SignatureStatus.REJECTED;
  signer.rejectionReason = reason;
  signer.signedAt = new Date();
  signer.ipAddress = ipAddress;
  signer.userAgent = userAgent;

  signature.status = SignatureStatus.REJECTED;
  await signature.save();
  return signature;
};

// Static method to send reminder
ESignatureSchema.statics.incrementReminder = async function (
  signatureId: string
) {
  return this.findOneAndUpdate(
    { signatureId },
    {
      $inc: { reminderCount: 1 },
      $set: { lastReminderAt: new Date() },
    },
    { new: true }
  );
};

// Static method to expire old signatures
ESignatureSchema.statics.expireOldSignatures = async function () {
  const result = await this.updateMany(
    {
      status: SignatureStatus.PENDING,
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: SignatureStatus.EXPIRED },
    }
  );
  return result.modifiedCount;
};

export const ESignatureModel = mongoose.model<ESignatureDocument, IESignatureModel>(
  'ESignature',
  ESignatureSchema
);
