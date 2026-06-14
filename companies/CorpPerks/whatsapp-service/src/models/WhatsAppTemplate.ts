import mongoose, { Document, Schema } from 'mongoose';

// Template category
export type TemplateCategory = 'leave' | 'attendance' | 'payroll' | 'general' | 'hr';

// Template status
export type TemplateStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

// Template component type
export type TemplateComponentType = 'header' | 'body' | 'footer' | 'buttons';

// WhatsApp template type
export type WhatsAppTemplateType = 'text' | 'media' | 'interactive';

export interface IWhatsAppTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  templateId: string; // Meta template ID
  name: string; // Template name (unique in Meta)
  category: TemplateCategory;
  type: WhatsAppTemplateType;
  status: TemplateStatus;
  language: string;
  components: {
    type: TemplateComponentType;
    format?: 'text' | 'image' | 'video' | 'document';
    text?: string;
    example?: {
      headerText?: string[];
      bodyText?: string[][];
    };
    buttons?: {
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }[];
  }[];
  variables: string[]; // Variable placeholders like {{1}}, {{2}}
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>(
  {
    templateId: {
      type: String,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['leave', 'attendance', 'payroll', 'general', 'hr'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'media', 'interactive'],
      default: 'text',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disabled'],
      default: 'pending',
    },
    language: {
      type: String,
      default: 'en',
    },
    components: [
      {
        type: {
          type: String,
          enum: ['header', 'body', 'footer', 'buttons'],
          required: true,
        },
        format: {
          type: String,
          enum: ['text', 'image', 'video', 'document'],
        },
        text: String,
        example: {
          headerText: [String],
          bodyText: [[String]],
        },
        buttons: [
          {
            type: String,
            text: String,
            url: String,
            phoneNumber: String,
          },
        ],
      },
    ],
    variables: [String],
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
WhatsAppTemplateSchema.index({ name: 1 });
WhatsAppTemplateSchema.index({ category: 1, status: 1 });
WhatsAppTemplateSchema.index({ status: 1 });
WhatsAppTemplateSchema.index({ templateId: 1 });

export const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>('WhatsAppTemplate', WhatsAppTemplateSchema);
