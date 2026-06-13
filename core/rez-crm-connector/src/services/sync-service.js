/**
 * Sync Service - Bidirectional sync between local DB and CRM
 */

const mongoose = require('mongoose');
const winston = require('winston');

const SyncLogSchema = new mongoose.Schema({
  entityType: String,
  direction: { type: String, enum: ['to_crm', 'from_crm', 'bidirectional'] },
  status: { type: String, enum: ['pending', 'syncing', 'completed', 'failed'] },
  itemsProcessed: Number,
  itemsFailed: Number,
  errors: [String],
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const SyncLog = mongoose.model('SyncLog', SyncLogSchema);

const EntityMappingSchema = new mongoose.Schema({
  localId: String,
  crmId: String,
  crmType: String,
  entityType: String,
  lastSyncedAt: Date,
  syncStatus: { type: String, enum: ['synced', 'pending', 'conflict'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const EntityMapping = mongoose.model('EntityMapping', EntityMappingSchema);

class SyncService {
  constructor(provider, mongooseConnection) {
    this.provider = provider;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  async sync({ direction = 'bidirectional', entityTypes = ['contacts'] }) {
    const syncLog = new SyncLog({
      direction,
      entityTypes,
      status: 'syncing',
      startedAt: new Date()
    });

    try {
      const results = {};

      for (const entityType of entityTypes) {
        if (direction === 'to_crm' || direction === 'bidirectional') {
          results.pushLocalToCrm = await this.syncToCrm(entityType);
        }
        if (direction === 'from_crm' || direction === 'bidirectional') {
          results.pullFromCrm = await this.syncFromCrm(entityType);
        }
      }

      syncLog.status = 'completed';
      syncLog.completedAt = new Date();
      syncLog.itemsProcessed = results.reduce((sum, r) => sum + (r.itemsProcessed || 0), 0);
      await syncLog.save();

      return results;
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors = [error.message];
      syncLog.completedAt = new Date();
      await syncLog.save();
      throw error;
    }
  }

  async syncToCrm(entityType) {
    this.logger.info(`Syncing ${entityType} to CRM...`);

    let processed = 0;
    let failed = 0;

    try {
      // Get local records that need syncing
      const localRecords = await this.getLocalRecordsNeedingSync(entityType);

      for (const record of localRecords) {
        try {
          // Check if already mapped
          let mapping = await EntityMapping.findOne({
            localId: record._id.toString(),
            entityType
          });

          if (mapping) {
            // Update existing CRM record
            await this.provider.updateContact(mapping.crmId, record);
          } else {
            // Create new CRM record
            const crmRecord = await this.provider.createContact(record);

            // Create mapping
            mapping = new EntityMapping({
              localId: record._id.toString(),
              crmId: crmRecord.id,
              crmType: this.provider.constructor.name,
              entityType,
              lastSyncedAt: new Date(),
              syncStatus: 'synced'
            });
            await mapping.save();
          }

          // Update last synced
          await this.updateLocalSyncStatus(record._id, entityType);
          processed++;
        } catch (error) {
          this.logger.error(`Failed to sync record ${record._id}:`, error);
          failed++;
        }
      }

      return { entityType, direction: 'to_crm', itemsProcessed: processed, itemsFailed: failed };
    } catch (error) {
      this.logger.error(`Sync to CRM failed:`, error);
      throw error;
    }
  }

  async syncFromCrm(entityType) {
    this.logger.info(`Syncing ${entityType} from CRM...`);

    let processed = 0;
    let failed = 0;

    try {
      const crmRecords = await this.provider.getContacts({ limit: 100 });

      for (const crmRecord of crmRecords.records || []) {
        try {
          const mappedRecord = this.provider.mapFromHubSpot
            ? this.provider.mapFromHubSpot(crmRecord)
            : crmRecord;

          // Check if local record exists
          let mapping = await EntityMapping.findOne({
            crmId: mappedRecord.crmId,
            entityType
          });

          if (mapping) {
            // Update local record
            await this.updateLocalRecord(mapping.localId, mappedRecord);
          } else {
            // Create local record
            const localRecord = await this.createLocalRecord(mappedRecord, entityType);

            // Create mapping
            mapping = new EntityMapping({
              localId: localRecord._id.toString(),
              crmId: mappedRecord.crmId,
              crmType: this.provider.constructor.name,
              entityType,
              lastSyncedAt: new Date(),
              syncStatus: 'synced'
            });
            await mapping.save();
          }

          processed++;
        } catch (error) {
          this.logger.error(`Failed to sync CRM record ${crmRecord.id}:`, error);
          failed++;
        }
      }

      return { entityType, direction: 'from_crm', itemsProcessed: processed, itemsFailed: failed };
    } catch (error) {
      this.logger.error(`Sync from CRM failed:`, error);
      throw error;
    }
  }

  async getLocalRecordsNeedingSync(entityType) {
    // This should be implemented based on the local schema
    return [];
  }

  async updateLocalSyncStatus(recordId, entityType) {
    // This should be implemented based on the local schema
    return true;
  }

  async updateLocalRecord(localId, data) {
    // This should be implemented based on the local schema
    return true;
  }

  async createLocalRecord(data, entityType) {
    // This should be implemented based on the local schema
    return { _id: `local_${Date.now()}` };
  }

  async getSyncStatus() {
    const lastSync = await SyncLog.findOne().sort({ createdAt: -1 });
    const pendingMappings = await EntityMapping.countDocuments({ syncStatus: 'pending' });

    return {
      lastSync: lastSync ? {
        status: lastSync.status,
        completedAt: lastSync.completedAt,
        itemsProcessed: lastSync.itemsProcessed,
        itemsFailed: lastSync.itemsFailed
      } : null,
      pendingMappings,
      totalMappings: await EntityMapping.countDocuments()
    };
  }

  async handleWebhook(event, data) {
    this.logger.info(`Handling webhook: ${event}`, data);

    switch (event) {
      case 'contact.created':
      case 'contact.updated':
      case 'contact.deleted':
        await this.handleContactWebhook(event, data);
        break;
      default:
        this.logger.warn(`Unknown webhook event: ${event}`);
    }
  }

  async handleContactWebhook(event, data) {
    const { crmId, ...contactData } = data;

    if (event === 'contact.deleted') {
      const mapping = await EntityMapping.findOne({ crmId, entityType: 'contacts' });
      if (mapping) {
        await this.updateLocalSyncStatus(mapping.localId, 'contacts', 'deleted');
        await mapping.deleteOne();
      }
    } else {
      const mappedData = this.provider.mapFromHubSpot
        ? this.provider.mapFromHubSpot({ id: crmId, properties: contactData })
        : contactData;

      const mapping = await EntityMapping.findOne({ crmId, entityType: 'contacts' });
      if (mapping) {
        await this.updateLocalRecord(mapping.localId, mappedData);
        mapping.lastSyncedAt = new Date();
        await mapping.save();
      } else {
        const localRecord = await this.createLocalRecord(mappedData, 'contacts');
        new EntityMapping({
          localId: localRecord._id.toString(),
          crmId,
          crmType: this.provider.constructor.name,
          entityType: 'contacts',
          lastSyncedAt: new Date(),
          syncStatus: 'synced'
        }).save();
      }
    }
  }
}

module.exports = SyncService;
