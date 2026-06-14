import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  visitId: string;
  customerId: string;
  orderId?: string;
  tableNumber?: string;
  staffMemberId?: string;
  visitDate: Date;
  totalAmount: number; // in cents
  items: IVisitItem[];
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  paymentMethod: string;
  duration: number; // in minutes
  partySize: number;
  feedback?: {
    rating: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IVisitItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number; // in cents
  category?: string;
}

const VisitItemSchema = new Schema<IVisitItem>(
  {
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String },
  },
  { _id: false }
);

const VisitSchema = new Schema<IVisit>(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
    },
    tableNumber: {
      type: String,
    },
    staffMemberId: {
      type: String,
    },
    visitDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [VisitItemSchema],
      default: [],
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: 'cash',
    },
    duration: {
      type: Number,
      default: 60,
    },
    partySize: {
      type: Number,
      default: 1,
      min: 1,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics
VisitSchema.index({ customerId: 1, visitDate: -1 });
VisitSchema.index({ visitDate: -1, totalAmount: -1 });
VisitSchema.index({ 'items.itemId': 1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
