import { DeviceGraph, DeviceGraphNode, DeviceGraphEdge, IDeviceGraph } from '../models';
import { Device, DeviceLink, Household } from '../models';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export interface GraphNode {
  id: string;
  type: 'device' | 'user' | 'household';
  attributes?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'links_to' | 'belongs_to' | 'shared_with';
  weight: number;
  metadata?: Record<string, any>;
}

export interface DeviceGraphData {
  userId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: Date;
}

export class GraphService {
  /**
   * Get or create device graph for a user
   */
  async getOrCreateGraph(userId: string): Promise<IDeviceGraph> {
    try {
      let graph = await DeviceGraph.findOne({ userId });

      if (!graph) {
        graph = new DeviceGraph({
          userId,
          nodes: [],
          edges: [],
          lastUpdated: new Date(),
        });
        await graph.save();
      }

      return graph;
    } catch (error) {
      logger.error(`Error getting/creating graph: ${error}`);
      throw error;
    }
  }

  /**
   * Build complete device graph for a user
   */
  async buildUserGraph(userId: string): Promise<DeviceGraphData> {
    try {
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // Add user node
      nodes.push({
        id: userId,
        type: 'user',
        attributes: {},
      });

      // Get all devices for user
      const devices = await Device.find({ userId, isActive: true });

      for (const device of devices) {
        // Add device node
        nodes.push({
          id: device.deviceId,
          type: 'device',
          attributes: {
            type: device.type,
            platform: device.platform,
            lastSeen: device.lastSeen,
          },
        });

        // Add edge: device belongs to user
        edges.push({
          source: device.deviceId,
          target: userId,
          type: 'belongs_to',
          weight: 1.0,
        });

        // Add household if exists
        if (device.householdId) {
          const householdExists = nodes.find(n => n.id === device.householdId);
          if (!householdExists) {
            const household = await Household.findOne({ householdId: device.householdId });
            if (household) {
              nodes.push({
                id: device.householdId,
                type: 'household',
                attributes: {
                  name: household.name,
                  memberCount: household.members.length,
                },
              });
            }
          }

          // Add edge: device shared with household
          edges.push({
            source: device.deviceId,
            target: device.householdId,
            type: 'shared_with',
            weight: 0.8,
          });
        }
      }

      // Get all device links for these devices
      const deviceIds = devices.map(d => d.deviceId);
      const links = await DeviceLink.find({
        deviceIds: { $in: deviceIds }
      });

      for (const link of links) {
        // Add edge between linked devices
        const [deviceId1, deviceId2] = link.deviceIds;

        // Only add if both devices are in the user's graph
        if (deviceIds.includes(deviceId1) && deviceIds.includes(deviceId2)) {
          edges.push({
            source: deviceId1,
            target: deviceId2,
            type: 'links_to',
            weight: link.confidence,
            metadata: {
              method: link.method,
              evidence: link.evidence,
            },
          });
        }
      }

      // Update stored graph
      await this.updateGraph(userId, nodes, edges);

      return {
        userId,
        nodes,
        edges,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Error building user graph: ${error}`);
      throw error;
    }
  }

  /**
   * Update stored graph
   */
  async updateGraph(userId: string, nodes: GraphNode[], edges: GraphEdge[]): Promise<IDeviceGraph> {
    try {
      const graph = await DeviceGraph.findOneAndUpdate(
        { userId },
        {
          nodes,
          edges,
          lastUpdated: new Date(),
        },
        { new: true, upsert: true }
      );

      logger.info(`Graph updated for user: ${userId}`);
      return graph;
    } catch (error) {
      logger.error(`Error updating graph: ${error}`);
      throw error;
    }
  }

  /**
   * Add a device to the graph
   */
  async addDeviceToGraph(
    userId: string,
    deviceId: string,
    deviceType: string,
    platform: string
  ): Promise<void> {
    try {
      const graph = await this.getOrCreateGraph(userId);

      // Check if device node already exists
      const existingDeviceNode = graph.nodes.find(n => n.id === deviceId);
      if (existingDeviceNode) {
        // Update existing node
        existingDeviceNode.attributes = { type: deviceType, platform };
      } else {
        // Add new device node
        graph.nodes.push({
          id: deviceId,
          type: 'device',
          attributes: { type: deviceType, platform },
        });

        // Add edge: device belongs to user
        graph.edges.push({
          source: deviceId,
          target: userId,
          type: 'belongs_to',
          weight: 1.0,
        });
      }

      graph.lastUpdated = new Date();
      await graph.save();

      logger.info(`Device ${deviceId} added to graph for user ${userId}`);
    } catch (error) {
      logger.error(`Error adding device to graph: ${error}`);
      throw error;
    }
  }

  /**
   * Update link in graph
   */
  async updateLinkInGraph(
    deviceIds: [string, string],
    confidence: number,
    method: string
  ): Promise<void> {
    try {
      // Find all users who own these devices
      const devices = await Device.find({ deviceId: { $in: deviceIds } });

      if (devices.length === 0) {
        return;
      }

      // Group by user
      const userDevices = new Map<string, string[]>();
      for (const device of devices) {
        if (device.userId) {
          const existing = userDevices.get(device.userId) || [];
          existing.push(device.deviceId);
          userDevices.set(device.userId, existing);
        }
      }

      // Update graphs for each user
      for (const [userId, ownedDevices] of userDevices) {
        const graph = await this.getOrCreateGraph(userId);

        // Check if edge already exists
        const existingEdgeIndex = graph.edges.findIndex(
          e => e.source === deviceIds[0] && e.target === deviceIds[1] ||
               e.source === deviceIds[1] && e.target === deviceIds[0]
        );

        if (existingEdgeIndex >= 0) {
          graph.edges[existingEdgeIndex].weight = confidence;
          graph.edges[existingEdgeIndex].metadata = { method };
        } else {
          graph.edges.push({
            source: deviceIds[0],
            target: deviceIds[1],
            type: 'links_to',
            weight: confidence,
            metadata: { method },
          });
        }

        graph.lastUpdated = new Date();
        await graph.save();
      }
    } catch (error) {
      logger.error(`Error updating link in graph: ${error}`);
      throw error;
    }
  }

  /**
   * Remove link from graph
   */
  async removeLinkFromGraph(deviceIds: [string, string]): Promise<void> {
    try {
      const devices = await Device.find({ deviceId: { $in: deviceIds } });

      for (const device of devices) {
        if (device.userId) {
          const graph = await DeviceGraph.findOne({ userId: device.userId });
          if (graph) {
            graph.edges = graph.edges.filter(
              e => !(e.source === deviceIds[0] && e.target === deviceIds[1] ||
                     e.source === deviceIds[1] && e.target === deviceIds[0])
            );
            graph.lastUpdated = new Date();
            await graph.save();
          }
        }
      }
    } catch (error) {
      logger.error(`Error removing link from graph: ${error}`);
      throw error;
    }
  }

  /**
   * Get device graph (graph of connected devices)
   */
  async getDeviceGraph(deviceId: string): Promise<{
    centralDevice: any;
    nodes: GraphNode[];
    edges: GraphEdge[];
    depth: number;
  }> {
    try {
      const centralDevice = await Device.findOne({ deviceId });
      if (!centralDevice) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const visitedDevices = new Set<string>();
      const queue: Array<{ deviceId: string; depth: number }> = [{ deviceId, depth: 0 }];

      while (queue.length > 0) {
        const { deviceId: currentDeviceId, depth } = queue.shift()!;

        if (visitedDevices.has(currentDeviceId) || depth > 2) {
          continue;
        }
        visitedDevices.add(currentDeviceId);

        // Add node
        const device = await Device.findOne({ deviceId: currentDeviceId });
        if (device) {
          nodes.push({
            id: device.deviceId,
            type: 'device',
            attributes: {
              type: device.type,
              platform: device.platform,
              userId: device.userId,
            },
          });
        }

        // Get linked devices
        const links = await DeviceLink.find({ deviceIds: currentDeviceId });
        for (const link of links) {
          const linkedDeviceId = link.deviceIds.find(id => id !== currentDeviceId)!;

          // Add edge
          edges.push({
            source: currentDeviceId,
            target: linkedDeviceId,
            type: 'links_to',
            weight: link.confidence,
            metadata: { method: link.method },
          });

          // Queue linked device if not visited
          if (!visitedDevices.has(linkedDeviceId)) {
            queue.push({ deviceId: linkedDeviceId, depth: depth + 1 });
          }
        }
      }

      return {
        centralDevice,
        nodes,
        edges,
        depth: 2,
      };
    } catch (error) {
      logger.error(`Error getting device graph: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate reachability score for a device
   */
  async calculateReachability(deviceId: string): Promise<{
    directConnections: number;
    totalReach: number;
    householdReach: number;
    crossDeviceReach: number;
  }> {
    try {
      // Get direct links
      const directLinks = await linkingService.getLinkedDevices(deviceId);
      const directConnections = directLinks.length;

      // Calculate total reach through linked devices
      const visitedDevices = new Set<string>();
      const queue = directLinks.map(l => l.deviceIds.find(id => id !== deviceId)!);

      while (queue.length > 0) {
        const currentDeviceId = queue.shift()!;
        if (visitedDevices.has(currentDeviceId)) continue;
        visitedDevices.add(currentDeviceId);

        const secondaryLinks = await linkingService.getLinkedDevices(currentDeviceId);
        for (const link of secondaryLinks) {
          const linkedDeviceId = link.deviceIds.find(id => id !== currentDeviceId)!;
          if (!visitedDevices.has(linkedDeviceId)) {
            queue.push(linkedDeviceId);
          }
        }
      }

      // Get household reach
      const device = await Device.findOne({ deviceId });
      let householdReach = 0;
      if (device?.householdId) {
        const household = await Household.findOne({ householdId: device.householdId });
        householdReach = household?.devices.length || 0;
      }

      return {
        directConnections,
        totalReach: visitedDevices.size + directConnections,
        householdReach,
        crossDeviceReach: visitedDevices.size,
      };
    } catch (error) {
      logger.error(`Error calculating reachability: ${error}`);
      throw error;
    }
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(): Promise<{
    totalGraphs: number;
    averageNodesPerGraph: number;
    averageEdgesPerGraph: number;
    graphsBySize: Record<string, number>;
  }> {
    try {
      const graphs = await DeviceGraph.find();

      let totalNodes = 0;
      let totalEdges = 0;
      const graphsBySize: Record<string, number> = {
        '1-5': 0,
        '6-10': 0,
        '11-20': 0,
        '20+': 0,
      };

      for (const graph of graphs) {
        totalNodes += graph.nodes.length;
        totalEdges += graph.edges.length;

        const size = graph.nodes.length;
        if (size <= 5) graphsBySize['1-5']++;
        else if (size <= 10) graphsBySize['6-10']++;
        else if (size <= 20) graphsBySize['11-20']++;
        else graphsBySize['20+']++;
      }

      return {
        totalGraphs: graphs.length,
        averageNodesPerGraph: graphs.length > 0 ? totalNodes / graphs.length : 0,
        averageEdgesPerGraph: graphs.length > 0 ? totalEdges / graphs.length : 0,
        graphsBySize,
      };
    } catch (error) {
      logger.error(`Error getting graph stats: ${error}`);
      throw error;
    }
  }
}

// Import linkingService here to avoid circular dependency
import { linkingService } from './linkingService';

export const graphService = new GraphService();