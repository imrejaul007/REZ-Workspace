/**
 * REZ Commerce Graph Service
 *
 * Graph Database Layer for Commerce Relationship Intelligence
 *
 * Tracks:
 * - user ↔ merchant relationships
 * - user ↔ user (social/behavioral)
 * - user ↔ location (home, work, frequent)
 * - merchant ↔ campaign relationships
 * - merchant ↔ customer connections
 * - creator ↔ conversion attribution
 * - product ↔ user affinity
 * - transaction chains
 *
 * This becomes the COMMERCE KNOWLEDGE GRAPH
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type NodeType =
  | 'user'
  | 'merchant'
  | 'product'
  | 'location'
  | 'campaign'
  | 'ad'
  | 'creator'
  | 'store'
  | 'brand'
  | 'category'
  | 'device'
  | 'session';

export type RelationshipType =
  | 'purchased_from'      // user → merchant
  | 'reviewed'            // user → merchant/product
  | 'visited'             // user → location/merchant
  | 'referred'            // user ↔ user
  | 'follows'            // user → creator
  | 'located_at'          // user → location
  | 'belongs_to'          // product → category/brand
  | 'targeted_by'         // campaign → user/segment
  | 'viewed'              // user → product/merchant
  | 'contains'            // order → product
  | 'associated_with'     // campaign → merchant
  | 'converted_from'     // ad → purchase
  | 'influenced'         // creator → purchase
  | 'competed_with'      // merchant ↔ merchant
  | 'sibling'            // product ↔ product
  | 'similar_location'    // location ↔ location
  | 'works_at'           // user → merchant (employee)
  | 'loyalty_member'      // user → merchant
  | 'household'          // user ↔ user
  | 'device_shared'       // user ↔ user
  | 'same_ip'             // user ↔ user
  | 'same_payment'        // user ↔ user
  | 'nearby'             // user → location
  | 'frequents'          // user → location
  | 'delivered_to'       // order → location
  | 'displayed_on'       // ad → screen/location;

export interface GraphNode {
  id: string;
  type: NodeType;
  properties: Record<string, unknown>;
  labels?: string[];        // For Neo4j-style labels
  createdAt: string;
  updatedAt: string;
}

export interface GraphRelationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: RelationshipType;
  properties: {
    weight?: number;        // Relationship strength (0-1)
    count?: number;          // Interaction count
    lastInteraction?: string;
    firstInteraction?: string;
    totalValue?: number;    // Monetary value of relationship
    duration?: number;      // Days since first interaction
    [key: string];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GraphQuery {
  startNode?: {
    id?: string;
    type?: NodeType;
    property?: { key: string; value: unknown };
  };
  relationship?: {
    type?: RelationshipType;
    direction?: 'outgoing' | 'incoming' | 'unknown';
  };
  endNode?: {
    id?: string;
    type?: NodeType;
    property?: { key: string; value: unknown };
  };
  filters?: {
    property: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value;
  }[];
  pagination?: {
    limit?: number;
    offset?: number;
  };
  orderBy?: {
    property: string;
    direction: 'ASC' | 'DESC';
  };
}

export interface PathQuery {
  startNodeId: string;
  endNodeId: string;
  maxDepth?: number;
  relationshipTypes?: RelationshipType[];
  relationshipFilter?: {
    property: string;
    operator: string;
    value;
  };
}

export interface CommunityDetection {
  algorithm: 'louvain' | 'label_propagation' | 'weakly_connected';
  minCommunitySize?: number;
  includeRelationshipTypes?: RelationshipType[];
}

export interface InfluenceScore {
  nodeId: string;
  nodeType: NodeType;
  influenceScore: number;      // 0-100
  influenceRank: number;
  connections: {
    inDegree: number;
    outDegree: number;
    weightedDegree: number;
  };
  metrics: {
    reach: number;
    virality: number;
    engagement: number;
  };
}

// ============================================================================
// Graph Storage (In-Memory + Redis Ready)
// ============================================================================

class GraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private relationships: Map<string, GraphRelationship> = new Map();
  private nodeIndex: Map<NodeType, Set<string>> = new Map();
  private relationshipIndex: Map<RelationshipType, Set<string>> = new Map();
  private adjacencyList: Map<string, Map<string, Set<string>>> = new Map(); // nodeId → relType → targetIds

  constructor() {
    // Initialize indices
    Object.values(NodeType).forEach(type => this.nodeIndex.set(type, new Set()));
    Object.values(RelationshipType).forEach(type => this.relationshipIndex.set(type, new Set()));
  }

  // ============================================
  // Node Operations
  // ============================================

  async createNode(node: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphNode> {
    const now = new Date().toISOString();
    const fullNode: GraphNode = {
      ...node,
      id: node.id || randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    this.nodes.set(fullNode.id, fullNode);
    this.nodeIndex.get(fullNode.type)?.add(fullNode.id);

    return fullNode;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.nodes.get(id) || null;
  }

  async getNodesByType(type: NodeType, limit = 100): Promise<GraphNode[]> {
    const ids = this.nodeIndex.get(type) || new Set();
    return Array.from(ids).slice(0, limit).map(id => this.nodes.get(id)).filter(Boolean) as GraphNode[];
  }

  async updateNode(id: string, properties: Partial<GraphNode['properties']): Promise<GraphNode | null> {
    const node = this.nodes.get(id);
    if (!node) return null;

    const updated: GraphNode = {
      ...node,
      properties: { ...node.properties, ...properties },
      updatedAt: new Date().toISOString()
    };

    this.nodes.set(id, updated);
    return updated;
  }

  async deleteNode(id: string): Promise<boolean> {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Delete all relationships
    await this.deleteRelationshipsForNode(id);

    // Remove from index
    this.nodeIndex.get(node.type)?.delete(id);
    this.nodes.delete(id);

    return true;
  }

  // ============================================
  // Relationship Operations
  // ============================================

  async createRelationship(rel: Omit<GraphRelationship, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphRelationship> {
    const now = new Date().toISOString();
    const fullRel: GraphRelationship = {
      ...rel,
      id: rel.id || randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    this.relationships.set(fullRel.id, fullRel);
    this.relationshipIndex.get(fullRel.type)?.add(fullRel.id);

    // Update adjacency list
    if (!this.adjacencyList.has(fullRel.sourceNodeId)) {
      this.adjacencyList.set(fullRel.sourceNodeId, new Map());
    }
    if (!this.adjacencyList.get(fullRel.sourceNodeId)!.has(fullRel.type)) {
      this.adjacencyList.get(fullRel.sourceNodeId)!.set(fullRel.type, new Set());
    }
    this.adjacencyList.get(fullRel.sourceNodeId)!.get(fullRel.type)!.add(fullRel.targetNodeId);

    return fullRel;
  }

  async updateRelationship(id: string, properties: Partial<GraphRelationship['properties']): Promise<GraphRelationship | null> {
    const rel = this.relationships.get(id);
    if (!rel) return null;

    const updated: GraphRelationship = {
      ...rel,
      properties: { ...rel.properties, ...properties },
      updatedAt: new Date().toISOString()
    };

    this.relationships.set(id, updated);
    return updated;
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const rel = this.relationships.get(id);
    if (!rel) return false;

    // Remove from adjacency list
    this.adjacencyList.get(rel.sourceNodeId)?.get(rel.type)?.delete(rel.targetNodeId);

    // Remove from index
    this.relationshipIndex.get(rel.type)?.delete(id);
    this.relationships.delete(id);

    return true;
  }

  async deleteRelationshipsForNode(nodeId: string): Promise<number> {
    const toDelete: string[] = [];

    for (const [relId, rel] of this.relationships) {
      if (rel.sourceNodeId === nodeId || rel.targetNodeId === nodeId) {
        toDelete.push(relId);
      }
    }

    for (const relId of toDelete) {
      await this.deleteRelationship(relId);
    }

    // Clean adjacency list
    this.adjacencyList.delete(nodeId);

    return toDelete.length;
  }

  // ============================================
  // Query Operations
  // ============================================

  async query(query: GraphQuery): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> {
    let matchedNodes: Set<string> = new Set();
    let matchedRelationships: Set<string> = new Set();

    // Start from node query
    if (query.startNode) {
      if (query.startNode.id) {
        matchedNodes.add(query.startNode.id);
      } else if (query.startNode.type) {
        const nodes = await this.getNodesByType(query.startNode.type);
        nodes.forEach(n => matchedNodes.add(n.id));
      } else if (query.startNode.property) {
        matchedNodes = this.findNodesByProperty(query.startNode.property);
      }
    }

    // Filter by relationships
    if (query.relationship) {
      const { type, direction } = query.relationship;
      const rels: GraphRelationship[] = [];

      if (type) {
        const ids = this.relationshipIndex.get(type) || new Set();
        ids.forEach(id => rels.push(this.relationships.get(id)!));
      } else {
        for (const rel of this.relationships.values()) {
          rels.push(rel);
        }
      }

      rels.forEach(rel => {
        if (direction === 'outgoing' && matchedNodes.has(rel.sourceNodeId)) {
          matchedNodes.add(rel.targetNodeId);
          matchedRelationships.add(rel.id);
        } else if (direction === 'incoming' && matchedNodes.has(rel.targetNodeId)) {
          matchedNodes.add(rel.sourceNodeId);
          matchedRelationships.add(rel.id);
        } else if (direction === 'unknown') {
          if (matchedNodes.has(rel.sourceNodeId) || matchedNodes.has(rel.targetNodeId)) {
            matchedNodes.add(rel.sourceNodeId);
            matchedNodes.add(rel.targetNodeId);
            matchedRelationships.add(rel.id);
          }
        }
      });
    }

    // Filter end node
    if (query.endNode) {
      if (query.endNode.id) {
        matchedNodes = new Set([...matchedNodes].filter(id => id === query.endNode!.id));
      } else if (query.endNode.property) {
        matchedNodes = this.findNodesByProperty(query.endNode.property);
      }
    }

    // Apply additional filters
    if (query.filters) {
      matchedNodes = this.filterNodes(matchedNodes, query.filters);
    }

    // Apply pagination
    const limit = query.pagination?.limit || 100;
    const offset = query.pagination?.offset || 0;
    const nodeArray = Array.from(matchedNodes).slice(offset, offset + limit);

    // Build result
    const nodes = nodeArray.map(id => this.nodes.get(id)).filter(Boolean) as GraphNode[];
    const relationships = Array.from(matchedRelationships)
      .map(id => this.relationships.get(id))
      .filter(Boolean) as GraphRelationship[];

    return { nodes, relationships };
  }

  private findNodesByProperty(prop: { key: string; value: unknown }): Set<string> {
    const matched = new Set<string>();

    for (const [id, node] of this.nodes) {
      if (node.properties[prop.key] === prop.value) {
        matched.add(id);
      }
    }

    return matched;
  }

  private filterNodes(nodeIds: Set<string>, filters: GraphQuery['filters']): Set<string> {
    return new Set([...nodeIds].filter(id => {
      const node = this.nodes.get(id);
      if (!node) return false;

      return filters.every(filter => {
        const value = node.properties[filter.property];
        switch (filter.operator) {
          case 'eq': return value === filter.value;
          case 'ne': return value !== filter.value;
          case 'gt': return value > filter.value;
          case 'lt': return value < filter.value;
          case 'gte': return value >= filter.value;
          case 'lte': return value <= filter.value;
          case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
          case 'contains': return String(value).includes(String(filter.value));
          default: return true;
        }
      });
    }));
  }

  // ============================================
  // Path Finding
  // ============================================

  async findPath(query: PathQuery): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] } | null> {
    const { startNodeId, endNodeId, maxDepth = 5 } = query;

    if (startNodeId === endNodeId) {
      const node = this.nodes.get(startNodeId);
      return node ? { nodes: [node], relationships: [] } : null;
    }

    // BFS to find shortest path
    const visited = new Set<string>([startNodeId]);
    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: startNodeId, path: [] }];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === endNodeId) {
        // Reconstruct path
        const nodes: GraphNode[] = [];
        const relationships: GraphRelationship[] = [];

        for (const relId of path) {
          const rel = this.relationships.get(relId);
          if (rel) {
            relationships.push(rel);
            const sourceNode = this.nodes.get(rel.sourceNodeId);
            const targetNode = this.nodes.get(rel.targetNodeId);
            if (sourceNode && !nodes.includes(sourceNode)) nodes.push(sourceNode);
            if (targetNode && !nodes.includes(targetNode)) nodes.push(targetNode);
          }
        }

        return { nodes, relationships };
      }

      if (path.length >= maxDepth) continue;

      // Explore neighbors
      const neighbors = this.adjacencyList.get(nodeId);
      if (neighbors) {
        for (const [relType, targetIds] of neighbors) {
          for (const targetId of targetIds) {
            if (!visited.has(targetId)) {
              visited.add(targetId);
              const rels = this.findRelationships(nodeId, targetId, relType);
              for (const rel of rels) {
                queue.push({ nodeId: targetId, path: [...path, rel.id] });
              }
            }
          }
        }
      }
    }

    return null;
  }

  private findRelationships(sourceId: string, targetId: string, type?: RelationshipType): GraphRelationship[] {
    const rels: GraphRelationship[] = [];

    for (const rel of this.relationships.values()) {
      if (rel.sourceNodeId === sourceId && rel.targetNodeId === targetId) {
        if (!type || rel.type === type) {
          rels.push(rel);
        }
      }
    }

    return rels;
  }

  // ============================================
  // Graph Analytics
  // ============================================

  async getNeighbors(nodeId: string, options?: {
    relationshipTypes?: RelationshipType[];
    direction?: 'outgoing' | 'incoming' | 'unknown';
    limit?: number;
  }): Promise<{ node: GraphNode; relationship: GraphRelationship }[]> {
    const neighbors: { node: GraphNode; relationship: GraphRelationship }[] = [];

    for (const rel of this.relationships.values()) {
      if (options?.relationshipTypes && !options.relationshipTypes.includes(rel.type)) {
        continue;
      }

      let match = false;
      let neighborId: string | null = null;

      if (options?.direction !== 'incoming' && rel.sourceNodeId === nodeId) {
        match = true;
        neighborId = rel.targetNodeId;
      }

      if (options?.direction !== 'outgoing' && rel.targetNodeId === nodeId) {
        match = true;
        neighborId = rel.sourceNodeId;
      }

      if (match && neighborId) {
        const neighborNode = this.nodes.get(neighborId);
        if (neighborNode) {
          neighbors.push({ node: neighborNode, relationship: rel });
        }
      }
    }

    const limit = options?.limit || 50;
    return neighbors.slice(0, limit);
  }

  async getDegree(nodeId: string): Promise<{ inDegree: number; outDegree: number }> {
    let inDegree = 0;
    let outDegree = 0;

    for (const rel of this.relationships.values()) {
      if (rel.targetNodeId === nodeId) inDegree++;
      if (rel.sourceNodeId === nodeId) outDegree++;
    }

    return { inDegree, outDegree };
  }

  async detectCommunities(options?: CommunityDetection): Promise<Map<string, string[]>> {
    // Simplified community detection using connected components
    const communities = new Map<string, string[]>();
    const visited = new Set<string>();

    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue;

      const community: string[] = [];
      const queue = [nodeId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        community.push(current);

        const neighbors = this.adjacencyList.get(current);
        if (neighbors) {
          for (const targetIds of neighbors.values()) {
            for (const targetId of targetIds) {
              if (!visited.has(targetId)) {
                queue.push(targetId);
              }
            }
          }
        }
      }

      const minSize = options?.minCommunitySize || 2;
      if (community.length >= minSize) {
        const communityId = `community_${randomUUID()}`;
        communities.set(communityId, community);
      }
    }

    return communities;
  }

  async calculateInfluenceScores(nodeType?: NodeType): Promise<InfluenceScore[]> {
    const scores: InfluenceScore[] = [];

    const nodes = nodeType
      ? await this.getNodesByType(nodeType)
      : Array.from(this.nodes.values());

    for (const node of nodes) {
      const { inDegree, outDegree } = await this.getDegree(node.id);

      // Calculate weighted degree
      let weightedDegree = 0;
      let totalValue = 0;

      for (const rel of this.relationships.values()) {
        if (rel.sourceNodeId === node.id || rel.targetNodeId === node.id) {
          weightedDegree += rel.properties.weight || 1;
          totalValue += rel.properties.totalValue || 0;
        }
      }

      // Simple influence score: combination of degree and value
      const influenceScore = Math.min(100,
        ((inDegree + outDegree) * 5) + (weightedDegree * 10) + (Math.log10(totalValue + 1) * 5)
      );

      scores.push({
        nodeId: node.id,
        nodeType: node.type,
        influenceScore,
        influenceRank: 0, // Will be set after sorting
        connections: { inDegree, outDegree, weightedDegree },
        metrics: {
          reach: inDegree + outDegree,
          virality: outDegree / Math.max(inDegree, 1),
          engagement: weightedDegree / Math.max(inDegree + outDegree, 1)
        }
      });
    }

    // Sort by influence and assign ranks
    scores.sort((a, b) => b.influenceScore - a.influenceScore);
    scores.forEach((score, index) => {
      score.influenceRank = index + 1;
    });

    return scores;
  }

  // ============================================
  // Statistics
  // ============================================

  async getStats(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    nodesByType: Record<NodeType, number>;
    relationshipsByType: Record<RelationshipType, number>;
    avgDegree: number;
  }> {
    const nodesByType: Record<string, number> = {};
    const relationshipsByType: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    for (const rel of this.relationships.values()) {
      relationshipsByType[rel.type] = (relationshipsByType[rel.type] || 0) + 1;
    }

    let totalDegree = 0;
    for (const [, rel] of this.relationships) {
      totalDegree += 2;
    }

    return {
      nodeCount: this.nodes.size,
      relationshipCount: this.relationships.size,
      nodesByType: nodesByType as Record<NodeType, number>,
      relationshipsByType: relationshipsByType as Record<RelationshipType, number>,
      avgDegree: this.nodes.size > 0 ? totalDegree / this.nodes.size : 0
    };
  }
}

// ============================================================================
// Commerce Graph Service
// ============================================================================

export class CommerceGraphService {
  private store: GraphStore;

  constructor() {
    this.store = new GraphStore();
    this.seedSampleData();
  }

  private async seedSampleData(): Promise<void> {
    // Create sample merchants
    const merchant1 = await this.store.createNode({
      type: 'merchant',
      properties: { name: 'Pizza Palace', category: 'restaurant', rating: 4.5 }
    });

    const merchant2 = await this.store.createNode({
      type: 'merchant',
      properties: { name: 'Tech Store', category: 'electronics', rating: 4.2 }
    });

    // Create sample users
    const user1 = await this.store.createNode({
      type: 'user',
      properties: { name: 'John Doe', tier: 'gold', totalSpend: 50000 }
    });

    const user2 = await this.store.createNode({
      type: 'user',
      properties: { name: 'Jane Smith', tier: 'platinum', totalSpend: 120000 }
    });

    // Create locations
    const home = await this.store.createNode({
      type: 'location',
      properties: { type: 'home', city: 'Mumbai', lat: 19.076, lng: 72.877 }
    });

    const work = await this.store.createNode({
      type: 'location',
      properties: { type: 'work', city: 'Mumbai', lat: 19.018, lng: 72.862 }
    });

    // Create relationships
    await this.store.createRelationship({
      sourceNodeId: user1.id,
      targetNodeId: merchant1.id,
      type: 'purchased_from',
      properties: { count: 15, totalValue: 4500, lastInteraction: new Date().toISOString(), weight: 0.9 }
    });

    await this.store.createRelationship({
      sourceNodeId: user2.id,
      targetNodeId: merchant1.id,
      type: 'purchased_from',
      properties: { count: 25, totalValue: 8500, lastInteraction: new Date().toISOString(), weight: 0.95 }
    });

    await this.store.createRelationship({
      sourceNodeId: user1.id,
      targetNodeId: home.id,
      type: 'located_at',
      properties: { weight: 1.0 }
    });

    await this.store.createRelationship({
      sourceNodeId: user1.id,
      targetNodeId: work.id,
      type: 'frequents',
      properties: { count: 50, weight: 0.7 }
    });

    await this.store.createRelationship({
      sourceNodeId: user1.id,
      targetNodeId: user2.id,
      type: 'household',
      properties: { weight: 1.0 }
    });
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Add a user
   */
  async addUser(data: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    tier?: string;
    metadata?: Record<string, unknown>;
  }): Promise<GraphNode> {
    return this.store.createNode({
      type: 'user',
      id: data.id,
      properties: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        tier: data.tier || 'new',
        ...data.metadata
      }
    });
  }

  /**
   * Add a merchant
   */
  async addMerchant(data: {
    id: string;
    name: string;
    category: string;
    rating?: number;
    location?: { lat: number; lng: number };
    metadata?: Record<string, unknown>;
  }): Promise<GraphNode> {
    return this.store.createNode({
      type: 'merchant',
      id: data.id,
      properties: {
        name: data.name,
        category: data.category,
        rating: data.rating || 0,
        location: data.location,
        ...data.metadata
      }
    });
  }

  /**
   * Record a purchase relationship
   */
  async recordPurchase(data: {
    userId: string;
    merchantId: string;
    orderId: string;
    amount: number;
    items?: string[];
    location?: { lat: number; lng: number };
  }): Promise<GraphRelationship> {
    // Check for existing relationship
    const existing = await this.findRelationship(data.userId, data.merchantId, 'purchased_from');

    if (existing) {
      // Update existing relationship
      const updated = await this.store.updateRelationship(existing.id, {
        count: (existing.properties.count || 0) + 1,
        totalValue: (existing.properties.totalValue || 0) + data.amount,
        lastInteraction: new Date().toISOString(),
        weight: Math.min(1, (existing.properties.weight || 0) + 0.05)
      });
      return updated!;
    }

    // Create new relationship
    return this.store.createRelationship({
      sourceNodeId: data.userId,
      targetNodeId: data.merchantId,
      type: 'purchased_from',
      properties: {
        count: 1,
        totalValue: data.amount,
        firstInteraction: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        weight: 0.5
      }
    });
  }

  /**
   * Find relationship between two nodes
   */
  async findRelationship(sourceId: string, targetId: string, type?: RelationshipType): Promise<GraphRelationship | null> {
    for (const rel of this.store['relationships'].values()) {
      if (rel.sourceNodeId === sourceId && rel.targetNodeId === targetId) {
        if (!type || rel.type === type) {
          return rel;
        }
      }
    }
    return null;
  }

  /**
   * Get user's merchant connections
   */
  async getUserMerchants(userId: string): Promise<{ merchant: GraphNode; relationship: GraphRelationship }[]> {
    return this.store.getNeighbors(userId, {
      relationshipTypes: ['purchased_from', 'visited', 'loyalty_member'],
      direction: 'unknown'
    });
  }

  /**
   * Get merchant's customer segments
   */
  async getMerchantCustomers(merchantId: string): Promise<{ user: GraphNode; relationship: GraphRelationship }[]> {
    return this.store.getNeighbors(merchantId, {
      relationshipTypes: ['purchased_from', 'reviewed'],
      direction: 'incoming'
    });
  }

  /**
   * Link users (household, device sharing, etc.)
   */
  async linkUsers(sourceUserId: string, targetUserId: string, linkType: 'household' | 'device_shared' | 'same_ip' | 'same_payment' | 'referred'): Promise<GraphRelationship> {
    const relType: RelationshipType = linkType === 'referred' ? 'referred' :
      linkType === 'household' ? 'household' :
        linkType === 'device_shared' ? 'device_shared' :
          linkType === 'same_ip' ? 'same_ip' : 'same_payment';

    // Check for existing
    const existing = await this.findRelationship(sourceUserId, targetUserId, relType);
    if (existing) return existing;

    return this.store.createRelationship({
      sourceNodeId: sourceUserId,
      targetNodeId: targetUserId,
      type: relType,
      properties: { weight: 1.0 }
    });
  }

  /**
   * Get user's social graph (linked users)
   */
  async getUserNetwork(userId: string): Promise<GraphNode[]> {
    const neighbors = await this.store.getNeighbors(userId, {
      relationshipTypes: ['household', 'device_shared', 'same_ip', 'same_payment', 'referred', 'follows'],
      direction: 'unknown'
    });
    return neighbors.map(n => n.node);
  }

  /**
   * Find influence leaders in network
   */
  async findInfluenceLeaders(type?: NodeType, limit = 10): Promise<InfluenceScore[]> {
    const scores = await this.store.calculateInfluenceScores(type);
    return scores.slice(0, limit);
  }

  /**
   * Detect customer communities
   */
  async detectCustomerCommunities(): Promise<Map<string, string[]>> {
    return this.store.detectCommunities({
      algorithm: 'louvain',
      minCommunitySize: 2,
      includeRelationshipTypes: ['purchased_from', 'household', 'device_shared']
    });
  }

  /**
   * Find shortest path between users (for referrals, etc.)
   */
  async findPathBetweenUsers(startUserId: string, endUserId: string): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] } | null> {
    return this.store.findPath({
      startNodeId: startUserId,
      endNodeId: endUserId,
      maxDepth: 5
    });
  }

  /**
   * Get graph statistics
   */
  async getStats() {
    return this.store.getStats();
  }

  /**
   * Query the graph
   */
  async query(query: GraphQuery) {
    return this.store.query(query);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const commerceGraph = new CommerceGraphService();
export default commerceGraph;
