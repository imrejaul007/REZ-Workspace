import mongoose, { Document, Schema } from 'mongoose';

// Seat status enum
export enum SeatStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired'
}

// Seat role enum
export enum SeatRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

// Seat document interface
export interface ISeat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  organizationId: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  role: SeatRole;
  status: SeatStatus;
  permissions: mongoose.Types.ObjectId[];
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  lastActiveAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Seat schema
const seatSchema = new Schema<ISeat>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(SeatRole),
      default: SeatRole.MEMBER,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(SeatStatus),
      default: SeatStatus.PENDING,
      required: true,
      index: true
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission'
    }],
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Seat'
    },
    invitedAt: {
      type: Date
    },
    activatedAt: {
      type: Date
    },
    deactivatedAt: {
      type: Date
    },
    lastActiveAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common queries
seatSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
seatSchema.index({ organizationId: 1, email: 1 }, { unique: true });
seatSchema.index({ organizationId: 1, status: 1 });
seatSchema.index({ userId: 1, status: 1 });

// Virtual for full name
seatSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method to check if seat can perform action
seatSchema.methods.canPerformAction = function(action: string): boolean {
  // Owner and admin can do anything
  if (this.role === SeatRole.OWNER || this.role === SeatRole.ADMIN) {
    return true;
  }
  // Check permissions
  // This would typically check against the permission documents
  return false;
};

// Static method to find seats by organization
seatSchema.statics.findByOrganization = function(organizationId: string) {
  return this.find({ organizationId }).populate('permissions');
};

// Static method to find active seats by organization
seatSchema.statics.findActiveByOrganization = function(organizationId: string) {
  return this.find({ organizationId, status: SeatStatus.ACTIVE });
};

// Export the model
export const Seat = mongoose.model<ISeat>('Seat', seatSchema);