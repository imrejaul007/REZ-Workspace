import mongoose, { Schema, Document } from 'mongoose';
import { StaffTwinDocument, StaffRole, StaffStatus } from '../schemas/staff-twin.schema';

export interface IStaffTwinModel extends Omit<StaffTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

const StaffTwinSchema = new Schema<IStaffTwinModel>({
  twinId: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  profile: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: Object.values(StaffRole), required: true },
    certifications: [{ type: String }],
    hireDate: { type: String, required: true }
  },
  schedule: [{
    date: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    role: { type: String, enum: Object.values(StaffRole), required: true }
  }],
  currentStatus: {
    status: { type: String, enum: Object.values(StaffStatus), default: StaffStatus.CLOCKED_OUT },
    currentStation: { type: String },
    currentTable: { type: String },
    clockInTime: { type: String }
  },
  performance: {
    avgOrderTime: { type: Number, default: 0 },
    tableTurnover: { type: Number, default: 0 },
    customerRating: { type: Number, default: 0 },
    ordersHandled: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 }
  }
}, { timestamps: true, versionKey: false });

StaffTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.staff.${this.staffId}`;
};

StaffTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    staffId: obj.staffId,
    restaurantId: obj.restaurantId,
    profile: obj.profile,
    schedule: obj.schedule,
    currentStatus: obj.currentStatus,
    performance: obj.performance,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

StaffTwinSchema.statics.findByStaffId = function(staffId: string) {
  return this.findOne({ staffId });
};

StaffTwinSchema.statics.findByRestaurantId = function(restaurantId: string) {
  return this.find({ restaurantId });
};

StaffTwinSchema.statics.findByRole = function(restaurantId: string, role: StaffRole) {
  return this.find({ restaurantId, 'profile.role': role });
};

StaffTwinSchema.statics.findClockedIn = function(restaurantId: string) {
  return this.find({ restaurantId, 'currentStatus.status': StaffStatus.CLOCKED_IN });
};

export const StaffTwin = mongoose.model<IStaffTwinModel>('StaffTwin', StaffTwinSchema);
