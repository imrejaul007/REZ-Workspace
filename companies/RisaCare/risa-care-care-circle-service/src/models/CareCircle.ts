import mongoose, { Document, Schema } from 'mongoose';

// Permission interface
export interface IPermission {
  viewHealthRecords: boolean;
  viewMedications: boolean;
  viewAppointments: boolean;
  receiveAlerts: boolean;
  manageAppointments: boolean;
  shareRecords: boolean;
}

// Care member interface
export interface ICareMember {
  id: string;
  profileId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'caregiver' | 'family' | 'friend' | 'medical-professional';
  permissions: IPermission;
  joinedAt: Date;
  invitedBy: string;
  status: 'active' | 'pending' | 'removed';
}

// Care circle document interface
export interface ICareCircle extends Document {
  id: string;
  patientProfileId: string;
  name: string;
  description?: string;
  members: ICareMember[];
  inviteCodes: Array<{
    id: string;
    code: string;
    role: string;
    permissions: Partial<IPermission>;
    expiresAt: Date;
    usedBy?: string;
    usedAt?: Date;
  }>;
  settings: {
    allowSharing: boolean;
    notifyOnActivity: boolean;
    emergencyAccess: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Care circle schema
const PermissionSchema = new Schema<IPermission>({
  viewHealthRecords: { type: Boolean, default: false },
  viewMedications: { type: Boolean, default: false },
  viewAppointments: { type: Boolean, default: false },
  receiveAlerts: { type: Boolean, default: false },
  manageAppointments: { type: Boolean, default: false },
  shareRecords: { type: Boolean, default: false }
}, { _id: false });

const CareMemberSchema = new Schema<ICareMember>({
  id: { type: String, required: true },
  profileId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ['owner', 'caregiver', 'family', 'friend', 'medical-professional'],
    required: true
  },
  permissions: { type: PermissionSchema, required: true },
  joinedAt: { type: Date, required: true },
  invitedBy: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'pending', 'removed'],
    default: 'active'
  }
}, { _id: false });

const CareCircleSchema = new Schema<ICareCircle>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientProfileId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    members: [CareMemberSchema],
    inviteCodes: [{
      id: { type: String, required: true },
      code: { type: String, required: true },
      role: { type: String, required: true },
      permissions: { type: PermissionSchema },
      expiresAt: { type: Date, required: true },
      usedBy: { type: String },
      usedAt: { type: Date }
    }],
    settings: {
      allowSharing: { type: Boolean, default: true },
      notifyOnActivity: { type: Boolean, default: true },
      emergencyAccess: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
CareCircleSchema.index({ patientProfileId: 1 });
CareCircleSchema.index({ 'members.profileId': 1 });
CareCircleSchema.index({ 'inviteCodes.code': 1 }, { unique: true });

export const CareCircle = mongoose.model<ICareCircle>('CareCircle', CareCircleSchema);
