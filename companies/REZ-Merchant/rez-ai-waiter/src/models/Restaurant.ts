import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number;
  dietary?: string[];
  imageUrl?: string;
  isVeg?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  allergens?: string[];
}

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: string[];
}

export interface IOrder extends Document {
  restaurantId: Types.ObjectId;
  customerPhone: string;
  customerName?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  deliveryAddress?: {
    address: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  notes?: string;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  whatsappNotificationSent: boolean;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet';
  source: 'whatsapp' | 'app' | 'pos' | 'call';
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurant extends Document {
  name: string;
  ownerId: Types.ObjectId;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  menu: IMenuItem[];
  tables: number;
  openHours: {
    open: string;
    close: string;
  };
  isActive: boolean;
  cuisine: string[];
  deliveryAvailable: boolean;
  takeawayAvailable: boolean;
  avgPreparationTime: number;
  rating?: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer extends Document {
  phone: string;
  name?: string;
  email?: string;
  addresses: {
    label: string;
    address: string;
    city: string;
    pincode: string;
    landmark?: string;
    isDefault: boolean;
  }[];
  preferences: {
    dietary: string[];
    favoriteItems: Types.ObjectId[];
    spiceLevel: 'mild' | 'medium' | 'hot';
  };
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  notes: String,
  customizations: [String],
}, { _id: false });

const OrderSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  customerPhone: { type: String, required: true, index: true },
  customerName: String,
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    default: 'dine-in'
  },
  tableNumber: String,
  deliveryAddress: {
    address: String,
    city: String,
    pincode: String,
    landmark: String,
  },
  notes: String,
  estimatedReadyTime: Date,
  actualReadyTime: Date,
  whatsappNotificationSent: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet']
  },
  source: {
    type: String,
    enum: ['whatsapp', 'app', 'pos', 'call'],
    default: 'whatsapp'
  },
}, { timestamps: true });

OrderSchema.index({ customerPhone: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, status: 1 });

const MenuItemSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  available: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 15 },
  dietary: [String],
  imageUrl: String,
  isVeg: { type: Boolean, default: true },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot']
  },
  allergens: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

MenuItemSchema.index({ restaurantId: 1, category: 1 });
MenuItemSchema.index({ restaurantId: 1, available: 1 });

const RestaurantSchema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
  },
  menu: [MenuItemSchema],
  tables: { type: Number, default: 10 },
  openHours: {
    open: { type: String, default: '10:00' },
    close: { type: String, default: '22:00' },
  },
  isActive: { type: Boolean, default: true },
  cuisine: [String],
  deliveryAvailable: { type: Boolean, default: true },
  takeawayAvailable: { type: Boolean, default: true },
  avgPreparationTime: { type: Number, default: 30 },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
}, { timestamps: true });

const CustomerSchema = new Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: String,
  email: String,
  addresses: [{
    label: String,
    address: String,
    city: String,
    pincode: String,
    landmark: String,
    isDefault: { type: Boolean, default: false },
  }],
  preferences: {
    dietary: [String],
    favoriteItems: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot'],
      default: 'medium'
    },
  },
  orderCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: Date,
}, { timestamps: true });

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
export const Restaurant = mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
