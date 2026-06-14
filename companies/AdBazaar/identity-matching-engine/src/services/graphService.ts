import { Identity } from '../models/identity.js';
import { IdentityGraph } from '../models/identityGraph.js';
import { logger } from '../utils/logger.js';

export interface GraphNode {
  id: string;
  type: 'identifier' | 'device' | 'ip' | 'cookie' | 'user';
  value: string;
  source: string;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'exact' | 'probabilistic' | 'temporal';
  weight: number;
  confidence: number;
}

export interface GraphRelationship {
  from: string;
  to: string;
  relationshipType: 'same_person' | 'same_device' | 'same_household' | 'same_business';
  strength: number;
  lastVerified: Date;
}

export interface IdentityGraphData {
  entityId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  relationships: GraphRelationship[];
}

export async function getIdentityGraph(
  entityId: string,
  depth: number = 3
): Promise<IdentityGraphData> {
  logger.info('Building identity graph', { entityId, depth });

  // Get the main identity
  const mainIdentity = await Identity.findOne({ canonicalId: entityId });

  if (!mainIdentity) {
    // Return empty graph if identity not found
    return {
      entityId,
      nodes: [],
      edges: [],
      relationships: []
    };
  }

  // Get existing graph or create new one
  let graph = await IdentityGraph.findOne({ entityId });

  if (!graph) {
    graph = await buildIdentityGraph(entityId, mainIdentity);
  }

  // Expand graph based on depth
  if (depth > 1) {
    await expandGraph(graph, depth);
  }

  return {
    entityId: graph.entityId,
    nodes: graph.nodes,
    edges: graph.edges,
    relationships: graph.relationships
  };
}

async function buildIdentityGraph(entityId: string, identity: any): Promise<any> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const relationships: GraphRelationship[] = [];

  const identifiers = identity.identifiers as Map<string, string>;

  // Create nodes for each identifier
  for (const [type, value] of Object.entries(Object.fromEntries(identifiers))) {
    if (value) {
      const nodeId = `${type}:${value}`;
      nodes.push({
        id: nodeId,
        type: getNodeType(type),
        value,
        source: identity.sources[0] || 'unknown',
        confidence: identity.confidence,
        firstSeen: identity.firstSeen,
        lastSeen: identity.lastSeen
      });
    }
  }

  // Create edges between identifiers of the same identity
  const nodeIds = nodes.map(n => n.id);
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      edges.push({
        source: nodeIds[i],
        target: nodeIds[j],
        type: 'exact',
        weight: 1.0,
        confidence: identity.confidence
      });
    }
  }

  // Create self-referential relationship
  if (nodeIds.length > 0) {
    relationships.push({
      from: nodeIds[0],
      to: nodeIds[0],
      relationshipType: 'same_person',
      strength: 1.0,
      lastVerified: new Date()
    });
  }

  const graph = new IdentityGraph({
    entityId,
    nodes,
    edges,
    relationships,
    updatedAt: new Date()
  });

  await graph.save();
  return graph;
}

async function expandGraph(graph: any, depth: number): Promise<void> {
  const visitedIds = new Set<string>(graph.nodes.map((n: any) => n.id));
  let currentLevelNodes = [...graph.nodes];

  for (let level = 1; level < depth; level++) {
    const nextLevelNodes: GraphNode[] = [];

    for (const node of currentLevelNodes) {
      // Find identities that share this identifier
      const query: Record<string, string> = {};
      query[`identifiers.${node.type}`] = node.value;

      const connectedIdentities = await Identity.find(query).limit(10);

      for (const identity of connectedIdentities) {
        if (identity.canonicalId === graph.entityId) continue;

        const identifiers = identity.identifiers as Map<string, string>;

        for (const [type, value] of Object.entries(Object.fromEntries(identifiers))) {
          if (!value) continue;

          const nodeId = `${type}:${value}`;
          if (visitedIds.has(nodeId)) continue;

          visitedIds.add(nodeId);

          const newNode: GraphNode = {
            id: nodeId,
            type: getNodeType(type),
            value,
            source: identity.sources[0] || 'unknown',
            confidence: identity.confidence,
            firstSeen: identity.firstSeen,
            lastSeen: identity.lastSeen
          };

          nextLevelNodes.push(newNode);
          graph.nodes.push(newNode);

          // Create edge
          graph.edges.push({
            source: node.id,
            target: nodeId,
            type: 'probabilistic',
            weight: 0.5,
            confidence: identity.confidence * 0.5
          });
        }
      }
    }

    currentLevelNodes = nextLevelNodes;
  }

  graph.updatedAt = new Date();
  await graph.save();
}

function getNodeType(identifierType: string): GraphNode['type'] {
  const typeMap: Record<string, GraphNode['type']> = {
    email: 'identifier',
    phone: 'identifier',
    userId: 'user',
    deviceId: 'device',
    cookieId: 'cookie',
    ipAddress: 'ip',
    browserFingerprint: 'device'
  };

  return typeMap[identifierType] || 'identifier';
}

export async function addNodeToGraph(
  entityId: string,
  node: Omit<GraphNode, 'id'>
): Promise<void> {
  const nodeId = `${node.type}:${node.value}`;

  await IdentityGraph.findOneAndUpdate(
    { entityId },
    {
      $addToSet: {
        nodes: {
          id: nodeId,
          ...node
        }
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export async function addEdgeToGraph(
  entityId: string,
  edge: Omit<GraphEdge, 'source' | 'target'>,
  sourceNodeId: string,
  targetNodeId: string
): Promise<void> {
  await IdentityGraph.findOneAndUpdate(
    { entityId },
    {
      $addToSet: {
        edges: {
          source: sourceNodeId,
          target: targetNodeId,
          ...edge
        }
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export async function addRelationshipToGraph(
  entityId: string,
  relationship: Omit<GraphRelationship, 'lastVerified'>
): Promise<void> {
  await IdentityGraph.findOneAndUpdate(
    { entityId },
    {
      $addToSet: {
        relationships: {
          ...relationship,
          lastVerified: new Date()
        }
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export async function getConnectedEntities(
  entityId: string,
  maxDepth: number = 2
): Promise<string[]> {
  const graph = await getIdentityGraph(entityId, maxDepth);
  const connectedIds = new Set<string>();

  for (const node of graph.nodes) {
    const parts = node.id.split(':');
    if (parts.length > 1) {
      // Find identities with this identifier
      const identities = await Identity.find({
        [`identifiers.${node.type}`]: node.value
      });

      for (const identity of identities) {
        if (identity.canonicalId !== entityId) {
          connectedIds.add(identity.canonicalId);
        }
      }
    }
  }

  return Array.from(connectedIds);
}

export async function findSharedConnections(
  entityId1: string,
  entityId2: string
): Promise<{ type: string; value: string }[]> {
  const identity1 = await Identity.findOne({ canonicalId: entityId1 });
  const identity2 = await Identity.findOne({ canonicalId: entityId2 });

  if (!identity1 || !identity2) return [];

  const identifiers1 = identity1.identifiers as Map<string, string>;
  const identifiers2 = identity2.identifiers as Map<string, string>;

  const shared: { type: string; value: string }[] = [];

  for (const [type, value1] of Object.entries(Object.fromEntries(identifiers1))) {
    const value2 = identifiers2.get(type);
    if (value1 && value2 && value1 === value2) {
      shared.push({ type, value: value1 });
    }
  }

  return shared;
}

export async function mergeGraphs(
  sourceEntityId: string,
  targetEntityId: string
): Promise<void> {
  const sourceGraph = await IdentityGraph.findOne({ entityId: sourceEntityId });
  const targetGraph = await IdentityGraph.findOne({ entityId: targetEntityId });

  if (!sourceGraph) return;

  if (!targetGraph) {
    // Just update the entity ID
    sourceGraph.entityId = targetEntityId;
    sourceGraph.updatedAt = new Date();
    await sourceGraph.save();
    return;
  }

  // Merge nodes
  const existingNodeIds = new Set(targetGraph.nodes.map((n: any) => n.id));
  for (const node of sourceGraph.nodes) {
    if (!existingNodeIds.has(node.id)) {
      targetGraph.nodes.push(node);
    }
  }

  // Merge edges
  const existingEdges = new Set(
    targetGraph.edges.map((e: any) => `${e.source}:${e.target}`)
  );
  for (const edge of sourceGraph.edges) {
    const edgeKey = `${edge.source}:${edge.target}`;
    if (!existingEdges.has(edgeKey)) {
      targetGraph.edges.push(edge);
    }
  }

  // Merge relationships
  const existingRelationships = new Set(
    targetGraph.relationships.map((r: any) => `${r.from}:${r.to}:${r.relationshipType}`)
  );
  for (const relationship of sourceGraph.relationships) {
    const relKey = `${relationship.from}:${relationship.to}:${relationship.relationshipType}`;
    if (!existingRelationships.has(relKey)) {
      targetGraph.relationships.push(relationship);
    }
  }

  targetGraph.updatedAt = new Date();
  await targetGraph.save();

  // Delete source graph
  await IdentityGraph.deleteOne({ entityId: sourceEntityId });
}