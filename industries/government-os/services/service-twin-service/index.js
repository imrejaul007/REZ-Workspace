/**
 * Service Twin Service
 * Government services catalog with eligibility rules, documents, and processes
 * Manages the complete service registry for citizen access
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
    new winston.transports.File({ filename: 'logs/service-twin-service.log' })
  ]
});

class ServiceTwinService {
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
    this.servicesContainer = null;
    this.categoriesContainer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing Service Twin Service');

      this.cosmosClient = new CosmosClient({
        endpoint: this.config.cosmosDbEndpoint,
        key: this.config.cosmosDbKey
      });

      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.config.cosmosDbDatabase
      });

      // Services container
      const { container: servicesContainer } = await database.containers.createIfNotExists({
        id: 'service-twins',
        partitionKey: { paths: ['/category'] }
      });
      this.servicesContainer = servicesContainer;

      // Categories container
      const { container: categoriesContainer } = await database.containers.createIfNotExists({
        id: 'service-categories',
        partitionKey: { paths: ['/parentCategory'] }
      });
      this.categoriesContainer = categoriesContainer;

      // Initialize Service Bus
      this.serviceBusClient = new ServiceBusClient(this.config.serviceBusConnection);

      logger.info('Service Twin Service initialized successfully');
      return { status: 'initialized' };
    } catch (error) {
      logger.error('Failed to initialize Service Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Create or update a government service
   */
  async upsertService(serviceData) {
    const startTime = Date.now();

    try {
      const serviceId = serviceData.serviceId || uuidv4();
      const now = new Date().toISOString();

      const serviceTwin = {
        id: serviceId,
        serviceId,
        metadata: {
          name: serviceData.name,
          description: serviceData.description,
          shortDescription: serviceData.shortDescription,
          category: serviceData.category,
          subcategory: serviceData.subcategory,
          tags: serviceData.tags || [],
          keywords: serviceData.keywords || []
        },
        eligibility: {
          citizenTypes: serviceData.citizenTypes || ['all'],
          ageRequirements: serviceData.ageRequirements,
          residencyRequirements: serviceData.residencyRequirements,
          incomeRequirements: serviceData.incomeRequirements,
          employmentRequirements: serviceData.employmentRequirements,
          businessRequirements: serviceData.businessRequirements,
          prerequisiteServices: serviceData.prerequisiteServices || [],
          exclusionCriteria: serviceData.exclusionCriteria || []
        },
        documents: {
          required: serviceData.requiredDocuments || [],
          optional: serviceData.optionalDocuments || [],
          thirdParty: serviceData.thirdPartyDocuments || []
        },
        process: {
          steps: serviceData.processSteps || [],
          estimatedDuration: serviceData.estimatedDuration,
          processingTime: serviceData.processingTime,
          rushOption: serviceData.rushOption || false,
          onlineAvailable: serviceData.onlineAvailable || true,
          inPersonAvailable: serviceData.inPersonAvailable !== false,
          mobileAvailable: serviceData.mobileAvailable || false
        },
        fees: {
          amount: serviceData.feeAmount || 0,
          currency: serviceData.currency || 'USD',
          waiverAvailable: serviceData.waiverAvailable || false,
          feeExemptions: serviceData.feeExemptions || [],
          paymentMethods: serviceData.paymentMethods || ['credit_card', 'check', 'cash']
        },
        availability: {
          locations: serviceData.locations || [],
          operatingHours: serviceData.operatingHours,
          seasonalAvailability: serviceData.seasonalAvailability,
          waitTimeEstimate: serviceData.waitTimeEstimate
        },
        outcomes: {
          types: serviceData.outcomeTypes || ['approval', 'denial'],
          appealProcess: serviceData.appealProcess,
          renewalProcess: serviceData.renewalProcess,
          associatedPermits: serviceData.associatedPermits || []
        },
        metrics: {
          totalApplications: 0,
          averageProcessingTime: 0,
          satisfactionScore: 0,
          successRate: 0
        },
        status: serviceData.status || 'active',
        metadata: {
          createdAt: serviceData.createdAt || now,
          updatedAt: now,
          version: (serviceData.version || 0) + 1,
          effectiveDate: serviceData.effectiveDate,
          expirationDate: serviceData.expirationDate,
          lastReviewedAt: now
        }
      };

      const { resource } = await this.servicesContainer.upsertItem(serviceTwin, {
        partitionKey: serviceData.category
      });

      await this.publishEvent('service-twin.updated', {
        serviceId,
        eventType: 'upsert',
        timestamp: now
      });

      logger.info('Service Twin upserted', {
        serviceId,
        name: serviceData.name,
        duration: Date.now() - startTime
      });

      return resource;
    } catch (error) {
      logger.error('Failed to upsert Service Twin', {
        error: error.message,
        serviceId: serviceData.serviceId
      });
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getService(serviceId) {
    try {
      const query = `SELECT * FROM c WHERE c.serviceId = "${serviceId}"`;
      const { resources } = await this.servicesContainer.items.query(query).fetchAll();
      return resources[0] || null;
    } catch (error) {
      logger.error('Failed to get Service Twin', { error: error.message, serviceId });
      throw error;
    }
  }

  /**
   * Search services by various criteria
   */
  async searchServices(query) {
    const sqlConditions = [];

    if (query.category) {
      sqlConditions.push(`c.metadata.category = "${query.category}"`);
    }
    if (query.subcategory) {
      sqlConditions.push(`c.metadata.subcategory = "${query.subcategory}"`);
    }
    if (query.keywords) {
      const keywordFilter = query.keywords.map(k => `c.metadata.keywords CONTAINS "${k}"`).join(' OR ');
      sqlConditions.push(`(${keywordFilter})`);
    }
    if (query.status) {
      sqlConditions.push(`c.status = "${query.status}"`);
    }
    if (query.onlineAvailable !== undefined) {
      sqlConditions.push(`c.process.onlineAvailable = ${query.onlineAvailable}`);
    }

    const whereClause = sqlConditions.length > 0
      ? `WHERE ${sqlConditions.join(' AND ')}`
      : '';

    const sqlQuery = `SELECT * FROM c ${whereClause}`;
    const { resources } = await this.servicesContainer.items.query(sqlQuery).fetchAll();

    return resources;
  }

  /**
   * Find services by eligibility match
   */
  async findEligibleServices(citizenProfile) {
    try {
      const allServicesQuery = `SELECT * FROM c WHERE c.status = "active"`;
      const { resources: allServices } = await this.servicesContainer.items
        .query(allServicesQuery)
        .fetchAll();

      const eligibleServices = allServices.filter(service => {
        return this.checkEligibility(service, citizenProfile);
      });

      return eligibleServices.map(service => ({
        serviceId: service.serviceId,
        name: service.metadata.name,
        shortDescription: service.metadata.shortDescription,
        category: service.metadata.category,
        estimatedDuration: service.process.estimatedDuration,
        onlineAvailable: service.process.onlineAvailable,
        eligibilityMatch: this.calculateEligibilityMatch(service, citizenProfile)
      }));
    } catch (error) {
      logger.error('Failed to find eligible services', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if citizen is eligible for a service
   */
  checkEligibility(service, citizenProfile) {
    const eligibility = service.eligibility;

    // Check citizen types
    if (!eligibility.citizenTypes.includes('all')) {
      if (!eligibility.citizenTypes.includes(citizenProfile.citizenType)) {
        return false;
      }
    }

    // Check age requirements
    if (eligibility.ageRequirements) {
      const birthDate = new Date(citizenProfile.dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (eligibility.ageRequirements.min && age < eligibility.ageRequirements.min) {
        return false;
      }
      if (eligibility.ageRequirements.max && age > eligibility.ageRequirements.max) {
        return false;
      }
    }

    // Check residency requirements
    if (eligibility.residencyRequirements) {
      if (eligibility.residencyRequirements.required &&
          !citizenProfile.residencyVerified) {
        return false;
      }
      if (eligibility.residencyRequirements.minimumYears &&
          citizenProfile.yearsInJurisdiction < eligibility.residencyRequirements.minimumYears) {
        return false;
      }
    }

    // Check exclusion criteria
    for (const exclusion of eligibility.exclusionCriteria) {
      if (this.matchesExclusion(citizenProfile, exclusion)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if citizen matches an exclusion criterion
   */
  matchesExclusion(citizenProfile, exclusion) {
    switch (exclusion.type) {
      case 'criminal_record':
        return citizenProfile.criminalRecord && citizenProfile.criminalRecord.seriousness >= exclusion.severity;
      case 'outstanding_fines':
        return citizenProfile.outstandingFines > 0;
      case 'deported':
        return citizenProfile.deportationStatus === 'deported';
      default:
        return false;
    }
  }

  /**
   * Calculate eligibility match score
   */
  calculateEligibilityMatch(service, citizenProfile) {
    let score = 100;
    const eligibility = service.eligibility;

    if (eligibility.citizenTypes.includes('all')) {
      score -= 0;
    } else if (eligibility.citizenTypes.includes(citizenProfile.citizenType)) {
      score -= 10;
    } else {
      score -= 50;
    }

    if (eligibility.prerequisiteServices?.length > 0) {
      const metPrerequisites = eligibility.prerequisiteServices.filter(
        ps => citizenProfile.currentServices?.includes(ps)
      );
      score -= (eligibility.prerequisiteServices.length - metPrerequisites.length) * 5;
    }

    return Math.max(0, score);
  }

  /**
   * Get service categories
   */
  async getCategories() {
    const { resources } = await this.categoriesContainer.items
      .query('SELECT * FROM c ORDER BY c.displayOrder')
      .fetchAll();
    return resources;
  }

  /**
   * Create service category
   */
  async createCategory(categoryData) {
    const category = {
      id: categoryData.id || uuidv4(),
      categoryId: categoryData.id || uuidv4(),
      name: categoryData.name,
      description: categoryData.description,
      parentCategory: categoryData.parentCategory || null,
      displayOrder: categoryData.displayOrder || 0,
      icon: categoryData.icon,
      color: categoryData.color,
      active: categoryData.active !== false
    };

    const { resource } = await this.categoriesContainer.upsertItem(category, {
      partitionKey: categoryData.parentCategory
    });

    return resource;
  }

  /**
   * Update service metrics
   */
  async updateServiceMetrics(serviceId, metricsUpdate) {
    try {
      const service = await this.getService(serviceId);
      if (!service) {
        throw new Error(`Service not found: ${serviceId}`);
      }

      if (metricsUpdate.totalApplications !== undefined) {
        service.metrics.totalApplications = metricsUpdate.totalApplications;
      }
      if (metricsUpdate.averageProcessingTime !== undefined) {
        service.metrics.averageProcessingTime = metricsUpdate.averageProcessingTime;
      }
      if (metricsUpdate.satisfactionScore !== undefined) {
        service.metrics.satisfactionScore = metricsUpdate.satisfactionScore;
      }
      if (metricsUpdate.successRate !== undefined) {
        service.metrics.successRate = metricsUpdate.successRate;
      }

      service.metadata.updatedAt = new Date().toISOString();
      service.metadata.version += 1;

      const { resource } = await this.servicesContainer.upsertItem(service, {
        partitionKey: service.metadata.category
      });

      return resource;
    } catch (error) {
      logger.error('Failed to update service metrics', {
        error: error.message,
        serviceId
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
      await this.servicesContainer.read();
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
    logger.info('Shutting down Service Twin Service');

    if (this.serviceBusClient) {
      await this.serviceBusClient.close();
    }

    logger.info('Service Twin Service shutdown complete');
  }
}

module.exports = { ServiceTwinService };

// Run as standalone service
if (require.main === module) {
  const config = {
    cosmosDbEndpoint: process.env.COSMOS_DB_ENDPOINT,
    cosmosDbKey: process.env.COSMOS_DB_KEY,
    serviceBusConnection: process.env.SERVICE_BUS_CONNECTION
  };

  const service = new ServiceTwinService(config);

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/services', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.upsertService(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/services/:serviceId', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.getService(req.params.serviceId);
      if (!result) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/services/search', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.searchServices(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/services/eligible/:residentId', async (req, res) => {
    try {
      await service.initialize();
      const result = await service.findEligibleServices(req.body);
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

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, async () => {
    await service.initialize();
    console.log(`Service Twin Service running on port ${PORT}`);
  });
}