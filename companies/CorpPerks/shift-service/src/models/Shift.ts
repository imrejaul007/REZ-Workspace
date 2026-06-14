import mongoose, { Schema } from 'mongoose';
import { IShift, ShiftStatus } from '../types';

const ShiftSchema = new Schema<IShift>(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'],
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftTemplate',
      required: [true, 'Template ID is required'],
    },
    employees: {
      type: [String],
      required: [true, 'Employees are required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one employee is required',
      },
    },
    status: {
      type: String,
      enum: Object.values(ShiftStatus),
      default: ShiftStatus.DRAFT,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Compound index for efficient date-based queries
ShiftSchema.index({ date: 1, status: 1 });
ShiftSchema.index({ date: 1, templateId: 1 });
ShiftSchema.index({ employees: 1 });

// Virtual for template details
ShiftSchema.virtual('template', {
  ref: 'ShiftTemplate',
  localField: 'templateId',
  foreignField: '_id',
  justOne: true,
});

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
