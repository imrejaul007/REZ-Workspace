import mongoose, { Document, Schema } from 'mongoose';

/**
 * Item Category
 */
export enum ItemCategory {
  FOOD = 'FOOD',
  BEVERAGE = 'BEVERAGE',
  ALCOHOL = 'ALCOHOL',
  TOBACCO = 'TOBACCO',
  SPA_TREATMENT = 'SPA_TREATMENT',
  SPA_PRODUCT = 'SPA_PRODUCT',
  BANQUET_SERVICE = 'BANQUET_SERVICE',
  BANQUET_EQUIPMENT = 'BANQUET_EQUIPMENT',
  ROOM_SERVICE = 'ROOM_SERVICE',
  MINIBAR = 'MINIBAR',
  OTHER = 'OTHER',
}

/**
 * Tax Category for GST
 */
export enum TaxCategory {
  GST_5 = 'GST_5',
  GST_12 = 'GST_12',
  GST_18 = 'GST_18',
  GST_28 = 'GST_28',
  EXEMPT = 'EXEMPT',
  ZERO_RATED = 'ZERO_RATED',
}

/**
 * Item Status
 */
export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * Item - Menu/treatment item in an outlet
 */
export interface IItem extends Document {
  itemId: string;
  propertyId: string;
  outletType: string;
  outletId: string;
  name: string;
  description?: string;
  itemCode?: string;
  category: ItemCategory;
  subCategory?: string;
  taxCategory: TaxCategory;
  basePrice: number;
  costPrice?: number;
  currency: string;
  imageUrl?: string;
  isAvailable: boolean;
  status: ItemStatus;
  preparationTime?: number; // minutes
  portionSize?: string;
  dietaryInfo?: string[];
  allergens?: string[];
  modifiers?: IItemModifier[];
  comboItems?: IComboItem[];
  isCombo: boolean;
  taxRate: number;
  applicableTaxes: IApplicableTax[];
  isGstExempt: boolean;
  gstPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item Modifier - Customization options for items
 */
export interface IItemModifier {
  modifierId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

/**
 * Combo Item - Items included in a combo/package
 */
export interface IComboItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

/**
 * Applicable Tax
 */
export interface IApplicableTax {
  taxType: string;
  rate: number;
  amount: number;
}

const ItemModifierSchema = new Schema<IItemModifier>(
  {
    modifierId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const ComboItemSchema = new Schema<IComboItem>(
  {
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const ApplicableTaxSchema = new Schema<IApplicableTax>(
  {
    taxType: { type: String, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const ItemSchema = new Schema<IItem>(
  {
    itemId: { type: String, required: true, unique: true },
    propertyId: { type: String, required: true, index: true },
    outletType: { type: String, required: true, index: true },
    outletId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    itemCode: { type: String, index: true },
    category: {
      type: String,
      enum: Object.values(ItemCategory),
      required: true,
    },
    subCategory: { type: String },
    taxCategory: {
      type: String,
      enum: Object.values(TaxCategory),
      required: true,
    },
    basePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number },
    currency: { type: String, default: 'INR' },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ItemStatus),
      default: ItemStatus.ACTIVE,
    },
    preparationTime: { type: Number },
    portionSize: { type: String },
    dietaryInfo: [{ type: String }],
    allergens: [{ type: String }],
    modifiers: [ItemModifierSchema],
    comboItems: [ComboItemSchema],
    isCombo: { type: Boolean, default: false },
    taxRate: { type: Number, default: 18 },
    applicableTaxes: [ApplicableTaxSchema],
    isGstExempt: { type: Boolean, default: false },
    gstPercentage: { type: Number },
    cgstAmount: { type: Number },
    sgstAmount: { type: Number },
    igstAmount: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ItemSchema.index({ propertyId: 1, outletType: 1, isAvailable: 1 });
ItemSchema.index({ propertyId: 1, category: 1 });
ItemSchema.index({ itemCode: 1 });

// Pre-save hook to calculate tax
ItemSchema.pre('save', function (next) {
  if (this.isModified('basePrice') || this.isModified('taxRate')) {
    if (!this.isGstExempt) {
      const taxAmount = (this.basePrice * this.taxRate) / 100;
      this.gstPercentage = this.taxRate;
      this.cgstAmount = taxAmount / 2;
      this.sgstAmount = taxAmount / 2;
      this.igstAmount = 0; // For intra-state transactions
    }
  }
  next();
});

export const Item = mongoose.model<IItem>('Item', ItemSchema);
