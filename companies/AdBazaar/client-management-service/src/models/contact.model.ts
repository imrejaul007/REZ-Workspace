import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  _id: mongoose.Types.ObjectId;
  contactId: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  metadata: {
    birthday?: Date;
    linkedin?: string;
    timezone?: string;
    preferences?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    contactId: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    role: { type: String, required: true },
    department: { type: String },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    metadata: {
      birthday: { type: Date },
      linkedin: { type: String },
      timezone: { type: String },
      preferences: { type: Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

// Indexes
ContactSchema.index({ email: 1, clientId: 1 }, { unique: true });
ContactSchema.index({ clientId: 1, isPrimary: 1 });
ContactSchema.index({ name: 'text', email: 'text' });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);