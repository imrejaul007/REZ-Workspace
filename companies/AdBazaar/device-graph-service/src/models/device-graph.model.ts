import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceGraphNode {
  id: string;
  type: 'device' | 'user' | 'household';
  attributes?: Record<string, any>;
}

export interface IDeviceGraphEdge {
  source: string;
  target: string;
  type: 'links_to' | 'belongs_to' | 'shared_with';
  weight: number;
  metadata?: Record<string, any>;
}

export interface IDeviceGraph extends Document {
  userId: string;
  nodes: IDeviceGraphNode[];
  edges: IDeviceGraphEdge[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceGraphNodeSchema = new Schema<IDeviceGraphNode>(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['device', 'user', 'household'],
      required: true,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const DeviceGraphEdgeSchema = new Schema<IDeviceGraphEdge>(
  {
    source: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['links_to', 'belongs_to', 'shared_with'],
      required: true,
    },
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const DeviceGraphSchema = new Schema<IDeviceGraph>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nodes: {
      type: [DeviceGraphNodeSchema],
      default: [],
    },
    edges: {
      type: [DeviceGraphEdgeSchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient graph queries
DeviceGraphSchema.index({ userId: 1, lastUpdated: -1 });

export const DeviceGraph = mongoose.model<IDeviceGraph>('DeviceGraph', DeviceGraphSchema);