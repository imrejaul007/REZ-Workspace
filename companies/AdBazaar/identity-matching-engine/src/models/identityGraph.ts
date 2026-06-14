import mongoose, { Document, Schema } from 'mongoose';

export interface IIdentityGraph extends Document {
  entityId: string;
  nodes: Array<{
    id: string;
    type: 'identifier' | 'device' | 'ip' | 'cookie' | 'user';
    value: string;
    source: string;
    confidence: number;
    firstSeen: Date;
    lastSeen: Date;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'exact' | 'probabilistic' | 'temporal';
    weight: number;
    confidence: number;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    relationshipType: 'same_person' | 'same_device' | 'same_household' | 'same_business';
    strength: number;
    lastVerified: Date;
  }>;
  updatedAt: Date;
}

const IdentityGraphSchema = new Schema<IIdentityGraph>(
  {
    entityId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nodes: [
      {
        id: String,
        type: {
          type: String,
          enum: ['identifier', 'device', 'ip', 'cookie', 'user']
        },
        value: String,
        source: String,
        confidence: { type: Number, default: 1.0 },
        firstSeen: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now }
      }
    ],
    edges: [
      {
        source: String,
        target: String,
        type: {
          type: String,
          enum: ['exact', 'probabilistic', 'temporal']
        },
        weight: { type: Number, default: 1.0 },
        confidence: { type: Number, default: 1.0 }
      }
    ],
    relationships: [
      {
        from: String,
        to: String,
        relationshipType: {
          type: String,
          enum: ['same_person', 'same_device', 'same_household', 'same_business']
        },
        strength: { type: Number, default: 1.0 },
        lastVerified: { type: Date, default: Date.now }
      }
    ],
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
IdentityGraphSchema.index({ 'nodes.type': 1 });
IdentityGraphSchema.index({ 'nodes.value': 1 });
IdentityGraphSchema.index({ 'relationships.relationshipType': 1 });

export const IdentityGraph = mongoose.model<IIdentityGraph>('IdentityGraph', IdentityGraphSchema);