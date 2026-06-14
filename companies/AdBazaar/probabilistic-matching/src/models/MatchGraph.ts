import mongoose, { Document, Schema } from 'mongoose';

// Graph node interface
export interface IGraphNode {
  nodeId: string;
  deviceId: string;
  type: 'device' | 'user' | 'household' | 'ip' | 'account';
  attributes: {
    firstSeen: Date;
    lastSeen: Date;
    matchCount: number;
    confidence: number;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
}

// Graph edge interface
export interface IGraphEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
  type: 'ip-match' | 'fingerprint-match' | 'behavioral-match' | 'temporal-match' | 'geographic-match';
  probability: number;
  confidence: number;
  features: Record<string, unknown>;
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
}

// MatchGraph document interface
export interface IMatchGraph extends Document {
  graphId: string;
  name: string;
  nodes: IGraphNode[];
  edges: IGraphEdge[];
  rootDeviceId: string;
  depth: number;
  density: number;
  connectedComponents: number;
  isComplete: boolean;
  metadata: {
    createdBy: string;
    algorithm: string;
    threshold: number;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

// MatchGraph schema
const MatchGraphSchema = new Schema<IMatchGraph>(
  {
    graphId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    nodes: [{
      nodeId: { type: String, required: true },
      deviceId: { type: String, required: true },
      type: {
        type: String,
        enum: ['device', 'user', 'household', 'ip', 'account'],
        required: true
      },
      attributes: {
        firstSeen: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now },
        matchCount: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 }
      },
      metadata: { type: Schema.Types.Mixed, default: {} }
    }],
    edges: [{
      edgeId: { type: String, required: true },
      sourceNodeId: { type: String, required: true },
      targetNodeId: { type: String, required: true },
      weight: { type: Number, default: 0.5 },
      type: {
        type: String,
        enum: ['ip-match', 'fingerprint-match', 'behavioral-match', 'temporal-match', 'geographic-match'],
        required: true
      },
      probability: { type: Number, default: 0.5 },
      confidence: { type: Number, default: 0 },
      features: { type: Schema.Types.Mixed, default: {} },
      firstSeen: { type: Date, default: Date.now },
      lastSeen: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    }],
    rootDeviceId: {
      type: String,
      required: true,
      index: true
    },
    depth: {
      type: Number,
      default: 0
    },
    density: {
      type: Number,
      default: 0
    },
    connectedComponents: {
      type: Number,
      default: 1
    },
    isComplete: {
      type: Boolean,
      default: false
    },
    metadata: {
      createdBy: { type: String, default: 'system' },
      algorithm: { type: String, default: 'probabilistic' },
      threshold: { type: Number, default: 0.6 }
    }
  },
  {
    timestamps: true,
    collection: 'match_graphs'
  }
);

// Indexes
MatchGraphSchema.index({ graphId: 1 });
MatchGraphSchema.index({ rootDeviceId: 1 });
MatchGraphSchema.index({ 'nodes.deviceId': 1 });
MatchGraphSchema.index({ 'edges.sourceNodeId': 1, 'edges.targetNodeId': 1 });
MatchGraphSchema.index({ depth: 1 });
MatchGraphSchema.index({ createdAt: -1 });

// Methods
MatchGraphSchema.methods.addNode = function(node: IGraphNode) {
  const existingNode = this.nodes.find(n => n.nodeId === node.nodeId);
  if (!existingNode) {
    this.nodes.push(node);
  }
  return this;
};

MatchGraphSchema.methods.addEdge = function(edge: IGraphEdge) {
  const existingEdge = this.edges.find(
    e => e.sourceNodeId === edge.sourceNodeId && e.targetNodeId === edge.targetNodeId
  );
  if (!existingEdge) {
    this.edges.push(edge);
  }
  return this;
};

MatchGraphSchema.methods.removeEdge = function(edgeId: string) {
  this.edges = this.edges.filter(e => e.edgeId !== edgeId);
  return this;
};

MatchGraphSchema.methods.calculateDensity = function() {
  const n = this.nodes.length;
  if (n <= 1) return 0;
  const maxEdges = n * (n - 1) / 2;
  return this.edges.length / maxEdges;
};

MatchGraphSchema.methods.findConnectedDevices = function(deviceId: string): string[] {
  const node = this.nodes.find(n => n.deviceId === deviceId);
  if (!node) return [];

  const connectedNodeIds = new Set<string>();
  const visited = new Set<string>();

  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    connectedNodeIds.add(nodeId);

    const connectedEdges = this.edges.filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    );

    connectedEdges.forEach(edge => {
      const neighborId = edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;
      traverse(neighborId);
    });
  };

  traverse(node.nodeId);
  return Array.from(connectedNodeIds);
};

// Static methods
MatchGraphSchema.statics.findByGraphId = function(graphId: string) {
  return this.findOne({ graphId });
};

MatchGraphSchema.statics.findByDeviceId = function(deviceId: string) {
  return this.findOne({ rootDeviceId: deviceId });
};

MatchGraphSchema.statics.findByNodeDeviceId = function(deviceId: string) {
  return this.findOne({ 'nodes.deviceId': deviceId });
};

MatchGraphSchema.statics.findActiveGraphs = function() {
  return this.find({ isComplete: false }).sort({ createdAt: -1 });
};

export const MatchGraph = mongoose.model<IMatchGraph>('MatchGraph', MatchGraphSchema);