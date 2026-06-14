import { InventorySlot, IInventorySlot, SlotStatus } from '../models/index.js';
import {
  CreateInventorySlotInput,
  UpdateInventorySlotInput,
  AvailableSlotsQueryInput,
} from '../validators/inventory.validator.js';
import { logger } from '../utils/logger.js';

export class InventoryService {
  /**
   * Create a new inventory slot
   */
  async createSlot(input: CreateInventorySlotInput): Promise<IInventorySlot> {
    try {
      const slot = new InventorySlot({
        ...input,
        date: new Date(input.date),
      });
      await slot.save();
      logger.info(`Created inventory slot: ${slot.slotId}`);
      return slot;
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        throw new Error(`Slot with ID ${input.slotId} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get all inventory slots with pagination
   */
  async getAllSlots(limit = 100, offset = 0): Promise<{
    slots: IInventorySlot[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const [slots, total] = await Promise.all([
      InventorySlot.find().skip(offset).limit(limit).sort({ date: -1, timeSlot: 1 }),
      InventorySlot.countDocuments(),
    ]);

    return { slots, total, limit, offset };
  }

  /**
   * Get slot by ID (supports MongoDB _id or slotId)
   */
  async getSlotById(id: string): Promise<IInventorySlot | null> {
    const slot = await InventorySlot.findOne({
      $or: [{ _id: id }, { slotId: id }],
    });
    return slot;
  }

  /**
   * Get slots by screen ID
   */
  async getSlotsByScreen(screenId: string, limit = 100, offset = 0): Promise<{
    slots: IInventorySlot[];
    total: number;
  }> {
    const [slots, total] = await Promise.all([
      InventorySlot.find({ screenId }).skip(offset).limit(limit).sort({ date: -1, timeSlot: 1 }),
      InventorySlot.countDocuments({ screenId }),
    ]);

    return { slots, total };
  }

  /**
   * Get slots for a specific screen on a specific date
   */
  async getSlotsByScreenAndDate(screenId: string, date: string): Promise<IInventorySlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await InventorySlot.find({
      screenId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ timeSlot: 1 });

    return slots;
  }

  /**
   * Search available slots with filters
   */
  async getAvailableSlots(query: AvailableSlotsQueryInput): Promise<{
    slots: IInventorySlot[];
    total: number;
  }> {
    const filter: Record<string, unknown> = { status: 'available' };

    if (query.screenId) {
      filter.screenId = query.screenId;
    }

    if (query.date) {
      const dateStr = query.date.includes('T') ? query.date.split('T')[0] : query.date;
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (query.duration) {
      filter.minDuration = { $lte: query.duration };
      filter.maxDuration = { $gte: query.duration };
    }

    if (query.minPrice !== undefined) {
      filter.price = { ...(filter.price as object || {}), $gte: query.minPrice };
    }

    if (query.maxPrice !== undefined) {
      filter.price = { ...(filter.price as object || {}), $lte: query.maxPrice };
    }

    if (query.startTime && query.endTime) {
      filter.timeSlot = { $gte: query.startTime, $lte: query.endTime };
    }

    const [slots, total] = await Promise.all([
      InventorySlot.find(filter)
        .skip(query.offset || 0)
        .limit(query.limit || 100)
        .sort({ date: 1, timeSlot: 1 }),
      InventorySlot.countDocuments(filter),
    ]);

    return { slots, total };
  }

  /**
   * Update an inventory slot
   */
  async updateSlot(id: string, input: UpdateInventorySlotInput): Promise<IInventorySlot | null> {
    const updateData: Record<string, unknown> = { ...input };

    if (input.date) {
      updateData.date = new Date(input.date);
    }

    const slot = await InventorySlot.findOneAndUpdate(
      { $or: [{ _id: id }, { slotId: id }] },
      updateData,
      { new: true, runValidators: true }
    );

    if (slot) {
      logger.info(`Updated inventory slot: ${slot.slotId}`);
    }

    return slot;
  }

  /**
   * Book a slot
   */
  async bookSlot(id: string, bookingId: string, advertiserId: string): Promise<IInventorySlot | null> {
    const slot = await InventorySlot.findOneAndUpdate(
      {
        $or: [{ _id: id }, { slotId: id }],
        status: 'available',
      },
      {
        status: 'booked',
        bookingId,
        advertiserId,
      },
      { new: true, runValidators: true }
    );

    if (slot) {
      logger.info(`Booked slot ${slot.slotId} for booking ${bookingId}`);
    }

    return slot;
  }

  /**
   * Release a booked slot back to available
   */
  async releaseSlot(id: string): Promise<IInventorySlot | null> {
    const slot = await InventorySlot.findOneAndUpdate(
      {
        $or: [{ _id: id }, { slotId: id }],
        status: { $in: ['booked', 'reserved'] },
      },
      {
        status: 'available',
        $unset: { bookingId: '', advertiserId: '' },
      },
      { new: true }
    );

    if (slot) {
      logger.info(`Released slot ${slot.slotId}`);
    }

    return slot;
  }

  /**
   * Block a slot (administrative action)
   */
  async blockSlot(id: string, reason?: string): Promise<IInventorySlot | null> {
    const slot = await InventorySlot.findOneAndUpdate(
      { $or: [{ _id: id }, { slotId: id }] },
      {
        status: 'blocked',
        $unset: { bookingId: '', advertiserId: '' },
      },
      { new: true }
    );

    if (slot) {
      logger.info(`Blocked slot ${slot.slotId}${reason ? `: ${reason}` : ''}`);
    }

    return slot;
  }

  /**
   * Reserve a slot (temporary hold)
   */
  async reserveSlot(id: string, advertiserId: string): Promise<IInventorySlot | null> {
    const slot = await InventorySlot.findOneAndUpdate(
      {
        $or: [{ _id: id }, { slotId: id }],
        status: 'available',
      },
      {
        status: 'reserved',
        advertiserId,
      },
      { new: true, runValidators: true }
    );

    if (slot) {
      logger.info(`Reserved slot ${slot.slotId} for advertiser ${advertiserId}`);
    }

    return slot;
  }

  /**
   * Delete a slot
   */
  async deleteSlot(id: string): Promise<boolean> {
    const result = await InventorySlot.deleteOne({
      $or: [{ _id: id }, { slotId: id }],
    });

    if (result.deletedCount && result.deletedCount > 0) {
      logger.info(`Deleted inventory slot: ${id}`);
      return true;
    }

    return false;
  }

  /**
   * Batch create slots
   */
  async batchCreate(input: CreateInventorySlotInput[]): Promise<{
    created: IInventorySlot[];
    failed: { input: CreateInventorySlotInput; error: string }[];
  }> {
    const results = {
      created: [] as IInventorySlot[],
      failed: [] as { input: CreateInventorySlotInput; error: string }[],
    };

    for (const slotInput of input) {
      try {
        const slot = await this.createSlot(slotInput);
        results.created.push(slot);
      } catch (error) {
        results.failed.push({
          input: slotInput,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info(`Batch created ${results.created.length}/${input.length} slots`);
    return results;
  }

  /**
   * Get inventory statistics
   */
  async getStats(screenId?: string): Promise<{
    total: number;
    available: number;
    booked: number;
    reserved: number;
    blocked: number;
    totalValue: number;
    availableValue: number;
  }> {
    const match: Record<string, unknown> = {};
    if (screenId) {
      match.screenId = screenId;
    }

    const stats = await InventorySlot.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] },
          },
          booked: {
            $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] },
          },
          reserved: {
            $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] },
          },
          blocked: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
          },
          totalValue: { $sum: '$price' },
          availableValue: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, '$price', 0] },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        available: 0,
        booked: 0,
        reserved: 0,
        blocked: 0,
        totalValue: 0,
        availableValue: 0,
      };
    }

    return stats[0] as {
      total: number;
      available: number;
      booked: number;
      reserved: number;
      blocked: number;
      totalValue: number;
      availableValue: number;
    };
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;