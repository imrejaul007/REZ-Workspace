import mongoose, { Document, Schema } from 'mongoose';

export interface ILayout extends Document {
  name: string;
  description?: string;
  organizationId: string;
  columns: number;
  rowHeight: number;
  gap: number;
  breakpoints: {
    lg?: { columns: number };
    md?: { columns: number };
    sm?: { columns: number };
  };
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    primaryColor?: string;
    borderRadius?: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LayoutSchema = new Schema<ILayout>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    organizationId: { type: String, required: true, index: true },
    columns: { type: Number, default: 12, min: 1, max: 24 },
    rowHeight: { type: Number, default: 100, min: 50 },
    gap: { type: Number, default: 10, min: 0 },
    breakpoints: {
      lg: {
        columns: { type: Number, default: 12 }
      },
      md: {
        columns: { type: Number, default: 8 }
      },
      sm: {
        columns: { type: Number, default: 4 }
      }
    },
    theme: {
      backgroundColor: { type: String },
      textColor: { type: String },
      primaryColor: { type: String },
      borderRadius: { type: Number }
    },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

LayoutSchema.index({ organizationId: 1, isDefault: 1 });

export const Layout = mongoose.model<ILayout>('Layout', LayoutSchema);