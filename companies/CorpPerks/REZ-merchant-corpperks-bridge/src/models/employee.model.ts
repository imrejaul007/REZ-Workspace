import mongoose, { Document, Schema } from 'mongoose';
import { Employee, EmployeeStatus, HrisProvider } from '../types';

export interface IEmployee extends Omit<Employee, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const employeeSchema = new Schema<IEmployee>(
  {
    corpPerksId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantEmployeeId: {
      type: String,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    employeeCode: {
      type: String,
      sparse: true,
      index: true,
    },
    dateOfJoining: {
      type: Date,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
      index: true,
    },
    hrisProvider: {
      type: String,
      enum: ['bamboohr', 'greythr', 'zoho_people', 'manual'],
      required: true,
      index: true,
    },
    hrisEmployeeId: {
      type: String,
      sparse: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    syncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
employeeSchema.index({ hrisProvider: 1, status: 1 });
employeeSchema.index({ hrisProvider: 1, hrisEmployeeId: 1 }, { unique: true, sparse: true });
employeeSchema.index({ merchantEmployeeId: 1, hrisProvider: 1 });

// Static method to find or create employee
employeeSchema.statics.findOrCreate = async function (employeeData: Partial<Employee>) {
  let employee = await this.findOne({ corpPerksId: employeeData.corpPerksId });

  if (!employee) {
    employee = await this.create(employeeData);
  } else {
    Object.assign(employee, employeeData);
    await employee.save();
  }

  return employee;
};

// Static method to bulk upsert employees
employeeSchema.statics.bulkUpsert = async function (
  employees: Array<Partial<Employee>>
): Promise<{ upserted: number; modified: number }> {
  const bulkOps = employees.map((emp) => ({
    updateOne: {
      filter: { corpPerksId: emp.corpPerksId },
      update: { $set: emp },
      upsert: true,
    },
  }));

  const result = await this.bulkWrite(bulkOps, { ordered: false });

  return {
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
};

export const EmployeeModel = mongoose.model<IEmployee>('Employee', employeeSchema);
export default EmployeeModel;
