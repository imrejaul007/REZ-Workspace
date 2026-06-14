import mongoose, { Document, Schema } from 'mongoose';

// Resource types that can have permissions
export enum PermissionResource {
  DASHBOARD = 'dashboard',
  CAMPAIGNS = 'campaigns',
  ANALYTICS = 'analytics',
  AUDIENCES = 'audiences',
  CREATIVES = 'creatives',
  CAMPAIGN_BUILDER = 'campaign_builder',
  REPORTS = 'reports',
  ASSETS = 'assets',
  TEAMS = 'teams',
  BILLING = 'billing',
  SETTINGS = 'settings',
  INTEGRATIONS = 'integrations',
  API = 'api',
  DOOH = 'dooh',
  SSP = 'ssp',
  DSP = 'dsp'
}

// Action types
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  SHARE = 'share',
  APPROVE = 'approve',
  MANAGE = 'manage'
}

// Permission constraints interface
export interface IPermissionConstraints {
  ownOnly?: boolean;
  teamOnly?: boolean;
  organizationWide?: boolean;
  maxRecords?: number;
  allowedCountries?: string[];
  deniedCountries?: string[];
  allowedCampaignTypes?: string[];
  maxBudget?: number;
  timeRestrictions?: {
    startHour?: number;
    endHour?: number;
    daysOfWeek?: number[];
  };
}

// Permission document interface
export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId;
  seatId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  resource: PermissionResource;
  actions: PermissionAction[];
  constraints: IPermissionConstraints;
  grantedBy: mongoose.Types.ObjectId;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission schema
const permissionSchema = new Schema<IPermission>(
  {
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    resource: {
      type: String,
      enum: Object.values(PermissionResource),
      required: true
    },
    actions: [{
      type: String,
      enum: Object.values(PermissionAction),
      required: true
    }],
    constraints: {
      ownOnly: {
        type: Boolean,
        default: false
      },
      teamOnly: {
        type: Boolean,
        default: false
      },
      organizationWide: {
        type: Boolean,
        default: true
      },
      maxRecords: {
        type: Number
      },
      allowedCountries: [{
        type: String
      }],
      deniedCountries: [{
        type: String
      }],
      allowedCampaignTypes: [{
        type: String
      }],
      maxBudget: {
        type: Number
      },
      timeRestrictions: {
        startHour: {
          type: Number,
          min: 0,
          max: 23
        },
        endHour: {
          type: Number,
          min: 0,
          max: 23
        },
        daysOfWeek: [{
          type: Number,
          min: 0,
          max: 6
        }]
      }
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
permissionSchema.index({ seatId: 1, resource: 1 }, { unique: true });
permissionSchema.index({ organizationId: 1, resource: 1 });
permissionSchema.index({ seatId: 1, isActive: 1 });

// Instance method to check if permission is valid
permissionSchema.methods.isValid = function(): boolean {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Instance method to check if action is allowed
permissionSchema.methods.hasAction = function(action: PermissionAction): boolean {
  return this.isValid() && this.actions.includes(action);
};

// Static method to find permissions for a seat
permissionSchema.statics.findBySeat = function(seatId: string) {
  return this.find({ seatId, isActive: true });
};

// Static method to find permissions for a seat and resource
permissionSchema.statics.findBySeatAndResource = function(seatId: string, resource: string) {
  return this.findOne({ seatId, resource, isActive: true });
};

// Static method to check if seat has permission
permissionSchema.statics.seatHasPermission = async function(
  seatId: string,
  resource: string,
  action: PermissionAction
): Promise<boolean> {
  const permission = await this.findOne({ seatId, resource, isActive: true });
  if (!permission) return false;
  return permission.hasAction(action);
};

// Export the model
export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);