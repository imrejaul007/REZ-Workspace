import { Device, DeviceLink, Household } from '../models';
import { ResolveUserRequest, RegisterDeviceRequest } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { deviceService } from './deviceService';
import { linkingService } from './linkingService';
import { householdService } from './householdService';

export interface ResolutionResult {
  userId?: string;
  householdId?: string;
  deviceId: string;
  confidence: number;
  linkedDevices: string[];
  method: string;
  graph?: {
    nodes: any[];
    edges: any[];
  };
}

export class ResolutionService {
  /**
   * Resolve user identity from device
   * Uses multiple signals: direct userId, identifiers, links, household
   */
  async resolveUser(request: ResolveUserRequest): Promise<ResolutionResult> {
    try {
      const result: ResolutionResult = {
        deviceId: request.deviceId,
        confidence: 0,
        linkedDevices: [],
        method: 'unknown',
      };

      // Step 1: Direct device lookup with userId
      const directDevice = await Device.findOne({ deviceId: request.deviceId });
      if (directDevice?.userId) {
        result.userId = directDevice.userId;
        result.confidence = 1.0;
        result.method = 'direct_device';
        result.householdId = directDevice.householdId || undefined;

        // Get linked devices
        const linked = await linkingService.getLinkedDevices(request.deviceId);
        result.linkedDevices = linked.map(l =>
          l.deviceIds.find(id => id !== request.deviceId)!
        );

        metrics.resolutionSuccess.inc({ method: 'direct_device' });
        return result;
      }

      // Step 2: Search by identifiers
      if (request.identifiers) {
        const identifierResults = await this.searchByIdentifiers(request.identifiers);
        if (identifierResults.length > 0) {
          // Take the result with highest confidence
          const bestResult = identifierResults.sort((a, b) => b.confidence - a.confidence)[0];

          if (bestResult.confidence > result.confidence) {
            result.userId = bestResult.userId;
            result.confidence = bestResult.confidence;
            result.method = 'identifier_match';
            result.householdId = bestResult.householdId;
          }
        }
      }

      // Step 3: Search by linked devices
      if (result.confidence < 1.0) {
        const linkBasedResult = await this.resolveByLinks(request.deviceId);
        if (linkBasedResult.confidence > result.confidence) {
          result.userId = linkBasedResult.userId;
          result.confidence = linkBasedResult.confidence;
          result.method = 'link_chain';
          result.householdId = linkBasedResult.householdId;
          result.linkedDevices = linkBasedResult.linkedDevices;
        }
      }

      // Step 4: Household-based resolution
      if (directDevice?.householdId && result.confidence < 1.0) {
        const household = await Household.findOne({ householdId: directDevice.householdId });
        if (household && household.members.length > 0) {
          result.householdId = household.householdId;
          // Assign to most active member (owner or longest member)
          const primaryMember = household.members.find(m => m.role === 'owner')
            || household.members.sort((a, b) =>
              new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
            )[0];

          if (primaryMember) {
            result.userId = primaryMember.userId;
            result.confidence = Math.max(result.confidence, 0.7);
            result.method = 'household';
          }
        }
      }

      // Step 5: Inferred resolution (behavioral patterns)
      if (!result.userId && result.confidence < 0.5) {
        const inferredResult = await this.resolveByInferred(request.deviceId);
        if (inferredResult.confidence > result.confidence) {
          result.userId = inferredResult.userId;
          result.confidence = inferredResult.confidence;
          result.method = 'inferred';
        }
      }

      logger.info(`User resolution for device ${request.deviceId}: ${result.method} (${result.confidence})`);
      metrics.resolutionAttempts.inc({ method: result.method });

      return result;
    } catch (error) {
      logger.error(`Error resolving user: ${error}`);
      metrics.resolutionErrors.inc();
      throw error;
    }
  }

  /**
   * Search for devices matching any of the provided identifiers
   */
  private async searchByIdentifiers(identifiers: NonNullable<ResolveUserRequest['identifiers']>): Promise<Array<{
    userId: string;
    confidence: number;
    householdId?: string;
  }>> {
    const results: Array<{ userId: string; confidence: number; householdId?: string }> = [];

    const identifierMap: Record<string, string> = {};
    if (identifiers.idfa) identifierMap['identifiers.idfa'] = identifiers.idfa;
    if (identifiers.gaid) identifierMap['identifiers.gaid'] = identifiers.gaid;
    if (identifiers.androidId) identifierMap['identifiers.androidId'] = identifiers.androidId;
    if (identifiers.cookieId) identifierMap['identifiers.cookieId'] = identifiers.cookieId;

    if (Object.keys(identifierMap).length === 0) {
      return results;
    }

    const devices = await Device.find({
      $or: Object.entries(identifierMap).map(([key, value]) => ({ [key]: value }))
    });

    for (const device of devices) {
      if (device.userId) {
        const confidence = device.userId ? 0.95 : 0.7;
        results.push({
          userId: device.userId,
          confidence,
          householdId: device.householdId || undefined,
        });
      }
    }

    return results;
  }

  /**
   * Resolve user by following device link chain
   */
  private async resolveByLinks(deviceId: string): Promise<{
    userId?: string;
    confidence: number;
    householdId?: string;
    linkedDevices: string[];
  }> {
    const result = {
      userId: undefined as string | undefined,
      confidence: 0,
      householdId: undefined as string | undefined,
      linkedDevices: [] as string[],
    };

    // Get direct links
    const links = await linkingService.getLinkedDevices(deviceId);

    for (const link of links) {
      // Check if linked device has userId
      const linkedDeviceId = link.deviceIds.find(id => id !== deviceId)!;
      const linkedDevice = await Device.findOne({ deviceId: linkedDeviceId });

      if (linkedDevice?.userId) {
        const linkConfidence = link.confidence * 0.95;
        if (linkConfidence > result.confidence) {
          result.userId = linkedDevice.userId;
          result.confidence = linkConfidence;
          result.householdId = linkedDevice.householdId || undefined;
        }
      }

      result.linkedDevices.push(linkedDeviceId);

      // Follow second-degree links
      const secondDegreeLinks = await linkingService.getLinkedDevices(linkedDeviceId);
      for (const secondLink of secondDegreeLinks) {
        const secondDegreeDeviceId = secondLink.deviceIds.find(id => id !== linkedDeviceId)!;
        if (secondDegreeDeviceId !== deviceId && !result.linkedDevices.includes(secondDegreeDeviceId)) {
          const secondDegreeDevice = await Device.findOne({ deviceId: secondDegreeDeviceId });
          if (secondDegreeDevice?.userId) {
            const totalConfidence = link.confidence * secondLink.confidence * 0.9;
            if (totalConfidence > result.confidence) {
              result.userId = secondDegreeDevice.userId;
              result.confidence = totalConfidence;
            }
          }
          result.linkedDevices.push(secondDegreeDeviceId);
        }
      }
    }

    return result;
  }

  /**
   * Infer user based on behavioral patterns (simplified)
   */
  private async resolveByInferred(deviceId: string): Promise<{
    userId?: string;
    confidence: number;
  }> {
    // In a real implementation, this would use ML/behavioral analysis
    // For now, return empty result
    return {
      userId: undefined,
      confidence: 0,
    };
  }

  /**
   * Batch resolve multiple devices
   */
  async batchResolve(devices: ResolveUserRequest[]): Promise<ResolutionResult[]> {
    const results: ResolutionResult[] = [];

    for (const device of devices) {
      const result = await this.resolveUser(device);
      results.push(result);
    }

    logger.info(`Batch resolved ${results.length} devices`);
    return results;
  }

  /**
   * Transfer device identity to another user
   */
  async transferDevice(deviceId: string, fromUserId: string, toUserId: string): Promise<void> {
    try {
      // Update device
      await Device.updateOne(
        { deviceId, userId: fromUserId },
        { userId: toUserId }
      );

      // Update device links
      await DeviceLink.updateMany(
        { userId: fromUserId },
        { userId: toUserId }
      );

      logger.info(`Device ${deviceId} transferred from ${fromUserId} to ${toUserId}`);
    } catch (error) {
      logger.error(`Error transferring device: ${error}`);
      throw error;
    }
  }

  /**
   * Merge user identities
   */
  async mergeUsers(sourceUserId: string, targetUserId: string): Promise<void> {
    try {
      // Update all devices from source to target
      await Device.updateMany(
        { userId: sourceUserId },
        { userId: targetUserId }
      );

      // Update device links
      await DeviceLink.updateMany(
        { userId: sourceUserId },
        { userId: targetUserId }
      );

      // For household membership
      await Household.updateMany(
        { 'members.userId': sourceUserId },
        {
          $set: { 'members.$.userId': targetUserId }
        }
      );

      logger.info(`Users merged: ${sourceUserId} -> ${targetUserId}`);
    } catch (error) {
      logger.error(`Error merging users: ${error}`);
      throw error;
    }
  }

  /**
   * Get cross-device graph for a resolved user
   */
  async getUserCrossDeviceGraph(userId: string): Promise<{
    devices: any[];
    links: any[];
    household?: any;
  }> {
    try {
      // Get all devices for user
      const devices = await Device.find({ userId, isActive: true });

      // Get all links between these devices
      const deviceIds = devices.map(d => d.deviceId);
      const links = await DeviceLink.find({
        deviceIds: { $in: deviceIds }
      });

      // Get household if any
      let household = null;
      if (devices.length > 0 && devices[0].householdId) {
        household = await Household.findOne({ householdId: devices[0].householdId });
      }

      return { devices, links, household };
    } catch (error) {
      logger.error(`Error getting user cross-device graph: ${error}`);
      throw error;
    }
  }
}

export const resolutionService = new ResolutionService();