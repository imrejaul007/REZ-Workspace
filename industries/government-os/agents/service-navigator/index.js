/**
 * Service Navigator Agent
 * Guides citizens to appropriate government services based on their needs and eligibility
 * Provides personalized recommendations and application assistance
 */

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
    new winston.transports.File({ filename: 'logs/service-navigator.log' })
  ]
});

class ServiceNavigatorAgent {
  constructor(config = {}) {
    this.config = {
      citizenTwinServiceUrl: config.citizenTwinServiceUrl || process.env.CITIZEN_TWIN_SERVICE_URL,
      serviceTwinServiceUrl: config.serviceTwinServiceUrl || process.env.SERVICE_TWIN_SERVICE_URL,
      permitTwinServiceUrl: config.permitTwinServiceUrl || process.env.PERMIT_TWIN_SERVICE_URL,
      complianceTwinServiceUrl: config.complianceTwinServiceUrl || process.env.COMPLIANCE_TWIN_SERVICE_URL,
      httpTimeout: config.httpTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config
    };

    this.conversationContexts = new Map();
    this.serviceCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Handle incoming citizen request
   */
  async handleRequest(request) {
    const startTime = Date.now();
    const sessionId = request.sessionId || uuidv4();

    try {
      logger.info('Processing service navigation request', {
        sessionId,
        requestType: request.type,
        residentId: request.residentId
      });

      let response;

      switch (request.type) {
        case 'discover':
          response = await this.discoverServices(request);
          break;
        case 'eligibility_check':
          response = await this.checkEligibility(request);
          break;
        case 'recommendation':
          response = await this.getRecommendations(request);
          break;
        case 'application_assistance':
          response = await this.provideApplicationAssistance(request);
          break;
        case 'renewal_reminder':
          response = await this.handleRenewalReminder(request);
          break;
        case 'follow_up':
          response = await this.handleFollowUp(request);
          break;
        default:
          response = await this.handleGeneralQuery(request);
      }

      logger.info('Request processed successfully', {
        sessionId,
        type: request.type,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        sessionId,
        response,
        metadata: {
          processedAt: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      };
    } catch (error) {
      logger.error('Request processing failed', {
        sessionId,
        error: error.message,
        type: request.type
      });

      return {
        success: false,
        sessionId,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message
        },
        metadata: {
          processedAt: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Discover services based on citizen needs
   */
  async discoverServices(request) {
    const { residentId, needs, keywords, category } = request;

    // Get citizen profile if residentId provided
    let citizenProfile = null;
    if (residentId) {
      citizenProfile = await this.fetchCitizenProfile(residentId);
    }

    // Search services
    const searchQuery = {
      keywords: keywords || (needs ? this.extractKeywordsFromNeeds(needs) : []),
      category,
      status: 'active'
    };

    const services = await this.searchServices(searchQuery);

    // Filter by eligibility if profile available
    let eligibleServices = services;
    if (citizenProfile) {
      eligibleServices = await this.filterEligibleServices(services, citizenProfile);
    }

    // Format response
    return {
      message: this.generateDiscoveryMessage(services.length, eligibleServices.length),
      services: eligibleServices.slice(0, 10).map(service => ({
        id: service.serviceId,
        name: service.metadata.name,
        description: service.metadata.shortDescription,
        category: service.metadata.category,
        eligibilityMatch: service.eligibilityMatch || null,
        onlineAvailable: service.process.onlineAvailable,
        estimatedDuration: service.process.estimatedDuration
      })),
      totalMatches: eligibleServices.length,
      filters: {
        eligibleOnly: !!citizenProfile,
        category: category || 'all'
      }
    };
  }

  /**
   * Check eligibility for specific service
   */
  async checkEligibility(request) {
    const { residentId, serviceId } = request;

    const citizenProfile = await this.fetchCitizenProfile(residentId);
    const service = await this.getService(serviceId);

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const eligibilityResult = this.evaluateEligibility(service, citizenProfile);

    return {
      serviceId,
      serviceName: service.metadata.name,
      eligible: eligibilityResult.eligible,
      eligibilityScore: eligibilityResult.score,
      missingRequirements: eligibilityResult.missingRequirements,
      messages: eligibilityResult.messages,
      suggestions: eligibilityResult.suggestions,
      nextSteps: this.generateNextSteps(eligibilityResult)
    };
  }

  /**
   * Get personalized service recommendations
   */
  async getRecommendations(request) {
    const { residentId, context } = request;

    const citizenProfile = await this.fetchCitizenProfile(residentId);
    if (!citizenProfile) {
      throw new Error(`Citizen profile not found: ${residentId}`);
    }

    // Get all eligible services
    const allServices = await this.fetchAllServices();
    const eligibleServices = await this.filterEligibleServices(allServices, citizenProfile);

    // Score and rank services based on citizen needs
    const scoredServices = eligibleServices.map(service => ({
      ...service,
      recommendationScore: this.calculateRecommendationScore(service, citizenProfile, context)
    }));

    scoredServices.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Categorize recommendations
    const categories = {
      highPriority: scoredServices.filter(s => s.recommendationScore >= 80).slice(0, 3),
      recommended: scoredServices.filter(s => s.recommendationScore >= 50 && s.recommendationScore < 80).slice(0, 5),
      available: scoredServices.filter(s => s.recommendationScore < 50).slice(0, 5)
    };

    return {
      citizenProfile: {
        residentId: citizenProfile.residentId,
        citizenType: citizenProfile.profile.citizenType,
        currentServices: citizenProfile.needs.currentServices
      },
      recommendations: {
        highPriority: categories.highPriority.map(s => this.formatServiceSummary(s)),
        recommended: categories.recommended.map(s => this.formatServiceSummary(s)),
        available: categories.available.map(s => this.formatServiceSummary(s))
      },
      reason: this.generateRecommendationReason(categories, citizenProfile)
    };
  }

  /**
   * Provide application assistance
   */
  async provideApplicationAssistance(request) {
    const { residentId, serviceId, step } = request;

    const citizenProfile = await this.fetchCitizenProfile(residentId);
    const service = await this.getService(serviceId);

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Get or create conversation context
    const contextKey = `${residentId}:${serviceId}`;
    let context = this.conversationContexts.get(contextKey);

    if (!context) {
      context = {
        residentId,
        serviceId,
        currentStep: 0,
        completedSteps: [],
        providedData: {},
        questions: []
      };
      this.conversationContexts.set(contextKey, context);
    }

    // Process current step
    if (step !== undefined) {
      context.currentStep = step;
    }

    // Get required documents
    const requiredDocuments = this.getRequiredDocumentsForStep(service, context.currentStep);

    // Generate guidance
    const guidance = this.generateStepGuidance(service, context);

    return {
      context: {
        sessionId: contextKey,
        currentStep: context.currentStep,
        totalSteps: service.process.steps?.length || 5
      },
      stepInfo: {
        stepNumber: context.currentStep + 1,
        stepName: service.process.steps?.[context.currentStep]?.name || 'Information Collection',
        description: service.process.steps?.[context.currentStep]?.description || 'Provide required information'
      },
      requiredDocuments,
      guidance,
      questions: this.generateStepQuestions(service, context),
      tips: this.generateStepTips(service, context.currentStep),
      nextStep: context.currentStep < (service.process.steps?.length || 5) - 1
        ? context.currentStep + 1
        : 'review'
    };
  }

  /**
   * Handle renewal reminder interaction
   */
  async handleRenewalReminder(request) {
    const { residentId, permitId } = request;

    const citizenProfile = await this.fetchCitizenProfile(residentId);
    const application = await this.getApplication(permitId);

    if (!application) {
      throw new Error(`Permit application not found: ${permitId}`);
    }

    const permit = await this.getPermit(application.permitId);
    const renewalInfo = this.calculateRenewalInfo(application, permit);

    return {
      permitInfo: {
        documentNumber: application.issuance.documentNumber,
        permitType: application.permitType,
        issuedDate: application.issuance.issuedAt,
        expirationDate: application.issuance.expirationDate,
        renewalRequired: renewalInfo.renewalRequired,
        daysUntilExpiration: renewalInfo.daysUntilExpiration
      },
      renewal: {
        available: renewalInfo.renewalAvailable,
        onlineRenewal: permit?.process?.onlineAvailable || false,
        requirements: renewalInfo.requirements,
        fee: renewalInfo.fee,
        deadline: renewalInfo.deadline
      },
      actions: {
        startRenewal: renewalInfo.renewalAvailable,
        viewDetails: true,
        scheduleReminder: true,
        contactSupport: true
      }
    };
  }

  /**
   * Handle follow-up interaction
   */
  async handleFollowUp(request) {
    const { residentId, previousResponse } = request;

    const citizenProfile = await this.fetchCitizenProfile(residentId);
    const pendingApplications = citizenProfile?.needs?.pendingApplications || [];
    const activeServices = citizenProfile?.needs?.currentServices || [];

    const updates = {
      pendingApplications: [],
      serviceUpdates: [],
      upcomingRenewals: []
    };

    // Check each pending application
    for (const appId of pendingApplications) {
      const application = await this.getApplication(appId);
      if (application) {
        updates.pendingApplications.push({
          applicationId: appId,
          status: application.status,
          currentStage: application.review.currentStage,
          lastUpdated: application.metadata.updatedAt
        });
      }
    }

    return {
      summary: `You have ${updates.pendingApplications.length} pending application(s).`,
      updates,
      quickActions: this.generateQuickActions(updates)
    };
  }

  /**
   * Handle general query
   */
  async handleGeneralQuery(request) {
    const { query, residentId } = request;

    // Search services and regulations
    const [services, regulations] = await Promise.all([
      this.searchServices({ keywords: this.tokenizeQuery(query) }),
      this.searchRegulations({ keywords: this.tokenizeQuery(query) })
    ]);

    return {
      query,
      results: {
        services: services.slice(0, 5).map(s => ({
          id: s.serviceId,
          name: s.metadata.name,
          description: s.metadata.shortDescription
        })),
        regulations: regulations.slice(0, 3).map(r => ({
          id: r.regulationId,
          title: r.metadata.title,
          description: r.metadata.shortDescription
        }))
      },
      suggestion: services.length > 0
        ? `I found ${services.length} service(s) related to your query. Would you like more details?`
        : 'I couldn\'t find specific services for your query. Can you provide more details?'
    };
  }

  // Helper methods

  async fetchCitizenProfile(residentId) {
    // In production, this would call the citizen-twin-service
    // For now, return mock or throw error
    if (!this.config.citizenTwinServiceUrl) {
      return null;
    }

    const response = await this.makeRequest(
      `${this.config.citizenTwinServiceUrl}/citizen-twins/${residentId}`
    );
    return response;
  }

  async fetchAllServices() {
    const cacheKey = 'all_services';
    const cached = this.serviceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    if (!this.config.serviceTwinServiceUrl) {
      return [];
    }

    const response = await this.makeRequest(
      `${this.config.serviceTwinServiceUrl}/services`
    );

    this.serviceCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return response;
  }

  async searchServices(query) {
    if (!this.config.serviceTwinServiceUrl) {
      return [];
    }

    const params = new URLSearchParams();
    if (query.keywords) {
      query.keywords.forEach(k => params.append('keywords', k));
    }
    if (query.category) params.append('category', query.category);
    if (query.status) params.append('status', query.status);

    return this.makeRequest(
      `${this.config.serviceTwinServiceUrl}/services/search?${params.toString()}`
    );
  }

  async searchRegulations(query) {
    if (!this.config.complianceTwinServiceUrl) {
      return [];
    }

    const params = new URLSearchParams();
    if (query.keywords) {
      query.keywords.forEach(k => params.append('keywords', k));
    }

    return this.makeRequest(
      `${this.config.complianceTwinServiceUrl}/regulations/search?${params.toString()}`
    );
  }

  async getService(serviceId) {
    if (!this.config.serviceTwinServiceUrl) {
      return null;
    }

    return this.makeRequest(
      `${this.config.serviceTwinServiceUrl}/services/${serviceId}`
    );
  }

  async getApplication(applicationId) {
    if (!this.config.permitTwinServiceUrl) {
      return null;
    }

    return this.makeRequest(
      `${this.config.permitTwinServiceUrl}/applications/${applicationId}`
    );
  }

  async getPermit(permitId) {
    if (!this.config.permitTwinServiceUrl) {
      return null;
    }

    return this.makeRequest(
      `${this.config.permitTwinServiceUrl}/permits/${permitId}`
    );
  }

  async filterEligibleServices(services, citizenProfile) {
    return services.map(service => ({
      ...service,
      eligibilityMatch: this.evaluateEligibility(service, citizenProfile)
    })).filter(s => s.eligibilityMatch.eligible || s.eligibilityMatch.score > 50);
  }

  evaluateEligibility(service, citizenProfile) {
    const eligibility = service.eligibility;
    const result = {
      eligible: true,
      score: 100,
      missingRequirements: [],
      messages: [],
      suggestions: []
    };

    // Check citizen types
    if (!eligibility.citizenTypes.includes('all')) {
      if (!eligibility.citizenTypes.includes(citizenProfile.profile?.citizenType)) {
        result.eligible = false;
        result.score -= 100;
        result.missingRequirements.push('Citizen type not eligible');
        result.messages.push(`This service is available for: ${eligibility.citizenTypes.join(', ')}`);
      }
    }

    // Check age requirements
    if (eligibility.ageRequirements && citizenProfile.demographics?.dateOfBirth) {
      const age = this.calculateAge(citizenProfile.demographics.dateOfBirth);
      if (eligibility.ageRequirements.min && age < eligibility.ageRequirements.min) {
        result.score -= 20;
        result.missingRequirements.push(`Minimum age: ${eligibility.ageRequirements.min}`);
        result.suggestions.push(`You will become eligible in ${eligibility.ageRequirements.min - age} year(s)`);
      }
    }

    // Check prerequisites
    if (eligibility.prerequisiteServices?.length > 0) {
      const currentServices = citizenProfile.needs?.currentServices || [];
      const missing = eligibility.prerequisiteServices.filter(
        ps => !currentServices.includes(ps)
      );
      if (missing.length > 0) {
        result.score -= missing.length * 10;
        result.missingRequirements.push(`Prerequisite services required: ${missing.join(', ')}`);
      }
    }

    return result;
  }

  calculateRecommendationScore(service, citizenProfile, context) {
    let score = 50; // Base score

    // Boost for matching needs
    const citizenNeeds = citizenProfile.needs?.flaggedNeeds || [];
    const serviceTags = service.metadata?.tags || [];

    for (const need of citizenNeeds) {
      if (serviceTags.includes(need) || service.metadata?.keywords?.includes(need)) {
        score += 20;
      }
    }

    // Boost for online availability
    if (service.process?.onlineAvailable) {
      score += 10;
    }

    // Boost for citizen type match
    if (service.eligibility?.citizenTypes.includes(citizenProfile.profile?.citizenType)) {
      score += 15;
    }

    // Boost for not already enrolled
    const currentServices = citizenProfile.needs?.currentServices || [];
    if (!currentServices.includes(service.serviceId)) {
      score += 5;
    }

    return Math.min(100, score);
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  calculateRenewalInfo(application, permit) {
    const expirationDate = new Date(application.issuance.expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const renewalNoticeDays = permit?.validity?.renewalNoticeDays || 60;

    return {
      renewalRequired: daysUntilExpiration <= renewalNoticeDays,
      renewalAvailable: daysUntilExpiration > 0,
      daysUntilExpiration,
      requirements: permit?.documents?.required || [],
      fee: permit?.fees?.amount || 0,
      deadline: new Date(expirationDate.getTime() - renewalNoticeDays * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  extractKeywordsFromNeeds(needs) {
    if (Array.isArray(needs)) return needs;
    if (typeof needs === 'string') return needs.split(/[,\s]+/);
    return [];
  }

  tokenizeQuery(query) {
    return query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  }

  generateDiscoveryMessage(total, eligible) {
    if (total === 0) {
      return 'I couldn\'t find any services matching your criteria.';
    }
    if (eligible === 0) {
      return `Found ${total} service(s), but none match your eligibility profile.`;
    }
    if (eligible === total) {
      return `Found ${total} service(s) that you may be eligible for.`;
    }
    return `Found ${total} service(s), including ${eligible} that match your eligibility.`;
  }

  generateNextSteps(eligibilityResult) {
    if (eligibilityResult.eligible) {
      return [
        { action: 'view_details', label: 'View service details' },
        { action: 'check_documents', label: 'Check required documents' },
        { action: 'start_application', label: 'Start application' }
      ];
    }

    const steps = [];
    if (eligibilityResult.missingRequirements.length > 0) {
      steps.push({ action: 'review_requirements', label: 'Review missing requirements' });
    }
    steps.push({ action: 'set_reminder', label: 'Set reminder for eligibility date' });
    return steps;
  }

  generateRecommendationReason(categories, citizenProfile) {
    if (categories.highPriority.length > 0) {
      return `Based on your profile as a ${citizenProfile.profile?.citizenType}, here are your top recommendations.`;
    }
    return 'Here are services available to you based on your eligibility.';
  }

  getRequiredDocumentsForStep(service, step) {
    return service.documents?.required || [];
  }

  generateStepGuidance(service, context) {
    const stepInfo = service.process?.steps?.[context.currentStep];
    return stepInfo?.guidance || 'Please provide the required information for this step.';
  }

  generateStepQuestions(service, context) {
    return service.process?.steps?.[context.currentStep]?.questions || [];
  }

  generateStepTips(service, step) {
    return [
      'Ensure all information is accurate before proceeding.',
      'Have supporting documents ready for verification.',
      'Save your progress frequently.'
    ];
  }

  generateQuickActions(updates) {
    const actions = [];
    if (updates.pendingApplications.length > 0) {
      actions.push({ action: 'check_applications', label: 'Check application status' });
    }
    if (updates.upcomingRenewals.length > 0) {
      actions.push({ action: 'view_renewals', label: 'View upcoming renewals' });
    }
    actions.push({ action: 'search_services', label: 'Search for services' });
    return actions;
  }

  formatServiceSummary(service) {
    return {
      id: service.serviceId,
      name: service.metadata.name,
      description: service.metadata.shortDescription,
      category: service.metadata.category,
      estimatedDuration: service.process.estimatedDuration,
      onlineAvailable: service.process.onlineAvailable,
      recommendationScore: service.recommendationScore
    };
  }

  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.httpTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const checks = {
      citizenTwinService: false,
      serviceTwinService: false,
      permitTwinService: false
    };

    // Check each service
    try {
      if (this.config.citizenTwinServiceUrl) {
        await this.makeRequest(`${this.config.citizenTwinServiceUrl}/health`);
        checks.citizenTwinService = true;
      } else {
        checks.citizenTwinService = null; // Not configured
      }
    } catch (error) {
      // Service unavailable
    }

    try {
      if (this.config.serviceTwinServiceUrl) {
        await this.makeRequest(`${this.config.serviceTwinServiceUrl}/health`);
        checks.serviceTwinService = true;
      } else {
        checks.serviceTwinService = null;
      }
    } catch (error) {
      // Service unavailable
    }

    const healthy = Object.values(checks).filter(v => v === true).length > 0;

    return {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      activeContexts: this.conversationContexts.size,
      cacheSize: this.serviceCache.size
    };
  }
}

module.exports = { ServiceNavigatorAgent };

// Run as standalone agent
if (require.main === module) {
  const agent = new ServiceNavigatorAgent({
    citizenTwinServiceUrl: process.env.CITIZEN_TWIN_SERVICE_URL,
    serviceTwinServiceUrl: process.env.SERVICE_TWIN_SERVICE_URL,
    permitTwinServiceUrl: process.env.PERMIT_TWIN_SERVICE_URL,
    complianceTwinServiceUrl: process.env.COMPLIANCE_TWIN_SERVICE_URL
  });

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/navigate', async (req, res) => {
    try {
      const result = await agent.handleRequest(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/health', async (req, res) => {
    try {
      res.json(await agent.healthCheck());
    } catch (error) {
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Service Navigator Agent running on port ${PORT}`);
  });
}