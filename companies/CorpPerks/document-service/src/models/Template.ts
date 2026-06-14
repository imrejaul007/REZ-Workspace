import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  DocumentTemplate,
  DocumentType,
  TemplateVariable,
} from '../types';

export interface TemplateDocument extends Omit<DocumentTemplate, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

interface ITemplateModel extends Model<TemplateDocument> {
  findByCompanyAndType(companyId: string, type?: DocumentType): Promise<TemplateDocument[]>;
  findWithVariables(templateId: string): Promise<TemplateDocument | null>;
  createNewVersion(
    templateId: string,
    updates: Partial<DocumentTemplate>,
    updatedById: string,
    updatedByName: string
  ): Promise<TemplateDocument>;
}

const TemplateVariableSchema = new Schema<TemplateVariable>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'date', 'boolean', 'currency', 'array'],
    },
    required: { type: Boolean, required: true },
    defaultValue: { type: Schema.Types.Mixed },
    description: { type: String },
    validation: {
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
    },
  },
  { _id: false }
);

const TemplateSchema = new Schema<TemplateDocument, ITemplateModel>(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(DocumentType),
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    variables: {
      type: [TemplateVariableSchema],
      required: true,
      validate: {
        validator: (v: TemplateVariable[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one variable is required',
      },
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    previousVersionId: {
      type: String,
    },
    createdById: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    updatedById: {
      type: String,
    },
    updatedByName: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'document_templates',
  }
);

// Compound indexes
TemplateSchema.index({ companyId: 1, type: 1 });
TemplateSchema.index({ companyId: 1, isActive: 1 });
TemplateSchema.index({ companyId: 1, category: 1, department: 1 });
TemplateSchema.index({ name: 'text', description: 'text', content: 'text' });

// Static method to find templates by company and type
TemplateSchema.statics.findByCompanyAndType = async function (
  companyId: string,
  type?: DocumentType
): Promise<TemplateDocument[]> {
  const query: Record<string, unknown> = {
    companyId,
    isActive: true,
  };
  if (type) query.type = type;

  return this.find(query).sort({ name: 1 });
};

// Static method to find template with variables
TemplateSchema.statics.findWithVariables = async function (
  templateId: string
): Promise<TemplateDocument | null> {
  return this.findOne({ templateId, isActive: true });
};

// Static method to create new version
TemplateSchema.statics.createNewVersion = async function (
  templateId: string,
  updates: Partial<DocumentTemplate>,
  updatedById: string,
  updatedByName: string
): Promise<TemplateDocument> {
  const original = await this.findOne({ templateId });
  if (!original) {
    throw new Error('Template not found');
  }

  // Deactivate old version
  original.isActive = false;
  original.updatedById = updatedById;
  original.updatedByName = updatedByName;
  await original.save();

  // Create new version
  const newVersion = new this({
    ...original.toObject(),
    _id: undefined,
    templateId: `${original.templateId}-v${original.version + 1}`,
    previousVersionId: original.templateId,
    version: original.version + 1,
    ...updates,
    isActive: true,
    createdById: updatedById,
    createdByName: updatedByName,
    updatedById: undefined,
    updatedByName: undefined,
  });

  return newVersion.save();
};

export const Template = mongoose.model<TemplateDocument, ITemplateModel>(
  'Template',
  TemplateSchema
);
