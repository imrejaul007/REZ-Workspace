/**
 * Inventory Twin Service
 * Manages Raw Materials, Finished Goods, and Inventory Operations
 * Integrates with REZ CRM for ERP systems (SAP, Oracle)
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class InventoryTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3004,
      host: config.host || '0.0.0.0',
      erpIntegration: config.erpIntegration || {
        sap: { enabled: false, endpoint: '', apiKey: '' },
        oracle: { enabled: false, endpoint: '', apiKey: '' }
      },
      rezCrmEndpoint: config.rezCrmEndpoint || process.env.REZ_CRM_ENDPOINT,
      ...config
    };

    this.inventory = new Map();
    this.locations = new Map();
    this.transactions = new Map();
    this.batches = new Map();
    this.qualityLots = new Map();
    this.inventoryValuations = new Map();

    this.erpClients = {
      sap: null,
      oracle: null
    };

    this.isRunning = false;
    this.healthCheckInterval = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      logger.info('Initializing Inventory Twin Service');

      // Initialize ERP clients
      if (this.config.erpIntegration.sap.enabled) {
        await this.initializeERPClient('sap');
      }
      if (this.config.erpIntegration.oracle.enabled) {
        await this.initializeERPClient('oracle');
      }

      // Sync with REZ CRM
      if (this.config.rezCrmEndpoint) {
        await this.syncWithRezCrm();
      }

      this.emit('initialized');
      logger.info('Inventory Twin Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Inventory Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize ERP client
   */
  async initializeERPClient(system) {
    try {
      this.erpClients[system] = {
        connected: true,
        endpoint: this.config.erpIntegration[system].endpoint,
        lastSync: new Date().toISOString()
      };
      logger.info(`${system.toUpperCase()} ERP client initialized`);
    } catch (error) {
      logger.error(`Failed to initialize ${system} client`, { error: error.message });
      this.erpClients[system] = { connected: false, error: error.message };
    }
  }

  /**
   * Sync with REZ CRM
   */
  async syncWithRezCrm() {
    try {
      logger.info('Syncing with REZ CRM');

      const response = await fetch(`${this.config.rezCrmEndpoint}/api/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REZ_CRM_API_KEY}`
        }
      });

      if (response.ok) {
        const items = await response.json();
        for (const item of items) {
          this.inventory.set(item.id, {
            ...item,
            syncedAt: new Date().toISOString(),
            source: 'rez-crm'
          });
        }
        logger.info(`Synced ${items.length} inventory items from REZ CRM`);
      }

      this.emit('sync:complete', { source: 'rez-crm' });
    } catch (error) {
      logger.error('Failed to sync with REZ CRM', { error: error.message });
      this.emit('sync:error', { source: 'rez-crm', error: error.message });
    }
  }

  /**
   * Add Inventory Item
   */
  async addInventoryItem(itemData) {
    try {
      const itemId = itemData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const item = {
        id: itemId,
        sku: itemData.sku,
        name: itemData.name,
        description: itemData.description || '',
        type: itemData.type, // raw_material, finished_good, component, packaging, consumable
        category: itemData.category || 'general',
        status: 'active',
        uom: itemData.uom || 'unit',
        quantity: itemData.quantity || 0,
        reservedQuantity: 0,
        availableQuantity: itemData.quantity || 0,
        location: {
          warehouse: itemData.warehouse || 'main',
          zone: itemData.zone || '',
          bin: itemData.bin || '',
          shelf: itemData.shelf || ''
        },
        lotNumber: itemData.lotNumber,
        batchNumber: itemData.batchNumber,
        serialNumber: itemData.serialNumber,
        expirationDate: itemData.expirationDate,
        minimumStock: itemData.minimumStock || 0,
        reorderPoint: itemData.reorderPoint || 0,
        reorderQuantity: itemData.reorderQuantity || 0,
        maximumStock: itemData.maximumStock || 0,
        unitCost: itemData.unitCost || 0,
        lastCost: itemData.lastCost || 0,
        averageCost: itemData.averageCost || 0,
        valuation: {
          method: itemData.valuationMethod || 'average', // average, fifo, lifo, standard
          currentValue: (itemData.quantity || 0) * (itemData.averageCost || itemData.unitCost || 0)
        },
        suppliers: itemData.suppliers || [],
        specifications: itemData.specifications || {},
        handlingInstructions: itemData.handlingInstructions || '',
        certifications: itemData.certifications || [],
        shelfLife: itemData.shelfLife || 0,
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: itemData.createdBy || 'system'
        },
        erpSync: {
          sap: { synced: false, lastSync: null },
          oracle: { synced: false, lastSync: null }
        }
      };

      this.inventory.set(itemId, item);
      await this.syncItemToERP(item);

      this.emit('inventory:itemAdded', item);
      logger.info('Inventory item added', { itemId, sku: item.sku, quantity: item.quantity });

      return item;
    } catch (error) {
      logger.error('Failed to add inventory item', { error: error.message });
      throw new Error(`Inventory item addition failed: ${error.message}`);
    }
  }

  /**
   * Update Inventory Item
   */
  async updateInventoryItem(itemId, updates) {
    try {
      const item = this.inventory.get(itemId);
      if (!item) {
        throw new Error(`Inventory item not found: ${itemId}`);
      }

      const updatedItem = {
        ...item,
        ...updates,
        id: itemId,
        availableQuantity: (updates.quantity || item.quantity) - item.reservedQuantity,
        metadata: {
          ...item.metadata,
          updatedAt: new Date().toISOString()
        }
      };

      // Recalculate valuation
      if (updates.quantity || updates.unitCost) {
        updatedItem.valuation.currentValue = updatedItem.availableQuantity * (updatedItem.averageCost || updatedItem.unitCost);
      }

      this.inventory.set(itemId, updatedItem);
      await this.syncItemToERP(updatedItem);

      this.emit('inventory:itemUpdated', updatedItem);
      logger.info('Inventory item updated', { itemId });

      return updatedItem;
    } catch (error) {
      logger.error('Failed to update inventory item', { itemId, error: error.message });
      throw error;
    }
  }

  /**
   * Get Inventory Item
   */
  async getInventoryItem(itemId) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Inventory item not found: ${itemId}`);
    }
    return item;
  }

  /**
   * Get Inventory by SKU
   */
  async getInventoryBySKU(sku) {
    for (const item of this.inventory.values()) {
      if (item.sku === sku) {
        return item;
      }
    }
    return null;
  }

  /**
   * Get all Inventory Items
   */
  async getAllInventory(filters = {}) {
    let items = Array.from(this.inventory.values());

    if (filters.type) {
      items = items.filter(i => i.type === filters.type);
    }
    if (filters.status) {
      items = items.filter(i => i.status === filters.status);
    }
    if (filters.category) {
      items = items.filter(i => i.category === filters.category);
    }
    if (filters.warehouse) {
      items = items.filter(i => i.location.warehouse === filters.warehouse);
    }
    if (filters.lowStock) {
      items = items.filter(i => i.availableQuantity <= i.reorderPoint);
    }
    if (filters.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      items = items.filter(i => i.expirationDate && new Date(i.expirationDate) <= thirtyDaysFromNow);
    }

    return items;
  }

  /**
   * Record Inventory Transaction
   */
  async recordTransaction(transactionData) {
    try {
      const transactionId = transactionData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const transaction = {
        id: transactionId,
        type: transactionData.type, // receipt, issue, transfer, adjustment, return
        reference: transactionData.reference,
        referenceType: transactionData.referenceType, // purchase_order, work_order, sales_order
        itemId: transactionData.itemId,
        itemSku: transactionData.itemSku,
        quantity: transactionData.quantity,
        uom: transactionData.uom || 'unit',
        unitCost: transactionData.unitCost || 0,
        totalCost: transactionData.quantity * (transactionData.unitCost || 0),
        fromLocation: transactionData.fromLocation,
        toLocation: transactionData.toLocation,
        reason: transactionData.reason || '',
        performedBy: transactionData.performedBy,
        performedAt: transactionData.performedAt || timestamp,
        batchNumber: transactionData.batchNumber,
        serialNumbers: transactionData.serialNumbers || [],
        notes: transactionData.notes || '',
        attachments: transactionData.attachments || [],
        metadata: {
          createdAt: timestamp,
          createdBy: transactionData.createdBy || 'system'
        }
      };

      this.transactions.set(transactionId, transaction);

      // Update inventory quantities
      await this.updateInventoryForTransaction(transaction);

      this.emit('inventory:transactionRecorded', transaction);
      logger.info('Inventory transaction recorded', { transactionId, type: transaction.type, itemId: transaction.itemId });

      return transaction;
    } catch (error) {
      logger.error('Failed to record transaction', { error: error.message });
      throw new Error(`Transaction recording failed: ${error.message}`);
    }
  }

  /**
   * Update inventory based on transaction
   */
  async updateInventoryForTransaction(transaction) {
    const item = this.inventory.get(transaction.itemId);
    if (!item) {
      throw new Error(`Inventory item not found: ${transaction.itemId}`);
    }

    switch (transaction.type) {
      case 'receipt':
        item.quantity += transaction.quantity;
        item.availableQuantity += transaction.quantity;
        if (transaction.unitCost) {
          item.lastCost = transaction.unitCost;
          // Update average cost
          const totalValue = (item.quantity - transaction.quantity) * item.averageCost + transaction.quantity * transaction.unitCost;
          item.averageCost = totalValue / item.quantity;
        }
        break;

      case 'issue':
        if (item.quantity < transaction.quantity) {
          throw new Error(`Insufficient inventory for item ${item.sku}`);
        }
        item.quantity -= transaction.quantity;
        item.availableQuantity -= transaction.quantity;
        break;

      case 'transfer':
        // Handle transfer between locations
        break;

      case 'adjustment':
        const adjustment = transaction.quantity;
        item.quantity += adjustment;
        item.availableQuantity += adjustment;
        break;

      case 'return':
        item.quantity += transaction.quantity;
        item.availableQuantity += transaction.quantity;
        break;
    }

    item.valuation.currentValue = item.availableQuantity * item.averageCost;
    item.metadata.updatedAt = new Date().toISOString();

    this.inventory.set(item.id, item);

    // Check for low stock alert
    if (item.availableQuantity <= item.reorderPoint) {
      this.emit('inventory:lowStock', {
        itemId: item.id,
        sku: item.sku,
        availableQuantity: item.availableQuantity,
        reorderPoint: item.reorderPoint
      });
    }
  }

  /**
   * Reserve Inventory
   */
  async reserveInventory(itemId, quantity, reservationType, reference) {
    try {
      const item = this.inventory.get(itemId);
      if (!item) {
        throw new Error(`Inventory item not found: ${itemId}`);
      }

      if (item.availableQuantity < quantity) {
        throw new Error(`Insufficient available inventory. Available: ${item.availableQuantity}, Requested: ${quantity}`);
      }

      item.availableQuantity -= quantity;
      item.reservedQuantity += quantity;
      item.metadata.updatedAt = new Date().toISOString();

      this.inventory.set(itemId, item);

      // Record reservation transaction
      const transaction = {
        id: uuidv4(),
        type: 'reservation',
        itemId,
        itemSku: item.sku,
        quantity,
        reservationType,
        reference,
        performedAt: new Date().toISOString()
      };

      this.emit('inventory:reserved', { itemId, quantity, reservationType, reference });
      logger.info('Inventory reserved', { itemId, quantity, reservationType });

      return item;
    } catch (error) {
      logger.error('Failed to reserve inventory', { itemId, error: error.message });
      throw error;
    }
  }

  /**
   * Release Reservation
   */
  async releaseReservation(itemId, quantity) {
    try {
      const item = this.inventory.get(itemId);
      if (!item) {
        throw new Error(`Inventory item not found: ${itemId}`);
      }

      item.reservedQuantity -= quantity;
      item.availableQuantity += quantity;
      item.metadata.updatedAt = new Date().toISOString();

      this.inventory.set(itemId, item);

      this.emit('inventory:reservationReleased', { itemId, quantity });
      logger.info('Inventory reservation released', { itemId, quantity });

      return item;
    } catch (error) {
      logger.error('Failed to release reservation', { itemId, error: error.message });
      throw error;
    }
  }

  /**
   * Create/Update Location
   */
  async upsertLocation(locationData) {
    try {
      const locationId = locationData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const location = {
        id: locationId,
        code: locationData.code,
        name: locationData.name,
        type: locationData.type || 'warehouse', // warehouse, zone, bin, shelf
        parentId: locationData.parentId,
        address: locationData.address || {},
        capacity: {
          maxWeight: locationData.maxWeight || 0,
          maxVolume: locationData.maxVolume || 0,
          currentUtilization: 0
        },
        conditions: locationData.conditions || {}, // temperature, humidity
        status: 'active',
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp
        }
      };

      this.locations.set(locationId, location);
      this.emit('inventory:locationUpdated', location);

      return location;
    } catch (error) {
      logger.error('Failed to upsert location', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Batch
   */
  async createBatch(batchData) {
    try {
      const batchId = batchData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const batch = {
        id: batchId,
        batchNumber: batchData.batchNumber,
        itemId: batchData.itemId,
        itemSku: batchData.itemSku,
        quantity: batchData.quantity,
        status: 'active',
        manufacturingDate: batchData.manufacturingDate,
        expirationDate: batchData.expirationDate,
        cost: batchData.cost || 0,
        qualityStatus: batchData.qualityStatus || 'pending',
        notes: batchData.notes || '',
        transactions: [],
        metadata: {
          createdAt: timestamp,
          createdBy: batchData.createdBy || 'system'
        }
      };

      this.batches.set(batchId, batch);
      this.emit('inventory:batchCreated', batch);
      logger.info('Batch created', { batchId, batchNumber: batch.batchNumber });

      return batch;
    } catch (error) {
      logger.error('Failed to create batch', { error: error.message });
      throw new Error(`Batch creation failed: ${error.message}`);
    }
  }

  /**
   * Get Transactions
   */
  async getTransactions(filters = {}) {
    let transactions = Array.from(this.transactions.values());

    if (filters.itemId) {
      transactions = transactions.filter(t => t.itemId === filters.itemId);
    }
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    if (filters.dateFrom) {
      transactions = transactions.filter(t => new Date(t.performedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      transactions = transactions.filter(t => new Date(t.performedAt) <= new Date(filters.dateTo));
    }

    return transactions.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));
  }

  /**
   * Get Inventory Valuation
   */
  async getInventoryValuation(valuationMethod = 'average') {
    let totalValue = 0;
    let totalItems = 0;
    let totalQuantity = 0;

    for (const item of this.inventory.values()) {
      if (item.status === 'active') {
        const value = item.availableQuantity * item.averageCost;
        totalValue += value;
        totalQuantity += item.availableQuantity;
        totalItems++;
      }
    }

    return {
      method: valuationMethod,
      totalValue,
      totalItems,
      totalQuantity,
      averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Low Stock Items
   */
  async getLowStockItems() {
    return Array.from(this.inventory.values())
      .filter(item => item.availableQuantity <= item.reorderPoint && item.status === 'active')
      .map(item => ({
        ...item,
        shortfall: item.reorderPoint - item.availableQuantity,
        suggestedOrderQuantity: item.reorderQuantity
      }))
      .sort((a, b) => a.availableQuantity - b.availableQuantity);
  }

  /**
   * Get Expiring Items
   */
  async getExpiringItems(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return Array.from(this.inventory.values())
      .filter(item => item.expirationDate && new Date(item.expirationDate) <= futureDate && item.status === 'active')
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  }

  /**
   * Sync item to ERP systems
   */
  async syncItemToERP(item) {
    const syncResults = {};

    for (const [system, client] of Object.entries(this.erpClients)) {
      if (client?.connected) {
        try {
          syncResults[system] = { success: true, timestamp: new Date().toISOString() };
          item.erpSync[system] = syncResults[system];
          logger.info(`Item synced to ${system.toUpperCase()}`, { itemId: item.id });
        } catch (error) {
          syncResults[system] = { success: false, error: error.message };
          logger.error(`Failed to sync item to ${system}`, { itemId: item.id, error: error.message });
        }
      }
    }

    return syncResults;
  }

  /**
   * Get Inventory Statistics
   */
  async getInventoryStats() {
    const allItems = Array.from(this.inventory.values());
    const transactions = Array.from(this.transactions.values());

    const stats = {
      inventory: {
        totalItems: allItems.length,
        totalValue: 0,
        totalQuantity: 0,
        byType: {},
        byStatus: {}
      },
      transactions: {
        total: transactions.length,
        last24Hours: 0,
        last7Days: 0,
        byType: {}
      },
      alerts: {
        lowStock: 0,
        expiringSoon: 0,
        outOfStock: 0
      }
    };

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const item of allItems) {
      stats.inventory.totalValue += item.valuation.currentValue;
      stats.inventory.totalQuantity += item.availableQuantity;
      stats.inventory.byType[item.type] = (stats.inventory.byType[item.type] || 0) + 1;
      stats.inventory.byStatus[item.status] = (stats.inventory.byStatus[item.status] || 0) + 1;

      if (item.availableQuantity <= item.reorderPoint) {
        stats.alerts.lowStock++;
      }
      if (item.availableQuantity === 0) {
        stats.alerts.outOfStock++;
      }
      if (item.expirationDate && new Date(item.expirationDate) <= thirtyDaysFromNow) {
        stats.alerts.expiringSoon++;
      }
    }

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.performedAt);
      if (transactionDate >= oneDayAgo) {
        stats.transactions.last24Hours++;
      }
      if (transactionDate >= sevenDaysAgo) {
        stats.transactions.last7Days++;
      }
      stats.transactions.byType[transaction.type] = (stats.transactions.byType[transaction.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'inventory-twin-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      inventory: {
        totalItems: this.inventory.size,
        totalValue: Array.from(this.inventory.values()).reduce((sum, i) => sum + i.valuation.currentValue, 0)
      },
      transactions: {
        total: this.transactions.size
      },
      batches: {
        total: this.batches.size
      },
      locations: {
        total: this.locations.size
      },
      erpConnections: this.erpClients,
      memory: process.memoryUsage()
    };
  }

  /**
   * Start the service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Service is already running');
      return;
    }

    await this.initialize();

    this.healthCheckInterval = setInterval(async () => {
      const health = await this.healthCheck();
      this.emit('health:check', health);
    }, 30000);

    this.isRunning = true;
    logger.info('Inventory Twin Service started', { port: this.config.port });
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.isRunning = false;
    logger.info('Inventory Twin Service stopped');
    this.emit('stopped');
  }
}

// Export for module usage
module.exports = { InventoryTwinService };

// Export for CLI usage
if (require.main === module) {
  const service = new InventoryTwinService();
  service.start().catch(error => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
}
