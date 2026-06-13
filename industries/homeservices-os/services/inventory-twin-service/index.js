/**
 * Inventory Twin Service
 * Manages parts, supplies, equipment, and warehouse operations
 * Integrates with Housecall Pro and Jobber via REZ CRM
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class InventoryTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3004,
      crmProvider: config.crmProvider || 'housecallpro',
      apiKeys: {
        housecallpro: config.apiKeys?.housecallpro,
        jobber: config.apiKeys?.jobber
      },
      lowStockThreshold: config.lowStockThreshold || 10,
      reorderPoint: config.reorderPoint || 5
    };

    this.inventory = new Map();
    this.warehouses = new Map();
    this.suppliers = new Map();
    this.transactions = new Map();
    this.purchaseOrders = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: ${msg}`, meta)
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    this.logger.info('Initializing Inventory Twin Service');
    try {
      await this.syncFromCRM();
      this.setupDefaultWarehouses();
      this.logger.info('Inventory Twin Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Inventory Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup default warehouse locations
   */
  setupDefaultWarehouses() {
    const defaultWarehouse = {
      id: 'main',
      name: 'Main Warehouse',
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      isDefault: true,
      capacity: 10000,
      currentUtilization: 0
    };
    this.warehouses.set('main', defaultWarehouse);
  }

  /**
   * Sync inventory data from CRM
   */
  async syncFromCRM() {
    this.logger.info('Syncing inventory data from CRM', { provider: this.config.crmProvider });

    try {
      if (this.config.crmProvider === 'housecallpro') {
        await this.syncFromHousecallPro();
      } else if (this.config.crmProvider === 'jobber') {
        await this.syncFromJobber();
      }
      this.emit('sync:complete', { provider: this.config.crmProvider });
    } catch (error) {
      this.emit('sync:error', { error: error.message });
      throw error;
    }
  }

  async syncFromHousecallPro() {
    // Housecall Pro inventory/products API
    this.logger.info('Housecall Pro inventory sync - implement actual API');
  }

  async syncFromJobber() {
    // Jobber products/inventory API
    this.logger.info('Jobber inventory sync - implement actual API');
  }

  /**
   * Add inventory item
   */
  async addItem(itemData) {
    const itemId = itemData.id || uuidv4();
    const item = {
      id: itemId,
      sku: itemData.sku || this.generateSKU(itemData),
      status: 'active',
      quantity: itemData.initialQuantity || 0,
      reservedQuantity: 0,
      availableQuantity: itemData.initialQuantity || 0,
      reorderPoint: itemData.reorderPoint || this.config.reorderPoint,
      reorderQuantity: itemData.reorderQuantity || 10,
      warehouseId: itemData.warehouseId || 'main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRestockedAt: null,
      ...itemData
    };

    this.validateItemData(item);
    this.inventory.set(itemId, item);

    this.logger.info('Inventory item added', { itemId, sku: item.sku, name: item.name });
    this.emit('inventory:item:added', item);

    await this.syncToCRM(item);

    return item;
  }

  /**
   * Generate SKU from item data
   */
  generateSKU(item) {
    const category = (item.category || 'misc').substring(0, 3).toUpperCase();
    const name = (item.name || 'item').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${category}-${name}-${random}`;
  }

  /**
   * Validate item data
   */
  validateItemData(item) {
    if (!item.name) {
      throw new Error('Item name is required');
    }
    if (!item.category) {
      throw new Error('Item category is required');
    }
    if (item.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
  }

  /**
   * Get item by ID
   */
  async getItem(itemId) {
    return this.inventory.get(itemId) || null;
  }

  /**
   * Get item by SKU
   */
  async getItemBySKU(sku) {
    for (const item of this.inventory.values()) {
      if (item.sku === sku) return item;
    }
    return null;
  }

  /**
   * Update item
   */
  async updateItem(itemId, updates) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const updatedItem = {
      ...item,
      ...updates,
      id: itemId,
      updatedAt: new Date().toISOString()
    };

    this.inventory.set(itemId, updatedItem);
    this.logger.info('Inventory item updated', { itemId });

    this.emit('inventory:item:updated', updatedItem);
    await this.syncToCRM(updatedItem);

    return updatedItem;
  }

  /**
   * Adjust inventory quantity
   */
  async adjustQuantity(itemId, adjustment, reason, transactionData = {}) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const previousQuantity = item.quantity;
    const newQuantity = previousQuantity + adjustment;

    if (newQuantity < 0) {
      throw new Error(`Insufficient inventory. Current: ${previousQuantity}, Adjustment: ${adjustment}`);
    }

    item.quantity = newQuantity;
    item.reservedQuantity = Math.min(item.reservedQuantity, newQuantity);
    item.availableQuantity = newQuantity - item.reservedQuantity;
    item.updatedAt = new Date().toISOString();

    if (adjustment > 0) {
      item.lastRestockedAt = new Date().toISOString();
    }

    this.inventory.set(itemId, item);

    // Record transaction
    const transactionId = uuidv4();
    const transaction = {
      id: transactionId,
      itemId,
      type: adjustment > 0 ? 'adjustment_in' : 'adjustment_out',
      quantity: Math.abs(adjustment),
      previousQuantity,
      newQuantity,
      reason,
      performedBy: transactionData.performedBy,
      jobId: transactionData.jobId,
      technicianId: transactionData.technicianId,
      timestamp: new Date().toISOString()
    };

    this.transactions.set(transactionId, transaction);

    this.logger.info('Inventory adjusted', {
      itemId,
      previousQuantity,
      newQuantity,
      reason
    });

    this.emit('inventory:adjusted', { item, transaction });

    // Check stock levels
    await this.checkStockLevels(itemId);

    return { item, transaction };
  }

  /**
   * Reserve inventory for a job
   */
  async reserveItem(itemId, quantity, jobId) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    if (item.availableQuantity < quantity) {
      throw new Error(`Insufficient available quantity. Available: ${item.availableQuantity}, Requested: ${quantity}`);
    }

    item.reservedQuantity += quantity;
    item.availableQuantity = item.quantity - item.reservedQuantity;
    item.updatedAt = new Date().toISOString();

    this.inventory.set(itemId, item);

    this.logger.info('Inventory reserved', { itemId, quantity, jobId });
    this.emit('inventory:reserved', { itemId, quantity, jobId });

    return item;
  }

  /**
   * Release reserved inventory
   */
  async releaseReservation(itemId, quantity, jobId) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);
    item.availableQuantity = item.quantity - item.reservedQuantity;
    item.updatedAt = new Date().toISOString();

    this.inventory.set(itemId, item);

    this.logger.info('Inventory reservation released', { itemId, quantity, jobId });
    this.emit('inventory:released', { itemId, quantity, jobId });

    return item;
  }

  /**
   * Consume inventory (mark as used on a job)
   */
  async consumeItem(itemId, quantity, jobId, technicianId) {
    const item = this.inventory.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    if (item.quantity < quantity) {
      throw new Error(`Insufficient inventory. Current: ${item.quantity}, Requested: ${quantity}`);
    }

    const transactionId = uuidv4();
    const transaction = {
      id: transactionId,
      itemId,
      type: 'consumption',
      quantity,
      previousQuantity: item.quantity,
      newQuantity: item.quantity - quantity,
      jobId,
      technicianId,
      timestamp: new Date().toISOString()
    };

    item.quantity -= quantity;
    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);
    item.availableQuantity = item.quantity - item.reservedQuantity;
    item.updatedAt = new Date().toISOString();

    this.inventory.set(itemId, item);
    this.transactions.set(transactionId, transaction);

    this.logger.info('Inventory consumed', { itemId, quantity, jobId });
    this.emit('inventory:consumed', { item, transaction });

    await this.checkStockLevels(itemId);

    return { item, transaction };
  }

  /**
   * Check stock levels and emit alerts
   */
  async checkStockLevels(itemId) {
    const item = this.inventory.get(itemId);
    if (!item) return;

    if (item.quantity <= 0) {
      this.emit('inventory:out_of_stock', { item });
      this.logger.warn('Item out of stock', { itemId, name: item.name });
    } else if (item.quantity <= item.reorderPoint) {
      this.emit('inventory:low_stock', { item, reorderPoint: item.reorderPoint });
      this.logger.warn('Item low on stock', {
        itemId,
        name: item.name,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint
      });
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    const lowStock = [];

    for (const item of this.inventory.values()) {
      if (item.status === 'active' && item.quantity <= item.reorderPoint) {
        lowStock.push(item);
      }
    }

    return lowStock.sort((a, b) => a.quantity - b.quantity);
  }

  /**
   * Get out of stock items
   */
  async getOutOfStockItems() {
    return Array.from(this.inventory.values()).filter(
      item => item.status === 'active' && item.quantity <= 0
    );
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(orderData) {
    const orderId = uuidv4();
    const order = {
      id: orderId,
      status: 'draft',
      items: [],
      totalAmount: 0,
      supplierId: orderData.supplierId,
      warehouseId: orderData.warehouseId || 'main',
      expectedDelivery: orderData.expectedDelivery,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null,
      receivedAt: null,
      ...orderData
    };

    this.purchaseOrders.set(orderId, order);

    this.logger.info('Purchase order created', { orderId });
    this.emit('purchaseorder:created', order);

    return order;
  }

  /**
   * Add item to purchase order
   */
  async addToPurchaseOrder(orderId, itemData) {
    const order = this.purchaseOrders.get(orderId);
    if (!order) {
      throw new Error(`Purchase order not found: ${orderId}`);
    }

    if (order.status !== 'draft') {
      throw new Error('Can only add items to draft purchase orders');
    }

    const item = {
      itemId: itemData.itemId,
      quantity: itemData.quantity,
      unitCost: itemData.unitCost || 0,
      totalCost: itemData.quantity * (itemData.unitCost || 0)
    };

    order.items.push(item);
    order.totalAmount = order.items.reduce((sum, i) => sum + i.totalCost, 0);
    order.updatedAt = new Date().toISOString();

    this.purchaseOrders.set(orderId, order);

    this.logger.info('Item added to purchase order', { orderId, itemId: itemData.itemId });

    return order;
  }

  /**
   * Submit purchase order
   */
  async submitPurchaseOrder(orderId) {
    const order = this.purchaseOrders.get(orderId);
    if (!order) {
      throw new Error(`Purchase order not found: ${orderId}`);
    }

    if (order.items.length === 0) {
      throw new Error('Cannot submit empty purchase order');
    }

    order.status = 'submitted';
    order.submittedAt = new Date().toISOString();
    this.purchaseOrders.set(orderId, order);

    this.logger.info('Purchase order submitted', { orderId, totalAmount: order.totalAmount });
    this.emit('purchaseorder:submitted', order);

    return order;
  }

  /**
   * Receive purchase order
   */
  async receivePurchaseOrder(orderId, receivedItems = []) {
    const order = this.purchaseOrders.get(orderId);
    if (!order) {
      throw new Error(`Purchase order not found: ${orderId}`);
    }

    // Update inventory for each received item
    for (const received of receivedItems) {
      const item = this.inventory.get(received.itemId);
      if (item) {
        await this.adjustQuantity(
          received.itemId,
          received.quantity,
          'Purchase order received',
          { jobId: orderId }
        );
      }
    }

    order.status = 'received';
    order.receivedAt = new Date().toISOString();
    order.receivedItems = receivedItems;
    this.purchaseOrders.set(orderId, order);

    this.logger.info('Purchase order received', { orderId });
    this.emit('purchaseorder:received', order);

    return order;
  }

  /**
   * Add supplier
   */
  async addSupplier(supplierData) {
    const supplierId = uuidv4();
    const supplier = {
      id: supplierId,
      status: 'active',
      rating: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
      ...supplierData
    };

    this.suppliers.set(supplierId, supplier);
    this.logger.info('Supplier added', { supplierId, name: supplier.name });

    return supplier;
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(supplierId) {
    return this.suppliers.get(supplierId) || null;
  }

  /**
   * Add warehouse
   */
  async addWarehouse(warehouseData) {
    const warehouseId = warehouseData.id || uuidv4();
    const warehouse = {
      id: warehouseId,
      status: 'active',
      capacity: warehouseData.capacity || 10000,
      currentUtilization: 0,
      createdAt: new Date().toISOString(),
      ...warehouseData
    };

    this.warehouses.set(warehouseId, warehouse);
    this.logger.info('Warehouse added', { warehouseId, name: warehouse.name });

    return warehouse;
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouse(warehouseId) {
    return this.warehouses.get(warehouseId) || null;
  }

  /**
   * Search inventory
   */
  async searchInventory(criteria = {}) {
    const results = [];

    for (const item of this.inventory.values()) {
      if (item.status === 'deleted') continue;

      let match = true;

      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        match = (
          item.name?.toLowerCase().includes(query) ||
          item.sku?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );
      }

      if (criteria.category && item.category !== criteria.category) match = false;
      if (criteria.status && item.status !== criteria.status) match = false;
      if (criteria.warehouseId && item.warehouseId !== criteria.warehouseId) match = false;

      if (criteria.inStockOnly && item.quantity <= 0) match = false;
      if (criteria.lowStockOnly && item.quantity > (item.reorderPoint || this.config.reorderPoint)) match = false;

      if (match) results.push(item);
    }

    return {
      data: results,
      total: results.length,
      criteria
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(itemId, options = {}) {
    let transactions = Array.from(this.transactions.values())
      .filter(t => t.itemId === itemId);

    if (options.type) {
      transactions = transactions.filter(t => t.type === options.type);
    }
    if (options.startDate) {
      transactions = transactions.filter(t =>
        new Date(t.timestamp) >= new Date(options.startDate)
      );
    }
    if (options.endDate) {
      transactions = transactions.filter(t =>
        new Date(t.timestamp) <= new Date(options.endDate)
      );
    }

    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      data: transactions,
      total: transactions.length,
      itemId
    };
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics() {
    const items = Array.from(this.inventory.values()).filter(i => i.status !== 'deleted');

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) =>
      sum + (item.quantity * (item.unitCost || 0)), 0
    );
    const lowStockCount = items.filter(i => i.quantity <= i.reorderPoint).length;
    const outOfStockCount = items.filter(i => i.quantity <= 0).length;

    const categoryBreakdown = {};
    for (const item of items) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    }

    return {
      summary: {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        inStockCount: totalItems - outOfStockCount
      },
      byCategory: categoryBreakdown,
      recentTransactions: Array.from(this.transactions.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    };
  }

  /**
   * Sync to CRM
   */
  async syncToCRM(item) {
    try {
      if (this.config.crmProvider === 'housecallpro') {
        this.logger.info('Syncing to Housecall Pro', { itemId: item.id });
      } else if (this.config.crmProvider === 'jobber') {
        this.logger.info('Syncing to Jobber', { itemId: item.id });
      }
    } catch (error) {
      this.logger.error('CRM sync failed', { error: error.message });
    }
  }

  /**
   * Start the service
   */
  start() {
    return {
      service: 'InventoryTwinService',
      status: 'running',
      port: this.config.port,
      items: this.inventory.size,
      warehouses: this.warehouses.size,
      suppliers: this.suppliers.size
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Inventory Twin Service');
    this.removeAllListeners();
    return { success: true, service: 'InventoryTwinService' };
  }
}

module.exports = { InventoryTwinService };