/**
 * Compliance Checker Agent
 * Verifies regulatory compliance, checks requirements, and validates submissions
 * Integrates with Compliance Twin Service for regulatory data
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
    new winston.transports.File({ filename: 'logs/compliance-checker.log' })
  ]
});

class ComplianceCheckerAgent {
  constructor(config = {}) {
    this.config = {
      complianceTwinServiceUrl: config.complianceTwinServiceUrl || process.env.COMPLIANCE_TWIN_SERVICE_URL,
      permitTwinServiceUrl: config.permitTwinServiceUrl || process.env.PERMIT_TWIN_SERVICE_URL,
      citizenTwinServiceUrl: config.citizenTwinServiceUrl || process.env.CITIZEN_TWIN_SERVICE_URL,
      externalVerificationUrls: config.externalVerificationUrls || {},
      httpTimeout: config.httpTimeout || 30000,
      ...config
    };

    this.checkCache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Perform a comprehensive compliance check
   */
  async checkCompliance(checkRequest) {
    const startTime = Date.now();
    const checkId = uuidv4();

    logger.info('Starting compliance check', {
      checkId,
      entityId: checkRequest.entityId,
      entityType: checkRequest.entityType,
      checkType: checkRequest.checkType
    });

    try {
      let results;

      switch (checkRequest.checkType) {
        case 'full':
          results = await this.performFullCheck(checkRequest);
          break;
        case 'document':
          results = await this.checkDocumentCompliance(checkRequest);
          break;
        case 'business':
          results = await this.checkBusinessCompliance(checkRequest);
          break;
        case 'permit_prerequisite':
          results = await this.checkPermitPrerequisites(checkRequest);
          break;
        default:
          results = await this.performBasicCheck(checkRequest);
      }

      logger.info('Compliance check completed', {
        checkId,
        passed: results.passed,
        issues: results.issues?.length || 0,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        checkId,
        results,
        metadata: {
          checkedAt: new Date().toISOString(),
          duration: Date.now() - startTime,
          checkType: checkRequest.checkType
        }
      };
    } catch (error) {
      logger.error('Compliance check failed', {
        checkId,
        error: error.message
      });

      return {
        success: false,
        checkId,
        error: {
          code: 'CHECK_FAILED',
          message: error.message
        }
      };
    }
  }

  /**
   * Perform full compliance check
   */
  async performFullCheck(request) {
    const { entityId, entityType, regulations } = request;

    // Get existing compliance records
    const existingRecords = await this.getComplianceRecords(entityId, entityType);

    // Get applicable regulations
    const applicableRegulations = regulations || await this.getApplicableRegulations(entityType, request.context);

    // Check each regulation
    const results = {
      passed: true,
      score: 100,
      issues: [],
      warnings: [],
      compliantRegulations: [],
      nonCompliantRegulations: [],
      pendingRegulations: [],
      checkedRegulations: []
    };

    for (const regulation of applicableRegulations) {
      const checkResult = await this.checkRegulationCompliance(
        entityId,
        entityType,
        regulation
      );

      results.checkedRegulations.push({
        regulationId: regulation.regulationId,
        title: regulation.metadata.title,
        status: checkResult.status
      });

      if (checkResult.status === 'compliant') {
        results.compliantRegulations.push(regulation.regulationId);
      } else if (checkResult.status === 'non_compliant') {
        results.nonCompliantRegulations.push(regulation.regulationId);
        results.issues.push(...checkResult.issues);
        results.passed = false;
        results.score -= 10;
      } else if (checkResult.status === 'pending') {
        results.pendingRegulations.push(regulation.regulationId);
      }

      if (checkResult.warnings) {
        results.warnings.push(...checkResult.warnings);
      }
    }

    // Overall assessment
    results.score = Math.max(0, results.score);

    return results;
  }

  /**
   * Check document compliance
   */
  async checkDocumentCompliance(request) {
    const { entityId, documents } = request;

    const results = {
      passed: true,
      verifiedDocuments: [],
      rejectedDocuments: [],
      pendingDocuments: [],
      issues: [],
      warnings: []
    };

    for (const doc of documents) {
      const verification = await this.verifyDocument(entityId, doc);

      if (verification.status === 'verified') {
        results.verifiedDocuments.push({
          documentId: doc.id,
          documentType: doc.type,
          verifiedAt: verification.verifiedAt
        });
      } else if (verification.status === 'pending') {
        results.pendingDocuments.push({
          documentId: doc.id,
          documentType: doc.type,
          reason: verification.reason
        });
        results.passed = false;
      } else {
        results.rejectedDocuments.push({
          documentId: doc.id,
          documentType: doc.type,
          reason: verification.reason
        });
        results.issues.push({
          documentId: doc.id,
          type: doc.type,
          issue: verification.reason
        });
        results.passed = false;
      }
    }

    return results;
  }

  /**
   * Check business compliance
   */
  async checkBusinessCompliance(request) {
    const { businessId, businessType, checks } = request;

    const results = {
      passed: true,
      checks: [],
      issues: [],
      warnings: [],
      requiredInsurances: [],
      verifiedInsurances: [],
      missingInsurances: []
    };

    // Check insurance requirements
    if (checks?.includes('insurance') || !checks) {
      const insuranceResult = await this.checkInsuranceCompliance(businessId, businessType);
      results.requiredInsurances = insuranceResult.required;
      results.verifiedInsurances = insuranceResult.verified;
      results.missingInsurances = insuranceResult.missing;

      if (results.missingInsurances.length > 0) {
        results.issues.push({
          type: 'missing_insurance',
          details: results.missingInsurances
        });
        results.passed = false;
      }
    }

    // Check licensing requirements
    if (checks?.includes('licensing') || !checks) {
      const licensingResult = await this.checkLicensingCompliance(businessId, businessType);
      results.checks.push({
        type: 'licensing',
        status: licensingResult.status,
        details: licensingResult.details
      });

      if (!licensingResult.compliant) {
        results.issues.push({
          type: 'licensing',
          details: licensingResult.issues
        });
        results.passed = false;
      }
    }

    // Check registration status
    if (checks?.includes('registration') || !checks) {
      const registrationResult = await this.checkRegistrationCompliance(businessId);
      results.checks.push({
        type: 'registration',
        status: registrationResult.status,
        details: registrationResult.details
      });

      if (!registrationResult.compliant) {
        results.issues.push({
          type: 'registration',
          details: registrationResult.issues
        });
        results.passed = false;
      }
    }

    // Check tax compliance
    if (checks?.includes('tax') || !checks) {
      const taxResult = await this.checkTaxCompliance(businessId);
      results.checks.push({
        type: 'tax',
        status: taxResult.status,
        details: taxResult.details
      });

      if (!taxResult.compliant) {
        results.warnings.push({
          type: 'tax',
          details: taxResult.issues
        });
      }
    }

    return results;
  }

  /**
   * Check permit prerequisites
   */
  async checkPermitPrerequisites(request) {
    const { residentId, permitId } = request;

    const permit = await this.getPermit(permitId);
    if (!permit) {
      return {
        passed: false,
        issues: [{ type: 'permit_not_found', permitId }]
      };
    }

    const results = {
      passed: true,
      prerequisites: [],
      satisfied: [],
      unsatisfied: [],
      issues: []
    };

    // Check prerequisite services
    const prereqServices = permit.eligibility?.prerequisiteServices || [];
    for (const prereqService of prereqServices) {
      const citizenProfile = await this.getCitizenProfile(residentId);
      const hasService = citizenProfile?.needs?.currentServices?.includes(prereqService);

      results.prerequisites.push({
        serviceId: prereqService,
        required: true,
        satisfied: !!hasService
      });

      if (hasService) {
        results.satisfied.push(prereqService);
      } else {
        results.unsatisfied.push(prereqService);
        results.issues.push({
          type: 'missing_prerequisite',
          serviceId: prereqService
        });
        results.passed = false;
      }
    }

    // Check prerequisite permits
    const prereqPermits = permit.eligibility?.prerequisitePermits || [];
    for (const prereqPermit of prereqPermits) {
      const hasPermit = await this.checkActivePermit(residentId, prereqPermit);

      results.prerequisites.push({
        permitType: prereqPermit,
        required: true,
        satisfied: hasPermit
      });

      if (hasPermit) {
        results.satisfied.push(prereqPermit);
      } else {
        results.unsatisfied.push(prereqPermit);
        results.issues.push({
          type: 'missing_prerequisite_permit',
          permitType: prereqPermit
        });
        results.passed = false;
      }
    }

    // Check compliance requirements
    const complianceRequirements = permit.eligibility?.complianceRequirements || [];
    for (const req of complianceRequirements) {
      const complianceStatus = await this.getComplianceStatus(residentId, 'citizen', req.regulationId);

      if (complianceStatus?.overallStatus === 'non_compliant') {
        results.issues.push({
          type: 'compliance_requirement',
          regulationId: req.regulationId,
          status: 'non_compliant'
        });
        results.passed = false;
      }

      results.prerequisites.push({
        regulationId: req.regulationId,
        required: true,
        satisfied: complianceStatus?.overallStatus === 'compliant'
      });
    }

    return results;
  }

  /**
   * Perform basic compliance check
   */
  async performBasicCheck(request) {
    const { entityId, entityType } = request;

    const complianceStatus = await this.getComplianceStatus(entityId, entityType);

    return {
      passed: complianceStatus?.overallStatus !== 'non_compliant',
      score: complianceStatus?.complianceRate || 0,
      issues: complianceStatus?.overdueRemediations || [],
      warnings: []
    };
  }

  /**
   * Check compliance for a specific regulation
   */
  async checkRegulationCompliance(entityId, entityType, regulation) {
    // Get or create compliance record
    let record = await this.getComplianceRecord(entityId, entityType, regulation.regulationId);

    if (!record) {
      // Create new compliance record
      record = await this.createComplianceRecord({
        entityId,
        entityType,
        entityName: regulation.metadata.title,
        regulationId: regulation.regulationId,
        regulationTitle: regulation.metadata.title
      });
    }

    // Perform assessment
    const assessment = await this.assessRegulation(regulation, record);

    // Update record with assessment
    await this.updateComplianceRecord(record.recordId, assessment);

    return {
      status: assessment.result,
      issues: assessment.issues,
      warnings: assessment.warnings,
      details: assessment.details
    };
  }

  /**
   * Assess compliance for a regulation
   */
  async assessRegulation(regulation, record) {
    const result = {
      result: 'compliant',
      issues: [],
      warnings: [],
      details: {}
    };

    // Check effective dates
    const effectiveDate = new Date(regulation.content?.effectiveDate);
    const expirationDate = regulation.content?.expirationDate
      ? new Date(regulation.content.expirationDate)
      : null;

    if (effectiveDate > new Date()) {
      result.result = 'pending';
      result.warnings.push({
        type: 'not_yet_effective',
        effectiveDate: regulation.content.effectiveDate
      });
      return result;
    }

    if (expirationDate && expirationDate < new Date()) {
      result.result = 'expired';
      result.warnings.push({
        type: 'regulation_expired',
        expirationDate: regulation.content.expirationDate
      });
      return result;
    }

    // Check applicability
    const applicability = regulation.applicability;
    if (applicability?.mandatoryCompliance === false) {
      result.warnings.push({
        type: 'non_mandatory',
        message: 'This regulation is not mandatory'
      });
    }

    // Check reporting requirements
    if (regulation.reporting?.reportingRequired) {
      result.details.reportingDue = this.checkReportingStatus(record);
      if (result.details.reportingDue.overdue) {
        result.result = 'non_compliant';
        result.issues.push({
          type: 'overdue_report',
          dueDate: result.details.reportingDue.dueDate
        });
      }
    }

    // Check for violations
    if (record.violations?.length > 0) {
      const unresolvedViolations = record.violations.filter(v => !v.resolvedAt);
      if (unresolvedViolations.length > 0) {
        result.result = 'non_compliant';
        result.issues.push({
          type: 'unresolved_violations',
          count: unresolvedViolations.length
        });
      }
    }

    // Check remediation requirements
    if (record.remediation?.required && !record.remediation.completedAt) {
      result.result = 'non_compliant';
      result.issues.push({
        type: 'pending_remediation',
        deadline: record.remediation.deadline
      });
    }

    return result;
  }

  /**
   * Verify a document
   */
  async verifyDocument(entityId, document) {
    const cacheKey = `doc:${entityId}:${document.id}`;
    const cached = this.checkCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      // Check document type requirements
      const requirements = this.getDocumentRequirements(document.type);

      const result = {
        status: 'verified',
        verifiedAt: new Date().toISOString()
      };

      // Validate document fields
      if (requirements.requiredFields) {
        for (const field of requirements.requiredFields) {
          if (!document[field]) {
            result.status = 'rejected';
            result.reason = `Missing required field: ${field}`;
            break;
          }
        }
      }

      // Check expiration
      if (document.expirationDate) {
        const expDate = new Date(document.expirationDate);
        if (expDate < new Date()) {
          result.status = 'rejected';
          result.reason = 'Document has expired';
        } else if (expDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
          result.status = 'pending';
          result.reason = 'Document expiring soon';
        }
      }

      // External verification if configured
      if (result.status === 'verified' && this.config.externalVerificationUrls[document.type]) {
        const externalResult = await this.externalVerify(document);
        if (!externalResult.valid) {
          result.status = 'rejected';
          result.reason = externalResult.reason;
        }
      }

      this.checkCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      logger.error('Document verification failed', {
        documentId: document.id,
        error: error.message
      });
      return {
        status: 'pending',
        reason: 'Verification failed: ' + error.message
      };
    }
  }

  /**
   * Check insurance compliance
   */
  async checkInsuranceCompliance(businessId, businessType) {
    const requirements = this.getInsuranceRequirements(businessType);

    const result = {
      required: requirements,
      verified: [],
      missing: []
    };

    for (const req of requirements) {
      const hasInsurance = await this.verifyInsurance(businessId, req.type);
      if (hasInsurance) {
        result.verified.push(req);
      } else {
        result.missing.push(req);
      }
    }

    return result;
  }

  /**
   * Check licensing compliance
   */
  async checkLicensingCompliance(businessId, businessType) {
    const requiredLicenses = this.getRequiredLicenses(businessType);

    const result = {
      compliant: true,
      details: [],
      issues: []
    };

    for (const license of requiredLicenses) {
      const hasLicense = await this.verifyLicense(businessId, license);
      result.details.push({
        licenseType: license,
        active: hasLicense
      });

      if (!hasLicense) {
        result.compliant = false;
        result.issues.push(`Missing required license: ${license}`);
      }
    }

    return result;
  }

  /**
   * Check registration compliance
   */
  async checkRegistrationCompliance(businessId) {
    // In production, verify with business registry
    return {
      compliant: true,
      details: {
        registered: true,
        status: 'active'
      }
    };
  }

  /**
   * Check tax compliance
   */
  async checkTaxCompliance(businessId) {
    // In production, verify with tax authority
    return {
      compliant: true,
      details: {
        filingsUpToDate: true,
        paymentsCurrent: true
      },
      issues: []
    };
  }

  // Helper methods

  getDocumentRequirements(documentType) {
    const requirements = {
      drivers_license: {
        requiredFields: ['number', 'state', 'expirationDate'],
        verificationLevel: 'external'
      },
      ssn: {
        requiredFields: ['number'],
        verificationLevel: 'internal'
      },
      proof_of_address: {
        requiredFields: ['address', 'date'],
        verificationLevel: 'manual'
      }
    };

    return requirements[documentType] || { requiredFields: [], verificationLevel: 'none' };
  }

  getInsuranceRequirements(businessType) {
    const commonRequirements = [
      { type: 'general_liability', name: 'General Liability Insurance' },
      { type: 'workers_comp', name: 'Workers Compensation' }
    ];

    const typeSpecific = {
      restaurant: [
        { type: 'liquor_liability', name: 'Liquor Liability Insurance' },
        { type: 'food_liability', name: 'Food Liability Insurance' }
      ],
      contractor: [
        { type: 'bonding', name: 'Contractor Bonding' },
        { type: 'vehicle_insurance', name: 'Commercial Vehicle Insurance' }
      ]
    };

    return [...commonRequirements, ...(typeSpecific[businessType] || [])];
  }

  getRequiredLicenses(businessType) {
    const commonLicenses = ['business_license', 'tax_registration'];
    const typeSpecific = {
      restaurant: ['food_service_license', 'liquor_license'],
      contractor: ['contractor_license'],
      healthcare: ['healthcare_facility_license']
    };

    return [...commonLicenses, ...(typeSpecific[businessType] || [])];
  }

  checkReportingStatus(record) {
    if (!record.nextReportingDate) {
      return { overdue: false };
    }

    const dueDate = new Date(record.nextReportingDate);
    return {
      dueDate: record.nextReportingDate,
      overdue: dueDate < new Date()
    };
  }

  async externalVerify(document) {
    // Placeholder for external verification
    return { valid: true };
  }

  async verifyInsurance(businessId, insuranceType) {
    // Placeholder - would verify with insurance registry
    return true;
  }

  async verifyLicense(businessId, licenseType) {
    // Placeholder - would verify with licensing board
    return true;
  }

  async getComplianceRecords(entityId, entityType) {
    if (!this.config.complianceTwinServiceUrl) {
      return [];
    }

    try {
      return await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/compliance/${entityType}/${entityId}`
      );
    } catch (error) {
      logger.error('Failed to get compliance records', { entityId, error: error.message });
      return [];
    }
  }

  async getComplianceRecord(entityId, entityType, regulationId) {
    if (!this.config.complianceTwinServiceUrl) {
      return null;
    }

    try {
      const records = await this.getComplianceRecords(entityId, entityType);
      return records.find(r => r.regulationId === regulationId);
    } catch (error) {
      return null;
    }
  }

  async getComplianceStatus(entityId, entityType, regulationId) {
    if (!this.config.complianceTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/compliance/${entityType}/${entityId}`
      );
    } catch (error) {
      return null;
    }
  }

  async getApplicableRegulations(entityType, context) {
    if (!this.config.complianceTwinServiceUrl) {
      return [];
    }

    try {
      const query = new URLSearchParams();
      query.append('entityType', entityType);
      if (context?.jurisdiction) {
        query.append('jurisdiction', context.jurisdiction);
      }

      return await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/regulations/search?${query.toString()}`
      );
    } catch (error) {
      logger.error('Failed to get regulations', { error: error.message });
      return [];
    }
  }

  async getPermit(permitId) {
    if (!this.config.permitTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.permitTwinServiceUrl}/permits/${permitId}`
      );
    } catch (error) {
      return null;
    }
  }

  async getCitizenProfile(residentId) {
    if (!this.config.citizenTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.citizenTwinServiceUrl}/citizen-twins/${residentId}`
      );
    } catch (error) {
      return null;
    }
  }

  async checkActivePermit(residentId, permitType) {
    // Check if resident has an active permit of the specified type
    return false;
  }

  async createComplianceRecord(recordData) {
    if (!this.config.complianceTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/compliance-records`,
        {
          method: 'POST',
          body: JSON.stringify(recordData)
        }
      );
    } catch (error) {
      logger.error('Failed to create compliance record', { error: error.message });
      return null;
    }
  }

  async updateComplianceRecord(recordId, assessment) {
    if (!this.config.complianceTwinServiceUrl) {
      return;
    }

    try {
      await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/compliance-records/${recordId}/assess`,
        {
          method: 'POST',
          body: JSON.stringify(assessment)
        }
      );
    } catch (error) {
      logger.error('Failed to update compliance record', { recordId, error: error.message });
    }
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
        },
        body: options.body
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
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
      complianceTwinService: false,
      permitTwinService: false,
      citizenTwinService: false
    };

    if (this.config.complianceTwinServiceUrl) {
      try {
        await this.makeRequest(`${this.config.complianceTwinServiceUrl}/health`);
        checks.complianceTwinService = true;
      } catch (error) {
        // Service unavailable
      }
    }

    return {
      status: checks.complianceTwinService ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      cacheSize: this.checkCache.size
    };
  }
}

module.exports = { ComplianceCheckerAgent };

// Run as standalone agent
if (require.main === module) {
  const agent = new ComplianceCheckerAgent({
    complianceTwinServiceUrl: process.env.COMPLIANCE_TWIN_SERVICE_URL,
    permitTwinServiceUrl: process.env.PERMIT_TWIN_SERVICE_URL,
    citizenTwinServiceUrl: process.env.CITIZEN_TWIN_SERVICE_URL
  });

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/check', async (req, res) => {
    try {
      const result = await agent.checkCompliance(req.body);
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

  const PORT = process.env.PORT || 4003;
  app.listen(PORT, () => {
    console.log(`Compliance Checker Agent running on port ${PORT}`);
  });
}