/**
 * Permit Twin Service
 * Manages licenses, permits, and applications throughout their lifecycle
 * Handles application submission, tracking, and status management
 */

const { ServiceBusClient } = require('@azure/service-bus');
const { CosmosClient } = require('@azure/cosmos');
const { TableServiceClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/permit-twin-service.log' })
  ]
});

class PermitTwinService {
  constructor(config = {}) {
    this.config = {
      cosmosDbEndpoint: config.cosmosDbEndpoint || process.env.COSMOS_DB_ENDPOINT,
      cosmosDbKey: config.cosmosDbKey || process.env.COSMOS_DB_KEY,
      cosmosDbDatabase: config.cosmosDbDatabase || 'government-os',
      serviceBusConnection: config.serviceBusConnection || process.env.SERVICE_BUS_CONNECTION,
      tableStorageConnection: config.tableStorageConnection || process.env.TABLE_STORAGE_CONNECTION,
      ...config
    };

    this.cosmosClient = null;
    this.serviceBusClient = null;
    this.tableServiceClient = null;
    this.permitsContainer = null;
    this.applicationsContainer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing Permit Twin Service');

      // Initialize Cosmos DB
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.cosmosDbEndpoint,
        key: this.config.cosmosDbKey
      });

      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.config.cosmosDbDatabase
      });

      // Permits container
      const { container: permitsContainer } = await database.containers.createIfNotExists({
        id: 'permit-twins',
        partitionKey: { paths: ['/permitType'] }
      });
      this.permitsContainer = permitsContainer;

      // Applications container
      const { container: applicationsContainer } = await database.containers.createIfNotExists({
        id: 'permit-applications',
        partitionKey: { paths: ['/residentId'] }
      });
      this.applicationsContainer = applicationsContainer;

      // Initialize Table Storage for audit logs
      if (this.config.tableStorageConnection) {
        this.tableServiceClient = TableServiceClient.fromConnectionString(
          this.config.tableStorageConnection
        );
      }

      // Initialize Service Bus
      this.serviceBusClient = new ServiceBusClient(this.config.serviceBusConnection);

      logger.info('Permit Twin Service initialized successfully');
      return { status: 'initialized' };
    } catch (error) {
      logger.error('Failed to initialize Permit Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Create or update a permit type definition
   */
  async upsertPermit(permitData) {
    const startTime = Date.now();

    try {
      const permitId = permitData.permitId || uuidv4();
      const now = new Date().toISOString();

      const permitTwin = {
        id: permitId,
        permitId,
        metadata: {
          name: permitData.name,
          description: permitData.description,
          shortDescription: permitData.shortDescription,
          permitType: permitData.permitType,
          category: permitData.category,
          tags: permitData.tags || []
        },
        requirements: {
          eligibilityCriteria: permitData.eligibilityCriteria || [],
          requiredDocuments: permitData.requiredDocuments || [],
          minimumRequirements: permitData.minimumRequirements,
          experienceRequirements: permitData.experienceRequirements,
          insuranceRequirements: permitData.insuranceRequirements,
          backgroundCheckRequired: permitData.backgroundCheckRequired || false,
          inspectionRequired: permitData.inspectionRequired || false
        },
        application: {
          submissionMethods: permitData.submissionMethods || ['online', 'in_person', 'mail'],
          formFields: permitData.formFields || [],
          validationRules: permitData.validationRules || [],
          supportingDocuments: permitData.supportingDocuments || [],
          applicationFee: permitData.applicationFee || 0,
          feeStructure: permitData.feeStructure,
          paymentRequired: permitData.paymentRequired !== false
        },
        processing: {
          estimatedDays: permitData.estimatedDays || 30,
          rushProcessingAvailable: permitData.rushProcessingAvailable || false,
          rushProcessingDays: permitData.rushProcessingDays,
          rushProcessingFee: permitData.rushProcessingFee,
          reviewStages: permitData.reviewStages || ['submitted', 'under_review', 'approved', 'issued'],
          inspectionSchedule: permitData.inspectionSchedule,
          conditionalApproval: permitData.conditionalApproval || false
        },
        issuance: {
          documentTemplate: permitData.documentTemplate,
          deliveryMethods: permitData.deliveryMethods || ['digital', 'physical'],
          physicalDocumentRequired: permitData.physicalDocumentRequired !== false,
          digitalVerificationAvailable: permitData.digitalVerificationAvailable || true
        },
        validity: {
          duration: permitData.duration,
          durationUnit: permitData.durationUnit || 'years',
          renewalRequired: permitData.renewalRequired !== false,
          renewalNoticeDays: permitData.renewalNoticeDays || 60,
          gracePeriodDays: permitData.gracePeriodDays || 0,
          expirationHandling: permitData.expirationHandling || 'automatic'
        },
        status: permitData.status || 'active',
        metadata: {
          createdAt: permitData.createdAt || now,
          updatedAt: now,
          version: (permitData.version || 0) + 1,
          effectiveDate: permitData.effectiveDate,
          expirationDate: permitData.expirationDate
        }
      };

      const { resource } = await this.permitsContainer.upsertItem(permitTwin, {
        partitionKey: permitData.permitType
      });

      await this.publishEvent('permit-twin.updated', {
        permitId,
        eventType: 'upsert',
        timestamp: now
      });

      logger.info('Permit Twin upserted', {
        permitId,
        name: permitData.name,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to upsert Permit Twin', {
        error: error.message,
        permitId: permitData.permitId
      });
      throw error;
    }
  }

  /**
   * Submit a permit application
   */
  async submitApplication(applicationData) {
    const startTime = Date.now();

    try {
      const applicationId = applicationData.applicationId || uuidv4();
      const now = new Date().toISOString();

      const application = {
        id: applicationId,
        applicationId,
        residentId: applicationData.residentId,
        permitId: applicationData.permitId,
        permitType: applicationData.permitType,
        status: 'submitted',
        submission: {
          submittedAt: now,
          submissionMethod: applicationData.submissionMethod || 'online',
          submittedBy: applicationData.submittedBy,
          ipAddress: applicationData.ipAddress,
          userAgent: applicationData.userAgent
        },
        data: {
          personalInfo: applicationData.personalInfo,
          businessInfo: applicationData.businessInfo,
          addresses: applicationData.addresses,
          contacts: applicationData.contacts,
          qualifications: applicationData.qualifications,
          additionalData: applicationData.additionalData || {}
        },
        documents: {
          uploaded: applicationData.documents || [],
          verified: [],
          rejected: []
        },
        fees: {
          applicationFee: applicationData.applicationFee || 0,
          rushFee: applicationData.rushFee || 0,
          additionalFees: applicationData.additionalFees || [],
          totalFee: applicationData.totalFee || 0,
          paymentStatus: applicationData.paymentStatus || 'pending',
          paymentMethod: applicationData.paymentMethod,
          paymentReference: applicationData.paymentReference
        },
        review: {
          currentStage: 'submitted',
          stageHistory: [{
            stage: 'submitted',
            timestamp: now,
            notes: 'Application received'
          }],
          assignedTo: null,
          assignedAt: null,
          priority: applicationData.priority || 'normal',
          dueDate: applicationData.dueDate,
          notes: []
        },
        decision: {
          outcome: null,
          decidedAt: null,
          decidedBy: null,
          reason: null,
          conditions: [],
          appealAvailable: true,
          appealDeadline: null
        },
        issuance: {
          issuedAt: null,
          documentNumber: null,
          effectiveDate: null,
          expirationDate: null,
          deliveryMethod: null,
          deliveryStatus: null,
          deliveryReference: null
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          lastModifiedBy: 'permit-twin-service'
        }
      };

      const { resource } = await this.applicationsContainer.upsertItem(application, {
        partitionKey: applicationData.residentId
      });

      // Update permit metrics
      await this.updatePermitMetrics(applicationData.permitId, {
        incrementApplications: 1
      });

      await this.publishEvent('permit.application.submitted', {
        applicationId,
        residentId: applicationData.residentId,
        permitId: applicationData.permitId,
        timestamp: now
      });

      logger.info('Permit application submitted', {
        applicationId,
        residentId: applicationData.residentId,
        permitId: applicationData.permitId,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to submit permit application', {
        error: error.message,
        residentId: applicationData.residentId
      });
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId) {
    try {
      const query = `SELECT * FROM c WHERE c.applicationId = "${applicationId}"`;
      const { resources } = await this.applicationsContainer.items.query(query).fetchAll();
      return resources[0] || null;
    } catch (error) {
      logger.error('Failed to get application', { error: error.message, applicationId });
      throw error;
    }
  }

  /**
   * Get applications by resident
   */
  async getApplicationsByResident(residentId, filters = {}) {
    try {
      let sqlQuery = `SELECT * FROM c WHERE c.residentId = "${residentId}"`;

      if (filters.status) {
        sqlQuery += ` AND c.status = "${filters.status}"`;
      }
      if (filters.permitType) {
        sqlQuery += ` AND c.permitType = "${filters.permitType}"`;
      }

      const { resources } = await this.applicationsContainer.items.query(sqlQuery).fetchAll();
      return resources;
    } catch (error) {
      logger.error('Failed to get applications by resident', {
        error: error.message,
        residentId
      });
      throw error;
    }
  }

  /**
   * Update application status and stage
   */
  async updateApplicationStatus(applicationId, statusUpdate) {
    const startTime = Date.now();

    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      const now = new Date().toISOString();

      if (statusUpdate.status) {
        application.status = statusUpdate.status;
      }

      if (statusUpdate.currentStage) {
        application.review.currentStage = statusUpdate.currentStage;
        application.review.stageHistory.push({
          stage: statusUpdate.currentStage,
          timestamp: now,
          notes: statusUpdate.notes || '',
          changedBy: statusUpdate.changedBy
        });
      }

      if (statusUpdate.assignedTo) {
        application.review.assignedTo = statusUpdate.assignedTo;
        application.review.assignedAt = now;
      }

      if (statusUpdate.priority) {
        application.review.priority = statusUpdate.priority;
      }

      if (statusUpdate.notes) {
        application.review.notes.push({
          timestamp: now,
          author: statusUpdate.notesAuthor,
          content: statusUpdate.notes
        });
      }

      application.metadata.updatedAt = now;
      application.metadata.version += 1;

      const { resource } = await this.applicationsContainer.upsertItem(application, {
        partitionKey: application.residentId
      });

      await this.publishEvent('permit.application.status.updated', {
        applicationId,
        status: application.status,
        currentStage: application.review.currentStage,
        timestamp: now
      });

      logger.info('Application status updated', {
        applicationId,
        status: application.status,
        currentStage: application.review.currentStage,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to update application status', {
        error: error.message,
        applicationId
      });
      throw error;
    }
  }

  /**
   * Make a decision on an application
   */
  async makeDecision(applicationId, decision) {
    const startTime = Date.now();

    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      const now = new Date().toISOString();

      application.decision = {
        outcome: decision.outcome, // 'approved', 'denied', 'conditional'
        decidedAt: now,
        decidedBy: decision.decidedBy,
        reason: decision.reason,
        conditions: decision.conditions || [],
        appealAvailable: decision.outcome !== 'approved',
        appealDeadline: decision.outcome !== 'approved'
          ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
          : null
      };

      application.status = decision.outcome === 'approved' ? 'approved'
        : decision.outcome === 'denied' ? 'denied'
        : 'conditional';

      application.review.currentStage = decision.outcome;
      application.review.stageHistory.push({
        stage: decision.outcome,
        timestamp: now,
        notes: decision.reason
      });

      application.metadata.updatedAt = now;
      application.metadata.version += 1;

      const { resource } = await this.applicationsContainer.upsertItem(application, {
        partitionKey: application.residentId
      });

      // Update permit metrics
      await this.updatePermitMetrics(application.permitId, {
        incrementDecisions: 1,
        incrementApproved: decision.outcome === 'approved' ? 1 : 0,
        incrementDenied: decision.outcome === 'denied' ? 1 : 0
      });

      await this.publishEvent('permit.application.decided', {
        applicationId,
        outcome: decision.outcome,
        timestamp: now
      });

      logger.info('Application decision made', {
        applicationId,
        outcome: decision.outcome,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to make decision', {
        error: error.message,
        applicationId
      });
      throw error;
    }
  }

  /**
   * Issue a permit
   */
  async issuePermit(applicationId, issuanceData) {
    const startTime = Date.now();

    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      if (application.decision.outcome !== 'approved' &&
          application.decision.outcome !== 'conditional') {
        throw new Error('Application must be approved before issuing permit');
      }

      const now = new Date().toISOString();
      const permitNumber = `${application.permitType}-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Calculate expiration date
      const permit = await this.getPermit(application.permitId);
      let expirationDate = null;

      if (permit?.validity) {
        const duration = permit.validity.duration || 1;
        const unit = permit.validity.durationUnit || 'years';
        const expirationMs = unit === 'years' ? duration * 365 * 24 * 60 * 60 * 1000
          : unit === 'months' ? duration * 30 * 24 * 60 * 60 * 1000
          : duration * 24 * 60 * 60 * 1000;
        expirationDate = new Date(Date.now() + expirationMs).toISOString();
      }

      application.issuance = {
        issuedAt: now,
        documentNumber: permitNumber,
        effectiveDate: issuanceData.effectiveDate || now,
        expirationDate: issuanceData.expirationDate || expirationDate,
        deliveryMethod: issuanceData.deliveryMethod || 'digital',
        deliveryStatus: 'pending',
        deliveryReference: issuanceData.deliveryReference
      };

      application.status = 'issued';
      application.review.currentStage = 'issued';
      application.review.stageHistory.push({
        -stage: 'issued',
        timestamp: now,
        notes: `Permit ${permitNumber} issued`
      });

      application.metadata.updatedAt = now;
      application.metadata.version += 1;

      const { resource } = await this.applicationsContainer.upsertItem(application, {
        partitionKey: application.residentId
      });

      await this.publishEvent('permit.issued', {
        applicationId,
        documentNumber: permitNumber,
        residentId: application.residentId,
        timestamp: now
      });

      logger.info('Permit issued', {
        applicationId,
        documentNumber: permitNumber,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to issue permit', {
        error: error.message,
        applicationId
      });
      throw error;
    }
  }

  /**
   * Get permit by ID
   */
  async getPermit(permitId) {
    try {
      const query = `SELECT * FROM c WHERE c.permitId = "${permitId}"`;
      const { resources } = await this.permitsContainer.items.query(query).fetchAll();
      return resources[0] || null;
    } catch (error) {
      logger.error('Failed to get permit', { error: error.message, permitId });
      throw error;
    }
  }

  /**
   * Update permit metrics
   */
  async updatePermitMetrics(permitId, metricsUpdate) {
    try {
      const permit = await this.getPermit(permitId);
      if (!permit) return;

      if (metricsUpdate.incrementApplications) {
        permit.metrics = permit.metrics || {};
        permit.metrics.totalApplications =
          (permit.metrics.totalApplications || 0) + metricsUpdate.incrementApplications;
      }

      if (metricsUpdate.incrementDecisions) {
        permit.metrics.totalDecisions =
          (permit.metrics.totalDecisions || 0) + metricsUpdate.incrementDecisions;
      }

      if (metricsUpdate.incrementApproved) {
        permit.metrics.totalApproved =
          (permit.metrics.totalApproved || 0) + metricsUpdate.incrementApproved;
      }

      if (metricsUpdate.incrementDenied) {
        permit.metrics.totalDenied =
          (permit.metrics.totalDenied || 0) + metricsUpdate.incrementDenied;
      }

      if (permit.metrics.totalDecisions > 0) {
        permit.metrics.approvalRate =
          (permit.metrics.totalApproved / permit.metrics.totalDecisions) * 100;
      }

      await this.permitsContainer.upsertItem(permit, {
        partitionKey: permit.permitType
      });
    } catch (error) {
      logger.error('Failed to update permit metrics', {
        error: error.message,
        permitId
      });
    }
  }

  /**
   * Publish event to service bus
   */
  async publishEvent(topic, data) {
    try {
      const sender = this.serviceBusClient.createSender(topic);
      await sender.sendMessages({
        body: JSON.stringify(data),
        contentType: 'application/json'
      });
      await sender.close();
    } catch (error) {
      logger.error('Failed to publish event', { topic, error: error.message });
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const checks = {
      cosmosDb: false,
      serviceBus: false
    };

    try {
      await this.permitsContainer.read();
      checks.cosmosDb = true;
    } catch (error) {
      logger.error('Cosmos DB health check failed', { error: error.message });
    }

    const healthy = Object.values(checks).every(v => v);

    return {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down Permit Twin Service');

    if (this.serviceBusClient) {
      await this.serviceBusClient.close();
    }

    logger.info('Permit Twin Service shutdown complete');
  }
}

module.exports = { PermitTwinService };

// Run as standalone service
if (require.main === module) {
  const config = {
    cosmosDbEndpoint: process.env.COSMOS_DB_ENDPOINT,
    cosmosDbKey: process.env.COSMOS_DB_KEY,
    serviceBusConnection: process.env.SERVICE_BUS_CONNECTION
  };

  const service = new PermitTwinService(config);

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/permits', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.upsertPermit(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/applications', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.submitApplication(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/applications/:applicationId', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.getApplication(req.params.applicationId);
      if (!result) {
        return res.status(404).json({ error: 'Application not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/applications/:applicationId/status', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.updateApplicationStatus(
        req.params.applicationId,
        req.body
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/applications/:applicationId/decision', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.makeDecision(req.params.applicationId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/applications/:applicationId/issue', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.issuePermit(req.params.applicationId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/health', async (req, res) => {
    try {
      await service.initialize();
      res.json(await service.healthCheck());
    } catch (error) {
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, async () => {
    await service.initialize();
    console.log(`Permit Twin Service running on port ${PORT}`);
  });
}