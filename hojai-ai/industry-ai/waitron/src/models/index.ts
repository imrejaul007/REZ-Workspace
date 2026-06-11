import mongoose, { Schema, Document } from 'mongoose';

// Menu Item Schema
export interface IMenuItem extends Document {
  name: string;
  category: string;
  price: number;
  description: string;
  prepTime: number;
  isVeg: boolean;
  isAvailable: boolean;
  tags: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  prepTime: { type: Number, default: 15 }, // minutes
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  tags: [{ type: String }],
  imageUrl: { type: String }
}, { timestamps: true });

MenuItemSchema.index({ name: 'text', description: 'text' });

// Order Schema
export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  specialRequest?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  tableNumber: number;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  priority: 'normal' | 'high' | 'rush';
  specialRequests?: string;
  customerId?: mongoose.Types.ObjectId;
  waiterId?: string;
  kitchenStartTime?: Date;
  kitchenEndTime?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  specialRequest: { type: String }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  tableNumber: { type: Number, required: true, index: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: { type: String, enum: ['normal', 'high', 'rush'], default: 'normal' },
  specialRequests: { type: String },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  waiterId: { type: String },
  kitchenStartTime: { type: Date },
  kitchenEndTime: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

// Reservation Schema
export interface IReservation extends Document {
  reservationNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  dateTime: Date;
  guests: number;
  tablePreference?: string;
  occasion?: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  guestCount: number;
  assignedTable?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  reservationNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  email: { type: String },
  dateTime: { type: Date, required: true, index: true },
  guests: { type: Number, required: true, min: 1 },
  tablePreference: { type: String },
  occasion: { type: String },
  status: {
    type: String,
    enum: ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'confirmed',
    index: true
  },
  notes: { type: String },
  guestCount: { type: Number, default: 0 },
  assignedTable: { type: Number }
}, { timestamps: true });

// Table Schema
export interface ITable extends Document {
  number: number;
  capacity: number;
  section: string;
  isOccupied: boolean;
  currentOrderId?: mongoose.Types.ObjectId;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>({
  number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  section: { type: String, default: 'main' },
  isOccupied: { type: Boolean, default: false },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied', 'maintenance'],
    default: 'available'
  },
  position: { type: String, default: 'indoor' }
}, { timestamps: true });

// Customer Schema for restaurant
export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  loyaltyPoints: number;
  preferences: string[];
  dietaryRestrictions: string[];
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  email: { type: String },
  totalVisits: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  preferences: [{ type: String }],
  dietaryRestrictions: [{ type: String }],
  lastVisit: { type: Date }
}, { timestamps: true });

// Catering Event Schema
export interface ICateringEvent extends Document {
  eventNumber: string;
  eventType: string;
  guestCount: number;
  dateTime: Date;
  menu: string[];
  dietaryRestrictions: string[];
  status: 'inquiry' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
  quote?: {
    subtotal: number;
    serviceCharge: number;
    tax: number;
    total: number;
  };
  customerName: string;
  phone: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CateringEventSchema = new Schema<ICateringEvent>({
  eventNumber: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  guestCount: { type: Number, required: true },
  dateTime: { type: Date, required: true },
  menu: [{ type: String }],
  dietaryRestrictions: [{ type: String }],
  status: {
    type: String,
    enum: ['inquiry', 'quoted', 'confirmed', 'completed', 'cancelled'],
    default: 'inquiry'
  },
  quote: {
    subtotal: Number,
    serviceCharge: Number,
    tax: Number,
    total: Number
  },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

// Export models
export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export const Reservation = mongoose.model<IReservation>('ReservationSchema', ReservationSchema);
export const Table = mongoose.model<ITable>('Table', TableSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const CateringEvent = mongoose.model<ICateringEvent>('CateringEvent', CateringEventSchema);