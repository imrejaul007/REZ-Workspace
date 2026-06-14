import { v4 as uuidv4 } from 'uuid';
import { MatchGraph, IMatchGraph, IGraphNode, IGraphEdge } from '../models';
import { logger } from '../utils/logger';
import { graphOperationsTotal, graphNodesGauge, graphEdgesGauge } from '../utils/metrics';

// Graph creation input
export interface GraphInput {
  rootDeviceId: string;
  name?: string;
  nodes?: IGraphNode[];
  edges?: IGraphEdge[];
  metadata?: Record<string, unknown>;
}

// Graph result
export interface GraphResult {
  graphId: string;
  name: string;
  rootDeviceId: string;
  nodeCount: number;
  edgeCount: number;
  depth: number;
  density: number;
  processingTimeMs: number;
}

// Node input
export interface NodeInput {
  deviceId: string;
  type: 'device' | 'user' | 'household' | 'ip' | 'account';
  attributes?: Partial<IGraphNode['attributes']>;
  metadata?: Record<string, unknown>;
}

// Edge input
export interface EdgeInput {
  sourceDeviceId: string;
  targetDeviceId: string;
  type: 'ip-match' | 'fingerprint-match' | 'behavioral-match' | 'temporal-match' | 'geographic-match';
  weight?: number;
  probability?: number;
  confidence?: number;
  features?: Record<string, unknown>;
}

// Connected devices result
export interface ConnectedDevicesResult {
  graphId: string;
  rootDeviceId: string;
  connectedDeviceIds: string[];
  depth: number;
  nodeCount: number;
  edgeCount: number;
}

export class GraphService {
  // Create a new match graph
  async createGraph(input: GraphInput): Promise<GraphResult> {
    const startTime = Date.now();

    try {
      const graphId = `graph_${uuidv4()}`;
      const name = input.name || `Graph for ${input.rootDeviceId}`;

      // Create root node
      const rootNode: IGraphNode = {
        nodeId: `node_${uuidv4()}`,
        deviceId: input.rootDeviceId,
        type: 'device',
        attributes: {
          firstSeen: new Date(),
          lastSeen: new Date(),
          matchCount: 0,
          confidence: 100
        },
        metadata: input.metadata || {}
      };

      // Add additional nodes
      const nodes = input.nodes || [rootNode];

      // Add edges if provided
      const edges = input.edges || [];

      const graph = new MatchGraph({
        graphId,
        name,
        nodes,
        edges,
        rootDeviceId: input.rootDeviceId,
        depth: 0,
        density: 0,
        connectedComponents: 1,
        isComplete: false,
        metadata: {
          createdBy: 'graph-service',
          algorithm: 'probabilistic',
          threshold: 0.6,
          ...input.metadata
        }
      });

      // Calculate initial density
      graph.density = graph.calculateDensity();

      await graph.save();

      // Update metrics
      graphOperationsTotal.inc({ operation: 'create', status: 'success' });
      graphNodesGauge.inc(nodes.length);
      graphEdgesGauge.inc(edges.length);

      const processingTimeMs = Date.now() - startTime;

      logger.info('Match graph created', {
        graphId,
        rootDeviceId: input.rootDeviceId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        processingTimeMs
      });

      return {
        graphId,
        name,
        rootDeviceId: input.rootDeviceId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        depth: graph.depth,
        density: graph.density,
        processingTimeMs
      };
    } catch (error) {
      graphOperationsTotal.inc({ operation: 'create', status: 'error' });
      logger.error('Graph creation failed', { error, input });
      throw error;
    }
  }

  // Get graph by ID
  async getGraph(graphId: string): Promise<IMatchGraph | null> {
    return MatchGraph.findByGraphId(graphId);
  }

  // Get graph by device ID
  async getGraphByDeviceId(deviceId: string): Promise<IMatchGraph | null> {
    return MatchGraph.findByNodeDeviceId(deviceId);
  }

  // Add node to existing graph
  async addNode(graphId: string, nodeInput: NodeInput): Promise<IMatchGraph | null> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return null;

    const node: IGraphNode = {
      nodeId: `node_${uuidv4()}`,
      deviceId: nodeInput.deviceId,
      type: nodeInput.type,
      attributes: {
        firstSeen: nodeInput.attributes?.firstSeen || new Date(),
        lastSeen: nodeInput.attributes?.lastSeen || new Date(),
        matchCount: nodeInput.attributes?.matchCount || 0,
        confidence: nodeInput.attributes?.confidence || 0
      },
      metadata: nodeInput.metadata || {}
    };

    graph.addNode(node);
    graph.density = graph.calculateDensity();

    await graph.save();

    graphNodesGauge.inc();
    graphOperationsTotal.inc({ operation: 'add_node', status: 'success' });

    return graph;
  }

  // Add edge to existing graph
  async addEdge(graphId: string, edgeInput: EdgeInput): Promise<IMatchGraph | null> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return null;

    // Find source and target nodes
    const sourceNode = graph.nodes.find(n => n.deviceId === edgeInput.sourceDeviceId);
    const targetNode = graph.nodes.find(n => n.deviceId === edgeInput.targetDeviceId);

    if (!sourceNode || !targetNode) {
      logger.warn('Could not find nodes for edge', { graphId, edgeInput });
      return null;
    }

    const edge: IGraphEdge = {
      edgeId: `edge_${uuidv4()}`,
      sourceNodeId: sourceNode.nodeId,
      targetNodeId: targetNode.nodeId,
      weight: edgeInput.weight || 0.5,
      type: edgeInput.type,
      probability: edgeInput.probability || 0.5,
      confidence: edgeInput.confidence || 0,
      features: edgeInput.features || {},
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true
    };

    graph.addEdge(edge);
    graph.density = graph.calculateDensity();

    // Update depth
    graph.depth = this.calculateGraphDepth(graph);

    await graph.save();

    graphEdgesGauge.inc();
    graphOperationsTotal.inc({ operation: 'add_edge', status: 'success' });

    return graph;
  }

  // Remove edge from graph
  async removeEdge(graphId: string, edgeId: string): Promise<IMatchGraph | null> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return null;

    graph.removeEdge(edgeId);
    graph.density = graph.calculateDensity();

    await graph.save();

    graphEdgesGauge.dec();
    graphOperationsTotal.inc({ operation: 'remove_edge', status: 'success' });

    return graph;
  }

  // Calculate graph depth using BFS
  private calculateGraphDepth(graph: IMatchGraph): number {
    if (graph.nodes.length === 0) return 0;

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; depth: number }> = [];

    const rootNode = graph.nodes.find(n => n.deviceId === graph.rootDeviceId);
    if (!rootNode) return 0;

    queue.push({ nodeId: rootNode.nodeId, depth: 0 });
    visited.add(rootNode.nodeId);

    let maxDepth = 0;

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);

      const connectedEdges = graph.edges.filter(
        e => (e.sourceNodeId === nodeId || e.targetNodeId === nodeId) && e.isActive
      );

      for (const edge of connectedEdges) {
        const neighborId = edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, depth: depth + 1 });
        }
      }
    }

    return maxDepth;
  }

  // Get connected devices
  async getConnectedDevices(deviceId: string): Promise<ConnectedDevicesResult | null> {
    const graph = await MatchGraph.findByNodeDeviceId(deviceId);
    if (!graph) return null;

    const connectedDeviceIds = graph.findConnectedDevices(deviceId);

    return {
      graphId: graph.graphId,
      rootDeviceId: deviceId,
      connectedDeviceIds,
      depth: graph.depth,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length
    };
  }

  // Update node attributes
  async updateNodeAttributes(
    graphId: string,
    deviceId: string,
    attributes: Partial<IGraphNode['attributes']>
  ): Promise<IMatchGraph | null> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return null;

    const node = graph.nodes.find(n => n.deviceId === deviceId);
    if (!node) return null;

    // Update attributes
    node.attributes = {
      ...node.attributes,
      ...attributes,
      lastSeen: new Date()
    };

    await graph.save();

    graphOperationsTotal.inc({ operation: 'update_node', status: 'success' });

    return graph;
  }

  // Mark graph as complete
  async markGraphComplete(graphId: string): Promise<IMatchGraph | null> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return null;

    graph.isComplete = true;
    await graph.save();

    graphOperationsTotal.inc({ operation: 'complete', status: 'success' });

    return graph;
  }

  // Delete graph
  async deleteGraph(graphId: string): Promise<boolean> {
    const graph = await MatchGraph.findByGraphId(graphId);
    if (!graph) return false;

    // Update gauges before deletion
    graphNodesGauge.dec(graph.nodes.length);
    graphEdgesGauge.dec(graph.edges.length);

    await MatchGraph.deleteOne({ graphId });

    graphOperationsTotal.inc({ operation: 'delete', status: 'success' });

    logger.info('Graph deleted', { graphId });

    return true;
  }

  // Get all active graphs
  async getActiveGraphs(): Promise<IMatchGraph[]> {
    return MatchGraph.findActiveGraphs();
  }

  // Get graph statistics
  async getGraphStats(): Promise<{
    totalGraphs: number;
    activeGraphs: number;
    totalNodes: number;
    totalEdges: number;
    avgDepth: number;
    avgDensity: number;
  }> {
    const stats = await MatchGraph.aggregate([
      {
        $project: {
          nodeCount: { $size: '$nodes' },
          edgeCount: { $size: '$edges' },
          isComplete: 1,
          depth: 1,
          density: 1
        }
      },
      {
        $group: {
          _id: null,
          totalGraphs: { $sum: 1 },
          activeGraphs: { $sum: { $cond: ['$isComplete', 0, 1] } },
          totalNodes: { $sum: '$nodeCount' },
          totalEdges: { $sum: '$edgeCount' },
          avgDepth: { $avg: '$depth' },
          avgDensity: { $avg: '$density' }
        }
      }
    ]);

    return {
      totalGraphs: stats[0]?.totalGraphs || 0,
      activeGraphs: stats[0]?.activeGraphs || 0,
      totalNodes: stats[0]?.totalNodes || 0,
      totalEdges: stats[0]?.totalEdges || 0,
      avgDepth: Math.round((stats[0]?.avgDepth || 0) * 100) / 100,
      avgDensity: Math.round((stats[0]?.avgDensity || 0) * 100) / 100
    };
  }

  // Merge two graphs
  async mergeGraphs(sourceGraphId: string, targetGraphId: string): Promise<IMatchGraph | null> {
    const sourceGraph = await MatchGraph.findByGraphId(sourceGraphId);
    const targetGraph = await MatchGraph.findByGraphId(targetGraphId);

    if (!sourceGraph || !targetGraph) return null;

    // Merge nodes (avoiding duplicates)
    const existingDeviceIds = new Set(targetGraph.nodes.map(n => n.deviceId));
    for (const node of sourceGraph.nodes) {
      if (!existingDeviceIds.has(node.deviceId)) {
        targetGraph.nodes.push(node);
      }
    }

    // Merge edges (avoiding duplicates)
    const existingEdgeKeys = new Set(
      targetGraph.edges.map(e => `${e.sourceNodeId}-${e.targetNodeId}`)
    );
    for (const edge of sourceGraph.edges) {
      const edgeKey = `${edge.sourceNodeId}-${edge.targetNodeId}`;
      if (!existingEdgeKeys.has(edgeKey)) {
        targetGraph.edges.push(edge);
      }
    }

    // Update metrics
    targetGraph.density = targetGraph.calculateDensity();
    targetGraph.depth = this.calculateGraphDepth(targetGraph);

    await targetGraph.save();

    // Delete source graph
    await this.deleteGraph(sourceGraphId);

    graphOperationsTotal.inc({ operation: 'merge', status: 'success' });

    return targetGraph;
  }
}

// Export singleton instance
export const graphService = new GraphService();