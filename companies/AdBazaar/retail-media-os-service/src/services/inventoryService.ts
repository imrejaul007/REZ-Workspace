import { Store, IStore, RetailInventory, IRetailInventory, InventoryType } from '../models';
import { logger } from '../utils/logger';
import { storesTotal, inventoryUtilization } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStoreInput {
  retailerId: string;
  storeCode: string;
  name: string;
  storeType: IStore['storeType'];
  address: IStore['address'];
  capacity?: Partial<IRetailer['capacity']>;
  operatingHours?: IStore['operatingHours'];
  attributes?: Partial<IRetailer['attributes']>;
}

export interface CreateInventoryInput {
  retailerId: string;
  storeId: string;
  inventoryType: InventoryType;
  placement?: IRetailInventory['placement'];
  dimensions: IRetailInventory['dimensions'];
  pricing: {
    basePrice: number;
    markup?: number;
  };
  category: string;
  productIds?: string[];
  visibility?: 'high' | 'medium' | 'low';
  availability: {
    startDate: Date;
    endDate: Date;
  };
}

interface IRetailer {
  capacity?: {
    shelfUnits?: number;
    endCaps?: number;
    checkouts?: number;
    entranceDisplays?: number;
    freezerDoors?: number;
  };
 attributes?: {
    hasSelfCheckout?: boolean;
    hasDeli?: boolean;
    hasBakery?: boolean;
    hasPharmacy?: boolean;
    trafficScore?: number;
    avgDailyVisitors?: number;
  };
}

class InventoryService {
  async createStore(input: CreateStoreInput): Promise<IStore> {
    try {
      const store = new Store({
        retailerId: input.retailerId,
        storeCode: input.storeCode,
        name: input.name,
        storeType: input.storeType,
        address: input.address,
        capacity: input.capacity || {},
        operatingHours: input.operatingHours,
        attributes: input.attributes,
        status: 'active'
      });

      await store.save();
      logger.info(`Store created: ${store._id} - ${store.name}`);

      // Update metrics
      storesTotal.inc();

      return store;
    } catch (error) {
      logger.error('Error creating store:', error);
      throw error;
    }
  }

  async getStoreById(id: string): Promise<IStore | null> {
    try {
      const store = await Store.findById(id);
      return store;
    } catch (error) {
      logger.error(`Error fetching store ${id}:`, error);
      throw error;
    }
  }

  async listStoresByRetailer(
    retailerId: string,
    filters?: {
      status?: string;
      city?: string;
      storeType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ stores: IStore[]; total: number }> {
    try {
      const query: Record<string, unknown> = { retailerId };

      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.city) {
        query['address.city'] = filters.city;
      }
      if (filters?.storeType) {
        query.storeType = filters.storeType;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [stores, total] = await Promise.all([
        Store.find(query).skip(offset).limit(limit).sort({ name: 1 }),
        Store.countDocuments(query)
      ]);

      return { stores, total };
    } catch (error) {
      logger.error(`Error listing stores for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async updateStore(id: string, input: Partial<IStore>): Promise<IStore | null> {
    try {
      const store = await Store.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      );

      if (store) {
        logger.info(`Store updated: ${id}`);
      }

      return store;
    } catch (error) {
      logger.error(`Error updating store ${id}:`, error);
      throw error;
    }
  }

  async createInventory(input: CreateInventoryInput): Promise<IRetailInventory> {
    try {
      const finalPrice = input.pricing.basePrice * (1 + (input.pricing.markup || 15) / 100);

      const inventory = new RetailInventory({
        retailerId: input.retailerId,
        storeId: input.storeId,
        inventoryType: input.inventoryType,
        placement: input.placement,
        dimensions: input.dimensions,
        pricing: {
          basePrice: input.pricing.basePrice,
          markup: input.pricing.markup || 15,
          finalPrice,
          currency: 'INR'
        },
        category: input.category,
        productIds: input.productIds || [],
        visibility: input.visibility || 'medium',
        availability: {
          ...input.availability,
          daysAvailable: this.calculateDaysAvailable(input.availability.startDate, input.availability.endDate)
        },
        status: 'available'
      });

      await inventory.save();
      logger.info(`Inventory created: ${inventory._id} - ${inventory.inventoryType}`);

      // Update store inventory counts
      await this.updateStoreInventoryCounts(input.storeId);

      return inventory;
    } catch (error) {
      logger.error('Error creating inventory:', error);
      throw error;
    }
  }

  async getInventoryById(id: string): Promise<IRetailInventory | null> {
    try {
      const inventory = await RetailInventory.findById(id);
      return inventory;
    } catch (error) {
      logger.error(`Error fetching inventory ${id}:`, error);
      throw error;
    }
  }

  async listInventoryByRetailer(
    retailerId: string,
    filters?: {
      storeId?: string;
      inventoryType?: InventoryType;
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ inventory: IRetailInventory[]; total: number }> {
    try {
      const query: Record<string, unknown> = { retailerId };

      if (filters?.storeId) {
        query.storeId = filters.storeId;
      }
      if (filters?.inventoryType) {
        query.inventoryType = filters.inventoryType;
      }
      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.category) {
        query.category = filters.category;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [inventory, total] = await Promise.all([
        RetailInventory.find(query).skip(offset).limit(limit).sort({ createdAt: -1 }),
        RetailInventory.countDocuments(query)
      ]);

      return { inventory, total };
    } catch (error) {
      logger.error(`Error listing inventory for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async updateInventoryStatus(id: string, status: IRetailInventory['status']): Promise<IRetailInventory | null> {
    try {
      const inventory = await RetailInventory.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      if (inventory) {
        logger.info(`Inventory status updated: ${id} - ${status}`);
        await this.updateStoreInventoryCounts(inventory.storeId.toString());
      }

      return inventory;
    } catch (error) {
      logger.error(`Error updating inventory status ${id}:`, error);
      throw error;
    }
  }

  async getInventoryAvailability(
    retailerId: string,
    storeId: string,
    inventoryType: InventoryType,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: number; booked: number; total: number }> {
    try {
      const query = {
        retailerId,
        storeId,
        inventoryType,
        'availability.startDate': { $lte: endDate },
        'availability.endDate': { $gte: startDate }
      };

      const [available, booked, total] = await Promise.all([
        RetailInventory.countDocuments({ ...query, status: 'available' }),
        RetailInventory.countDocuments({ ...query, status: { $in: ['booked', 'sold', 'reserved'] } }),
        RetailInventory.countDocuments({ ...query })
      ]);

      return { available, booked, total };
    } catch (error) {
      logger.error('Error checking inventory availability:', error);
      throw error;
    }
  }

  async getInventorySummary(retailerId: string): Promise<{
    totalUnits: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    utilizationRate: number;
  }> {
    try {
      const inventory = await RetailInventory.find({ retailerId });

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let totalUnits = 0;

      inventory.forEach((item) => {
        totalUnits++;
        byType[item.inventoryType] = (byType[item.inventoryType] || 0) + 1;
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      });

      const utilizationRate = totalUnits > 0
        ? ((inventory.filter((i) => i.status !== 'available').length / totalUnits) * 100)
        : 0;

      // Update metrics
      inventoryUtilization.set({ retailer_id: retailerId }, utilizationRate);

      return { totalUnits, byType, byStatus, utilizationRate };
    } catch (error) {
      logger.error(`Error getting inventory summary for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  private async updateStoreInventoryCounts(storeId: string): Promise<void> {
    try {
      const [total, active, available, reserved] = await Promise.all([
        RetailInventory.countDocuments({ storeId }),
        RetailInventory.countDocuments({ storeId, status: { $ne: 'available' } }),
        RetailInventory.countDocuments({ storeId, status: 'available' }),
        RetailInventory.countDocuments({ storeId, status: 'reserved' })
      ]);

      await Store.findByIdAndUpdate(storeId, {
        'inventory.totalUnits': total,
        'inventory.activeMediaUnits': active,
        'inventory.availableUnits': available,
        'inventory.reservedUnits': reserved
      });
    } catch (error) {
      logger.error(`Error updating store inventory counts for ${storeId}:`, error);
    }
  }

  private calculateDaysAvailable(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;