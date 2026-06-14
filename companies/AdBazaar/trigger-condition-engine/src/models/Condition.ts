import mongoose, { Document, Schema } from 'mongoose';

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'in'
  | 'not_in'
  | 'between'
  | 'exists'
  | 'not_exists';

export interface ICondition extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  description?: string;
  field: string;
  operator: Operator;
  value: unknown;
  value2?: unknown; // For 'between' operator
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConditionSchema = new Schema<ICondition>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    description: String,
    field: { type: String, required: true, maxlength: 200 },
    operator: {
      type: String,
      enum: [
        'eq',
        'neq',
        'gt',
        'gte',
        'lt',
        'lte',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'regex',
        'in',
        'not_in',
        'between',
        'exists',
        'not_exists'
      ],
      required: true
    },
    value: { type: Schema.Types.Mixed, required: true },
    value2: { type: Schema.Types.Mixed },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
      default: 'string'
    },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ConditionSchema.index({ userId: 1, isActive: 1 });

export const Condition = mongoose.model<ICondition>('Condition', ConditionSchema);