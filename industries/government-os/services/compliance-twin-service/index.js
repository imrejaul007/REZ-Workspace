/**
 * Compliance Twin Service
 * Manages regulations, compliance requirements, and rule enforcement
 * Tracks citizen and business compliance status
 */

const { ServiceBusClient } = require('@azure/service-bus');
const { CosmosClient } = require('@azure/cosmos');
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
    new winston.transports.File({ filename: 'logs/compliance-twin-service.log' })
  ]
});

class ComplianceTwinService {
  constructor(config = {}) {
    this.config = {
      cosmosDbEndpoint: config.cosmosDbEndpoint || process.env.COSMOS_DB_ENDPOINT,
      cosmosDbKey: config.cosmosDbKey || process.env.COSMOS_DB_KEY,
      cosmosDbDatabase: config.cosmosDbDatabase || 'government-os',
      serviceBusConnection: config.serviceBusConnection || process.env.SERVICE_BUS_CONNECTION,
      ...config
    };

    this.cosmosClient = null;
    this.serviceBusClient = null;
    this.regulationsContainer = null;
    this.complianceRecordsContainer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing Compliance Twin Service');

      this.cosmosClient = new CosmosClient({
        endpoint: this.config.cosmosDbEndpoint,
        key: this.config.cosmosDbKey
      });

      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.config.cosmosDbDatabase
      });

      // Regulations container
      const { container: regulationsContainer } = await database.containers.createIfNotExists({
        id: 'regulations',
        partitionKey: { paths: ['/jurisdiction'] }
      });
      this.regulationsContainer = regulationsContainer;

      // Compliance records container
      const { container: complianceRecordsContainer } = await database.containers.createIfNotExists({
        id: 'compliance-records',
        partitionKey: { paths: ['/entityType'] }
      });
      this.complianceRecordsContainer = complianceRecordsContainer;

      // Initialize Service Bus
      this.serviceBusClient = new ServiceBusClient(this.config.serviceBusConnection);

      logger.info('Compliance Twin Service initialized successfully');
      return { status: 'initialized' };
    } catch (error) {
      logger.error('Failed to initialize Compliance Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Create or update a regulation
   */
  async upsertRegulation(regulationData) {
    const startTime = Date.now();

    try {
      const regulationId = regulationData.regulationId || uuidv4();
      const now = new Date().toISOString();

      const regulation = {
        id: regulationId,
        regulationId,
        metadata: {
          title: regulationData.title,
          description: regulationData.description,
          shortDescription: regulationData.shortDescription,
          regulationType: regulationData.regulationType,
          category: regulationData.category,
          jurisdiction: regulationData.jurisdiction,
          authority: regulationData.authority,
          tags: regulationData.tags || [],
          keywords: regulationData.keywords || []
        },
        content: {
          fullText: regulationData.fullText,
          summary: regulationData.summary,
          effectiveDate: regulationData.effectiveDate,
          expirationDate: regulationData.expirationDate,
          lastReviewedDate: now,
          nextReviewDate: regulationData.nextReviewDate
        },
        requirements: {
          mandatoryCompliance: regulationData.mandatoryCompliance !== false,
          complianceDeadline: regulationData.complianceDeadline,
          gracePeriodDays: regulationData.gracePeriodDays || 0,
          penalties: regulationData.penalties || [],
          exemptions: regulationData.exemptions || [],
          alternatives: regulationData.alternatives || []
        },
        applicability: {
          entityTypes: regulationData.entityTypes || ['citizen', 'business'],
          businessTypes: regulationData.businessTypes || [],
          sizeRequirements: regulationData.sizeRequirements,
          geographicScope: regulationData.geographicScope || 'statewide',
          industrySectors: regulationData.industrySectors || []
        },
        reporting: {
          reportingRequired: regulationData.reportingRequired || false,
          reportingFrequency: regulationData.reportingFrequency,
          reportingDueDates: regulationData.reportingDueDates || [],
          reportingMethod: regulationData.reportingMethod,
          reportingRecipient: regulationData.reportingRecipient
        },
        enforcement: {
          enforcementAgency: regulationData.enforcementAgency,
          inspectionRequired: regulationData.inspectionRequired || false,
          inspectionFrequency: regulationData.inspectionFrequency,
          violationCategories: regulationData.violationCategories || [],
          remediationRequirements: regulationData.remediationRequirements
        },
        related: {
          relatedRegulations: regulationData.relatedRegulations || [],
          supersedes: regulationData.supersedes,
          supersededBy: regulationData.supersededBy,
          associatedServices: regulationData.associatedServices || [],
          associatedPermits: regulationData.associatedPermits || []
        },
        status: regulationData.status || 'active',
        metadata: {
          createdAt: regulationData.createdAt || now,
          updatedAt: now,
          version: (regulationData.version || 0) + 1,
          createdBy: regulationData.createdBy,
          lastModifiedBy: 'compliance-twin-service'
        }
      };

      const { resource } = await this.regulationsContainer.upsertItem(regulation, {
        partitionKey: regulationData.jurisdiction
      });

      await this.publishEvent('regulation.updated', {
        regulationId,
        eventType: 'upsert',
        timestamp: now
      });

      logger.info('Regulation upserted', {
        regulationId,
        title: regulationData.title,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to upsert regulation', {
        error: error.message,
        regulationId: regulationData.regulationId
      });
      throw error;
    }
  }

  /**
   * Get regulation by ID
   */
  async getRegulation(regulationId) {
    try {
      const query = `SELECT * FROM c WHERE c.regulationId = "${regulationId}"`;
      const { resources } = await this.regulationsContainer.items.query(query).fetchAll();
      return resources[0] || null;
    } catch (error) {
      logger.error('Failed to get regulation', { error: error.message, regulationId });
      throw error;
    }
  }

  /**
   * Search regulations
   */
  async searchRegulations(query) {
    const sqlConditions = [];

    if (query.jurisdiction) {
      sqlConditions.push(`c.metadata.jurisdiction = "${query.jurisdiction}"`);
    }
    if (query.category) {
      sqlConditions.push(`c.metadata.category = "${query.category}"`);
    }
    if (query.regulationType) {
      sqlConditions.push(`c.metadata.regulationType = "${query.regulationType}"`);
    }
    if (query.status) {
      sqlConditions.push(`c.status = "${query.status}"`);
    }
    if (query.keywords) {
      const keywordFilter = query.keywords.map(k => `c.metadata.keywords CONTAINS "${k}"`).join(' OR ');
      sqlConditions.push(`(${keywordFilter})`);
    }

    const whereClause = sqlConditions.length > 0
      ? `WHERE ${sqlConditions.join(' AND ')}`
      : '';

    const sqlQuery = `SELECT * FROM c ${whereClause}`;
    const { resources } = await this.regulationsContainer.items.query(sqlQuery).fetchAll();

    return resources;
  }

  /**
   * Create compliance record for an entity
   */
  async createComplianceRecord(recordData) {
    const startTime = Date.now();

    try {
      const recordId = recordData.recordId || uuidv4();
      const now = new Date().toISOString();

      const complianceRecord = {
        id: recordId,
        recordId,
        entityId: recordData.entityId,
        entityType: recordData.entityType, // 'citizen' or 'business'
        entityName: recordData.entityName,
        regulationId: recordData.regulationId,
        regulationTitle: recordData.regulationTitle,
        status: 'pending',
        compliance: {
          isCompliant: null,
          complianceDate: null,
          verificationMethod: null,
          verifiedBy: null,
          verificationDate: null
        },
        assessment: {
          lastAssessedAt: now,
          assessedBy: recordData.assessedBy,
          assessmentResult: recordData.assessmentResult,
          findings: recordData.findings || [],
          riskLevel: recordData.riskLevel || 'low',
          riskScore: recordData.riskScore || 0
        },
        violations: [],
        remediation: {
          required: false,
          deadline: null,
          completedAt: null,
          completedBy: null,
          verifiedAt: null,
          notes: []
        },
        history: [{
          timestamp: now,
          action: 'created',
          performedBy: recordData.assessedBy,
          notes: 'Compliance record created'
        }],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1
        }
      };

      const { resource } = await this.complianceRecordsContainer.upsertItem(complianceRecord, {
        partitionKey: recordData.entityType
      });

      await this.publishEvent('compliance.record.created', {
        recordId,
        entityId: recordData.entityId,
        regulationId: recordData.regulationId,
        timestamp: now
      });

      logger.info('Compliance record created', {
        recordId,
        entityId: recordData.entityId,
        regulationId: recordData.regulationId,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to create compliance record', {
        error: error.message,
        entityId: recordData.entityId
      });
      throw error;
    }
  }

  /**
   * Assess compliance for an entity
   */
  async assessCompliance(recordId, assessmentData) {
    const startTime = Date.now();

    try {
      const record = await this.getComplianceRecord(recordId);
      if (!record) {
        throw new Error(`Compliance record not found: ${recordId}`);
      }

      const now = new Date().toISOString();

      record.assessment = {
        lastAssessedAt: now,
        assessedBy: assessmentData.assessedBy,
        assessmentResult: assessmentData.result, // 'compliant', 'non_compliant', 'partial'
        findings: assessmentData.findings || [],
        riskLevel: assessmentData.riskLevel || record.assessment.riskLevel,
        riskScore: assessmentData.riskScore || record.assessment.riskScore,
        evidence: assessmentData.evidence || [],
        notes: assessmentData.notes
      };

      record.compliance = {
        isCompliant: assessmentData.result === 'compliant',
        complianceDate: assessmentData.result === 'compliant' ? now : null,
        verificationMethod: assessmentData.verificationMethod,
        verifiedBy: assessmentData.verifiedBy,
        verificationDate: assessmentData.result === 'compliant' ? now : null
      };

      record.status = assessmentData.result === 'compliant' ? 'compliant'
        : assessmentData.result === 'non_compliant' ? 'non_compliant'
        : 'partial';

      // Process violations
      if (assessmentData.violations?.length > 0) {
        record.violations = assessmentData.violations.map(v => ({
          ...v,
          identifiedAt: now,
          identifiedBy: assessmentData.assessedBy
        }));

        record.remediation = {
          required: true,
          deadline: v.dueDate,
          completedAt: null,
          completedBy: null,
          verifiedAt: null,
          notes: []
        };
      }

      record.history.push({
        timestamp: now,
        action: 'assessed',
        performedBy: assessmentData.assessedBy,
        notes: `Assessment result: ${assessmentData.result}`
      });

      record.metadata.updatedAt = now;
      record.metadata.version += 1;

      const { resource } = await this.complianceRecordsContainer.upsertItem(record, {
        partitionKey: record.entityType
      });

      await this.publishEvent('compliance.assessed', {
        recordId,
        entityId: record.entityId,
        result: assessmentData.result,
        timestamp: now
      });

      logger.info('Compliance assessed', {
        recordId,
        result: assessmentData.result,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to assess compliance', {
        error: error.message,
        recordId
      });
      throw error;
    }
  }

  /**
   * Get compliance record by ID
   */
  async getComplianceRecord(recordId) {
    try {
      const query = `SELECT * FROM c WHERE c.recordId = "${recordId}"`;
      const { resources } = await this.complianceRecordsContainer.items.query(query).fetchAll();
      return resources[0] || null;
    } catch (error) {
      logger.error('Failed to get compliance record', { error: error.message, recordId });
      throw error;
    }
  }

  /**
   * Get compliance records by entity
   */
  async getComplianceByEntity(entityId, entityType) {
    try {
      const query = `SELECT * FROM c WHERE c.entityId = "${entityId}" AND c.entityType = "${entityType}"`;
      const { resources } = await this.complianceRecordsContainer.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      logger.error('Failed to get compliance by entity', {
        error: error.message,
        entityId
      });
      throw error;
    }
  }

  /**
   * Check overall compliance status for an entity
   */
  async checkOverallCompliance(entityId, entityType) {
    try {
      const records = await this.getComplianceByEntity(entityId, entityType);

      const summary = {
        entityId,
        entityType,
        totalRegulations: records.length,
        compliant: records.filter(r => r.status === 'compliant').length,
        nonCompliant: records.filter(r => r.status === 'non_compliant').length,
        pending: records.filter(r => r.status === 'pending').length,
        partial: records.filter(r => r.status === 'partial').length,
        complianceRate: 0,
        overallStatus: 'unknown',
        riskLevel: 'low',
        expiringPermits: [],
        overdueRemediations: []
      };

      if (summary.totalRegulations > 0) {
        summary.complianceRate = (summary.compliant / summary.totalRegulations) * 100;
      }

      // Determine overall status
      if (summary.nonCompliant > 0) {
        summary.overallStatus = 'non_compliant';
      } else if (summary.pending > 0) {
        summary.overallStatus = 'pending_review';
      } else if (summary.partial > 0) {
        summary.overallStatus = 'partial';
      } else {
        summary.overallStatus = 'compliant';
      }

      // Calculate risk level
      const highRiskCount = records.filter(r => r.assessment.riskLevel === 'high').length;
      const mediumRiskCount = records.filter(r => r.assessment.riskLevel === 'medium').length;

      if (highRiskCount > 0) {
        summary.riskLevel = 'high';
      } else if (mediumRiskCount > 0) {
        summary.riskLevel = 'medium';
      }

      // Find expiring permits
      const now = Date.now();
      const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

      records.forEach(record => {
        if (record.remediation?.deadline) {
          const deadline = new Date(record.remediation.deadline).getTime();
          if (deadline < now) {
            summary.overdueRemediations.push({
              recordId: record.recordId,
              regulationTitle: record.regulationTitle,
              deadline: record.remediation.deadline
            });
          }
        }
      });

      return summary;
    } catch (error) {
      logger.error('Failed to check overall compliance', {
        error: error.message,
        entityId
      });
      throw error;
    }
  }

  /**
   * Complete remediation
   */
  async completeRemediation(recordId, remediationData) {
    try {
      const record = await this.getComplianceRecord(recordId);
      if (!record) {
        throw new Error(`Compliance record not found: ${recordId}`);
      }

      const now = new Date().toISOString();

      record.remediation = {
        ...record.remediation,
        completedAt: now,
        completedBy: remediationData.completedBy,
        notes: [
          ...record.remediation.notes,
          {
            timestamp: now,
            author: remediationData.completedBy,
            content: remediationData.notes
          }
        ]
      };

      record.history.push({
        timestamp: now,
        action: 'remediation_completed',
        performedBy: remediationData.completedBy,
        notes: 'Remediation requirements completed'
      });

      record.metadata.updatedAt = now;
      record.metadata.version += 1;

      const { resource } = await this.complianceRecordsContainer.upsertItem(record, {
        partitionKey: record.entityType
      });

      await this.publishEvent('compliance.remediation.completed', {
        recordId,
        entityId: record.entityId,
        timestamp: now
      });

      return resource;
    } catch (error) {
      logger.error('Failed to complete remediation', {
        error: error.message,
        recordId
      });
      throw error;
    }
  }

  /**
   * Get regulations applicable to a permit type
   */
  async getRegulationsForPermit(permitType) {
    try {
      const query = `SELECT * FROM c WHERE c.related.associatedPermits CONTAINS "${permitType}" AND c.status = "active"`;
      const { resources } = await this.regulationsContainer.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      logger.error('Failed to get regulations for permit', {
        error: error.message,
        permitType
      });
      throw error;
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
      await this.regulationsContainer.read();
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
    logger.info('Shutting down Compliance Twin Service');

    if (this.serviceBusClient) {
      await this.serviceBusClient.close();
    }

    logger.info('Compliance Twin Service shutdown complete');
  }
}

module.exports = { ComplianceTwinService };

// Run as standalone service
if (require.main === module) {
  const config = {
    cosmosDbEndpoint: process.env.COSMOS_DB_ENDPOINT,
    cosmosDbKey: process.env.COSMOS_DB_KEY,
    serviceBusConnection: process.env.SERVICE_BUS_CONNECTION
  };

  const service = new ComplianceTwinService(config);

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/regulations', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.upsertRegulation(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/regulations/:regulationId', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.getRegulation(req.params.regulationId);
      if (!result) {
        return res.status(404).json({ error: 'Regulation not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/regulations/search', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.searchRegulations(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/compliance-records', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.createComplianceRecord(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/compliance-records/:recordId/assess', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.assessCompliance(req.params.recordId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/compliance/:entityType/:entityId', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.checkOverallCompliance(
        req.params.entityId,
        req.params.entityType
      );
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

  const PORT = process.env.PORT || 3004;
  app.listen(PORT, async () => {
    await service.initialize();
    console.log(`Compliance Twin Service running on port ${PORT}`);
  });
}