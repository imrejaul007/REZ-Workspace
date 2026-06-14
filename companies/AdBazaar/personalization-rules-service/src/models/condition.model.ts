import mongoose, { Document, Schema } from 'mongoose';

export interface ICondition extends Document {
  conditionId: string;
  name: string;
  description?: string;
  field: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  operator: string;
  valueSchema?: Record<string, unknown>;
  createdAt: Date;
}

const conditionDefSchema = new Schema<ICondition>({
  conditionId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  field: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
    required: true
  },
  operator: { type: String, required: true },
  valueSchema: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

conditionDefSchema.index({ conditionId: 1 });
conditionDefSchema.index({ field: 1 });

export const ConditionDefinition = mongoose.model<ICondition>('ConditionDefinition', conditionDefSchema);