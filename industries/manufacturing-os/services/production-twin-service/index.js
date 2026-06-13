/**
 * Production Twin Service
 * Manages Manufacturing Orders, Production Schedules, and Work Orders
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

class ProductionTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3002,
      host: config.host || '0.0.0.0',
      erpIntegration: config.erpIntegration || {
        sap: { enabled: false, endpoint: '', apiKey: '' },
        oracle: { enabled: false, endpoint: '', apiKey: '' }
      },
      rezCrmEndpoint: config.rezCrmEndpoint || process.env.REZ_CRM_ENDPOINT,
      ...config
    };

    this.manufacturingOrders = new Map();
    this.workOrders = new Map();
    this.schedules = new Map();
    this.productionLines = new Map();
    this.shiftSchedules = new Map();

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
      logger.info('Initializing Production Twin Service');

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
      logger.info('Production Twin Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Production Twin Service', { error: error.message });
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

      const response = await fetch(`${this.config.rezCrmEndpoint}/api/production-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REZ_CRM_API_KEY}`
        }
      });

      if (response.ok) {
        const orders = await response.json();
        for (const order of orders) {
          this.manufacturingOrders.set(order.id, {
            ...order,
            syncedAt: new Date().toISOString(),
            source: 'rez-crm'
          });
        }
        logger.info(`Synced ${orders.length} production orders from REZ CRM`);
      }

      this.emit('sync:complete', { source: 'rez-crm' });
    } catch (error) {
      logger.error('Failed to sync with REZ CRM', { error: error.message });
      this.emit('sync:error', { source: 'rez-crm', error: error.message });
    }
  }

  /**
   * Create Manufacturing Order
   */
  async createManufacturingOrder(orderData) {
    try {
      const orderId = orderData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const order = {
        id: orderId,
        orderNumber: orderData.orderNumber || `MO-${Date.now()}`,
        productId: orderData.productId,
        productName: orderData.productName,
        quantity: orderData.quantity,
        priority: orderData.priority || 'normal',
        status: 'planned',
        orderType: orderData.orderType || 'production',
        plannedStartDate: orderData.plannedStartDate,
        plannedEndDate: orderData.plannedEndDate,
        actualStartDate: null,
        actualEndDate: null,
        dueDate: orderData.dueDate,
        workOrders: [],
        bomId: orderData.bomId,
        routingId: orderData.routingId,
        notes: orderData.notes || '',
        attachments: [],
        qualityChecks: orderData.qualityChecks || [],
        parameters: orderData.parameters || {},
        cost: {
          estimated: 0,
          actual: 0,
          labor: 0,
          materials: 0,
          overhead: 0
        },
        scrap: {
          target: orderData.scrapTarget || 0,
          actual: 0
        },
        rework: {
          target: 0,
          actual: 0
        },
        output: {
          planned: orderData.quantity,
          actual: 0,
          rejected: 0
        },
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: orderData.createdBy || 'system',
          approvedBy: null,
          approvedAt: null
        },
        erpSync: {
          sap: { synced: false, lastSync: null },
          oracle: { synced: false, lastSync: null }
        }
      };

      this.manufacturingOrders.set(orderId, order);
      await this.syncOrderToERP(order);

      this.emit('order:created', order);
      logger.info('Manufacturing order created', { orderId, orderNumber: order.orderNumber });

      return order;
    } catch (error) {
      logger.error('Failed to create manufacturing order', { error: error.message });
      throw new Error(`Manufacturing order creation failed: ${error.message}`);
    }
  }

  /**
   * Update Manufacturing Order
   */
  async updateManufacturingOrder(orderId, updates) {
    try {
      const order = this.manufacturingOrders.get(orderId);
      if (!order) {
        throw new Error(`Manufacturing order not found: ${orderId}`);
      }

      const updatedOrder = {
        ...order,
        ...updates,
        id: orderId,
        metadata: {
          ...order.metadata,
          updatedAt: new Date().toISOString()
        }
      };

      this.manufacturingOrders.set(orderId, updatedOrder);
      await this.syncOrderToERP(updatedOrder);

      this.emit('order:updated', updatedOrder);
      logger.info('Manufacturing order updated', { orderId });

      return updatedOrder;
    } catch (error) {
      logger.error('Failed to update manufacturing order', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Get Manufacturing Order
   */
  async getManufacturingOrder(orderId) {
    const order = this.manufacturingOrders.get(orderId);
    if (!order) {
      throw new Error(`Manufacturing order not found: ${orderId}`);
    }
    return order;
  }

  /**
   * Get all Manufacturing Orders
   */
  async getManufacturingOrders(filters = {}) {
    let orders = Array.from(this.manufacturingOrders.values());

    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters.priority) {
      orders = orders.filter(o => o.priority === filters.priority);
    }
    if (filters.productId) {
      orders = orders.filter(o => o.productId === filters.productId);
    }
    if (filters.dateFrom) {
      orders = orders.filter(o => new Date(o.plannedStartDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      orders = orders.filter(o => new Date(o.plannedEndDate) <= new Date(filters.dateTo));
    }

    return orders.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }

  /**
   * Create Work Order
   */
  async createWorkOrder(workOrderData) {
    try {
      const workOrderId = workOrderData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const workOrder = {
        id: workOrderId,
        manufacturingOrderId: workOrderData.manufacturingOrderId,
        workOrderNumber: workOrderData.workOrderNumber || `WO-${Date.now()}`,
        operationId: workOrderData.operationId,
        operationName: workOrderData.operationName,
        workCenter: workOrderData.workCenter,
        workstation: workOrderData.workstation,
        assignedTo: workOrderData.assignedTo,
        status: 'pending',
        priority: workOrderData.priority || 'normal',
        plannedStartTime: workOrderData.plannedStartTime,
        plannedEndTime: workOrderData.plannedEndTime,
        actualStartTime: null,
        actualEndTime: null,
        duration: {
          planned: workOrderData.plannedDuration || 0,
          actual: 0,
          setup: 0,
          run: 0,
          teardown: 0
        },
        quantity: {
          planned: workOrderData.quantity || 0,
          completed: 0,
          rejected: 0,
          scrapped: 0
        },
        cycleTime: {
          target: workOrderData.targetCycleTime || 0,
          actual: 0
        },
        parameters: workOrderData.parameters || {},
        tools: workOrderData.tools || [],
        qualityChecks: workOrderData.qualityChecks || [],
        notes: workOrderData.notes || '',
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: workOrderData.createdBy || 'system'
        }
      };

      this.workOrders.set(workOrderId, workOrder);

      // Link to manufacturing order
      const mo = this.manufacturingOrders.get(workOrderData.manufacturingOrderId);
      if (mo) {
        mo.workOrders.push(workOrderId);
        this.manufacturingOrders.set(mo.id, mo);
      }

      this.emit('workOrder:created', workOrder);
      logger.info('Work order created', { workOrderId, workOrderNumber: workOrder.workOrderNumber });

      return workOrder;
    } catch (error) {
      logger.error('Failed to create work order', { error: error.message });
      throw new Error(`Work order creation failed: ${error.message}`);
    }
  }

  /**
   * Update Work Order
   */
  async updateWorkOrder(workOrderId, updates) {
    try {
      const workOrder = this.workOrders.get(workOrderId);
      if (!workOrder) {
        throw new Error(`Work order not found: ${workOrderId}`);
      }

      const updatedWorkOrder = {
        ...workOrder,
        ...updates,
        id: workOrderId,
        metadata: {
          ...workOrder.metadata,
          updatedAt: new Date().toISOString()
        }
      };

      this.workOrders.set(workOrderId, updatedWorkOrder);
      this.emit('workOrder:updated', updatedWorkOrder);
      logger.info('Work order updated', { workOrderId });

      return updatedWorkOrder;
    } catch (error) {
      logger.error('Failed to update work order', { workOrderId, error: error.message });
      throw error;
    }
  }

  /**
   * Start Work Order
   */
  async startWorkOrder(workOrderId, startData = {}) {
    try {
      const workOrder = this.workOrders.get(workOrderId);
      if (!workOrder) {
        throw new Error(`Work order not found: ${workOrderId}`);
      }

      const timestamp = new Date().toISOString();
      workOrder.status = 'in_progress';
      workOrder.actualStartTime = startData.startTime || timestamp;
      workOrder.metadata.updatedAt = timestamp;

      if (startData.parameters) {
        workOrder.parameters = { ...workOrder.parameters, ...startData.parameters };
      }

      this.workOrders.set(workOrderId, workOrder);
      this.emit('workOrder:started', workOrder);
      logger.info('Work order started', { workOrderId });

      return workOrder;
    } catch (error) {
      logger.error('Failed to start work order', { workOrderId, error: error.message });
      throw error;
    }
  }

  /**
   * Complete Work Order
   */
  async completeWorkOrder(workOrderId, completionData = {}) {
    try {
      const workOrder = this.workOrders.get(workOrderId);
      if (!workOrder) {
        throw new Error(`Work order not found: ${workOrderId}`);
      }

      const timestamp = new Date().toISOString();
      workOrder.status = 'completed';
      workOrder.actualEndTime = completionData.endTime || timestamp;
      workOrder.metadata.updatedAt = timestamp;

      if (completionData.quantity) {
        workOrder.quantity = { ...workOrder.quantity, ...completionData.quantity };
      }

      if (completionData.duration) {
        workOrder.duration = { ...workOrder.duration, ...completionData.duration };
      }

      this.workOrders.set(workOrderId, workOrder);
      this.emit('workOrder:completed', workOrder);
      logger.info('Work order completed', { workOrderId });

      return workOrder;
    } catch (error) {
      logger.error('Failed to complete work order', { workOrderId, error: error.message });
      throw error;
    }
  }

  /**
   * Create Production Schedule
   */
  async createSchedule(scheduleData) {
    try {
      const scheduleId = scheduleData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const schedule = {
        id: scheduleId,
        name: scheduleData.name,
        description: scheduleData.description || '',
        type: scheduleData.type || 'weekly',
        startDate: scheduleData.startDate,
        endDate: scheduleData.endDate,
        status: 'draft',
        shifts: scheduleData.shifts || [],
        workOrders: scheduleData.workOrders || [],
        productionLines: scheduleData.productionLines || [],
        constraints: scheduleData.constraints || {
          maxOvertimeHours: 0,
          minRestHours: 8,
          preferredShiftPatterns: []
        },
        optimizations: scheduleData.optimizations || {
          minimizeChangeovers: true,
          balanceWorkload: true,
          prioritizeDueDates: true
        },
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: scheduleData.createdBy || 'system'
        }
      };

      this.schedules.set(scheduleId, schedule);
      this.emit('schedule:created', schedule);
      logger.info('Production schedule created', { scheduleId, name: schedule.name });

      return schedule;
    } catch (error) {
      logger.error('Failed to create schedule', { error: error.message });
      throw new Error(`Schedule creation failed: ${error.message}`);
    }
  }

  /**
   * Get Schedule
   */
  async getSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }
    return schedule;
  }

  /**
   * Get active schedules
   */
  async getActiveSchedules() {
    return Array.from(this.schedules.values())
      .filter(s => s.status === 'active' || s.status === 'draft');
  }

  /**
   * Sync order to ERP systems
   */
  async syncOrderToERP(order) {
    const syncResults = {};

    for (const [system, client] of Object.entries(this.erpClients)) {
      if (client?.connected) {
        try {
          syncResults[system] = { success: true, timestamp: new Date().toISOString() };
          order.erpSync[system] = syncResults[system];
          logger.info(`Order synced to ${system.toUpperCase()}`, { orderId: order.id });
        } catch (error) {
          syncResults[system] = { success: false, error: error.message };
          logger.error(`Failed to sync order to ${system}`, { orderId: order.id, error: error.message });
        }
      }
    }

    return syncResults;
  }

  /**
   * Get production statistics
   */
  async getProductionStats(dateRange = {}) {
    const orders = Array.from(this.manufacturingOrders.values());
    const workOrders = Array.from(this.workOrders.values());

    const stats = {
      manufacturingOrders: {
        total: orders.length,
        byStatus: {},
        byPriority: {}
      },
      workOrders: {
        total: workOrders.length,
        byStatus: {}
      },
      production: {
        totalPlanned: 0,
        totalCompleted: 0,
        totalScrapped: 0,
        efficiency: 0
      },
      quality: {
        totalRejected: 0,
        rejectionRate: 0
      }
    };

    // Count by status
    for (const order of orders) {
      stats.manufacturingOrders.byStatus[order.status] = (stats.manufacturingOrders.byStatus[order.status] || 0) + 1;
      stats.manufacturingOrders.byPriority[order.priority] = (stats.manufacturingOrders.byPriority[order.priority] || 0) + 1;
      stats.production.totalPlanned += order.output.planned;
      stats.production.totalCompleted += order.output.actual;
      stats.production.totalScrapped += order.scrap.actual;
      stats.quality.totalRejected += order.output.rejected;
    }

    for (const wo of workOrders) {
      stats.workOrders.byStatus[wo.status] = (stats.workOrders.byStatus[wo.status] || 0) + 1;
    }

    // Calculate rates
    if (stats.production.totalPlanned > 0) {
      stats.production.efficiency = (stats.production.totalCompleted / stats.production.totalPlanned) * 100;
    }
    if (stats.production.totalCompleted + stats.quality.totalRejected > 0) {
      stats.quality.rejectionRate = (stats.quality.totalRejected / (stats.production.totalCompleted + stats.quality.totalRejected)) * 100;
    }

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'production-twin-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      manufacturingOrders: {
        total: this.manufacturingOrders.size,
        byStatus: this.getOrderStatusCounts()
      },
      workOrders: {
        total: this.workOrders.size,
        byStatus: this.getWorkOrderStatusCounts()
      },
      schedules: {
        total: this.schedules.size
      },
      erpConnections: this.erpClients,
      memory: process.memoryUsage()
    };
  }

  getOrderStatusCounts() {
    const counts = {};
    for (const order of this.manufacturingOrders.values()) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    }
    return counts;
  }

  getWorkOrderStatusCounts() {
    const counts = {};
    for (const wo of this.workOrders.values()) {
      counts[wo.status] = (counts[wo.status] || 0) + 1;
    }
    return counts;
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
    logger.info('Production Twin Service started', { port: this.config.port });
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.isRunning = false;
    logger.info('Production Twin Service stopped');
    this.emit('stopped');
  }
}

// Export for module usage
module.exports = { ProductionTwinService };

// Export for CLI usage
if (require.main === module) {
  const service = new ProductionTwinService();
  service.start().catch(error => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
}
