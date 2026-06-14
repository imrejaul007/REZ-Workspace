import mongoose, { Document, Schema } from 'mongoose';

// Vendor interface
export interface IVendor extends Document {
  vendorId: string;
  weddingId: string;
  category: 'venue' | 'catering' | 'photography' | 'videography' | 'florist' | 'decorator' | 'dj' | 'band' | 'makeup_artist' | 'mehndi_artist' | 'wedding_planner' | 'priest' | 'transportation' | 'cake' | 'invitation' | 'gift' | 'accommodation' | 'other';
  name: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  rating?: number;
  reviewCount?: number;
  service: string;
  description?: string;
  booked: boolean;
  bookingDate?: Date;
  price: {
    amount: number;
    currency: string;
    breakdown?: {
      basePrice: number;
      tax: number;
      tip: number;
      extra: number;
    };
  };
  status: 'inquiry' | 'quoted' | 'negotiating' | 'booked' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  contractSigned: boolean;
  contractUrl?: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentAmount?: number;
  paymentDueDate?: Date;
  notes?: string;
  reviews?: {
    rating: number;
    comment: string;
    reviewedAt: Date;
  }[];
  hashtags?: string[];
  referralSource?: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Vendor schema
const VendorSchema = new Schema<IVendor>(
  {
    vendorId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    weddingId: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'venue',
        'catering',
        'photography',
        'videography',
        'florist',
        'decorator',
        'dj',
        'band',
        'makeup_artist',
        'mehndi_artist',
        'wedding_planner',
        'priest',
        'transportation',
        'cake',
        'invitation',
        'gift',
        'accommodation',
        'other'
      ],
      index: true
    },
    name: {
      type: String,
      required: true
    },
    businessName: {
      type: String
    },
    contactName: {
      type: String
    },
    email: {
      type: String,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    website: {
      type: String
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String }
    },
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    service: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    booked: {
      type: Boolean,
      default: false
    },
    bookingDate: {
      type: Date
    },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      breakdown: {
        basePrice: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        tip: { type: Number, default: 0 },
        extra: { type: Number, default: 0 }
      }
    },
    status: {
      type: String,
      enum: ['inquiry', 'quoted', 'negotiating', 'booked', 'paid', 'confirmed', 'completed', 'cancelled'],
      default: 'inquiry',
      index: true
    },
    contractSigned: {
      type: Boolean,
      default: false
    },
    contractUrl: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentAmount: {
      type: Number
    },
    paymentDueDate: {
      type: Date
    },
    notes: {
      type: String
    },
    reviews: [
      {
        rating: { type: Number, required: true },
        comment: { type: String },
        reviewedAt: { type: Date, default: Date.now }
      }
    ],
    hashtags: [{ type: String }],
    referralSource: {
      type: String
    },
    photos: [{ type: String }]
  },
  {
    timestamps: true,
    collection: 'vendors'
  }
);

// Indexes
VendorSchema.index({ weddingId: 1, category: 1 });
VendorSchema.index({ weddingId: 1, status: 1 });
VendorSchema.index({ category: 1, rating: -1 });

// Virtual for full name with business
VendorSchema.virtual('displayName').get(function () {
  return this.businessName ? `${this.name} (${this.businessName})` : this.name;
});

// Export model
export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);