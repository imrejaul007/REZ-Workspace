import { Device, IDevice } from '../models';
import { RegisterDeviceRequest, DeviceType, Platform } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export class DeviceService {
  /**
   * Register a new device or update existing
   */
  async registerDevice(request: RegisterDeviceRequest): Promise<IDevice> {
    try {
      const existingDevice = await Device.findOne({ deviceId: request.deviceId });

      if (existingDevice) {
        // Update existing device
        existingDevice.lastSeen = new Date();
        existingDevice.isActive = true;

        if (request.userId) existingDevice.userId = request.userId;
        if (request.identifiers) {
          existingDevice.identifiers = {
            ...existingDevice.identifiers,
            ...request.identifiers,
          };
        }
        if (request.attributes) {
          existingDevice.attributes = {
            ...existingDevice.attributes,
            ...request.attributes,
          };
        }
        if (request.tags) existingDevice.tags = request.tags;

        await existingDevice.save();
        logger.info(`Device updated: ${request.deviceId}`);
        metrics.devicesRegistered.inc({ type: request.type, platform: request.platform, action: 'update' });

        return existingDevice;
      }

      // Create new device
      const device = new Device({
        deviceId: request.deviceId,
        type: request.type,
        platform: request.platform,
        userId: request.userId,
        identifiers: request.identifiers || {},
        attributes: request.attributes || {},
        firstSeen: new Date(),
        lastSeen: new Date(),
        isActive: true,
        tags: request.tags || [],
      });

      await device.save();
      logger.info(`Device registered: ${request.deviceId}`);
      metrics.devicesRegistered.inc({ type: request.type, platform: request.platform, action: 'create' });

      return device;
    } catch (error) {
      logger.error(`Error registering device: ${error}`);
      throw error;
    }
  }

  /**
   * Get device by ID
   */
  async getDevice(deviceId: string): Promise<IDevice | null> {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        logger.warn(`Device not found: ${deviceId}`);
      }
      return device;
    } catch (error) {
      logger.error(`Error getting device: ${error}`);
      throw error;
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<IDevice[]> {
    try {
      const devices = await Device.find({ userId, isActive: true })
        .sort({ lastSeen: -1 });
      logger.info(`Found ${devices.length} devices for user: ${userId}`);
      return devices;
    } catch (error) {
      logger.error(`Error getting user devices: ${error}`);
      throw error;
    }
  }

  /**
   * Get devices by identifiers
   */
  async getDevicesByIdentifier(
    identifierType: 'idfa' | 'gaid' | 'androidId' | 'cookieId',
    identifierValue: string
  ): Promise<IDevice[]> {
    try {
      const devices = await Device.find({
        [`identifiers.${identifierType}`]: identifierValue,
        isActive: true,
      });
      return devices;
    } catch (error) {
      logger.error(`Error getting devices by identifier: ${error}`);
      throw error;
    }
  }

  /**
   * Update device activity
   */
  async updateActivity(deviceId: string): Promise<void> {
    try {
      await Device.updateOne(
        { deviceId },
        { lastSeen: new Date(), isActive: true }
      );
    } catch (error) {
      logger.error(`Error updating device activity: ${error}`);
      throw error;
    }
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceId: string): Promise<void> {
    try {
      await Device.updateOne(
        { deviceId },
        { isActive: false, updatedAt: new Date() }
      );
      logger.info(`Device deactivated: ${deviceId}`);
      metrics.devicesDeactivated.inc();
    } catch (error) {
      logger.error(`Error deactivating device: ${error}`);
      throw error;
    }
  }

  /**
   * Add device to household
   */
  async addDeviceToHousehold(deviceId: string, householdId: string): Promise<void> {
    try {
      await Device.updateOne(
        { deviceId },
        { householdId }
      );
      logger.info(`Device ${deviceId} added to household ${householdId}`);
    } catch (error) {
      logger.error(`Error adding device to household: ${error}`);
      throw error;
    }
  }

  /**
   * Get devices by household
   */
  async getHouseholdDevices(householdId: string): Promise<IDevice[]> {
    try {
      const devices = await Device.find({ householdId, isActive: true })
        .sort({ lastSeen: -1 });
      return devices;
    } catch (error) {
      logger.error(`Error getting household devices: ${error}`);
      throw error;
    }
  }

  /**
   * Batch register devices
   */
  async batchRegisterDevices(devices: RegisterDeviceRequest[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const deviceRequest of devices) {
      const existingDevice = await Device.findOne({ deviceId: deviceRequest.deviceId });
      if (existingDevice) {
        updated++;
      } else {
        created++;
      }
      await this.registerDevice(deviceRequest);
    }

    logger.info(`Batch register: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(): Promise<{
    totalDevices: number;
    activeDevices: number;
    devicesByType: Record<string, number>;
    devicesByPlatform: Record<string, number>;
    linkedDevices: number;
    households: number;
  }> {
    try {
      const totalDevices = await Device.countDocuments();
      const activeDevices = await Device.countDocuments({ isActive: true });

      // Aggregate by type
      const typeAggregation = await Device.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      const devicesByType: Record<string, number> = {};
      typeAggregation.forEach(item => {
        devicesByType[item._id] = item.count;
      });

      // Aggregate by platform
      const platformAggregation = await Device.aggregate([
        { $group: { _id: '$platform', count: { $sum: 1 } } }
      ]);
      const devicesByPlatform: Record<string, number> = {};
      platformAggregation.forEach(item => {
        devicesByPlatform[item._id] = item.count;
      });

      // Count unique households
      const households = await Device.distinct('householdId', { householdId: { $ne: null } });

      return {
        totalDevices,
        activeDevices,
        devicesByType,
        devicesByPlatform,
        linkedDevices: 0, // Will be computed from DeviceLink
        households: households.length,
      };
    } catch (error) {
      logger.error(`Error getting device stats: ${error}`);
      throw error;
    }
  }
}

export const deviceService = new DeviceService();