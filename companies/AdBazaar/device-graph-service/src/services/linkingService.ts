import { DeviceLink, IDeviceLink } from '../models';
import { LinkDevicesRequest } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { graphService } from './graphService';

export class LinkingService {
  /**
   * Link two devices together
   */
  async linkDevices(request: LinkDevicesRequest): Promise<IDeviceLink> {
    try {
      const [deviceId1, deviceId2] = request.deviceIds;

      // Normalize device IDs (always store in alphabetical order for consistency)
      const normalizedIds: [string, string] = deviceId1 < deviceId2
        ? [deviceId1, deviceId2]
        : [deviceId2, deviceId1];

      // Check if link already exists
      const existingLink = await DeviceLink.findOne({
        deviceIds: { $all: normalizedIds }
      });

      if (existingLink) {
        // Update existing link
        existingLink.confidence = request.confidence;
        existingLink.method = request.method;
        existingLink.evidence = request.evidence || {};
        existingLink.userId = request.userId;
        existingLink.householdId = request.householdId;
        if (request.expiresAt) existingLink.expiresAt = request.expiresAt;
        existingLink.updatedAt = new Date();

        await existingLink.save();
        logger.info(`Device link updated: ${normalizedIds.join(' <-> ')}`);

        // Update graph
        await graphService.updateLinkInGraph(normalizedIds, request.confidence, request.method);

        return existingLink;
      }

      // Create new link
      const link = new DeviceLink({
        deviceIds: normalizedIds,
        confidence: request.confidence,
        method: request.method,
        evidence: request.evidence || {},
        userId: request.userId,
        householdId: request.householdId,
        expiresAt: request.expiresAt,
      });

      await link.save();
      logger.info(`Devices linked: ${normalizedIds.join(' <-> ')} with confidence ${request.confidence}`);
      metrics.devicesLinked.inc({ method: request.method });

      // Update graph
      await graphService.updateLinkInGraph(normalizedIds, request.confidence, request.method);

      return link;
    } catch (error) {
      logger.error(`Error linking devices: ${error}`);
      throw error;
    }
  }

  /**
   * Get link between two devices
   */
  async getLink(deviceId1: string, deviceId2: string): Promise<IDeviceLink | null> {
    try {
      const link = await DeviceLink.findOne({
        deviceIds: { $all: [deviceId1, deviceId2] }
      });
      return link;
    } catch (error) {
      logger.error(`Error getting device link: ${error}`);
      throw error;
    }
  }

  /**
   * Get all devices linked to a specific device
   */
  async getLinkedDevices(deviceId: string): Promise<IDeviceLink[]> {
    try {
      const links = await DeviceLink.find({
        deviceIds: deviceId,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).sort({ confidence: -1 });

      return links;
    } catch (error) {
      logger.error(`Error getting linked devices: ${error}`);
      throw error;
    }
  }

  /**
   * Get all links for a user
   */
  async getUserLinks(userId: string): Promise<IDeviceLink[]> {
    try {
      const links = await DeviceLink.find({
        userId,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).sort({ confidence: -1 });

      return links;
    } catch (error) {
      logger.error(`Error getting user links: ${error}`);
      throw error;
    }
  }

  /**
   * Remove link between two devices
   */
  async unlinkDevices(deviceId1: string, deviceId2: string): Promise<boolean> {
    try {
      const result = await DeviceLink.deleteOne({
        deviceIds: { $all: [deviceId1, deviceId2] }
      });

      if (result.deletedCount > 0) {
        logger.info(`Devices unlinked: ${deviceId1} <-> ${deviceId2}`);

        // Update graph
        const normalizedIds: [string, string] = deviceId1 < deviceId2
          ? [deviceId1, deviceId2]
          : [deviceId2, deviceId1];
        await graphService.removeLinkFromGraph(normalizedIds);

        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error unlinking devices: ${error}`);
      throw error;
    }
  }

  /**
   * Get links by household
   */
  async getHouseholdLinks(householdId: string): Promise<IDeviceLink[]> {
    try {
      const links = await DeviceLink.find({
        householdId,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).sort({ confidence: -1 });

      return links;
    } catch (error) {
      logger.error(`Error getting household links: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate link confidence based on evidence
   */
  calculateConfidence(evidence: LinkDevicesRequest['evidence'], method: string): number {
    let baseConfidence = 0;

    switch (method) {
      case 'login':
        baseConfidence = 0.95;
        break;
      case 'household':
        baseConfidence = 0.90;
        break;
      case 'wifi':
        baseConfidence = evidence?.sharedWifi ? 0.85 : 0.5;
        break;
      case 'ip':
        baseConfidence = evidence?.sharedIp ? 0.70 : 0.4;
        break;
      case 'cookie':
        baseConfidence = evidence?.sharedCookie ? 0.75 : 0.5;
        break;
      case 'fingerprint':
        baseConfidence = evidence?.fingerprintScore || 0.6;
        break;
      case 'behavioral':
        baseConfidence = evidence?.behavioralScore || 0.5;
        break;
      case 'inferred':
        baseConfidence = 0.3;
        break;
      default:
        baseConfidence = 0.5;
    }

    // Boost confidence with multiple signals
    const signals = [
      evidence?.sharedIp,
      evidence?.sharedWifi,
      evidence?.sharedCookie,
      evidence?.fingerprintScore && evidence.fingerprintScore > 0.7,
      evidence?.behavioralScore && evidence.behavioralScore > 0.7,
    ].filter(Boolean).length;

    return Math.min(baseConfidence + (signals * 0.05), 1.0);
  }

  /**
   * Batch link devices
   */
  async batchLinkDevices(links: LinkDevicesRequest[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const linkRequest of links) {
      try {
        await this.linkDevices(linkRequest);
        success++;
      } catch (error) {
        logger.error(`Batch link failed for ${linkRequest.deviceIds}: ${error}`);
        failed++;
      }
    }

    logger.info(`Batch link complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Clean up expired links
   */
  async cleanupExpiredLinks(): Promise<number> {
    try {
      const result = await DeviceLink.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired device links`);
      }

      return result.deletedCount;
    } catch (error) {
      logger.error(`Error cleaning up expired links: ${error}`);
      throw error;
    }
  }
}

export const linkingService = new LinkingService();