/**
 * Equipment Twin Service
 * Manages Machines, Equipment, and Maintenance Operations
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

class EquipmentTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3003,
      host: config.host || '0.0.0.0',
      erpIntegration: config.erpIntegration || {
        sap: { enabled: false, endpoint: '', apiKey: '' },
        oracle: { enabled: false, endpoint: '', apiKey: '' }
      },
      rezCrmEndpoint: config.rezCrmEndpoint || process.env.REZ_CRM_ENDPOINT,
      ...config
    };

    this.equipment = new Map();
    this.maintenanceSchedules = new Map();
    this.maintenanceRecords = new Map();
    this.workCenters = new Map();
    this.sensors = new Map();
    this.telemetryData = new Map();

    this.erpClients = {
      sap: null,
      oracle: null
    };

    this.isRunning = false;
    this.healthCheckInterval = null;
    this.telemetryInterval = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      logger.info('Initializing Equipment Twin Service');

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
      logger.info('Equipment Twin Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Equipment Twin Service', { error: error.message });
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

      const response = await fetch(`${this.config.rezCrmEndpoint}/api/equipment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REZ_CRM_API_KEY}`
        }
      });

      if (response.ok) {
        const equipment = await response.json();
        for (const item of equipment) {
          this.equipment.set(item.id, {
            ...item,
            syncedAt: new Date().toISOString(),
            source: 'rez-crm'
          });
        }
        logger.info(`Synced ${equipment.length} equipment items from REZ CRM`);
      }

      this.emit('sync:complete', { source: 'rez-crm' });
    } catch (error) {
      logger.error('Failed to sync with REZ CRM', { error: error.message });
      this.emit('sync:error', { source: 'rez-crm', error: error.message });
    }
  }

  /**
   * Register Equipment
   */
  async registerEquipment(equipmentData) {
    try {
      const equipmentId = equipmentData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const equipment = {
        id: equipmentId,
        assetId: equipmentData.assetId || `ASSET-${Date.now()}`,
        name: equipmentData.name,
        description: equipmentData.description || '',
        type: equipmentData.type,
        category: equipmentData.category || 'general',
        manufacturer: equipmentData.manufacturer,
        model: equipmentData.model,
        serialNumber: equipmentData.serialNumber,
        status: 'available',
        location: {
          facility: equipmentData.facility || 'main',
          area: equipmentData.area || '',
          position: equipmentData.position || ''
        },
        workCenter: equipmentData.workCenter,
        specifications: equipmentData.specifications || {},
        capabilities: equipmentData.capabilities || [],
        parameters: equipmentData.parameters || {},
        purchaseInfo: {
          purchaseDate: equipmentData.purchaseDate,
          purchaseCost: equipmentData.purchaseCost || 0,
          supplier: equipmentData.supplier,
          warrantyEndDate: equipmentData.warrantyEndDate
        },
        usage: {
          totalOperatingHours: 0,
          totalCycles: 0,
          lastCalibration: null,
          nextCalibration: null
        },
        maintenance: {
          lastMaintenance: null,
          nextScheduledMaintenance: null,
          maintenanceHistory: []
        },
        sensors: equipmentData.sensors || [],
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: equipmentData.createdBy || 'system'
        },
        erpSync: {
          sap: { synced: false, lastSync: null },
          oracle: { synced: false, lastSync: null }
        }
      };

      this.equipment.set(equipmentId, equipment);
      await this.syncEquipmentToERP(equipment);

      this.emit('equipment:registered', equipment);
      logger.info('Equipment registered', { equipmentId, name: equipment.name });

      return equipment;
    } catch (error) {
      logger.error('Failed to register equipment', { error: error.message });
      throw new Error(`Equipment registration failed: ${error.message}`);
    }
  }

  /**
   * Update Equipment
   */
  async updateEquipment(equipmentId, updates) {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const updatedEquipment = {
        ...equipment,
        ...updates,
        id: equipmentId,
        metadata: {
          ...equipment.metadata,
          updatedAt: new Date().toISOString()
        }
      };

      this.equipment.set(equipmentId, updatedEquipment);
      await this.syncEquipmentToERP(updatedEquipment);

      this.emit('equipment:updated', updatedEquipment);
      logger.info('Equipment updated', { equipmentId });

      return updatedEquipment;
    } catch (error) {
      logger.error('Failed to update equipment', { equipmentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get Equipment
   */
  async getEquipment(equipmentId) {
    const equipment = this.equipment.get(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment not found: ${equipmentId}`);
    }
    return equipment;
  }

  /**
   * Get all Equipment
   */
  async getAllEquipment(filters = {}) {
    let equipment = Array.from(this.equipment.values());

    if (filters.type) {
      equipment = equipment.filter(e => e.type === filters.type);
    }
    if (filters.status) {
      equipment = equipment.filter(e => e.status === filters.status);
    }
    if (filters.workCenter) {
      equipment = equipment.filter(e => e.workCenter === filters.workCenter);
    }
    if (filters.location) {
      equipment = equipment.filter(e => e.location.facility === filters.location);
    }

    return equipment;
  }

  /**
   * Update Equipment Status
   */
  async updateEquipmentStatus(equipmentId, status, reason = '') {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const timestamp = new Date().toISOString();
      const previousStatus = equipment.status;

      equipment.status = status;
      equipment.metadata.updatedAt = timestamp;

      if (status === 'maintenance') {
        equipment.maintenance.lastMaintenance = timestamp;
      }

      this.equipment.set(equipmentId, equipment);

      this.emit('equipment:statusChanged', {
        equipmentId,
        previousStatus,
        newStatus: status,
        reason,
        timestamp
      });

      logger.info('Equipment status updated', { equipmentId, previousStatus, newStatus: status });
      return equipment;
    } catch (error) {
      logger.error('Failed to update equipment status', { equipmentId, error: error.message });
      throw error;
    }
  }

  /**
   * Create Maintenance Schedule
   */
  async createMaintenanceSchedule(scheduleData) {
    try {
      const scheduleId = scheduleData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const schedule = {
        id: scheduleId,
        equipmentId: scheduleData.equipmentId,
        equipmentName: scheduleData.equipmentName,
        type: scheduleData.type, // preventive, predictive, corrective
        name: scheduleData.name,
        description: scheduleData.description || '',
        status: 'scheduled',
        priority: scheduleData.priority || 'normal',
        frequency: {
          type: scheduleData.frequencyType || 'time', // time, cycles, usage
          interval: scheduleData.interval || 0,
          unit: scheduleData.unit || 'hours'
        },
        tasks: scheduleData.tasks || [],
        estimatedDuration: scheduleData.estimatedDuration || 0,
        estimatedCost: scheduleData.estimatedCost || 0,
        assignedTo: scheduleData.assignedTo,
        parts: scheduleData.parts || [],
        tools: scheduleData.tools || [],
        procedures: scheduleData.procedures || [],
        safetyRequirements: scheduleData.safetyRequirements || [],
        nextDue: scheduleData.nextDue,
        lastCompleted: null,
        completionHistory: [],
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: scheduleData.createdBy || 'system'
        }
      };

      this.maintenanceSchedules.set(scheduleId, schedule);
      this.emit('maintenanceSchedule:created', schedule);
      logger.info('Maintenance schedule created', { scheduleId, name: schedule.name });

      return schedule;
    } catch (error) {
      logger.error('Failed to create maintenance schedule', { error: error.message });
      throw new Error(`Maintenance schedule creation failed: ${error.message}`);
    }
  }

  /**
   * Record Maintenance Activity
   */
  async recordMaintenanceActivity(activityData) {
    try {
      const recordId = activityData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const record = {
        id: recordId,
        equipmentId: activityData.equipmentId,
        scheduleId: activityData.scheduleId,
        type: activityData.type,
        category: activityData.category || 'general',
        status: 'completed',
        description: activityData.description,
        performedBy: activityData.performedBy,
        performedAt: activityData.performedAt || timestamp,
        duration: {
          planned: activityData.plannedDuration || 0,
          actual: activityData.actualDuration || 0
        },
        findings: activityData.findings || [],
        partsReplaced: activityData.partsReplaced || [],
        actions: activityData.actions || [],
        labor: {
          hours: activityData.laborHours || 0,
          cost: activityData.laborCost || 0
        },
        partsCost: activityData.partsCost || 0,
        totalCost: activityData.totalCost || 0,
        workOrderId: activityData.workOrderId,
        signatures: activityData.signatures || {},
        photos: activityData.photos || [],
        notes: activityData.notes || '',
        metadata: {
          createdAt: timestamp,
          createdBy: activityData.createdBy || 'system'
        }
      };

      this.maintenanceRecords.set(recordId, record);

      // Update equipment maintenance info
      const equipment = this.equipment.get(activityData.equipmentId);
      if (equipment) {
        equipment.maintenance.lastMaintenance = timestamp;
        equipment.maintenance.maintenanceHistory.push(recordId);
        this.equipment.set(equipment.id, equipment);
      }

      // Update schedule if linked
      if (activityData.scheduleId) {
        const schedule = this.maintenanceSchedules.get(activityData.scheduleId);
        if (schedule) {
          schedule.lastCompleted = timestamp;
          schedule.completionHistory.push({
            recordId,
            completedAt: timestamp,
            duration: record.duration.actual
          });
          this.maintenanceSchedules.set(schedule.id, schedule);
        }
      }

      this.emit('maintenance:recorded', record);
      logger.info('Maintenance activity recorded', { recordId, equipmentId: record.equipmentId });

      return record;
    } catch (error) {
      logger.error('Failed to record maintenance activity', { error: error.message });
      throw new Error(`Maintenance recording failed: ${error.message}`);
    }
  }

  /**
   * Create Work Center
   */
  async createWorkCenter(workCenterData) {
    try {
      const workCenterId = workCenterData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const workCenter = {
        id: workCenterId,
        code: workCenterData.code,
        name: workCenterData.name,
        description: workCenterData.description || '',
        type: workCenterData.type || 'production',
        location: workCenterData.location,
        equipment: workCenterData.equipment || [],
        personnel: workCenterData.personnel || [],
        shifts: workCenterData.shifts || [],
        capacity: {
          maxCapacity: workCenterData.maxCapacity || 0,
          currentUtilization: 0,
          availableHours: 0
        },
        efficiency: {
          target: workCenterData.targetEfficiency || 100,
          actual: 0
        },
        status: 'active',
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: workCenterData.createdBy || 'system'
        }
      };

      this.workCenters.set(workCenterId, workCenter);
      this.emit('workCenter:created', workCenter);
      logger.info('Work center created', { workCenterId, name: workCenter.name });

      return workCenter;
    } catch (error) {
      logger.error('Failed to create work center', { error: error.message });
      throw new Error(`Work center creation failed: ${error.message}`);
    }
  }

  /**
   * Register Sensor
   */
  async registerSensor(sensorData) {
    try {
      const sensorId = sensorData.id || uuidv4();
      const timestamp = new Date().toISOString();

      const sensor = {
        id: sensorId,
        equipmentId: sensorData.equipmentId,
        name: sensorData.name,
        type: sensorData.type, // temperature, vibration, pressure, etc.
        unit: sensorData.unit,
        precision: sensorData.precision || 0,
        range: {
          min: sensorData.minValue || 0,
          max: sensorData.maxValue || 0
        },
        thresholds: {
          warning: sensorData.warningThreshold,
          critical: sensorData.criticalThreshold
        },
        samplingRate: sensorData.samplingRate || 1000, // ms
        status: 'active',
        lastReading: null,
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp
        }
      };

      this.sensors.set(sensorId, sensor);
      this.emit('sensor:registered', sensor);
      logger.info('Sensor registered', { sensorId, name: sensor.name });

      return sensor;
    } catch (error) {
      logger.error('Failed to register sensor', { error: error.message });
      throw new Error(`Sensor registration failed: ${error.message}`);
    }
  }

  /**
   * Record Telemetry Data
   */
  async recordTelemetryData(equipmentId, readings) {
    try {
      const timestamp = new Date().toISOString();
      const equipment = this.equipment.get(equipmentId);

      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }

      const telemetry = {
        equipmentId,
        timestamp,
        readings: readings.map(reading => ({
          sensorId: reading.sensorId,
          value: reading.value,
          unit: reading.unit,
          quality: reading.quality || 'good'
        }))
      };

      // Store telemetry data
      const existingData = this.telemetryData.get(equipmentId) || [];
      existingData.push(telemetry);

      // Keep only last 1000 readings
      if (existingData.length > 1000) {
        existingData.splice(0, existingData.length - 1000);
      }
      this.telemetryData.set(equipmentId, existingData);

      // Update equipment usage
      equipment.usage.totalOperatingHours = reading.operatingHours || equipment.usage.totalOperatingHours;
      this.equipment.set(equipmentId, equipment);

      // Check thresholds and emit alerts
      for (const reading of readings) {
        const sensor = this.sensors.get(reading.sensorId);
        if (sensor && sensor.thresholds) {
          if (sensor.thresholds.critical && reading.value >= sensor.thresholds.critical) {
            this.emit('sensor:critical', { equipmentId, sensorId: sensor.id, value: reading.value });
          } else if (sensor.thresholds.warning && reading.value >= sensor.thresholds.warning) {
            this.emit('sensor:warning', { equipmentId, sensorId: sensor.id, value: reading.value });
          }
        }
      }

      this.emit('telemetry:recorded', telemetry);
      return telemetry;
    } catch (error) {
      logger.error('Failed to record telemetry', { equipmentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get Maintenance Records
   */
  async getMaintenanceRecords(filters = {}) {
    let records = Array.from(this.maintenanceRecords.values());

    if (filters.equipmentId) {
      records = records.filter(r => r.equipmentId === filters.equipmentId);
    }
    if (filters.type) {
      records = records.filter(r => r.type === filters.type);
    }
    if (filters.dateFrom) {
      records = records.filter(r => new Date(r.performedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      records = records.filter(r => new Date(r.performedAt) <= new Date(filters.dateTo));
    }

    return records.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));
  }

  /**
   * Get Upcoming Maintenance
   */
  async getUpcomingMaintenance(days = 7) {
    const upcoming = [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    for (const schedule of this.maintenanceSchedules.values()) {
      if (schedule.nextDue && new Date(schedule.nextDue) <= futureDate) {
        upcoming.push({
          ...schedule,
          daysUntilDue: Math.ceil((new Date(schedule.nextDue) - new Date()) / (1000 * 60 * 60 * 24))
        });
      }
    }

    return upcoming.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  }

  /**
   * Sync equipment to ERP systems
   */
  async syncEquipmentToERP(equipment) {
    const syncResults = {};

    for (const [system, client] of Object.entries(this.erpClients)) {
      if (client?.connected) {
        try {
          syncResults[system] = { success: true, timestamp: new Date().toISOString() };
          equipment.erpSync[system] = syncResults[system];
          logger.info(`Equipment synced to ${system.toUpperCase()}`, { equipmentId: equipment.id });
        } catch (error) {
          syncResults[system] = { success: false, error: error.message };
          logger.error(`Failed to sync equipment to ${system}`, { equipmentId: equipment.id, error: error.message });
        }
      }
    }

    return syncResults;
  }

  /**
   * Get Equipment Statistics
   */
  async getEquipmentStats() {
    const allEquipment = Array.from(this.equipment.values());
    const schedules = Array.from(this.maintenanceSchedules.values());
    const records = Array.from(this.maintenanceRecords.values());

    return {
      equipment: {
        total: allEquipment.length,
        byStatus: this.getEquipmentStatusCounts(),
        byType: this.getEquipmentTypeCounts()
      },
      maintenance: {
        schedules: {
          total: schedules.length,
          active: schedules.filter(s => s.status === 'scheduled').length
        },
        records: {
          total: records.length,
          last30Days: records.filter(r => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(r.performedAt) >= thirtyDaysAgo;
          }).length
        },
        totalCost: records.reduce((sum, r) => sum + r.totalCost, 0)
      },
      sensors: {
        total: this.sensors.size,
        active: Array.from(this.sensors.values()).filter(s => s.status === 'active').length
      }
    };
  }

  getEquipmentStatusCounts() {
    const counts = {};
    for (const eq of this.equipment.values()) {
      counts[eq.status] = (counts[eq.status] || 0) + 1;
    }
    return counts;
  }

  getEquipmentTypeCounts() {
    const counts = {};
    for (const eq of this.equipment.values()) {
      counts[eq.type] = (counts[eq.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'equipment-twin-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      equipment: {
        total: this.equipment.size,
        byStatus: this.getEquipmentStatusCounts()
      },
      maintenanceSchedules: {
        total: this.maintenanceSchedules.size
      },
      maintenanceRecords: {
        total: this.maintenanceRecords.size
      },
      sensors: {
        total: this.sensors.size
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
    logger.info('Equipment Twin Service started', { port: this.config.port });
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }

    this.isRunning = false;
    logger.info('Equipment Twin Service stopped');
    this.emit('stopped');
  }
}

// Export for module usage
module.exports = { EquipmentTwinService };

// Export for CLI usage
if (require.main === module) {
  const service = new EquipmentTwinService();
  service.start().catch(error => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
}
