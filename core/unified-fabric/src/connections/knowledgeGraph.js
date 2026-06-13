/**
 * KnowledgeGraphOS Connection - Graph Database for RTMN
 * Connects REZ Graph Service to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class KnowledgeGraphConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      serviceUrl: config.serviceUrl || process.env.GRAPH_SERVICE_URL || 'http://localhost:4101',
      timeout: config.timeout || 5000
    };
    this.nodes = new Map();
    this.relationships = new Map();
  }

  /**
   * Create a node in the knowledge graph
   */
  async createNode(id, type, properties = {}, labels = []) {
    const node = {
      id,
      type,
      properties,
      labels: labels.length ? labels : [type],
      createdAt: new Date().toISOString()
    };
    this.nodes.set(id, node);
    this.emit('node:created', node);
    return node;
  }

  /**
   * Get node by ID
   */
  async getNode(id) {
    return this.nodes.get(id) || null;
  }

  /**
   * Update node properties
   */
  async updateNode(id, properties) {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Node ${id} not found`);
    node.properties = { ...node.properties, ...properties };
    node.updatedAt = new Date().toISOString();
    this.emit('node:updated', node);
    return node;
  }

  /**
   * Delete node and its relationships
   */
  async deleteNode(id) {
    const deleted = this.nodes.delete(id);
    if (deleted) {
      // Delete all relationships involving this node
      for (const [relId, rel] of this.relationships) {
        if (rel.from === id || rel.to === id) {
          this.relationships.delete(relId);
        }
      }
      this.emit('node:deleted', { id });
    }
    return deleted;
  }

  /**
   * Find nodes by query
   */
  async findNodes(query) {
    const { type, labels, properties } = query;
    return Array.from(this.nodes.values()).filter(node => {
      if (type && node.type !== type) return false;
      if (labels && !labels.every(l => node.labels.includes(l))) return false;
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (node.properties[key] !== value) return false;
        }
      }
      return true;
    });
  }

  /**
   * Create relationship between nodes
   */
  async createRelationship(from, to, type, properties = {}) {
    const relationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      type,
      properties,
      createdAt: new Date().toISOString()
    };
    this.relationships.set(relationship.id, relationship);
    this.emit('relationship:created', relationship);
    return relationship;
  }

  /**
   * Get relationships for a node
   */
  async getRelationships(nodeId) {
    return Array.from(this.relationships.values()).filter(
      rel => rel.from === nodeId || rel.to === nodeId
    );
  }

  /**
   * Get relationship by ID
   */
  async getRelationship(id) {
    return this.relationships.get(id) || null;
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(id) {
    const deleted = this.relationships.delete(id);
    if (deleted) {
      this.emit('relationship:deleted', { id });
    }
    return deleted;
  }

  /**
   * Traverse graph from a starting node
   */
  async traverse(startId, options = {}) {
    const { depth = 3, direction = 'both', types = [] } = options;
    const visited = new Set();
    const results = [];
    const queue = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift();
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (node) {
        results.push(node);
      }

      // Get related nodes
      const rels = this.getRelationships(id);
      for (const rel of rels) {
        if (types.length && !types.includes(rel.type)) continue;

        const neighborId = rel.from === id ? rel.to : rel.from;
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: currentDepth + 1 });
        }
      }
    }

    return results;
  }

  /**
   * Find shortest path between two nodes
   */
  async findPath(fromId, toId, options = {}) {
    const { maxDepth = 10 } = options;
    const visited = new Set();
    const queue = [{ id: fromId, path: [fromId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      if (id === toId) {
        return { found: true, path, length: path.length - 1 };
      }

      if (path.length > maxDepth) continue;

      const rels = this.getRelationships(id);
      for (const rel of rels) {
        const neighborId = rel.from === id ? rel.to : rel.from;
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, path: [...path, neighborId] });
        }
      }
    }

    return { found: false, path: [], length: -1 };
  }

  /**
   * Query graph with filters
   */
  async query(query) {
    const { start, match, where, return: returnFields, limit = 100 } = query;
    let results = Array.from(this.nodes.values());

    // Filter by type
    if (match?.type) {
      results = results.filter(n => n.type === match.type);
    }

    // Filter by properties
    if (where) {
      results = results.filter(n => {
        for (const [key, value] of Object.entries(where)) {
          if (n.properties[key] !== value) return false;
        }
        return true;
      });
    }

    // Limit results
    return results.slice(0, limit);
  }

  /**
   * Link CorpID entities in the graph
   */
  async linkCorpIds(corpId1, corpId2, relationshipType, properties = {}) {
    // Create nodes if they don't exist
    if (!this.nodes.has(corpId1)) {
      await this.createNode(corpId1, 'CorpID', { entityType: 'UNKNOWN' });
    }
    if (!this.nodes.has(corpId2)) {
      await this.createNode(corpId2, 'CorpID', { entityType: 'UNKNOWN' });
    }

    // Create relationship
    return await this.createRelationship(corpId1, corpId2, relationshipType, properties);
  }

  /**
   * Get graph statistics
   */
  async getStats() {
    const nodeTypes = {};
    const relTypes = {};

    for (const node of this.nodes.values()) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }

    for (const rel of this.relationships.values()) {
      relTypes[rel.type] = (relTypes[rel.type] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalRelationships: this.relationships.size,
      nodeTypes,
      relTypes,
      density: this.relationships.size / (this.nodes.size * (this.nodes.size - 1)) || 0
    };
  }

  /**
   * Export graph data
   */
  async export() {
    return {
      nodes: Array.from(this.nodes.values()),
      relationships: Array.from(this.relationships.values()),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import graph data
   */
  async import(data) {
    if (data.nodes) {
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
      }
    }
    if (data.relationships) {
      for (const rel of data.relationships) {
        this.relationships.set(rel.id, rel);
      }
    }
    this.emit('graph:imported', { nodeCount: data.nodes?.length || 0, relCount: data.relationships?.length || 0 });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      nodes: this.nodes.size,
      relationships: this.relationships.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Default export
export default KnowledgeGraphConnection;