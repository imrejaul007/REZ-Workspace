import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
}

export interface IBrandingFonts {
  primary: string;
  secondary: string;
  code: string;
}

export interface IBranding extends Document {
  portalId: string;
  logo: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  favicon: {
    url: string;
    type: string;
  };
  colors: IBrandingColors;
  fonts: IBrandingFonts;
  customCSS?: string;
  emailTemplate?: {
    headerLogo: string;
    footerText: string;
    socialLinks: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
    };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

const BrandingColorsSchema = new Schema<IBrandingColors>(
  {
    primary: { type: String, default: '#2563eb' },
    secondary: { type: String, default: '#64748b' },
    accent: { type: String, default: '#8b5cf6' },
    background: { type: String, default: '#ffffff' },
    text: { type: String, default: '#1e293b' },
    success: { type: String, default: '#22c55e' },
    warning: { type: String, default: '#f59e0b' },
    error: { type: String, default: '#ef4444' },
  },
  { _id: false }
);

const BrandingFontsSchema = new Schema<IBrandingFonts>(
  {
    primary: { type: String, default: 'Inter, system-ui, sans-serif' },
    secondary: { type: String, default: 'Inter, system-ui, sans-serif' },
    code: { type: String, default: 'JetBrains Mono, monospace' },
  },
  { _id: false }
);

const BrandingSchema = new Schema<IBranding>(
  {
    portalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    logo: {
      url: { type: String, required: true },
      alt: { type: String, default: 'Logo' },
      width: { type: Number, default: 150 },
      height: { type: Number, default: 50 },
    },
    favicon: {
      url: { type: String, required: true },
      type: { type: String, default: 'image/png' },
    },
    colors: { type: BrandingColorsSchema, default: () => ({}) },
    fonts: { type: BrandingFontsSchema, default: () => ({}) },
    customCSS: { type: String },
    emailTemplate: {
      headerLogo: { type: String },
      footerText: { type: String },
      socialLinks: {
        twitter: { type: String },
        linkedin: { type: String },
        facebook: { type: String },
      },
    },
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: String, required: true },
      version: { type: Number, default: 1 },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
BrandingSchema.index({ portalId: 1 }, { unique: true });

// Pre-save hook to increment version
BrandingSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.metadata.version += 1;
    this.metadata.updatedAt = new Date();
  }
  next();
});

export const Branding = mongoose.model<IBranding>('Branding', BrandingSchema);
