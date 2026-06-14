import mongoose, { Document, Schema } from 'mongoose';

export interface ICriteria extends Document {
  criteriaId: string;
  name: string;
  description?: string;
  field: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  operators: string[];
  valueSchema?: Record<string, unknown>;
  examples?: string[];
  createdAt: Date;
}

const criteriaDefSchema = new Schema<ICriteria>({
  criteriaId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  field: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
    required: true
  },
  operators: [String],
  valueSchema: { type: Map, of: mongoose.Schema.Types.Mixed },
  examples: [String]
}, { timestamps: true });

criteriaDefSchema.index({ criteriaId: 1 });
criteriaDefSchema.index({ field: 1 });

export const CriteriaDefinition = mongoose.model<ICriteria>('CriteriaDefinition', criteriaDefSchema);