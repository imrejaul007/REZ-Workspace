import {
  EmailTemplate,
  SMSTemplate,
  IEmailTemplateModel,
  ISMSTemplateModel,
} from '../models/Automation';
import { ChannelType, TemplateVariables } from '../types';
import { parseTemplate, generateShortId } from '../utils/helpers';
import logger from '../utils/logger';

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  createdBy?: string;
}

export interface CreateSMSTemplateInput {
  name: string;
  content: string;
  variables?: string[];
  createdBy?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface RenderedTemplate {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  content: string;
  errors: string[];
}

class TemplateService {
  /**
   * Create an email template
   */
  async createEmailTemplate(
    input: CreateEmailTemplateInput
  ): Promise<IEmailTemplateModel> {
    const template = new EmailTemplate({
      name: input.name,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      variables: input.variables || this.extractVariables(input.htmlContent),
      isActive: true,
      createdBy: input.createdBy,
    });

    await template.save();

    logger.info('Email template created', {
      templateId: template._id,
      name: template.name,
    });

    return template;
  }

  /**
   * Create an SMS template
   */
  async createSMSTemplate(
    input: CreateSMSTemplateInput
  ): Promise<ISMSTemplateModel> {
    const template = new SMSTemplate({
      name: input.name,
      content: input.content,
      variables: input.variables || this.extractVariables(input.content),
      isActive: true,
      createdBy: input.createdBy,
    });

    await template.save();

    logger.info('SMS template created', {
      templateId: template._id,
      name: template.name,
    });

    return template;
  }

  /**
   * Get email template by ID
   */
  async getEmailTemplate(id: string): Promise<IEmailTemplateModel | null> {
    return EmailTemplate.findById(id);
  }

  /**
   * Get SMS template by ID
   */
  async getSMSTemplate(id: string): Promise<ISMSTemplateModel | null> {
    return SMSTemplate.findById(id);
  }

  /**
   * Get template by channel
   */
  async getTemplate(
    id: string,
    channel: ChannelType
  ): Promise<IEmailTemplateModel | ISMSTemplateModel | null> {
    if (channel === 'email') {
      return this.getEmailTemplate(id);
    } else {
      return this.getSMSTemplate(id);
    }
  }

  /**
   * List all email templates
   */
  async listEmailTemplates(options?: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }): Promise<{
    templates: IEmailTemplateModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (!options?.includeInactive) {
      filter.isActive = true;
    }

    const [templates, total] = await Promise.all([
      EmailTemplate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailTemplate.countDocuments(filter),
    ]);

    return {
      templates,
      total,
      page,
      limit,
    };
  }

  /**
   * List all SMS templates
   */
  async listSMSTemplates(options?: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }): Promise<{
    templates: ISMSTemplateModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (!options?.includeInactive) {
      filter.isActive = true;
    }

    const [templates, total] = await Promise.all([
      SMSTemplate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SMSTemplate.countDocuments(filter),
    ]);

    return {
      templates,
      total,
      page,
      limit,
    };
  }

  /**
   * List all templates by channel
   */
  async listTemplates(
    channel?: ChannelType,
    options?: {
      page?: number;
      limit?: number;
      includeInactive?: boolean;
    }
  ): Promise<{
    emailTemplates?: { templates: IEmailTemplateModel[]; total: number };
    smsTemplates?: { templates: ISMSTemplateModel[]; total: number };
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;

    if (channel === 'email') {
      const result = await this.listEmailTemplates(options);
      return {
        emailTemplates: { templates: result.templates as IEmailTemplateModel[], total: result.total },
        page: result.page,
        limit: result.limit,
      };
    } else if (channel === 'sms') {
      const result = await this.listSMSTemplates(options);
      return {
        smsTemplates: { templates: result.templates as ISMSTemplateModel[], total: result.total },
        page: result.page,
        limit: result.limit,
      };
    } else {
      const [emailResult, smsResult] = await Promise.all([
        this.listEmailTemplates(options),
        this.listSMSTemplates(options),
      ]);

      return {
        emailTemplates: { templates: emailResult.templates as IEmailTemplateModel[], total: emailResult.total },
        smsTemplates: { templates: smsResult.templates as ISMSTemplateModel[], total: smsResult.total },
        page,
        limit,
      };
    }
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    id: string,
    updates: UpdateTemplateInput
  ): Promise<IEmailTemplateModel | null> {
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return null;
    }

    const allowedUpdates = ['name', 'subject', 'htmlContent', 'textContent', 'variables', 'isActive'];
    for (const field of allowedUpdates) {
      if (updates[field as keyof UpdateTemplateInput] !== undefined) {
        (template as Record<string, unknown>)[field] = updates[field as keyof UpdateTemplateInput];
      }
    }

    // Re-extract variables if content changed
    if (updates.htmlContent) {
      template.variables = this.extractVariables(updates.htmlContent);
    }

    await template.save();

    logger.info('Email template updated', {
      templateId: template._id,
      name: template.name,
    });

    return template;
  }

  /**
   * Update SMS template
   */
  async updateSMSTemplate(
    id: string,
    updates: UpdateTemplateInput
  ): Promise<ISMSTemplateModel | null> {
    const template = await SMSTemplate.findById(id);
    if (!template) {
      return null;
    }

    const allowedUpdates = ['name', 'content', 'variables', 'isActive'];
    for (const field of allowedUpdates) {
      if (updates[field as keyof UpdateTemplateInput] !== undefined) {
        (template as Record<string, unknown>)[field] = updates[field as keyof UpdateTemplateInput];
      }
    }

    // Re-extract variables if content changed
    if (updates.content) {
      template.variables = this.extractVariables(updates.content);
    }

    await template.save();

    logger.info('SMS template updated', {
      templateId: template._id,
      name: template.name,
    });

    return template;
  }

  /**
   * Delete email template (soft delete by deactivating)
   */
  async deleteEmailTemplate(id: string): Promise<boolean> {
    const result = await EmailTemplate.findByIdAndUpdate(id, { isActive: false });
    if (!result) {
      return false;
    }

    logger.info('Email template deactivated', { templateId: id });
    return true;
  }

  /**
   * Delete SMS template (soft delete by deactivating)
   */
  async deleteSMSTemplate(id: string): Promise<boolean> {
    const result = await SMSTemplate.findByIdAndUpdate(id, { isActive: false });
    if (!result) {
      return false;
    }

    logger.info('SMS template deactivated', { templateId: id });
    return true;
  }

  /**
   * Duplicate email template
   */
  async duplicateEmailTemplate(id: string, newName?: string): Promise<IEmailTemplateModel | null> {
    const original = await EmailTemplate.findById(id);
    if (!original) {
      return null;
    }

    const duplicate = new EmailTemplate({
      name: newName || `${original.name} (Copy)`,
      subject: original.subject,
      htmlContent: original.htmlContent,
      textContent: original.textContent,
      variables: original.variables,
      isActive: true,
      createdBy: original.get('createdBy'),
    });

    await duplicate.save();

    logger.info('Email template duplicated', {
      originalId: id,
      newId: duplicate._id,
      name: duplicate.name,
    });

    return duplicate;
  }

  /**
   * Duplicate SMS template
   */
  async duplicateSMSTemplate(id: string, newName?: string): Promise<ISMSTemplateModel | null> {
    const original = await SMSTemplate.findById(id);
    if (!original) {
      return null;
    }

    const duplicate = new SMSTemplate({
      name: newName || `${original.name} (Copy)`,
      content: original.content,
      variables: original.variables,
      isActive: true,
      createdBy: original.get('createdBy'),
    });

    await duplicate.save();

    logger.info('SMS template duplicated', {
      originalId: id,
      newId: duplicate._id,
      name: duplicate.name,
    });

    return duplicate;
  }

  /**
   * Render email template with variables
   */
  async renderEmailTemplate(
    id: string,
    variables: TemplateVariables
  ): Promise<RenderedTemplate> {
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return {
        content: '',
        errors: ['Template not found'],
      };
    }

    const errors: string[] = [];

    // Check for missing variables
    const missingVariables: string[] = [];
    if (template.variables) {
      for (const variable of template.variables) {
        if (variables[variable] === undefined) {
          missingVariables.push(variable);
        }
      }
    }

    if (missingVariables.length > 0) {
      errors.push(`Missing variables: ${missingVariables.join(', ')}`);
    }

    return {
      subject: parseTemplate(template.subject, variables),
      htmlContent: parseTemplate(template.htmlContent, variables),
      textContent: template.textContent
        ? parseTemplate(template.textContent, variables)
        : undefined,
      content: parseTemplate(template.htmlContent, variables),
      errors,
    };
  }

  /**
   * Render SMS template with variables
   */
  async renderSMSTemplate(
    id: string,
    variables: TemplateVariables
  ): Promise<RenderedTemplate> {
    const template = await SMSTemplate.findById(id);
    if (!template) {
      return {
        content: '',
        errors: ['Template not found'],
      };
    }

    const errors: string[] = [];

    // Check for missing variables
    const missingVariables: string[] = [];
    if (template.variables) {
      for (const variable of template.variables) {
        if (variables[variable] === undefined) {
          missingVariables.push(variable);
        }
      }
    }

    if (missingVariables.length > 0) {
      errors.push(`Missing variables: ${missingVariables.join(', ')}`);
    }

    return {
      content: parseTemplate(template.content, variables),
      errors,
    };
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Preview template with sample data
   */
  async previewEmailTemplate(id: string): Promise<{
    subject: string;
    htmlContent: string;
    textContent?: string;
  } | null> {
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return null;
    }

    // Generate sample data
    const sampleData: TemplateVariables = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Inc',
      date: new Date().toLocaleDateString(),
    };

    return {
      subject: parseTemplate(template.subject, sampleData),
      htmlContent: parseTemplate(template.htmlContent, sampleData),
      textContent: template.textContent
        ? parseTemplate(template.textContent, sampleData)
        : undefined,
    };
  }

  /**
   * Preview SMS template with sample data
   */
  async previewSMSTemplate(id: string): Promise<{
    content: string;
  } | null> {
    const template = await SMSTemplate.findById(id);
    if (!template) {
      return null;
    }

    // Generate sample data
    const sampleData: TemplateVariables = {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Inc',
    };

    return {
      content: parseTemplate(template.content, sampleData),
    };
  }

  /**
   * Validate template variables
   */
  validateVariables(
    content: string,
    providedVariables: string[]
  ): { valid: boolean; missing: string[]; unused: string[] } {
    const templateVariables = this.extractVariables(content);

    const missing = templateVariables.filter(
      (v) => !providedVariables.includes(v)
    );
    const unused = providedVariables.filter(
      (v) => !templateVariables.includes(v)
    );

    return {
      valid: missing.length === 0,
      missing,
      unused,
    };
  }

  /**
   * Search templates by name
   */
  async searchTemplates(
    query: string,
    channel?: ChannelType
  ): Promise<{
    emailTemplates: IEmailTemplateModel[];
    smsTemplates: ISMSTemplateModel[];
  }> {
    const regex = new RegExp(query, 'i');

    const [emailTemplates, smsTemplates] = await Promise.all([
      channel !== 'sms'
        ? EmailTemplate.find({ name: regex, isActive: true })
            .select('_id name subject')
            .lean()
        : Promise.resolve([]),
      channel !== 'email'
        ? SMSTemplate.find({ name: regex, isActive: true })
            .select('_id name content')
            .lean()
        : Promise.resolve([]),
    ]);

    return {
      emailTemplates: emailTemplates as IEmailTemplateModel[],
      smsTemplates: smsTemplates as ISMSTemplateModel[],
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
export default templateService;
