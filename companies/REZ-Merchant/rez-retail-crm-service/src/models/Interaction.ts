import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInteraction extends Document {
  customerId: Types.ObjectId;
  type: 'purchase' | 'complaint' | 'inquiry' | 'feedback' | 'visit' | 'call' | 'email';
  channel: 'in_store' | 'phone' | 'email' | 'whatsapp' | 'app' | 'social';
  subject: string;
  description: string;
  outcome: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  employeeId?: Types.ObjectId;
  storeId?: Types.ObjectId;
  referenceId?: Types.ObjectId;
  referenceType?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'complaint', 'inquiry', 'feedback', 'visit', 'call', 'email'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['in_store', 'phone', 'email', 'whatsapp', 'app', 'social'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    outcome: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    referenceId: Schema.Types.ObjectId,
    referenceType: String,
    attachments: {
      type: [String],
      default: [],
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
InteractionSchema.index({ customerId: 1, createdAt: -1 });
InteractionSchema.index({ type: 1, status: 1 });
InteractionSchema.index({ storeId: 1, createdAt: -1 });
InteractionSchema.index({ employeeId: 1, createdAt: -1 });
InteractionSchema.index({ status: 1, priority: 1 });

export const Interaction = mongoose.model<IInteraction>('Interaction', InteractionSchema);
export default Interaction;