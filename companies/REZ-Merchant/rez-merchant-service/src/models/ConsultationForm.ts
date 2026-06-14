import mongoose, { Schema, Document } from 'mongoose';

export interface IFormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface IConsultationForm extends Document {
  merchantId: string;
  storeId?: string;
  name: string;
  description?: string;
  fields: IFormField[];
  isDefault: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationFormSchema = new Schema<IConsultationForm>(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, index: true },
    name: { type: String, required: true },
    description: { type: String },
    fields: [{
      id: { type: String, required: true },
      type: {
        type: String,
        required: true,
        enum: ['text', 'number', 'date', 'select', 'checkbox', 'textarea'],
      },
      label: { type: String, required: true },
      required: { type: Boolean, default: false },
      options: [String],
      placeholder: String,
    }],
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for merchant queries
ConsultationFormSchema.index({ merchantId: 1, storeId: 1 });

export const ConsultationForm = mongoose.model<IConsultationForm>('ConsultationForm', ConsultationFormSchema);
