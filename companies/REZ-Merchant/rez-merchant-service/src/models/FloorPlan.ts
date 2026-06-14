import mongoose, { Schema, Types } from 'mongoose';

// Table shape types for floor plan visualization
export type TableShape = 'rectangle' | 'circle' | 'square' | 'oval' | 'custom';

export interface ITablePosition {
  x: number;
  y: number;
}

export interface ITableDimensions {
  width: number;
  height: number;
  rotation?: number;
}

export interface IFloorPlanTable {
  tableId: Types.ObjectId;
  name: string;
  label?: string;
  shape: TableShape;
  position: ITablePosition;
  dimensions: ITableDimensions;
  capacity: {
    min: number;
    max: number;
  };
  status: 'available' | 'occupied' | 'reserved' | 'blocked';
  section?: string;
  metadata?: Record<string, unknown>;
}

export interface IFloorPlanSection {
  sectionId: string;
  name: string;
  color?: string;
  tables: string[]; // table IDs in this section
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IFloorPlanDimensions {
  width: number;
  height: number;
  unit: 'px' | 'cm' | 'inch';
  scale?: number;
}

export interface IFloorPlan extends Document {
  merchantId: Types.ObjectId;
  storeId: Types.ObjectId;
  name: string;
  tables: IFloorPlanTable[];
  sections: IFloorPlanSection[];
  dimensions: IFloorPlanDimensions;
  status: 'active' | 'inactive' | 'archived';
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const s = new Schema<IFloorPlan>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true },
    tables: [{
      tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
      name: { type: String, required: true },
      label: String,
      shape: {
        type: String,
        enum: ['rectangle', 'circle', 'square', 'oval', 'custom'],
        default: 'rectangle'
      },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
      dimensions: {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        rotation: Number,
      },
      capacity: {
        min: { type: Number, default: 1 },
        max: { type: Number, required: true },
      },
      status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'blocked'],
        default: 'available'
      },
      section: String,
      metadata: { type: Schema.Types.Mixed },
    }],
    sections: [{
      sectionId: { type: String, required: true },
      name: { type: String, required: true },
      color: String,
      tables: [String],
      bounds: {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
      },
    }],
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      unit: { type: String, enum: ['px', 'cm', 'inch'], default: 'px' },
      scale: Number,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1 });
export const FloorPlan = mongoose.models.FloorPlan || mongoose.model<IFloorPlan>('FloorPlan', s, 'floorplans');
