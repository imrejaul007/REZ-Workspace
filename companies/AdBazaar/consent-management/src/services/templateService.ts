import { ConsentTemplate, IConsentTemplate } from '../models/ConsentTemplate';
import { ConsentType, ComplianceFramework } from '../models/Consent';
import { logger } from 'utils/logger.js';

interface TemplateInput {
  name: string;
  type: ConsentType;
  framework?: ComplianceFramework;
  description: string;
  title: string;
  text: string;
  version?: string;
  isRequired?: boolean;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, any>;
}

interface TemplateUpdate {
  description?: string;
  title?: string;
  text?: string;
  version?: string;
  isRequired?: boolean;
  isActive?: boolean;
  validUntil?: Date;
  metadata?: Record<string, any>;
}

class TemplateService {
  /**
   * Create a new consent template
   */
  async createTemplate(input: TemplateInput): Promise<IConsentTemplate> {
    const framework = input.framework || ComplianceFramework.GDPR;

    logger.info('Creating consent template', { name: input.name, type: input.type, framework });

    // Check if template with same name exists
    const existing = await ConsentTemplate.findOne({ name: input.name });
    if (existing) {
      throw new Error(`Template with name '${input.name}' already exists`);
    }

    const template = await ConsentTemplate.create({
      name: input.name,
      type: input.type,
      framework,
      description: input.description,
      title: input.title,
      text: input.text,
      version: input.version || '1.0',
      isRequired: input.isRequired || false,
      isActive: input.isActive !== false,
      validFrom: input.validFrom || new Date(),
      validUntil: input.validUntil,
      metadata: input.metadata || {}
    });

    logger.info('Consent template created', { templateId: template._id });

    return template;
  }

  /**
   * Get template by ID or name
   */
  async getTemplate(identifier: string): Promise<IConsentTemplate | null> {
    return ConsentTemplate.findOne({
      $or: [{ _id: identifier }, { name: identifier }]
    });
  }

  /**
   * Get all templates for a framework
   */
  async getTemplatesByFramework(framework: ComplianceFramework, activeOnly = true): Promise<IConsentTemplate[]> {
    const filter: any = { framework };
    if (activeOnly) {
      filter.isActive = true;
      filter.$or = [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ];
    }

    return ConsentTemplate.find(filter).sort({ type: 1, name: 1 });
  }

  /**
   * Get templates by consent type
   */
  async getTemplatesByType(type: ConsentType, framework?: ComplianceFramework): Promise<IConsentTemplate[]> {
    const filter: any = { type, isActive: true };
    if (framework) {
      filter.framework = framework;
    }

    return ConsentTemplate.find(filter);
  }

  /**
   * Update a template
   */
  async updateTemplate(identifier: string, update: TemplateUpdate): Promise<IConsentTemplate | null> {
    const template = await this.getTemplate(identifier);
    if (!template) {
      return null;
    }

    if (update.description) template.description = update.description;
    if (update.title) template.title = update.title;
    if (update.text) template.text = update.text;
    if (update.version) template.version = update.version;
    if (update.isRequired !== undefined) template.isRequired = update.isRequired;
    if (update.isActive !== undefined) template.isActive = update.isActive;
    if (update.validUntil) template.validUntil = update.validUntil;
    if (update.metadata) template.metadata = { ...template.metadata, ...update.metadata };

    await template.save();

    logger.info('Consent template updated', { templateId: template._id });

    return template;
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(identifier: string): Promise<boolean> {
    const template = await this.getTemplate(identifier);
    if (!template) {
      return false;
    }

    template.isActive = false;
    await template.save();

    logger.info('Consent template deactivated', { templateId: template._id });

    return true;
  }

  /**
   * Get all active templates grouped by type
   */
  async getAllActiveTemplates(): Promise<Map<ConsentType, IConsentTemplate[]>> {
    const templates = await ConsentTemplate.find({
      isActive: true,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    });

    const grouped = new Map<ConsentType, IConsentTemplate[]>();

    for (const template of templates) {
      const existing = grouped.get(template.type) || [];
      existing.push(template);
      grouped.set(template.type, existing);
    }

    return grouped;
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<any> {
    const stats = await ConsentTemplate.aggregate([
      {
        $group: {
          _id: { type: '$type', framework: '$framework' },
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
          requiredCount: { $sum: { $cond: ['$isRequired', 1, 0] } }
        }
      },
      { $sort: { '_id.type': 1, '_id.framework': 1 } }
    ]);

    return {
      totalTemplates: stats.reduce((sum, s) => sum + s.count, 0),
      byTypeAndFramework: stats,
      generatedAt: new Date()
    };
  }

  /**
   * Validate template text
   */
  async validateTemplate(identifier: string): Promise<{ valid: boolean; issues: string[] }> {
    const template = await this.getTemplate(identifier);
    if (!template) {
      return { valid: false, issues: ['Template not found'] };
    }

    const issues: string[] = [];

    // Check required fields
    if (!template.title || template.title.trim().length === 0) {
      issues.push('Title is required');
    }

    if (!template.text || template.text.trim().length === 0) {
      issues.push('Consent text is required');
    }

    // Check text length (GDPR recommends clear and plain language)
    if (template.text && template.text.length < 50) {
      issues.push('Consent text is too short (minimum 50 characters recommended)');
    }

    // Check if template is expired
    if (template.validUntil && template.validUntil < new Date()) {
      issues.push('Template has expired');
    }

    // Check for required information (GDPR Article 7)
    const requiredInfo = [
      'controller',
      'purpose',
      'data types',
      'right to withdraw',
      'contact'
    ];

    const textLower = template.text.toLowerCase();
    for (const info of requiredInfo) {
      if (!textLower.includes(info)) {
        issues.push(`Missing required information: ${info}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Create default templates for GDPR compliance
   */
  async createDefaultTemplates(): Promise<IConsentTemplate[]> {
    const defaults = [
      {
        name: 'gdpr_marketing',
        type: ConsentType.MARKETING,
        framework: ComplianceFramework.GDPR,
        description: 'Marketing communications consent under GDPR',
        title: 'Marketing Communications',
        text: 'I consent to receive marketing communications from AdBazaar about products, services, and special offers. I understand that I can withdraw this consent at any time by contacting privacy@adbazaar.com or updating my preferences in my account settings.',
        isRequired: false
      },
      {
        name: 'gdpr_analytics',
        type: ConsentType.ANALYTICS,
        framework: ComplianceFramework.GDPR,
        description: 'Analytics and performance tracking consent under GDPR',
        title: 'Analytics & Performance',
        text: 'I consent to the collection and processing of my data for analytics and performance measurement purposes. This includes tracking my usage patterns to improve AdBazaar services.',
        isRequired: false
      },
      {
        name: 'gdpr_advertising',
        type: ConsentType.ADVERTISING,
        framework: ComplianceFramework.GDPR,
        description: 'Personalized advertising consent under GDPR',
        title: 'Personalized Advertising',
        text: 'I consent to receive personalized advertisements based on my browsing behavior, preferences, and interests. My data will be used to deliver relevant advertising.',
        isRequired: false
      },
      {
        name: 'ccpa_opt_out',
        type: ConsentType.DATA_PROCESSING,
        framework: ComplianceFramework.CCPA,
        description: 'CCPA right to opt-out notice',
        title: 'Do Not Sell My Personal Information',
        text: 'You have the right to opt-out of the sale of your personal information. AdBazaar does not sell your personal information to third parties.',
        isRequired: true
      }
    ];

    const created: IConsentTemplate[] = [];

    for (const defaultTemplate of defaults) {
      try {
        const existing = await ConsentTemplate.findOne({ name: defaultTemplate.name });
        if (!existing) {
          const template = await this.createTemplate(defaultTemplate);
          created.push(template);
        }
      } catch (error) {
        logger.warn('Failed to create default template', { name: defaultTemplate.name, error });
      }
    }

    logger.info('Default templates created', { count: created.length });

    return created;
  }
}

export const templateService = new TemplateService();