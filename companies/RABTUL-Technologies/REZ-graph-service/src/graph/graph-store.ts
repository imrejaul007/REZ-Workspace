/**
 * Graph Store - In-memory graph implementation
 */

export interface Node {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  labels: string[];
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphQuery {
  start?: string;
  match?: {
    type?: string;
    properties?: Record<string, unknown>;
  };
  where?: Record<string, unknown>;
  return?: string[];
  limit?: number;
}

export class GraphStore {
  private nodes: Map<string, Node> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private adjacency: Map<string, Map<string, Set<string>>> = new Map(); // from -> type -> to[]

  // ============ Node Operations ============

  createNode(id: string, type: string, properties?: Record<string, unknown>, labels?: string[]): Node {
    const node: Node = {
      id,
      type,
      properties: properties || {},
      labels: labels || [type],
    };
    this.nodes.set(id, node);
    return node;
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  updateNode(id: string, properties: Record<string, unknown>): Node | null {
    const node = this.nodes.get(id);
    if (!node) return null;
    node.properties = { ...node.properties, ...properties };
    return node;
  }

  deleteNode(id: string): boolean {
    // Delete all relationships first
    const relationships = this.getRelationships(id);
    for (const rel of relationships) {
      this.deleteRelationship(rel.id);
    }
    return this.nodes.delete(id);
  }

  findNodes(query: { type?: string; labels?: string[]; properties?: Record<string, unknown> }): Node[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (query.type && node.type !== query.type) return false;
      if (query.labels && !query.labels.every(l => node.labels.includes(l))) return false;
      if (query.properties) {
        for (const [key, value] of Object.entries(query.properties)) {
          if (node.properties[key] !== value) return false;
        }
      }
      return true;
    });
  }

  // ============ Relationship Operations ============

  createRelationship(
    from: string,
    to: string,
    type: string,
    properties?: Record<string, unknown>
  ): Relationship | null {
    if (!this.nodes.has(from) || !this.nodes.has(to)) return null;

    const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const relationship: Relationship = {
      id,
      from,
      to,
      type,
      properties: properties || {},
    };

    this.relationships.set(id, relationship);

    // Update adjacency
    if (!this.adjacency.has(from)) {
      this.adjacency.set(from, new Map());
    }
    if (!this.adjacency.get(from)!.has(type)) {
      this.adjacency.get(from)!.set(type, new Set());
    }
    this.adjacency.get(from)!.get(type)!.add(to);

    return relationship;
  }

  getRelationship(id: string): Relationship | undefined {
    return this.relationships.get(id);
  }

  deleteRelationship(id: string): boolean {
    const rel = this.relationships.get(id);
    if (!rel) return false;

    // Remove from adjacency
    const typeAdj = this.adjacency.get(rel.from);
    if (typeAdj) {
      const toSet = typeAdj.get(rel.type);
      if (toSet) {
        toSet.delete(rel.to);
      }
    }

    return this.relationships.delete(id);
  }

  getRelationships(nodeId: string): Relationship[] {
    const outgoing = Array.from(this.relationships.values()).filter(r => r.from === nodeId);
    const incoming = Array.from(this.relationships.values()).filter(r => r.to === nodeId);
    return [...outgoing, ...incoming];
  }

  getOutgoing(nodeId: string, type?: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(r => {
      if (r.from !== nodeId) return false;
      if (type && r.type !== type) return false;
      return true;
    });
  }

  getIncoming(nodeId: string, type?: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(r => {
      if (r.to !== nodeId) return false;
      if (type && r.type !== type) return false;
      return true;
    });
  }

  // ============ Traversal ============

  traverse(startId: string, options: {
    depth?: number;
    types?: string[];
    direction?: 'outgoing' | 'incoming' | 'both';
    limit?: number;
  }): { nodes: Node[]; relationships: Relationship[] } {
    const { depth = 3, types, direction = 'both', limit = 100 } = options;

    const visited = new Set<string>();
    const resultNodes: Node[] = [];
    const resultRelationships: Relationship[] = [];

    const queue: Array<{ id: string; currentDepth: number }> = [{ id: startId, currentDepth: 0 }];
    visited.add(startId);

    const startNode = this.nodes.get(startId);
    if (startNode) resultNodes.push(startNode);

    while (queue.length > 0 && resultNodes.length < limit) {
      const { id, currentDepth } = queue.shift()!;

      if (currentDepth >= depth) continue;

      // Get neighbors
      const neighbors: Array<{ neighborId: string; rel: Relationship }> = [];

      if (direction === 'outgoing' || direction === 'both') {
        const outgoing = this.getOutgoing(id, types ? types[0] : undefined);
        for (const rel of outgoing) {
          neighbors.push({ neighborId: rel.to, rel });
        }
      }

      if (direction === 'incoming' || direction === 'both') {
        const incoming = this.getIncoming(id, types ? types[0] : undefined);
        for (const rel of incoming) {
          neighbors.push({ neighborId: rel.from, rel });
        }
      }

      for (const { neighborId, rel } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighborNode = this.nodes.get(neighborId);
          if (neighborNode) resultNodes.push(neighborNode);
          queue.push({ id: neighborId, currentDepth: currentDepth + 1 });
        }
        if (!resultRelationships.find(r => r.id === rel.id)) {
          resultRelationships.push(rel);
        }
      }
    }

    return { nodes: resultNodes, relationships: resultRelationships };
  }

  // ============ Path Finding ============

  findPath(from: string, to: string, maxDepth: number = 5): string[] | null {
    if (from === to) return [from];

    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [{ id: from, path: [from] }];
    visited.add(from);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      const outgoing = this.getOutgoing(id);
      for (const rel of outgoing) {
        if (rel.to === to) {
          return [...path, to];
        }

        if (!visited.has(rel.to) && path.length < maxDepth) {
          visited.add(rel.to);
          queue.push({ id: rel.to, path: [...path, rel.to] });
        }
      }
    }

    return null;
  }

  // ============ Statistics ============

  getStats(): {
    totalNodes: number;
    totalRelationships: number;
    nodesByType: Record<string, number>;
    relationshipsByType: Record<string, number>;
  } {
    const nodesByType: Record<string, number> = {};
    const relationshipsByType: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    for (const rel of this.relationships.values()) {
      relationshipsByType[rel.type] = (relationshipsByType[rel.type] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalRelationships: this.relationships.size,
      nodesByType,
      relationshipsByType,
    };
  }

  clear(): void {
    this.nodes.clear();
    this.relationships.clear();
    this.adjacency.clear();
  }
}
