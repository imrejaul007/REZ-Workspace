import mongoose, { Document, Schema } from 'mongoose';

// Wedding interface
export interface IWedding extends Document {
  weddingId: string;
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  weddingEndDate?: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
  };
  budget: {
    total: number;
    spent: number;
    currency: string;
    breakdown?: {
      venue: number;
      catering: number;
      photography: number;
      decoration: number;
      entertainment: number;
      attire: number;
      flowers: number;
      transportation: number;
      gifts: number;
      other: number;
    };
  };
  guestCount: {
    expected: number;
    confirmed: number;
    declined: number;
    tentative: number;
  };
  theme?: string;
  style?: string;
  guestCategories?: string[];
  hashtags?: string[];
  instagramHandle?: string;
  estimatedAttendees?: number;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  ownerId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Wedding schema
const WeddingSchema = new Schema<IWedding>(
  {
    weddingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    coupleName: {
      type: String,
      required: true
    },
    brideName: {
      type: String,
      required: true
    },
    groomName: {
      type: String,
      required: true
    },
    weddingDate: {
      type: Date,
      required: true,
      index: true
    },
    weddingEndDate: {
      type: Date
    },
    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      latitude: { type: Number },
      longitude: { type: Number },
      capacity: { type: Number }
    },
    budget: {
      total: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      breakdown: {
        venue: { type: Number, default: 0 },
        catering: { type: Number, default: 0 },
        photography: { type: Number, default: 0 },
        decoration: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        attire: { type: Number, default: 0 },
        flowers: { type: Number, default: 0 },
        transportation: { type: Number, default: 0 },
        gifts: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      }
    },
    guestCount: {
      expected: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      declined: { type: Number, default: 0 },
      tentative: { type: Number, default: 0 }
    },
    theme: { type: String },
    style: { type: String },
    guestCategories: [{ type: String }],
    hashtags: [{ type: String }],
    instagramHandle: { type: String },
    estimatedAttendees: { type: Number },
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'planning',
      index: true
    },
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    createdBy: {
      type: String,
      required: true
    },
    updatedBy: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'weddings'
  }
);

// Indexes
WeddingSchema.index({ 'venue.city': 1, 'venue.state': 1 });
WeddingSchema.index({ weddingDate: 1, status: 1 });
WeddingSchema.index({ ownerId: 1, createdAt: -1 });
WeddingSchema.index({ hashtags: 1 });
WeddingSchema.index({ 'venue.latitude': 1, 'venue.longitude': 1 });

// Virtual for remaining budget
WeddingSchema.virtual('budgetRemaining').get(function () {
  return this.budget.total - this.budget.spent;
});

// Virtual for attendance rate
WeddingSchema.virtual('attendanceRate').get(function () {
  if (this.guestCount.expected === 0) return 0;
  return (this.guestCount.confirmed / this.guestCount.expected) * 100;
});

// Export model
export const Wedding = mongoose.model<IWedding>('Wedding', WeddingSchema);