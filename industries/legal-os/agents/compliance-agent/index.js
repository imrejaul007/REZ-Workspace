const { Agent } = require('../../../core/agent-base');
const logger = require('../../../utils/logger');

class ComplianceAgent extends Agent {
  constructor(options) {
    super(options);
    this.regulations = this.loadRegulations();
  }

  loadRegulations() {
    return {
      federal: [
        { code: 'SOX', name: 'Sarbanes-Oxley Act', requirements: ['financial_disclosure', 'internal_controls'] },
        { code: 'HIPAA', name: 'Health Insurance Portability Act', requirements: ['privacy', 'security'] },
        { code: 'GDPR', name: 'General Data Protection Regulation', requirements: ['data_protection', 'consent'] },
        { code: 'AML', name: 'Anti-Money Laundering', requirements: ['kyc', 'reporting'] }
      ],
      state: [
        { code: 'BADC', name: 'Business Association Disclosure', requirements: ['beneficial_ownership'] },
        { code: 'UETA', name: 'Uniform Electronic Transactions Act', requirements: ['electronic_signatures'] }
      ]
    };
  }

  async onMessage(message, reply) {
    try {
      const { action, entityType, data } = message;

      switch (action) {
        case 'check_compliance':
          return await this.checkCompliance(entityType, data, reply);
        case 'generate_report':
          return await this.generateComplianceReport(data, reply);
        case 'identify_requirements':
          return await this.identifyRequirements(entityType, data, reply);
        case 'track_deadlines':
          return await this.trackDeadlines(data, reply);
        default:
          return reply({ error: 'Unknown action' });
      }
    } catch (error) {
      logger.error('ComplianceAgent error:', error);
      return reply({ error: error.message });
    }
  }

  async checkCompliance(entityType, data, reply) {
    const results = {
      entityType,
      entityId: data.entityId,
      timestamp: new Date(),
      checks: [],
      overallStatus: 'compliant',
      issues: []
    };

    // Simulate compliance checks
    const checks = [
      { name: 'Entity Registration', status: 'pass', details: 'Entity is registered and in good standing' },
      { name: 'Annual Filings', status: 'pass', details: 'All annual reports filed on time' },
      { name: 'Registered Agent', status: 'pass', details: 'Registered agent on file' },
      { name: 'Beneficial Ownership', status: data.beneficialOwners ? 'pass' : 'warning', details: 'Review beneficial ownership disclosure' },
      { name: 'Good Standing Certificate', status: 'pass', details: 'Certificate valid until next renewal' }
    ];

    results.checks = checks;
    results.overallStatus = checks.every(c => c.status === 'pass') ? 'compliant' : 'needs_review';
    results.issues = checks.filter(c => c.status !== 'pass').map(c => c.name);

    logger.info(`Compliance check completed for ${entityType}: ${results.overallStatus}`);
    return reply(results);
  }

  async generateComplianceReport(data, reply) {
    const report = {
      id: `CR-${Date.now()}`,
      title: 'Annual Compliance Report',
      entity: data.entity,
      period: data.period || '2024',
      sections: {
        executiveSummary: {
          status: 'compliant',
          overallScore: 94,
          keyFindings: [
            'All regulatory filings completed on time',
            'No material violations identified',
            'Internal controls operating effectively'
          ]
        },
        regulatoryCompliance: {
          score: 96,
          regulations: this.regulations.federal.map(r => ({
            code: r.code,
            name: r.name,
            status: 'compliant',
            lastReview: new Date()
          }))
        },
        riskAssessment: {
          score: 92,
          risks: [
            { category: 'operational', level: 'low', mitigation: 'Policies in place' },
            { category: 'financial', level: 'low', mitigation: 'SOX controls effective' },
            { category: 'legal', level: 'medium', mitigation: 'Ongoing monitoring' }
          ]
        },
        recommendations: [
          'Update privacy policy to reflect GDPR changes',
          'Schedule annual board compliance training',
          'Review and update incident response procedures'
        ]
      },
      generatedAt: new Date(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };

    return reply(report);
  }

  async identifyRequirements(entityType, data, reply) {
    const requirements = {
      entityType,
      jurisdiction: data.jurisdiction || 'federal',
      requirements: [],
      deadlines: [],
      estimatedCost: 0
    };

    // Map entity types to requirements
    const entityRequirements = {
      corporation: ['annual_report', 'beneficial_ownership', 'registered_agent', 'board_meetings'],
      llc: ['annual_report', 'operating_agreement', 'registered_agent'],
      partnership: ['annual_report', 'partnership_agreement', 'k1_filing'],
      nonprofit: ['annual_report', 'irs_990', 'state_registration', 'governance_standards']
    };

    const applicableReqs = entityRequirements[entityType] || [];

    applicableReqs.forEach(req => {
      requirements.requirements.push({
        code: req,
        name: this.formatRequirementName(req),
        frequency: this.getFrequency(req),
        dueDate: this.calculateDueDate(req),
        estimatedCost: this.estimateCost(req)
      });
      requirements.estimatedCost += this.estimateCost(req);
    });

    // Add federal regulations
    this.regulations.federal.forEach(reg => {
      requirements.requirements.push({
        code: reg.code,
        name: reg.name,
        frequency: 'ongoing',
        dueDate: null,
        estimatedCost: 0
      });
    });

    return reply(requirements);
  }

  formatRequirementName(code) {
    return code.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getFrequency(req) {
    const frequencies = {
      annual_report: 'annual',
      beneficial_ownership: 'annual',
      registered_agent: 'annual',
      board_meetings: 'quarterly',
      irs_990: 'annual',
      k1_filing: 'annual'
    };
    return frequencies[req] || 'as_needed';
  }

  calculateDueDate(req) {
    const deadlines = {
      annual_report: new Date(new Date().getFullYear(), 11, 31),
      irs_990: new Date(new Date().getFullYear(), 4, 15),
      k1_filing: new Date(new Date().getFullYear(), 2, 15)
    };
    return deadlines[req] || null;
  }

  estimateCost(req) {
    const costs = {
      annual_report: 50,
      beneficial_ownership: 0,
      registered_agent: 100,
      irs_990: 500
    };
    return costs[req] || 0;
  }

  async trackDeadlines(data, reply) {
    const deadlines = {
      upcoming: [],
      overdue: [],
      completed: []
    };

    // Simulate deadline tracking
    const trackedDeadlines = [
      { id: 'dl_001', name: 'Annual Report Filing', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'upcoming' },
      { id: 'dl_002', name: 'IRS 990 Filing', dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), status: 'upcoming' },
      { id: 'dl_003', name: 'Beneficial Ownership Update', dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), status: 'upcoming' }
    ];

    trackedDeadlines.forEach(d => {
      if (d.status === 'upcoming') deadlines.upcoming.push(d);
      else if (d.status === 'overdue') deadlines.overdue.push(d);
      else deadlines.completed.push(d);
    });

    return reply(deadlines);
  }
}

module.exports = ComplianceAgent;
