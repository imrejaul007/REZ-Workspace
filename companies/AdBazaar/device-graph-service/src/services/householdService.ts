import { Household, IHousehold, IHouseholdMember, Device } from '../models';
import { HouseholdInput } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export class HouseholdService {
  /**
   * Create a new household
   */
  async createHousehold(request: Partial<HouseholdInput>): Promise<IHousehold> {
    try {
      const householdId = request.householdId || uuidv4();

      const household = new Household({
        householdId,
        name: request.name,
        devices: request.devices || [],
        members: request.members || [],
        address: request.address,
        attributes: request.attributes || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await household.save();
      logger.info(`Household created: ${householdId}`);
      metrics.householdsCreated.inc();

      return household;
    } catch (error) {
      logger.error(`Error creating household: ${error}`);
      throw error;
    }
  }

  /**
   * Get household by ID
   */
  async getHousehold(householdId: string): Promise<IHousehold | null> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        logger.warn(`Household not found: ${householdId}`);
      }
      return household;
    } catch (error) {
      logger.error(`Error getting household: ${error}`);
      throw error;
    }
  }

  /**
   * Get household for a device
   */
  async getHouseholdForDevice(deviceId: string): Promise<IHousehold | null> {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device || !device.householdId) {
        return null;
      }
      return await Household.findOne({ householdId: device.householdId });
    } catch (error) {
      logger.error(`Error getting household for device: ${error}`);
      throw error;
    }
  }

  /**
   * Get household for a user
   */
  async getHouseholdForUser(userId: string): Promise<IHousehold | null> {
    try {
      const household = await Household.findOne({
        'members.userId': userId
      });
      return household;
    } catch (error) {
      logger.error(`Error getting household for user: ${error}`);
      throw error;
    }
  }

  /**
   * Add device to household
   */
  async addDeviceToHousehold(deviceId: string, householdId: string): Promise<void> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        throw new Error(`Household not found: ${householdId}`);
      }

      if (!household.devices.includes(deviceId)) {
        household.devices.push(deviceId);
        household.updatedAt = new Date();
        await household.save();
      }

      // Update device's household reference
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
   * Remove device from household
   */
  async removeDeviceFromHousehold(deviceId: string, householdId: string): Promise<void> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        throw new Error(`Household not found: ${householdId}`);
      }

      household.devices = household.devices.filter(d => d !== deviceId);
      household.updatedAt = new Date();
      await household.save();

      // Remove device's household reference
      await Device.updateOne(
        { deviceId },
        { $unset: { householdId: 1 } }
      );

      logger.info(`Device ${deviceId} removed from household ${householdId}`);
    } catch (error) {
      logger.error(`Error removing device from household: ${error}`);
      throw error;
    }
  }

  /**
   * Add member to household
   */
  async addMemberToHousehold(
    householdId: string,
    userId: string,
    role: 'owner' | 'member' | 'guest' = 'member'
  ): Promise<IHousehold> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        throw new Error(`Household not found: ${householdId}`);
      }

      const existingMember = household.members.find(m => m.userId === userId);
      if (!existingMember) {
        household.members.push({
          userId,
          role,
          joinedAt: new Date(),
        });
        household.updatedAt = new Date();
        await household.save();
        logger.info(`User ${userId} added to household ${householdId} as ${role}`);
      }

      // Update devices owned by this user
      await Device.updateMany(
        { userId },
        { householdId }
      );

      return household;
    } catch (error) {
      logger.error(`Error adding member to household: ${error}`);
      throw error;
    }
  }

  /**
   * Remove member from household
   */
  async removeMemberFromHousehold(householdId: string, userId: string): Promise<IHousehold> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        throw new Error(`Household not found: ${householdId}`);
      }

      household.members = household.members.filter(m => m.userId !== userId);
      household.updatedAt = new Date();
      await household.save();

      // Remove household reference from user's devices
      await Device.updateMany(
        { userId, householdId },
        { $unset: { householdId: 1 } }
      );

      logger.info(`User ${userId} removed from household ${householdId}`);
      return household;
    } catch (error) {
      logger.error(`Error removing member from household: ${error}`);
      throw error;
    }
  }

  /**
   * Update household
   */
  async updateHousehold(
    householdId: string,
    updates: Partial<HouseholdInput>
  ): Promise<IHousehold | null> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        return null;
      }

      if (updates.name !== undefined) household.name = updates.name;
      if (updates.address !== undefined) household.address = updates.address;
      if (updates.attributes !== undefined) household.attributes = updates.attributes;

      household.updatedAt = new Date();
      await household.save();

      logger.info(`Household updated: ${householdId}`);
      return household;
    } catch (error) {
      logger.error(`Error updating household: ${error}`);
      throw error;
    }
  }

  /**
   * Delete household
   */
  async deleteHousehold(householdId: string): Promise<boolean> {
    try {
      // Remove household reference from all devices
      await Device.updateMany(
        { householdId },
        { $unset: { householdId: 1 } }
      );

      const result = await Household.deleteOne({ householdId });

      if (result.deletedCount > 0) {
        logger.info(`Household deleted: ${householdId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error deleting household: ${error}`);
      throw error;
    }
  }

  /**
   * Get all households
   */
  async getAllHouseholds(limit = 100, offset = 0): Promise<IHousehold[]> {
    try {
      const households = await Household.find()
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });

      return households;
    } catch (error) {
      logger.error(`Error getting all households: ${error}`);
      throw error;
    }
  }

  /**
   * Get household with all devices
   */
  async getHouseholdWithDevices(householdId: string): Promise<{
    household: IHousehold | null;
    devices: any[];
  }> {
    try {
      const household = await Household.findOne({ householdId });
      if (!household) {
        return { household: null, devices: [] };
      }

      const devices = await Device.find({ householdId }).sort({ lastSeen: -1 });

      return { household, devices };
    } catch (error) {
      logger.error(`Error getting household with devices: ${error}`);
      throw error;
    }
  }

  /**
   * Merge two households
   */
  async mergeHouseholds(sourceHouseholdId: string, targetHouseholdId: string): Promise<IHousehold | null> {
    try {
      const sourceHousehold = await Household.findOne({ householdId: sourceHouseholdId });
      const targetHousehold = await Household.findOne({ householdId: targetHouseholdId });

      if (!sourceHousehold || !targetHousehold) {
        throw new Error('One or both households not found');
      }

      // Merge devices
      const allDevices = [...new Set([...targetHousehold.devices, ...sourceHousehold.devices])];
      targetHousehold.devices = allDevices;

      // Merge members (avoiding duplicates)
      const existingUserIds = new Set(targetHousehold.members.map(m => m.userId));
      const newMembers = sourceHousehold.members.filter(m => !existingUserIds.has(m.userId));
      targetHousehold.members.push(...newMembers);

      targetHousehold.updatedAt = new Date();
      await targetHousehold.save();

      // Update all source devices to point to target
      await Device.updateMany(
        { householdId: sourceHouseholdId },
        { householdId: targetHouseholdId }
      );

      // Delete source household
      await Household.deleteOne({ householdId: sourceHouseholdId });

      logger.info(`Households merged: ${sourceHouseholdId} -> ${targetHouseholdId}`);
      return targetHousehold;
    } catch (error) {
      logger.error(`Error merging households: ${error}`);
      throw error;
    }
  }
}

export const householdService = new HouseholdService();