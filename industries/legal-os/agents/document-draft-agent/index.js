const { Agent } = require('../../../core/agent-base');
const { DocumentTwin } = require('../../services/document-twin-service/models');
const logger = require('../../../utils/logger');

class DocumentDraftAgent extends Agent {
  constructor(options) {
    super(options);
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    return {
      contract: {
        name: 'Service Agreement',
        sections: ['parties', 'services', 'compensation', 'term', 'termination', 'confidentiality', 'indemnification', 'governing_law']
      },
      brief: {
        name: 'Legal Brief',
        sections: ['caption', 'table_of_authorities', 'statement_of_issue', 'statement_of_facts', 'argument', 'conclusion', 'prayer_for_relief']
      },
      motion: {
        name: 'Court Motion',
        sections: ['caption', 'introduction', 'statement_of_facts', 'legal_standard', 'argument', 'conclusion', 'signature_block']
      },
      pleading: {
        name: 'Pleading',
        sections: ['caption', 'parties', 'jurisdiction', 'factual_allegations', 'causes_of_action', 'prayer_for_relief']
      },
      correspondence: {
        name: 'Legal Correspondence',
        sections: ['header', 'date', 'addressee', 'subject', 'body', 'closing', 'signature']
      }
    };
  }

  async onMessage(message, reply) {
    try {
      const { action, template, data, caseId } = message;

      switch (action) {
        case 'generate_document':
          return await this.generateDocument(template, data, caseId, reply);
        case 'review_document':
          return await this.reviewDocument(message.documentId, reply);
        case 'compare_versions':
          return await this.compareVersions(message.v1, message.v2, reply);
        case 'suggest_revisions':
          return await this.suggestRevisions(message.documentId, message.feedback, reply);
        default:
          return reply({ error: 'Unknown action' });
      }
    } catch (error) {
      logger.error('DocumentDraftAgent error:', error);
      return reply({ error: error.message });
    }
  }

  async generateDocument(template, data, caseId, reply) {
    const templateConfig = this.templates[template];

    if (!templateConfig) {
      return reply({ error: `Unknown template: ${template}` });
    }

    const document = {
      id: `doc_${Date.now()}`,
      type: template,
      title: data.title || `${templateConfig.name} - ${new Date().toLocaleDateString()}`,
      caseId,
      content: {
        sections: templateConfig.sections.map(section => ({
          name: section,
          content: this.generateSectionContent(section, data)
        }))
      },
      metadata: {
        generatedAt: new Date(),
        template: templateConfig.name,
        version: 1,
        confidence: 0.88
      },
      placeholders: this.identifyPlaceholders(templateConfig.sections, data)
    };

    logger.info(`Document generated: ${document.id}`);
    return reply(document);
  }

  generateSectionContent(section, data) {
    const sectionTemplates = {
      parties: `This Agreement is entered into by and between ${data.parties?.party1 || '[PARTY 1]'} and ${data.parties?.party2 || '[PARTY 2]'}.`,
      services: `The services to be provided include: ${data.services || '[DESCRIBE SERVICES]'}.`,
      compensation: `Compensation shall be ${data.compensation || '[DESCRIBE COMPENSATION]'} as detailed in Exhibit A.`,
      term: `This Agreement shall commence on ${data.startDate || '[START DATE]'} and continue until ${data.endDate || '[END DATE]'}.`,
      termination: `Either party may terminate this Agreement with ${data.terminationNotice || '30'} days written notice.`,
      confidentiality: `All Confidential Information shall be protected and not disclosed to third parties.`,
      indemnification: `Each party shall indemnify and hold harmless the other from claims arising from their negligence.`,
      governing_law: `This Agreement shall be governed by the laws of ${data.jurisdiction || '[JURISDICTION]'}.`,
      caption: `IN THE ${data.court || '[COURT NAME]'}\n${data.caseNumber || '[CASE NUMBER]'}`,
      statement_of_facts: data.facts || '[STATEMENT OF FACTS]',
      argument: data.argument || '[LEGAL ARGUMENT]',
      conclusion: data.conclusion || '[CONCLUSION]'
    };

    return sectionTemplates[section] || `[${section.toUpperCase()}]`;
  }

  identifyPlaceholders(sections, data) {
    const placeholders = [];
    sections.forEach(section => {
      if (!data[section]) {
        placeholders.push(section);
      }
    });
    return placeholders;
  }

  async reviewDocument(documentId, reply) {
    const document = await DocumentTwin.findById(documentId);

    if (!document) {
      return reply({ error: 'Document not found' });
    }

    const review = {
      documentId,
      title: document.title,
      review: {
        completeness: this.assessCompleteness(document),
        clarity: this.assessClarity(document),
        compliance: this.assessCompliance(document),
        risks: this.identifyRisks(document)
      },
      suggestions: [],
      overallScore: 0
    };

    // Generate suggestions
    if (review.review.completeness < 80) {
      review.suggestions.push('Document may be missing required sections');
    }
    if (review.review.clarity < 70) {
      review.suggestions.push('Consider simplifying complex sentences');
    }
    if (review.review.risks.length > 0) {
      review.suggestions.push('Review flagged sections for potential legal risks');
    }

    review.overallScore = (review.review.completeness + review.review.clarity + review.review.compliance) / 3;

    return reply(review);
  }

  assessCompleteness(document) {
    return 85; // Simulated score
  }

  assessClarity(document) {
    return 78; // Simulated score
  }

  assessCompliance(document) {
    return 92; // Simulated score
  }

  identifyRisks(document) {
    return [
      { section: 'indemnification', risk: 'broad', severity: 'medium' },
      { section: 'termination', risk: 'unilateral', severity: 'low' }
    ];
  }

  async compareVersions(v1, v2, reply) {
    return reply({
      v1,
      v2,
      changes: [
        { type: 'modified', section: 'compensation', oldText: '...', newText: '...' },
        { type: 'added', section: 'confidentiality' }
      ],
      summary: '2 modifications, 1 addition'
    });
  }

  async suggestRevisions(documentId, feedback, reply) {
    return reply({
      documentId,
      revisions: [
        { section: 'term', current: '...', suggested: '...' },
        { section: 'termination', current: '...', suggested: '...' }
      ],
      rationale: 'Based on feedback and legal best practices'
    });
  }
}

module.exports = DocumentDraftAgent;
