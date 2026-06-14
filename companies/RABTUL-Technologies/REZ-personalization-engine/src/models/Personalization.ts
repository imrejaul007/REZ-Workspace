import mongoose, { Document, Schema } from 'mongoose';

// Content type
export type ContentType = 'email' | 'linkedin' | 'sequence' | 'social' | 'ad';

// Personalization variable type
export interface IPersonalizationVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array';
  source: 'contact' | 'company' | 'deal' | 'custom' | 'ai';
  defaultValue?: string;
  description?: string;
}

// Content template
export interface IContentTemplate {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  name: string;
  description?: string;
  contentType: ContentType;

  // Template content with placeholders
  subject?: string; // For emails
  title?: string;
  body: string;
  cta?: {
    text: string;
    url: string;
  };

  // Variables used
  variables: IPersonalizationVariable[];

  // Versioning
  version: number;
  isActive: boolean;

  // A/B Testing
  variants?: {
    name: string;
    weight: number;
    subject?: string;
    body: string;
  }[];

  // Performance
  usageCount: number;
  avgOpenRate?: number;
  avgClickRate?: number;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Personalization rule
export interface IPersonalizationRule {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  name: string;
  description?: string;
  priority: number; // Higher = more important

  // Trigger conditions
  conditions: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' |
             'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
    value: string | number | boolean | string[];
  }[];

  // Personalization actions
  actions: {
    type: 'insert_variable' | 'replace_text' | 'add_section' |
          'remove_section' | 'change_tone' | 'add_cta' | 'custom';
    target?: string; // Variable name or section name
    value: string;
    conditions?: {
      field: string;
      operator: string;
      value: string | number | boolean;
    }[];
  }[];

  // Template to apply
  templateId?: mongoose.Types.ObjectId;

  // Meta
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Personalization context (cached data for processing)
export interface IPersonalizationContext {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  entityType: 'contact' | 'company' | 'deal';
  entityId: string;

  // Contact data
  contact?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    title?: string;
    companyName?: string;
    industry?: string;
    linkedInUrl?: string;
    phone?: string;
    location?: string;
    timezone?: string;
  };

  // Company data
  company?: {
    name?: string;
    industry?: string;
    size?: string;
    revenue?: number;
    founded?: number;
    website?: string;
    description?: string;
    logo?: string;
  };

  // Deal data
  deal?: {
    title?: string;
    value?: number;
    stage?: string;
    probability?: number;
    closeDate?: Date;
    nextStep?: string;
  };

  // Computed fields
  computedFields: Record<string, string | number | boolean>;

  // Last updated
  lastUpdatedAt: Date;
}

// Generated content
export interface IGeneratedContent {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Reference
  templateId: mongoose.Types.ObjectId;
  contactId: string;
  dealId?: string;

  // Generated content
  contentType: ContentType;
  subject?: string;
  title?: string;
  body: string;
  cta?: {
    text: string;
    url: string;
  };

  // Variables used
  variablesUsed: {
    name: string;
    value: string;
    source: string;
  }[];

  // Rules applied
  rulesApplied: mongoose.Types.ObjectId[];

  // Variant (for A/B testing)
  variantName?: string;

  // Performance tracking
  status: 'generated' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;

  // Meta
  createdAt: Date;
  createdBy: string;
}

// Mongoose Models
const ContentTemplateSchema = new Schema<IContentTemplate>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    contentType: {
      type: String,
      enum: ['email', 'linkedin', 'sequence', 'social', 'ad'],
      required: true
    },
    subject: { type: String },
    title: { type: String },
    body: { type: String, required: true },
    cta: {
      text: String,
      url: String
    },
    variables: [
      {
        name: String,
        type: { type: String, enum: ['text', 'number', 'date', 'boolean', 'array'] },
        source: { type: String, enum: ['contact', 'company', 'deal', 'custom', 'ai'] },
        defaultValue: String,
        description: String
      }
    ],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    variants: [
      {
        name: String,
        weight: { type: Number, default: 50 },
        subject: String,
        body: String
      }
    ],
    usageCount: { type: Number, default: 0 },
    avgOpenRate: { type: Number },
    avgClickRate: { type: Number },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

ContentTemplateSchema.index({ tenantId: 1, contentType: 1 });
ContentTemplateSchema.index({ tenantId: 1, isActive: 1 });

const PersonalizationRuleSchema = new Schema<IPersonalizationRule>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    priority: { type: Number, default: 0 },
    conditions: [
      {
        field: String,
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'not_contains',
                 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists']
        },
        value: mongoose.Schema.Types.Mixed
      }
    ],
    actions: [
      {
        type: {
          type: String,
          enum: ['insert_variable', 'replace_text', 'add_section',
                 'remove_section', 'change_tone', 'add_cta', 'custom']
        },
        target: String,
        value: String,
        conditions: [
          {
            field: String,
            operator: String,
            value: mongoose.Schema.Types.Mixed
          }
        ]
      }
    ],
    templateId: { type: Schema.Types.ObjectId, ref: 'ContentTemplate' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

PersonalizationRuleSchema.index({ tenantId: 1, priority: -1 });
PersonalizationRuleSchema.index({ tenantId: 1, isActive: 1 });

const PersonalizationContextSchema = new Schema<IPersonalizationContext>(
  {
    tenantId: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ['contact', 'company', 'deal'],
      required: true
    },
    entityId: { type: String, required: true },
    contact: {
      firstName: String,
      lastName: String,
      fullName: String,
      email: String,
      title: String,
      companyName: String,
      industry: String,
      linkedInUrl: String,
      phone: String,
      location: String,
      timezone: String
    },
    company: {
      name: String,
      industry: String,
      size: String,
      revenue: Number,
      founded: Number,
      website: String,
      description: String,
      logo: String
    },
    deal: {
      title: String,
      value: Number,
      stage: String,
      probability: Number,
      closeDate: Date,
      nextStep: String
    },
    computedFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    lastUpdatedAt: Date
  },
  { timestamps: true }
);

PersonalizationContextSchema.index({ tenantId: 1, entityType: 1, entityId: 1 }, { unique: true });

const GeneratedContentSchema = new Schema<IGeneratedContent>(
  {
    tenantId: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'ContentTemplate', required: true },
    contactId: { type: String, required: true },
    dealId: String,
    contentType: {
      type: String,
      enum: ['email', 'linkedin', 'sequence', 'social', 'ad'],
      required: true
    },
    subject: String,
    title: String,
    body: { type: String, required: true },
    cta: {
      text: String,
      url: String
    },
    variablesUsed: [
      {
        name: String,
        value: String,
        source: String
      }
    ],
    rulesApplied: [{ type: Schema.Types.ObjectId, ref: 'PersonalizationRule' }],
    variantName: String,
    status: {
      type: String,
      enum: ['generated', 'sent', 'opened', 'clicked', 'replied', 'bounced'],
      default: 'generated'
    },
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date,
    createdBy: String
  },
  { timestamps: true }
);

GeneratedContentSchema.index({ tenantId: 1, contactId: 1 });
GeneratedContentSchema.index({ tenantId: 1, templateId: 1 });
GeneratedContentSchema.index({ tenantId: 1, status: 1 });

// Export models
export const ContentTemplate = mongoose.model<IContentTemplate>('ContentTemplate', ContentTemplateSchema);
export const PersonalizationRule = mongoose.model<IPersonalizationRule>('PersonalizationRule', PersonalizationRuleSchema);
export const PersonalizationContext = mongoose.model<IPersonalizationContext>('PersonalizationContext', PersonalizationContextSchema);
export const GeneratedContent = mongoose.model<IGeneratedContent>('GeneratedContent', GeneratedContentSchema);
