/**
 * REZ Memory Cloud - Graph Service (Knowledge Graph)
 */

import { v4 as uuidv4 } from 'uuid';
import { Entity, Relation, CreateEntityInput, CreateRelationInput, GraphQueryInput, type IEntity, type IRelation } from '../models/Entity.js';
import { logger } from '../utils/logger.js';

export interface GraphNode {
  entityId: string;
  type: string;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  relationId: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, unknown>;
  strength: number;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphService {
  /**
   * Create an entity
   */
  async createEntity(input: CreateEntityInput): Promise<IEntity> {
    const entityId = `ent_${uuidv4()}`;

    const entity = new Entity({
      entityId,
      type: input.type,
      name: input.name,
      description: input.description,
      properties: input.properties || {},
      owners: [input.userId],
    });

    await entity.save();
    logger.info({ msg: 'Entity created', entityId, type: input.type, name: input.name });

    return entity as unknown as IEntity;
  }

  /**
   * Get an entity by ID
   */
  async getEntity(entityId: string): Promise<IEntity | null> {
    const entity = await Entity.findOne({ entityId });
    return entity as unknown as IEntity | null;
  }

  /**
   * Search entities by name
   */
  async searchEntities(query: string, limit = 20): Promise<IEntity[]> {
    const entities = await Entity.find({
      $text: { $search: query },
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
    return entities as unknown as IEntity[];
  }

  /**
   * Get entities by type
   */
  async getEntitiesByType(type: string, userId: string, limit = 50): Promise<IEntity[]> {
    const entities = await Entity.find({ type, owners: userId }).limit(limit);
    return entities as unknown as IEntity[];
  }

  /**
   * Create a relation between entities
   */
  async createRelation(input: CreateRelationInput): Promise<IRelation> {
    const relationId = `rel_${uuidv4()}`;

    const relation = new Relation({
      relationId,
      fromEntityId: input.fromEntityId,
      toEntityId: input.toEntityId,
      type: input.type,
      properties: input.properties,
      strength: input.strength || 1.0,
      source: input.source,
      userId: input.userId,
    });

    await relation.save();

    // Update relation counts
    await Promise.all([
      Entity.updateOne(
        { entityId: input.fromEntityId },
        { $inc: { outgoingRelations: 1 } }
      ),
      Entity.updateOne(
        { entityId: input.toEntityId },
        { $inc: { incomingRelations: 1 } }
      ),
    ]);

    logger.info({
      msg: 'Relation created',
      relationId,
      from: input.fromEntityId,
      to: input.toEntityId,
      type: input.type,
    });

    return relation as unknown as IRelation;
  }

  /**
   * Delete a relation
   */
  async deleteRelation(relationId: string): Promise<boolean> {
    const relation = await Relation.findOne({ relationId });

    if (!relation) {
      return false;
    }

    await Relation.deleteOne({ relationId });

    // Update relation counts
    await Promise.all([
      Entity.updateOne(
        { entityId: relation.fromEntityId },
        { $inc: { outgoingRelations: -1 } }
      ),
      Entity.updateOne(
        { entityId: relation.toEntityId },
        { $inc: { incomingRelations: -1 } }
      ),
    ]);

    logger.info({ msg: 'Relation deleted', relationId });
    return true;
  }

  /**
   * Query the graph from an entity
   */
  async query(input: GraphQueryInput): Promise<GraphResult> {
    let startEntity: IEntity | null = null;

    if (input.entityId) {
      const entity = await Entity.findOne({ entityId: input.entityId });
      startEntity = entity as unknown as IEntity | null;
    } else if (input.entityName) {
      const entities = await Entity.find({
        name: { $regex: input.entityName, $options: 'i' },
        owners: input.userId,
      }).limit(1);
      startEntity = entities[0] ? entities[0] as unknown as IEntity : null;
    }

    if (!startEntity) {
      return { nodes: [], edges: [] };
    }

    const nodes: GraphNode[] = [this.entityToNode(startEntity)];
    const edges: GraphEdge[] = [];
    const visitedEntities = new Set<string>([startEntity.entityId]);

    // BFS traversal
    await this.traverseGraph(
      startEntity.entityId,
      input.userId,
      input.depth,
      input.relationTypes,
      nodes,
      edges,
      visitedEntities,
      input.limit
    );

    return { nodes, edges };
  }

  /**
   * Get direct relations for an entity
   */
  async getRelations(entityId: string): Promise<{
    outgoing: IRelation[];
    incoming: IRelation[];
  }> {
    const [outgoing, incoming] = await Promise.all([
      Relation.find({ fromEntityId: entityId }),
      Relation.find({ toEntityId: entityId }),
    ]);

    return {
      outgoing: outgoing as unknown as IRelation[],
      incoming: incoming as unknown as IRelation[],
    };
  }

  /**
   * Update entity
   */
  async updateEntity(
    entityId: string,
    updates: { name?: string; description?: string; properties?: Record<string, unknown> }
  ): Promise<IEntity | null> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.properties !== undefined) updateData.properties = updates.properties;

    const entity = await Entity.findOneAndUpdate({ entityId }, { $set: updateData }, { new: true });
    return entity as unknown as IEntity | null;
  }

  /**
   * Delete entity and its relations
   */
  async deleteEntity(entityId: string): Promise<boolean> {
    // Delete all related relations
    await Relation.deleteMany({
      $or: [{ fromEntityId: entityId }, { toEntityId: entityId }],
    });

    // Delete the entity
    const result = await Entity.deleteOne({ entityId });

    logger.info({ msg: 'Entity deleted', entityId, relationsRemoved: true });
    return result.deletedCount > 0;
  }

  /**
   * Get graph statistics
   */
  async getStats(userId: string): Promise<{
    totalEntities: number;
    totalRelations: number;
    byType: Record<string, number>;
  }> {
    const [entityStats, relationCount] = await Promise.all([
      Entity.aggregate([
        { $match: { owners: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Relation.countDocuments({ userId }),
    ]);

    const byType: Record<string, number> = {};
    for (const stat of entityStats) {
      byType[stat._id] = stat.count;
    }

    return {
      totalEntities: entityStats.reduce((sum, s) => sum + s.count, 0),
      totalRelations: relationCount,
      byType,
    };
  }

  private async traverseGraph(
    entityId: string,
    userId: string,
    depth: number,
    relationTypes: string[] | undefined,
    nodes: GraphNode[],
    edges: GraphEdge[],
    visited: Set<string>,
    limit: number
  ): Promise<void> {
    if (depth <= 0 || nodes.length >= limit) return;

    // Get outgoing relations
    const query: Record<string, unknown> = {
      fromEntityId: entityId,
      userId,
    };

    if (relationTypes) {
      query.type = { $in: relationTypes };
    }

    const relations = await Relation.find(query).limit(limit - nodes.length);

    for (const rel of relations) {
      if (visited.has(rel.toEntityId)) continue;

      const toEntity = await Entity.findOne({ entityId: rel.toEntityId });
      if (!toEntity || !toEntity.owners.includes(userId)) continue;

      nodes.push(this.entityToNode(toEntity as unknown as IEntity));
      edges.push({
        relationId: rel.relationId,
        from: rel.fromEntityId,
        to: rel.toEntityId,
        type: rel.type,
        properties: rel.properties as Record<string, unknown>,
        strength: rel.strength,
      });

      visited.add(rel.toEntityId);

      // Recurse
      if (nodes.length < limit) {
        await this.traverseGraph(
          rel.toEntityId,
          userId,
          depth - 1,
          relationTypes,
          nodes,
          edges,
          visited,
          limit
        );
      }
    }
  }

  private entityToNode(entity: IEntity): GraphNode {
    return {
      entityId: entity.entityId,
      type: entity.type,
      name: entity.name,
      description: entity.description,
      properties: entity.properties as Record<string, unknown>,
    };
  }
}

export const graphService = new GraphService();
