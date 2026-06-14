import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  GeneratedDocument,
  DocumentStatus,
  DocumentType,
} from '../types';

export interface GeneratedDocumentDocument
  extends Omit<GeneratedDocument, '_id'>,
    Document {
  _id: mongoose.Types.ObjectId;
}

interface IGeneratedDocumentModel extends Model<GeneratedDocumentDocument> {
  findByEmployee(
    employeeId: string,
    options?: {
      status?: DocumentStatus;
      type?: DocumentType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ documents: GeneratedDocumentDocument[]; total: number }>;
  findPendingSignatures(employeeId: string): Promise<GeneratedDocumentDocument[]>;
  updateStatus(
    documentId: string,
    status: DocumentStatus,
    additionalFields?: Partial<GeneratedDocumentDocument>
  ): Promise<GeneratedDocumentDocument | null>;
  findByCompany(options?: {
    status?: DocumentStatus;
    type?: DocumentType;
    employeeId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ documents: GeneratedDocumentDocument[]; total: number }>;
}

const GeneratedDocumentSchema = new Schema<GeneratedDocumentDocument, IGeneratedDocumentModel>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    templateType: {
      type: String,
      required: true,
      enum: Object.values(DocumentType),
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.DRAFT,
      index: true,
    },
    pdfUrl: {
      type: String,
    },
    signedAt: {
      type: Date,
    },
    signedById: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    metadata: {
      department: { type: String },
      designation: { type: String },
      joiningDate: { type: String },
      salary: { type: Number },
      managerName: { type: String },
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
    collection: 'generated_documents',
  }
);

// Compound indexes
GeneratedDocumentSchema.index({ companyId: 1, status: 1 });
GeneratedDocumentSchema.index({ companyId: 1, employeeId: 1 });
GeneratedDocumentSchema.index({ templateId: 1, status: 1 });
GeneratedDocumentSchema.index({ employeeId: 1, status: 1 });
GeneratedDocumentSchema.index({ createdAt: -1, status: 1 });
GeneratedDocumentSchema.index({ title: 'text', employeeName: 'text' });

// Static method to find documents by employee
GeneratedDocumentSchema.statics.findByEmployee = async function (
  employeeId: string,
  options?: {
    status?: DocumentStatus;
    type?: DocumentType;
    page?: number;
    limit?: number;
  }
) {
  const query: Record<string, unknown> = { employeeId };
  if (options?.status) query.status = options.status;
  if (options?.type) query.templateType = options.type;

  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    this.countDocuments(query),
  ]);

  return { documents, total };
}

// Static method to find pending signatures for user
GeneratedDocumentSchema.statics.findPendingSignatures = async function (
  employeeId: string
) {
  return this.find({
    employeeId,
    status: DocumentStatus.PENDING_SIGNATURE,
  }).sort({ createdAt: -1 });
};

// Static method to update status
GeneratedDocumentSchema.statics.updateStatus = async function (
  documentId: string,
  status: DocumentStatus,
  additionalFields?: Partial<GeneratedDocumentDocument>
) {
  return this.findOneAndUpdate(
    { documentId },
    {
      status,
      ...additionalFields,
    },
    { new: true }
  );
};

// Static method to get documents by company
GeneratedDocumentSchema.statics.findByCompany = async function (
  options?: {
    status?: DocumentStatus;
    type?: DocumentType;
    employeeId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  const filter: Record<string, unknown> = {};

  if (options?.status) filter.status = options.status;
  if (options?.type) filter.templateType = options.type;
  if (options?.employeeId) filter.employeeId = options.employeeId;

  if (options?.fromDate || options?.toDate) {
    filter.createdAt = {};
    if (options.fromDate) (filter.createdAt as Record<string, Date>).$gte = options.fromDate;
    if (options.toDate) (filter.createdAt as Record<string, Date>).$lte = options.toDate;
  }

  if (options?.search) {
    filter.$text = { $search: options.search };
  }

  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

  const [documents, total] = await Promise.all([
    this.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
    this.countDocuments(filter),
  ]);

  return { documents, total };
}

export const GeneratedDocumentModel = mongoose.model<GeneratedDocumentDocument, IGeneratedDocumentModel>(
  'GeneratedDocument',
  GeneratedDocumentSchema
);
