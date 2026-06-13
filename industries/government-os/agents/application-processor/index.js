/**
 * Application Processor Agent
 * Processes permit applications, validates submissions, and tracks workflows
 * Manages the complete application lifecycle from submission to decision
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
    new winston.transports.File({ filename: 'logs/application-processor.log' })
  ]
});

class ApplicationProcessorAgent {
  constructor(config = {}) {
    this.config = {
      permitTwinServiceUrl: config.permitTwinServiceUrl || process.env.PERMIT_TWIN_SERVICE_URL,
      citizenTwinServiceUrl: config.citizenTwinServiceUrl || process.env.CITIZEN_TWIN_SERVICE_URL,
      complianceTwinServiceUrl: config.complianceTwinServiceUrl || process.env.COMPLIANCE_TWIN_SERVICE_URL,
      notificationServiceUrl: config.notificationServiceUrl || process.env.NOTIFICATION_SERVICE_URL,
      documentVerificationUrl: config.documentVerificationUrl || process.env.DOCUMENT_VERIFICATION_URL,
      workflowEngineUrl: config.workflowEngineUrl || process.env.WORKFLOW_ENGINE_URL,
      httpTimeout: config.httpTimeout || 30000,
      autoApproveThreshold: config.autoApproveThreshold || 0.95,
      ...config
    };

    this.processingQueue = new Map();
    this.applicationContexts = new Map();
  }

  /**
   * Process a new application submission
   */
  async processSubmission(submission) {
    const startTime = Date.now();
    const applicationId = submission.applicationId || uuidv4();

    logger.info('Processing application submission', {
      applicationId,
      residentId: submission.residentId,
      permitId: submission.permitId
    });

    try {
      // Step 1: Validate submission
      const validation = await this.validateSubmission(submission);
      if (!validation.valid) {
        return this.handleValidationFailure(applicationId, validation);
      }

      // Step 2: Check eligibility
      const eligibility = await this.checkEligibility(submission);
      if (!eligibility.eligible) {
        return this.handleIneligibleApplication(applicationId, submission, eligibility);
      }

      // Step 3: Verify documents
      const documentVerification = await this.verifyDocuments(submission.documents);
      if (!documentVerification.allVerified) {
        return this.handleDocumentIssues(applicationId, submission, documentVerification);
      }

      // Step 4: Check compliance
      const complianceCheck = await this.checkCompliance(submission);
      if (!complianceCheck.passed) {
        return this.handleComplianceIssues(applicationId, submission, complianceCheck);
      }

      // Step 5: Submit to permit service
      const application = await this.submitApplication(submission);

      // Step 6: Check for auto-approval
      if (this.shouldAutoApprove(application, eligibility, complianceCheck)) {
        await this.autoApproveApplication(application);
      }

      // Step 7: Update citizen record
      await this.updateCitizenRecord(submission.residentId, {
        addPendingApplication: application.applicationId
      });

      // Step 8: Send notification
      await this.sendNotification(submission.residentId, {
        type: 'application_received',
        applicationId: application.applicationId,
        permitType: submission.permitType
      });

      logger.info('Application submitted successfully', {
        applicationId,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        applicationId: application.applicationId,
        status: application.status,
        currentStage: application.review.currentStage,
        estimatedProcessingTime: application.estimatedProcessingTime,
        nextSteps: this.getNextSteps(application),
        notifications: {
          confirmationSent: true,
          email: true
        }
      };
    } catch (error) {
      logger.error('Application processing failed', {
        applicationId,
        error: error.message
      });

      return {
        success: false,
        applicationId,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message
        },
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Validate application submission data
   */
  async validateSubmission(submission) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!submission.residentId) {
      errors.push({ field: 'residentId', message: 'Resident ID is required' });
    }

    if (!submission.permitId) {
      errors.push({ field: 'permitId', message: 'Permit type is required' });
    }

    // Data validation
    if (submission.data?.email && !this.isValidEmail(submission.data.email)) {
      errors.push({ field: 'data.email', message: 'Invalid email format' });
    }

    if (submission.data?.phone && !this.isValidPhone(submission.data.phone)) {
      warnings.push({ field: 'data.phone', message: 'Phone format may be invalid' });
    }

    // Business logic validation
    if (submission.data?.ssn && !this.isValidSSN(submission.data.ssn)) {
      errors.push({ field: 'data.ssn', message: 'Invalid SSN format' });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check citizen eligibility for the permit
   */
  async checkEligibility(submission) {
    const citizenProfile = await this.getCitizenProfile(submission.residentId);
    const permit = await this.getPermit(submission.permitId);

    if (!permit) {
      return {
        eligible: false,
        reason: 'Permit type not found',
        score: 0
      };
    }

    // Check eligibility rules
    const eligibility = permit.eligibility;
    const result = {
      eligible: true,
      reason: null,
      score: 100,
      issues: []
    };

    // Check citizen type
    if (!eligibility.citizenTypes.includes('all')) {
      if (!eligibility.citizenTypes.includes(citizenProfile?.profile?.citizenType)) {
        result.eligible = false;
        result.reason = 'Citizen type not eligible for this permit';
        result.issues.push('citizen_type');
      }
    }

    // Check age requirements
    if (eligibility.ageRequirements && citizenProfile?.demographics?.dateOfBirth) {
      const age = this.calculateAge(citizenProfile.demographics.dateOfBirth);
      if (eligibility.ageRequirements.min && age < eligibility.ageRequirements.min) {
        result.eligible = false;
        result.reason = `Minimum age requirement: ${eligibility.ageRequirements.min}`;
        result.issues.push('age_requirement');
      }
    }

    // Check residency
    if (eligibility.residencyRequirements?.required && !citizenProfile?.residencyVerified) {
      result.eligible = false;
      result.reason = 'Residency verification required';
      result.issues.push('residency');
    }

    // Check prerequisites
    if (eligibility.prerequisiteServices?.length > 0) {
      const currentServices = citizenProfile?.needs?.currentServices || [];
      const missing = eligibility.prerequisiteServices.filter(
        ps => !currentServices.includes(ps)
      );
      if (missing.length > 0) {
        result.score -= missing.length * 20;
        result.issues.push(`Missing prerequisites: ${missing.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * Verify submitted documents
   */
  async verifyDocuments(documents) {
    if (!documents || documents.length === 0) {
      return { allVerified: true, verified: [], pending: [], rejected: [] };
    }

    const results = {
      allVerified: true,
      verified: [],
      pending: [],
      rejected: []
    };

    for (const doc of documents) {
      try {
        const verification = await this.verifyDocument(doc);
        if (verification.status === 'verified') {
          results.verified.push({
            documentId: doc.id,
            documentType: doc.type,
            verifiedAt: new Date().toISOString()
          });
        } else if (verification.status === 'pending') {
          results.pending.push({
            documentId: doc.id,
            documentType: doc.type,
            reason: verification.reason
          });
          results.allVerified = false;
        } else {
          results.rejected.push({
            documentId: doc.id,
            documentType: doc.type,
            reason: verification.reason
          });
          results.allVerified = false;
        }
      } catch (error) {
        logger.error('Document verification failed', {
          documentId: doc.id,
          error: error.message
        });
        results.pending.push({
          documentId: doc.id,
          documentType: doc.type,
          reason: 'Verification service unavailable'
        });
      }
    }

    return results;
  }

  /**
   * Check compliance status for the applicant
   */
  async checkCompliance(submission) {
    const complianceStatus = await this.getComplianceStatus(
      submission.residentId,
      'citizen'
    );

    if (!complianceStatus) {
      return { passed: true };
    }

    const result = {
      passed: complianceStatus.overallStatus !== 'non_compliant',
      issues: [],
      warnings: []
    };

    if (complianceStatus.overdueRemediations?.length > 0) {
      result.passed = false;
      result.issues.push({
        type: 'overdue_remediation',
        count: complianceStatus.overdueRemediations.length
      });
    }

    if (complianceStatus.complianceRate < 80) {
      result.warnings.push({
        type: 'low_compliance_rate',
        rate: complianceStatus.complianceRate
      });
    }

    return result;
  }

  /**
   * Submit application to permit service
   */
  async submitApplication(submission) {
    if (!this.config.permitTwinServiceUrl) {
      throw new Error('Permit service URL not configured');
    }

    const response = await this.makeRequest(
      `${this.config.permitTwinServiceUrl}/applications`,
      {
        method: 'POST',
        body: JSON.stringify({
          residentId: submission.residentId,
          permitId: submission.permitId,
          permitType: submission.permitType,
          submissionMethod: submission.submissionMethod || 'online',
          submittedBy: submission.residentId,
          ipAddress: submission.ipAddress,
          userAgent: submission.userAgent,
          personalInfo: submission.data,
          documents: submission.documents?.map(d => ({
            id: d.id,
            type: d.type,
            name: d.name,
            url: d.url
          })),
          priority: submission.priority || 'normal'
        })
      }
    );

    return response;
  }

  /**
   * Determine if application should be auto-approved
   */
  shouldAutoApprove(application, eligibility, complianceCheck) {
    // Check if auto-approval is enabled for this permit type
    const permit = this.getPermitFromCache(application.permitId);
    if (!permit?.autoApprovalEnabled) {
      return false;
    }

    // Calculate approval score
    let score = 100;

    if (eligibility.score < 100) {
      score -= (100 - eligibility.score);
    }

    if (!complianceCheck.passed) {
      score -= 50;
    }

    // Check document verification
    if (application.documents?.verified?.length < application.documents?.total) {
      score -= 20;
    }

    return score >= this.config.autoApproveThreshold * 100;
  }

  /**
   * Auto-approve an application
   */
  async autoApproveApplication(application) {
    logger.info('Auto-approving application', { applicationId: application.applicationId });

    await this.makeRequest(
      `${this.config.permitTwinServiceUrl}/applications/${application.applicationId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({
          outcome: 'approved',
          decidedBy: 'system-auto-approval',
          reason: 'Automated approval based on eligibility and compliance verification'
        })
      }
    );

    // Issue permit
    await this.makeRequest(
      `${this.config.permitTwinServiceUrl}/applications/${application.applicationId}/issue`,
      {
        method: 'POST',
        body: JSON.stringify({
          effectiveDate: new Date().toISOString()
        })
      }
    );

    // Notify citizen
    await this.sendNotification(application.residentId, {
      type: 'application_approved',
      applicationId: application.applicationId,
      message: 'Your application has been automatically approved!'
    });
  }

  /**
   * Handle validation failure
   */
  handleValidationFailure(applicationId, validation) {
    return {
      success: false,
      applicationId,
      stage: 'validation',
      errors: validation.errors,
      warnings: validation.warnings,
      nextSteps: [
        { action: 'correct_errors', label: 'Correct the validation errors' },
        { action: 'resubmit', label: 'Resubmit the application' }
      ]
    };
  }

  /**
   * Handle ineligible application
   */
  handleIneligibleApplication(applicationId, submission, eligibility) {
    return {
      success: false,
      applicationId,
      stage: 'eligibility',
      eligible: false,
      reason: eligibility.reason,
      issues: eligibility.issues,
      alternatives: this.findAlternativePermits(submission.permitType, eligibility),
      nextSteps: [
        { action: 'review_alternatives', label: 'View alternative options' },
        { action: 'set_reminder', label: 'Set reminder for eligibility date' }
      ]
    };
  }

  /**
   * Handle document verification issues
   */
  handleDocumentIssues(applicationId, submission, documentVerification) {
    return {
      success: false,
      applicationId,
      stage: 'document_verification',
      verified: documentVerification.verified,
      pending: documentVerification.pending,
      rejected: documentVerification.rejected,
      nextSteps: [
        { action: 'upload_missing', label: 'Upload missing documents' },
        { action: 'resubmit', label: 'Resubmit for verification' }
      ]
    };
  }

  /**
   * Handle compliance issues
   */
  handleComplianceIssues(applicationId, submission, complianceCheck) {
    return {
      success: false,
      applicationId,
      stage: 'compliance_check',
      passed: false,
      issues: complianceCheck.issues,
      warnings: complianceCheck.warnings,
      nextSteps: [
        { action: 'resolve_issues', label: 'Resolve compliance issues' },
        { action: 'contact_support', label: 'Contact support for assistance' }
      ]
    };
  }

  /**
   * Find alternative permits
   */
  findAlternativePermits(originalPermitType, eligibility) {
    // In production, this would search for related permits
    return [];
  }

  /**
   * Get next steps for an application
   */
  getNextSteps(application) {
    const steps = [];

    switch (application.review.currentStage) {
      case 'submitted':
        steps.push({ action: 'await_review', label: 'Application under initial review' });
        break;
      case 'under_review':
        steps.push({ action: 'check_status', label: 'Check application status periodically' });
        steps.push({ action: 'provide_docs', label: 'Provide additional documents if requested' });
        break;
      case 'pending_decision':
        steps.push({ action: 'await_decision', label: 'Awaiting decision' });
        break;
      case 'approved':
        steps.push({ action: 'receive_permit', label: 'Permit will be issued shortly' });
        break;
    }

    return steps;
  }

  // Helper methods

  async getCitizenProfile(residentId) {
    if (!this.config.citizenTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.citizenTwinServiceUrl}/citizen-twins/${residentId}`
      );
    } catch (error) {
      logger.error('Failed to get citizen profile', { residentId, error: error.message });
      return null;
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
      logger.error('Failed to get permit', { permitId, error: error.message });
      return null;
    }
  }

  getPermitFromCache(permitId) {
    // Check cache for permit details
    return null;
  }

  async getComplianceStatus(entityId, entityType) {
    if (!this.config.complianceTwinServiceUrl) {
      return null;
    }

    try {
      return await this.makeRequest(
        `${this.config.complianceTwinServiceUrl}/compliance/${entityType}/${entityId}`
      );
    } catch (error) {
      logger.error('Failed to get compliance status', { entityId, error: error.message });
      return null;
    }
  }

  async verifyDocument(document) {
    if (!this.config.documentVerificationUrl) {
      // Simulate verification
      return { status: 'verified' };
    }

    return await this.makeRequest(
      `${this.config.documentVerificationUrl}/verify`,
      {
        method: 'POST',
        body: JSON.stringify(document)
      }
    );
  }

  async updateCitizenRecord(residentId, updates) {
    if (!this.config.citizenTwinServiceUrl) {
      return;
    }

    try {
      await this.makeRequest(
        `${this.config.citizenTwinServiceUrl}/citizen-twins/${residentId}/needs`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        }
      );
    } catch (error) {
      logger.error('Failed to update citizen record', { residentId, error: error.message });
    }
  }

  async sendNotification(residentId, notification) {
    if (!this.config.notificationServiceUrl) {
      logger.info('Notification not sent (service not configured)', { residentId, notification });
      return;
    }

    try {
      await this.makeRequest(
        `${this.config.notificationServiceUrl}/notifications`,
        {
          method: 'POST',
          body: JSON.stringify({
            residentId,
            ...notification
          })
        }
      );
    } catch (error) {
      logger.error('Failed to send notification', { residentId, error: error.message });
    }
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

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
  }

  isValidSSN(ssn) {
    return /^\d{3}-?\d{2}-?\d{4}$/.test(ssn);
  }

  isRetryableError(error) {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    return retryableCodes.includes(error.code) || error.message.includes('timeout');
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
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
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
      permitTwinService: false,
      citizenTwinService: false,
      complianceTwinService: false,
      notificationService: false
    };

    const endpoints = [
      { key: 'permitTwinService', url: this.config.permitTwinServiceUrl },
      { key: 'citizenTwinService', url: this.config.citizenTwinServiceUrl },
      { key: 'complianceTwinService', url: this.config.complianceTwinServiceUrl },
      { key: 'notificationService', url: this.config.notificationServiceUrl }
    ];

    for (const endpoint of endpoints) {
      if (endpoint.url) {
        try {
          await this.makeRequest(`${endpoint.url}/health`);
          checks[endpoint.key] = true;
        } catch (error) {
          // Service unavailable
        }
      } else {
        checks[endpoint.key] = null; // Not configured
      }
    }

    const healthy = Object.values(checks).filter(v => v === true).length >= 2;

    return {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      queueSize: this.processingQueue.size
    };
  }
}

module.exports = { ApplicationProcessorAgent };

// Run as standalone agent
if (require.main === module) {
  const agent = new ApplicationProcessorAgent({
    permitTwinServiceUrl: process.env.PERMIT_TWIN_SERVICE_URL,
    citizenTwinServiceUrl: process.env.CITIZEN_TWIN_SERVICE_URL,
    complianceTwinServiceUrl: process.env.COMPLIANCE_TWIN_SERVICE_URL,
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL
  });

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/process', async (req, res) => {
    try {
      const result = await agent.processSubmission(req.body);
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

  const PORT = process.env.PORT || 4002;
  app.listen(PORT, () => {
    console.log(`Application Processor Agent running on port ${PORT}`);
  });
}