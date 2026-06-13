import mongoose, { Schema, Document } from 'mongoose';
import { CustomerTwinDocument, LoyaltyTier, ChurnRisk } from '../schemas/customer-twin.schema';

export interface ICustomerTwinModel extends Omit<CustomerTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

const CustomerTwinSchema = new Schema<ICustomerTwinModel>({
  twinId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, unique: true, index: true },
  profile: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    firstVisit: { type: String }
  },
  preferences: {
    dietary: {
      restrictions: [{ type: String }],
      allergies: [{ type: String }],
      preferences: [{ type: String }]
    },
    favoriteItems: [{ type: String }],
    preferredPayment: { type: String, default: 'upi' },
    preferredOrderType: { type: String, default: 'dine_in' }
  },
  visitHistory: [{
    restaurantId: { type: String, required: true },
    visitCount: { type: Number, default: 1 },
    lastVisit: { type: String },
    avgOrderValue: { type: Number, default: 0 },
    favoriteItems: [{ type: String }]
  }],
  loyalty: {
    currentTier: { type: String, enum: Object.values(LoyaltyTier), default: LoyaltyTier.BRONZE },
    pointsBalance: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    pointsValue: { type: Number, default: 0 }
  },
  sentiment: {
    lastRating: { type: Number },
    avgRating: { type: Number, default: 0 },
    feedbackCount: { type: Number, default: 0 }
  },
  lifetimeValue: {
    clv: { type: Number, default: 0 },
    churnRisk: { type: String, enum: Object.values(ChurnRisk), default: ChurnRisk.LOW }
  }
}, { timestamps: true, versionKey: false });

CustomerTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.customer.${this.customerId}`;
};

CustomerTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    customerId: obj.customerId,
    profile: obj.profile,
    preferences: obj.preferences,
    visitHistory: obj.visitHistory,
    loyalty: obj.loyalty,
    sentiment: obj.sentiment,
    lifetimeValue: obj.lifetimeValue,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

CustomerTwinSchema.statics.findByCustomerId = function(customerId: string) {
  return this.findOne({ customerId });
};

CustomerTwinSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ 'profile.phone': phone });
};

CustomerTwinSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 'profile.email': email });
};

export const CustomerTwin = mongoose.model<ICustomerTwinModel>('CustomerTwin', CustomerTwinSchema);
