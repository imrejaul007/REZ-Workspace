import mongoose, { Document, Schema } from 'mongoose';

// Guest interface
export interface IGuest extends Document {
  guestId: string;
  weddingId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  rsvp: 'pending' | 'confirmed' | 'declined' | 'tentative';
  plusOne: boolean;
  plusOneName?: string;
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    halal: boolean;
    kosher: boolean;
    nutAllergy: boolean;
    dairyFree: boolean;
    other?: string;
  };
  tableNumber?: number;
  seatNumber?: string;
  category?: 'family' | 'friend' | 'colleague' | 'vendor' | 'neighbor' | 'other';
  relationship?: string;
  giftRegistered?: boolean;
  mealPreference?: 'buffet' | 'plated' | 'family_style';
  specialRequests?: string;
  attendingCeremony: boolean;
  attendingReception: boolean;
  sendingGift: boolean;
  giftAmount?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  invitationSent: boolean;
  invitationSentAt?: Date;
  reminderSent: boolean;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Guest schema
const GuestSchema = new Schema<IGuest>(
  {
    guestId: {
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
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true
    },
    phone: {
      type: String
    },
    rsvp: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'tentative'],
      default: 'pending',
      index: true
    },
    plusOne: {
      type: Boolean,
      default: false
    },
    plusOneName: {
      type: String
    },
    dietary: {
      vegetarian: { type: Boolean, default: false },
      vegan: { type: Boolean, default: false },
      glutenFree: { type: Boolean, default: false },
      halal: { type: Boolean, default: false },
      kosher: { type: Boolean, default: false },
      nutAllergy: { type: Boolean, default: false },
      dairyFree: { type: Boolean, default: false },
      other: { type: String }
    },
    tableNumber: {
      type: Number
    },
    seatNumber: {
      type: String
    },
    category: {
      type: String,
      enum: ['family', 'friend', 'colleague', 'vendor', 'neighbor', 'other'],
      default: 'other'
    },
    relationship: {
      type: String
    },
    giftRegistered: {
      type: Boolean,
      default: false
    },
    mealPreference: {
      type: String,
      enum: ['buffet', 'plated', 'family_style']
    },
    specialRequests: {
      type: String
    },
    attendingCeremony: {
      type: Boolean,
      default: true
    },
    attendingReception: {
      type: Boolean,
      default: true
    },
    sendingGift: {
      type: Boolean,
      default: false
    },
    giftAmount: {
      type: Number
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String }
    },
    invitationSent: {
      type: Boolean,
      default: false
    },
    invitationSentAt: {
      type: Date
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'guests'
  }
);

// Indexes
GuestSchema.index({ weddingId: 1, rsvp: 1 });
GuestSchema.index({ weddingId: 1, category: 1 });
GuestSchema.index({ email: 1 }, { sparse: true });
GuestSchema.index({ phone: 1 });
GuestSchema.index({ weddingId: 1, tableNumber: 1 });

// Virtual for full name
GuestSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Export model
export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);