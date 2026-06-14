import mongoose, { Schema, Document } from 'mongoose';

export interface IHouseholdMember {
  userId: string;
  role: 'owner' | 'member' | 'guest';
  joinedAt: Date;
}

export interface IHousehold extends Document {
  householdId: string;
  name?: string;
  devices: string[];
  members: IHouseholdMember[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdMemberSchema = new Schema<IHouseholdMember>(
  {
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member', 'guest'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const HouseholdSchema = new Schema<IHousehold>(
  {
    householdId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
    },
    devices: {
      type: [String],
      default: [],
      index: true,
    },
    members: {
      type: [HouseholdMemberSchema],
      default: [],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
HouseholdSchema.index({ 'members.userId': 1 });
HouseholdSchema.index({ 'address.city': 1, 'address.state': 1 });
HouseholdSchema.index({ devices: 1 });

export const Household = mongoose.model<IHousehold>('Household', HouseholdSchema);